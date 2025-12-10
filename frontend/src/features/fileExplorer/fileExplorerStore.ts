import { create } from 'zustand';
import { FileItem, ViewMode, SortBy, SortOrder } from './fileExplorerTypes';
// En gros ici on peut switcher entre les données de test et la vraie API
import { fileExplorerApi } from './fileExplorerApi.mock'; // Pour utiliser des données simulées en local
// import { fileExplorerApi } from './fileExplorerApi'; // Pour se connecter au vrai backend FastAPI

interface FileExplorerState {
  // Données de l'explorateur
  allItems: FileItem[]; // Tous les fichiers/dossiers chargés (on garde tout en mémoire pour éviter de refaire des requêtes)
  currentFolderId: string | null; // Le dossier actuel où on se trouve
  selectedIds: string[]; // Les fichiers qu'on a sélectionnés
  breadcrumbPath: FileItem[]; // Le chemin de navigation en cache (genre Accueil > Documents > Photos)
  
  // État de l'interface
  isLoading: boolean; // Pour afficher le loader quand ça charge
  viewMode: ViewMode; // Affichage en grille ou en liste
  sortBy: SortBy; // Par quoi on trie (nom, date, taille...)
  sortOrder: SortOrder; // Ordre croissant ou décroissant
  searchQuery: string; // Ce que l'utilisateur tape dans la recherche
  
  // Actions principales - en gros tout ce qu'on peut faire avec les fichiers
  loadFiles: (folderId: string | null) => Promise<void>; // Charge les fichiers d'un dossier
  navigateToFolder: (folderId: string | null) => void; // Pour aller dans un dossier
  navigateUp: () => void; // Remonte d'un niveau (genre bouton "retour")
  uploadFile: (file: File) => Promise<void>; // Upload un fichier
  createFolder: (name: string) => Promise<void>; // Crée un nouveau dossier
  renameItem: (id: string, newName: string) => Promise<void>; // Renomme un fichier ou dossier
  deleteItem: (id: string) => Promise<void>; // Supprime un fichier ou dossier
  moveItem: (id: string, newParentId: string | null) => Promise<void>; // Déplace un fichier
  
  // Gestion de la sélection
  toggleSelection: (id: string) => void; // Sélectionne/désélectionne un élément
  clearSelection: () => void; // Désélectionne tout
  
  // Actions d'interface
  setViewMode: (mode: ViewMode) => void; // Change le mode d'affichage
  toggleSortOrder: () => void; // Inverse l'ordre de tri
  setSearchQuery: (query: string) => void; // Met à jour la recherche
  
  // Fonctions utilitaires
  getCurrentItems: () => FileItem[]; // Récupère les éléments à afficher
  getBreadcrumbs: () => FileItem[]; // Récupère le fil d'ariane
  updateBreadcrumbs: () => void; // Reconstruit le fil d'ariane
}

export const useFileExplorerStore = create<FileExplorerState>((set: any, get: any) => ({
  // État initial au démarrage de l'appli
  allItems: [], // Au début on a rien chargé
  currentFolderId: null, // On commence à la racine
  selectedIds: [], // Rien de sélectionné
  breadcrumbPath: [], // Pas de chemin car on est à la racine
  isLoading: false,
  viewMode: 'grid', // Par défaut on affiche en grille
  sortBy: 'name', // On tri par nom au début
  sortOrder: 'asc', // Dans l'ordre alphabétique
  searchQuery: '', // Pas de recherche active

  // La fonction qui reconstruit le fil d'ariane (le chemin en haut de la page)
  updateBreadcrumbs: () => {
    const { allItems, currentFolderId } = get();
    const path: FileItem[] = [];
    let currentId = currentFolderId;

    // En gros on remonte de dossier en dossier jusqu'à la racine
    while (currentId) {
      const item = allItems.find((item: FileItem) => item.id === currentId);
      if (item) {
        path.unshift(item); // On ajoute au début pour avoir l'ordre correct
        currentId = item.parentId; // On remonte au parent
      } else {
        break; // Si on trouve pas le parent, on arrête (ça devrait pas arriver normalement)
      }
    }

    set({ breadcrumbPath: path });
  },

  // Charge les fichiers d'un dossier depuis l'API
  loadFiles: async (folderId: string | null) => {
    set({ isLoading: true, searchQuery: '' }); // On active le loader et on vide la recherche
    try {
      const items = await fileExplorerApi.listFiles(folderId);
      
      // Là je fais un merge intelligent : je garde les anciens items et j'ajoute juste les nouveaux
      // Comme ça on garde tout l'arbre en mémoire au lieu de tout recharger à chaque fois
      set((state: FileExplorerState) => {
        const existingIds = new Set(state.allItems.map(i => i.id));
        const newItems = items.filter(i => !existingIds.has(i.id)); // On prend que ce qui existe pas déjà
        return {
          allItems: [...state.allItems, ...newItems],
          currentFolderId: folderId,
          selectedIds: [], // On désélectionne tout quand on change de dossier
        };
      });
      
      get().updateBreadcrumbs(); // On met à jour le fil d'ariane
    } catch (error) {
      console.error('Erreur au chargement des fichiers:', error);
    } finally {
      set({ isLoading: false }); // On désactive le loader dans tous les cas
    }
  },

  // Navigue vers un dossier (simple wrapper qui appelle loadFiles)
  navigateToFolder: (folderId: string | null) => {
    get().loadFiles(folderId);
  },

  // Remonte d'un niveau dans l'arborescence (genre le bouton "retour")
  navigateUp: () => {
    const { breadcrumbPath } = get();
    if (breadcrumbPath.length > 0) {
      // Si on est dans un sous-dossier, on récupère le parent du dossier actuel
      const parentFolder = breadcrumbPath[breadcrumbPath.length - 1];
      get().navigateToFolder(parentFolder.parentId);
    } else {
      // Si on est déjà à la racine, on reste à la racine
      get().navigateToFolder(null);
    }
  },

  // Upload un fichier dans le dossier courant
  uploadFile: async (file: File) => {
    const { currentFolderId, loadFiles } = get();
    set({ isLoading: true });
    try {
      await fileExplorerApi.uploadFile(file, currentFolderId);
      await loadFiles(currentFolderId); // On recharge pour afficher le nouveau fichier
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Crée un nouveau dossier
  createFolder: async (name: string) => {
    const { currentFolderId, loadFiles } = get();
    set({ isLoading: true });
    try {
      await fileExplorerApi.createFolder(name, currentFolderId);
      await loadFiles(currentFolderId); // On recharge pour voir le nouveau dossier
    } catch (error) {
      console.error('Impossible de créer le dossier:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Renomme un fichier ou un dossier
  renameItem: async (id: string, newName: string) => {
    const { currentFolderId, loadFiles } = get();
    set({ isLoading: true });
    try {
      await fileExplorerApi.rename(id, newName);
      await loadFiles(currentFolderId); // On recharge pour voir le nouveau nom
    } catch (error) {
      console.error('Le renommage a foiré:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Supprime un fichier ou un dossier
  deleteItem: async (id: string) => {
    const { allItems } = get();
    set({ isLoading: true });
    try {
      await fileExplorerApi.delete(id);
      
      // Fonction récursive pour supprimer l'item et tous ses enfants de allItems
      const deleteRecursive = (itemId: string, items: FileItem[]): FileItem[] => {
        const item = items.find(i => i.id === itemId);
        if (!item) return items;
        
        // Si c'est un dossier, on supprime d'abord tous ses enfants
        let updatedItems = items;
        if (item.type === 'folder') {
          const children = items.filter(child => child.parentId === itemId);
          children.forEach(child => {
            updatedItems = deleteRecursive(child.id, updatedItems);
          });
        }
        
        // On supprime l'item lui-même
        return updatedItems.filter(i => i.id !== itemId);
      };
      
      const updatedItems = deleteRecursive(id, allItems);
      set({ allItems: updatedItems, selectedIds: [] });
    } catch (error) {
      console.error('La suppression a merdé:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Déplace un fichier ou dossier vers un autre endroit
  moveItem: async (id: string, newParentId: string | null) => {
    const { allItems } = get();
    set({ isLoading: true });
    try {
      await fileExplorerApi.move(id, newParentId);
      
      // On met à jour l'item dans allItems
      const updatedItems = allItems.map((item: FileItem) => {
        if (item.id === id) {
          return { ...item, parentId: newParentId, modifiedAt: new Date().toISOString() };
        }
        return item;
      });
      
      set({ allItems: updatedItems, selectedIds: [] });
    } catch (error) {
      console.error('Le déplacement a pas marché:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Gestion de la sélection des fichiers
  toggleSelection: (id: string) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      // Si c'est déjà sélectionné, on le retire
      set({ selectedIds: selectedIds.filter((selectedId: string) => selectedId !== id) });
    } else {
      // Sinon on l'ajoute
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  clearSelection: () => {
    set({ selectedIds: [] }); // On vide tout simplement
  },

  // Actions pour modifier l'interface
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode }); // Bascule entre grille et liste
  },

  toggleSortOrder: () => {
    set((state: FileExplorerState) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })); // Inverse l'ordre
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query }); // Met à jour la recherche
  },

  // Fonctions utilitaires pour récupérer les données
  getCurrentItems: () => {
    const { allItems, currentFolderId, searchQuery, sortBy, sortOrder } = get();
    
    // D'abord on récupère que les items du dossier actuel
    let items = allItems.filter((item: FileItem) => item.parentId === currentFolderId);
    
    // Si y'a une recherche active, on filtre par le nom
    if (searchQuery) {
      items = items.filter((item: FileItem) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Maintenant on trie tout ça
    const sorted = [...items].sort((a, b) => {
      // Règle importante : les dossiers sont toujours en premier, c'est plus logique
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;

      let comparison = 0;
      // En fonction du critère de tri choisi par l'utilisateur
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name); // Tri alphabétique
          break;
        case 'date':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(); // Tri par date
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0); // Tri par taille
          break;
        case 'type':
          comparison = (a.fileType || '').localeCompare(b.fileType || ''); // Tri par type
          break;
      }

      // Si l'ordre est décroissant, on inverse le résultat
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  },

  getBreadcrumbs: () => {
    return get().breadcrumbPath;
  },
}));
