import { useState } from 'react';
import {
  QUOTE_ADJUSTMENT_MODES,
  QUOTE_DISCOUNT_REASONS,
  type QuoteAdjustmentMode,
  type QuoteDiscountReason,
  type QuoteLine,
  type QuoteLineInput,
} from '../../shared/commercial';

const ADJUSTMENT_LABELS: Record<QuoteAdjustmentMode, string> = {
  none: 'Aucune remise',
  percent: 'Remise en %',
  fixed_amount: 'Remise fixe',
  override_price: 'Prix contractuel imposé',
  free: 'Gratuit',
};

const REASON_LABELS: Record<QuoteDiscountReason, string> = {
  negotiated: 'Négocié',
  commercial_gesture: 'Geste commercial',
  pilot_client: 'Client pilote',
  partnership: 'Partenariat',
  loyalty: 'Fidélité',
  pack: 'Pack',
  other: 'Autre',
};

function centsToEuros(value?: number | null): string {
  return value == null ? '' : String(value / 100);
}

function eurosToCents(value: string): number {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Montant invalide.');
  return Math.round(parsed * 100);
}

function adjustmentValueForDisplay(line: QuoteLine): string {
  if (line.adjustmentMode === 'percent') return String((line.adjustmentValue ?? 0) / 100);
  if (line.adjustmentMode === 'fixed_amount' || line.adjustmentMode === 'override_price') {
    return centsToEuros(line.adjustmentValue);
  }
  return '';
}

export function QuoteLineEditor({
  line,
  onSave,
  onCancel,
}: {
  line: QuoteLine;
  onSave: (input: QuoteLineInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(line.label);
  const [description, setDescription] = useState(line.description ?? '');
  const [quantity, setQuantity] = useState(String((line.quantityMilli ?? 1000) / 1000));
  const [proposedPrice, setProposedPrice] = useState(centsToEuros(line.proposedUnitPriceCents ?? line.catalogUnitPriceCents));
  const [mode, setMode] = useState<QuoteAdjustmentMode>(line.adjustmentMode ?? 'none');
  const [adjustment, setAdjustment] = useState(adjustmentValueForDisplay(line));
  const [reason, setReason] = useState<'' | QuoteDiscountReason>(line.discountReasonCode ?? '');
  const [reasonText, setReasonText] = useState(line.discountReasonText ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    setError(null);
    try {
      if (!label.trim()) throw new Error('Le libellé est requis.');
      const quantityNumber = Number(quantity.trim().replace(',', '.'));
      if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) throw new Error('Quantité invalide.');
      const proposedUnitPriceCents = eurosToCents(proposedPrice);

      let adjustmentValue: number | null = null;
      if (mode === 'percent') {
        const percent = Number(adjustment.trim().replace(',', '.'));
        if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error('Pourcentage de remise invalide.');
        adjustmentValue = Math.round(percent * 100);
      } else if (mode === 'fixed_amount' || mode === 'override_price') {
        adjustmentValue = eurosToCents(adjustment);
      }

      setSaving(true);
      await onSave({
        label: label.trim(),
        description: description.trim() || null,
        quantityMilli: Math.round(quantityNumber * 1000),
        catalogUnitPriceCents: line.catalogUnitPriceCents ?? proposedUnitPriceCents,
        proposedUnitPriceCents,
        adjustmentMode: mode,
        adjustmentValue,
        discountReasonCode: reason || null,
        discountReasonText: reasonText.trim() || null,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Modification impossible.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="quote-line-editor">
      <div className="quote-line-editor-grid">
        <label>Libellé<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Quantité<input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label>Prix proposé / unité (€)<input inputMode="decimal" value={proposedPrice} onChange={(event) => setProposedPrice(event.target.value)} /></label>
        <label>Mode<select value={mode} onChange={(event) => { setMode(event.target.value as QuoteAdjustmentMode); setAdjustment(''); }}>{QUOTE_ADJUSTMENT_MODES.map((value) => <option key={value} value={value}>{ADJUSTMENT_LABELS[value]}</option>)}</select></label>
        {(mode === 'percent' || mode === 'fixed_amount' || mode === 'override_price') && (
          <label>{mode === 'percent' ? 'Remise (%)' : mode === 'fixed_amount' ? 'Remise (€)' : 'Prix final ligne (€)'}<input inputMode="decimal" value={adjustment} onChange={(event) => setAdjustment(event.target.value)} /></label>
        )}
        <label>Raison commerciale<select value={reason} onChange={(event) => setReason(event.target.value as '' | QuoteDiscountReason)}><option value="">Aucune</option>{QUOTE_DISCOUNT_REASONS.map((value) => <option key={value} value={value}>{REASON_LABELS[value]}</option>)}</select></label>
        <label className="quote-line-description">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="quote-line-description">Précision sur la remise<textarea value={reasonText} onChange={(event) => setReasonText(event.target.value)} placeholder="Ex. remise accordée pour lancement / client pilote…" /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={onCancel}>Annuler</button><button className="primary-button" disabled={saving} type="button" onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer la ligne'}</button></div>
    </div>
  );
}
