import { useState } from 'react';
import type { PersonalTableView } from '../../shared/personalTableViews';
import { AppButton } from './AppButton';
import { AppTextField } from './AppTextField';
export function SavedViewPicker({ views, selected, onSelect, onCreate, onRename, onDelete, onReset }: {
  views: readonly PersonalTableView[]; selected: string; onSelect: (id: string) => void;
  onCreate: (name: string, duplicate: boolean) => void; onRename: (name: string) => void; onDelete: () => void; onReset: () => void;
}) {
  const [name, setName] = useState('');
  return <section className="aw-saved-views" aria-label="Vues personnelles"><label>Vue personnelle<select id="table-personal-view" value={selected} onChange={e => onSelect(e.target.value)}><option value="standard">Vue standard (défaut rétablissable)</option>{views.map(view => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
    <AppTextField id="table-view-name" label="Nom de la vue" value={name} maxLength={80} onChange={e => setName(e.target.value)}/>
    <AppButton disabled={!name.trim()} onAction={() => onCreate(name.trim(), false)}>Créer une vue</AppButton>
    <AppButton disabled={!name.trim()} onAction={() => onCreate(name.trim(), true)}>Dupliquer la vue</AppButton>
    <AppButton disabled={selected === 'standard' || !name.trim()} onAction={() => onRename(name.trim())}>Renommer la vue</AppButton>
    <AppButton disabled={selected === 'standard'} onAction={onDelete}>Supprimer la vue personnelle</AppButton>
    <AppButton onAction={onReset}>Rétablir la vue standard</AppButton>
  </section>;
}
