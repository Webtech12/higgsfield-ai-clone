import { Clapperboard, PlayCircle, Sparkles, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether this section owns the current page. */
  isActive: (pathname: string) => boolean;
}

/** The app's sections, in one place for the header and the phone tab bar (ADR-028). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Create", icon: Sparkles, isActive: (p) => p === "/" },
  {
    href: "/ads",
    label: "My ads",
    icon: Clapperboard,
    isActive: (p) => p.startsWith("/ads") || p.startsWith("/p/"),
  },
  { href: "/talent", label: "Talent", icon: Users, isActive: (p) => p.startsWith("/talent") },
  { href: "/demo", label: "Examples", icon: PlayCircle, isActive: (p) => p.startsWith("/demo") },
];
