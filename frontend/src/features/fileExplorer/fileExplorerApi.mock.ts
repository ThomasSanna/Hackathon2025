import { FileItem } from './fileExplorerTypes';

// Données simulées pour l'explorateur de fichiers - sauvegardées dans le localStorage
const STORAGE_KEY = 'fileExplorer_mockData';

// Charge les données depuis le localStorage ou utilise les données par défaut
const getInitialMockData = (): FileItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored); // On a déjà des données stockées
  }
  
  // Données par défaut si c'est la première fois
  return [
    {
      id: '1',
      name: 'Documents',
      type: 'folder',
      parentId: null,
      createdAt: '2024-01-15T10:00:00Z',
      modifiedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Images',
      type: 'folder',
      parentId: null,
      createdAt: '2024-01-16T11:00:00Z',
      modifiedAt: '2024-01-16T11:00:00Z',
    },
    {
      id: '3',
      name: 'Projects',
      type: 'folder',
      parentId: null,
      createdAt: '2024-01-17T12:00:00Z',
      modifiedAt: '2024-01-17T12:00:00Z',
    },
    {
      id: '4',
      name: 'Project Brief.pdf',
      type: 'file',
      parentId: '1',
      size: 2457600,
      fileType: 'pdf',
      createdAt: '2024-01-18T09:30:00Z',
      modifiedAt: '2024-01-18T09:30:00Z',
    },
    {
      id: '5',
      name: 'Meeting Notes.txt',
      type: 'file',
      parentId: '1',
      size: 15360,
      fileType: 'text',
      createdAt: '2024-01-18T14:20:00Z',
      modifiedAt: '2024-01-18T14:20:00Z',
    },
    {
      id: '6',
      name: 'Presentation.pdf',
      type: 'file',
      parentId: '1',
      size: 5242880,
      fileType: 'pdf',
      createdAt: '2024-01-19T16:45:00Z',
      modifiedAt: '2024-01-19T16:45:00Z',
    },
    {
      id: '7',
      name: 'vacation-photo.jpg',
      type: 'file',
      parentId: '2',
      size: 3145728,
      fileType: 'image',
      createdAt: '2024-01-20T13:10:00Z',
      modifiedAt: '2024-01-20T13:10:00Z',
    },
    {
      id: '8',
      name: 'screenshot.png',
      type: 'file',
      parentId: '2',
      size: 1048576,
      fileType: 'image',
      createdAt: '2024-01-21T10:05:00Z',
      modifiedAt: '2024-01-21T10:05:00Z',
    },
    {
      id: '9',
      name: 'Website',
      type: 'folder',
      parentId: '3',
      createdAt: '2024-01-22T08:00:00Z',
      modifiedAt: '2024-01-22T08:00:00Z',
    },
    {
      id: '10',
      name: 'index.html',
      type: 'file',
      parentId: '9',
      size: 8192,
      fileType: 'code',
      createdAt: '2024-01-23T11:30:00Z',
      modifiedAt: '2024-01-23T11:30:00Z',
    },
    {
      id: '11',
      name: 'styles.css',
      type: 'file',
      parentId: '9',
      size: 4096,
      fileType: 'code',
      createdAt: '2024-01-23T11:35:00Z',
      modifiedAt: '2024-01-23T11:35:00Z',
    },
    {
      id: '12',
      name: 'app.js',
      type: 'file',
      parentId: '9',
      size: 12288,
      fileType: 'code',
      createdAt: '2024-01-23T11:40:00Z',
      modifiedAt: '2024-01-23T11:40:00Z',
    },
  ];
};

let mockData = getInitialMockData();

// Sauvegarde dans le localStorage à chaque modification (pour que ça persiste entre les rafraîchissements)
const saveMockData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
};

// Simule un délai réseau pour que ça ressemble à une vraie API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonctions de l'API simulée
export const fileExplorerApi = {
  // Liste tous les fichiers/dossiers d'un répertoire
  listFiles: async (parentId: string | null = null): Promise<FileItem[]> => {
    await delay(300); // Simule le temps de réponse du serveur
    return mockData.filter(item => item.parentId === parentId);
  },

  // Récupère un fichier/dossier spécifique
  getFile: async (id: string): Promise<FileItem | undefined> => {
    await delay(200);
    return mockData.find(item => item.id === id);
  },

  // Upload un fichier
  uploadFile: async (file: File, parentId: string | null): Promise<FileItem> => {
    await delay(500); // Un peu plus long pour l'upload
    
    // Fonction qui détermine le type de fichier selon son extension
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

    const newFile: FileItem = {
      id: Date.now().toString(), // ID unique basé sur le timestamp
      name: file.name,
      type: 'file',
      parentId,
      size: file.size,
      fileType: getFileType(file.name),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    mockData.push(newFile);
    saveMockData();
    return newFile;
  },

  // Télécharge un fichier
  downloadFile: async (id: string): Promise<Blob> => {
    await delay(300);
    const file = mockData.find(item => item.id === id && item.type === 'file');
    if (!file) throw new Error('Fichier introuvable');
    
    // Retourne un blob simulé (dans la vraie vie, ce serait le vrai contenu du fichier)
    return new Blob(['Contenu du fichier simulé'], { type: 'text/plain' });
  },

  // Crée un dossier
  createFolder: async (name: string, parentId: string | null): Promise<FileItem> => {
    await delay(300);
    
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'folder',
      parentId,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    mockData.push(newFolder);
    saveMockData();
    return newFolder;
  },

  // Renomme un fichier/dossier
  rename: async (id: string, newName: string): Promise<FileItem> => {
    await delay(300);
    
    const item = mockData.find(item => item.id === id);
    if (!item) throw new Error('Élément introuvable');
    
    item.name = newName;
    item.modifiedAt = new Date().toISOString();
    saveMockData();
    return item;
  },

  // Supprime un fichier/dossier
  delete: async (id: string): Promise<void> => {
    await delay(300);
    
    // Fonction récursive pour supprimer aussi tous les enfants (si c'est un dossier)
    const deleteRecursive = (itemId: string) => {
      const index = mockData.findIndex(item => item.id === itemId);
      if (index !== -1) {
        const item = mockData[index];
        
        // Si c'est un dossier, on supprime d'abord tous ses enfants
        if (item.type === 'folder') {
          const children = mockData.filter(child => child.parentId === itemId);
          children.forEach(child => deleteRecursive(child.id)); // Récursion
        }
        
        mockData.splice(index, 1); // On supprime l'item lui-même
      }
    };
    
    deleteRecursive(id);
    saveMockData();
  },

  // Déplace un fichier/dossier
  move: async (id: string, newParentId: string | null): Promise<FileItem> => {
    await delay(300);
    
    const item = mockData.find(item => item.id === id);
    if (!item) throw new Error('Élément introuvable');
    
    item.parentId = newParentId; // On change juste le parent
    item.modifiedAt = new Date().toISOString();
    saveMockData();
    return item;
  },
};
