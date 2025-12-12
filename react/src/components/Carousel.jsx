import React, { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Autoplay } from 'swiper/modules';
import SplitView from './SplitView'; // Import the new component
import Handsfree from 'handsfree'; // Import Handsfree.js

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import './Carousel.css';

export default function Carousel({ documents = [] }) {
    const [expandedSlide, setExpandedSlide] = useState(null);
    const [selectedSplitSlide, setSelectedSplitSlide] = useState(null); // State for SplitView
    const [favorites, setFavorites] = useState([]); // Track favorited slides as array
    const [hoveredSlide, setHoveredSlide] = useState(null); // Track which slide ID is being hovered
    const [favoritesLoaded, setFavoritesLoaded] = useState(false); // Track if favorites are loaded
    const [handsfreeEnabled, setHandsfreeEnabled] = useState(false); // Track handsfree mode
    const [handsfree, setHandsfree] = useState(null); // Store handsfree instance
    const swiperRef = useRef(null); // Reference to Swiper instance

    const API_BASE_URL = 'http://localhost:8000/api';

    // Load favorites from backend on mount
    useEffect(() => {
        const loadFavorites = async () => {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) {
                console.log('[Carousel] No token found, skipping favorites load');
                setFavoritesLoaded(true);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/config`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.favorites && Array.isArray(data.favorites)) {
                        console.log('[Carousel] Loaded favorites:', data.favorites);
                        setFavorites(data.favorites);
                    }
                    // Load handsfree mode setting
                    if (data.config && typeof data.config.handsfree_mode === 'boolean') {
                        console.log('[Carousel] Loaded handsfree mode:', data.config.handsfree_mode);
                        setHandsfreeEnabled(data.config.handsfree_mode);
                    }
                } else if (response.status === 401) {
                    console.log('[Carousel] Token expired, clearing auth');
                    localStorage.removeItem('zeendoc_token');
                    localStorage.removeItem('zeendoc_username');
                }
            } catch (error) {
                console.error('[Carousel] Error loading favorites:', error);
            } finally {
                setFavoritesLoaded(true);
            }
        };

        loadFavorites();
    }, []);

    // Save favorites to backend whenever they change (after initial load)
    useEffect(() => {
        if (!favoritesLoaded) return; // Don't save during initial load

        const saveFavorites = async () => {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) {
                console.log('[Carousel] No token, cannot save favorites');
                return;
            }

            try {
                // Send only favorites to backend (config is now optional)
                console.log('[Carousel] Saving favorites:', favorites);
                const response = await fetch(`${API_BASE_URL}/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        favorites: favorites
                    })
                });

                if (response.ok) {
                    console.log('[Carousel] Favorites saved successfully');
                } else {
                    const errorData = await response.json();
                    console.error('[Carousel] Failed to save favorites:', response.status, errorData);
                    if (response.status === 401) {
                        console.log('[Carousel] Token expired');
                        localStorage.removeItem('zeendoc_token');
                        localStorage.removeItem('zeendoc_username');
                    }
                }
            } catch (error) {
                console.error('[Carousel] Error saving favorites:', error);
            }
        };

        // Debounce save to avoid too many requests
        const timeoutId = setTimeout(saveFavorites, 500);
        return () => clearTimeout(timeoutId);
    }, [favorites, favoritesLoaded]);

    // Listen for login events to reload favorites
    useEffect(() => {
        const handleLogin = () => {
            console.log('[Carousel] User logged in, reloading favorites');
            setFavoritesLoaded(false); // Trigger reload
        };

        const handleLogout = () => {
            console.log('[Carousel] User logged out, clearing favorites');
            setFavorites([]);
        };

        window.addEventListener('user-logged-in', handleLogin);
        window.addEventListener('user-logged-out', handleLogout);

        return () => {
            window.removeEventListener('user-logged-in', handleLogin);
            window.removeEventListener('user-logged-out', handleLogout);
        };
    }, []);

    // Initialize and manage Handsfree.js
    useEffect(() => {
        if (handsfreeEnabled && !handsfree) {
            console.log('[Carousel] Initializing Handsfree.js');
            try {
                const hf = new Handsfree({
                    showDebug: false,
                    hands: {
                        enabled: true,
                        maxNumHands: 1
                    }
                });

                // Define custom gestures for navigation with debouncing
                let lastGestureTime = 0;
                const gestureDebounce = 800; // 0.8 seconds between gestures (less strict)
                let lastHandX = 0.5; // Track previous position
                let movementHistory = []; // Track movement over time
                const historySize = 5; // Number of frames to track
                
                console.log('='.repeat(60));
                console.log('🖐️ HANDSFREE GESTURE CONTROLS INITIALIZED');
                console.log('='.repeat(60));
                console.log('📋 ACCEPTED MOVEMENTS (ENHANCED):');
                console.log('  👉 SWIPE RIGHT: Move your hand to the RIGHT');
                console.log('     → Hand position X > 0.55 (55% from left) - MORE SENSITIVE');
                console.log('     → OR sustained rightward movement detected');
                console.log('     → Action: Go to NEXT slide');
                console.log('');
                console.log('  👈 SWIPE LEFT: Move your hand to the LEFT');
                console.log('     → Hand position X < 0.45 (45% from left) - MORE SENSITIVE');
                console.log('     → OR sustained leftward movement detected');
                console.log('     → Action: Go to PREVIOUS slide');
                console.log('');
                console.log('  🖐️ HAND TRACKING: Uses wrist + index + middle finger average');
                console.log('  🎯 MOVEMENT DETECTION: Tracks momentum over 5 frames');
                console.log('  ⏱️ COOLDOWN: 0.8 seconds between gestures');
                console.log('='.repeat(60));
                
                hf.use('carousel-navigation', {
                    onFrame: ({ hands }) => {
                        if (!hands.landmarks || !swiperRef.current) return;

                        const hand = hands.landmarks[0];
                        if (!hand) return;

                        // Get wrist and middle finger tip positions for better swipe detection
                        const wrist = hand[0]; // Wrist landmark
                        const indexTip = hand[8]; // Index finger tip
                        const middleTip = hand[12]; // Middle finger tip
                        
                        // Safety check: ensure all landmarks exist
                        if (!wrist || !indexTip || !middleTip) {
                            console.warn('[Handsfree] Missing landmarks, skipping frame');
                            return;
                        }
                        
                        const now = Date.now();
                        
                        // Calculate hand position (average of key points)
                        const handX = (wrist.x + indexTip.x + middleTip.x) / 3;
                        
                        // Track movement history
                        const movement = handX - lastHandX;
                        movementHistory.push(movement);
                        if (movementHistory.length > historySize) {
                            movementHistory.shift();
                        }
                        
                        // Calculate average movement (momentum)
                        const avgMovement = movementHistory.reduce((sum, m) => sum + m, 0) / movementHistory.length;
                        const isMovingRight = avgMovement > 0.005; // Sustained rightward movement
                        const isMovingLeft = avgMovement < -0.005; // Sustained leftward movement
                        
                        // Log hand position and movement
                        const arrow = movement > 0.002 ? '→→' : movement < -0.002 ? '←←' : '•';
                        console.log(`[Handsfree] X: ${handX.toFixed(3)} | Move: ${arrow} ${Math.abs(movement).toFixed(4)} | Momentum: ${avgMovement.toFixed(4)}`);
                        
                        // Enhanced right swipe detection (position-based OR momentum-based)
                        const rightCondition = (handX > 0.55) || (isMovingRight && handX > 0.50);
                        if (rightCondition && now - lastGestureTime > gestureDebounce) {
                            console.log('');
                            console.log('🎯 ═════════════════════════════════════');
                            console.log('✅ RIGHT MOVEMENT DETECTED!');
                            console.log(`   Hand Position: ${handX.toFixed(3)} (threshold: 0.55)`);
                            console.log(`   Movement: ${movement.toFixed(4)} | Momentum: ${avgMovement.toFixed(4)}`);
                            console.log(`   Direction: ${isMovingRight ? 'RIGHT →→' : 'STATIONARY'}`);
                            console.log('   Action: 👉 Moving to NEXT slide');
                            console.log('═════════════════════════════════════');
                            console.log('');
                            swiperRef.current.slideNext();
                            lastGestureTime = now;
                            movementHistory = []; // Reset after gesture
                        }
                        // Enhanced left swipe detection (position-based OR momentum-based)
                        const leftCondition = (handX < 0.45) || (isMovingLeft && handX < 0.50);
                        if (leftCondition && now - lastGestureTime > gestureDebounce) {
                            console.log('');
                            console.log('🎯 ═════════════════════════════════════');
                            console.log('✅ LEFT MOVEMENT DETECTED!');
                            console.log(`   Hand Position: ${handX.toFixed(3)} (threshold: 0.45)`);
                            console.log(`   Movement: ${movement.toFixed(4)} | Momentum: ${avgMovement.toFixed(4)}`);
                            console.log(`   Direction: ${isMovingLeft ? 'LEFT ←←' : 'STATIONARY'}`);
                            console.log('   Action: 👈 Moving to PREVIOUS slide');
                            console.log('═════════════════════════════════════');
                            console.log('');
                            swiperRef.current.slidePrev();
                            lastGestureTime = now;
                            movementHistory = []; // Reset after gesture
                        }
                        
                        lastHandX = handX;
                    }
                });

                hf.start();
                setHandsfree(hf);
                console.log('[Carousel] Handsfree.js started successfully');
            } catch (error) {
                console.error('[Carousel] Error initializing Handsfree.js:', error);
            }
        } else if (!handsfreeEnabled && handsfree) {
            console.log('[Carousel] Stopping Handsfree.js');
            handsfree.stop();
            setHandsfree(null);
        }

        return () => {
            if (handsfree) {
                console.log('[Carousel] Cleaning up Handsfree.js');
                handsfree.stop();
            }
        };
    }, [handsfreeEnabled]);

    // Listen for handsfree state changes from Header toggle
    useEffect(() => {
        const handleHandsfreeStateChange = (event) => {
            const enabled = event.detail?.enabled || false;
            console.log('[Carousel] Handsfree state changed:', enabled);
            setHandsfreeEnabled(enabled);
        };

        // Check initial state from localStorage
        const savedState = localStorage.getItem('handsfree_navigation_enabled');
        if (savedState === 'true') {
            setHandsfreeEnabled(true);
        }

        window.addEventListener('handsfree-state-changed', handleHandsfreeStateChange);

        return () => {
            window.removeEventListener('handsfree-state-changed', handleHandsfreeStateChange);
        };
    }, []);

    // Fallback slides if no documents are provided
    const slides = documents.length > 0 ? documents : [
        {
            id: 'default',
            preview: '<p>No documents available</p>',
            title: 'NO DOCUMENTS',
            subtitle: 'Add documents to output_2',
            tag: 'Empty',
            summary: 'No documents found'
        }
    ];

    const toggleExpand = (e, index) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedSlide(expandedSlide === index ? null : index);
    };

    const handleSlideClick = (e, slide) => {
        // Only trigger if not clicking buttons or expand
        if (e.target.closest('.expand-btn') || e.target.closest('.action-btn')) {
            return;
        }
        e.preventDefault();
        setSelectedSplitSlide(slide);
    };

    const handleFavorite = (e, slideId) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Star clicked for slide:', slideId);
        setFavorites(prev => {
            const newFavorites = prev.includes(slideId)
                ? prev.filter(id => id !== slideId)
                : [...prev, slideId];
            
            console.log(prev.includes(slideId) ? 'Removing from favorites:' : 'Adding to favorites:', slideId);
            
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('favorites-updated', {
                detail: { favorites: newFavorites }
            }));
            
            return newFavorites;
        });
    };

    const handleExport = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Export clicked');
        // Logic to export would go here
        alert('Export du document en cours...');
    };

    return (
        <section className="carousel-section">
            {selectedSplitSlide && (
                <SplitView
                    document={selectedSplitSlide}
                    onClose={() => setSelectedSplitSlide(null)}
                />
            )}

            {/* Handsfree mode indicator */}
            {handsfreeEnabled && (
                <div style={{
                    position: 'absolute',
                    top: '140px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(76, 175, 80, 0.9)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                    </svg>
                    Mode mains libres actif
                </div>
            )}

            <div className="carousel-container" style={{ opacity: selectedSplitSlide ? 0 : 1, transition: 'opacity 0.5s' }}>
                <Swiper
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={'auto'}
                    loop={true}
                    coverflowEffect={{
                        rotate: 0,
                        stretch: 0,
                        depth: 200,
                        modifier: 1,
                        slideShadows: true,
                    }}
                    navigation={true}
                    modules={[EffectCoverflow, Navigation]}
                    className="mySwiper"
                    initialSlide={2}
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                        console.log('[Carousel] Swiper instance captured');
                    }}
                >
                    {slides.map((slide, index) => (
                        <SwiperSlide key={index}>
                            <div 
                                className="slide-content" 
                                onClick={(e) => handleSlideClick(e, slide)}
                                onMouseEnter={() => setHoveredSlide(slide.id)}
                                onMouseLeave={() => setHoveredSlide(null)}
                            >
                                <div className="slide-preview" dangerouslySetInnerHTML={{ __html: slide.preview }}></div>
                                <div className={`slide-overlay ${expandedSlide === index ? 'expanded' : ''}`}>
                                    {(hoveredSlide === slide.id || favorites.includes(slide.id)) && (
                                        <div className="slide-actions">
                                        <button className="action-btn export-btn" onClick={handleExport} title="Exporter">
                                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                        </button>

                                        <button className="action-btn star-btn" onClick={(e) => handleFavorite(e, slide.id)} title="Ajouter aux favoris">
                                            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                            </svg>
                                        </button>
                                        </div>
                                    )}

                                    <div className="slide-text">
                                        <h2>{slide.title}</h2>
                                        <h3>{slide.subtitle}</h3>
                                        <div className="slide-divider"></div>
                                        <p className="slide-summary">{expandedSlide === index ? slide.summary : slide.summary.substring(0, 100) + '...'}</p>
                                        <button
                                            className="expand-btn"
                                            onClick={(e) => toggleExpand(e, index)}
                                            aria-label="Afficher plus"
                                        >
                                            <svg className={expandedSlide === index ? 'rotated' : ''} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 9L12 15L18 9" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
            <div className="carousel-bg-overlay"></div>
        </section>
    );
}
