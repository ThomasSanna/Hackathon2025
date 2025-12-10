// En gros c'est ici qu'on définit la structure de nos fichiers/dossiers
export interface FileItem {
  id: string; // Identifiant unique
  name: string; // Nom du fichier/dossier
  type: 'file' | 'folder'; // C'est un fichier ou un dossier ?
  parentId: string | null; // L'ID du dossier parent (null si à la racine)
  size?: number; // Taille en octets (que pour les fichiers)
  fileType?: 'text' | 'pdf' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'file'; // Type spécifique de fichier
  createdAt: string; // Date de création (format ISO)
  modifiedAt: string; // Date de dernière modification (format ISO)
}

// Pour le fil d'ariane (breadcrumb)
export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// Les différents modes d'affichage possibles
export type ViewMode = 'grid' | 'list'; // Grille ou liste
export type SortBy = 'name' | 'date' | 'size' | 'type'; // Critères de tri
export type SortOrder = 'asc' | 'desc'; // Ordre croissant ou décroissant
