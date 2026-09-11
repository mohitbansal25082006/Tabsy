import React from 'react';
import { 
  Folder, 
  Briefcase, 
  Coffee, 
  Book, 
  Globe, 
  Code, 
  Heart, 
  Star, 
  Zap, 
  Music,
  Video,
  Image as ImageIcon,
  ShoppingCart,
  Plane,
  Monitor,
  Smartphone,
  Cpu,
  Layers,
  Layout,
  MessageSquare,
  Package,
  Shield,
  Smile,
  Sun,
  Moon,
  PenTool,
  Bookmark
} from 'lucide-react';

export const LIBRARIES = {
  Folder,
  Briefcase,
  Coffee,
  Book,
  Globe,
  Code,
  Heart,
  Star,
  Zap,
  Music,
  Video,
  ImageIcon,
  ShoppingCart,
  Plane,
  Monitor,
  Smartphone,
  Cpu,
  Layers,
  Layout,
  MessageSquare,
  Package,
  Shield,
  Smile,
  Sun,
  Moon,
  PenTool,
  Bookmark
};

export type IconName = keyof typeof LIBRARIES;

export const ICON_NAMES = Object.keys(LIBRARIES) as IconName[];

export function getIconComponent(name: string, size = 20, className = '') {
  const IconComponent = LIBRARIES[name as IconName];
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  // Fallback to emoji if it's not a known lucide icon
  return <span className={className} style={{ fontSize: `${size}px`, lineHeight: 1 }}>{name}</span>;
}
