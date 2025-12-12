import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types pour les phonèmes
interface PhonemeConfig {
  couleur: string;
  actif: boolean;
}

// Types pour le thème
interface ThemeConfig {
  couleur_fond: string;
  couleur_texte: string;
  couleur_surlignage: string;
}

// Types pour la dyslexie
interface DyslexieConfig {
  alternement_typo: boolean;
  soulignement_syllabes: boolean;
  phonemes: Record<string, PhonemeConfig>;
  lettres_muettes: boolean;
}

// Types pour la sémantique
interface SemantiqueConfig {
  nom_propre: boolean;
  date_chiffre: boolean;
  mot_long: boolean;
}

// Type principal des paramètres
export interface PersonnalisationState {
  // Typographie
  espace_mot: number;
  espace_lettre: number;
  font: string;
  interligne: number;
  alignement_texte: "gauche" | "centre" | "droite" | "justify";
  longueur_liseuse: number;
  taille_texte: number;

  // Thème
  theme: ThemeConfig;
  theme_mode: "light" | "sepia" | "dark" | "contrast" | "oled";

  // Dyslexie
  dyslexie: DyslexieConfig;
  segmentation_syllabique: boolean;
  phonemes_actifs: boolean;

  // Sémantique / TDA/H
  semantique: SemantiqueConfig;
  focus_paragraphe: boolean;
  ligne_focus: boolean;

  // Outils de lecture
  mode_p_p: boolean;
  barre_progression: boolean;
  regle_lecture: boolean;

  // Accessibilité
  daltonien:
    | "Aucun"
    | "protanopia"
    | "deuteranopia"
    | "tritanopia"
    | "achromatopsia";

  // Profil actif
  profil_actif: "standard" | "dyslexie" | "tdah" | "fatigue" | "malvoyance";
}

// Actions du store
interface PersonnalisationActions {
  // Setters génériques
  setEspaceMot: (value: number) => void;
  setEspaceLettre: (value: number) => void;
  setFont: (value: string) => void;
  setInterligne: (value: number) => void;
  setAlignementTexte: (
    value: PersonnalisationState["alignement_texte"]
  ) => void;
  setLongueurLiseuse: (value: number) => void;
  setTailleTexte: (value: number) => void;

  // Thème
  setThemeMode: (mode: PersonnalisationState["theme_mode"]) => void;
  setThemeCouleurFond: (couleur: string) => void;
  setThemeCouleurTexte: (couleur: string) => void;
  setThemeCouleurSurlignage: (couleur: string) => void;

  // Dyslexie
  setAlternementTypo: (value: boolean) => void;
  setSoulignementSyllabes: (value: boolean) => void;
  setSegmentationSyllabique: (value: boolean) => void;
  setPhonemesActifs: (value: boolean) => void;
  togglePhoneme: (key: string) => void;
  setPhonemeColor: (key: string, couleur: string) => void;
  setLettresMuettes: (value: boolean) => void;

  // Sémantique
  setNomPropre: (value: boolean) => void;
  setDateChiffre: (value: boolean) => void;
  setMotLong: (value: boolean) => void;

  // TDA/H
  setFocusParagraphe: (value: boolean) => void;
  setLigneFocus: (value: boolean) => void;

  // Outils
  setModePP: (value: boolean) => void;
  setBarreProgression: (value: boolean) => void;
  setRegleLecture: (value: boolean) => void;

  // Accessibilité
  setDaltonien: (value: PersonnalisationState["daltonien"]) => void;

  // Profils
  setProfilActif: (profil: PersonnalisationState["profil_actif"]) => void;
  appliquerProfil: (profil: PersonnalisationState["profil_actif"]) => void;

  // Utilitaires
  reset: () => void;
}

// État initial (basé sur le JSON)
const initialState: PersonnalisationState = {
  espace_mot: 0,
  espace_lettre: 0,
  font: "Inter",
  interligne: 1.8,
  alignement_texte: "justify",
  longueur_liseuse: 800,
  taille_texte: 18,

  theme: {
    couleur_fond: "#FFFFFF",
    couleur_texte: "#2c2c2c",
    couleur_surlignage: "#FFFF00",
  },
  theme_mode: "light",

  dyslexie: {
    alternement_typo: false,
    soulignement_syllabes: false,
    phonemes: {
      an: { couleur: "#ef4444", actif: false },
      on: { couleur: "#3b82f6", actif: false },
      in: { couleur: "#22c55e", actif: false },
      ou: { couleur: "#f59e0b", actif: false },
      oi: { couleur: "#a855f7", actif: false },
      eu: { couleur: "#06b6d4", actif: false },
      ai: { couleur: "#f97316", actif: false },
      ui: { couleur: "#ec4899", actif: false },
      gn: { couleur: "#14b8a6", actif: false },
      ill: { couleur: "#8b5cf6", actif: false },
      eau: { couleur: "#0ea5e9", actif: false },
      au: { couleur: "#84cc16", actif: false },
      en: { couleur: "#eab308", actif: false },
    },
    lettres_muettes: false,
  },
  segmentation_syllabique: false,
  phonemes_actifs: false,

  semantique: {
    nom_propre: false,
    date_chiffre: false,
    mot_long: false,
  },
  focus_paragraphe: false,
  ligne_focus: false,

  mode_p_p: false,
  barre_progression: false,
  regle_lecture: false,

  daltonien: "Aucun",
  profil_actif: "standard",
};

// Thèmes prédéfinis
const themesPredefinis = {
  light: { couleur_fond: "#ffffff", couleur_texte: "#1a1a1a" },
  sepia: { couleur_fond: "#f4ecd8", couleur_texte: "#5b4636" },
  dark: { couleur_fond: "#1a1a1a", couleur_texte: "#e0e0e0" },
  contrast: { couleur_fond: "#000000", couleur_texte: "#ffff00" },
  oled: { couleur_fond: "#000000", couleur_texte: "#ffffff" },
};

// Création du store avec persistance
export const usePersonnalisationStore = create<
  PersonnalisationState & PersonnalisationActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Setters typographie
      setEspaceMot: (value) => set({ espace_mot: value }),
      setEspaceLettre: (value) => set({ espace_lettre: value }),
      setFont: (value) => set({ font: value }),
      setInterligne: (value) => set({ interligne: value }),
      setAlignementTexte: (value) => set({ alignement_texte: value }),
      setLongueurLiseuse: (value) => set({ longueur_liseuse: value }),
      setTailleTexte: (value) => set({ taille_texte: value }),

      // Setters thème
      setThemeMode: (mode) => {
        const themeColors = themesPredefinis[mode];
        if (!themeColors) {
          console.warn(
            `Theme mode "${mode}" non trouvé dans themesPredefinis, utilisation de light par défaut`
          );
          set({
            theme_mode: "light",
            theme: {
              ...get().theme,
              couleur_fond: themesPredefinis.light.couleur_fond,
              couleur_texte: themesPredefinis.light.couleur_texte,
            },
          });
          return;
        }
        set({
          theme_mode: mode,
          theme: {
            ...get().theme,
            couleur_fond: themeColors.couleur_fond,
            couleur_texte: themeColors.couleur_texte,
          },
        });
      },
      setThemeCouleurFond: (couleur) =>
        set({ theme: { ...get().theme, couleur_fond: couleur } }),
      setThemeCouleurTexte: (couleur) =>
        set({ theme: { ...get().theme, couleur_texte: couleur } }),
      setThemeCouleurSurlignage: (couleur) =>
        set({ theme: { ...get().theme, couleur_surlignage: couleur } }),

      // Setters dyslexie
      setAlternementTypo: (value) =>
        set({ dyslexie: { ...get().dyslexie, alternement_typo: value } }),
      setSoulignementSyllabes: (value) =>
        set({ dyslexie: { ...get().dyslexie, soulignement_syllabes: value } }),
      setSegmentationSyllabique: (value) =>
        set({ segmentation_syllabique: value }),
      setPhonemesActifs: (value) => set({ phonemes_actifs: value }),
      togglePhoneme: (key) => {
        const phonemes = get().dyslexie.phonemes;
        if (phonemes[key]) {
          set({
            dyslexie: {
              ...get().dyslexie,
              phonemes: {
                ...phonemes,
                [key]: { ...phonemes[key], actif: !phonemes[key].actif },
              },
            },
          });
        }
      },
      setPhonemeColor: (key, couleur) => {
        const phonemes = get().dyslexie.phonemes;
        if (phonemes[key]) {
          set({
            dyslexie: {
              ...get().dyslexie,
              phonemes: {
                ...phonemes,
                [key]: { ...phonemes[key], couleur },
              },
            },
          });
        }
      },
      setLettresMuettes: (value) =>
        set({ dyslexie: { ...get().dyslexie, lettres_muettes: value } }),

      // Setters sémantique
      setNomPropre: (value) =>
        set({ semantique: { ...get().semantique, nom_propre: value } }),
      setDateChiffre: (value) =>
        set({ semantique: { ...get().semantique, date_chiffre: value } }),
      setMotLong: (value) =>
        set({ semantique: { ...get().semantique, mot_long: value } }),

      // Setters TDA/H
      setFocusParagraphe: (value) => set({ focus_paragraphe: value }),
      setLigneFocus: (value) => set({ ligne_focus: value }),

      // Setters outils
      setModePP: (value) => set({ mode_p_p: value }),
      setBarreProgression: (value) => set({ barre_progression: value }),
      setRegleLecture: (value) => set({ regle_lecture: value }),

      // Accessibilité
      setDaltonien: (value) => set({ daltonien: value }),

      // Profils
      setProfilActif: (profil) => set({ profil_actif: profil }),

      appliquerProfil: (profil) => {
        // D'abord réinitialiser à l'état initial
        set(initialState);
        set({ profil_actif: profil });

        switch (profil) {
          case "dyslexie":
            // Profil optimisé pour la dyslexie
            set({
              font: "OpenDyslexic",
              interligne: 2.2,
              espace_lettre: 3,
              espace_mot: 8,
              taille_texte: 20,
              alignement_texte: "gauche", // Pas de justification pour dyslexie
              segmentation_syllabique: true,
              phonemes_actifs: true,
              dyslexie: {
                alternement_typo: true,
                soulignement_syllabes: false,
                lettres_muettes: true,
                phonemes: {
                  an: { couleur: "#ef4444", actif: true },
                  on: { couleur: "#3b82f6", actif: true },
                  in: { couleur: "#22c55e", actif: true },
                  ou: { couleur: "#f59e0b", actif: true },
                  oi: { couleur: "#a855f7", actif: true },
                  eu: { couleur: "#06b6d4", actif: false },
                  ai: { couleur: "#f97316", actif: false },
                  ui: { couleur: "#ec4899", actif: false },
                  gn: { couleur: "#14b8a6", actif: false },
                  ill: { couleur: "#8b5cf6", actif: false },
                  eau: { couleur: "#0ea5e9", actif: true },
                  au: { couleur: "#84cc16", actif: false },
                  en: { couleur: "#eab308", actif: true },
                },
              },
              barre_progression: true,
            });
            break;
          case "tdah":
            // Profil optimisé pour le TDA/H - focus et repères visuels
            set({
              font: "Lexend", // Police fluide
              interligne: 2,
              taille_texte: 18,
              focus_paragraphe: true,
              ligne_focus: true,
              regle_lecture: true,
              barre_progression: true,
              semantique: {
                nom_propre: true,
                date_chiffre: true,
                mot_long: true,
              },
              // Mode paragraphe par paragraphe pour éviter la surcharge
              mode_p_p: false, // Désactivé par défaut mais disponible
            });
            break;
          case "fatigue":
            // Profil pour réduire la fatigue visuelle
            set({
              theme_mode: "sepia",
              theme: {
                couleur_fond: themesPredefinis.sepia.couleur_fond,
                couleur_texte: themesPredefinis.sepia.couleur_texte,
                couleur_surlignage: "#d4a574",
              },
              font: "Lexend",
              interligne: 2,
              taille_texte: 20,
              espace_lettre: 1,
              espace_mot: 4,
              longueur_liseuse: 700, // Colonne plus étroite
              barre_progression: true,
            });
            break;
          case "malvoyance":
            // Profil pour les personnes malvoyantes
            set({
              theme_mode: "contrast",
              theme: {
                couleur_fond: themesPredefinis.contrast.couleur_fond,
                couleur_texte: themesPredefinis.contrast.couleur_texte,
                couleur_surlignage: "#00ffff",
              },
              font: "Inter",
              taille_texte: 26,
              interligne: 2.4,
              espace_lettre: 2,
              espace_mot: 6,
              longueur_liseuse: 900,
              barre_progression: true,
              regle_lecture: true,
            });
            break;
          case "standard":
          default:
            // Déjà réinitialisé plus haut
            break;
        }
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "personnalisation-storage", // Clé localStorage
      partialize: (state) => {
        // On exclut les fonctions de la persistance
        const {
          setEspaceMot,
          setEspaceLettre,
          setFont,
          setInterligne,
          setAlignementTexte,
          setLongueurLiseuse,
          setTailleTexte,
          setThemeMode,
          setThemeCouleurFond,
          setThemeCouleurTexte,
          setThemeCouleurSurlignage,
          setAlternementTypo,
          setSoulignementSyllabes,
          setSegmentationSyllabique,
          setPhonemesActifs,
          togglePhoneme,
          setPhonemeColor,
          setLettresMuettes,
          setNomPropre,
          setDateChiffre,
          setMotLong,
          setFocusParagraphe,
          setLigneFocus,
          setModePP,
          setBarreProgression,
          setRegleLecture,
          setDaltonien,
          setProfilActif,
          appliquerProfil,
          reset,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);

// Sélecteurs utiles (pour optimiser les re-renders)
export const useTypographie = () =>
  usePersonnalisationStore((state) => ({
    espace_mot: state.espace_mot,
    espace_lettre: state.espace_lettre,
    font: state.font,
    interligne: state.interligne,
    alignement_texte: state.alignement_texte,
    longueur_liseuse: state.longueur_liseuse,
    taille_texte: state.taille_texte,
  }));

export const useTheme = () =>
  usePersonnalisationStore((state) => ({
    theme: state.theme,
    theme_mode: state.theme_mode,
  }));

export const useDyslexie = () =>
  usePersonnalisationStore((state) => ({
    dyslexie: state.dyslexie,
    segmentation_syllabique: state.segmentation_syllabique,
    phonemes_actifs: state.phonemes_actifs,
  }));

export const useTDAH = () =>
  usePersonnalisationStore((state) => ({
    semantique: state.semantique,
    focus_paragraphe: state.focus_paragraphe,
    ligne_focus: state.ligne_focus,
  }));

export const useAccessibilite = () =>
  usePersonnalisationStore((state) => ({
    daltonien: state.daltonien,
  }));

export const useOutils = () =>
  usePersonnalisationStore((state) => ({
    mode_p_p: state.mode_p_p,
    barre_progression: state.barre_progression,
    regle_lecture: state.regle_lecture,
  }));

// Synchronisation entre les onglets
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "personnalisation-storage") {
      usePersonnalisationStore.persist.rehydrate();
    }
  });
}
