import {
  DropletIcon,
  EarIcon,
  FastWindIcon,
  FireIcon,
  FlashIcon,
  Leaf01Icon,
  Moon02Icon,
  MountainIcon,
  Route01Icon,
  Sun03Icon,
  SunriseIcon,
  SunsetIcon,
  WaveIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

/** Icon-text options reference glyphs as `icon:<name>`; this maps names to Hugeicons. */
const ICONS: Readonly<Record<string, IconSvgElement>> = {
  flash: FlashIcon,
  wave: WaveIcon,
  mountain: MountainIcon,
  wind: FastWindIcon,
  sunrise: SunriseIcon,
  sun: Sun03Icon,
  sunset: SunsetIcon,
  moon: Moon02Icon,
  fire: FireIcon,
  droplet: DropletIcon,
  leaf: Leaf01Icon,
  ear: EarIcon,
  route: Route01Icon,
};

export function optionIcon(src: string): IconSvgElement | undefined {
  return src.startsWith('icon:') ? ICONS[src.slice('icon:'.length)] : undefined;
}
