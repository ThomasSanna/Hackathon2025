import React, { useState, useEffect } from 'react';
import './SplitView.css';

export default function SplitView({ document, onClose }) {
    // Complete configuration state matching DocumentExplorer
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

    // Load saved configuration from backend on mount
    useEffect(() => {
        const loadSavedConfig = async () => {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) {
                console.log('[SplitView] No token found, using default config');
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/config', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.config) {
                        console.log('[SplitView] Loaded saved configuration:', data.config);
                        setConfig(data.config);
                    }
                } else if (response.status === 404) {
                    console.log('[SplitView] No saved configuration found, using defaults');
                } else if (response.status === 401) {
                    console.log('[SplitView] Invalid token, clearing auth');
                    localStorage.removeItem('zeendoc_token');
                    localStorage.removeItem('zeendoc_username');
                }
            } catch (error) {
                console.error('[SplitView] Error loading config:', error);
            }
        };

        loadSavedConfig();

        // Listen for login events to reload configuration
        const handleUserLogin = () => {
            console.log('[SplitView] User logged in, loading configuration...');
            loadSavedConfig();
        };

        window.addEventListener('user-logged-in', handleUserLogin);

        return () => {
            window.removeEventListener('user-logged-in', handleUserLogin);
        };
    }, []);

    // Apply daltonism filter
    useEffect(() => {
        console.log('[SplitView] Applying daltonism filter:', config.daltonien);
        
        // Check if document.body is available (SSR safety)
        if (typeof document === 'undefined' || !document.body) {
            console.log('[SplitView] Document body not available yet');
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
                console.log('[SplitView] Applied class:', `daltonism-${filterClass}`);
            }
        }
    }, [config.daltonien]);

    // Handle configuration change
    const handleConfigChange = (path, value) => {
        console.log('[SplitView] Config change:', path, '=', value);
        setConfig(prev => {
            const newConfig = { ...prev };
            const keys = path.split('.');
            let current = newConfig;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            
            console.log('[SplitView] New config state:', JSON.stringify(newConfig, null, 2));
            return newConfig;
        });
    };

    // Validate and send configuration to backend
    const validateConfiguration = async () => {
        console.log('[SplitView] Validating configuration...');
        console.log('[SplitView] Current config:', JSON.stringify(config, null, 2));
        
        // Get token from localStorage
        const token = localStorage.getItem('zeendoc_token');
        
        if (!token) {
            console.error('[SplitView] ✗ No authentication token found');
            alert('Veuillez vous connecter pour sauvegarder la configuration');
            return;
        }
        
        try {
            const apiUrl = 'http://localhost:8000/api/config';
            console.log('[SplitView] Sending to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ config: config })
            });
            
            console.log('[SplitView] Response status:', response.status);
            const data = await response.json();
            console.log('[SplitView] Response data:', data);
            
            if (response.ok) {
                console.log('[SplitView] ✓ Configuration validated successfully');
                alert('Configuration validée avec succès!');
            } else {
                console.error('[SplitView] ✗ Validation failed:', data);
                if (response.status === 401) {
                    alert('Session expirée. Veuillez vous reconnecter.');
                    localStorage.removeItem('zeendoc_token');
                    localStorage.removeItem('zeendoc_username');
                } else {
                    alert('Erreur lors de la validation: ' + (data.detail || data.message || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('[SplitView] ✗ Error validating configuration:', error);
            alert('Erreur de connexion au serveur: ' + error.message);
        }
    };

    return (
        <div className="split-view-overlay">
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

            <button className="global-close-btn" onClick={onClose} aria-label="Close View">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <main className="split-content">
                <div className="single-version-preview">
                    <div className="version-card selected">
                        <div className="version-preview">
                            <div className="slide-preview" dangerouslySetInnerHTML={{ __html: document.preview }} />
                        </div>
                    </div>
                </div>
            </main>

            <aside className="split-sidebar">
                <div className="sidebar-header">
                    <h2>Accessibilité</h2>
                    <p>Configuration avancée</p>
                </div>

                <div className="config-scroll-content">
                    {/* Daltonism Section */}
                    <div className="config-section">
                        <div className="config-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4m0-4h.01"></path>
                            </svg>
                            <h3>Daltonisme</h3>
                        </div>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                <line x1="9" y1="20" x2="15" y2="20"></line>
                                <line x1="12" y1="4" x2="12" y2="20"></line>
                            </svg>
                            <h3>Police</h3>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                            <h3>Espacement</h3>
                        </div>
                        <div className="config-slider-group">
                            <label>
                                Mots: <span className="slider-value">{config.espace_mot}px</span>
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
                                Lettres: <span className="slider-value">{config.espace_lettre}px</span>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                            </svg>
                            <h3>Thème</h3>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                            <h3>Dyslexie</h3>
                        </div>
                        <div className="config-toggle-group">
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.dyslexie.alternement_typo}
                                    onChange={(e) => handleConfigChange('dyslexie.alternement_typo', e.target.checked)}
                                />
                                <span>Alternance typo</span>
                            </label>
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.dyslexie.soulignement_syllabes}
                                    onChange={(e) => handleConfigChange('dyslexie.soulignement_syllabes', e.target.checked)}
                                />
                                <span>Soulignement syllabes</span>
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

                    {/* Semantic Features */}
                    <div className="config-section">
                        <div className="config-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <h3>Sémantique</h3>
                        </div>
                        <div className="config-toggle-group">
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.semantique.nom_propre}
                                    onChange={(e) => handleConfigChange('semantique.nom_propre', e.target.checked)}
                                />
                                <span>Noms propres</span>
                            </label>
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.semantique.date_chiffre}
                                    onChange={(e) => handleConfigChange('semantique.date_chiffre', e.target.checked)}
                                />
                                <span>Dates & chiffres</span>
                            </label>
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.semantique.mot_long}
                                    onChange={(e) => handleConfigChange('semantique.mot_long', e.target.checked)}
                                />
                                <span>Mots longs</span>
                            </label>
                        </div>
                    </div>

                    {/* Reading Aids */}
                    <div className="config-section">
                        <div className="config-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                            <h3>Aides lecture</h3>
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
                            <label className="config-toggle">
                                <input 
                                    type="checkbox" 
                                    checked={config.barre_progression}
                                    onChange={(e) => handleConfigChange('barre_progression', e.target.checked)}
                                />
                                <span>Barre progression</span>
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
                        Valider et envoyer
                    </button>
                </div>
            </aside>
        </div>
    );
}
