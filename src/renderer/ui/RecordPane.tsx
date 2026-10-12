import type {ReactNode} from 'react';
import {AppButton} from './AppButton';
import {OperationIcon} from '../operations/OperationIcon';
export function RecordPane({title,expanded,onExpand,onClose,children}:{title:string;expanded:boolean;onExpand:()=>void;onClose:()=>void;children:ReactNode}){
  // One shell and one subtree in both modes: changing size must never remount editors.
  return <aside className="aw-record-pane" aria-label={title}>
    <header><div><span className="eyebrow">{expanded?'Fiche complète':'Fiche rapide'}</span><h2>{title}</h2></div><div className="aw-record-pane-actions">
      <AppButton icon={<OperationIcon name={expanded?'collapse':'expand'}/>} onAction={onExpand}>{expanded?'Réduire':'Agrandir'}</AppButton>
      <AppButton onAction={onClose}>Fermer la fiche</AppButton>
    </div></header><div className="aw-record-pane-body">{children}</div>
  </aside>;
}
