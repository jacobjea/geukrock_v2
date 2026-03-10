export type VisualTone =
  | "obsidian"
  | "graphite"
  | "steel"
  | "ash"
  | "mist"
  | "concrete"
  | "smoke"
  | "chalk";

export type PromoTone = "night" | "paper";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string[];
  description: string;
  primaryCta: string;
  secondaryCta: string;
  stats: HeroStat[];
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  discountRate: number;
  tone: VisualTone;
  badge?: string;
}

export interface PromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  secondaryCta?: string;
  accent: string;
  tone: PromoTone;
}

export interface EditorPick {
  id: string;
  category: string;
  title: string;
  description: string;
  meta: string;
  tone: VisualTone;
}
