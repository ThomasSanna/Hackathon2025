import React, { useEffect, useState } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { FileExplorerToolbar } from './FileExplorerToolbar';
import { FileExplorerSidebar } from './FileExplorerSidebar';
import { FileExplorerList } from './FileExplorerList';
import { FileExplorerPreview } from './FileExplorerPreview';
import { useFileExplorerStore } from './fileExplorerStore';
import { FileItem } from './fileExplorerTypes';

export const FileExplorerPage: React.FC = () => {
  const { loadFiles, navigateToFolder, selectedIds, getCurrentItems } = useFileExplorerStore();
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  // Charge les fichiers de la racine au démarrage
  useEffect(() => {
    loadFiles(null);
  }, [loadFiles]);

  // Gère le double-clic sur un élément
  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      // Si c'est un dossier, on navigue dedans
      navigateToFolder(item.id);
    } else {
      // Si c'est un fichier, on affiche l'aperçu
      setPreviewItem(item);
    }
  };

  // Met à jour l'aperçu quand la sélection change
  useEffect(() => {
    const items = getCurrentItems();
    if (selectedIds.length === 1) {
      const selected = items.find((item: FileItem) => item.id === selectedIds[0]);
      if (selected) {
        setPreviewItem(selected);
      }
    } else {
      setPreviewItem(null);
    }
  }, [selectedIds, getCurrentItems]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fil d'ariane en haut */}
      <Breadcrumb />
      
      {/* Barre d'outils */}
      <FileExplorerToolbar />
      
      {/* Contenu principal : sidebar + liste + aperçu */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar à gauche */}
        <FileExplorerSidebar />
        
        {/* Liste des fichiers au centre */}
        <FileExplorerList onItemDoubleClick={handleItemDoubleClick} />
        
        {/* Panneau d'aperçu à droite (si un fichier est sélectionné) */}
        {previewItem && (
          <FileExplorerPreview
            selectedItem={previewItem}
            onClose={() => setPreviewItem(null)}
          />
        )}
      </div>
    </div>
  );
};
