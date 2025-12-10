import React from 'react';
import { FileItem } from './fileExplorerTypes';
import { Icon } from '../../shared/Icon';
import { X } from 'lucide-react';

interface FileExplorerPreviewProps {
  selectedItem: FileItem | null;
  onClose: () => void;
}

export const FileExplorerPreview: React.FC<FileExplorerPreviewProps> = ({
  selectedItem,
  onClose,
}) => {
  if (!selectedItem) return null; // Si rien de sélectionné, on affiche rien

  // Convertit les octets en format lisible (pareil que dans FileExplorerList)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Formate la date de manière plus lisible
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { // En français maintenant
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Détails</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Aperçu visuel avec l'icône du fichier */}
      <div className="flex flex-col items-center mb-6">
        <div className="p-6 bg-gray-50 rounded-lg mb-4">
          <Icon
            type={selectedItem.type}
            fileType={selectedItem.fileType}
            fileName={selectedItem.name}
            className="h-20 w-20"
          />
        </div>
        <h4 className="text-base font-medium text-gray-900 text-center break-words max-w-full">
          {selectedItem.name}
        </h4>
      </div>

      {/* Infos détaillées sur le fichier */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Type</p>
          <p className="text-sm text-gray-900">
            {selectedItem.type === 'folder' ? 'Dossier' : selectedItem.fileType || 'Fichier'}
          </p>
        </div>

        {selectedItem.size && ( // On affiche la taille que pour les fichiers
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Taille</p>
            <p className="text-sm text-gray-900">{formatFileSize(selectedItem.size)}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Créé le</p>
          <p className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Modifié le</p>
          <p className="text-sm text-gray-900">{formatDate(selectedItem.modifiedAt)}</p>
        </div>
      </div>
    </div>
  );
};
