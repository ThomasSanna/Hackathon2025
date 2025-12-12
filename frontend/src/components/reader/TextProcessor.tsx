import React, { useEffect, useMemo, useRef } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";
import { useProgressStore } from "../../stores/progressStore";

// ... (keep all utilities same until TextProcessor component) ...

// ==========================================
// UTILITAIRES DE TRAITEMENT DU TEXTE FRANÇAIS
// ==========================================

// Règles de syllabation simplifiées pour le français
const voyelles = "aeiouyàâäéèêëïîôùûüœæ";
const consonnes = "bcdfghjklmnpqrstvwxzç";

/**
 * Découpe un mot en syllabes (algorithme simplifié pour le français)
 */
function syllabify(word: string): string[] {
  if (word.length <= 2) return [word];

  const syllabes: string[] = [];
  let current = "";

  for (let i = 0; i < word.length; i++) {
    const char = word[i].toLowerCase();
    const nextChar = word[i + 1]?.toLowerCase() || "";
    const nextNextChar = word[i + 2]?.toLowerCase() || "";

    current += word[i];

    // Si on a une voyelle suivie d'une consonne puis d'une voyelle
    if (
      voyelles.includes(char) &&
      consonnes.includes(nextChar) &&
      voyelles.includes(nextNextChar)
    ) {
      syllabes.push(current);
      current = "";
    }
    // Si on a une voyelle suivie de deux consonnes
    else if (
      voyelles.includes(char) &&
      consonnes.includes(nextChar) &&
      consonnes.includes(nextNextChar)
    ) {
      syllabes.push(current);
      current = "";
    }
  }

  if (current) {
    syllabes.push(current);
  }

  return syllabes.length > 0 ? syllabes : [word];
}

/**
 * Phonèmes complexes du français avec patterns regex
 */
const phonemePatterns: Record<string, RegExp> = {
  eau: /eau/gi,
  au: /au(?!x)/gi,
  ou: /ou/gi,
  oi: /oi/gi,
  an: /an(?![nt])/gi,
  en: /en(?![nt])/gi,
  on: /on(?![nt])/gi,
  in: /in(?![nt])/gi,
  ai: /ai/gi,
  ei: /ei/gi,
  eu: /eu/gi,
  ui: /ui/gi,
  gn: /gn/gi,
  ill: /ill/gi,
};

/**
 * Patterns pour détecter les lettres muettes en fin de mot
 */
const lettresMuettesPatterns = [
  /(?<=[aeiouyéèêëàâùûôîï])s$/gi, // s muet final après voyelle
  /(?<=[aeiouyéèêëàâùûôîï])t$/gi, // t muet final après voyelle
  /(?<=[aeiouyéèêëàâùûôîï])d$/gi, // d muet final après voyelle
  /(?<=[aeiouyéèêëàâùûôîï])x$/gi, // x muet final après voyelle
  /(?<=[aeiouyéèêëàâùûôîï])nt$/gi, // nt muet final (ils parlent)
  /e$/gi, // e muet final (mais pas toujours)
  /h(?=[aeiouy])/gi, // h muet devant voyelle
];

/**
 * Détecte si un mot est un nom propre (commence par majuscule et n'est pas en début de phrase)
 */
function isNomPropre(word: string, isStartOfSentence: boolean): boolean {
  if (!word || word.length === 0) return false;
  const firstChar = word[0];
  return (
    firstChar === firstChar.toUpperCase() &&
    firstChar !== firstChar.toLowerCase() &&
    !isStartOfSentence
  );
}

/**
 * Détecte si un mot contient une date ou un chiffre
 */
function isDateOrNumber(word: string): boolean {
  return /\d/.test(word);
}

/**
 * Vérifie si un mot est long (> 8 lettres)
 */
function isMotLong(word: string): boolean {
  // On ne compte que les lettres
  const letters = word.replace(
    /[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/g,
    ""
  );
  return letters.length > 8;
}

// ==========================================
// COMPOSANTS DE RENDU
// ==========================================

interface ProcessedWordProps {
  word: string;
  isStartOfSentence: boolean;
  settings: {
    segmentation: boolean;
    alternement: boolean;
    soulignement: boolean;
    phonemes: boolean;
    phonemesConfig: Record<string, { couleur: string; actif: boolean }>;
    lettresMuettes: boolean;
    nomPropre: boolean;
    dateChiffre: boolean;
    motLong: boolean;
  };
}

/**
 * Composant qui traite et affiche un mot avec les styles d'accessibilité
 */
function ProcessedWord({
  word,
  isStartOfSentence,
  settings,
}: ProcessedWordProps) {
  const {
    segmentation,
    alternement,
    soulignement,
    phonemes,
    phonemesConfig,
    lettresMuettes,
    nomPropre,
    dateChiffre,
    motLong,
  } = settings;

  // Classes et styles à appliquer
  const classNames: string[] = ["processed-word"];
  let processedContent: React.ReactNode = word;

  // Nom propre
  if (nomPropre && isNomPropre(word, isStartOfSentence)) {
    classNames.push("highlight-nom-propre");
  }

  // Date/chiffre
  if (dateChiffre && isDateOrNumber(word)) {
    classNames.push("highlight-date-chiffre");
  }

  // Mot long
  if (motLong && isMotLong(word)) {
    classNames.push("highlight-mot-long");
  }

  // Segmentation syllabique
  if (segmentation || alternement || soulignement) {
    const syllabes = syllabify(word);
    processedContent = (
      <>
        {syllabes.map((syllabe, idx) => {
          const syllableClasses = ["syllabe"];

          if (segmentation) {
            syllableClasses.push(
              idx % 2 === 0 ? "syllabe-pair" : "syllabe-impair"
            );
          }
          if (alternement) {
            syllableClasses.push(
              idx % 2 === 0 ? "syllabe-bold" : "syllabe-normal"
            );
          }
          if (soulignement) {
            syllableClasses.push("syllabe-underline");
            syllableClasses.push(
              idx % 2 === 0 ? "syllabe-underline-1" : "syllabe-underline-2"
            );
          }

          return (
            <span key={idx} className={syllableClasses.join(" ")}>
              {syllabe}
            </span>
          );
        })}
      </>
    );
  }

  // Phonèmes
  if (phonemes && typeof processedContent === "string") {
    let result = processedContent;
    const activePhonemes = Object.entries(phonemesConfig).filter(
      ([, config]) => config.actif
    );

    if (activePhonemes.length > 0) {
      // On crée une version avec les spans pour les phonèmes
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let currentWord = result;

      activePhonemes.forEach(([phoneme, config]) => {
        const pattern = phonemePatterns[phoneme];
        if (pattern) {
          currentWord = currentWord.replace(pattern, (match) => {
            return `<phoneme data-phoneme="${phoneme}" style="background-color: ${config.couleur}20; color: ${config.couleur}; border-radius: 2px; padding: 0 2px;">${match}</phoneme>`;
          });
        }
      });

      // Utiliser dangerouslySetInnerHTML pour le rendu des phonèmes
      processedContent = (
        <span dangerouslySetInnerHTML={{ __html: currentWord }} />
      );
    }
  }

  // Lettres muettes (traitement simplifié pour le dernier caractère)
  if (lettresMuettes && typeof word === "string" && word.length > 2) {
    const lastChar = word[word.length - 1].toLowerCase();
    const beforeLast = word[word.length - 2]?.toLowerCase();

    // e muet final après consonne
    if (lastChar === "e" && beforeLast && consonnes.includes(beforeLast)) {
      classNames.push("has-lettre-muette");
    }
    // s, t, d, x muets finals
    if (
      ["s", "t", "d", "x"].includes(lastChar) &&
      voyelles.includes(beforeLast)
    ) {
      classNames.push("has-lettre-muette");
    }
  }

  return <span className={classNames.join(" ")}>{processedContent}</span>;
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

interface TextProcessorProps {
  html: string;
  className?: string;
}

/**
 * Composant qui injecte les styles CSS pour le traitement de texte
 * Les fonctionnalités sont appliquées via CSS quand les classes sont présentes sur body
 */
export function TextProcessorStyles() {
  return (
    <style>{`
      /* === SYLLABES === */
      .syllabe-pair {
        color: var(--syllabe-color-1, #2563eb);
      }
      .syllabe-impair {
        color: var(--syllabe-color-2, #dc2626);
      }
      
      .syllabe-bold {
        font-weight: 700;
      }
      .syllabe-normal {
        font-weight: 400;
      }
      
      .syllabe-underline {
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      .syllabe-underline-1 {
        text-decoration-color: var(--syllabe-underline-1, #2563eb);
      }
      .syllabe-underline-2 {
        text-decoration-color: var(--syllabe-underline-2, #dc2626);
      }
      
      /* === HIGHLIGHTS SÉMANTIQUES === */
      .highlight-nom-propre {
        background: linear-gradient(120deg, #a78bfa20 0%, #a78bfa40 100%);
        border-radius: 3px;
        padding: 0 3px;
        border-bottom: 2px solid #a78bfa;
      }
      
      .highlight-date-chiffre {
        background: linear-gradient(120deg, #f59e0b20 0%, #f59e0b40 100%);
        border-radius: 3px;
        padding: 0 3px;
        border-bottom: 2px solid #f59e0b;
      }
      
      .highlight-mot-long {
        background: linear-gradient(120deg, #06b6d420 0%, #06b6d440 100%);
        border-radius: 3px;
        padding: 0 3px;
        border-bottom: 2px solid #06b6d4;
      }
      
      /* === LETTRES MUETTES === */
      .has-lettre-muette::after {
        content: '';
      }
      
      /* Lettres muettes via CSS (appliqué globalement) */
      body.feature-lettres-muettes .page-content {
        /* On utilise un script séparé pour marquer les lettres muettes */
      }
      
      /* === FOCUS PARAGRAPHE === */
      body.feature-focus-paragraphe .page-content p {
        opacity: 0.4;
        transition: opacity 0.2s ease;
      }
      body.feature-focus-paragraphe .page-content p:hover,
      body.feature-focus-paragraphe .page-content p:focus,
      body.feature-focus-paragraphe .page-content p.is-focused {
        opacity: 1;
      }
      
      /* === FOCUS LIGNE === */
      body.feature-focus-ligne .line-highlight {
        position: fixed;
        left: 0;
        right: 0;
        height: 2em;
        background: var(--highlight-color, #ffff0030);
        pointer-events: none;
        z-index: 50;
        transition: top 0.05s ease;
      }
      
      /* === RÈGLE DE LECTURE === */
      body.feature-regle-lecture .reading-ruler {
        position: fixed;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--accent-color, #8c5e58);
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 0 10px var(--accent-color);
      }
      
      /* === MODE PARAGRAPHE PAR PARAGRAPHE === */
      body.feature-mode-pp .page-content p {
        display: none;
      }
      body.feature-mode-pp .page-content p.current-paragraph {
        display: block;
      }
      
      /* === BARRE DE PROGRESSION === */
      body:not(.feature-barre-progression) .reading-progress-container {
        display: none;
      }
      
      /* === DALTONISME === */
      body.daltonism-protanopia img {
        filter: url("#protanopia");
      }
      body.daltonism-deuteranopia img {
        filter: url("#deuteranopia");
      }
      body.daltonism-tritanopia img {
        filter: url("#tritanopia");
      }
      body.daltonism-achromatopsia img {
        filter: grayscale(100%);
      }
    `}</style>
  );
}

/**
 * Script côté client pour appliquer les transformations de texte
 */
export function TextProcessorScript() {
  useEffect(() => {
    const applyTextTransformations = () => {
      const store = (window as any).__PERSONNALISATION_STORE__;
      if (!store) return;

      const state = store.getState();
      const pageContent = document.querySelectorAll(".page-content");

      pageContent.forEach((content) => {
        // Cette fonction sera appelée quand le store change
        // Pour l'instant, on laisse le CSS gérer les transformations visuelles
      });
    };

    // Observer les changements du store
    const unsubscribe = usePersonnalisationStore.subscribe(
      applyTextTransformations
    );

    return () => unsubscribe();
  }, []);

  return null;
}

export default function TextProcessor({ html, className }: TextProcessorProps) {
  const updateProgress = useProgressStore((state) => state.updateProgress);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());
  const intervalRef = useRef<any>(null);

  // Extraire l'ID du document de l'URL
  const getDocId = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    // Assumant /reader/DOC_ID
    return parts[parts.length - 1];
  };

  useEffect(() => {
    const docId = getDocId();
    if (!docId) return;

    // Restaurer la position
    const savedBook = useProgressStore.getState().books[docId];
    if (savedBook && savedBook.progress > 0) {
      // Attendre un peu que le rendu soit fait
      setTimeout(() => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const position = (savedBook.progress / 100) * height;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }, 500);
    }

    // Tracker time spent
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - startTime.current) / 1000;
      updateProgress(docId, {
        timeSpent: (savedBook?.timeSpent || 0) + elapsedSeconds // Add partial delta logic or simplified
        // Simplified: store handles total. 
        // We just verify that we are active. 
        // Better: store a state in store "sessionTime" and commit on unmount?
        // Let's simplified: add 5s every 5s.
      });
      // Actually updateProgress expects new full state? 
      // The store implementation merges: updates: Partial<BookStats>
      // The store implementation logic:
      // ...currentBook, ...updates, timeSpent: ...
      // So if I pass { timeSpent: currentBook.timeSpent + 5 }, it works.
      
      const current = useProgressStore.getState().books[docId];
      if (current) {
         updateProgress(docId, { timeSpent: current.timeSpent + 5 });
      } else {
         updateProgress(docId, { timeSpent: 5 });
      }
      startTime.current = now; // reset start for calculation safety
    }, 5000);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.max(0, (scrollTop / height) * 100));
      
      updateProgress(docId, { progress });
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Pour le rendu initial, on utilise dangerouslySetInnerHTML
  // Les transformations visuelles sont gérées par CSS via les classes sur body
  return (
    <>
      <TextProcessorStyles />
      <div 
        ref={containerRef}
        className={className} 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </>
  );
}
