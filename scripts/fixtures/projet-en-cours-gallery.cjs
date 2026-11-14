// Galerie de critique de la fiche Projet (refonte R5) : un projet réaliste EN COURS, pas un projet vide.
// Données fictives TEST sur la base temporaire du harnais ; aucune base réelle touchée.
module.exports=async({win,db,evalUI:js,get,wait,navigate,sleep})=>{
 const fs=require('node:fs'),path=require('node:path');
 const out=path.resolve('outputs/projet-en-cours-r5-20261114');fs.mkdirSync(out,{recursive:true});const shots=[];
 const click=async s=>{await js(`document.querySelector(${JSON.stringify(s)}).click()`);await sleep(350);};
 async function shot(name){await js('document.activeElement?.blur()');await sleep(250);const file=String(shots.length+1).padStart(3,'0')+'-'+name+'.png';fs.writeFileSync(path.join(out,file),(await win.webContents.capturePage()).toPNG());shots.push(file);console.log('CAPTURE '+file);}
 let d=db.projects.createInternal({name:'TEST — Site vitrine Maison Lefèvre',targetDate:new Date(Date.now()+40*864e5).toISOString().slice(0,10),notes:'Projet fictif en cours pour la critique ergonomique'});
 const id=d.id;
 const add=(parentName,spec)=>{const parent=parentName?d.nodes.find(n=>n.name===parentName):null;d=db.projects.addProjectNode(id,{...spec,parentId:parent?parent.id:null});return d.nodes.find(n=>n.name===spec.name);};
 const setStatus=(node,status)=>{d=db.projects.updateProjectNode(node.id,{status});};
 const plan=[
  ['1. Cadrage et contenus',[['Recevoir le logo et les textes','done',90],['Valider l’arborescence du site','done',60],['Rédiger les pages principales','in_progress',240]]],
  ['2. Conception',[['Maquette de l’accueil','to_validate',180],['Maquette des pages internes','todo',240],['Retour du client sur la maquette','waiting_client',30]]],
  ['3. Réalisation',[['Installer WordPress et le thème','done',120],['Intégrer l’accueil','in_progress',180],['Formulaire de contact','blocked',60],['Optimisation des images','todo',90]]],
  ['4. Mise en ligne',[['Relecture finale avec le client','todo',60],['Mise en ligne et contrôles','todo',90]]],
 ];
 for(const [lot,tasks] of plan){add(null,{name:lot,type:'lot'});for(const [name,status,minutes] of tasks){const t=add(lot,{name,type:'task',estimatedMinutes:minutes});if(status!=='todo')setStatus(t,status);}}
 for(const label of ['Logo et charte graphique','Accès à l’hébergement','Textes des pages','Nom de domaine']){d=db.projects.addPrerequisite(id,{label,required:true});}
 const pre=(d.prerequisites||[]);[['Logo et charte graphique','validated'],['Accès à l’hébergement','requested'],['Textes des pages','incomplete'],['Nom de domaine','received']].forEach(([label,status])=>{const p=pre.find(x=>x.label===label);if(p)d=db.projects.updatePrerequisiteStatus(p.id,status);});
 d=db.projects.changeProjectStatus(id,'in_progress');
 console.log('PROJET '+d.number+' : '+d.nodes.length+' éléments, '+(d.prerequisites||[]).length+' prérequis, progression '+d.progressPercent+' %');
 win.setContentSize(1920,1500);win.webContents.setZoomFactor(1);
 await navigate('Projets');await js("document.documentElement.dataset.theme='noir';document.documentElement.dataset.density='comfort'");
 await wait('document.querySelector("tr[data-record-id]")','liste des projets');await shot('liste');
 await click(`tr[data-record-id="${id}"] .link-button`);await wait('document.querySelector(".project-production-nav")','fiche projet');
 const tabs=await get('[...document.querySelectorAll(".project-production-nav button")].map(b=>b.textContent.trim())');console.log('ONGLETS '+JSON.stringify(tabs));
 for(let i=0;i<tabs.length;i++){await click(`.project-production-nav button:nth-child(${i+1})`);await sleep(500);await shot('onglet-'+String(i+1)+'-'+tabs[i].toLowerCase().replace(/[^a-z]+/g,'-'));}
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({date:'2026-11-14',viewport:[1920,1500],theme:'noir',density:'comfort',tabs,shots},null,2));
 console.log('GALERIE_PROJET_TERMINEE '+shots.length+' captures');
};
