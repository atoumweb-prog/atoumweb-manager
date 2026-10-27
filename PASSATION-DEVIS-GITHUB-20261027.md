# Passation GitHub — moteur de devis, 27 octobre 2026

## Reprise

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Branche : `codex/quote-pdf-handoff-20261027` ; utiliser son dernier commit, pas `main`.
- Origine locale : `codex/devis-corrections-validation-20261026`, HEAD initial `c867a1d7`, plus toutes les corrections source et tests non commitées des campagnes des 25–27 octobre. Les 39 commits déjà en avance sur `main` sont conservés dans l’ascendance, sans rebase ni écrasement.
- Mission de cette passation : synchronisation uniquement. Aucune nouvelle présentation client, campagne de génération, publication commerciale ou modification de base réelle.

Lire `AGENTS.md`, puis `PROJECT_STATUS.md`, le cahier des charges et `docs/ux-v2/CONSIGNES-ET-REPRISE.md`. Les anciennes mentions de dépôts, branches ou interdictions de push sont historiques : la demande du 27 octobre autorise cette branche et sa PR brouillon, sans fusion ni déploiement.

## Fichiers principaux

| Usage | Fichiers |
|---|---|
| Modèle HTML, impression et pagination | `src/shared/quoteDocumentHtml.ts`, `src/main/commercial/quotePdf.ts` |
| Aperçu PDF paginé dans l’éditeur | `src/renderer/commercial/QuotePdfPages.tsx`, `QuoteJourney.tsx`, `CompanyQuoteSettings.tsx` |
| Modèle de document, logo et style | `src/shared/quoteDocumentSettings.ts`, réglages et éditeur existants dans `src/renderer/commercial/` |
| Présentation des clauses et champs | `src/shared/contractPresentation.ts`, `contractFields.ts`, `humanizedContractPreview.ts`, `commercialDescription.ts` |
| Devis, contrats, préparation, contrôles | `src/main/commercial/QuoteService.ts`, `ContractTermsService.ts`, `QuoteContractPreparationService.ts`, `CommercialRulesService.ts` |
| Échéanciers et prestations | `src/shared/quotePaymentSchedule.ts`, `quoteContractPreparation.ts`, `commercial.ts`, `src/renderer/commercial/QuoteContractPreparationPanel.tsx` |
| Destinataire issu du CRM | `src/main/commercial/quoteRecipient.ts`, `src/main/crm/CrmService.ts`, `src/renderer/crm/ContactNameEditor.tsx` |
| Migrations | `src/main/database/migrations.ts` : registre jusqu’à 75, ajout des champs d’adresse postale du contact ; tests de migrations ajustés |
| Régressions anonymisées | `src/main/commercial/QuoteCampaignRegression.test.ts`, `QuoteTransmission.test.ts`, `QuoteOptions.test.ts`, `CommercialRulesService.test.ts`, `src/shared/quoteDocumentHtml.test.ts`, `quoteCampaignPresentation.test.ts` et tests de migrations |

## État repris

Les sources et tests incluent les corrections des champs contractuels, des contrôles d’audience, des quantités et descriptions, du destinataire CRM, des échéanciers explicites par ligne, des copies et du rendu des clauses. Les montants sont insécables et les coordonnées identiques dédoublonnées. Les textes historiques figés restent conservés.

Derniers ajustements validés : tableau de six lignes et total réunis en page 1 du scénario 14 ; calendrier détaillé regroupé dans l’annexe avant les clauses pour supprimer la continuation presque vide du scénario 07. La charte graphique et les engagements ont été conservés.

Dernière suite complète : 1 735 tests réussis avant le dernier ajustement de pagination et son nouveau test. Dernier lot ciblé : 48 tests distincts validés (15 rendu, 5 présentation, 28 transmission), typecheck réussi ; contrôles natifs de 14 présentations et PDF ciblés. Ce sont les résultats déjà obtenus, pas une nouvelle campagne exécutée pour cette passation.

## Installer et tester sur une copie de développement

Node 24 recommandé (minimum déclaré par `package.json`), npm et environnement compatible Electron. Aucun fichier SQLite personnel requis : les tests utilisent des fixtures synthétiques en mémoire ou temporaires.

```sh
npm ci
npm run typecheck
npm test -- src/shared/quoteDocumentHtml.test.ts src/shared/quoteCampaignPresentation.test.ts src/main/commercial/QuoteCampaignRegression.test.ts src/main/commercial/QuoteTransmission.test.ts
# Suite complète seulement si les changements le justifient :
npm test
```

`npm start` lance le Manager : utiliser un workspace de développement isolé, jamais la base de l’utilisateur. Les commandes de test standard ne nécessitent ni les archives locales de validation ni les propositions commerciales documentaires. Le moteur se reconstitue depuis les sources, les migrations et les dépendances verrouillées, pas depuis une copie d’une base personnelle.

## Suite souhaitée par l’utilisateur — non réalisée ici

Améliorer la lisibilité du PDF client : retirer les références techniques de la lecture client, améliorer titres, listes, introduction contractuelle, calendrier et présentation des prestations. Conserver les engagements et leur traçabilité interne, les clauses applicables, les montants et les contrats historiques. Ne pas confondre un changement d’affichage et une modification juridique ou commerciale. Aucune nouvelle publication ou migration de texte vendu n’est autorisée implicitement.

La tarification progressive des produits reste une orientation à confirmer ; aucun nouveau calcul commercial n’a été appliqué. Les maintenances annuelles et les correspondances Catalogue restent des propositions. Les références mariage détaillées prévoient un/un/deux ans d’hébergement, mais ces durées n’ont pas été transférées aux anciennes versions vendues.

## Éléments volontairement locaux

- Bases SQLite, profils, données clients, exports PDF/DOCX, exécutables et archives de validation.
- `output/` : campagnes, copies et résultats natifs, maquettes, inventaires commerciaux et documents de décision ; répertoire ignoré pour éviter une inclusion accidentelle.
- Scripts opt-in non suivis `scripts/campaign-real-quotes-20261025.cjs`, `campaign-corrected-quotes-20261027.cjs`, `finish-quote-validation-20261027.cjs`, `ui-corrected-quotes-20261027.cjs` : dépendants des copies et runners locaux, inutiles à la suite standard.
- Dossiers documentaires non suivis `docs/ux-v2/audit-redaction-20261025/` et `bibliotheque-humaine-118-20261025/` : textes/propositions métier, non nécessaires au moteur ni aux tests synthétiques. Le helper de prévisualisation accepte les propositions en argument ; il ne charge pas ces fichiers à l’exécution.

Les petits bilans datés des campagnes sont inclus pour expliquer l’état du code ; leurs liens vers des fichiers locaux ne constituent pas des dépendances à installer. Les 118 propositions humanisées restent disponibles localement, non publiées ni adoptées. Si leur contenu devient nécessaire au travail suivant, demander un transfert documentaire distinct et limité.

## Limites de la PR

PR en brouillon de passation, pas une demande de fusion. Aucun force-push, aucun changement de `main`, aucun déploiement. La CI du dépôt peut se déclencher automatiquement à l’ouverture de la PR ; elle ne constitue pas une nouvelle campagne manuelle de devis.
