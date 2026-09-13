# Phase 5 — Administration & Finance

## 1. Objectif

La Phase 5 transforme AtoumWeb Manager en outil administratif complet sans en faire un logiciel comptable.

Elle couvre :

- Documents & Contrats ;
- modèles et bibliothèque de clauses ;
- génération PDF ;
- documents signés et documents fournis par le client ;
- éléments à facturer ;
- suivi des factures réellement créées dans Abby ;
- paiements complets ou partiels ;
- retards ;
- dépenses ponctuelles ;
- abonnements / charges récurrentes ;
- achats et financements en plusieurs fois ;
- échéances et alertes administratives.

Principe : **AtoumWeb Manager prépare, relie, historise et analyse ; Abby reste l’outil réglementaire de facturation en V1.**

## 2. Dépendances

Cette phase s’appuie sur :

- Phase 1 : Clients / Contacts ;
- Phase 2 : Devis ;
- Phase 3 : Projets / Ressources ;
- Phase 4 : Interventions / Maintenance / Packs / `billing_items` ;
- `file_assets` pour tous les fichiers physiques ;
- `activity_events` pour le journal ;
- `reminders` pour les échéances.

## 3. Documents & Contrats — philosophie

Le module n’est pas un traitement de texte complet.

Workflow :

`Modèle → pré-remplissage → édition contrôlée → prévisualisation → validation → PDF → signature/acceptation → archivage`

Les documents doivent pouvoir être retrouvés depuis :

- Documents & Contrats ;
- Client ;
- Projet ;
- Devis ;
- Intervention/Maintenance lorsque pertinent.

Un document maître n’est physiquement stocké qu’une fois.

## 4. Types de documents V1

Modèles initiaux :

- Contrat Site vitrine ;
- Contrat E-commerce ;
- Contrat Maintenance WordPress ;
- Contrat Application / logiciel ;
- Contrat Partenariat / prestation offerte ;
- Avenant ;
- Cahier des charges simplifié ;
- Rapport d’intervention ;
- Rapport de maintenance ;
- Procès-verbal / fiche de livraison ou réception ;
- document libre AtoumWeb.

Les types sont configurables sans casser les anciens documents.

## 5. Modèles de documents versionnés

Tables :

- `document_templates` ;
- `document_template_versions`.

Une identité de modèle possède plusieurs versions.

Règles :

- un brouillon de version peut être modifié ;
- une version publiée/utilisée reste historique ;
- modifier un modèle publié crée une nouvelle version ;
- un ancien document conserve sa version source ;
- aucune modification de modèle ne réécrit un document existant.

## 6. Variables dynamiques

Les modèles peuvent utiliser des variables contrôlées, par exemple :

- identité légale AtoumWeb ;
- logo / coordonnées ;
- client / société / contact ;
- adresse ;
- projet ;
- référence devis ;
- date ;
- prix contractuel ;
- valeur commerciale ;
- acompte ;
- solde ;
- délais ;
- services/prestations inclus ;
- prérequis ;
- maintenance ;
- signataire.

Une variable non résolue doit être signalée avant finalisation.

Le document peut être édité manuellement après pré-remplissage : la version finale enregistre son contenu propre et ne dépend plus du modèle courant.

## 7. Bibliothèque de clauses

Tables :

- `clauses` ;
- `clause_versions`.

Catégories proposées :

- paiement ;
- acompte / solde ;
- délais ;
- contenu fourni par le client ;
- validation / corrections ;
- hébergement / domaine ;
- maintenance ;
- propriété intellectuelle ;
- licences tierces ;
- responsabilité ;
- confidentialité ;
- portfolio / droit de présenter le projet ;
- résiliation ;
- partenariat / gratuité ;
- évolutions hors périmètre.

Une clause utilisée dans un document est copiée/snapshotée dans le contenu du document. Modifier la clause plus tard ne modifie pas le document historique.

## 8. Cycle de vie d’un document

Statuts communs :

- Brouillon ;
- À relire ;
- Validé ;
- Envoyé ;
- Signé / Accepté ;
- Actif ;
- Terminé ;
- Archivé.

Tous les statuts ne s’appliquent pas à tous les types.

### Document brouillon

- contenu structuré modifiable ;
- peut avoir plusieurs `document_versions` ;
- peut être prévisualisé.

### Document finalisé

- version figée ;
- génération PDF ;
- PDF enregistré comme `file_asset` ;
- checksum recommandé ;
- aucune modification silencieuse.

Pour corriger après finalisation : nouvelle version/document ou avenant selon le contexte.

## 9. Arborescence physique Client > Documents

Référence standard :

```text
<Client>/Documents/
├─ 01 Devis/
├─ 02 Contrats/
├─ 03 Avenants/
├─ 04 Facturation - justificatifs/
├─ 05 Rapports/
├─ 06 Documents fournis par le client/
├─ 07 Documents signés/
└─ 08 Archives/
```

Un document rattaché à un Projet apparaît dans la fiche Projet par référence, mais son fichier maître reste dans l’arborescence Client lorsqu’il s’agit d’un document contractuel/officiel.

## 10. Documents externes et signatures

Le CRM doit accepter :

- PDF généré par AtoumWeb ;
- PDF retourné signé par le client ;
- document fourni directement par le client ;
- justificatif ou document administratif externe.

Pour une signature manuscrite ou via un service externe, la V1 stocke/référence simplement la version signée et la date de signature.

Aucune plateforme de signature électronique payante obligatoire en V1.

## 11. Cas Partenariat / Gratuité — référence Cazor

Le modèle doit clairement distinguer :

- valeur commerciale théorique ;
- montant réellement facturé ;
- prestations offertes ;
- périmètre de la gratuité ;
- éléments futurs facturables ;
- maintenance / évolutions non incluses sauf mention explicite ;
- droit de présenter le projet dans le portfolio ;
- éventuelle durée/fin du partenariat ;
- conditions de résiliation.

Règle : **« offert aujourd’hui » ne signifie jamais « tout sera gratuit pour toujours ».**

## 12. Numérotation des documents

Utiliser `number_sequences`.

Valeurs par défaut proposées, configurables :

- contrats : `CTR-YYYY-001` ;
- avenants : `AVE-YYYY-001` ;
- rapports : `RAP-YYYY-001` ;
- autres documents : `DOC-YYYY-001`.

La numérotation d’un document finalisé est unique.

## 13. Génération PDF

Processus :

1. générer le rendu HTML dédié ;
2. prévisualiser ;
3. `webContents.printToPDF()` ;
4. enregistrer dans le bon dossier Client ;
5. créer/rattacher le `file_asset` ;
6. figer `document_version` ;
7. journaliser.

Le PDF ne contient jamais :

- notes internes ;
- prix conseillés internes ;
- commentaires de marge/rentabilité ;
- données techniques non destinées au client.

## 14. Facturation — rôle de `billing_items`

`billing_items` représente **ce qui doit être facturé ou suivi**, pas la facture légale.

Origines possibles :

- acompte devis/projet ;
- solde projet ;
- intervention hors forfait ;
- dépassement maintenance ;
- pack d’heures ;
- abonnement/service récurrent ;
- autre prestation ponctuelle.

Chaque `billing_item` doit conserver :

- source métier ;
- client ;
- projet éventuel ;
- description ;
- montant attendu ;
- échéance prévue ;
- statut.

Règle : une même source métier ne crée jamais deux `billing_items` équivalents.

## 15. Statuts des éléments à facturer

Proposition :

- Prévu ;
- Prêt à facturer ;
- Facturé ;
- Annulé ;
- Non facturé / offert.

Un élément offert peut conserver sa valeur commerciale/théorique ailleurs, tout en ayant un montant attendu de facturation égal à zéro ou un statut explicite `Non facturé / offert`.

## 16. Factures Abby

Table : `invoices`.

AtoumWeb Manager ne génère pas le document réglementaire de facture en V1.

Après création dans Abby, l’utilisateur enregistre :

- numéro Abby ;
- client ;
- date facture ;
- montant ;
- échéance ;
- statut ;
- éventuelle référence/lien externe ;
- notes.

Puis rattache la facture aux `billing_items` concernés via `invoice_billing_items`.

## 17. Contrôle prévu / réellement facturé

Le CRM doit comparer :

- total attendu des `billing_items` ;
- montant réel de la facture Abby.

En cas d’écart :

- afficher l’écart ;
- demander un motif facultatif/obligatoire selon seuil configuré ;
- conserver la différence sans modifier silencieusement les valeurs historiques.

Exemples de motif :

- geste commercial ;
- arrondi ;
- prestation ajoutée ;
- prestation retirée ;
- correction ;
- autre.

## 18. Paiements

Table : `payments`.

Une facture peut avoir :

- aucun paiement ;
- un paiement complet ;
- plusieurs paiements partiels.

Le montant encaissé est calculé depuis les paiements.

Le CRM doit afficher :

- montant facture ;
- encaissé ;
- reste à payer ;
- date du dernier paiement ;
- retard éventuel.

Ne jamais dupliquer un champ « encaissé » manuellement modifiable ailleurs.

## 19. Statuts facture / retard

États métier proposés :

- À envoyer ;
- Envoyée ;
- Partiellement payée ;
- Payée ;
- En retard ;
- Annulée ;
- Avoir / corrigée selon suivi nécessaire.

Pour une facture active :

- `Payée` si paiements >= montant ;
- `Partiellement payée` si paiements > 0 mais < montant ;
- `En retard` si reste dû > 0 et échéance dépassée.

Les statuts exceptionnels Abby (annulation/avoir) restent explicites et ne sont pas déduits uniquement des paiements.

## 20. Handoff depuis les phases précédentes

### Devis accepté / Projet

Peut préparer :

- acompte attendu ;
- solde attendu.

### Intervention

Peut préparer :

- intervention hors forfait.

### Maintenance

Peut préparer :

- dépassement facturé ;
- abonnement périodique si suivi souhaité.

### Pack d’heures

Peut préparer :

- achat du pack ;
- complément facturé.

Toutes ces créations sont idempotentes.

## 21. Vue Facturation

Onglets :

- À facturer ;
- Factures créées ;
- Paiements ;
- Retards.

### À facturer

Afficher :

- client ;
- source ;
- description ;
- projet ;
- montant attendu ;
- date prévue ;
- retard de création éventuel.

Action principale : **Marquer comme facturé dans Abby / rattacher une facture Abby**.

## 22. Dépenses — objectif

Le module Dépenses sert à :

- connaître les coûts AtoumWeb ;
- anticiper les échéances ;
- calculer la rentabilité ;
- rattacher un coût à un client/projet lorsque pertinent ;
- conserver les justificatifs.

Il ne remplace pas la comptabilité officielle.

## 23. Dépenses ponctuelles

Table : `expenses`.

Champs métier principaux :

- fournisseur ;
- catégorie ;
- description ;
- HT ;
- TVA ;
- TTC ;
- date ;
- moyen de paiement ;
- compte/support de paiement ;
- justificatif ;
- client/projet éventuel ;
- type : interne / client / mutualisé / refacturable.

Règle : montants en centimes.

## 24. Dépenses récurrentes / abonnements

Table : `recurring_expenses`.

Exemples :

- hébergement ;
- domaine ;
- licences ;
- logiciels ;
- assurance ;
- services SaaS ;
- téléphone ;
- autres abonnements.

Suivre :

- fournisseur ;
- montant ;
- périodicité ;
- prochaine échéance ;
- renouvellement automatique oui/non ;
- date limite de résiliation ;
- moyen de paiement ;
- statut ;
- lien client/projet si coût dédié.

Les occurrences réellement payées peuvent créer des `expenses` rattachées à l’abonnement récurrent.

## 25. Abonnement peu utilisé

La V1 peut permettre un champ simple :

- usage estimé : Actif / Occasionnel / Peu utilisé / À résilier ;
- note ;
- prochaine décision.

Le Dashboard peut signaler un abonnement `Peu utilisé` approchant de son renouvellement.

Pas d’analyse automatique intrusive nécessaire en V1.

## 26. Financements / paiements en plusieurs fois

Tables :

- `installment_plans` ;
- `installment_payments`.

Suivre :

- dépense d’origine ;
- total financé ;
- nombre d’échéances ;
- montant d’échéance ;
- frais ;
- taux si connu ;
- début/fin ;
- prochaine échéance ;
- statut.

Une échéance réellement payée doit être historisée.

Le CRM doit pouvoir distinguer :

- coût total de l’achat ;
- cash réellement sorti sur une période donnée.

## 27. Justificatifs

Les factures fournisseurs, tickets et autres justificatifs utilisent `file_assets`.

Ils peuvent être liés à une dépense sans dupliquer physiquement le fichier.

Le module doit permettre :

- ouvrir le justificatif ;
- détecter fichier manquant ;
- relocaliser si nécessaire.

## 28. Catégories de dépenses par défaut

Proposition modifiable :

- Hébergement / serveurs ;
- Domaines ;
- Logiciels / SaaS ;
- Licences / plugins / thèmes ;
- Matériel informatique ;
- Téléphone / internet ;
- Communication / publicité ;
- Sous-traitance ;
- Banque / paiement ;
- Assurance ;
- Formation ;
- Déplacement ;
- Fournitures ;
- Administratif / juridique ;
- Autre.

## 29. Vue Dépenses

Onglets :

- Vue d’ensemble ;
- Abonnements ;
- Dépenses ponctuelles ;
- Échéances.

KPIs :

- dépenses du mois ;
- charges récurrentes mensuelles équivalentes ;
- prévision annuelle ;
- échéances à venir.

## 30. Alertes & rappels

À surveiller :

- facture client en retard ;
- travail terminé mais non facturé ;
- acompte attendu non facturé ;
- abonnement à renouveler ;
- date limite de résiliation ;
- échéance de financement ;
- justificatif manquant si règle activée.

Les alertes sont configurables dans Réglages.

## 31. Client / Projet — intégration

### Fiche Client > Facturation

Afficher :

- éléments à facturer ;
- factures ;
- paiements ;
- reste dû ;
- historique.

### Fiche Client > Contrats / Documents

Afficher les mêmes documents maîtres filtrés par client.

### Projet

Afficher :

- documents rattachés ;
- valeur commerciale ;
- montant contractuel ;
- prévu à facturer ;
- facturé ;
- encaissé ;
- dépenses directes du projet ;
- marge/rentabilité plus tard dans Statistiques.

Aucun de ces totaux n’est saisi manuellement : ils sont agrégés depuis leurs sources.

## 32. Dashboard administratif

Bloc À surveiller :

- devis accepté sans acompte facturé ;
- projet terminé avec solde à facturer ;
- interventions terminées à facturer ;
- factures en retard ;
- renouvellements / échéances ;
- abonnements à résilier bientôt ;
- financement à échéance.

## 33. Recherche globale

Indexer au minimum :

- numéro/titre/type de document ;
- contrat ;
- facture Abby ;
- fournisseur ;
- dépense ;
- abonnement.

Les justificatifs sont retrouvés via leur métadonnée/fichier maître.

## 34. Journal d’activité

Événements :

- document créé/finalisé/envoyé/signé/archivé ;
- facture Abby ajoutée ;
- paiement enregistré ;
- facture passée en retard/payée ;
- dépense ajoutée ;
- abonnement créé/modifié ;
- échéance enregistrée/payée.

Éviter de journaliser chaque frappe dans un brouillon.

## 35. Sécurité et données sensibles

- pas de coordonnées bancaires client inutiles ;
- RIB AtoumWeb éventuellement utilisé dans modèles de documents via réglages ;
- pas de mots de passe de banque/Abby ;
- documents administratifs stockés uniquement dans le workspace choisi ;
- ouvrir les fichiers via API système contrôlée ;
- aucune transmission cloud automatique en V1.

## 36. Découpage de développement recommandé

1. Documents : données / modèles / clauses / versioning ;
2. Documents : éditeur contrôlé / PDF / fichiers signés ;
3. Facturation : `billing_items` / factures Abby / rapprochement ;
4. Paiements / retards / dashboard ;
5. Dépenses ponctuelles / justificatifs ;
6. Abonnements / échéances / financements ;
7. intégration Client/Projet/Recherche/Journal ;
8. validation complète Phase 5.

## 37. Critères d’acceptation

La Phase 5 est terminée si :

- un contrat peut être généré depuis un modèle versionné ;
- un document finalisé reste immuable ;
- un PDF final est stocké/référencé une seule fois ;
- une version signée peut être ajoutée ;
- un document peut être visible depuis Client et Projet sans duplication ;
- le contrat Partenariat/Gratuité peut distinguer valeur/offert/futur payant ;
- les éléments à facturer sont uniques et traçables ;
- une facture Abby peut regrouper un ou plusieurs éléments ;
- prévu vs facturé peut être comparé ;
- les paiements partiels fonctionnent ;
- reste à payer et retard sont calculés correctement ;
- les dépenses ponctuelles sont suivies avec justificatif ;
- les abonnements et renouvellements déclenchent des alertes ;
- un financement en plusieurs fois est historisé ;
- les totaux Client/Projet sont calculés et non recopiés ;
- recherche globale et journal sont alimentés ;
- les trois thèmes restent cohérents ;
- les tests automatisés passent.
