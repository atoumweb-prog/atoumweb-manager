import { useEffect, useMemo, useState } from 'react';
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
  const [source, setSource] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('atoumweb:crm-identity-changed', refresh);
    return () => window.removeEventListener('atoumweb:crm-identity-changed', refresh);
  }, []);

  useEffect(() => {
    let active = true;
    void preferredPreview(organizationId, contactId)
      .then((preview) => { if (active) setSource(preview); })
      .catch(() => { if (active) setSource(null); });
    return () => { active = false; };
  }, [organizationId, contactId, revision]);

  return <span className={`crm-identity-avatar crm-identity-avatar-${size} ${source ? 'has-image' : ''}`} aria-label={name}>
    {source ? <img src={source} alt="" /> : <span>{initials(name)}</span>}
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

  async function load(): Promise<void> {
    const batches = await Promise.all([
      organizationId ? window.atoumweb.crm.identityAssets.list('organization', organizationId) : Promise.resolve([]),
      contactId ? window.atoumweb.crm.identityAssets.list('contact', contactId) : Promise.resolve([]),
    ]);
    const nextAssets = batches.flat();
    setAssets(nextAssets);
    const pairs = await Promise.all(nextAssets.filter((asset) => !asset.missing).map(async (asset) => {
      const preview = await window.atoumweb.crm.identityAssets.preview(asset.id);
      return preview.available && preview.dataUrl ? [asset.id, preview.dataUrl] as const : null;
    }));
    setPreviews(Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => pair !== null)));
  }

  useEffect(() => {
    setOpen(false);
    void load().catch(() => {
      setAssets([]);
      setPreviews({});
    });
  }, [organizationId, contactId]);

  async function importAsset(slot: AssetSlot): Promise<void> {
    const key = `${slot.owner}:${slot.ownerId}:${slot.role}`;
    setBusyKey(key);
    try {
      const imported = await window.atoumweb.crm.identityAssets.importFile(slot.owner, slot.ownerId, slot.role);
      if (!imported) return;
      await load();
      window.dispatchEvent(new CustomEvent('atoumweb:crm-identity-changed'));
      onMessage?.(`${slot.label} mis à jour.`);
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'Import de l’image impossible.');
    } finally {
      setBusyKey(null);
    }
  }

  async function removeAsset(asset: CrmIdentityAsset, label: string): Promise<void> {
    setBusyKey(asset.id);
    try {
      await window.atoumweb.crm.identityAssets.remove(asset.id);
      await load();
      window.dispatchEvent(new CustomEvent('atoumweb:crm-identity-changed'));
      onMessage?.(`${label} supprimé.`);
    } catch (error) {
      onMessage?.(error instanceof Error ? error.message : 'Suppression de l’image impossible.');
    } finally {
      setBusyKey(null);
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
        <strong>Identité visuelle</strong>
        <small>{availableCount > 0 ? `${availableCount}/${slots.length} élément${availableCount > 1 ? 's' : ''} renseigné${availableCount > 1 ? 's' : ''}` : 'Aucun visuel renseigné'}</small>
      </div>
      <button
        className="secondary-button crm-identity-assets-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <OperationIcon name={open ? 'collapse' : 'image'} size={16} />
        <span>{open ? 'Masquer' : 'Gérer l’identité visuelle'}</span>
      </button>
    </div>

    {open && <div className="crm-identity-assets-editor">
      <div className="crm-identity-assets-heading">
        <div><span className="eyebrow">Identité visuelle</span><strong>Logo, favicon & photo</strong></div>
        <small>JPG, PNG, WEBP, GIF ou ICO · 8 Mo max.</small>
      </div>
      <div className="crm-identity-assets-grid">
        {slots.map((slot) => {
          const asset = assets.find((candidate) => candidate.ownerType === slot.owner && candidate.ownerId === slot.ownerId && candidate.role === slot.role);
          const key = `${slot.owner}:${slot.ownerId}:${slot.role}`;
          return <div className="crm-identity-asset-slot" key={key}>
            <div className={`crm-identity-asset-preview role-${slot.role}`}>
              {asset && previews[asset.id]
                ? <img src={previews[asset.id]} alt="" />
                : <span aria-hidden="true">{slot.role === 'logo' ? '▣' : slot.role === 'favicon' ? '◎' : '◉'}</span>}
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
