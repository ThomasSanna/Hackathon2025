import React, { useState } from 'react';
import { FolderPlus, Upload, Grid, List, Search } from 'lucide-react';
import { Button } from '../../shared/Button';
import { Modal } from '../../shared/Modal';
import { useFileExplorerStore } from './fileExplorerStore';

export const FileExplorerToolbar: React.FC = () => {
  const {
    isLoading,
    viewMode,
    searchQuery,
    createFolder,
    uploadFile,
    setViewMode,
    setSearchQuery,
  } = useFileExplorerStore();

  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Gère l'upload de fichiers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // On upload tous les fichiers sélectionnés
      Array.from(files).forEach(file => uploadFile(file));
    }
    // Reset l'input pour pouvoir re-uploader le même fichier
    event.target.value = '';
  };

  // Crée un nouveau dossier
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreateFolderModalOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Boutons d'action principaux */}
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              icon={FolderPlus}
              onClick={() => setIsCreateFolderModalOpen(true)}
              disabled={isLoading}
            >
              New Folder
            </Button>

            {/* Astuce: on utilise un label pour déguiser l'input file (qui est moche par défaut) */}
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <Button
                variant="secondary"
                icon={Upload}
                disabled={isLoading}
                as="span"
              >
                Upload
              </Button>
            </label>
          </div>

          {/* Barre de recherche et options d'affichage sur la même ligne */}
          <div className="flex items-center space-x-3">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Boutons pour basculer entre vue grille et liste */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-700' // Mode actif
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 border-l border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale pour créer un nouveau dossier */}
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setIsCreateFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
