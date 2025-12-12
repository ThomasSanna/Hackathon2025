import React, { useEffect, useRef, useCallback } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";

/**
 * Composant qui gère le focus sur les paragraphes
 * Assombrit les paragraphes non actifs pour aider à la concentration
 * Le paragraphe actif est déterminé par:
 * - Le scroll (IntersectionObserver)
 * - Le survol de la souris (mouseenter)
 */
export default function FocusParagraphe() {
  const focus_paragraphe = usePersonnalisationStore(
    (state) => state.focus_paragraphe
  );
  const currentParagraphRef = useRef<Element | null>(null);
  const isMouseOverRef = useRef(false);

  const setFocusedParagraph = useCallback((element: Element | null) => {
    if (!element) return;

    // Retirer le focus de l'ancien paragraphe
    document
      .querySelectorAll(
        ".page-content p, .page-content li, .page-content blockquote"
      )
      .forEach((p) => p.classList.remove("is-focused"));

    // Ajouter le focus au nouveau paragraphe
    element.classList.add("is-focused");
    currentParagraphRef.current = element;
  }, []);

  useEffect(() => {
    if (!focus_paragraphe) return;

    // Sélectionner tous les paragraphes dans le contenu
    const paragraphs = document.querySelectorAll(
      ".page-content p, .page-content li, .page-content blockquote"
    );

    // ========================================
    // GESTION DU SURVOL SOURIS
    // ========================================
    const handleMouseEnter = (e: Event) => {
      isMouseOverRef.current = true;
      setFocusedParagraph(e.target as Element);
    };

    const handleMouseLeave = () => {
      isMouseOverRef.current = false;
      // On garde le focus même après le leave
    };

    // ========================================
    // GESTION DU SCROLL (IntersectionObserver)
    // ========================================
    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Si la souris est sur un paragraphe, ne pas changer le focus par scroll
      if (isMouseOverRef.current) return;

      // Trouver le paragraphe le plus visible (au centre de l'écran)
      let bestEntry: IntersectionObserverEntry | null = null;
      let bestRatio = 0;
      let bestCenterDistance = Infinity;

      const viewportCenter = window.innerHeight / 2;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const rect = entry.boundingClientRect;
          const elementCenter = rect.top + rect.height / 2;
          const distanceFromCenter = Math.abs(elementCenter - viewportCenter);

          // Privilégier le paragraphe le plus proche du centre de l'écran
          if (distanceFromCenter < bestCenterDistance) {
            bestCenterDistance = distanceFromCenter;
            bestEntry = entry;
            bestRatio = entry.intersectionRatio;
          }
        }
      });

      if (bestEntry) {
        setFocusedParagraph((bestEntry as IntersectionObserverEntry).target);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-20% 0px -20% 0px", // Zone centrale de l'écran
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    // Ajouter les listeners à tous les paragraphes
    paragraphs.forEach((p) => {
      p.addEventListener("mouseenter", handleMouseEnter);
      p.addEventListener("mouseleave", handleMouseLeave);
      observer.observe(p);
    });

    // Ajouter le premier paragraphe comme focusé par défaut
    if (paragraphs.length > 0) {
      setFocusedParagraph(paragraphs[0]);
    }

    return () => {
      observer.disconnect();
      paragraphs.forEach((p) => {
        p.removeEventListener("mouseenter", handleMouseEnter);
        p.removeEventListener("mouseleave", handleMouseLeave);
        p.classList.remove("is-focused");
      });
    };
  }, [focus_paragraphe, setFocusedParagraph]);

  // Styles injectés pour le focus paragraphe
  if (!focus_paragraphe) return null;

  return (
    <style>{`
      body.feature-focus-paragraphe .page-content p,
      body.feature-focus-paragraphe .page-content li,
      body.feature-focus-paragraphe .page-content blockquote {
        opacity: 0.3;
        transition: opacity 0.3s ease;
        filter: blur(0.5px);
      }
      
      body.feature-focus-paragraphe .page-content p.is-focused,
      body.feature-focus-paragraphe .page-content li.is-focused,
      body.feature-focus-paragraphe .page-content blockquote.is-focused {
        opacity: 1;
        filter: blur(0);
        background: linear-gradient(90deg, transparent 0%, var(--accent-color-10, rgba(59, 130, 246, 0.05)) 5%, rgba(59, 130, 246, 0.05) 95%, transparent 100%);
        border-radius: 4px;
        padding: 0.25em 0.5em;
        margin: -0.25em -0.5em;
      }
      
      body.feature-focus-paragraphe .page-content h1,
      body.feature-focus-paragraphe .page-content h2,
      body.feature-focus-paragraphe .page-content h3,
      body.feature-focus-paragraphe .page-content h4,
      body.feature-focus-paragraphe .page-content h5,
      body.feature-focus-paragraphe .page-content h6 {
        opacity: 0.6;
        transition: opacity 0.3s ease;
      }
    `}</style>
  );
}
