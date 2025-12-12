import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePersonnalisationStore } from "@src/stores/personnalisationStore";
import "./VoiceCommand.css";

interface VoiceCommandResponse {
  success: boolean;
  message: string;
  config: any;
}

export default function VoiceCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = "fr-FR";
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Erreur de reconnaissance vocale:", event.error);
        setFeedback(`Erreur: ${event.error}`);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Fonction pour démarrer/arrêter l'écoute
  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
      setFeedback("Écoute en cours...");
    }
  };

  // Convertir le store Zustand en format attendu par le backend
  const storeToBackendConfig = () => {
    // Utiliser getState() pour avoir les valeurs actuelles
    const state = usePersonnalisationStore.getState();
    return {
      espace_mot: state.espace_mot,
      espace_lettre: state.espace_lettre,
      font: state.font,
      interligne: state.interligne,
      alignement_texte: state.alignement_texte,
      longueur_liseuse: state.longueur_liseuse,
      taille_texte: state.taille_texte,
      theme: state.theme,
      theme_mode: state.theme_mode,
      dyslexie: state.dyslexie,
      segmentation_syllabique: state.segmentation_syllabique,
      phonemes_actifs: state.phonemes_actifs,
      semantique: state.semantique,
      mode_p_p: state.mode_p_p,
      barre_progression: state.barre_progression,
      focus_paragraphe: state.focus_paragraphe,
      regle_lecture: state.regle_lecture,
      ligne_focus: state.ligne_focus,
      daltonien: state.daltonien,
    };
  };

  // Appliquer la config reçue du backend au store
  const applyConfigToStore = (config: any) => {
    console.log("🔄 Application de la config reçue:", config);
    
    // Récupérer le state actuel et les setters
    const store = usePersonnalisationStore.getState();
    
    // Typographie
    if (config.espace_mot !== undefined) store.setEspaceMot(config.espace_mot);
    if (config.espace_lettre !== undefined) store.setEspaceLettre(config.espace_lettre);
    if (config.font !== undefined) store.setFont(config.font);
    if (config.interligne !== undefined) store.setInterligne(config.interligne);
    if (config.alignement_texte !== undefined) store.setAlignementTexte(config.alignement_texte);
    if (config.longueur_liseuse !== undefined) store.setLongueurLiseuse(config.longueur_liseuse);
    if (config.taille_texte !== undefined) store.setTailleTexte(config.taille_texte);

    // Thème - IMPORTANT: appliquer le theme_mode pour déclencher le changement complet
    if (config.theme_mode !== undefined) {
      console.log("🎨 Changement de theme_mode vers:", config.theme_mode);
      // Valider que le theme_mode est valide
      const validModes = ["light", "sepia", "dark", "contrast", "oled"];
      if (validModes.includes(config.theme_mode)) {
        store.setThemeMode(config.theme_mode);
      } else {
        console.warn("⚠️ theme_mode invalide:", config.theme_mode);
      }
    }
    
    // Thème - Couleurs individuelles (appliquées après theme_mode ou seules)
    if (config.theme) {
      if (config.theme.couleur_fond) store.setThemeCouleurFond(config.theme.couleur_fond);
      if (config.theme.couleur_texte) store.setThemeCouleurTexte(config.theme.couleur_texte);
      if (config.theme.couleur_surlignage) store.setThemeCouleurSurlignage(config.theme.couleur_surlignage);
    }

    // Dyslexie
    if (config.segmentation_syllabique !== undefined) store.setSegmentationSyllabique(config.segmentation_syllabique);
    if (config.phonemes_actifs !== undefined) store.setPhonemesActifs(config.phonemes_actifs);
    
    if (config.dyslexie) {
      if (config.dyslexie.alternement_typo !== undefined) store.setAlternementTypo(config.dyslexie.alternement_typo);
      if (config.dyslexie.soulignement_syllabes !== undefined) store.setSoulignementSyllabes(config.dyslexie.soulignement_syllabes);
      if (config.dyslexie.lettres_muettes !== undefined) store.setLettresMuettes(config.dyslexie.lettres_muettes);

      // Phonèmes
      if (config.dyslexie.phonemes) {
        const currentPhonemes = store.dyslexie.phonemes;
        Object.entries(config.dyslexie.phonemes).forEach(([key, phoneme]: [string, any]) => {
          if (phoneme.actif !== undefined) {
            const currentPhoneme = currentPhonemes[key];
            if (currentPhoneme && currentPhoneme.actif !== phoneme.actif) {
              store.togglePhoneme(key);
            }
          }
          if (phoneme.couleur !== undefined) {
            store.setPhonemeColor(key, phoneme.couleur);
          }
        });
      }
    }

    // Sémantique
    if (config.semantique) {
      if (config.semantique.nom_propre !== undefined) store.setNomPropre(config.semantique.nom_propre);
      if (config.semantique.date_chiffre !== undefined) store.setDateChiffre(config.semantique.date_chiffre);
      if (config.semantique.mot_long !== undefined) store.setMotLong(config.semantique.mot_long);
    }

    // Modes et outils
    if (config.mode_p_p !== undefined) store.setModePP(config.mode_p_p);
    if (config.barre_progression !== undefined) store.setBarreProgression(config.barre_progression);
    if (config.focus_paragraphe !== undefined) store.setFocusParagraphe(config.focus_paragraphe);
    if (config.regle_lecture !== undefined) store.setRegleLecture(config.regle_lecture);
    if (config.ligne_focus !== undefined) store.setLigneFocus(config.ligne_focus);

    // Accessibilité
    if (config.daltonien !== undefined) store.setDaltonien(config.daltonien);
    
    console.log("✅ Config appliquée avec succès");
  };

  // Envoyer la commande au backend
  const handleSubmit = async () => {
    if (!command.trim()) {
      setFeedback("Veuillez entrer une commande");
      return;
    }

    setIsProcessing(true);
    setFeedback("Traitement en cours...");

    try {
      const currentConfig = storeToBackendConfig();
      console.log("📤 Envoi de la config:", currentConfig);

      const response = await fetch("http://localhost:8000/api/voice-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: command,
          config: currentConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data: VoiceCommandResponse = await response.json();
      console.log("📥 Réponse reçue:", data);

      if (data.success) {
        // Appliquer la nouvelle configuration au store
        applyConfigToStore(data.config);
        setFeedback(`✓ ${data.message}`);
        setCommand("");
        
        // Fermer automatiquement après 2 secondes
        setTimeout(() => {
          setIsOpen(false);
          setFeedback("");
        }, 2000);
      } else {
        setFeedback(`Erreur: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Erreur lors de l'envoi de la commande:", error);
      setFeedback(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Gérer la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir le panneau */}
      <button
        className="voice-command-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Commande vocale"
        aria-label="Ouvrir la commande vocale"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      </button>

      {/* Panneau de commande */}
      {isOpen && createPortal(
        <div className="voice-command-panel">
          <div className="voice-command-header">
            <h3>Commande Vocale</h3>
            <button
              className="voice-command-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="voice-command-content">
            {/* Zone de texte */}
            <div className="voice-command-input-group">
              <textarea
                className="voice-command-input"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dites ou écrivez votre commande...
Ex: Active le mode sombre, Police Arial, etc."
                rows={3}
                disabled={isProcessing}
              />

              <div className="voice-command-buttons">
                {/* Bouton micro */}
                <button
                  className={`voice-command-btn voice-command-mic ${
                    isListening ? "listening" : ""
                  } ${!recognition ? "disabled" : ""}`}
                  onClick={recognition ? toggleListening : undefined}
                  disabled={isProcessing || !recognition}
                  title={
                    !recognition
                      ? "Reconnaissance vocale non supportée par ce navigateur"
                      : isListening
                      ? "Arrêter l'écoute"
                      : "Démarrer l'écoute vocale"
                  }
                >
                  {isListening ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" x2="12" y1="19" y2="22"></line>
                    </svg>
                  )}
                </button>

                {/* Bouton envoyer */}
                <button
                  className="voice-command-btn voice-command-submit"
                  onClick={handleSubmit}
                  disabled={isProcessing || !command.trim()}
                  title="Envoyer la commande"
                >
                  {isProcessing ? (
                    <svg
                      className="spinner"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z"></path>
                      <path d="M22 2 11 13"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`voice-command-feedback ${
                  feedback.startsWith("✓") ? "success" : ""
                } ${feedback.startsWith("Erreur") ? "error" : ""}`}
              >
                {feedback}
              </div>
            )}

            {/* Exemples de commandes */}
            <div className="voice-command-examples">
              <p className="voice-command-examples-title">Exemples de commandes :</p>
              <ul>
                <li onClick={() => setCommand("Active le mode sombre")}>
                  "Active le mode sombre"
                </li>
                <li onClick={() => setCommand("Police OpenDyslexic taille 20")}>
                  "Police OpenDyslexic taille 20"
                </li>
                <li onClick={() => setCommand("Active le surlignage des phonèmes")}>
                  "Active le surlignage des phonèmes"
                </li>
                <li onClick={() => setCommand("Augmente l'espacement entre les mots")}>
                  "Augmente l'espacement entre les mots"
                </li>
              </ul>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}