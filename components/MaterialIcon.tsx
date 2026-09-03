'use client';

import React from 'react';
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  LogOut,
  User,
  X,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  Plus,
  Search,
  Shield,
  Trash2,
  Sun,
  Moon,
  Cpu,
  Eye,
  EyeOff,
  Database,
  Activity,
  Check,
  Copy,
  Key,
  Clock,
  CheckCircle2,
  Download,
  Menu,
  AlertCircle,
  Heart,
  Waves,
  Zap,
  Lightbulb,
  Leaf,
  RefreshCw,
  Send,
  Brain,
  FileText,
  Lock,
  Sliders,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  auto_awesome: Sparkles,
  sparkles: Sparkles,
  menu_book: BookOpen,
  book: BookOpen,
  verified_user: ShieldCheck,
  shield_check: ShieldCheck,
  logout: LogOut,
  person: User,
  user: User,
  close: X,
  x: X,
  arrow_back: ChevronLeft,
  arrow_left: ChevronLeft,
  arrow_forward: ArrowRight,
  arrow_right: ArrowRight,
  how_to_reg: UserCheck,
  user_check: UserCheck,
  chevron_left: ChevronLeft,
  add: Plus,
  plus: Plus,
  search: Search,
  shield: Shield,
  delete: Trash2,
  trash: Trash2,
  light_mode: Sun,
  sun: Sun,
  dark_mode: Moon,
  moon: Moon,
  memory: Cpu,
  cpu: Cpu,
  visibility: Eye,
  visibility_off: EyeOff,
  eye: Eye,
  eye_off: EyeOff,
  dns: Database,
  database: Database,
  insights: Activity,
  activity: Activity,
  check: Check,
  content_copy: Copy,
  copy: Copy,
  vpn_key: Key,
  key: Key,
  schedule: Clock,
  clock: Clock,
  check_circle: CheckCircle2,
  file_download: Download,
  download: Download,
  menu: Menu,
  error_outline: AlertCircle,
  alert: AlertCircle,
  psychology: Brain,
  brain: Brain,
  favorite: Heart,
  heart: Heart,
  waves: Waves,
  bolt: Zap,
  zap: Zap,
  lightbulb: Lightbulb,
  spa: Leaf,
  leaf: Leaf,
  refresh: RefreshCw,
  send: Send,
  file_text: FileText,
  lock: Lock,
  sliders: Sliders,
};

export interface MaterialIconProps {
  name: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  title?: string;
  strokeWidth?: number;
}

/**
 * Material Design Icon Component
 * Renders high-contrast, theme-adaptive vector icons from lucide-react matching Material 3 ergonomics.
 */
export function MaterialIcon({
  name,
  className = '',
  size = 20,
  style,
  title,
  strokeWidth = 2,
}: MaterialIconProps) {
  const normalizedName = (name || '').trim().toLowerCase().replace(/-/g, '_');
  const IconComponent = ICON_MAP[normalizedName] || Sparkles;
  const numericSize =
    typeof size === 'number'
      ? size
      : parseInt(size as string, 10) || 20;

  return (
    <IconComponent
      size={numericSize}
      strokeWidth={strokeWidth}
      className={`shrink-0 inline-block transition-colors ${className}`}
      style={style}
      aria-hidden={!title}
      aria-label={title}
    />
  );
}

export default MaterialIcon;

