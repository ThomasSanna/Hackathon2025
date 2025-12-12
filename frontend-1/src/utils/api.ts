/**
 * Configuration et fonctions pour communiquer avec le backend FastAPI
 */

// URL de base de l'API backend
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Types pour les requêtes et réponses
 */

// OCR
export interface OCRResponse {
  success: boolean;
  message: string;
  data: {
    output_dir: string;
    markdown_files: string[];
    metadata_path: string;
    total_pages: number;
    total_images: number;
    document_annotation?: any;
    analysis?: {
      summary: string;
      mindmap: any;
      metrics: {
        n_clusters: number;
        [key: string]: any;
      };
      files: any;
    };
    analysis_error?: string;
  };
}

// Commande vocale
export interface VoiceCommandRequest {
  command: string;
  config?: Record<string, any>;
}

export interface VoiceCommandResponse {
  action: string;
  parameters: Record<string, any>;
  updated_config: Record<string, any>;
  message: string;
}

// Statistiques de texte
export interface TextAnalysisRequest {
  texte: string;
}

export interface TextAnalysisResponse {
  success: boolean;
  data: {
    stats_base: {
      nombre_caracteres: number;
      nombre_caracteres_hors_espaces: number;
      nombre_mots: number;
      nombre_phrases: number;
      nombre_paragraphes: number;
      nombre_lignes: number;
    };
    stats_lecture: {
      temps_lecture_min: number;
      temps_lecture_moyen: number;
      temps_lecture_max: number;
      mots_par_minute_min: number;
      mots_par_minute_moyen: number;
      mots_par_minute_max: number;
    };
    complexite: {
      longueur_moyenne_mots: number;
      longueur_moyenne_phrases: number;
      mots_complexes: number;
      pourcentage_mots_complexes: number;
      indice_facilite_lecture: number;
      niveau_lecture: string;
    };
    distribution: {
      top_10_mots: Array<[string, number]>;
      distribution_longueur_mots: Record<string, number>;
    };
  };
}

// Wikipedia
export interface WikipediaSearchRequest {
  nom: string;
  langue?: string;
}

export interface WikipediaSearchResponse {
  success: boolean;
  data?: {
    titre: string;
    description: string;
    url: string;
    images: string[];
    categories: string[];
    langue: string;
    contenu_complet_disponible: boolean;
  };
  error?: string;
  message?: string;
  options?: string[];
  suggestions?: string[];
  suggestion?: string;
}

/**
 * Fonction utilitaire pour gérer les erreurs HTTP
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: `Erreur HTTP: ${response.status} ${response.statusText}`
    }));
    throw new Error(errorData.detail || errorData.message || `Erreur ${response.status}`);
  }
  return response.json();
}

/**
 * API pour l'OCR de documents PDF
 */
export const OCRApi = {
  /**
   * Traiter un fichier PDF avec OCR
   */
  async processPDF(
    file: File,
    options?: {
      use_bbox_annotation?: boolean;
      use_document_annotation?: boolean;
      max_pages?: number;
      generate_analysis?: boolean;
    }
  ): Promise<OCRResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Ajouter les options si fournies
    if (options?.use_bbox_annotation !== undefined) {
      formData.append('use_bbox_annotation', String(options.use_bbox_annotation));
    }
    if (options?.use_document_annotation !== undefined) {
      formData.append('use_document_annotation', String(options.use_document_annotation));
    }
    if (options?.max_pages !== undefined) {
      formData.append('max_pages', String(options.max_pages));
    }
    if (options?.generate_analysis !== undefined) {
      formData.append('generate_analysis', String(options.generate_analysis));
    }

    const response = await fetch(`${API_BASE_URL}/api/ocr/process`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<OCRResponse>(response);
  },
};

/**
 * API pour les commandes vocales
 */
export const VoiceApi = {
  /**
   * Traiter une commande vocale
   */
  async processCommand(request: VoiceCommandRequest): Promise<VoiceCommandResponse> {
    const response = await fetch(`${API_BASE_URL}/api/voice-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleResponse<VoiceCommandResponse>(response);
  },
};

/**
 * API pour les statistiques de lecture
 */
export const StatsApi = {
  /**
   * Analyser un texte et obtenir des statistiques
   */
  async analyzeText(texte: string): Promise<TextAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stats/analyse-texte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texte }),
    });

    return handleResponse<TextAnalysisResponse>(response);
  },
};

/**
 * API pour Wikipedia
 */
export const WikipediaApi = {
  /**
   * Rechercher sur Wikipedia
   */
  async search(request: WikipediaSearchRequest): Promise<WikipediaSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wikipedia/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: request.nom,
        langue: request.langue || 'fr',
      }),
    });

    return handleResponse<WikipediaSearchResponse>(response);
  },
};

/**
 * Fonction pour vérifier si le backend est accessible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend non accessible:', error);
    return false;
  }
}
