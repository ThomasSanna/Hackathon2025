import React from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";

/**
 * Composant qui affiche une règle de lecture horizontale
 * Fixe au centre de l'écran pour guider la lecture
 */
export default function RegleLecture() {
  const regle_lecture = usePersonnalisationStore(
    (state) => state.regle_lecture
  );

  if (!regle_lecture) return null;

  return (
    <>
      {/* Règle principale au centre */}
      <div
        className="reading-ruler"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: "4px",
          background: "var(--accent-color, #8c5e58)",
          pointerEvents: "none",
          zIndex: 100,
          boxShadow:
            "0 0 15px var(--accent-color, #8c5e58), 0 0 30px var(--accent-color, #8c5e58)40",
        }}
      />
      {/* Zone de lecture surlignée */}
      <div
        className="reading-zone"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: "60px",
          background: "var(--accent-color, #8c5e58)10",
          borderTop: "1px solid var(--accent-color, #8c5e58)30",
          borderBottom: "1px solid var(--accent-color, #8c5e58)30",
          pointerEvents: "none",
          zIndex: 99,
        }}
      />
      {/* Zones assombries au-dessus et en-dessous */}
      <div
        className="reading-overlay-top"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          height: "calc(50% - 30px)",
          background: "rgba(0, 0, 0, 0.15)",
          pointerEvents: "none",
          zIndex: 98,
        }}
      />
      <div
        className="reading-overlay-bottom"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: "calc(50% - 30px)",
          background: "rgba(0, 0, 0, 0.15)",
          pointerEvents: "none",
          zIndex: 98,
        }}
      />
    </>
  );
}
