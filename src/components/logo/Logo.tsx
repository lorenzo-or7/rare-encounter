import { AnimatePresence, motion } from 'motion/react';
import { LOGO_ASSET } from './logo-asset';
import './Logo.css';

interface LogoProps {
  /** Accessible name of the brand link. */
  readonly name: string;
  readonly href?: string;
  /**
   * `full` where the logotype can be shown large enough to read; `symbol` (the approved
   * compact mark) for the condensed nav and phones, where the full lockup would be too small.
   */
  readonly variant?: 'full' | 'symbol';
  /**
   * The surface it sits on. On light surfaces the full logotype uses its light-surface
   * finish ("ENCOUNTER" in the logo's navy); the symbol reads on both and is unchanged.
   */
  readonly tone?: 'dark' | 'light';
}

/** Brand link with the authentic logotype or compact symbol, crossfading between them. */
export function Logo({ name, href = '#top', variant = 'full', tone = 'dark' }: LogoProps) {
  const asset =
    variant === 'full' && tone === 'light' ? LOGO_ASSET.fullOnLight : LOGO_ASSET[variant];
  return (
    <a className="logo" href={href} aria-label={name} data-variant={variant} data-tone={tone}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={variant}
          className="logo__image"
          src={asset.src}
          srcSet={asset.srcSet}
          alt=""
          width={Math.round(44 * asset.ratio)}
          height={44}
          decoding="async"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>
    </a>
  );
}
