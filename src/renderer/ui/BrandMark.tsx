import {BRAND_ICON_SVG,svgDataUrl} from '../../shared/brandArtwork';
/** Preview identity, awaiting the user's graphic approval. */
export function BrandMark(){return <img className="aw-brand-symbol" src={svgDataUrl(BRAND_ICON_SVG)} alt="Atoum Manager" width={44} height={44} data-brand-status="candidate"/>;}
