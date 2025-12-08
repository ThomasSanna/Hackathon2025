import React from 'react';
import {
  Folder,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
} from 'lucide-react';

interface IconProps {
  type: 'folder' | 'file';
  fileType?: string;
  fileName?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ type, fileType, fileName, className = '' }) => {
  // Si c'est un dossier, on affiche toujours l'icône de dossier en bleu
  if (type === 'folder') {
    return <Folder className={`${className} text-blue-500`} />;
  }

  // Détermine le type de fichier basé sur l'extension
  const getFileTypeFromName = (name?: string): string => {
    if (!name) return 'file';
    
    const extension = name.split('.').pop()?.toLowerCase();
    
    // Documents spécifiques
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'text';
    if (['xls', 'xlsx'].includes(extension || '')) return 'text';
    if (['ppt', 'pptx'].includes(extension || '')) return 'text';
    if (['txt', 'odt', 'rtf'].includes(extension || '')) return 'text';
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(extension || '')) return 'image';
    
    // Vidéos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension || '')) return 'video';
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(extension || '')) return 'audio';
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension || '')) return 'archive';
    
    // Code
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml', 'sql'].includes(extension || '')) return 'code';
    
    return 'file';
  };

  const detectedType = fileType || getFileTypeFromName(fileName);

  // Pour les fichiers, on choisit l'icône selon le type de fichier
  switch (detectedType) {
    case 'pdf':
      return <File className={`${className} text-red-500`} />;
    case 'text':
      return <FileText className={`${className} text-gray-600`} />;
    case 'image':
      return <Image className={`${className} text-green-500`} />;
    case 'archive':
      return <Archive className={`${className} text-yellow-600`} />;
    case 'audio':
      return <Music className={`${className} text-purple-500`} />;
    case 'video':
      return <Video className={`${className} text-pink-500`} />;
    case 'code':
      return <Code className={`${className} text-blue-600`} />;
    default:
      return <File className={`${className} text-gray-500`} />;
  }
};
