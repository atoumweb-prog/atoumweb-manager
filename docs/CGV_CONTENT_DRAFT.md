# Contenu CGV AtoumWeb — brouillon de travail

> **Statut : DRAFT / NE PAS PUBLIER EN PRODUCTION**
>
> Ce document prépare le contenu de la bibliothèque CGV du Manager. Il ne constitue pas une validation juridique. Les formulations finales devront être relues avant publication dans la bibliothèque utilisée pour les devis réels.

Dernière vérification réglementaire : 25/09/2026.

## 1. Principe retenu dans le Manager

Le devis est le document contractuel. Il contient :
- les prestations et leur prix ;
- les paramètres commerciaux ;
- le socle contractuel AtoumWeb ;
- les clauses spécifiques aux prestations sélectionnées ;
- les conditions particulières propres au dossier.

La signature / acceptation du devis vaut acceptation de l'ensemble. Le Manager fige ensuite le texte exact des CGV.

La bibliothèque distingue désormais trois publics :
- `all` : clause commune à tous les clients ;
- `professional` : clause applicable aux clients professionnels ;
- `consumer` : clause applicable aux particuliers / consommateurs.

Le type de client contractuel doit toujours rester visible et modifiable avant finalisation du devis.

---

## 2. Socle commun — tous clients

Les codes ci-dessous sont des propositions de structuration. Le texte final reste à rédiger / valider.

### BASE-OBJET — Objet et champ d'application
**Audience :** all  
**Type :** base fixe

À couvrir :
- identification du devis comme document contractuel ;
- prestations couvertes = lignes du devis + annexes explicitement citées ;
- ordre de priorité entre conditions particulières du devis, clauses spécifiques et socle commun ;
- absence d'engagement sur une prestation non mentionnée au devis.

### BASE-ACCEPTATION — Formation du contrat
**Audience :** all  
**Type :** base fixe

À couvrir :
- modalités d'acceptation du devis ;
- date de formation du contrat ;
- durée de validité de l'offre ;
- effet d'une modification après acceptation : nouveau devis / nouvelle version.

### BASE-COOPERATION — Obligations et coopération du client
**Audience :** all  
**Type :** base fixe

À couvrir :
- fourniture des informations, accès, contenus et validations nécessaires ;
- exactitude des informations transmises ;
- impact d'un retard client sur les délais ;
- interlocuteur habilité à valider les choix.

### BASE-PRIX — Prix et périmètre
**Audience :** all  
**Type :** base fixe

À couvrir :
- prix selon le devis ;
- prestations hors périmètre soumises à accord complémentaire ;
- frais externes non compris sauf mention contraire ;
- taxes selon le régime fiscal applicable au moment de la facturation.

### BASE-PAIEMENT — Modalités générales de paiement
**Audience :** all  
**Type :** base fixe

À couvrir :
- acompte éventuel indiqué sur le devis ;
- échéancier ;
- solde ;
- moyens de paiement ;
- condition de démarrage liée au paiement de l'acompte lorsqu'elle est prévue au devis.

Les pénalités B2B doivent rester dans une clause `professional`, pas dans cette clause commune.

### BASE-DELAIS — Délais et planning
**Audience :** all  
**Type :** base fixe

À couvrir :
- délai indicatif ou ferme selon ce que précise le devis ;
- point de départ du délai ;
- suspension / décalage lorsque les éléments client manquent ;
- dépendances externes pouvant affecter le planning.

### BASE-VALIDATION — Validation des livrables
**Audience :** all  
**Type :** base fixe

À couvrir :
- mécanisme de validation ;
- retours demandés dans un délai raisonnable défini au devis ou à la prestation ;
- effet d'une demande hors périmètre ;
- pas de validation tacite automatique sans formulation juridiquement relue.

### BASE-PI — Propriété intellectuelle et droits d'utilisation
**Audience :** all  
**Type :** base fixe

À couvrir après validation juridique :
- éléments créés spécifiquement pour le client ;
- éléments tiers, licences, thèmes, extensions, polices, banques d'images ;
- transfert / concession des droits et moment où il intervient ;
- éléments réutilisables / savoir-faire AtoumWeb ;
- responsabilité du client sur les éléments qu'il fournit.

### BASE-CONFIDENTIALITE — Confidentialité
**Audience :** all  
**Type :** base fixe

À couvrir :
- informations confidentielles échangées ;
- accès techniques ;
- exceptions nécessaires à l'exécution de la mission.

### BASE-RESPONSABILITE — Responsabilités générales
**Audience :** all  
**Type :** base fixe

À rédiger prudemment :
- obligation de coopération ;
- limites liées aux services tiers ;
- sauvegardes / accès / sécurité selon la prestation ;
- aucune clause ne doit supprimer une responsabilité que la loi interdit d'exclure.

### BASE-FORCE-MAJEURE — Force majeure
**Audience :** all  
**Type :** base fixe

À couvrir :
- événement répondant aux critères légaux ;
- suspension des obligations affectées ;
- information de l'autre partie ;
- conséquences si l'empêchement devient durable.

### BASE-DONNEES — Données et accès
**Audience :** all  
**Type :** base fixe

À couvrir :
- traitement des accès nécessaires à la mission ;
- confidentialité des identifiants ;
- responsabilités distinctes client / prestataire ;
- renvoi vers la politique de confidentialité ou un accord spécifique lorsque nécessaire.

---

## 3. Socle clients professionnels

### PRO-RETARD — Retard de paiement
**Audience :** professional  
**Type :** base fixe

Le texte final devra préciser le taux applicable aux pénalités et l'indemnité forfaitaire de recouvrement. L'article L. 441-10 du Code de commerce impose que les conditions de règlement indiquent les conditions d'application et le taux des pénalités de retard ainsi que le montant de l'indemnité forfaitaire ; un taux conventionnel ne peut pas être inférieur à trois fois le taux d'intérêt légal. Les pénalités sont exigibles sans rappel.  
Source : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392

**À valider avant publication :**
- choix définitif AtoumWeb du taux de pénalité ;
- montant réglementaire de l'indemnité forfaitaire à reprendre dans la formulation finale ;
- cohérence avec Abby et les factures.

### PRO-PAIEMENT — Délais de règlement B2B
**Audience :** professional  
**Type :** base fixe

À couvrir :
- délai de règlement convenu ;
- échéances particulières du devis ;
- articulation avec l'acompte et les factures intermédiaires.

### PRO-LITIGE — Règlement des différends professionnels
**Audience :** professional  
**Type :** base fixe

À rédiger / valider séparément. Ne pas insérer automatiquement une clause attributive de juridiction sans vérification de son champ d'application.

---

## 4. Socle particuliers / consommateurs

Ces clauses sont séparées du B2B car les contrats conclus à distance avec un consommateur déclenchent des obligations spécifiques.

### CONS-INFO — Informations précontractuelles
**Audience :** consumer  
**Type :** base fixe

Avant un contrat de service à distance, l'article L. 221-5 prévoit notamment une information lisible et compréhensible sur les caractéristiques essentielles du service, le prix, le délai d'exécution, l'identité et les coordonnées du professionnel, les conditions contractuelles, le règlement des litiges, la médiation et, lorsqu'il existe, le droit de rétractation.  
Source : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563141

**Conséquence Manager :**
- les lignes du devis doivent décrire suffisamment la prestation ;
- prix et délai doivent être visibles ;
- les coordonnées AtoumWeb doivent être présentes dans le document Abby ;
- les clauses consommateur ne doivent pas être mélangées aux seules règles B2B.

### CONS-RETRACTATION — Droit de rétractation
**Audience :** consumer  
**Type :** base fixe

Pour une prestation de services conclue à distance, le consommateur dispose en principe de quatorze jours à compter de la conclusion du contrat pour exercer son droit de rétractation.  
Source : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842

À prévoir dans le texte final :
- existence et durée du droit ;
- modalités d'exercice ;
- formulaire type lorsque requis ;
- exceptions éventuelles uniquement lorsqu'elles sont réellement applicables.

### CONS-DEBUT-ANTICIPE — Demande d'exécution avant la fin du délai de rétractation
**Audience :** consumer  
**Type :** base fixe + contrôle métier à prévoir

Si le consommateur souhaite que la prestation payante commence avant la fin du délai de rétractation, l'article L. 221-25 impose de recueillir sa **demande expresse**. Il doit aussi reconnaître la conséquence d'une exécution complète sur son droit de rétractation.  
Source : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563179

**Important pour le Manager :**
un simple bouton interne AtoumWeb ne constitue pas la demande du client. Une future évolution devra conserver une preuve provenant du client / du mécanisme d'acceptation Abby ou d'un support durable.

### CONS-MEDIATION — Médiation de la consommation
**Audience :** consumer  
**Type :** base fixe

Le professionnel doit communiquer au consommateur les coordonnées du médiateur de la consommation dont il relève. Ces informations doivent notamment être visibles sur les CGV / conditions de service et le site du médiateur doit être indiqué.  
Sources :
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032224762
- https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032808376

**BLOQUANT AVANT PUBLICATION :**
- `[À RENSEIGNER : NOM DU MÉDIATEUR]`
- `[À RENSEIGNER : ADRESSE]`
- `[À RENSEIGNER : SITE INTERNET]`

Ne jamais inventer ces coordonnées.

---

## 5. Clauses spécifiques — création de site

### WEB-CONTENUS — Fourniture des contenus
**Audience :** all  
**Type :** catalog

Déclencheurs possibles :
- Site vitrine
- Landing page
- E-commerce
- Site mariage

À couvrir :
- textes, images, logos et informations fournis par le client ;
- droits détenus sur les éléments remis ;
- effet des retards de transmission ;
- prestations de rédaction incluses ou non.

### WEB-ALLERS-RETOURS — Corrections et validations
**Audience :** all  
**Type :** catalog

À définir selon la prestation :
- nombre de cycles de corrections inclus ;
- différence entre correction et changement de périmètre ;
- validation avant mise en ligne.

### WEB-MISE-EN-LIGNE — Mise en ligne
**Audience :** all  
**Type :** catalog

À couvrir :
- prérequis techniques ;
- accès nécessaires ;
- validation finale ;
- dépendances hébergeur / DNS / services tiers.

### WEB-HEBERGEMENT — Hébergement et nom de domaine
**Audience :** all  
**Type :** catalog

À couvrir :
- ce qui est inclus dans l'offre ;
- durée incluse ;
- renouvellement ;
- propriété / titulaire du domaine ;
- services tiers et évolution de leurs tarifs.

### WEB-LICENCES — Licences et composants tiers
**Audience :** all  
**Type :** catalog

À couvrir :
- WordPress / Divi / extensions / polices / services externes ;
- licences comprises ou non ;
- maintien des fonctionnalités dépendant d'un tiers ;
- conséquences d'un non-renouvellement.

### WEB-COMPATIBILITE — Compatibilité et environnement technique
**Audience :** all  
**Type :** catalog

À couvrir :
- navigateurs / terminaux raisonnablement supportés ;
- limites liées à des environnements anciens ou non maintenus ;
- évolution future des navigateurs et plateformes hors prestation de maintenance.

---

## 6. Clauses spécifiques — e-commerce

### ECOM-PRODUITS — Catalogue produits
**Audience :** all  
**Type :** catalog

À couvrir :
- données produits fournies par le client ;
- prix, stocks, TVA, photos, descriptions ;
- responsabilité du client sur leur exactitude.

### ECOM-PAIEMENT — Prestataires de paiement
**Audience :** all  
**Type :** catalog

À couvrir :
- compte du client chez le prestataire ;
- validation / KYC ;
- commissions et incidents du prestataire tiers ;
- absence de conservation par AtoumWeb de données bancaires si tel est bien le fonctionnement retenu.

### ECOM-LEGAL-MARCHAND — Obligations juridiques du marchand
**Audience :** all  
**Type :** catalog

À couvrir après relecture :
- CGV de vente du marchand ;
- politique de livraison / retours ;
- mentions légales ;
- informations produits ;
- conformité de son activité.

AtoumWeb peut intégrer techniquement des contenus transmis mais ne doit pas être présenté comme validant juridiquement l'activité du marchand.

---

## 7. Clauses spécifiques — maintenance WordPress

### MAINT-PERIMETRE — Périmètre de maintenance
**Audience :** all  
**Type :** catalog

À couvrir :
- opérations incluses ;
- nombre d'interventions / heures incluses selon l'offre ;
- ce qui constitue une intervention hors forfait.

### MAINT-MAJ — Mises à jour
**Audience :** all  
**Type :** catalog

À couvrir :
- WordPress / thème / extensions ;
- compatibilité ;
- possibilité de différer une mise à jour risquée ;
- traitement d'un correctif urgent de sécurité.

### MAINT-SAUVEGARDES — Sauvegardes
**Audience :** all  
**Type :** catalog

À couvrir :
- périmètre de sauvegarde ;
- fréquence lorsque contractuelle ;
- stockage / durée ;
- limite liée aux sauvegardes de l'hébergeur ou d'un tiers.

### MAINT-DELAI — Prise en charge
**Audience :** all  
**Type :** catalog

À couvrir :
- plage de prise en charge ;
- distinction urgence / demande standard ;
- absence de garantie de délai non prévu au devis.

### MAINT-RENOUVELLEMENT — Durée / renouvellement / résiliation
**Audience :** all  
**Type :** catalog

À couvrir selon le modèle commercial retenu :
- durée ;
- périodicité ;
- renouvellement ;
- préavis ;
- sort des heures / interventions non utilisées.

---

## 8. Clauses spécifiques — SEO et création de contenu

### SEO-RESULTATS — Absence de garantie de position
**Audience :** all  
**Type :** catalog

À couvrir :
- objectifs de moyens ;
- dépendance aux moteurs de recherche et à leurs algorithmes ;
- aucune promesse de position ou de trafic garanti.

### CONTENT-BRIEF — Brief et validation éditoriale
**Audience :** all  
**Type :** catalog

À couvrir :
- informations fournies par le client ;
- validation du ton, du fond et des informations métier ;
- nombre de corrections inclus.

### CONTENT-DROITS — Éléments fournis
**Audience :** all  
**Type :** catalog

À couvrir :
- droits sur photos, marques, citations, documents et éléments tiers transmis.

---

## 9. Clauses spécifiques — identité visuelle / retouche

### DESIGN-PROPOSITIONS — Propositions et corrections
**Audience :** all  
**Type :** catalog

À couvrir :
- nombre de propositions ;
- nombre de cycles de corrections ;
- changement de brief = nouvelle estimation possible.

### DESIGN-LIVRABLES — Formats et fichiers sources
**Audience :** all  
**Type :** catalog

À couvrir :
- formats livrés ;
- fichiers sources inclus ou non ;
- licences de polices / éléments tiers.

---

## 10. Clauses spécifiques — site de mariage

### MARIAGE-DUREE — Durée de mise en ligne
**Audience :** consumer  
**Type :** catalog

À couvrir :
- durée incluse ;
- date de début / fin ;
- renouvellement éventuel et prix applicable ;
- fermeture / export en fin de période.

### MARIAGE-CONTENUS — Photos et informations privées
**Audience :** consumer  
**Type :** catalog

À couvrir :
- responsabilité sur les contenus et droits à l'image fournis ;
- informations destinées aux invités ;
- accès privé éventuel ;
- données collectées via formulaires selon les fonctionnalités réellement proposées.

---

## 11. Clauses spécifiques — landing page

### LANDING-PERIMETRE — Périmètre d'une landing page
**Audience :** all  
**Type :** catalog

À couvrir :
- une page / périmètre fonctionnel ;
- formulaires et intégrations inclus ;
- gestion mensuelle éventuelle ;
- modifications incluses / hors forfait.

---

## 12. Contrôles que le Manager devra effectuer avant une future mise en production juridique

Le Builder V1 sait déjà assembler et figer les clauses. Avant de publier les textes réels, prévoir une recette dédiée :

1. vérifier le type de client : professionnel ou consommateur ;
2. vérifier qu'un socle publié existe pour ce public ;
3. vérifier les clauses spécifiques déclenchées par toutes les prestations du devis ;
4. signaler les placeholders `[À RENSEIGNER]` ;
5. pour un consommateur, signaler l'absence d'informations de médiation ;
6. pour un consommateur, traiter séparément la preuve d'une demande de démarrage anticipé ;
7. vérifier que le PDF Abby accepté est ensuite rattaché au devis ;
8. ne jamais recalculer les CGV d'un devis finalisé à partir des modèles actuels.

---

## 13. Sources officielles vérifiées

- Code de la consommation, art. L. 221-5 — information précontractuelle :  
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563141
- Code de la consommation, art. L. 221-18 — délai de rétractation :  
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842
- Code de la consommation, art. L. 221-25 — commencement d'exécution avant la fin du délai de rétractation :  
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563179
- Code de la consommation, art. L. 616-1 — médiation :  
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032224762
- Code de la consommation, art. R. 616-1 — affichage des coordonnées du médiateur :  
  https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032808376
- Code de commerce, art. L. 441-10 — retards de paiement entre professionnels :  
  https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392
