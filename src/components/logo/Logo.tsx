import { LOGO_ASSET } from './logo-asset';
import './Logo.css';

interface LogoProps {
  readonly name: string;
  readonly href?: string;
}

/**
 * Brand mark slot. Until the final logo file arrives, renders the name as plain text,
 * deliberately not imitating the logotype's construction.
 */
export function Logo({ name, href = '#top' }: LogoProps) {
  return (
    <a className="logo" href={href} aria-label={name}>
      {LOGO_ASSET.full ? (
        <img className="logo__image" src={LOGO_ASSET.full} alt="" />
      ) : (
        <span className="logo__text" data-placeholder="true">
          {name}
        </span>
      )}
    </a>
  );
}
