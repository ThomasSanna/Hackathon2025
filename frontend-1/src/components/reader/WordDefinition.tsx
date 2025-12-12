import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";
import { X, Volume2, BookOpen, Globe, ExternalLink } from "lucide-react";

interface Translation {
  lang: string;
  code: string;
  text: string;
}

interface DefinitionData {
  word: string;
  definition: string;
  fullDefinitionUrl: string;
  translations: Translation[];
  hasMore: boolean;
}

interface PopupPosition {
  x: number;
  y: number;
}

async function googleDict(word: string, from = "fr", to = "en") {
  const url = "https://translate.googleapis.com/translate_a/single?" + new URLSearchParams({
    client: "gtx",
    sl: from,
    tl: to,
    dt: "t", // 't' for simple translation, 'bd' returns dict info but user request implies translation
    q: word
  });

  const res = await fetch(url);
  const data = await res.json();
  // With dt='t', data[0][0][0] is the translation
  if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
  }
  return null;
}

// Mots à ignorer (déterminants, prépositions, etc.)
const STOP_WORDS = new Set([
  "le", "la", "les", "l", "un", "une", "des", "du", "de", "d", "au", "aux",
  "ce", "cet", "cette", "ces",
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "mon", "ton", "son", "ma", "ta", "sa", "mes", "tes", "ses", "notre", "votre", "leur", "nos", "vos", "leurs",
  "qui", "que", "quoi", "dont", "où",
  "et", "ou", "ni", "mais", "car", "or", "donc",
  "à", "en", "dans", "par", "pour", "sur", "sous", "vers", "avec", "sans", "LE", "LA", "LES", "L", "UN", "UNE", "DES", "DU", "DE", "D", "AU", "AUX",
"CE", "CET", "CETTE", "CES",
"JE", "TU", "IL", "ELLE", "ON", "NOUS", "VOUS", "ILS", "ELLES",
"MON", "TON", "SON", "MA", "TA", "SA", "MES", "TES", "SES", "NOTRE", "VOTRE", "LEUR", "NOS", "VOS", "LEURS",
"QUI", "QUE", "QUOI", "DONT", "OÙ",
"ET", "OU", "NI", "MAIS", "CAR", "OR", "DONC",
"À", "EN", "DANS", "PAR", "POUR", "SUR", "SOUS", "VERS", "AVEC", "SANS"

]);

/**
 * Composant qui affiche la définition d'un mot au double-clic
 * Utilise CNRTL pour la définition et Google Translate pour les traductions
 */
export default function WordDefinition() {
  const theme = usePersonnalisationStore((state) => state.theme);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [data, setData] = useState<DefinitionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<PopupPosition>({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  /**
   * Récupère la définition et les traductions
   */
  const fetchData = useCallback(async (word: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const cleanWord = word.trim();
    
    if (!cleanWord || cleanWord.length < 2) {
      setError("Mot trop court");
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Translations
      const languages = [
        { code: "en", name: "Anglais" },
        { code: "es", name: "Espagnol" },
        { code: "de", name: "Allemand" },
        { code: "it", name: "Italien" }
      ];
      
      const translationPromises = languages.map(async (lang) => {
        try {
          const text = await googleDict(cleanWord, "fr", lang.code);
          return text ? { lang: lang.name, code: lang.code, text } : null;
        } catch (e) {
          return null;
        }
      });

      const translationsResults = await Promise.all(translationPromises);
      const translations = translationsResults.filter((t): t is Translation => t !== null);

      // 2. Fetch CNRTL Definition
      // Use proxy /api/cnrtl which maps to https://www.cnrtl.fr
      const cnrtlRes = await fetch(`/api/cnrtl/definition/${encodeURIComponent(cleanWord)}`);
      
      if (!cnrtlRes.ok) {
        throw new Error("Impossible de récupérer la définition");
      }

      const htmlText = await cnrtlRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      
      // Extract definition from .tlf_parah
      // Note: user said "div avec tlf_parah". 
      // CNRTL structure is properly usually inside #lexicographie or specific classes. 
      // The class often used for definition blocks in CNRTL (TLFi) is .tlf_cdefinition or similar, 
      // but user mentioned .tlf_parah. I will look for that or fallback to finding the definition container.
      // A common container in CNRTL for definition content is often just inside the main content structure.
      // Let's try to find elements that contain the definition text.
      // The user specifically said "la div avec tlf_parah".
      
      const contentDiv = doc.querySelector(".tlf_parah") || doc.querySelector("#lexicographie"); // Fallback
      
      let definitionText = "";
      if (contentDiv) {
         // Get text content, clean up excess whitespace
         const fullText = contentDiv.textContent || "";
         // Remove multiple spaces/newlines
         definitionText = fullText.replace(/\s+/g, " ").trim();
      } else {
        // Fallback: try to find the first substantial paragraph
         definitionText = "Définition non trouvée automatiquement. Veuillez consulter le site.";
      }

      // Format to 4 lines max roughly? 
      // Since we extracted plain text (spaces normalized), "lines" concept is vague.
      // We can take the first N characters or split by "A. -", "1.", etc if possible.
      // Or just take a reasonable length, e.g. 300 chars?
      // User said "4 premières lignes". In a responsive UI, lines depend on width.
      // But maybe they meant 4 lines of the logic text (e.g. 4 definitions?).
      // Let's truncate by length mostly for safety, or try to split by sentences.
      // A good heuristic for "4 lines" visually is about 300-400 chars.
      
      const maxLength = 350;
      const hasMore = definitionText.length > maxLength;
      const truncatedDefinition = hasMore 
        ? definitionText.substring(0, maxLength) + "..."
        : definitionText;

      setData({
        word: cleanWord,
        definition: truncatedDefinition,
        fullDefinitionUrl: `https://www.cnrtl.fr/definition/${encodeURIComponent(cleanWord)}`,
        translations,
        hasMore
      });

    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gère le double-clic sur un mot
   */
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const word = selection.toString().trim();
      const lowerWord = word.toLowerCase();
      
      // Ignorer les mots courts et les stop words
      if (!word || word.length < 2 || STOP_WORDS.has(lowerWord)) return;

      // Position du popup
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const containerRect = document.querySelector('.page-content')?.getBoundingClientRect() || { left: 0 };
      
      // Calculate position relative to viewport but stay within bounds
      // We'll use fixed positioning based on viewport coordinates from getBoundingClientRect
      setPosition({
        x: Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160),
        y: rect.bottom + 10,
      });

      setSelectedWord(word);
      fetchData(word);
    },
    [fetchData]
  );

  /**
   * Ferme le popup
   */
  const closePopup = useCallback(() => {
    setSelectedWord(null);
    setData(null);
    setError(null);
  }, []);

  /**
   * Ferme le popup si on clique en dehors
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };

    if (selectedWord) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedWord, closePopup]);

  /**
   * Ajoute l'écouteur de double-clic
   */
  useEffect(() => {
    const contentArea = document.querySelector(".page-content");
    if (contentArea) {
      contentArea.addEventListener(
        "dblclick",
        handleDoubleClick as EventListener
      );
    }

    return () => {
      if (contentArea) {
        contentArea.removeEventListener(
          "dblclick",
          handleDoubleClick as EventListener
        );
      }
    };
  }, [handleDoubleClick]);


  if (!selectedWord) return null;

  return (
    <div
      ref={popupRef}
      className="word-definition-popup"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: theme.couleur_fond,
        color: theme.couleur_texte,
        border: `1px solid ${theme.couleur_texte}20`,
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        padding: "1.25rem",
        width: "320px",
        maxHeight: "400px",
        overflowY: "auto",
        animation: "fadeInUp 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
          borderBottom: `1px solid ${theme.couleur_texte}10`,
          paddingBottom: "0.5rem"
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, textTransform: 'capitalize' }}>
            {selectedWord}
          </h3>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={closePopup}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: theme.couleur_texte,
              opacity: 0.7,
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      {loading && (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <div
            className="spinner"
            style={{
              width: "24px",
              height: "24px",
              border: `2px solid ${theme.couleur_texte}20`,
              borderTopColor: "var(--accent-color)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: "0.5rem", opacity: 0.7 }}>Recherche...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            background: `${theme.couleur_texte}05`,
            borderRadius: "8px",
          }}
        >
          <BookOpen
            size={32}
            style={{ opacity: 0.5, marginBottom: "0.5rem" }}
          />
          <p style={{ opacity: 0.7 }}>{error}</p>
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Translations */}
          {data.translations.length > 0 && (
            <div style={{ background: `${theme.couleur_texte}05`, padding: '0.75rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.8 }}>
                <Globe size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Traductions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {data.translations.map((t) => (
                  <div key={t.code} style={{ fontSize: '0.9rem' }}>
                    <span style={{ opacity: 0.6, fontSize: '0.8rem', marginRight: '4px' }}>{t.code.toUpperCase()}:</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Definition */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.8 }}>
              <BookOpen size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Définition (CNRTL)</span>
            </div>
            <p style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.5', 
              margin: 0,
              opacity: 0.9,
              textAlign: 'justify' 
            }}>
              {data.definition}
            </p>
            
            {/* Read more link */}
            {(data.hasMore || true) && (
              <a 
                href={data.fullDefinitionUrl}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '0.5rem',
                  color: 'var(--accent-color)',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Voir la suite <ExternalLink size={12} />
              </a>
            )}
          </div>

        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .word-definition-popup::-webkit-scrollbar {
          width: 6px;
        }
        
        .word-definition-popup::-webkit-scrollbar-thumb {
          background: ${theme.couleur_texte}30;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// ============================================
// UTILITAIRE: Vérifier si un mot est un nom propre
// ============================================

/**
 * Cache pour les vérifications de mots dans le dictionnaire
 */
const wordCache = new Map<string, boolean>();

/**
 * Vérifie si un mot existe dans le dictionnaire (donc n'est PAS un nom propre)
 * Retourne true si c'est probablement un nom propre (pas de définition CNRTL trouvée)
 */
export async function isProperNoun(word: string): Promise<boolean> {
  // Nettoyer le mot
  const cleanWord = word
    .replace(/[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ-]/g, "")
    .toLowerCase();

  if (!cleanWord || cleanWord.length < 2) return false;
  
  // Ignorer les stop words (ce ne sont pas des noms propres)
  if (STOP_WORDS.has(cleanWord)) return false;

  // Vérifier le cache
  if (wordCache.has(cleanWord)) {
    return wordCache.get(cleanWord)!;
  }

  try {
    // Vérifier en français avec CNRTL
    const response = await fetch(
      `/api/cnrtl/definition/${encodeURIComponent(cleanWord)}`
    );

    if (!response.ok) {
        // En cas d'erreur HTTP, on assume par défaut que ce n'est pas un nom propre pour éviter de tout casser
        // Ou l'inverse : si on ne peut pas vérifier, on le laisse tranquille ?
        // Pour l'instant, disons false (pas proper noun/pas traité) pour sécurité d'affichage
        return false; 
    }

    const html = await response.text();
    
    // CNRTL retourne souvent une page même pour des mots inconnus, mais avec un message d'erreur.
    // Cependant, le contenu utile est souvent dans "tlf_parah" ou "#lexicographie".
    // Si on trouve ces éléments avec du contenu substantiel, c'est un mot du dictionnaire.
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Vérifier la présence de contenu de définition
    const hasDefinition = !!(
      doc.querySelector(".tlf_parah") || 
      doc.querySelector("#lexicographie") || 
      // Parfois CNRTL redirige vers une suggestion ou affiche "Terme introuvable"
      (doc.body.textContent && doc.body.textContent.includes("Terme introuvable")) === false
    );
    
    // Si "Terme introuvable" est présent explicitement
    const notFoundText = doc.body.textContent?.includes("Terme introuvable") || 
                         doc.body.textContent?.includes("Erreur : Le terme");
                         
    const existsInDict = hasDefinition && !notFoundText;
    const isProper = !existsInDict;

    // Mettre en cache
    wordCache.set(cleanWord, isProper);

    return isProper;
  } catch (e) {
    // En cas d'erreur technique
    return false;
  }
}

/**
 * Vérifie plusieurs mots en batch (pour optimiser les requêtes)
 * Retourne un Set des mots qui sont des noms propres
 */
export async function checkProperNouns(words: string[]): Promise<Set<string>> {
  const properNouns = new Set<string>();

  // Filtrer les mots déjà en cache et ceux qui ne commencent pas par une majuscule
  const wordsToCheck = words.filter((word) => {
    const cleanWord = word.toLowerCase();

    // Déjà en cache
    if (wordCache.has(cleanWord)) {
      if (wordCache.get(cleanWord)) {
        properNouns.add(word);
      }
      return false;
    }

    return true;
  });

  // Limiter le nombre de requêtes simultanées
  // CNRTL peut être lent, soyons gentils avec le batch
  const batchSize = 3;
  for (let i = 0; i < wordsToCheck.length; i += batchSize) {
    const batch = wordsToCheck.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (word) => {
        const isProper = await isProperNoun(word);
        if (isProper) {
          properNouns.add(word);
        }
      })
    );

    // Petit délai pour ne pas surcharger le serveur
    if (i + batchSize < wordsToCheck.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return properNouns;
}
