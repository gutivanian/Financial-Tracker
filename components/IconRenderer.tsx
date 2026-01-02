import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface IconRendererProps {
  iconName?: string;
  className?: string;
  fallbackEmoji?: string;
}

/**
 * Dynamically renders a Lucide icon from string name
 * Falls back to emoji if icon name is not found or is already an emoji
 */
export default function IconRenderer({ 
  iconName = '📊', 
  className = 'w-5 h-5',
  fallbackEmoji = '📊'
}: IconRendererProps) {
  // If empty or null, use fallback emoji
  if (!iconName || iconName.trim() === '') {
    return <span className={className}>{fallbackEmoji}</span>;
  }

  // Check if it's an emoji (contains emoji characters or is short string)
  // Simple check: if it's 1-2 characters and not alphanumeric, likely emoji
  const isEmoji = iconName.length <= 2 && !/^[a-zA-Z]+$/.test(iconName);
  
  if (isEmoji) {
    return <span className={className}>{iconName}</span>;
  }

  // Try to get the Lucide icon component
  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // If icon name not found, return the string or fallback
  return <span className={className}>{iconName || fallbackEmoji}</span>;
}
