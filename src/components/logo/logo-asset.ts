import logo80 from '../../assets/brand/logo-80.webp';
import logo120 from '../../assets/brand/logo-120.webp';
import symbol64 from '../../assets/brand/symbol-64.webp';
import symbol96 from '../../assets/brand/symbol-96.webp';

export interface BrandImage {
  readonly src: string;
  readonly srcSet: string;
}

/**
 * The approved logotype and compact symbol, optimized from the authentic files in
 * design-references/approved/assets-01b (never redrawn; see scripts/build-assets.mjs).
 */
export const LOGO_ASSET: { readonly full: BrandImage; readonly symbol: BrandImage } = {
  full: { src: logo80, srcSet: `${logo80} 2x, ${logo120} 3x` },
  symbol: { src: symbol64, srcSet: `${symbol64} 2x, ${symbol96} 3x` },
};
