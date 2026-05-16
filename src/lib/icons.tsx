// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Lucide Icon Helper
// Dynamically render Lucide icons by name string (kebab-case)
// ═══════════════════════════════════════════════════════════════

import {
  Leaf,
  Recycle,
  Gift,
  Hammer,
  Armchair,
  Shirt,
  Smartphone,
  Bike,
  BookOpen,
  Gamepad2,
  Wrench,
  Car,
  Home,
  Key,
  Building,
  Users,
  Store,
  Utensils,
  HeartPulse,
  Briefcase,
  Sprout,
  Mountain,
  PawPrint,
  Search,
  HeartHandshake,
  MessageCircle,
  Megaphone,
  FileText,
  Calendar,
  Circle,
  Sparkles,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ImageOff,
  Trash2,
  Droplets,
  Factory,
  ShoppingCart,
  Monitor,
  Dumbbell,
} from 'lucide-react';

// Registry mapping icon name strings (kebab-case) to Lucide components
const iconRegistry: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  leaf: Leaf,
  recycle: Recycle,
  gift: Gift,
  hammer: Hammer,
  armchair: Armchair,
  shirt: Shirt,
  smartphone: Smartphone,
  bike: Bike,
  'book-open': BookOpen,
  'gamepad-2': Gamepad2,
  wrench: Wrench,
  car: Car,
  home: Home,
  key: Key,
  building: Building,
  users: Users,
  store: Store,
  utensils: Utensils,
  'heart-pulse': HeartPulse,
  briefcase: Briefcase,
  sprout: Sprout,
  mountain: Mountain,
  'paw-print': PawPrint,
  search: Search,
  'heart-handshake': HeartHandshake,
  'message-circle': MessageCircle,
  megaphone: Megaphone,
  'file-text': FileText,
  calendar: Calendar,
  circle: Circle,
  sparkles: Sparkles,
  star: Star,
  'map-pin': MapPin,
  clock: Clock,
  'shield-check': ShieldCheck,
  'image-off': ImageOff,
  'trash-2': Trash2,
  droplets: Droplets,
  factory: Factory,
  'shopping-cart': ShoppingCart,
  monitor: Monitor,
  dumbbell: Dumbbell,
};

// Fallback icon for unknown names
const FallbackIcon = Circle;

/**
 * Render a Lucide icon by its kebab-case name string.
 *
 * @param name - Icon name in kebab-case (e.g., 'heart-pulse', 'book-open')
 * @param className - Optional CSS class(es) for the icon
 * @param size - Optional size in pixels (default: 16)
 * @returns JSX element of the icon, or Circle fallback
 *
 * @example
 * {getIcon('recycle', 'size-5 text-green-600', 20)}
 * {getIcon(category.icon, undefined, 14)}
 */
export function getIcon(
  name: string,
  className?: string,
  size?: number
): React.ReactNode {
  const IconComponent = iconRegistry[name] || FallbackIcon;
  const iconSize = size ?? 16;
  return <IconComponent size={iconSize} className={className} />;
}
