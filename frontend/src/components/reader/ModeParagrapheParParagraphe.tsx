import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Nombre minimum de lignes par bloc
const MIN_LINES_PER_BLOCK = 7;
// Nombre maximum de lignes par bloc (au-delà, on split au prochain point)
const MAX_LINES_PER_BLOCK = 25;

interface ModeParagrapheProps {
  containerSelector?: string;
}

interface ContentBlock {
  elements: Element[];
  mainContent: Element | null;
  type: "paragraph" | "list" | "blockquote" | "image" | "table";
  estimatedLines?: number;
}

/**
 * Estime le nombre de lignes d'un élément
 */
function estimateLines(element: Element): number {
  const text = element.textContent || "";
  const charPerLine = 80; // Estimation moyenne de caractères par ligne
  const textLines = Math.ceil(text.length / charPerLine);

  // Ajouter des lignes pour les titres, images, etc.
  if (/^H[1-6]$/.test(element.tagName)) {
    return Math.max(2, textLines); // Un titre compte au moins 2 lignes
  }
  if (element.tagName === "IMG" || element.tagName === "FIGURE") {
    return 5; // Une image compte comme 5 lignes
  }
  if (element.tagName === "TABLE") {
    return 10; // Une table compte comme 10 lignes minimum
  }

  return Math.max(1, textLines);
}

/**
 * Composant qui gère le mode paragraphe par paragraphe
 * Groupe les titres et images avec les paragraphes
 * Affiche un preview avant/après avec opacité réduite
 */
export default function ModeParagrapheParParagraphe({
  containerSelector = ".page-content",
}: ModeParagrapheProps) {
  const mode_p_p = usePersonnalisationStore((state) => state.mode_p_p);
  const theme = usePersonnalisationStore((state) => state.theme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  /**
   * Groupe les éléments en blocs logiques:
   * - Les titres sont attachés au paragraphe suivant
   * - Les images sont attachées au paragraphe précédent ou suivant
   * - Un bloc ne peut pas être un titre seul ou une image seule
   * - Les blocs doivent avoir au minimum MIN_LINES_PER_BLOCK lignes
   */
  const buildContentBlocks = useCallback(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return [];

    const allElements = Array.from(
      container.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, blockquote, ul, ol, li, img, figure, table"
      )
    );

    const rawBlocks: ContentBlock[] = [];
    let pendingHeaders: Element[] = [];
    let pendingImages: Element[] = [];

    const isHeader = (el: Element) => /^H[1-6]$/.test(el.tagName);
    const isImage = (el: Element) =>
      el.tagName === "IMG" || el.tagName === "FIGURE";
    const isTable = (el: Element) => el.tagName === "TABLE";
    const isMainContent = (el: Element) =>
      el.tagName === "P" ||
      el.tagName === "BLOCKQUOTE" ||
      (el.tagName === "LI" && el.parentElement?.tagName !== "LI") ||
      el.tagName === "UL" ||
      el.tagName === "OL";

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];

      if (isHeader(el)) {
        // Empiler les titres
        pendingHeaders.push(el);
      } else if (isImage(el)) {
        // Empiler les images
        pendingImages.push(el);
      } else if (isTable(el)) {
        // Les tables sont leur propre bloc avec les headers en attente
        const blockElements = [...pendingHeaders, ...pendingImages, el];
        rawBlocks.push({
          elements: blockElements,
          mainContent: el,
          type: "table",
          estimatedLines: blockElements.reduce(
            (sum, e) => sum + estimateLines(e),
            0
          ),
        });
        pendingHeaders = [];
        pendingImages = [];
      } else if (isMainContent(el)) {
        // Skip les LI qui sont enfants d'autres LI ou déjà dans UL/OL traité
        if (el.tagName === "LI") {
          const parentList = el.parentElement;
          if (
            parentList &&
            rawBlocks.some((b) => b.elements.includes(parentList))
          ) {
            continue;
          }
        }

        // C'est du contenu principal, on crée un bloc
        const blockElements = [...pendingHeaders, ...pendingImages, el];

        rawBlocks.push({
          elements: blockElements,
          mainContent: el,
          type:
            el.tagName === "P"
              ? "paragraph"
              : el.tagName === "BLOCKQUOTE"
              ? "blockquote"
              : "list",
          estimatedLines: blockElements.reduce(
            (sum, e) => sum + estimateLines(e),
            0
          ),
        });

        pendingHeaders = [];
        pendingImages = [];
      }
    }

    // S'il reste des headers/images en attente, créer un dernier bloc
    if (pendingHeaders.length > 0 || pendingImages.length > 0) {
      const allPending = [...pendingHeaders, ...pendingImages];
      const lastElement =
        pendingHeaders.length > 0
          ? pendingHeaders[pendingHeaders.length - 1]
          : pendingImages[pendingImages.length - 1];

      rawBlocks.push({
        elements: allPending,
        mainContent: lastElement,
        type: "paragraph",
        estimatedLines: allPending.reduce(
          (sum, e) => sum + estimateLines(e),
          0
        ),
      });
    }

    // Fusionner les blocs pour atteindre le minimum de lignes
    const mergedBlocks: ContentBlock[] = [];
    let currentBlock: ContentBlock | null = null;
    let currentLines = 0;

    for (const block of rawBlocks) {
      const blockLines = block.estimatedLines || 1;

      if (currentBlock === null) {
        // Premier bloc
        currentBlock = { ...block, elements: [...block.elements] };
        currentLines = blockLines;
      } else if (currentLines < MIN_LINES_PER_BLOCK) {
        // Le bloc courant n'a pas assez de lignes, on fusionne
        currentBlock.elements.push(...block.elements);
        currentBlock.mainContent = block.mainContent;
        currentLines += blockLines;
      } else {
        // Le bloc courant a assez de lignes, on le sauvegarde
        mergedBlocks.push(currentBlock);
        currentBlock = { ...block, elements: [...block.elements] };
        currentLines = blockLines;
      }
    }

    // Ajouter le dernier bloc
    if (currentBlock) {
      mergedBlocks.push(currentBlock);
    }

    // Splitter les blocs trop grands (> MAX_LINES_PER_BLOCK) au prochain point
    const finalBlocks: ContentBlock[] = [];

    for (const block of mergedBlocks) {
      const lines = block.estimatedLines || 0;

      if (lines <= MAX_LINES_PER_BLOCK) {
        finalBlocks.push(block);
        continue;
      }

      // Le bloc est trop grand, on doit le splitter
      // On cherche les points dans le texte pour couper
      const mainEl = block.mainContent;
      if (!mainEl || mainEl.tagName !== "P") {
        // Si ce n'est pas un paragraphe, on le garde tel quel
        finalBlocks.push(block);
        continue;
      }

      const text = mainEl.textContent || "";
      const sentences = text.split(/(?<=[.!?])\s+/);

      if (sentences.length <= 1) {
        // Pas de phrases multiples, on garde tel quel
        finalBlocks.push(block);
        continue;
      }

      // Créer des sous-blocs basés sur les phrases
      let currentText = "";
      let currentSentenceLines = 0;
      const charPerLine = 80;

      // Les headers vont avec le premier sous-bloc
      let isFirstSubBlock = true;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceLines = Math.ceil(sentence.length / charPerLine);

        if (
          currentSentenceLines + sentenceLines > MAX_LINES_PER_BLOCK &&
          currentText
        ) {
          // Créer un sous-bloc avec le texte accumulé
          const subElement = document.createElement("p");
          subElement.textContent = currentText.trim();
          subElement.className =
            (mainEl as HTMLElement).className + " pp-virtual-block";

          // Insérer après l'élément principal (caché)
          mainEl.parentNode?.insertBefore(subElement, mainEl.nextSibling);

          finalBlocks.push({
            elements: isFirstSubBlock
              ? [...block.elements.filter((e) => e !== mainEl), subElement]
              : [subElement],
            mainContent: subElement,
            type: "paragraph",
            estimatedLines: currentSentenceLines,
          });

          isFirstSubBlock = false;
          currentText = sentence;
          currentSentenceLines = sentenceLines;
        } else {
          currentText += (currentText ? " " : "") + sentence;
          currentSentenceLines += sentenceLines;
        }
      }

      // Dernier sous-bloc
      if (currentText) {
        const subElement = document.createElement("p");
        subElement.textContent = currentText.trim();
        subElement.className =
          (mainEl as HTMLElement).className + " pp-virtual-block";
        mainEl.parentNode?.insertBefore(subElement, mainEl.nextSibling);

        finalBlocks.push({
          elements: isFirstSubBlock
            ? [...block.elements.filter((e) => e !== mainEl), subElement]
            : [subElement],
          mainContent: subElement,
          type: "paragraph",
          estimatedLines: currentSentenceLines,
        });
      }

      // Cacher l'élément original
      (mainEl as HTMLElement).style.display = "none";
      (mainEl as HTMLElement).classList.add("pp-original-hidden");
    }

    return finalBlocks;
  }, [containerSelector]);

  // Construire les blocs au chargement
  useEffect(() => {
    if (!mode_p_p) return;

    const blocks = buildContentBlocks();
    setContentBlocks(blocks);
  }, [mode_p_p, buildContentBlocks]);

  // Appliquer le mode paragraphe par paragraphe
  useEffect(() => {
    if (!mode_p_p || contentBlocks.length === 0) {
      // Retirer le mode PP - montrer tous les éléments
      const container = document.querySelector(containerSelector);
      if (container) {
        // Nettoyer les blocs virtuels créés
        const virtualBlocks = container.querySelectorAll(".pp-virtual-block");
        virtualBlocks.forEach((el) => el.remove());

        // Restaurer les éléments originaux cachés
        const hiddenOriginals = container.querySelectorAll(
          ".pp-original-hidden"
        );
        hiddenOriginals.forEach((el) => {
          (el as HTMLElement).style.display = "";
          el.classList.remove("pp-original-hidden");
        });

        const allElements = container.querySelectorAll("*");
        allElements.forEach((el) => {
          (el as HTMLElement).style.opacity = "";
          (el as HTMLElement).style.display = "";
          (el as HTMLElement).style.transform = "";
          el.classList.remove(
            "pp-current",
            "pp-preview-before",
            "pp-preview-after",
            "pp-hidden"
          );
        });
      }
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Masquer tous les éléments d'abord
    const allContentElements = container.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, blockquote, ul, ol, li, img, figure, table"
    );
    allContentElements.forEach((el) => {
      (el as HTMLElement).style.display = "none";
      el.classList.remove(
        "pp-current",
        "pp-preview-before",
        "pp-preview-after"
      );
      el.classList.add("pp-hidden");
    });

    // Afficher le bloc précédent (preview avant)
    if (currentIndex > 0) {
      contentBlocks[currentIndex - 1].elements.forEach((el) => {
        (el as HTMLElement).style.display = "";
        el.classList.remove("pp-hidden");
        el.classList.add("pp-preview-before");
      });
    }

    // Afficher le bloc courant
    contentBlocks[currentIndex].elements.forEach((el) => {
      (el as HTMLElement).style.display = "";
      el.classList.remove("pp-hidden");
      el.classList.add("pp-current");
    });

    // Afficher le bloc suivant (preview après)
    if (currentIndex < contentBlocks.length - 1) {
      contentBlocks[currentIndex + 1].elements.forEach((el) => {
        (el as HTMLElement).style.display = "";
        el.classList.remove("pp-hidden");
        el.classList.add("pp-preview-after");
      });
    }

    // Centrer le bloc courant au milieu de l'écran
    const mainElement = contentBlocks[currentIndex].mainContent;
    if (mainElement) {
      // Calculer la position pour centrer verticalement
      const rect = mainElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const scrollOffset = elementCenter - viewportCenter;

      window.scrollBy({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  }, [mode_p_p, currentIndex, contentBlocks, containerSelector]);

  // Réinitialiser l'index quand on active le mode
  useEffect(() => {
    if (mode_p_p) {
      setCurrentIndex(0);
    }
  }, [mode_p_p]);

  // Navigation au clavier
  useEffect(() => {
    if (!mode_p_p) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, contentBlocks.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentIndex(contentBlocks.length - 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode_p_p, contentBlocks.length]);

  if (!mode_p_p || contentBlocks.length === 0) return null;

  const progress = ((currentIndex + 1) / contentBlocks.length) * 100;

  return (
    <>
      {/* Barre de navigation fixe en bas */}
      <div
        className="pp-navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: theme.couleur_fond,
          borderTop: `1px solid ${theme.couleur_texte}20`,
          padding: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Bouton Précédent */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            background:
              currentIndex === 0
                ? `${theme.couleur_texte}10`
                : `${theme.couleur_texte}20`,
            color: theme.couleur_texte,
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentIndex === 0 ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Barre de progression */}
        <div
          style={{
            flex: 1,
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "6px",
              background: `${theme.couleur_texte}15`,
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--accent-color)",
                borderRadius: "3px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              color: theme.couleur_texte,
              opacity: 0.7,
            }}
          >
            {currentIndex + 1} / {contentBlocks.length}
          </span>
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              Math.min(prev + 1, contentBlocks.length - 1)
            )
          }
          disabled={currentIndex === contentBlocks.length - 1}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            background:
              currentIndex === contentBlocks.length - 1
                ? `${theme.couleur_texte}10`
                : `${theme.couleur_texte}20`,
            color: theme.couleur_texte,
            cursor:
              currentIndex === contentBlocks.length - 1
                ? "not-allowed"
                : "pointer",
            opacity: currentIndex === contentBlocks.length - 1 ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Styles pour le mode paragraphe par paragraphe */}
      <style>{`
        body.feature-mode-pp .reader-container {
          padding-bottom: 120px;
        }
        body.feature-mode-pp .mobile-view {
          padding-bottom: 100px;
        }
        
        /* Bloc actuel */
        body.feature-mode-pp .page-content .pp-current {
          opacity: 1 !important;
          display: block !important;
          transform: scale(1);
          transition: all 0.4s ease;
        }
        
        /* Preview avant (bloc précédent) */
        body.feature-mode-pp .page-content .pp-preview-before {
          opacity: 0.25 !important;
          display: block !important;
          transform: scale(0.95);
          filter: blur(1px);
          pointer-events: none;
          transition: all 0.4s ease;
          margin-bottom: 2rem;
          border-bottom: 1px dashed var(--accent-color, #3b82f6);
          padding-bottom: 1rem;
        }
        
        /* Preview après (bloc suivant) */
        body.feature-mode-pp .page-content .pp-preview-after {
          opacity: 0.25 !important;
          display: block !important;
          transform: scale(0.95);
          filter: blur(1px);
          pointer-events: none;
          transition: all 0.4s ease;
          margin-top: 2rem;
          border-top: 1px dashed var(--accent-color, #3b82f6);
          padding-top: 1rem;
        }
        
        /* Éléments masqués */
        body.feature-mode-pp .page-content .pp-hidden {
          display: none !important;
        }
      `}</style>
    </>
  );
}
