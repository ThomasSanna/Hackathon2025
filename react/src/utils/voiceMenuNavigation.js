/**
 * Voice Menu Navigation Utility
 * Handles voice commands for sorting and searching documents
 */

class VoiceMenuNavigation {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.API_BASE_URL = 'http://localhost:8000/api';
        this.onResultCallback = null;
        this.onStatusCallback = null;
        
        this.initSpeechRecognition();
    }

    /**
     * Initialize Web Speech API
     */
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('[VoiceMenu] Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'fr-FR'; // French
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log('[VoiceMenu] Started listening');
            this.isListening = true;
            if (this.onStatusCallback) {
                this.onStatusCallback('listening');
            }
        };

        this.recognition.onend = () => {
            console.log('[VoiceMenu] Stopped listening');
            this.isListening = false;
            if (this.onStatusCallback) {
                this.onStatusCallback('idle');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('[VoiceMenu] Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onStatusCallback) {
                this.onStatusCallback('error', event.error);
            }
        };

        this.recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('[VoiceMenu] Recognized:', transcript);
            
            if (this.onStatusCallback) {
                this.onStatusCallback('processing', transcript);
            }

            // Process the command
            await this.processCommand(transcript);
        };
    }

    /**
     * Start listening for voice commands
     */
    startListening() {
        if (!this.recognition) {
            console.error('[VoiceMenu] Speech recognition not initialized');
            return;
        }

        if (this.isListening) {
            console.log('[VoiceMenu] Already listening');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('[VoiceMenu] Error starting recognition:', error);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Process voice command via backend API
     */
    async processCommand(command, documents = null) {
        try {
            const token = localStorage.getItem('zeendoc_token');
            if (!token) {
                console.error('[VoiceMenu] No authentication token');
                if (this.onResultCallback) {
                    this.onResultCallback({
                        success: false,
                        message: 'Veuillez vous connecter pour utiliser les commandes vocales'
                    });
                }
                return;
            }

            const response = await fetch(`${this.API_BASE_URL}/voice/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    command: command,
                    documents: documents
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('[VoiceMenu] Command result:', result);

            if (this.onResultCallback) {
                this.onResultCallback(result);
            }

            return result;

        } catch (error) {
            console.error('[VoiceMenu] Error processing command:', error);
            if (this.onResultCallback) {
                this.onResultCallback({
                    success: false,
                    message: `Erreur: ${error.message}`
                });
            }
        }
    }

    /**
     * Set callback for command results
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * Set callback for status updates
     */
    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    /**
     * Check if browser supports speech recognition
     */
    static isSupported() {
        return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    }
}

export default VoiceMenuNavigation;
