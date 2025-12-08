import React, { useState } from 'react';
import { Edit2, Trash2, Upload } from 'lucide-react';
import { Icon } from '../../shared/Icon';
import { FileItem } from './fileExplorerTypes';
import { useFileExplorerStore } from './fileExplorerStore';

interface FileExplorerListProps {
  onItemDoubleClick: (item: FileItem) => void;
}

export const FileExplorerList: React.FC<FileExplorerListProps> = ({ onItemDoubleClick }) => {
  const {
    getCurrentItems,
    selectedIds,
    viewMode,
    isLoading,
    toggleSelection,
    renameItem,
    deleteItem,
    moveItem,
    uploadFile,
  } = useFileExplorerStore();

  const [isRenaming, setIsRenaming] = useState<string | null>(null); // L'ID du fichier qu'on est en train de renommer (null si rien)
  const [renameValue, setRenameValue] = useState(''); // La nouvelle valeur du nom
  const [draggedItem, setDraggedItem] = useState<string | null>(null); // L'item qu'on est en train de drag & drop
  const [isDraggingFiles, setIsDraggingFiles] = useState(false); // Pour le drag & drop de fichiers externes

  const items = getCurrentItems();

  // Convertit les octets en format lisible (genre 1024 => 1 KB)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k)); // Trouve l'unité appropriée
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Formate la date en format lisible
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRename = async (id: string) => {
    // On renomme que si le nom a changé et qu'il est pas vide
    if (renameValue.trim() && renameValue !== items.find((i: FileItem) => i.id === id)?.name) {
      await renameItem(id, renameValue.trim());
    }
    setIsRenaming(null); // On ferme le mode renommage
    setRenameValue('');
  };

  const handleDelete = async (id: string, name: string) => {
    // On demande confirmation avant de supprimer, au cas où
    if (window.confirm(`T'es sûr de vouloir supprimer "${name}" ?`)) {
      await deleteItem(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: FileItem) => {
    setDraggedItem(item.id); // On mémorise ce qu'on est en train de déplacer
    e.dataTransfer.effectAllowed = 'move'; // Indique au navigateur que c'est un déplacement
    e.dataTransfer.setData('text/plain', item.id); // On stocke l'ID pour le breadcrumb
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Important : permet de dropper
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItem: FileItem) => {
    e.preventDefault();
    // On peut dropper un fichier uniquement dans un dossier, et pas sur lui-même
    if (draggedItem && targetItem.type === 'folder' && draggedItem !== targetItem.id) {
      await moveItem(draggedItem, targetItem.id); // On déplace le fichier dans le dossier
    }
    setDraggedItem(null); // On réinitialise
  };

  // Gère le drag & drop de fichiers externes (depuis l'ordinateur)
  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFiles(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    const currentTarget = e.currentTarget as Node;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDraggingFiles(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => uploadFile(file));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">Ce dossier est vide</p>
          <p className="text-gray-400 text-sm">Créez un dossier ou uploadez des fichiers pour commencer</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    // Mode grille : affichage avec de jolies cartes
    return (
      <div 
        className="flex-1 p-6 overflow-auto relative"
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        {/* Overlay de drag & drop pour upload de fichiers */}
        {isDraggingFiles && (
          <div className="absolute inset-0 bg-blue-50 border-4 border-dashed border-blue-400 flex items-center justify-center z-50 m-4 rounded-lg">
            <div className="text-center">
              <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-blue-700">Drop files here to upload</p>
              <p className="text-sm text-blue-600 mt-2">Release to upload files to this folder</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item: FileItem) => (
            <div
              key={item.id}
              className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedIds.includes(item.id)
                  ? 'bg-blue-50 ring-2 ring-blue-200' // Si sélectionné, on le met en surbrillance
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleSelection(item.id)} // Simple clic = sélection
              onDoubleClick={() => onItemDoubleClick(item)} // Double clic = ouvre le dossier ou le fichier
              draggable // Permet de drag & drop
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
            >
              <div className="flex flex-col items-center">
                <Icon
                  type={item.type}
                  fileType={item.fileType}
                  fileName={item.name}
                  className="h-12 w-12 mb-3"
                />
                
                {/* Si on est en train de renommer cet item, on affiche un input */}
                {isRenaming === item.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(item.id)} // Perte de focus = on valide
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(item.id); // Entrée = valider
                      if (e.key === 'Escape') setIsRenaming(null); // Échap = annuler
                    }}
                    className="w-full px-2 py-1 text-sm text-center border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()} // Évite de sélectionner l'item quand on clique dans l'input
                  />
                ) : (
                  <p className="text-sm text-gray-900 text-center truncate w-full">
                    {item.name}
                  </p>
                )}
                
                {item.size && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.size)}
                  </p>
                )}
              </div>

              {/* Boutons d'action - apparaissent au survol */}
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(item.id);
                    setRenameValue(item.name);
                  }}
                  className="p-1 rounded bg-white hover:bg-gray-100 shadow-sm transition-colors"
                  title="Rename"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id, item.name);
                  }}
                  className="p-1 rounded bg-white hover:bg-red-100 shadow-sm transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mode liste : affichage en tableau (comme l'explorateur Windows classique)
  return (
    <div 
      className="flex-1 overflow-auto relative"
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* Overlay de drag & drop pour upload de fichiers */}
      {isDraggingFiles && (
        <div className="absolute inset-0 bg-blue-50 border-4 border-dashed border-blue-400 flex items-center justify-center z-50 m-4 rounded-lg">
          <div className="text-center">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-blue-700">Drop files here to upload</p>
            <p className="text-sm text-blue-600 mt-2">Release to upload files to this folder</p>
          </div>
        </div>
      )}
      
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0"> {/* Le header reste fixé en haut quand on scroll */}
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nom
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Taille
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modifié
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item: FileItem) => (
            <tr
              key={item.id}
              className={`cursor-pointer transition-colors ${
                selectedIds.includes(item.id)
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleSelection(item.id)}
              onDoubleClick={() => onItemDoubleClick(item)}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Icon
                    type={item.type}
                    fileType={item.fileType}
                    fileName={item.name}
                    className="h-5 w-5 mr-3 flex-shrink-0"
                  />
                  {isRenaming === item.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(item.id);
                        if (e.key === 'Escape') setIsRenaming(null);
                      }}
                      className="px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{item.name}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.size ? formatFileSize(item.size) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.modifiedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(item.id);
                      setRenameValue(item.name);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.name);
                    }}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
