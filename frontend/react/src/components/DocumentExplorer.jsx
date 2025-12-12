import React, { useState, useEffect } from 'react';
import SplitView from './SplitView';
import './DocumentExplorer.css';

export default function DocumentExplorer({ documents = [], viewMode = 'grid' }) {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [favorites, setFavorites] = useState([]); // Track favorites
    const [selectedSplitDoc, setSelectedSplitDoc] = useState(null); // For SplitView modal
    
    const API_BASE_URL = 'http://localhost:8000/api';

    // Save favorites to backend
    const saveFavorites = async (newFavorites) => {
        const token = localStorage.getItem('zeendoc_token');
        if (!token) {
            console.log('[DocumentExplorer] No token, cannot save favorites');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ favorites: newFavorites })
            });

            if (response.ok) {
                console.log('[DocumentExplorer] Favorites saved successfully');
                // Dispatch event to sync with other components
                window.dispatchEvent(new CustomEvent('favorites-updated', {
                    detail: { favorites: newFavorites }
                }));
            }
        } catch (error) {
            console.error('[DocumentExplorer] Error saving favorites:', error);
        }
    };

    // Toggle favorite
    const handleFavorite = (e, docId) => {
        e.stopPropagation();
        setFavorites(prev => {
            const newFavorites = prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId];
            
            // Save to backend
            saveFavorites(newFavorites);
            return newFavorites;
        });
    };

    // Load favorites from backend
    useEffect(() => {
        const loadFavorites = async () => {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) return;

            try {
                const response = await fetch(`${API_BASE_URL}/config`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.favorites && Array.isArray(data.favorites)) {
                        setFavorites(data.favorites);
                    }
                }
            } catch (error) {
                console.error('[DocumentExplorer] Error loading favorites:', error);
            }
        };

        loadFavorites();

        // Listen for favorite changes
        const handleFavoritesUpdate = (e) => {
            if (e.detail && e.detail.favorites) {
                setFavorites(e.detail.favorites);
            }
        };

        window.addEventListener('favorites-updated', handleFavoritesUpdate);
        return () => window.removeEventListener('favorites-updated', handleFavoritesUpdate);
    }, []);
    
    // Configuration state
    const [config, setConfig] = useState({
        espace_mot: 0,
        espace_lettre: 0,
        font: 'Arial',
        interligne: 1,
        alignement_texte: 'gauche',
        longueur_liseuse: 100,
        theme: {
            couleur_fond: '#FFFFFF',
            couleur_texte: '#000000',
            couleur_surlignage: '#FFFF00'
        },
        dyslexie: {
            alternement_typo: false,
            soulignement_syllabes: false,
            phonemes: {
                an: { couleur: '#FF0000', actif: false },
                on: { couleur: '#00CC00', actif: false },
                in: { couleur: '#0066FF', actif: false },
                ou: { couleur: '#FF6600', actif: false },
                oi: { couleur: '#CC00FF', actif: false },
                eu: { couleur: '#00CCCC', actif: false },
                ai: { couleur: '#FFB300', actif: false },
                ui: { couleur: '#FF0099', actif: false },
                gn: { couleur: '#006633', actif: false },
                ill: { couleur: '#9933FF', actif: false },
                eau: { couleur: '#FF3333', actif: false },
                au: { couleur: '#3399FF', actif: false },
                en: { couleur: '#FFCC00', actif: false }
            },
            lettres_muettes: false
        },
        semantique: {
            nom_propre: false,
            date_chiffre: false,
            mot_long: false
        },
        mode_p_p: false,
        barre_progression: false,
        focus_paragraphe: false,
        regle_lecture: false,
        ligne_focus: false,
        daltonien: 'Aucun'
    });

    // Apply daltonism filter
    useEffect(() => {
        console.log('[DocumentExplorer] Applying daltonism filter:', config.daltonien);
        
        // Check if document.body is available (SSR safety)
        if (typeof document === 'undefined' || !document.body) {
            console.log('[DocumentExplorer] Document body not available yet');
            return;
        }
        
        const body = document.body;
        body.classList.remove('daltonism-protanopia', 'daltonism-deuteranopia', 'daltonism-tritanopia', 'daltonism-monochromatism');
        
        if (config.daltonien !== 'Aucun') {
            const filterMap = {
                'Protanopie': 'protanopia',
                'Deutéranopie': 'deuteranopia',
                'Tritanopie': 'tritanopia',
                'Monochromatisme': 'monochromatism'
            };
            const filterClass = filterMap[config.daltonien];
            if (filterClass) {
                body.classList.add(`daltonism-${filterClass}`);
                console.log('[DocumentExplorer] Applied class:', `daltonism-${filterClass}`);
            }
        }
    }, [config.daltonien]);

    // Handle configuration change
    const handleConfigChange = (path, value) => {
        console.log('[DocumentExplorer] Config change:', path, '=', value);
        setConfig(prev => {
            const newConfig = { ...prev };
            const keys = path.split('.');
            let current = newConfig;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            
            console.log('[DocumentExplorer] New config state:', JSON.stringify(newConfig, null, 2));
            return newConfig;
        });
    };

    // Validate and send configuration to backend
    const validateConfiguration = async () => {
        console.log('[DocumentExplorer] Validating configuration...');
        console.log('[DocumentExplorer] Current config:', JSON.stringify(config, null, 2));
        
        // Get token from localStorage
        const token = localStorage.getItem('zeendoc_token');
        
        if (!token) {
            console.error('[DocumentExplorer] ✗ No authentication token found');
            alert('Veuillez vous connecter pour sauvegarder la configuration');
            return;
        }
        
        try {
            // Replace with your actual FastAPI endpoint
            const apiUrl = 'http://localhost:8000/api/config';
            console.log('[DocumentExplorer] Sending to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ config: config })
            });
            
            console.log('[DocumentExplorer] Response status:', response.status);
            const data = await response.json();
            console.log('[DocumentExplorer] Response data:', data);
            
            if (response.ok) {
                console.log('[DocumentExplorer] ✓ Configuration validated successfully');
                alert('Configuration validée avec succès!');
            } else {
                console.error('[DocumentExplorer] ✗ Validation failed:', data);
                if (response.status === 401) {
                    alert('Session expirée. Veuillez vous reconnecter.');
                    localStorage.removeItem('zeendoc_token');
                    localStorage.removeItem('zeendoc_username');
                } else {
                    alert('Erreur lors de la validation: ' + (data.detail || data.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('[DocumentExplorer] ✗ Error validating configuration:', error);
            alert('Erreur de connexion au serveur: ' + error.message);
        }
    };

    // Documents are already filtered and sorted by ViewSwitcher
    const filteredDocs = documents;

    return (
        <>
            {/* SplitView Modal */}
            {selectedSplitDoc && (
                <SplitView
                    document={selectedSplitDoc}
                    onClose={() => setSelectedSplitDoc(null)}
                />
            )}

            <div className="document-explorer">
            {/* SVG Filters for Daltonism */}
            <svg style={{width: 0, height: 0, position: 'absolute', visibility: 'hidden'}}>
                <defs>
                    <filter id="protanopia">
                        <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0
                                                             0.558, 0.442, 0, 0, 0
                                                             0, 0.242, 0.758, 0, 0
                                                             0, 0, 0, 1, 0" />
                    </filter>
                    <filter id="deuteranopia">
                        <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0
                                                             0.7, 0.3, 0, 0, 0
                                                             0, 0.3, 0.7, 0, 0
                                                             0, 0, 0, 1, 0" />
                    </filter>
                    <filter id="tritanopia">
                        <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0
                                                             0, 0.433, 0.567, 0, 0
                                                             0, 0.475, 0.525, 0, 0
                                                             0, 0, 0, 1, 0" />
                    </filter>
                </defs>
            </svg>

            {/* Content Area */}
            <div className="de-content">
                {/* Document List/Grid */}
                <div className={`de-list ${viewMode === 'list' ? 'de-list-view' : 'de-grid-view'}`}>
                    {filteredDocs.length === 0 ? (
                        <div className="de-empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <p>No documents found</p>
                        </div>
                    ) : (
                        filteredDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className={`de-item ${selectedDoc?.id === doc.id ? 'de-item-selected' : ''}`}
                                onClick={() => setSelectedSplitDoc(doc)}
                            >
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="de-item-preview" dangerouslySetInnerHTML={{ __html: doc.preview }}></div>
                                        <div className="de-item-info">
                                            <div className="de-item-header">
                                                <h3 className="de-item-title">{doc.title}</h3>
                                                <button 
                                                    className="de-favorite-btn"
                                                    onClick={(e) => handleFavorite(e, doc.id)}
                                                    title={favorites.includes(doc.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(doc.id) ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth="2">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="de-item-subtitle">{doc.subtitle}</p>
                                            <span className="de-item-tag">{doc.tag}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="de-item-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                <polyline points="13 2 13 9 20 9"></polyline>
                                            </svg>
                                        </div>
                                        <div className="de-item-details">
                                            <div className="de-item-header">
                                                <h3 className="de-item-title">{doc.title}</h3>
                                                <button 
                                                    className="de-favorite-btn"
                                                    onClick={(e) => handleFavorite(e, doc.id)}
                                                    title={favorites.includes(doc.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(doc.id) ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth="2">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="de-item-meta">
                                                <span className="de-item-tag">{doc.tag}</span>
                                                <span className="de-item-separator">•</span>
                                                <span className="de-item-subtitle">{doc.subtitle}</span>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Preview Panel */}
                {selectedDoc && (
                    <div className="de-preview">
                        <div className="de-preview-header">
                            <h3>{selectedDoc.title}</h3>
                            <button 
                                className="de-preview-close"
                                onClick={() => setSelectedDoc(null)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="de-preview-meta">
                            <span className="de-preview-tag">{selectedDoc.tag}</span>
                            <span className="de-preview-date">{selectedDoc.subtitle}</span>
                        </div>
                        <div className="de-preview-content" dangerouslySetInnerHTML={{ __html: selectedDoc.preview }}></div>
                        <div className="de-preview-summary">
                            <h4>Summary</h4>
                            <p>{selectedDoc.summary}</p>
                        </div>
                        
                        {/* Validate Configuration Button */}
                        <button 
                            className="validate-config-btn"
                            onClick={validateConfiguration}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Valider la configuration
                        </button>
                    </div>
                )}

                {/* Modern Configuration Panel */}
                {showConfig && (
                    <div className="config-panel">
                        <div className="config-header">
                            <h3>Accessibilité</h3>
                            <button 
                                className="config-close"
                                onClick={() => setShowConfig(false)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="config-content">
                            {/* Daltonism Section */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16v-4m0-4h.01"></path>
                                    </svg>
                                    <h4>Daltonisme</h4>
                                </div>
                                <p className="config-description">Correction des couleurs pour les différents types de daltonisme</p>
                                <select 
                                    className="config-select"
                                    value={config.daltonien}
                                    onChange={(e) => handleConfigChange('daltonien', e.target.value)}
                                >
                                    <option value="Aucun">Aucune correction</option>
                                    <option value="Protanopie">Protanopie (Rouge)</option>
                                    <option value="Deutéranopie">Deutéranopie (Vert)</option>
                                    <option value="Tritanopie">Tritanopie (Bleu)</option>
                                    <option value="Monochromatisme">Monochromatisme</option>
                                </select>
                            </div>

                            {/* Font Section */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                        <line x1="9" y1="20" x2="15" y2="20"></line>
                                        <line x1="12" y1="4" x2="12" y2="20"></line>
                                    </svg>
                                    <h4>Police</h4>
                                </div>
                                <select 
                                    className="config-select"
                                    value={config.font}
                                    onChange={(e) => handleConfigChange('font', e.target.value)}
                                >
                                    <option value="Arial">Arial</option>
                                    <option value="OpenDyslexic">OpenDyslexic</option>
                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                    <option value="Verdana">Verdana</option>
                                </select>
                            </div>

                            {/* Spacing Section */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                    <h4>Espacement</h4>
                                </div>
                                <div className="config-slider-group">
                                    <label>
                                        Espace entre mots: <span className="slider-value">{config.espace_mot}px</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="20" 
                                            value={config.espace_mot}
                                            onChange={(e) => handleConfigChange('espace_mot', parseInt(e.target.value))}
                                            className="config-slider"
                                        />
                                    </label>
                                    <label>
                                        Espace entre lettres: <span className="slider-value">{config.espace_lettre}px</span>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="10" 
                                            value={config.espace_lettre}
                                            onChange={(e) => handleConfigChange('espace_lettre', parseInt(e.target.value))}
                                            className="config-slider"
                                        />
                                    </label>
                                    <label>
                                        Interligne: <span className="slider-value">{config.interligne}</span>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="3" 
                                            step="0.1"
                                            value={config.interligne}
                                            onChange={(e) => handleConfigChange('interligne', parseFloat(e.target.value))}
                                            className="config-slider"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Theme Section */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="5"></circle>
                                        <line x1="12" y1="1" x2="12" y2="3"></line>
                                        <line x1="12" y1="21" x2="12" y2="23"></line>
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                        <line x1="1" y1="12" x2="3" y2="12"></line>
                                        <line x1="21" y1="12" x2="23" y2="12"></line>
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                    </svg>
                                    <h4>Thème</h4>
                                </div>
                                <div className="config-color-group">
                                    <label>
                                        Fond
                                        <input 
                                            type="color" 
                                            value={config.theme.couleur_fond}
                                            onChange={(e) => handleConfigChange('theme.couleur_fond', e.target.value)}
                                            className="config-color"
                                        />
                                    </label>
                                    <label>
                                        Texte
                                        <input 
                                            type="color" 
                                            value={config.theme.couleur_texte}
                                            onChange={(e) => handleConfigChange('theme.couleur_texte', e.target.value)}
                                            className="config-color"
                                        />
                                    </label>
                                    <label>
                                        Surlignage
                                        <input 
                                            type="color" 
                                            value={config.theme.couleur_surlignage}
                                            onChange={(e) => handleConfigChange('theme.couleur_surlignage', e.target.value)}
                                            className="config-color"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Dyslexia Features */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    </svg>
                                    <h4>Dyslexie</h4>
                                </div>
                                <div className="config-toggle-group">
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.dyslexie.alternement_typo}
                                            onChange={(e) => handleConfigChange('dyslexie.alternement_typo', e.target.checked)}
                                        />
                                        <span>Alternance typographique</span>
                                    </label>
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.dyslexie.soulignement_syllabes}
                                            onChange={(e) => handleConfigChange('dyslexie.soulignement_syllabes', e.target.checked)}
                                        />
                                        <span>Soulignement des syllabes</span>
                                    </label>
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.dyslexie.lettres_muettes}
                                            onChange={(e) => handleConfigChange('dyslexie.lettres_muettes', e.target.checked)}
                                        />
                                        <span>Lettres muettes</span>
                                    </label>
                                </div>
                            </div>

                            {/* Reading Aids */}
                            <div className="config-section">
                                <div className="config-section-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                    </svg>
                                    <h4>Aides à la lecture</h4>
                                </div>
                                <div className="config-toggle-group">
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.regle_lecture}
                                            onChange={(e) => handleConfigChange('regle_lecture', e.target.checked)}
                                        />
                                        <span>Règle de lecture</span>
                                    </label>
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.ligne_focus}
                                            onChange={(e) => handleConfigChange('ligne_focus', e.target.checked)}
                                        />
                                        <span>Focus ligne</span>
                                    </label>
                                    <label className="config-toggle">
                                        <input 
                                            type="checkbox" 
                                            checked={config.focus_paragraphe}
                                            onChange={(e) => handleConfigChange('focus_paragraphe', e.target.checked)}
                                        />
                                        <span>Focus paragraphe</span>
                                    </label>
                                </div>
                            </div>

                            {/* Validate Button */}
                            <button 
                                className="config-validate-btn"
                                onClick={validateConfiguration}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Valider et envoyer au serveur
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
