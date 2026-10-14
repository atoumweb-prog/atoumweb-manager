import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ContractSectionReview,ContractSectionKey } from '../../shared/contractSectionPolicy';
import { validateSectionReview } from '../../shared/contractSectionPolicy';

type Row=Record<string,unknown>;
const empty:ContractSectionReview={status:'unclassified',sectionKey:null,rankInSection:null};

/** 05C editorial review metadata only. Does not change the clause's legal text or publication state. */
export class ContractSectionReviewService {
  constructor(private readonly db:DatabaseAdapter){}
  get(versionId:string):ContractSectionReview {
    const row=this.db.get<Row>('SELECT * FROM contract_clause_section_reviews WHERE clause_version_id=?',[versionId]);
    if(!row)return {...empty};
    if(row.status==='unclassified')return {...empty};
    if(row.status==='proposed')return {status:'proposed',sectionKey:row.section_key as ContractSectionKey,rankInSection:Number(row.rank_in_section),reason:String(row.reason)};
    return {status:'approved',sectionKey:row.section_key as ContractSectionKey,rankInSection:Number(row.rank_in_section),reviewer:String(row.reviewer),reviewedAt:String(row.reviewed_at)};
  }
  private assertVersion(versionId:string):void {
    if(!this.db.get('SELECT id FROM contract_clause_versions WHERE id=?',[versionId]))throw Error('Version de clause introuvable.');
  }
  propose(versionId:string,sectionKey:ContractSectionKey,rankInSection:number,reason:string):ContractSectionReview {
    const proposal:ContractSectionReview={status:'proposed',sectionKey,rankInSection,reason};
    if(!validateSectionReview(proposal))throw Error('Proposition de classement invalide.');
    this.assertVersion(versionId);
    if(this.get(versionId).status==='approved')throw Error('Classement approuvé : créer une nouvelle version ou demander une révision explicite.');
    this.db.run(`INSERT INTO contract_clause_section_reviews
      (clause_version_id,section_key,rank_in_section,status,reason,reviewer,reviewed_at,updated_at)
      VALUES (?,?,?,'proposed',?,NULL,NULL,?)
      ON CONFLICT(clause_version_id) DO UPDATE SET section_key=excluded.section_key,rank_in_section=excluded.rank_in_section,
      status='proposed',reason=excluded.reason,reviewer=NULL,reviewed_at=NULL,updated_at=excluded.updated_at`,
      [versionId,sectionKey,rankInSection,reason,new Date().toISOString()]);
    return proposal;
  }
  approve(versionId:string,reviewer:string,reviewedAt=new Date().toISOString()):ContractSectionReview {
    const current=this.get(versionId);
    if(current.status!=='proposed')throw Error('Une proposition explicite est requise avant approbation.');
    const approved:ContractSectionReview={status:'approved',sectionKey:current.sectionKey,rankInSection:current.rankInSection,reviewer,reviewedAt};
    if(!validateSectionReview(approved))throw Error('Identité du valideur ou date invalide.');
    const result=this.db.run(`UPDATE contract_clause_section_reviews
      SET status='approved',reviewer=?,reviewed_at=?,updated_at=?
      WHERE clause_version_id=? AND status='proposed' AND section_key=? AND rank_in_section=? AND reason=?`,
      [reviewer,reviewedAt,new Date().toISOString(),versionId,current.sectionKey,current.rankInSection,current.reason]);
    if(Number(result.changes)!==1)throw Error('Classement modifié entre lecture et approbation : relire la proposition.');
    return approved;
  }
}
