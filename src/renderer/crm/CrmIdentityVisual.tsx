import {useUnsavedDraft} from '../unsaved/unsaved';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OperationIcon } from '../operations/OperationIcon';
import type {
  CrmIdentityAsset,
  CrmIdentityAssetRole,
  CrmIdentityOwnerType,
} from '../../shared/crm';

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AW';
}

async function preferredPreview(
  organizationId?: string | null,
  contactId?: string | null,
): Promise<string | null> {
  const [organizationAssets, contactAssets] = await Promise.all([
    organizationId ? window.atoumweb.crm.identityAssets.list('organization', organizationId) : Promise.resolve([]),
    contactId ? window.atoumweb.crm.identityAssets.list('contact', contactId) : Promise.resolve([]),
  ]);

  const preferred =
    organizationAssets.find((asset) => asset.role === 'logo' && !asset.missing)
    ?? organizationAssets.find((asset) => asset.role === 'favicon' && !asset.missing)
    ?? contactAssets.find((asset) => asset.role === 'avatar' && !asset.missing);

  if (!preferred) return null;
  const preview = await window.atoumweb.crm.identityAssets.preview(preferred.id);
  return preview.available && preview.dataUrl ? preview.dataUrl : null;
}

export function CrmIdentityAvatar({
  organizationId,
  contactId,
  name,
  size = 'small',
}: {
  organizationId?: string | null;
  contactId?: string | null;
  name: string;
  size?: 'small' | 'large';
}) {
  const [previewOwner,setPreviewOwner]=useState('');
  const ownerKey=(organizationId??'')+':'+(contactId??'');
  const [source, setSource] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('atoumweb:crm-identity-changed', refresh);
    return () => window.removeEventListener('atoumweb:crm-identity-changed', refresh);
  }, []);

  useEffect(() => {
    let active = true;
    setSource(null);
    void preferredPreview(organizationId, contactId)
      .then((preview) => { if (active) {setSource(preview);setPreviewOwner(ownerKey);} })
      .catch(() => { if (active) setSource(null); });
    return () => { active = false; };
  }, [organizationId, contactId, revision]);

  const visibleSource=previewOwner===ownerKey?source:null;
  return <span className={`crm-identity-avatar crm-identity-avatar-${size} ${visibleSource ? 'has-image' : ''}`} aria-label={name}>
    {visibleSource ? <img src={visibleSource} alt="" /> : <span>{initials(name)}</span>}
  </span>;
}

interface AssetSlot {
  owner: CrmIdentityOwnerType;
  ownerId: string;
  role: CrmIdentityAssetRole;
  label: string;
  help: string;
}

export function CrmIdentityAssetEditor({
  organizationId,
  contactId,
  onMessage,
}: {
  organizationId?: string | null;
  contactId?: string | null;
  onMessage?: (message: string) => void;
}) {
  const [assets, setAssets] = useState<CrmIdentityAsset[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const generation=useRef(0),loadSequence=useRef(0),locked=useRef(false);
  useUnsavedDraft('Identité visuelle : opération en cours',null,{dirty:false,pending:Boolean(busyKey)});

  const slots = useMemo<AssetSlot[]>(() => {
    const next: AssetSlot[] = [];
    if (organizationId) {
      next.push({
        owner: 'organization',
        ownerId: organizationId,
        role: 'logo',
        label: 'Logo entreprise',
        help: 'Utilisé en priorité pour identifier l’entreprise dans le Manager.',
      });
      next.push({
        owner: 'organization',
        ownerId: organizationId,
        role: 'favicon',
        label: 'Favicon',
        help: 'Petit repère visuel du site, utilisé si aucun logo n’est disponible.',
      });
    }
    if (contactId) {
      next.push({
        owner: 'contact',
        ownerId: contactId,
        role: 'avatar',
        label: 'Photo / avatar',
        help: 'Utilisé pour un client particulier ou comme repli si l’entreprise n’a pas de logo.',
      });
    }
    return next;
  }, [organizationId, contactId]);

  async function load(expected=generation.current): Promise<void> {
    const sequence=++loadSequence.current;
    try {
    const batches = await Promise.all([
      organizationId ? window.atoumweb.crm.identityAssets.list('organization', organizationId) : Promise.resolve([]),
      contactId ? window.atoumweb.crm.identityAssets.list('contact', contactId) : Promise.resolve([]),
    ]);
    const nextAssets = batches.flat();
    if(expected!==generation.current || sequence!==loadSequence.current)return;
    setAssets(nextAssets);
    const pairs = await Promise.all(nextAssets.filter((asset) => !asset.missing).map(async (asset) => {
      const preview = await window.atoumweb.crm.identityAssets.preview(asset.id);
      return preview.available && preview.dataUrl ? [asset.id, preview.dataUrl] as const : null;
    }));
    if(expected!==generation.current || sequence!==loadSequence.current)return;
    setPreviews(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => pair !== null)));
    } catch(error) {
      if(expected!==generation.current || sequence!==loadSequence.current)return;
      throw error;
    }
  }

  useEffect(() => {
    const expected=++generation.current;
    setOpen(false);setAssets([]);setPreviews({});setBusyKey(null);locked.current=false;setError('');
    void load(expected).catch(() => {
      if(expected!==generation.current)return;
      setError('Impossible de charger les visuels.');
      setAssets([]);
      setPreviews({});
    });
    const refresh=()=>{const ownerGeneration=generation.current;void load(ownerGeneration).catch(()=>{if(ownerGeneration===generation.current)setError('Impossible d’actualiser les visuels.');});};
    window.addEventListener('atoumweb:crm-identity-changed',refresh);
    return()=>{generation.current++;loadSequence.current++;window.removeEventListener('atoumweb:crm-identity-changed',refresh);};
  }, [organizationId, contactId]);

  async function importAsset(slot: AssetSlot): Promise<void> {
    const key = `${slot.owner}:${slot.ownerId}:${slot.role}`;
    const expected=generation.current;
    if(locked.current)return;locked.current=true;
    setBusyKey(key);setError('');
    try {
      const imported = await window.atoumweb.crm.identityAssets.importFile(slot.owner, slot.ownerId, slot.role);
      if (!imported || expected!==generation.current) return;
      await load(expected);
      window.dispatchEvent(new CustomEvent('atoumweb:crm-identity-changed'));
      onMessage?.(`${slot.label} mis à jour.`);
    } catch (error) {
      if(expected===generation.current){setError(error instanceof Error ? error.message : 'Import de l’image impossible.');}
    } finally {
      if(expected===generation.current){locked.current=false;setBusyKey(null);}
    }
  }

  async function removeAsset(asset: CrmIdentityAsset, label: string): Promise<void> {
    const expected=generation.current;
    if(locked.current)return;locked.current=true;
    setBusyKey(asset.id);setError('');
    try {
      const removed=await window.atoumweb.crm.identityAssets.remove(asset.id);
      if(!removed || expected!==generation.current)return;
      await load(expected);
      window.dispatchEvent(new CustomEvent('atoumweb:crm-identity-changed'));
      onMessage?.(`${label} supprimé.`);
    } catch (error) {
      if(expected===generation.current)setError(error instanceof Error ? error.message : 'Suppression de l’image impossible.');
    } finally {
      if(expected===generation.current){locked.current=false;setBusyKey(null);}
    }
  }

  if (slots.length === 0) return null;

  const availableCount = slots.filter((slot) => assets.some((asset) =>
    asset.ownerType === slot.owner
    && asset.ownerId === slot.ownerId
    && asset.role === slot.role
    && !asset.missing
  )).length;

  return <section className={`crm-identity-assets ${open ? 'is-open' : 'is-compact'}`}>
    <div className="crm-identity-assets-compact">
      <span className="crm-identity-assets-icon"><OperationIcon name="image" size={18} /></span>
      <div className="crm-identity-assets-summary">
        <strong>Logo et visuels</strong>
        <small>{availableCount > 0 ? `${availableCount}/${slots.length} élément${availableCount > 1 ? 's' : ''} renseigné${availableCount > 1 ? 's' : ''}` : 'Aucun visuel renseigné'}</small>
      </div>
      <button
        className="secondary-button crm-identity-assets-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <OperationIcon name={open ? 'chevron-up' : 'image'} size={16} />
        <span>{open ? 'Masquer les visuels' : availableCount ? 'Modifier les visuels' : organizationId ? 'Ajouter un logo' : 'Ajouter un visuel'}</span>
      </button>
    </div>

    {busyKey&&<p role="status">Opération en cours…</p>}
    {error&&<p role="alert">{error.replace(/^Error invoking remote method [^:]+:\s*(Error:\s*)?/,'')}</p>}
    {open && <div className="crm-identity-assets-editor">
      <div className="crm-identity-assets-heading">
        <div><span className="eyebrow">Identité visuelle</span><strong>Logo, favicon & photo</strong></div>
        <small>JPG, PNG, WEBP, GIF ou ICO · 8 Mo max. Les anciennes copies restent conservées dans le workspace pour les sauvegardes.</small>
      </div>
      <div className="crm-identity-assets-grid">
        {slots.map((slot) => {
          const asset = assets.find((candidate) => candidate.ownerType === slot.owner && candidate.ownerId === slot.ownerId && candidate.role === slot.role);
          const key = `${slot.owner}:${slot.ownerId}:${slot.role}`;
          return <div className={`crm-identity-asset-slot role-${slot.role}`} key={key}>
            <div className={`crm-identity-asset-preview role-${slot.role}`}>
              {asset && previews[asset.id]
                ? <img src={previews[asset.id]} alt="" />
                : <OperationIcon name={slot.role==='avatar'?'user':'image'} size={28}/>}
            </div>
            <div className="crm-identity-asset-copy">
              <strong>{slot.label}</strong>
              <small>{asset?.fileName || slot.help}</small>
            </div>
            <div className="crm-identity-asset-actions">
              <button className="secondary-button compact-button" type="button" disabled={Boolean(busyKey)} onClick={() => void importAsset(slot)}>
                {asset ? 'Remplacer' : 'Ajouter'}
              </button>
              {asset && <button className="link-button danger-link" type="button" disabled={Boolean(busyKey)} onClick={() => void removeAsset(asset, slot.label)}>Supprimer</button>}
            </div>
          </div>;
        })}
      </div>
    </div>}
  </section>;
}
