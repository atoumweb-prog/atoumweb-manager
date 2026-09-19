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

type ResearchTab = 'company' | 'visibility' | 'checks' | 'opportunities' | 'conversation' | 'history';

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
    help: 'Vérifier la politique de confidentialité, le responsable du traitement, les finalités, les droits et le moyen de contact prévu.',
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
    help: 'Vérifier le bandeau, le refus aussi simple que l’acceptation, le blocage des traceurs non nécessaires avant consentement et la modification du choix.',
    items: [
      ['banner', 'Bandeau cookies présent si nécessaire'],
      ['refuse', 'Refuser aussi facilement qu’accepter'],
      ['prior-consent', 'Traceurs non nécessaires bloqués avant consentement'],
      ['preferences', 'Préférences modifiables après le choix'],
    ],
  },
  seo: {
    title: 'SEO de base',
    help: 'Vérifier les titres de pages, meta descriptions, H1, indexabilité et cohérence locale.',
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
    help: 'Repérer les lenteurs visibles, images lourdes et erreurs de chargement. Ce contrôle reste un indicateur commercial.',
    items: [
      ['loading', 'Chargement perçu correct'],
      ['images', 'Images raisonnablement optimisées'],
      ['errors', 'Pas d’erreur de chargement visible'],
    ],
  },
  mobile: {
    title: 'Mobile / responsive',
    help: 'Tester la lisibilité, la navigation, les boutons et formulaires sur une largeur mobile courante.',
    items: [
      ['layout', 'Mise en page adaptée'],
      ['navigation', 'Navigation utilisable'],
      ['tap-targets', 'Boutons et liens faciles à toucher'],
      ['forms', 'Formulaires utilisables'],
    ],
  },
  accessibility: {
    title: 'Accessibilité de base',
    help: 'Repérer les problèmes évidents de contraste, textes alternatifs, hiérarchie des titres et intitulés. Ce n’est pas un audit RGAA.',
    items: [
      ['contrast', 'Contrastes lisibles'],
      ['alt', 'Images importantes avec texte alternatif'],
      ['headings', 'Hiérarchie de titres cohérente'],
      ['controls', 'Boutons et liens avec intitulé compréhensible'],
    ],
  },
} as const;

type AuditKey = keyof typeof AUDIT_DEFINITIONS;
type GoogleStatusKey = 'hoursStatus' | 'photosStatus' | 'websiteLinkedStatus' | 'contactConsistencyStatus';
type WebsiteStatusKey = 'httpsStatus' | 'responsiveStatus' | 'ecommerceStatus' | 'bookingStatus' | 'contactFormStatus' | 'blogStatus';

function createAudit(key: AuditKey): ProspectResearchStructuredCheck {
  return {
    overallStatus: 'review',
    items: AUDIT_DEFINITIONS[key].items.map(([itemKey, label]) => ({ key: itemKey, label, status: 'review' })),
    observations: '',
    talkingPoint: '',
    source: 'Site public',
    url: '',
  };
}

function mergeCheck(defaultValue: ProspectResearchStructuredCheck, actual?: ProspectResearchStructuredCheck): ProspectResearchStructuredCheck {
  if (!actual) return defaultValue;
  return {
    ...defaultValue,
    ...actual,
    items: defaultValue.items.map((fallback) => {
      const saved = actual.items?.find((item) => item.key === fallback.key);
      return saved ? { ...fallback, ...saved } : { ...fallback };
    }),
  };
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

function hydrateSnapshot(prospect: ProspectSummary, snapshot: ProspectResearchSnapshot): ProspectResearchSnapshotInput {
  const defaults = emptySnapshot(prospect);
  const defaultLegal = defaults.legalNotices as ProspectResearchStructuredCheck;
  return {
    ...defaults,
    ...snapshot,
    googleBusiness: { ...defaults.googleBusiness!, ...snapshot.googleBusiness },
    website: { ...defaults.website!, ...snapshot.website },
    legalNotices: mergeCheck(defaultLegal, snapshot.legalNotices),
    audits: {
      privacy: mergeCheck(createAudit('privacy'), snapshot.audits?.privacy),
      cookies: mergeCheck(createAudit('cookies'), snapshot.audits?.cookies),
      seo: mergeCheck(createAudit('seo'), snapshot.audits?.seo),
      performance: mergeCheck(createAudit('performance'), snapshot.audits?.performance),
      mobile: mergeCheck(createAudit('mobile'), snapshot.audits?.mobile),
      accessibility: mergeCheck(createAudit('accessibility'), snapshot.audits?.accessibility),
    },
    opportunities: snapshot.opportunities ?? [],
    conversation: { ...defaults.conversation, ...snapshot.conversation },
  };
}

function csv(value?: string[]): string { return (value ?? []).join(', '); }
function csvList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function displayDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR');
}
function statusLabel(value?: ProspectResearchCheckStatus): string {
  return CHECK_OPTIONS.find((item) => item.value === value)?.label ?? 'À vérifier';
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
  return <section className="research-check-card">
    <div className="research-check-card-head">
      <div><strong>{title}</strong><FieldHelp text={help} /></div>
      <span className={`research-status research-status-${value.overallStatus}`}>{statusLabel(value.overallStatus)}</span>
    </div>
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
  </section>;
}

function factMap(snapshot: ProspectResearchSnapshot): Map<string, string> {
  return new Map([
    ['Services', csv(snapshot.services)],
    ['Produits', csv(snapshot.products)],
    ['Clientèle', csv(snapshot.customerSegments)],
    ['Différenciants', csv(snapshot.differentiators)],
    ['Google Business', snapshot.googleBusiness?.presence ?? '—'],
    ['Note Google', snapshot.googleBusiness?.rating == null ? '—' : String(snapshot.googleBusiness.rating)],
    ['Avis Google', snapshot.googleBusiness?.reviewCount == null ? '—' : String(snapshot.googleBusiness.reviewCount)],
    ['URL site', snapshot.website?.url ?? '—'],
    ['CMS', snapshot.website?.cms ?? '—'],
    ['Mentions légales', statusLabel(snapshot.legalNotices?.overallStatus)],
    ['RGPD', statusLabel(snapshot.audits?.privacy?.overallStatus)],
    ['Cookies', statusLabel(snapshot.audits?.cookies?.overallStatus)],
    ['SEO', statusLabel(snapshot.audits?.seo?.overallStatus)],
    ['Performance', statusLabel(snapshot.audits?.performance?.overallStatus)],
    ['Mobile', statusLabel(snapshot.audits?.mobile?.overallStatus)],
    ['Accessibilité', statusLabel(snapshot.audits?.accessibility?.overallStatus)],
    ['Points à évoquer', snapshot.conversation?.talkingPoints ?? '—'],
    ['Angle d’approche', snapshot.conversation?.approach ?? '—'],
    ['Opportunités retenues', (snapshot.opportunities ?? []).filter((item) => item.keep).map((item) => item.service || item.finding).join(', ')],
  ]);
}

export function ProspectResearchPanel({ prospect, defaultOpen = true, onChanged }: {
  prospect: ProspectSummary;
  defaultOpen?: boolean;
  onChanged?: (message?: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<ResearchTab>('company');
  const [history, setHistory] = useState<ProspectResearchSnapshot[]>([]);
  const [draft, setDraft] = useState<ProspectResearchSnapshotInput>(() => emptySnapshot(prospect));
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState(false);

  async function load() {
    const snapshots = await window.atoumweb.crm.prospects.research.list(prospect.id);
    setHistory(snapshots);
    setDraft(snapshots[0] ? hydrateSnapshot(prospect, snapshots[0]) : emptySnapshot(prospect));
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

  function updateGoogleStatus(key: GoogleStatusKey, value: ProspectResearchCheckStatus) {
    setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), [key]: value } });
  }

  function updateWebsiteStatus(key: WebsiteStatusKey, value: ProspectResearchCheckStatus) {
    setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), [key]: value } });
  }

  function updateAudit(key: AuditKey, value: ProspectResearchStructuredCheck) {
    setDraft({ ...draft, audits: { ...(draft.audits ?? {}), [key]: value } });
  }

  function updateOpportunity(index: number, patch: Partial<ProspectResearchOpportunity>) {
    setDraft({ ...draft, opportunities: (draft.opportunities ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  async function save() {
    setBusy(true);
    try {
      await window.atoumweb.crm.prospects.research.save(prospect.id, draft);
      await load();
      onChanged?.('Nouvelle version de la connaissance entreprise enregistrée.');
    } catch (error) {
      onChanged?.(error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  }

  const legal = mergeCheck({ overallStatus: 'review', items: LEGAL_ITEMS.map((item) => ({ ...item })), observations: '', talkingPoint: '', source: 'Site public', url: '' }, draft.legalNotices);

  return <section className="prospect-work-section prospect-research-panel">
    <div className="research-heading">
      <div>
        <span className="eyebrow">Référence prospect</span>
        <h3>Connaissance entreprise</h3>
        <p className="muted">Une information de référence, modifiable et versionnée, sans mélanger la préparation avec le suivi commercial.</p>
      </div>
      <button type="button" className="secondary-button" onClick={() => setOpen((value) => !value)}>{open ? 'Réduire' : 'Afficher'}</button>
    </div>

    {open && <>
      <div className="research-company-strip">
        <div><small>Activité</small><strong>{prospect.organizationIndustry || 'À compléter'}</strong></div>
        <div><small>Ville</small><strong>{prospect.organizationCity || 'À compléter'}</strong></div>
        <div><small>Site</small><strong>{prospect.organizationWebsite || prospect.existingUrl || 'À vérifier'}</strong></div>
        <div><small>Dernière vérification</small><strong>{history[0] ? displayDate(history[0].checkedAt) : 'Jamais'}</strong></div>
      </div>

      <div className="research-tabs" role="tablist" aria-label="Connaissance entreprise">
        {([
          ['company', 'Entreprise'],
          ['visibility', 'Web & visibilité'],
          ['checks', 'Contrôles'],
          ['opportunities', 'Opportunités'],
          ['conversation', 'Conversation'],
          ['history', 'Historique'],
        ] as Array<[ResearchTab, string]>).map(([key, label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
      </div>

      <div className="research-tab-content">
        {tab === 'company' && <div className="research-grid research-grid-single-row">
          <fieldset className="research-card">
            <legend>Activité & offre de l’entreprise</legend>
            <label>Services proposés <FieldHelp text="Ce que l’entreprise vend réellement. Utilise des termes concrets utilisables pendant l’appel." /><input value={csv(draft.services)} onChange={(event) => setDraft({ ...draft, services: csvList(event.target.value) })} placeholder="Ex. gardiennage, rondes, intervention sur alarme" /></label>
            <label>Produits principaux<input value={csv(draft.products)} onChange={(event) => setDraft({ ...draft, products: csvList(event.target.value) })} /></label>
            <label>Clientèles visées<input value={csv(draft.customerSegments)} onChange={(event) => setDraft({ ...draft, customerSegments: csvList(event.target.value) })} /></label>
            <label>Points différenciants<input value={csv(draft.differentiators)} onChange={(event) => setDraft({ ...draft, differentiators: csvList(event.target.value) })} /></label>
          </fieldset>
          <fieldset className="research-card">
            <legend>Notes source</legend>
            <p className="muted">{prospect.organizationNotes || 'Aucune note brute. Utilise les champs structurés à gauche pour organiser les informations utiles.'}</p>
            <p className="muted">La note brute reste conservée ; les informations utiles doivent progressivement être classées dans les rubriques ci-contre.</p>
          </fieldset>
        </div>}

        {tab === 'visibility' && <div className="research-grid">
          <fieldset className="research-card">
            <legend>Google Business Profile <FieldHelp text="Vérifier présence, catégorie, avis, horaires, photos, site lié et cohérence des coordonnées." /></legend>
            <div className="research-inline-fields">
              <label>Présence<select value={draft.googleBusiness?.presence ?? 'review'} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), presence: event.target.value as 'present' | 'absent' | 'review' } })}><option value="present">Présent</option><option value="absent">Absent</option><option value="review">À vérifier</option></select></label>
              <label>Note<input type="number" min="0" max="5" step="0.1" value={draft.googleBusiness?.rating ?? ''} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), rating: event.target.value === '' ? null : Number(event.target.value) } })} /></label>
              <label>Nombre d’avis<input type="number" min="0" step="1" value={draft.googleBusiness?.reviewCount ?? ''} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), reviewCount: event.target.value === '' ? null : Number(event.target.value) } })} /></label>
            </div>
            <label>URL de la fiche<input value={draft.googleBusiness?.url ?? ''} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), url: event.target.value } })} /></label>
            <label>Catégorie principale<input value={draft.googleBusiness?.category ?? ''} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), category: event.target.value } })} /></label>
            <div className="research-check-grid">
              <label>Horaires<CheckSelect value={draft.googleBusiness?.hoursStatus} onChange={(value) => updateGoogleStatus('hoursStatus', value)} /></label>
              <label>Photos<CheckSelect value={draft.googleBusiness?.photosStatus} onChange={(value) => updateGoogleStatus('photosStatus', value)} /></label>
              <label>Site lié<CheckSelect value={draft.googleBusiness?.websiteLinkedStatus} onChange={(value) => updateGoogleStatus('websiteLinkedStatus', value)} /></label>
              <label>Coordonnées cohérentes<CheckSelect value={draft.googleBusiness?.contactConsistencyStatus} onChange={(value) => updateGoogleStatus('contactConsistencyStatus', value)} /></label>
            </div>
            <label>Observations<textarea value={draft.googleBusiness?.notes ?? ''} onChange={(event) => setDraft({ ...draft, googleBusiness: { ...(draft.googleBusiness ?? { presence: 'review' }), notes: event.target.value } })} /></label>
          </fieldset>

          <fieldset className="research-card">
            <legend>Site internet <FieldHelp text="Vérifier URL, CMS si identifiable sans intrusion, HTTPS, mobile, e-commerce, réservation, formulaire et actualités." /></legend>
            <div className="research-inline-fields">
              <label>Présence<select value={draft.website?.presence ?? 'review'} onChange={(event) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), presence: event.target.value as 'present' | 'absent' | 'review' } })}><option value="present">Présent</option><option value="absent">Absent</option><option value="review">À vérifier</option></select></label>
              <label>CMS<input value={draft.website?.cms ?? ''} onChange={(event) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), cms: event.target.value } })} /></label>
              <label>Hébergeur<input value={draft.website?.hosting ?? ''} onChange={(event) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), hosting: event.target.value } })} /></label>
            </div>
            <label>URL<input value={draft.website?.url ?? ''} onChange={(event) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), url: event.target.value } })} /></label>
            <div className="research-check-grid">
              <label>HTTPS<CheckSelect value={draft.website?.httpsStatus} onChange={(value) => updateWebsiteStatus('httpsStatus', value)} /></label>
              <label>Mobile / responsive<CheckSelect value={draft.website?.responsiveStatus} onChange={(value) => updateWebsiteStatus('responsiveStatus', value)} /></label>
              <label>E-commerce<CheckSelect value={draft.website?.ecommerceStatus} onChange={(value) => updateWebsiteStatus('ecommerceStatus', value)} /></label>
              <label>Réservation<CheckSelect value={draft.website?.bookingStatus} onChange={(value) => updateWebsiteStatus('bookingStatus', value)} /></label>
              <label>Formulaire<CheckSelect value={draft.website?.contactFormStatus} onChange={(value) => updateWebsiteStatus('contactFormStatus', value)} /></label>
              <label>Blog / actualités<CheckSelect value={draft.website?.blogStatus} onChange={(value) => updateWebsiteStatus('blogStatus', value)} /></label>
            </div>
            <label>Observations<textarea value={draft.website?.notes ?? ''} onChange={(event) => setDraft({ ...draft, website: { ...(draft.website ?? { presence: 'review' }), notes: event.target.value } })} /></label>
          </fieldset>
        </div>}

        {tab === 'checks' && <div className="research-checks-stack">
          <StructuredCheckEditor title="Mentions légales" help="Vérifier identité, adresse, immatriculation, coordonnées, publication, hébergeur, cohérence et accès au lien." value={legal} onChange={(value) => setDraft({ ...draft, legalNotices: value })} />
          {(Object.keys(AUDIT_DEFINITIONS) as AuditKey[]).map((key) => <StructuredCheckEditor key={key} title={AUDIT_DEFINITIONS[key].title} help={AUDIT_DEFINITIONS[key].help} value={draft.audits?.[key] ?? createAudit(key)} onChange={(value) => updateAudit(key, value)} />)}
        </div>}

        {tab === 'opportunities' && <fieldset className="research-card research-card-wide">
          <legend>Opportunités AtoumWeb <FieldHelp text="Transformer un constat factuel en piste commerciale sans créer automatiquement de devis." /></legend>
          <div className="research-opportunities">
            {(draft.opportunities ?? []).map((item, index) => <div className="research-opportunity-row" key={index}>
              <label>Constat<input value={item.finding} onChange={(event) => updateOpportunity(index, { finding: event.target.value })} /></label>
              <label>Prestation AtoumWeb<input value={item.service} onChange={(event) => updateOpportunity(index, { service: event.target.value })} /></label>
              <label>Priorité<select value={item.priority} onChange={(event) => updateOpportunity(index, { priority: event.target.value as ProspectResearchOpportunity['priority'] })}><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Forte</option></select></label>
              <label>Note<input value={item.note ?? ''} onChange={(event) => updateOpportunity(index, { note: event.target.value })} /></label>
              <label className="research-keep"><input type="checkbox" checked={item.keep} onChange={(event) => updateOpportunity(index, { keep: event.target.checked })} /> Retenir</label>
              <button type="button" className="secondary-button danger-outline" onClick={() => setDraft({ ...draft, opportunities: (draft.opportunities ?? []).filter((_, itemIndex) => itemIndex !== index) })}>Supprimer</button>
            </div>)}
            {(draft.opportunities ?? []).length === 0 && <p className="muted">Aucune opportunité enregistrée.</p>}
            <button type="button" className="secondary-button" onClick={() => setDraft({ ...draft, opportunities: [...(draft.opportunities ?? []), { finding: '', service: '', priority: 'medium', note: '', keep: true }] })}>+ Ajouter une opportunité</button>
          </div>
        </fieldset>}

        {tab === 'conversation' && <fieldset className="research-card research-card-wide">
          <legend>Préparation de la conversation</legend>
          <div className="research-two-columns">
            <label>Points forts repérés<textarea value={draft.conversation?.strengths ?? ''} onChange={(event) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), strengths: event.target.value } })} /></label>
            <label>Problèmes observés<textarea value={draft.conversation?.issues ?? ''} onChange={(event) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), issues: event.target.value } })} /></label>
            <label>Points à évoquer<textarea value={draft.conversation?.talkingPoints ?? ''} onChange={(event) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), talkingPoints: event.target.value } })} /></label>
            <label>Angle d’approche<textarea value={draft.conversation?.approach ?? ''} onChange={(event) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), approach: event.target.value } })} /></label>
          </div>
          <label>À ne pas oublier / notes pendant l’appel<textarea value={draft.conversation?.callNotes ?? ''} onChange={(event) => setDraft({ ...draft, conversation: { ...(draft.conversation ?? {}), callNotes: event.target.value } })} /></label>
        </fieldset>}

        {tab === 'history' && <div className="research-history">
          <div className="research-history-heading"><div><strong>Historique des vérifications</strong><small>{history.length} version{history.length > 1 ? 's' : ''}</small></div>{history.length > 1 && <button className="secondary-button" type="button" onClick={() => setCompare((value) => !value)}>{compare ? 'Masquer la comparaison' : 'Comparer avec la précédente'}</button>}</div>
          <div className="research-version-list">{history.slice(0, 8).map((snapshot, index) => <span key={snapshot.id} className={index === 0 ? 'current' : ''}>{displayDate(snapshot.checkedAt)}{index === 0 ? ' · actuelle' : ''}</span>)}</div>
          {history.length === 0 && <p className="muted">Aucune vérification enregistrée.</p>}
          {compare && <div className="research-diff">{differences.length === 0 ? <p className="muted">Aucun changement sur les indicateurs comparés.</p> : differences.map((diff) => <div className="research-diff-row" key={diff.key}><strong>{diff.key}</strong><span>{diff.before || '—'}</span><b>→</b><span>{diff.after || '—'}</span></div>)}</div>}
        </div>}
      </div>

      {tab !== 'history' && <div className="research-save-bar">
        <div className="research-save-meta">
          <label>Date de vérification<input type="date" value={(draft.checkedAt ?? '').slice(0, 10)} onChange={(event) => setDraft({ ...draft, checkedAt: event.target.value })} /></label>
          <label>Source générale<input value={draft.source ?? ''} onChange={(event) => setDraft({ ...draft, source: event.target.value })} /></label>
          <label>URL source<input value={draft.sourceUrl ?? ''} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} /></label>
        </div>
        <button type="button" className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer une nouvelle version'}</button>
      </div>}
    </>}
  </section>;
}
