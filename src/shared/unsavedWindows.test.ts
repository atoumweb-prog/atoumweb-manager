import {describe,it,expect} from 'vitest';
import {UnsavedWindows,isUnsavedWindowState} from './unsavedWindows';
const state=(revision:number,labels=['Contrat'],pending=false)=>({epoch:'fixture',revision,labels,pending});
describe('coordination des fenêtres et sorties différées',()=>{
 it('une fenêtre intacte ferme sans dialogue',()=>{const c=new UnsavedWindows(()=>{throw Error('unexpected')});c.add(1);expect(c.approveOne(1)).toBe(true);});
 it('Rester bloque la fermeture',()=>{const c=new UnsavedWindows(()=>false);c.add(1);c.update(1,state(1));expect(c.approveOne(1)).toBe(false);expect(c.state(1)).toEqual(state(1));});
 it('accepte explicitement la fermeture avec brouillon',()=>{const c=new UnsavedWindows(()=>true);c.add(1);c.update(1,state(1));expect(c.approveOne(1)).toBe(true);});
 it('aggrège les fenêtres détachées en un seul dialogue',()=>{let calls=0;const c=new UnsavedWindows(labels=>{calls++;expect(labels).toEqual(['Contrat','Entreprise']);return true});c.add(1);c.add(2);c.update(1,state(1));c.update(2,state(1,['Entreprise']));const ticket=c.approveAll()!;expect(calls).toBe(1);c.remember(ticket);expect(c.approveOne(1)&&c.approveOne(2)).toBe(true);expect(calls).toBe(1);});
 it('ne redemande pas Quitter lors du quit qui suit une approbation globale inchangée',()=>{
   let calls=0;
   const c=new UnsavedWindows(()=>{calls++;return true});
   c.add(1);c.update(1,state(1));
   const ticket=c.approveAll();
   expect(ticket).not.toBeNull();
   c.remember(ticket!);
   expect(c.approveAll()).not.toBeNull();
   expect(calls).toBe(1);
 });
 it('réexige une confirmation globale après une nouvelle modification',()=>{
   let calls=0;
   const c=new UnsavedWindows(()=>{calls++;return calls===1});
   c.add(1);c.update(1,state(1));
   c.remember(c.approveAll()!);
   c.update(1,state(2));
   expect(c.approveAll()).toBeNull();
   expect(calls).toBe(2);
 });
 it('ne ferme pas pendant un enregistrement même avec un choix positif',()=>{let pending=false;const c=new UnsavedWindows((_,p)=>{pending=p;return true});c.add(1);c.update(1,state(1,[],true));expect(c.approveAll()).toBeNull();expect(pending).toBe(true);expect(c.approveOne(1)).toBe(false);});
 it('une autorisation passée est invalidée par une nouvelle saisie',()=>{let allow=true;const c=new UnsavedWindows(()=>allow);c.add(1);c.update(1,state(1));const ticket=c.approveAll()!;c.remember(ticket);c.update(1,state(2));allow=false;expect(c.approveOne(1)).toBe(false);});
 it('annuler le sélecteur workspace ne mémorise pas une permission de fermeture',()=>{let allow=true;const c=new UnsavedWindows(()=>allow);c.add(1);c.update(1,state(1));expect(c.approveAll()).not.toBeNull();allow=false;expect(c.approveOne(1)).toBe(false);});
 it('le choix différé ne marque pas le brouillon comme enregistré',()=>{const c=new UnsavedWindows(()=>true);c.add(1);c.update(1,state(1));c.remember(c.approveAll()!);expect(c.state(1)?.labels).toEqual(['Contrat']);expect(c.approveOne(1)).toBe(true);});
 it('une saisie apparue pendant le sélecteur doit être reconfirmée',()=>{let allow=true;const c=new UnsavedWindows(()=>allow);c.add(1);const ticket=c.approveAll()!;c.update(1,state(1));allow=false;expect(c.refreshApproval(ticket)).toBeNull();});
 it('l’ouverture d’une fenêtre change le ticket sans inventer de modifications',()=>{const c=new UnsavedWindows(()=>{throw Error('unexpected')});c.add(1);const ticket=c.approveAll()!;c.add(2);expect(c.same(ticket)).toBe(false);expect(c.refreshApproval(ticket)?.size).toBe(2);});
 it('ignore un ancien signal reçu en retard',()=>{const c=new UnsavedWindows(()=>true);c.add(1);c.update(1,state(2));c.update(1,state(1,[]));expect(c.state(1)?.revision).toBe(2);expect(c.state(1)?.labels).toEqual(['Contrat']);});
 it('accepte un nouveau renderer sans réutiliser une ancienne permission',()=>{const c=new UnsavedWindows(()=>false);c.add(1);c.update(1,state(10,[]));c.remember(c.approveAll()!);c.update(1,{...state(1),epoch:'new-renderer'});expect(c.state(1)?.revision).toBe(1);expect(c.approveOne(1)).toBe(false);});
 it('retire les états des fenêtres fermées',()=>{const c=new UnsavedWindows(()=>true);c.add(1);c.update(1,state(1));c.remove(1);expect(c.ticket().size).toBe(0);expect(c.approveOne(1)).toBe(false);});
 it.each([null,{}, {revision:-1,labels:[],pending:false},{revision:0,labels:[{}],pending:false},{revision:0,labels:[],pending:'false'}])('refuse les métadonnées invalides %j',value=>{expect(isUnsavedWindowState(value)).toBe(false);});
 it('valide des métadonnées sans transporter le contenu de saisie',()=>{expect(isUnsavedWindowState(state(2,['Paramètres','Entreprise']))).toBe(true);});
});
