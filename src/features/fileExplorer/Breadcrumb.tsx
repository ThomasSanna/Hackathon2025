import React, { useState } from 'react';
import { Home, ChevronRight, ArrowUp } from 'lucide-react';
import { useFileExplorerStore } from './fileExplorerStore';
import { FileItem } from './fileExplorerTypes';

export const Breadcrumb: React.FC = () => {
  const { navigateToFolder, navigateUp, getBreadcrumbs, currentFolderId, moveItem } = useFileExplorerStore();
  const breadcrumbs = getBreadcrumbs();
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (folderId: string | null) => {
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverId(null);
    
    const draggedItemId = e.dataTransfer.getData('text/plain');
    if (draggedItemId && draggedItemId !== targetFolderId) {
      await moveItem(draggedItemId, targetFolderId);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Le fil d'ariane - en gros le chemin où on est */}
        <div className="flex items-center space-x-2 text-sm flex-1 overflow-hidden">
          <button
            onClick={() => navigateToFolder(null)}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`flex items-center px-2 py-1 rounded-md transition-colors ${
              currentFolderId === null
                ? 'bg-blue-100 text-blue-700'
                : dragOverId === null
                ? 'text-gray-700 hover:bg-gray-100 border-2 border-dashed border-transparent hover:border-blue-300'
                : 'text-gray-700 bg-blue-50 border-2 border-dashed border-blue-400'
            }`}
            title="Home"
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </button>
          
          {/* On affiche chaque dossier du chemin */}
          {breadcrumbs.map((item: FileItem, index: number) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" /> {/* La petite flèche entre les dossiers */}
              <button
                onClick={() => navigateToFolder(item.id)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`px-2 py-1 rounded-md transition-colors truncate ${
                  index === breadcrumbs.length - 1
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : dragOverId === item.id
                    ? 'text-gray-700 bg-blue-50 border-2 border-dashed border-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 border-2 border-dashed border-transparent hover:border-blue-300'
                }`}
                title={item.name}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Bouton "Remonter" - apparait que si on est pas à la racine */}
        {currentFolderId !== null && (
          <button
            onClick={navigateUp}
            className="ml-4 flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Go up one level"
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            Up
          </button>
        )}
      </div>
    </div>
  );
};
