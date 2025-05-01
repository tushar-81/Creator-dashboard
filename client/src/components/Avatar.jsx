import React from 'react';

/**
 * Avatar component that displays either:
 * 1. A custom image if provided and valid
 * 2. A fallback with user initials on a colored background
 */
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const [imgError, setImgError] = React.useState(!src);

  // Handle image loading errors
  const handleError = () => {
    setImgError(true);
  };

  // Generate initials from name
  const getInitials = () => {
    if (!name) return '?';
    
    const names = name.split(' ');
    if (names.length === 1) {
      return name[0].toUpperCase();
    }
    
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  // Generate a consistent color based on the name
  const getBackgroundColor = () => {
    if (!name) return '#6366F1'; // Default indigo color
    
    // Simple hash function to generate color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with fixed saturation and lightness for good contrast
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`;
  };

  // Size classes
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-2xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`rounded-full flex items-center justify-center overflow-hidden ${sizeClass} ${className}`}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        <div 
          className="h-full w-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export default Avatar;