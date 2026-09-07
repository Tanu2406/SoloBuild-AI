import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  src?: string;
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
};

const fontSizeMap = {
  sm: '11px',
  md: '13px',
  lg: '16px',
  xl: '20px',
};

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', color = '#2563eb', src }) => {
  const dim = sizeMap[size];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      aria-label={name}
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: fontSizeMap[size],
        fontWeight: 600,
        flexShrink: 0,
        fontFamily: 'var(--font-family)',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};
