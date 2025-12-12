import React, { useState, useEffect } from 'react';
import Carousel from './Carousel.jsx';
import DocumentExplorer from './DocumentExplorer.jsx';
import './ViewSwitcher.css';

// Icon components using inline SVG
const BookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const GridIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const ListIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

export default function ViewSwitcher({ documents = [], searchQuery = '', onSearchChange }) {
    const [viewMode, setViewMode] = useState('carousel'); // 'carousel', 'grid', 'list'
    const [searchQueryState, setSearchQueryState] = useState('');
    const [animationKey, setAnimationKey] = useState(0);
    const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'favorites'
    const [favorites, setFavorites] = useState([]); // Track user's favorites

    const API_BASE_URL = 'http://localhost:8000/api';

    // Load favorites from backend
    useEffect(() => {
        const loadFavorites = async () => {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) {
                console.log('[ViewSwitcher] No token, clearing favorites');
                setFavorites([]);
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
                        console.log('[ViewSwitcher] Loaded favorites from backend:', data.favorites);
                        setFavorites(data.favorites);
                    } else {
                        setFavorites([]);
                    }
                } else if (response.status === 404) {
                    console.log('[ViewSwitcher] No saved favorites found');
                    setFavorites([]);
                }
            } catch (error) {
                console.error('[ViewSwitcher] Error loading favorites:', error);
            }
        };

        loadFavorites();

        // Listen for favorite changes from Carousel
        const handleFavoritesUpdate = (e) => {
            if (e.detail && e.detail.favorites) {
                console.log('[ViewSwitcher] Favorites updated:', e.detail.favorites);
                setFavorites(e.detail.favorites);
            }
        };

        // Listen for login/logout events
        const handleUserLogin = () => {
            console.log('[ViewSwitcher] User logged in, reloading favorites');
            loadFavorites();
        };

        const handleUserLogout = () => {
            console.log('[ViewSwitcher] User logged out, clearing favorites');
            setFavorites([]);
        };

        window.addEventListener('favorites-updated', handleFavoritesUpdate);
        window.addEventListener('user-logged-in', handleUserLogin);
        window.addEventListener('user-logged-out', handleUserLogout);

        return () => {
            window.removeEventListener('favorites-updated', handleFavoritesUpdate);
            window.removeEventListener('user-logged-in', handleUserLogin);
            window.removeEventListener('user-logged-out', handleUserLogout);
        };
    }, []);

    // Listen for voice menu commands from header
    useEffect(() => {
        const handleVoiceCommand = (e) => {
            const result = e.detail;
            console.log('[ViewSwitcher] Voice command received:', result);
            
            if (!result.success) return;
            
            if (result.action === 'sort') {
                // Handle sort command
                if (result.sort_by) {
                    console.log('[ViewSwitcher] Sorting by:', result.sort_by);
                    setSortBy(result.sort_by);
                }
            } else if (result.action === 'search') {
                // Handle search command
                if (result.search_query) {
                    console.log('[ViewSwitcher] Searching for:', result.search_query);
                    setSearchQueryState(result.search_query);
                }
                
                // If specific document found, could open it directly
                if (result.document_id) {
                    console.log('[ViewSwitcher] Opening document:', result.document_id);
                    const doc = documents.find(d => d.id === result.document_id);
                    if (doc) {
                        // Dispatch event to open document
                        window.dispatchEvent(new CustomEvent('open-document', {
                            detail: { document: doc }
                        }));
                    }
                }
            }
        };
        
        window.addEventListener('voice-menu-command', handleVoiceCommand);
        return () => window.removeEventListener('voice-menu-command', handleVoiceCommand);
    }, [documents]);

    // Listen for search events from header
    useEffect(() => {
        const handleSearch = (e) => {
            setSearchQueryState(e.detail.query);
        };
        
        window.addEventListener('document-search', handleSearch);
        return () => window.removeEventListener('document-search', handleSearch);
    }, []);

    // Filter documents based on search query
    let filteredDocuments = searchQueryState
        ? documents.filter(doc => 
            doc.title?.toLowerCase().includes(searchQueryState.toLowerCase()) ||
            doc.subtitle?.toLowerCase().includes(searchQueryState.toLowerCase()) ||
            doc.tag?.toLowerCase().includes(searchQueryState.toLowerCase())
        )
        : documents;

    // Filter by favorites if "Favorites" sort is selected
    if (sortBy === 'favorites') {
        filteredDocuments = filteredDocuments.filter(doc => favorites.includes(doc.id));
    }

    // Sort filtered documents
    const sortedDocuments = [...filteredDocuments].sort((a, b) => {
        if (sortBy === 'name') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'date') {
            return a.subtitle.localeCompare(b.subtitle);
        } else if (sortBy === 'favorites') {
            // Already filtered, just sort by name
            return a.title.localeCompare(b.title);
        }
        return 0;
    });

    // Trigger animation when filtered documents count changes
    useEffect(() => {
        setAnimationKey(prev => prev + 1);
    }, [sortedDocuments.length]);

    return (
        <div className="view-switcher-wrapper">
            {/* View Mode Toggle - positioned under header, top right */}
            <div className="view-mode-controls">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    title="Vue grille"
                >
                    <GridIcon />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                    title="Vue liste"
                >
                    <ListIcon />
                </button>
                <button
                    onClick={() => setViewMode('carousel')}
                    className={`view-mode-btn ${viewMode === 'carousel' ? 'active' : ''}`}
                    title="Vue carrousel"
                >
                    <BookIcon />
                </button>
            </div>

            {/* Sort Controls - visible in all views */}
            <div className="sort-controls">
                <label htmlFor="sort-select">Trier par :</label>
                <select 
                    id="sort-select"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                >
                    <option value="name">Nom</option>
                    <option value="date">Date</option>
                    <option value="favorites">Favoris</option>
                </select>
            </div>

            {/* Render the appropriate view */}
            {viewMode === 'carousel' ? (
                <div className="view-content-wrapper">
                    <Carousel key={animationKey} documents={sortedDocuments} />
                </div>
            ) : (
                <div className="view-content-wrapper">
                    <div className="document-explorer-view">
                        <DocumentExplorer 
                            documents={sortedDocuments}
                            viewMode={viewMode}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
