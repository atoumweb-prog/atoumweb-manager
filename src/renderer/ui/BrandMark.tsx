import master from '../../../assets/brand/references/user-master-20261015.png';
/** Original pixels, without tracing or recolouring. Light plate preserves black lettering. */
export function BrandLogo(){return <span className="aw-brand-logotype"><img src={master} alt="Atoum Manager" data-brand-status="user-master-candidate"/></span>;}
/** Crop only the symbol region of the SAME original; no reconstructed geometry. */
export function BrandMark(){return <svg className="aw-brand-symbol" viewBox="120 110 640 480" role="img" aria-label="Atoum Manager" data-brand-status="user-master-candidate"><rect x="120" y="110" width="640" height="480" rx="48" fill="#f8f8f5"/><image href={master} x="0" y="0" width="2048" height="682"/></svg>;}
