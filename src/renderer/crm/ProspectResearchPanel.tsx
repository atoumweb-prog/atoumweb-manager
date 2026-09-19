import { useEffect, useMemo, useState } from 'react';
import type {
  ProspectResearchCheckStatus,
  ProspectResearchChecklistItem,
  ProspectResearchOpportunity,
  ProspectResearchSnapshot,
  ProspectResearchSnapshotInput,
  ProspectResearchStructuredCheck,
  ProspectSummary,
} from '../../shared/crm';
import { FieldHelp } from './ProspectQualificationPanelV2';

const CHECK_OPTIONS: Array<{ value: ProspectResearchCheckStatus; label: string }> = [
  { value: 'ok', label: 'OK' },
  { value: 'review', label: 'À vérifier' },
  { value: 'missing', label: 'Manquant' },
  { value: 'na', label: 'Non applicable' },
];

const LEGAL_ITEMS: ProspectResearchChecklistItem[] = [
  { key: 'identity', label: 'Identité / raison sociale', status: 'review' },
  { key: 'address', label: 'Adresse de l’entreprise', status: 'review' },
  { key: 'registration', label: 'SIREN / SIRET / immatriculation si applicable', status: 'review' },
  { key: 'contact', label: 'Coordonnées de contact', status: 'review' },
  { key: 'publisher', label: 'Responsable / directeur de publication si pertinent', status: 'review' },
  { key: 'hosting', label: 'Hébergeur identifié', status: 'review' },
  { key: 'consistency', label: 'Informations cohérentes avec l’entreprise actuelle', status: 'review' },
  { key: 'access', label: 'Lien vers les mentions facilement accessible', status: 'review' },
];

const AUDIT_DEFINITIONS = {
  privacy: {
    title: 'RGPD / confidentialité',
    help: 'Vérifier la présence d’une politique de confidentialité, l’identité du responsable, les finalités annoncées, les droits des personnes et les coordonnées ou moyens prévus pour exercer ces droits.',
    items: [
      ['privacy-policy', 'Politique de confidentialité accessible'],
      ['controller', 'Responsable du traitement identifiable'],
      ['purposes', 'Finalités des traitements expliquées'],
      ['rights', 'Droits des personnes mentionnés'],
      ['contact', 'Moyen de contact pour exercer ses droits'],
    ],
  },
  cookies: {
    title: 'Cookies / consentement',
    help: 'Vérifier le bandeau, le refus aussi simple que l’acceptation, l’absence de dépôt des traceurs non nécessaires avant consentement et la possibilité de modifier son choix.',
    items: [
      ['banner', 'Bandeau cookies présent si nécessaire'],
      ['refuse', 'Refuser aussi facilement qu’accepter'],
      ['prior-consent', 'Traceurs non nécessaires bloqués avant consentement'],
      ['preferences', 'Préférences modifiables après le choix'],
    ],
  },
  seo: {
    title: 'SEO de base',
    help: 'Vérifier les titres de pages, meta descriptions, H1, indexabilité, cohérence locale et présence d’informations structurantes pour les moteurs de recherche.',
    items: [
      ['title', 'Titre de page pertinent'],
      ['description', 'Meta description renseignée'],
      ['h1', 'H1 clair et cohérent'],
      ['indexable', 'Pages importantes indexables'],
      ['local', 'Informations locales cohérentes'],
    ],
  },
  performance: {
    title: 'Performance',
    help: 'Repérer les lenteurs visibles, les images très lourdes, les ressources bloquantes et les problèmes manifestes de chargement. Ce contrôle est un indicateur, pas un audit Core Web Vitals complet.',
    items: [
      ['loading', 'Chargement perçu correct'],
      ['images', 'Images raisonnablement optimisées'],
      ['errors', 'Pas d’erreur de chargement visible'],
    ],
  },
  mobile: {
    title: 'Mobile / responsive',
    help: 'Tester au minimum la lisibilité, la navigation, les boutons, formulaires et contenus sur une largeur mobile courante.',
    items: [
      ['layout', 'Mise en page adaptée'],
      ['navigation', 'Navigation utilisable'],
      ['tap-targets', 'Boutons et liens faciles à toucher'],
      ['forms', 'Formulaires utilisables'],
    ],
  },
  accessibility: {
    title: 'Accessibilité de base',
    help: 'Repérer les problèmes évidents : contraste, textes alternatifs, structure des titres, intitulés de liens et boutons. Ce contrôle ne constitue pas un audit RGAA.',
    items: [
      ['contrast', 'Contrastes lisibles'],
      ['alt', 'Images importantes avec texte alternatif'],
      ['headings', 'Hiérarchie de titres cohérente'],
      ['controls', 'Boutons et liens avec intitulé compréhensible'],
    ],
  },
} as const;

type AuditKey = keyof typeof AUDIT_DEFINITIONS;

function createAudit(key: AuditKey): ProspectResearchStructuredCheck {
  const definition = AUDIT_DEFINITIONS[key];
  return {
    overallStatus: 'review',
    items: definition.items.map(([itemKey, label]) => ({ key: itemKey, label, status: 'review' })),
    observations: '',
    talkingPoint: '',
    source: 'Site public',
    url: '',
  };
}

function statusValue(value: unknown): ProspectResearchCheckStatus {
  return value === 'ok' || value === 'review' || value === 'missing' || value === 'na' ? value : 'review';
}

function CheckSelect({ value, onChange, label }: {
  value?: ProspectResearchCheckStatus;
  onChange: (value: ProspectResearchCheckStatus) => void;
  label?: string;
}) {
  return <select aria-label={label} value={value ?? 'review'} onChange={(event) => onChange(event.target.value as ProspectResearchCheckStatus)}>
    {CHECK_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
  </select>;
}

function StructuredCheckEditor({ title, help, value, onChange }: {
  title: string;
  help: string;
  value: ProspectResearchStructuredCheck;
  onChange: (value: ProspectResearchStructuredCheck) => void;
}) {
  function updateItem(index: number, patch: Partial<ProspectResearchChecklistItem>) {
    onChange({ ...value, items: value.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }
  return <details className="research-audit-detail">
    <summary><strong>{title}</strong><FieldHelp text={help} /><span>{stringifyStatus(value.overallStatus)}</span></summary>
    <div className="research-audit-body">
      <label>État global<CheckSelect value={value.overallStatus} onChange={(overallStatus) => onChange({ ...value, overallStatus })} /></label>
      <div className="research-checklist">
        {value.items.map((item, index) => <div className="research-check-row" key={item.key}>
          <strong>{item.label}</strong>
          <CheckSelect label={`Statut ${item.label}`} value={item.status} onChange={(status) => updateItem(index, { status })} />
          <input aria-label={`Note ${item.label}`} value={item.note ?? ''} onChange={(event) => updateItem(index, { note: event.target.value })} placeholder="Note facultative" />
        </div>)}
      </div>
      <div className="research-two-columns">
        <label>Observations<textarea value={value.observations ?? ''} onChange={(event) => onChange({ ...value, observations: event.target.value })} /></label>
        <label>Point à reprendre pendant la prospection<textarea value={value.talkingPoint ?? ''} onChange={(event) => onChange({ ...value, talkingPoint: event.target.value })} /></label>
        <label>URL contrôlée<input value={value.url ?? ''} onChange={(event) => onChange({ ...value, url: event.target.value })} /></label>
        <label>Source<input value={value.source ?? ''} onChange={(event) => onChange({ ...value, source: event.target.value })} /></label>
      </div>
    </div>
  </details>;
}

const emptySnapshot = (prospect: ProspectSummary): ProspectResearchSnapshotInput => ({
  checkedAt: new Date().toISOString().slice(0, 10),
  source: 'Vérification manuelle',
  sourceUrl: prospect.organizationWebsite ?? prospect.existingUrl ?? '',
  services: [],
  products: [],
  customerSegments: [],
  differentiators: [],
  googleBusiness: {
    presence: 'review',
    url: '',
    category: '',
    rating: null,
    reviewCount: null,
    hoursStatus: 'review',
    photosStatus: 'review',
    websiteLinkedStatus: 'review',
    contactConsistencyStatus: 'review',
    notes: '',
  },
  website: {
    presence: prospect.organizationWebsite || prospect.existingUrl ? 'present' : 'review',
    url: prospect.organizationWebsite ?? prospect.existingUrl ?? '',
    cms: '',
    hosting: '',
    httpsStatus: 'review',
    responsiveStatus: 'review',
    ecommerceStatus: 'review',
    bookingStatus: 'review',
    contactFormStatus: 'review',
    blogStatus: 'review',
    notes: '',
  },
  legalNotices: {
    overallStatus: 'review',
    items: LEGAL_ITEMS.map((item) => ({ ...item })),
    observations: '',
    talkingPoint: '',
    source: 'Site public',
    url: '',
  },
  audits: {
    privacy: createAudit('privacy'),
    cookies: createAudit('cookies'),
    seo: createAudit('seo'),
    performance: createAudit('performance'),
    mobile: createAudit('mobile'),
    accessibility: createAudit('accessibility'),
  },
  opportunities: [],
  conversation: {
    strengths: '',
    issues: '',
    talkingPoints: '',
    approach: '',
    callNotes: '',
  },
});

function csv(value?: string[]): string { return (value ?? []).join(', '); }
function csvList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function displayDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR');
}
function stringifyStatus(value?: ProspectResearchCheckStatus): string {
  return CHECK_OPTIONS.find((item) => item.value === value)?.label ?? '—';
}
function factMap(snapshot: ProspectResearchSnapshot): Map<string, string> {
  return new Map([
    ['Services', csv(snapshot.services)],
    ['Produits', csv(snapshot.products)],
    ['Google Business', snapshot.googleBusiness?.presence ?? '—'],
    ['Note Google', snapshot.googleBusiness?.rating == null ? '—' : String(snapshot.googleBusiness.rating)],
    ['Avis Google', snapshot.googleBusiness?.reviewCount == null ? '—' : String(snapshot.googleBusiness.reviewCount)],
    ['URL site', snapshot.website?.url ?? '—'],
    ['CMS', snapshot.website?.cms ?? '—'],
    ['HTTPS', stringifyStatus(snapshot.website?.httpsStatus)],
    ['Mobile', stringifyStatus(snapshot.website?.responsiveStatus)],
    ['Mentions légales', stringifyStatus(snapshot.legalNotices?.overallStatus)],
    ['Observations légales', snapshot.legalNotices?.observations ?? '—'],
    ['RGPD', stringifyStatus(snapshot.audits?.privacy?.overallStatus)],
    ['Cookies', stringifyStatus(snapshot.audits?.cookies?.overallStatus)],
    ['SEO', stringifyStatus(snapshot.audits?.seo?.overallStatus)],
    ['Performance', stringifyStatus(snapshot.audits?.performance?.overallStatus)],
    ['Mobile', stringifyStatus(snapshot.audits?.mobile?.overallStatus)],
    ['Accessibilité', stringifyStatus(snapshot.audits?.accessibility?.overallStatus)],
    ['Opportunités retenues', (snapshot.opportunities ?? []).filter((item) => item.keep).map((item) => item.service || item.finding).join(', ')],
  ]);
}

export function ProspectResearchPanel({ prospect, defaultOpen = false, onChanged }: {
  prospect: ProspectSummary;
  defaultOpen?: boolean;
  onChanged?: (message?: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [history, setHistory] = useState<ProspectResearchSnapshot[]>([]);
  const [draft, setDraft] = useState<ProspectResearchSnapshotInput>(() => emptySnapshot(prospect));
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState(false);

  async function load() {
    const snapshots = await window.atoumweb.crm.prospects.research.list(prospect.id);
    setHistory(snapshots);
    setDraft(snapshots[0] ?? emptySnapshot(prospect));
  }

  useEffect(() => { void load(); }, [prospect.id]);

  const differences = useMemo(() => {
    if (history.length < 2) return [];
    const current = factMap(history[0]);
    const previous = factMap(history[1]);
    return [...current.entries()]
      .filter(([key, value]) => value !== previous.get(key))
      .map(([key, value]) => ({ key, before: previous.get(key) ?? '—', after: value }));
  }, [history]);

  function updateLegalItem(index: number, patch: Partial<ProspectResearchChecklistItem>) {
    const legal = draft.legalNotices ?? { overallStatus: 'review' as const, items: LEGAL_ITEMS };
    setDraft({
      ...draft,
      legalNotices: {
        ...legal,
        items: legal.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
      },
    });
  }

  function auditValue(key: AuditKey): ProspectResearchStructuredCheck {
    return draft.audits?.[key] ?? createAudit(key);
  }

  function updateAudit(key: AuditKey, value: ProspectResearchStructuredCheck) {
    setDraft({ ...draft, audits: { ...(draft.audits ?? {}), [key]: value } });
  }

  function addOpportunity() {
    const opportunity: ProspectResearchOpportunity = { finding: '', service: '', priority: 'medium', note: '', keep: true };
    setDraft({ ...draft, opportunities: [...(draft.opportunities ?? []), opportunity] });
  }

  function updateOpportunity(index: number, patch: Partial<ProspectResearchOpportunity>) {
    setDraft({ ...draft, opportunities: (draft.opportunities ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  function removeOpportunity(index: number) {
    setDraft({ ...draft, opportunities: (draft.opportunities ?? []).filter((_, itemIndex) => itemIndex !== index) });
  }

  async function save() {
    setBusy(true);
    try {
      await window.atoumweb.crm.prospects.research.save(prospect.id, draft);
      await load();
      onChanged?.('Vérification de la connaissance entreprise enregistrée.');
    } catch (error) {
      onChanged?.(error instanceof Error ? error.message : 'Enregistrement de la vérification impossible.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="prospect-work-section prospect-research-panel">
    <div className="research-heading">
      <div>
        <span className="eyebrow">Préparation de prospection</span>
        <h3>Connaissance entreprise</h3>
        <p className="muted">Ces informations restent visibles pendant tout le parcours commercial. Chaque enregistrement crée une version datée.</p>
      </div>
      <button type="button" className="secondary-button" onClick={() => setOpen((value) => !value)}>{open ? 'Replier' : 'Ouvrir'}</button>
    </div>

    {open && <>
      <div className="research-company-strip">
        <div><small>Activité</small><strong>{prospect.organizationIndustry || 'À compléter'}</strong></div>
        <div><small>Ville</small><strong>{prospect.organizationCity || 'À compléter'}</strong></div>
        <div><small>Site</small><strong>{prospect.organizationWebsite || prospect.existingUrl || 'À vérifier'}</strong></div>
        <div><small>Dernière vérification</small><strong>{history[0] ? displayDate(history[0].checkedAt) : 'Jamais'}</strong></div>
      </div>

      <div className="research-grid">
        <fieldset className="research-card">
          <legend>Activité & offre de l’entreprise</legend>
          <label>Services proposés <FieldHelp text="Lister ce que l’entreprise vend réellement. Pendant l’appel, utilise cette liste pour parler de son activité avec des exemples concrets." />
            <input value={csv(draft.services)} onChange={(e) => setDraft({ ...draft, services: csvList(e.target.value) })} placeholder="Ex. sur place, à emporter, traiteur" />
          </label>
          <label>Produits principaux<input value={csv(draft.products)} onChange={(e) => setDraft({ ...draft, products: csvList(e.target.value) })} /></label>
          <label>Clientèles visées<input value={csv(draft.customerSegments)} onChange={(e) => setDraft({ ...draft, customerSegments: csvList(e.target.value) })} /></label>
          <label>Points différenciants<input value={csv(draft.differentiators)} onChange={(e) => setDraft({ ...draft, differentiators: csvList(e.target.value) })} /></label>
        </fieldset>

        <fieldset className="research-card">
          <legend>Google Business Profile <FieldHelp text="Vérifier la présence de la fiche, la catégorie, la note et le volume d’avis, les horaires, les photos, le site lié et la cohérence téléphone/adresse/site." /></legend>
          <div className="research-inline-fields">
            <label>Présence<select value={draft.googleBusiness?.presence ?? 'review'} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), presence: e.target.value as 'present' | 'absent' | 'review' } })}><option value="present">Présent</option><option value="absent">Absent</option><option value="review">À vérifier</option></select></label>
            <label>Note<input type="number" min="0" max="5" step="0.1" value={draft.googleBusiness?.rating ?? ''} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), rating: e.target.value === '' ? null : Number(e.target.value) } })} /></label>
            <label>Nombre d’avis<input type="number" min="0" step="1" value={draft.googleBusiness?.reviewCount ?? ''} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), reviewCount: e.target.value === '' ? null : Number(e.target.value) } })} /></label>
          </div>
          <label>URL de la fiche<input value={draft.googleBusiness?.url ?? ''} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), url: e.target.value } })} /></label>
          <label>Catégorie principale<input value={draft.googleBusiness?.category ?? ''} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), category: e.target.value } })} /></label>
          <div className="research-check-grid">
            {[
              ['hoursStatus','Horaires'],
              ['photosStatus','Photos'],
              ['websiteLinkedStatus','Site lié'],
              ['contactConsistencyStatus','Coordonnées cohérentes'],
            ].map(([key,label]) => <label key={key}>{label}<select value={statusValue((draft.googleBusiness as Record<string, unknown> | undefined)?.[key])} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), [key]: e.target.value as ProspectResearchCheckStatus } })}>{CHECK_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>)}
          </div>
          <label>Observations<textarea value={draft.googleBusiness?.notes ?? ''} onChange={(e) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), notes: e.target.value } })} /></label>
        </fieldset>

        <fieldset className="research-card">
          <legend>Site internet <FieldHelp text="Vérifier l’URL, le CMS si identifiable sans intrusion, HTTPS, affichage mobile, vente ou réservation, formulaire de contact, actualités et éléments manifestement anciens." /></legend>
          <div className="research-inline-fields">
            <label>Présence<select value={draft.website?.presence ?? 'review'} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), presence: e.target.value as 'present' | 'absent' | 'review' } })}><option value="present">Présent</option><option value="absent">Absent</option><option value="review">À vérifier</option></select></label>
            <label>CMS<input value={draft.website?.cms ?? ''} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), cms: e.target.value } })} placeholder="WordPress, Wix, Shopify…" /></label>
            <label>Hébergeur<input value={draft.website?.hosting ?? ''} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), hosting: e.target.value } })} /></label>
          </div>
          <label>URL<input value={draft.website?.url ?? ''} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), url: e.target.value } })} /></label>
          <div className="research-check-grid">
            {[
              ['httpsStatus','HTTPS'],
              ['responsiveStatus','Mobile / responsive'],
              ['ecommerceStatus','E-commerce'],
              ['bookingStatus','Réservation'],
              ['contactFormStatus','Formulaire'],
              ['blogStatus','Blog / actualités'],
            ].map(([key,label]) => <label key={key}>{label}<select value={statusValue((draft.website as Record<string, unknown> | undefined)?.[key])} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), [key]: e.target.value as ProspectResearchCheckStatus } })}>{CHECK_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>)}
          </div>
          <label>Observations<textarea value={draft.website?.notes ?? ''} onChange={(e) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), notes: e.target.value } })} /></label>
        </fieldset>

        <fieldset className="research-card research-card-wide">
          <legend>Mentions légales <FieldHelp text="Vérifier concrètement l’identité de l’entreprise, son adresse, l’immatriculation si applicable, les coordonnées, le responsable de publication si pertinent, l’hébergeur, la cohérence des informations et l’accès au lien Mentions légales." /></legend>
          <label>État global<select value={draft.legalNotices?.overallStatus ?? 'review'} onChange={(e) => setDraft({ ...draft, legalNotices: { ...(draft.legalNotices ?? { items: LEGAL_ITEMS }), overallStatus: e.target.value as ProspectResearchCheckStatus } })}>{CHECK_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <div className="research-checklist">
            {(draft.legalNotices?.items ?? LEGAL_ITEMS).map((item, index) => <div className="research-check-row" key={item.key}>
              <strong>{item.label}</strong>
              <select aria-label={`Statut ${item.label}`} value={item.status} onChange={(e) => updateLegalItem(index, { status: e.target.value as ProspectResearchCheckStatus })}>{CHECK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <input aria-label={`Note ${item.label}`} value={item.note ?? ''} onChange={(e) => updateLegalItem(index, { note: e.target.value })} placeholder="Note facultative" />
            </div>)}
          </div>
          <div className="research-two-columns">
            <label>Observations libres<textarea value={draft.legalNotices?.observations ?? ''} onChange={(e) => setDraft({ ...draft, legalNotices: { ...(draft.legalNotices ?? { overallStatus: 'review', items: LEGAL_ITEMS }), observations: e.target.value } })} placeholder="Ex. ancienne adresse, hébergeur absent, SIRET correct…" /></label>
            <label>Point à reprendre pendant la prospection<textarea value={draft.legalNotices?.talkingPoint ?? ''} onChange={(e) => setDraft({ ...draft, legalNotices: { ...(draft.legalNotices ?? { overallStatus: 'review', items: LEGAL_ITEMS }), talkingPoint: e.target.value } })} placeholder="Ex. proposer la mise à jour des mentions légales" /></label>
          </div>
          <div className="research-two-columns">
            <label>URL contrôlée<input value={draft.legalNotices?.url ?? ''} onChange={(e) => setDraft({ ...draft, legalNotices: { ...(draft.legalNotices ?? { overallStatus: 'review', items: LEGAL_ITEMS }), url: e.target.value } })} /></label>
            <label>Source<input value={draft.legalNotices?.source ?? ''} onChange={(e) => setDraft({ ...draft, legalNotices: { ...(draft.legalNotices ?? { overallStatus: 'review', items: LEGAL_ITEMS }), source: e.target.value } })} /></label>
          </div>
        </fieldset>

        <fieldset className="research-card research-card-wide">
          <legend>Autres contrôles structurés</legend>
          <p className="muted">Ces contrôles utilisent la même logique que les mentions légales : état par point, observations et sujet à reprendre pendant l’échange.</p>
          <div className="research-audit-list">
            {(Object.keys(AUDIT_DEFINITIONS) as AuditKey[]).map((key) => <StructuredCheckEditor
              key={key}
              title={AUDIT_DEFINITIONS[key].title}
              help={AUDIT_DEFINITIONS[key].help}
              value={auditValue(key)}
              onChange={(value) => updateAudit(key, value)}
            />)}
          </div>
        </fieldset>

        <fieldset className="research-card research-card-wide">
          <legend>Opportunités AtoumWeb <FieldHelp text="Transformer un constat factuel en piste commerciale sans créer automatiquement de devis. Garde uniquement les opportunités utiles pour la conversation et la suite du parcours." /></legend>
          <div className="research-opportunities">
            {(draft.opportunities ?? []).map((item, index) => <div className="research-opportunity-row" key={index}>
              <label>Constat<input value={item.finding} onChange={(event) => updateOpportunity(index, { finding: event.target.value })} placeholder="Ex. fiche Google peu renseignée" /></label>
              <label>Prestation AtoumWeb<input value={item.service} onChange={(event) => updateOpportunity(index, { service: event.target.value })} placeholder="Ex. SEO local / visibilité" /></label>
              <label>Priorité<select value={item.priority} onChange={(event) => updateOpportunity(index, { priority: event.target.value as ProspectResearchOpportunity['priority'] })}><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Forte</option></select></label>
              <label>Note<input value={item.note ?? ''} onChange={(event) => updateOpportunity(index, { note: event.target.value })} /></label>
              <label className="research-keep"><input type="checkbox" checked={item.keep} onChange={(event) => updateOpportunity(index, { keep: event.target.checked })} /> Retenir</label>
              <button type="button" className="secondary-button danger-outline" onClick={() => removeOpportunity(index)}>Supprimer</button>
            </div>)}
            {(draft.opportunities ?? []).length === 0 && <p className="muted">Aucune opportunité enregistrée pour le moment.</p>}
            <button type="button" className="secondary-button" onClick={addOpportunity}>+ Ajouter une opportunité</button>
          </div>
        </fieldset>

        <fieldset className="research-card research-card-wide">
          <legend>Préparation de la conversation</legend>
          <div className="research-two-columns">
            <label>Points forts repérés<textarea value={draft.conversation?.strengths ?? ''} onChange={(e) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), strengths: e.target.value } })} /></label>
            <label>Problèmes observés<textarea value={draft.conversation?.issues ?? ''} onChange={(e) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), issues: e.target.value } })} /></label>
            <label>Points à évoquer<textarea value={draft.conversation?.talkingPoints ?? ''} onChange={(e) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), talkingPoints: e.target.value } })} /></label>
            <label>Angle d’approche<textarea value={draft.conversation?.approach ?? ''} onChange={(e) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), approach: e.target.value } })} /></label>
          </div>
          <label>À ne pas oublier / notes pendant l’appel<textarea value={draft.conversation?.callNotes ?? ''} onChange={(e) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), callNotes: e.target.value } })} /></label>
        </fieldset>
      </div>

      <div className="research-save-bar">
        <div className="research-save-meta">
          <label>Date de vérification<input type="date" value={(draft.checkedAt ?? '').slice(0,10)} onChange={(e) => setDraft({ ...draft, checkedAt: e.target.value })} /></label>
          <label>Source générale<input value={draft.source ?? ''} onChange={(e) => setDraft({ ...draft, source: e.target.value })} /></label>
          <label>URL source<input value={draft.sourceUrl ?? ''} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} /></label>
        </div>
        <button type="button" className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer cette vérification'}</button>
      </div>

      {history.length > 0 && <div className="research-history">
        <div className="research-history-heading"><div><strong>Historique des vérifications</strong><small>{history.length} version{history.length > 1 ? 's' : ''}</small></div>{history.length > 1 && <button className="secondary-button" type="button" onClick={() => setCompare((value) => !value)}>{compare ? 'Masquer la comparaison' : 'Comparer avec la précédente'}</button>}</div>
        <div className="research-version-list">{history.slice(0,5).map((snapshot, index) => <span key={snapshot.id} className={index === 0 ? 'current' : ''}>{displayDate(snapshot.checkedAt)}{index === 0 ? ' · actuelle' : ''}</span>)}</div>
        {compare && <div className="research-diff">{differences.length === 0 ? <p className="muted">Aucun changement sur les indicateurs comparés.</p> : differences.map((diff) => <div className="research-diff-row" key={diff.key}><strong>{diff.key}</strong><span>{diff.before || '—'}</span><b>→</b><span>{diff.after || '—'}</span></div>)}</div>}
      </div>}
    </>}
  </section>;
}
