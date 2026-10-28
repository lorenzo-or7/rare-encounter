import { LOGO_ASSET } from './logo-asset';
import './Logo.css';

interface LogoProps {
  /** Accessible name of the brand link. */
  readonly name: string;
  readonly href?: string;
  /** `symbol` is the compact mark for reduced interfaces. */
  readonly variant?: 'full' | 'symbol';
}

/** Brand link with the authentic logotype or compact symbol. */
export function Logo({ name, href = '#top', variant = 'full' }: LogoProps) {
  const asset = LOGO_ASSET[variant];
  return (
    <a className="logo" href={href} aria-label={name} data-variant={variant}>
      <img
        className="logo__image"
        src={asset.src}
        srcSet={asset.srcSet}
        alt=""
        width={variant === 'full' ? 98 : 32}
        height={variant === 'full' ? 40 : 32}
        decoding="async"
      />
    </a>
  );
}
