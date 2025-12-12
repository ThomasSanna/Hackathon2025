/**
 * Store global pour l'application
 * Gère l'état des documents, statistiques, et configuration utilisateur
 */

import { atom } from 'nanostores';

/**
 * Types pour le store
 */

export interface Document {
  id: string;
  name: string;
  path: string;
  uploadDate: Date;
  totalPages: number;
  totalImages: number;
  hasAnalysis: boolean;
  metadata?: any;
}

export interface ReadingStats {
  totalDocuments: number;
  totalPagesRead: number;
  totalReadingTime: number;
  averageSpeed: number;
}

export interface UserConfig {
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  dyslexiaMode: boolean;
  highContrast: boolean;
  readingSpeed: number; // mots par minute
  language: 'fr' | 'en';
}

export interface AppState {
  documents: Document[];
  currentDocument: Document | null;
  readingStats: ReadingStats;
  config: UserConfig;
  isBackendConnected: boolean;
}

/**
 * Configuration par défaut
 */
const defaultConfig: UserConfig = {
  fontSize: 'medium',
  fontFamily: 'OpenDyslexic',
  dyslexiaMode: false,
  highContrast: false,
  readingSpeed: 200,
  language: 'fr',
};

const defaultReadingStats: ReadingStats = {
  totalDocuments: 0,
  totalPagesRead: 0,
  totalReadingTime: 0,
  averageSpeed: 200,
};

/**
 * État initial de l'application
 */
const initialState: AppState = {
  documents: [],
  currentDocument: null,
  readingStats: defaultReadingStats,
  config: defaultConfig,
  isBackendConnected: false,
};

/**
 * Store principal
 */
export const appStore = atom<AppState>(initialState);

/**
 * Actions pour manipuler le store
 */

// Documents
export function addDocument(doc: Document) {
  const state = appStore.get();
  appStore.set({
    ...state,
    documents: [...state.documents, doc],
    readingStats: {
      ...state.readingStats,
      totalDocuments: state.readingStats.totalDocuments + 1,
    },
  });
}

export function removeDocument(docId: string) {
  const state = appStore.get();
  appStore.set({
    ...state,
    documents: state.documents.filter(d => d.id !== docId),
    currentDocument: state.currentDocument?.id === docId ? null : state.currentDocument,
  });
}

export function setCurrentDocument(doc: Document | null) {
  const state = appStore.get();
  appStore.set({
    ...state,
    currentDocument: doc,
  });
}

// Configuration
export function updateConfig(partialConfig: Partial<UserConfig>) {
  const state = appStore.get();
  appStore.set({
    ...state,
    config: {
      ...state.config,
      ...partialConfig,
    },
  });
  
  // Sauvegarder dans localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('userConfig', JSON.stringify({
      ...state.config,
      ...partialConfig,
    }));
  }
}

export function loadConfig() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('userConfig');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        const state = appStore.get();
        appStore.set({
          ...state,
          config: { ...defaultConfig, ...config },
        });
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    }
  }
}

// Statistiques
export function updateReadingStats(partialStats: Partial<ReadingStats>) {
  const state = appStore.get();
  appStore.set({
    ...state,
    readingStats: {
      ...state.readingStats,
      ...partialStats,
    },
  });
}

export function incrementPagesRead(pages: number = 1) {
  const state = appStore.get();
  appStore.set({
    ...state,
    readingStats: {
      ...state.readingStats,
      totalPagesRead: state.readingStats.totalPagesRead + pages,
    },
  });
}

export function addReadingTime(minutes: number) {
  const state = appStore.get();
  const newTotalTime = state.readingStats.totalReadingTime + minutes;
  const totalPages = state.readingStats.totalPagesRead;
  
  appStore.set({
    ...state,
    readingStats: {
      ...state.readingStats,
      totalReadingTime: newTotalTime,
      averageSpeed: totalPages > 0 ? Math.round(totalPages / newTotalTime * 60) : 200,
    },
  });
}

// Backend connection
export function setBackendConnected(connected: boolean) {
  const state = appStore.get();
  appStore.set({
    ...state,
    isBackendConnected: connected,
  });
}

/**
 * Initialiser le store au chargement
 */
export function initStore() {
  loadConfig();
  
  // Charger les documents depuis localStorage si disponible
  if (typeof window !== 'undefined') {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      try {
        const documents = JSON.parse(savedDocs);
        const state = appStore.get();
        appStore.set({
          ...state,
          documents,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      }
    }
    
    // Charger les stats
    const savedStats = localStorage.getItem('readingStats');
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        const state = appStore.get();
        appStore.set({
          ...state,
          readingStats: { ...defaultReadingStats, ...stats },
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    }
  }
}

/**
 * Sauvegarder les documents dans localStorage
 */
export function saveDocuments() {
  if (typeof window !== 'undefined') {
    const state = appStore.get();
    localStorage.setItem('documents', JSON.stringify(state.documents));
  }
}

/**
 * Sauvegarder les stats dans localStorage
 */
export function saveStats() {
  if (typeof window !== 'undefined') {
    const state = appStore.get();
    localStorage.setItem('readingStats', JSON.stringify(state.readingStats));
  }
}
