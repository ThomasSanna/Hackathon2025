import { useEffect } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";

/**
 * Ce composant applique les styles CSS dynamiquement depuis le store Zustand.
 * Il met à jour les variables CSS sur :root et les classes du body.
 */
export default function ReaderStyleProvider() {
  const {
    // Typographie
    espace_mot,
    espace_lettre,
    font,
    interligne,
    alignement_texte,
    longueur_liseuse,
    taille_texte,
    // Thème
    theme,
    theme_mode,
    // Dyslexie
    dyslexie,
    segmentation_syllabique,
    phonemes_actifs,
    // TDA/H
    semantique,
    focus_paragraphe,
    ligne_focus,
    // Outils
    mode_p_p,
    barre_progression,
    regle_lecture,
    // Accessibilité
    daltonien,
  } = usePersonnalisationStore();

  useEffect(() => {
    const root = document.documentElement;

    // === TYPOGRAPHIE ===
    root.style.setProperty("--font-size-base", `${taille_texte}px`);
    root.style.setProperty("--line-height-base", String(interligne));
    root.style.setProperty("--letter-spacing-base", `${espace_lettre}px`);
    root.style.setProperty("--word-spacing-base", `${espace_mot}px`);
    root.style.setProperty("--max-page-content-width", `${longueur_liseuse}px`);

    // Alignement
    const textAlignMap: Record<string, string> = {
      gauche: "left",
      centre: "center",
      droite: "right",
      justify: "justify",
    };
    root.style.setProperty(
      "--text-align",
      textAlignMap[alignement_texte] || "justify"
    );

    // Police
    root.style.setProperty("--font-body", font);
    root.style.setProperty("--font-heading", font);

    // === THÈME ===
    root.style.setProperty("--bg-color", theme.couleur_fond);
    root.style.setProperty("--text-color", theme.couleur_texte);
    root.style.setProperty("--highlight-color", theme.couleur_surlignage);

    // Couleur d'accent basée sur le thème
    const accentColors: Record<string, string> = {
      light: "#2563eb",
      sepia: "#8c5e58",
      dark: "#d4a5a5",
      contrast: "#ffff00",
      oled: "#ffffff",
    };
    root.style.setProperty(
      "--accent-color",
      accentColors[theme_mode] || "#8c5e58"
    );
    root.style.setProperty(
      "--link-color",
      theme_mode === "dark" ? "#93c5fd" : accentColors[theme_mode]
    );

    // Classes de thème sur body
    document.body.classList.remove(
      "theme-light",
      "theme-sepia",
      "theme-dark",
      "theme-contrast",
      "theme-oled"
    );
    document.body.classList.add(`theme-${theme_mode}`);

    // === DYSLEXIE ===
    // Variables pour les phonèmes
    Object.entries(dyslexie.phonemes).forEach(([key, value]) => {
      if (value.actif) {
        root.style.setProperty(`--phoneme-${key}-color`, value.couleur);
      } else {
        root.style.removeProperty(`--phoneme-${key}-color`);
      }
    });

    // Classes de fonctionnalités
    document.body.classList.toggle(
      "feature-segmentation-syllabique",
      segmentation_syllabique
    );
    document.body.classList.toggle(
      "feature-alternement-typo",
      dyslexie.alternement_typo
    );
    document.body.classList.toggle(
      "feature-soulignement-syllabes",
      dyslexie.soulignement_syllabes
    );
    document.body.classList.toggle("feature-phonemes", phonemes_actifs);
    document.body.classList.toggle(
      "feature-lettres-muettes",
      dyslexie.lettres_muettes
    );

    // === TDA/H ===
    document.body.classList.toggle(
      "feature-focus-paragraphe",
      focus_paragraphe
    );
    document.body.classList.toggle("feature-focus-ligne", ligne_focus);
    document.body.classList.toggle("feature-mode-pp", mode_p_p);

    // Sémantique
    document.body.classList.toggle("feature-nom-propre", semantique.nom_propre);
    document.body.classList.toggle(
      "feature-date-chiffre",
      semantique.date_chiffre
    );
    document.body.classList.toggle("feature-mot-long", semantique.mot_long);

    // === OUTILS ===
    document.body.classList.toggle(
      "feature-barre-progression",
      barre_progression
    );
    document.body.classList.toggle("feature-regle-lecture", regle_lecture);

    // === DALTONISME ===
    document.body.classList.remove(
      "daltonism-protanopia",
      "daltonism-deuteranopia",
      "daltonism-tritanopia",
      "daltonism-achromatopsia"
    );
    if (daltonien !== "Aucun") {
      document.body.classList.add(`daltonism-${daltonien}`);
    }
  }, [
    espace_mot,
    espace_lettre,
    font,
    interligne,
    alignement_texte,
    longueur_liseuse,
    taille_texte,
    theme,
    theme_mode,
    dyslexie,
    segmentation_syllabique,
    phonemes_actifs,
    semantique,
    focus_paragraphe,
    ligne_focus,
    mode_p_p,
    barre_progression,
    regle_lecture,
    daltonien,
  ]);

  // Ce composant ne rend rien, il applique juste les styles
  return null;
}
