import React, { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Autoplay } from 'swiper/modules';
import SplitView from './SplitView'; // Import the new component

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
        alert('Exporting document...');
    };

    return (
        <section className="carousel-section">
            {selectedSplitSlide && (
                <SplitView
                    document={selectedSplitSlide}
                    onClose={() => setSelectedSplitSlide(null)}
                />
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
                                        <button className="action-btn export-btn" onClick={handleExport} title="Export">
                                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                        </button>

                                        <button className={`action-btn star-btn ${favorites.includes(slide.id) ? 'favorited' : ''}`} onClick={(e) => handleFavorite(e, slide.id)} title={favorites.includes(slide.id) ? 'Remove from Favorites' : 'Add to Favorites'}>
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
                                            aria-label="Show more"
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
