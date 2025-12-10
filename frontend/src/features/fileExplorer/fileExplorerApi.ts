/// <reference types="vite/client" />
import { FileItem } from './fileExplorerTypes';

// Configuration de l'API - l'URL vient de la variable d'environnement ou localhost par défaut
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Convertit la réponse de l'API backend en objet FileItem qu'on utilise dans le frontend
const mapApiResponseToFileItem = (apiItem: any): FileItem => {
  // En gros on détermine le type de fichier selon l'extension
  const getFileType = (filename: string): FileItem['fileType'] => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'txt': case 'md': return 'text';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
      case 'zip': case 'rar': case '7z': return 'archive';
      case 'mp3': case 'wav': case 'flac': return 'audio';
      case 'mp4': case 'avi': case 'mkv': return 'video';
      case 'js': case 'ts': case 'html': case 'css': return 'code';
      default: return 'file';
    }
  };

  // On transforme les noms de propriétés du backend (snake_case) vers notre format (camelCase)
  return {
    id: apiItem.id,
    name: apiItem.name,
    type: apiItem.type,
    parentId: apiItem.parent_id || null,
    size: apiItem.size,
    fileType: apiItem.type === 'file' ? getFileType(apiItem.name) : undefined,
    createdAt: apiItem.created_at,
    modifiedAt: apiItem.modified_at || apiItem.created_at,
  };
};

// Fonctions pour communiquer avec le vrai backend FastAPI
export const fileExplorerApi = {
  // Liste tous les fichiers/dossiers d'un répertoire
  listFiles: async (parentId: string | null = null): Promise<FileItem[]> => {
    const params = new URLSearchParams();
    if (parentId) params.append('parent_id', parentId); // On ajoute le parent_id que si il existe
    
    const response = await fetch(`${API_BASE_URL}/files?${params}`);
    if (!response.ok) throw new Error('Impossible de récupérer les fichiers');
    
    const data = await response.json();
    return data.map(mapApiResponseToFileItem); // On transforme chaque item
  },

  // Récupère un fichier/dossier spécifique
  getFile: async (id: string): Promise<FileItem | undefined> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`);
    if (!response.ok) return undefined;
    
    const data = await response.json();
    return mapApiResponseToFileItem(data);
  },

  // Upload un fichier
  uploadFile: async (file: File, parentId: string | null): Promise<FileItem> => {
    const formData = new FormData(); // On utilise FormData pour envoyer des fichiers
    formData.append('file', file);
    if (parentId) formData.append('parent_id', parentId);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('L\'upload a foiré');
    
    const data = await response.json();
    return mapApiResponseToFileItem(data);
  },

  // Télécharge un fichier
  downloadFile: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}/download`);
    if (!response.ok) throw new Error('Échec du téléchargement');
    
    return await response.blob(); // On récupère le contenu binaire du fichier
  },

  // Crée un dossier
  createFolder: async (name: string, parentId: string | null): Promise<FileItem> => {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        parent_id: parentId,
      }),
    });

    if (!response.ok) throw new Error('Impossible de créer le dossier');
    
    const data = await response.json();
    return mapApiResponseToFileItem(data);
  },

  // Renomme un fichier/dossier
  rename: async (id: string, newName: string): Promise<FileItem> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) throw new Error('Le renommage a planté');
    
    const data = await response.json();
    return mapApiResponseToFileItem(data);
  },

  // Supprime un fichier/dossier
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('La suppression a merdé');
  },

  // Déplace un fichier/dossier
  move: async (id: string, newParentId: string | null): Promise<FileItem> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: newParentId }),
    });

    if (!response.ok) throw new Error('Le déplacement a pas marché');
    
    const data = await response.json();
    return mapApiResponseToFileItem(data);
  },
};
