import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  style,
  size = 'md',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const dimension = size === 'sm' ? '32px' : '38px';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`icon-action-btn theme-toggle-btn ${className}`}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: 'var(--radius-md)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        color: isDark ? '#fbbf24' : '#0284c7',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        ...style,
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun size={iconSize} strokeWidth={2.2} />
      ) : (
        <Moon size={iconSize} strokeWidth={2.2} />
      )}
    </button>
  );
};
