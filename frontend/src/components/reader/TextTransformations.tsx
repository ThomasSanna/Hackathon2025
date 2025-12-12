import { useEffect, useRef, useCallback } from "react";
import { usePersonnalisationStore } from "../../stores/personnalisationStore";

// Cache pour les vérifications de noms propres via API
const properNounCache = new Map<string, boolean>();
const pendingChecks = new Map<string, Promise<boolean>>();

/**
 * Vérifie si un mot est un nom propre (non trouvé dans le dictionnaire)
 */
async function isProperNoun(word: string): Promise<boolean> {
  const cleanWord = word
    .toLowerCase()
    .replace(/[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ-]/g, "");

  if (!cleanWord || cleanWord.length < 2) return false;

  // Vérifier le cache
  if (properNounCache.has(cleanWord)) {
    return properNounCache.get(cleanWord)!;
  }

  // Éviter les doublons de requêtes
  if (pendingChecks.has(cleanWord)) {
    return pendingChecks.get(cleanWord)!;
  }

  const checkPromise = (async () => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(
          cleanWord
        )}`
      );

      // Si le mot existe dans le dictionnaire, ce n'est PAS un nom propre
      const isInDictionary = response.ok;
      const isProper = !isInDictionary;

      properNounCache.set(cleanWord, isProper);
      pendingChecks.delete(cleanWord);

      return isProper;
    } catch {
      pendingChecks.delete(cleanWord);
      return false;
    }
  })();

  pendingChecks.set(cleanWord, checkPromise);
  return checkPromise;
}

/**
 * Script qui applique les transformations de texte côté client
 * basé sur les paramètres du store Zustand
 */
export default function TextTransformations() {
  const { segmentation_syllabique, phonemes_actifs, dyslexie, semantique } =
    usePersonnalisationStore();

  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Éviter les traitements simultanés
    if (isProcessingRef.current) return;

    // Cette fonction applique les transformations de texte
    const applyTransformations = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const pageContents = document.querySelectorAll(".page-content");

      for (const content of pageContents) {
        // Restaurer le texte original s'il existe
        const originalContent = (content as any).__originalHTML;
        if (originalContent) {
          content.innerHTML = originalContent;
        } else {
          // Sauvegarder le contenu original
          (content as any).__originalHTML = content.innerHTML;
        }

        // Si aucune transformation n'est active, on arrête
        if (
          !segmentation_syllabique &&
          !phonemes_actifs &&
          !dyslexie.lettres_muettes &&
          !dyslexie.alternement_typo &&
          !dyslexie.soulignement_syllabes &&
          !semantique.nom_propre &&
          !semantique.date_chiffre &&
          !semantique.mot_long
        ) {
          continue;
        }

        // Collecter les mots potentiellement propres pour vérification API
        const potentialProperNouns: string[] = [];
        if (semantique.nom_propre) {
          const textContent = content.textContent || "";
          const words = textContent.split(/\s+/);

          words.forEach((word, idx) => {
            // Mot commençant par majuscule, pas en début de phrase
            const cleanWord = word.replace(
              /[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ-]/g,
              ""
            );
            if (
              /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/.test(cleanWord) &&
              cleanWord.length > 1 &&
              idx > 0 // Pas le premier mot
            ) {
              // Vérifier que le mot précédent ne finit pas par . ! ?
              const prevWord = words[idx - 1] || "";
              if (!/[.!?]$/.test(prevWord)) {
                potentialProperNouns.push(cleanWord);
              }
            }
          });
        }

        // Vérifier les noms propres via API (limité à 20 mots uniques)
        const uniqueProperNouns = [...new Set(potentialProperNouns)].slice(
          0,
          20
        );
        const confirmedProperNouns = new Set<string>();

        if (uniqueProperNouns.length > 0) {
          // Vérifier en parallèle par batch de 3
          for (let i = 0; i < uniqueProperNouns.length; i += 3) {
            const batch = uniqueProperNouns.slice(i, i + 3);
            const results = await Promise.all(
              batch.map(async (word) => {
                const isProper = await isProperNoun(word);
                return { word, isProper };
              })
            );
            results.forEach(({ word, isProper }) => {
              if (isProper) {
                confirmedProperNouns.add(word.toLowerCase());
              }
            });
          }
        }

        // Parcourir tous les nœuds texte
        const walker = document.createTreeWalker(
          content,
          NodeFilter.SHOW_TEXT,
          null
        );

        const textNodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.trim()) {
            textNodes.push(node as Text);
          }
        }

        textNodes.forEach((textNode) => {
          const text = textNode.nodeValue || "";
          const parent = textNode.parentNode;

          if (
            !parent ||
            parent.nodeName === "SCRIPT" ||
            parent.nodeName === "STYLE"
          ) {
            return;
          }

          // Créer un span avec le texte transformé
          const span = document.createElement("span");
          span.innerHTML = transformText(text, {
            segmentation: segmentation_syllabique,
            alternement: dyslexie.alternement_typo,
            soulignement: dyslexie.soulignement_syllabes,
            phonemes: phonemes_actifs,
            phonemesConfig: dyslexie.phonemes,
            lettresMuettes: dyslexie.lettres_muettes,
            nomPropre: semantique.nom_propre,
            confirmedProperNouns,
            dateChiffre: semantique.date_chiffre,
            motLong: semantique.mot_long,
          });

          parent.replaceChild(span, textNode);
        });
      }

      isProcessingRef.current = false;
    };

    // Debounce pour éviter trop de requêtes
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(applyTransformations, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [segmentation_syllabique, phonemes_actifs, dyslexie, semantique]);

  return null;
}

// ==========================================
// UTILITAIRES DE TRANSFORMATION
// ==========================================

interface TransformOptions {
  segmentation: boolean;
  alternement: boolean;
  soulignement: boolean;
  phonemes: boolean;
  phonemesConfig: Record<string, { couleur: string; actif: boolean }>;
  lettresMuettes: boolean;
  nomPropre: boolean;
  confirmedProperNouns: Set<string>;
  dateChiffre: boolean;
  motLong: boolean;
}

const voyelles = "aeiouyàâäéèêëïîôùûüœæAEIOUYÀÂÄÉÈÊËÏÎÔÙÛÜŒÆ";
const consonnes = "bcdfghjklmnpqrstvwxzçBCDFGHJKLMNPQRSTVWXZÇ";

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

    // Règles de syllabation simplifiées
    if (
      voyelles.toLowerCase().includes(char) &&
      consonnes.toLowerCase().includes(nextChar) &&
      voyelles.toLowerCase().includes(nextNextChar)
    ) {
      syllabes.push(current);
      current = "";
    } else if (
      voyelles.toLowerCase().includes(char) &&
      consonnes.toLowerCase().includes(nextChar) &&
      consonnes.toLowerCase().includes(nextNextChar)
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
 * Patterns pour les phonèmes
 */
const phonemePatterns: Record<string, RegExp> = {
  eau: /eau/gi,
  au: /au(?!x)/gi,
  ou: /ou/gi,
  oi: /oi/gi,
  an: /an(?![nt]e?s?$)/gi,
  en: /en(?![nt]e?s?$)/gi,
  on: /on(?![nt]e?s?$)/gi,
  in: /in(?![nt]e?s?$)/gi,
  ai: /ai/gi,
  ei: /ei/gi,
  eu: /eu/gi,
  ui: /ui/gi,
  gn: /gn/gi,
  ill: /ill/gi,
};

/**
 * Transforme le texte selon les options
 */
function transformText(text: string, options: TransformOptions): string {
  const words = text.split(/(\s+)/);
  let isStartOfSentence = true;

  return words
    .map((word) => {
      // Espaces et ponctuation: ne pas transformer
      if (/^\s+$/.test(word)) {
        return word;
      }

      // Vérifier si c'est une fin de phrase
      const endsWithPunctuation = /[.!?]$/.test(word);

      let result = word;

      // Flag pour savoir si on a déjà appliqué du HTML
      let hasHtmlTransform = false;

      // ============================================
      // PHONÈMES - Traiter EN PREMIER sur le mot brut
      // ============================================
      if (options.phonemes && !hasHtmlTransform) {
        const activePhonemes = Object.entries(options.phonemesConfig)
          .filter(([, config]) => config.actif)
          .map(([phoneme, config]) => ({
            phoneme,
            config,
            pattern: phonemePatterns[phoneme],
          }))
          .filter((p) => p.pattern);

        if (activePhonemes.length > 0) {
          interface PhonemeMatch {
            start: number;
            end: number;
            phoneme: string;
            couleur: string;
            text: string;
          }

          const matches: PhonemeMatch[] = [];

          for (const { phoneme, config, pattern } of activePhonemes) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(word)) !== null) {
              matches.push({
                start: match.index,
                end: match.index + match[0].length,
                phoneme,
                couleur: config.couleur,
                text: match[0],
              });
            }
          }

          matches.sort((a, b) => a.start - b.start || b.end - a.end);

          const filteredMatches: PhonemeMatch[] = [];
          let lastEnd = -1;
          for (const m of matches) {
            if (m.start >= lastEnd) {
              filteredMatches.push(m);
              lastEnd = m.end;
            }
          }

          if (filteredMatches.length > 0) {
            let newResult = "";
            let currentPos = 0;

            for (const m of filteredMatches) {
              if (m.start > currentPos) {
                newResult += word.slice(currentPos, m.start);
              }
              newResult += `<span class="phoneme phoneme-${m.phoneme}" style="background-color: ${m.couleur}30; color: ${m.couleur};">${m.text}</span>`;
              currentPos = m.end;
            }

            if (currentPos < word.length) {
              newResult += word.slice(currentPos);
            }

            result = newResult;
            hasHtmlTransform = true;
          }
        }
      }

      // ============================================
      // SEGMENTATION SYLLABIQUE - Seulement si pas déjà de HTML
      // ============================================
      if (
        !hasHtmlTransform &&
        (options.segmentation || options.alternement || options.soulignement) &&
        /^[a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]+$/.test(word) &&
        word.length > 2
      ) {
        const syllabes = syllabify(word);
        result = syllabes
          .map((syllabe, idx) => {
            const classes: string[] = ["syllabe"];

            if (options.segmentation) {
              classes.push(idx % 2 === 0 ? "syllabe-pair" : "syllabe-impair");
            }
            if (options.alternement) {
              classes.push(idx % 2 === 0 ? "syllabe-bold" : "syllabe-normal");
            }
            if (options.soulignement) {
              classes.push("syllabe-underline");
              classes.push(
                idx % 2 === 0 ? "syllabe-underline-1" : "syllabe-underline-2"
              );
            }

            return `<span class="${classes.join(" ")}">${syllabe}</span>`;
          })
          .join("");
        hasHtmlTransform = true;
      }

      // ============================================
      // WRAPPERS (peuvent envelopper le HTML existant)
      // ============================================

      // Nom propre (vérifié via API - pas dans le dictionnaire)
      if (
        options.nomPropre &&
        /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/.test(word) &&
        word.length > 1
      ) {
        const cleanWord = word
          .replace(/[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ-]/g, "")
          .toLowerCase();
        if (options.confirmedProperNouns.has(cleanWord)) {
          result = `<span class="nom-propre">${result}</span>`;
        }
      }

      // Dates et chiffres
      if (options.dateChiffre && /\d/.test(word)) {
        result = `<span class="date-chiffre">${result}</span>`;
      }

      // Mots longs - seulement les vrais mots (lettres uniquement, pas de chiffres ni caractères spéciaux)
      const lettersOnly = word.replace(
        /[^a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]/g,
        ""
      );
      // Vérifier que c'est un vrai mot : que des lettres, pas de chiffres, pas d'URL, etc.
      const isRealWord = /^[a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ]+$/.test(
        word.replace(/[.,;:!?'"()-]/g, "")
      );
      if (options.motLong && lettersOnly.length > 8 && isRealWord) {
        result = `<span class="mot-long">${result}</span>`;
      }

      // Lettres muettes (e final après consonne)
      if (options.lettresMuettes && /[bcdfghjklmnpqrstvwxz]e$/i.test(word)) {
        result = result.replace(
          /e(<\/span>)?$/i,
          '<span class="lettre-muette">e</span>$1'
        );
      }

      // Mettre à jour isStartOfSentence pour le prochain mot
      isStartOfSentence = endsWithPunctuation;

      return result;
    })
    .join("");
}
