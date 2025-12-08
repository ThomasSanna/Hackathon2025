import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  as?: 'button' | 'span';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  icon: Icon,
  variant = 'primary',
  disabled = false,
  as = 'button',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const Component = as;

  return (
    <Component
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />}
      {children}
    </Component>
  );
};
