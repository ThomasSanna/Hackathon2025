import React from 'react';
import { Home, Folder } from 'lucide-react';
import { useFileExplorerStore } from './fileExplorerStore';
import { FileItem } from './fileExplorerTypes';

export const FileExplorerSidebar: React.FC = () => {
  const { navigateToFolder, currentFolderId, allItems } = useFileExplorerStore();

  // On récupère tous les dossiers à la racine pour les afficher dans la sidebar
  const rootFolders = allItems.filter((item: FileItem) => item.type === 'folder' && item.parentId === null);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Les pouces on TOP </h2>
        
        <button
          onClick={() => navigateToFolder(null)}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
            currentFolderId === null
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </button>
      </div>

      {rootFolders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Folders
          </h3>
          <div className="space-y-1">
            {/* On affiche tous les dossiers de la racine */}
            {rootFolders.map((folder: FileItem) => (
              <button
                key={folder.id}
                onClick={() => navigateToFolder(folder.id)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  currentFolderId === folder.id
                    ? 'bg-blue-100 text-blue-700' // Le dossier actif est mis en évidence
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};
