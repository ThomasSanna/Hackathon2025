import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Fonction utilitaire pour normaliser les dates dans le texte
const prepareTextForSpeech = (text: string) => {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  let spokenText = "";
  const segments: {
    originalStart: number;
    originalLength: number;
    spokenStart: number;
    spokenLength: number;
    isModified: boolean;
  }[] = [];
  let lastIndex = 0;

  // Regex pour DD/MM/YYYY ou DD-MM-YYYY ou YYYY-MM-DD ou YYYY-YYYY (avec support espaces et tirets)
  const regex =
    /\b((\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}))|((\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2}))|((\d{4})\s?[-–]\s?(\d{4}))\b/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Ajouter le texte avant le match
    const preText = text.substring(lastIndex, match.index);
    if (preText) {
      segments.push({
        originalStart: lastIndex,
        originalLength: preText.length,
        spokenStart: spokenText.length,
        spokenLength: preText.length,
        isModified: false,
      });
      spokenText += preText;
    }

    if (match[9]) {
      // Cas YYYY-YYYY
      const startYear = match[10];
      const endYear = match[11];
      const replacement = `${startYear} à ${endYear}`;

      segments.push({
        originalStart: match.index,
        originalLength: match[0].length,
        spokenStart: spokenText.length,
        spokenLength: replacement.length,
        isModified: true,
      });
      spokenText += replacement;
      lastIndex = match.index + match[0].length;
    } else {
      let day, month, year;
      if (match[2]) {
        // DD/MM/YYYY
        day = match[2];
        month = match[3];
        year = match[4];
      } else {
        // YYYY-MM-DD
        year = match[6];
        month = match[7];
        day = match[8];
      }

      const m = parseInt(month, 10);
      if (m >= 1 && m <= 12) {
        // Convertir la date
        let d = parseInt(day, 10);
        const dayStr = d === 1 ? "premier" : d.toString();
        const replacement = `${dayStr} ${months[m - 1]} ${year}`;

        segments.push({
          originalStart: match.index,
          originalLength: match[0].length,
          spokenStart: spokenText.length,
          spokenLength: replacement.length,
          isModified: true,
        });
        spokenText += replacement;
      } else {
        // Date invalide (mois hors limites), on garde le texte original
        segments.push({
          originalStart: match.index,
          originalLength: match[0].length,
          spokenStart: spokenText.length,
          spokenLength: match[0].length,
          isModified: false,
        });
        spokenText += match[0];
      }
      lastIndex = match.index + match[0].length;
    }
  }

  // Ajouter le reste du texte
  const remaining = text.substring(lastIndex);
  if (remaining) {
    segments.push({
      originalStart: lastIndex,
      originalLength: remaining.length,
      spokenStart: spokenText.length,
      spokenLength: remaining.length,
      isModified: false,
    });
    spokenText += remaining;
  }

  // Si aucun segment (texte vide ou sans date), on crée un segment par défaut
  if (segments.length === 0 && text.length > 0) {
    return {
      spokenText: text,
      segments: [
        {
          originalStart: 0,
          originalLength: text.length,
          spokenStart: 0,
          spokenLength: text.length,
          isModified: false,
        },
      ],
    };
  }

  return { spokenText: spokenText || text, segments };
};

export default function Karaoke() {
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const blocksRef = useRef<HTMLElement[]>([]);
  const currentWordSpanRef = useRef<HTMLSpanElement | null>(null);

  // Initialiser les voix
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Préférer une voix française
      const frVoice = availableVoices.find((v) => v.lang.startsWith("fr"));
      if (frVoice) setSelectedVoice(frVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Identifier les blocs de texte
  useEffect(() => {
    if (isActive) {
      // Détecter le conteneur visible
      let container = document.getElementById("doc-container");
      const mobileContainer = document.getElementById("mobile-reader");

      // Vérifier si le conteneur mobile est visible (display block ou flex)
      if (
        mobileContainer &&
        window.getComputedStyle(mobileContainer).display !== "none"
      ) {
        container = mobileContainer;
      }

      if (container) {
        // Sélectionner les éléments de texte significatifs
        // Note: Sur mobile, cela sélectionnera tous les éléments de toutes les pages chargées
        const elements = container.querySelectorAll(
          "p, h1, h2, h3, h4, h5, h6, li, blockquote"
        );
        blocksRef.current = Array.from(elements) as HTMLElement[];
      }
    } else {
      stopReading();
    }
  }, [isActive]);

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentBlockIndex(-1);
    clearHighlight();
  };

  const clearHighlight = () => {
    // Supprimer les spans de surbrillance s'il y en a
    if (currentWordSpanRef.current) {
      const parent = currentWordSpanRef.current.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(currentWordSpanRef.current.textContent || ""),
          currentWordSpanRef.current
        );
        parent.normalize(); // Fusionner les nœuds texte adjacents
      }
      currentWordSpanRef.current = null;
    }

    // Retirer la classe active du bloc
    blocksRef.current.forEach((block) =>
      block.classList.remove("karaoke-active-block")
    );
  };

  const highlightWord = (
    block: HTMLElement,
    charIndex: number,
    charLength: number
  ) => {
    const textNodes = getTextNodes(block);
    let currentLength = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;

    // Find start
    for (const node of textNodes) {
      const nodeLength = node.textContent?.length || 0;
      if (currentLength + nodeLength > charIndex) {
        startNode = node;
        startOffset = charIndex - currentLength;
        break;
      }
      currentLength += nodeLength;
    }

    if (!startNode) return;

    // Find end
    const endIndex = charIndex + charLength;
    currentLength = 0;
    for (const node of textNodes) {
      const nodeLength = node.textContent?.length || 0;
      if (currentLength + nodeLength >= endIndex) {
        endNode = node;
        endOffset = endIndex - currentLength;
        break;
      }
      currentLength += nodeLength;
    }

    if (startNode && endNode) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Scroll vers le mot si nécessaire (optionnel, peut être distrayant)
      // if (startNode.parentElement) {
      //    startNode.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // }
    }
  };

  const getTextNodes = (node: Node): Node[] => {
    const textNodes: Node[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else {
      for (const child of Array.from(node.childNodes)) {
        textNodes.push(...getTextNodes(child));
      }
    }
    return textNodes;
  };

  const readBlock = (index: number) => {
    if (index >= blocksRef.current.length) {
      stopReading();
      return;
    }

    const block = blocksRef.current[index];
    setCurrentBlockIndex(index);

    // Surligner le bloc actif
    blocksRef.current.forEach((b) =>
      b.classList.remove("karaoke-active-block")
    );
    block.classList.add("karaoke-active-block");
    block.scrollIntoView({ behavior: "smooth", block: "center" });

    const originalText = block.textContent || "";
    // Préparer le texte pour la lecture (normalisation des dates)
    const { spokenText, segments } = prepareTextForSpeech(originalText);

    const utterance = new SpeechSynthesisUtterance(spokenText);

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.lang = "fr-FR";

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const wordStart = event.charIndex;
        // Trouver la longueur du mot dans le texte parlé
        const nextSpace = spokenText.indexOf(" ", wordStart);
        const wordLength =
          nextSpace === -1
            ? spokenText.length - wordStart
            : nextSpace - wordStart;

        // Mapper vers le texte original
        let originalIndex = wordStart;
        let originalLen = wordLength;

        // Trouver le segment correspondant
        for (const seg of segments) {
          if (
            wordStart >= seg.spokenStart &&
            wordStart < seg.spokenStart + seg.spokenLength
          ) {
            if (seg.isModified) {
              // Si c'est une date modifiée, on surligne toute la date originale
              originalIndex = seg.originalStart;
              originalLen = seg.originalLength;
            } else {
              // Mapping linéaire pour le texte normal
              originalIndex = seg.originalStart + (wordStart - seg.spokenStart);
              // La longueur reste la même
            }
            break;
          }
        }

        highlightWord(block, originalIndex, originalLen);
      }
    };

    utterance.onend = () => {
      readBlock(index + 1);
    };

    utterance.onerror = (e) => {
      console.error("Erreur TTS", e);
      stopReading();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
        readBlock(currentBlockIndex === -1 ? 0 : currentBlockIndex);
      }
    }
  };

  const handleStop = () => {
    stopReading();
    window.getSelection()?.removeAllRanges();
  };

  return (
    <>
      <button
        className={`karaoke-trigger ${isActive ? "active" : ""}`}
        onClick={() => setIsActive(!isActive)}
        title="Mode Lecture Audio (Karaoké)"
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
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
      </button>

      {isActive &&
        createPortal(
          <div className="karaoke-panel">
            <div className="karaoke-controls">
              <button onClick={togglePlay} className="karaoke-btn main">
                {isPlaying ? (
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
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
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
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>

              <button onClick={handleStop} className="karaoke-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16"></rect>
                </svg>
              </button>

              <div className="karaoke-settings">
                <select
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="karaoke-select"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
            <button
              className="karaoke-close"
              onClick={() => {
                handleStop();
                setIsActive(false);
              }}
            >
              ✕
            </button>
          </div>,
          document.body
        )}

      <style>{`
        .karaoke-trigger {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          color: #333;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .karaoke-trigger:hover {
          transform: scale(1.05);
          background: #f8f9fa;
        }

        .karaoke-trigger.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .karaoke-panel {
          position: fixed;
          bottom: 6rem;
          right: 2rem;
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 2000;
          animation: slideUp 0.3s ease;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .karaoke-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .karaoke-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .karaoke-btn:hover {
          background: #e5e7eb;
        }

        .karaoke-btn.main {
          background: #2563eb;
          color: white;
          width: 48px;
          height: 48px;
        }

        .karaoke-btn.main:hover {
          background: #1d4ed8;
          transform: scale(1.05);
        }

        .karaoke-select {
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .karaoke-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1.2rem;
        }

        .karaoke-close:hover {
          color: #ef4444;
        }

        .karaoke-active-block {
          background-color: rgba(37, 99, 235, 0.05);
          border-radius: 4px;
          transition: background-color 0.3s;
        }

        /* Style de la sélection pour le karaoké */
        ::selection {
          background-color: #fde047; /* Jaune */
          color: black;
        }
      `}</style>
    </>
  );
}
