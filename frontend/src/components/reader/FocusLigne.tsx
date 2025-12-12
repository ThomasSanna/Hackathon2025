import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";

/**
 * Composant qui surligne la ligne de lecture actuelle
 * Snap automatiquement sur les lignes de texte
 */
export default function FocusLigne() {
  const ligne_focus = usePersonnalisationStore((state) => state.ligne_focus);
  const theme = usePersonnalisationStore((state) => state.theme);
  const [lineInfo, setLineInfo] = useState<{
    top: number;
    height: number;
    visible: boolean;
  }>({
    top: 0,
    height: 32,
    visible: false,
  });
  const lastSnapRef = useRef<{ top: number; height: number } | null>(null);

  /**
   * Trouve la ligne de texte la plus proche de la position Y de la souris
   */
  const findNearestLine = useCallback(
    (mouseY: number): { top: number; height: number } | null => {
      const contentArea = document.querySelector(".page-content");
      if (!contentArea) return null;

      // Récupérer tous les éléments de texte
      const textElements = contentArea.querySelectorAll(
        "p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th"
      );

      let bestMatch: { top: number; height: number; distance: number } | null =
        null;

      textElements.forEach((element) => {
        const rect = element.getBoundingClientRect();

        // Ignorer les éléments hors écran
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        // Pour les éléments multi-lignes, on doit trouver la ligne exacte
        const computedStyle = window.getComputedStyle(element);
        const lineHeight =
          parseFloat(computedStyle.lineHeight) ||
          parseFloat(computedStyle.fontSize) * 1.5;

        // Calculer combien de lignes dans cet élément
        const numLines = Math.round(rect.height / lineHeight);

        for (let i = 0; i < numLines; i++) {
          const lineTop = rect.top + i * lineHeight;
          const lineBottom = lineTop + lineHeight;
          const lineCenter = lineTop + lineHeight / 2;

          // Distance entre le centre de la ligne et la position de la souris
          const distance = Math.abs(mouseY - lineCenter);

          // Vérifier si la souris est dans ou proche de cette ligne
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = {
              top: lineTop,
              height: lineHeight,
              distance,
            };
          }
        }
      });

      if (bestMatch && bestMatch.distance < 100) {
        return { top: bestMatch.top, height: bestMatch.height };
      }

      return null;
    },
    []
  );

  useEffect(() => {
    if (!ligne_focus) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nearestLine = findNearestLine(e.clientY);

      if (nearestLine) {
        // Éviter les micro-mouvements en vérifiant si la ligne a vraiment changé
        if (
          !lastSnapRef.current ||
          Math.abs(lastSnapRef.current.top - nearestLine.top) > 5
        ) {
          lastSnapRef.current = nearestLine;
          setLineInfo({
            top: nearestLine.top,
            height: nearestLine.height,
            visible: true,
          });
        }
      } else {
        // Fallback: suivre la souris si pas de ligne trouvée
        const defaultLineHeight = 32;
        setLineInfo({
          top: e.clientY - defaultLineHeight / 2,
          height: defaultLineHeight,
          visible: true,
        });
      }
    };

    const handleMouseLeave = () => {
      setLineInfo((prev) => ({ ...prev, visible: false }));
      lastSnapRef.current = null;
    };

    // Debounce pour améliorer les performances
    let rafId: number;
    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    document.addEventListener("mousemove", throttledMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", throttledMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [ligne_focus, findNearestLine]);

  if (!ligne_focus || !lineInfo.visible) return null;

  return (
    <div
      className="line-highlight"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: lineInfo.top,
        height: `${lineInfo.height}px`,
        background: `${theme.couleur_surlignage}25`,
        pointerEvents: "none",
        zIndex: 50,
        transition: "top 0.15s ease-out, height 0.15s ease-out",
        borderTop: `2px solid ${theme.couleur_surlignage}60`,
        borderBottom: `2px solid ${theme.couleur_surlignage}60`,
        boxShadow: `0 0 20px ${theme.couleur_surlignage}20`,
      }}
    />
  );
}
