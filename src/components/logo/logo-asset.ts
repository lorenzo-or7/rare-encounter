import logo88 from '../../assets/brand/logo-88.webp';
import logo132 from '../../assets/brand/logo-132.webp';
import symbol72 from '../../assets/brand/symbol-72.webp';
import symbol108 from '../../assets/brand/symbol-108.webp';

export interface BrandImage {
  readonly src: string;
  readonly srcSet: string;
  /** Intrinsic ratio of the trimmed mark (width / height). */
  readonly ratio: number;
}

/**
 * The approved logotype and compact symbol, optimized from the authentic files in
 * design-references/approved/assets-01b with only their transparent margin trimmed
 * (never redrawn; see scripts/build-assets.mjs).
 */
export const LOGO_ASSET: { readonly full: BrandImage; readonly symbol: BrandImage } = {
  full: { src: logo88, srcSet: `${logo88} 2x, ${logo132} 3x`, ratio: 1831 / 591 },
  symbol: { src: symbol72, srcSet: `${symbol72} 2x, ${symbol108} 3x`, ratio: 1061 / 492 },
};
