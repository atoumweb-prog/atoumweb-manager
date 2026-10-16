# EC03 — Contrat figé à l’envoi : plan technique soumis à approbation

Date : 16 octobre 2026. Décision métier A approuvée ; **implémentation non autorisée avant validation de ce plan**.

## Références et périmètre

Code examiné : `f85fd498ff9bbe8bc04242144d10efb737e91716`, arbre `0f681e02c08f0ebd2c6852f109f8c356b2f5d65b`. Branche documentaire : `codex/plan-ec03-sent-contracts`. Client B et Prospect A restent inchangés. Aucun accès à une base réelle, aucune migration exécutée, aucune publication ou CI hébergée.

La règle validée distingue trois opérations : préparer/finaliser pour envoi, attester l’envoi effectif, accepter la version envoyée. Ni la consultation ni la copie pour Abby ne valent envoi ou acceptation. La signature vaut validation du contrat de la version effectivement acceptée ; le Manager conserve la preuve et son rattachement, sans prétendre vérifier automatiquement une signature externe.

## Diagnostic du fonctionnement actuel

| Chemin | Comportement observé dans le code | Écart |
|---|---|---|
| Ouverture du constructeur contractuel | `ContractTermsBuilder.load` appelle `quotes.sync` pour un devis éditable ; effet rejoué en StrictMode | Une consultation peut modifier clauses et historique |
| Synchronisation | `ContractTermsService.syncQuoteInternal` reprend les versions publiées actuelles pour les clauses non personnalisées ; le wrapper journalise systématiquement | Mise à jour implicite et événement même sans changement utile |
| Publication/modification de bibliothèque | Le constructeur relance aussi la synchronisation du devis courant | Publier une CGV ne doit pas valoir adoption par ce devis |
| PDF de brouillon | IPC `quotes:generate-pdf` appelle `syncQuote` avant génération | Produire un document peut changer le contenu contractuel |
| Finalisation | `QuoteService.finalize` appelle `freezeQuote`, remplit les snapshots et `finalized_at`, dans un savepoint | Le gel définitif précède l’envoi réel |
| Marquer envoyé | Vérifie draft + finalisation, change statut/date puis étape Prospect | Pas de capture spécifique à l’envoi ; ensemble non englobé dans une transaction unique |
| Acceptation | Réutilise le snapshot existant via `freezeQuote`, puis conversion/provisionnement dans le savepoint d’acceptation | Bonne conservation historique à préserver ; rattachement explicite à la transmission à renforcer |
| Nouvelle révision | Copie les lignes/prix, mais `copyQuoteCustomizations` initialise le contrat depuis la bibliothèque actuelle puis reprend les personnalisations compatibles | Risque de changer silencieusement des clauses non personnalisées ou d’omettre une ancienne référence |

Le diagnostic précédent sur fixtures a observé deux synchronisations avec React StrictMode, une en production. Les gardes de réponse tardive empêchent un ancien affichage, mais n’annulent pas les écritures IPC déjà effectuées. Le doublon ne constitue donc pas la seule cause : supprimer StrictMode serait un contournement.

Les gardes actuelles SQLite et services verrouillent les devis finalisés, pas seulement envoyés. Déplacer un appel à `freezeQuote` ne suffit pas. Les migrations historiques de paramètres/options s’appuient notamment sur `finalized_at`, le statut et les snapshots.

## Proposition de correction

### 1. Lecture pure et mise à jour volontaire

- Remplacer les synchronisations de consultation par les lectures existantes ; auditer aussi aperçu, PDF, copie Abby et rafraîchissements.
- Proposer une comparaison en lecture seule entre versions sélectionnées et nouvelles versions disponibles : ajouts, retraits, textes, ordre, références et clauses personnalisées.
- Appliquer uniquement après confirmation explicite, en transaction, avec contrôle de version du devis et de la proposition. Une proposition périmée est refusée, jamais appliquée partiellement.
- Préserver les clauses personnalisées ; leur remplacement nécessite un choix explicite distinct. L’absence de changement ne crée pas un événement de synchronisation fictif.
- Une action explicite de composition commerciale peut créer les instances contractuelles nécessaires à la prestation ajoutée, mais ne doit pas actualiser les autres clauses existantes. Auditer les appels de synchronisation lors des mutations de lignes.
- Réutiliser le registre dirty/pending et les confirmations UX-01 ; aucune seconde architecture de garde.

### 2. Préparation distincte de la transmission

Proposition : conserver une préparation immuable, distincte du snapshot définitivement transmis.

**Finaliser pour envoi** : exécuter les contrôles actuels de complétude, assemblage et revue canonique sur les versions déjà sélectionnées, sans charger de nouvelles CGV. Produire un artefact préparé versionné (texte, JSON, paramètres, lignes, configuration et empreinte). `finalized_at` reste un repère de préparation pour les gardes existantes ; il ne signifie plus gel juridique à lui seul pour le nouveau protocole.

**Reprendre le brouillon**, avant envoi uniquement : action explicite invalidant la préparation active et la disponibilité pour envoi, tout en conservant l’ancienne préparation pour traçabilité. Elle rend le nouveau brouillon éditable sans changer les triggers historiques. Ce chemin est réservé aux devis du nouveau protocole, sans transmission ni ancien snapshot verrouillé. Une sauvegarde en cours ou un brouillon local non résolu bloque la transition.

**Marquer envoyé au client** : confirmation explicite de l’envoi réel et de sa provenance, en réutilisant les mécanismes de preuve existants. Vérifier que la préparation correspond toujours au devis. Dans une seule transaction : enregistrer la transmission et son contenu exact, renseigner les snapshots définitifs, statut/date d’envoi, étape Prospect et événements réellement réalisés. Ne pas relire la bibliothèque CGV à cet instant. Refuser un artefact périmé ; toute erreur annule l’ensemble des mutations.

Le PDF ou bloc commercial effectivement remis à Abby doit provenir de cette préparation. Distinguer empreinte du contenu logique et empreinte du fichier réellement transmis : une régénération PDF ne garantit pas les mêmes octets. Ne pas déclarer une preuve Abby vérifiée en l’absence du document/provenance correspondant. La copie presse-papiers seule reste une préparation, jamais une preuve d’envoi.

Utiliser un identifiant d’opération stable pour rendre les doubles appels/rejeux idempotents, y compris entre fenêtres. Une éventuelle réexpédition du même document ne doit ni recréer le contrat ni changer sa version ; son traitement explicite devra rester distinct d’une nouvelle révision.

### 3. Révisions et acceptation

- Après envoi, conserver le devis source intact et utiliser la révision commerciale existante, avec parent et dossier commun.
- Copier exactement les clauses sélectionnées de la version source, leurs versions, ordre, activation et personnalisations, avec remappage des lignes. Une mise à jour vers les nouvelles CGV reste une proposition distincte à confirmer.
- Conserver les prix vendus, références de catalogue et snapshots des lignes ; ne pas transformer une preuve signée de la source en preuve de la nouvelle révision.
- À l’acceptation, utiliser exclusivement le contrat de la version effectivement envoyée et acceptée, avec rattachement des preuves au bon devis/transmission. Préserver les contrôles de révision courante, l’atomicité de conversion et de provisionnement, ainsi que l’idempotence.
- Le moteur actuel exclut les devis acceptés de la création de révision. **Ne pas ouvrir implicitement les avenants, réouvertures ou corrections après acceptation** : ce périmètre nécessite une règle distincte si demandé.

## Compatibilité des devis existants

| Population | Traitement proposé |
|---|---|
| Brouillon sans snapshot | Passage au nouveau protocole lors d’une action explicite ; aucune écriture à l’ouverture |
| Ancien brouillon finalisé avec snapshot | Conserver snapshot et historique à l’identique. Ne pas le dégeler automatiquement. Si modification souhaitée, proposer une copie/révision traçable plutôt qu’effacer le gel historique |
| Envoyé/vu/refusé/expiré avec snapshot | Conserver la version exacte et la provenance historique ; ne pas inventer une date de capture à l’envoi à partir de `contract_compiled_at` |
| Accepté avec snapshot | Contrat, preuves, liens et dates inchangés ; aucun recalcul avec les CGV actuelles |
| Historique sans snapshot ou incomplet | Conserver l’absence/les champs existants, y compris distinction null/texte vide. Ne jamais reconstituer une version prétendument envoyée depuis la bibliothèque actuelle. Afficher honnêtement la limite de vérification |

Aucun backfill automatique de contrats, dates ou preuves. Les populations ci-dessus sont une matrice de compatibilité à tester, **pas un inventaire des bases réelles**, qui n’ont pas été consultées.

## Schéma SQLite : évolution proposée, non exécutée

Une migration additive est recommandée pour séparer durablement préparation et transmission sans détourner les colonnes historiques :

- Table de préparations immuables, rattachées au devis : identifiant, version de protocole, contenu complet, empreinte et référence/version source.
- Table de transmissions immuables : devis, préparation, contenu/empreintes exacts, dates de réalisation et d’enregistrement distinctes, provenance/canal, références de preuve et identifiant d’opération unique.
- Pointeur nullable vers la préparation active sur le devis, ou métadonnée équivalente à arrêter lors de l’implémentation. Les colonnes de snapshot définitif existantes restent conservées.

Le registre local atteint 70 ; **le prochain numéro doit être recontrôlé et réservé au moment du développement**, sans présumer l’état des branches parallèles. Ne pas modifier les migrations 1–70. Aucun remplissage historique inventé. Gardes draft/finalisation réutilisées ; verrouillage interfenêtres et contraintes FK/uniques à tester.

Les fichiers de preuve utilisent le stockage et les vérifications d’empreinte existants. Préparer et vérifier tout nouveau fichier avant de publier sa référence en transaction ; en cas d’échec ne nettoyer que les fichiers temporaires créés par l’opération. Une transaction SQLite seule ne rend pas les copies de fichiers atomiques. **La sauvegarde des logos hors SQLite reste un chantier séparé.**

## Fichiers concernés lors de l’implémentation

Périmètre confirmé à ce stade, à limiter au nécessaire :

- `src/main/commercial/QuoteService.ts` : finalisation, envoi atomique, révision, acceptation.
- `src/main/commercial/ContractTermsService.ts` : lecture, proposition/application, capture et copie exacte des clauses.
- `src/main/commercial/QuoteContractPreparationService.ts` : préparation, invalidation explicite, preuves et compatibilité.
- `src/main/projects/ProjectCommercialService.ts` : vérifier les liaisons de révision/acceptation ; modifier uniquement si nécessaire, sans changement de règle commerciale.
- `src/main/ipc.ts`, `src/preload/preload.ts`, types partagés `commercial.ts`, `contractTerms.ts`, `quoteContractPreparation.ts` : commandes explicites et contrats typés.
- `src/main/commercial/quotePdf.ts` et lecteurs de présentation contractuelle : source préparée/transmise correcte, sans synchronisation implicite.
- `src/renderer/commercial/ContractTermsBuilder.tsx`, `QuoteFinalizationPanel.tsx`, `QuoteContractPreparationPanel.tsx`, `QuotesPage.tsx` : états, comparaison et confirmations.
- Auditer `ContractReadPanel.tsx`, `QuoteClientPreview.tsx`, `QuoteAbbyPanel.tsx` et `src/renderer/workflow/QuoteWorkflow.tsx` pour la lecture et les gardes existantes ; ne pas réécrire leurs protections.
- Nouvelle migration additive et `src/main/database/migrations.ts`, seulement après accord.
- Tests des services concernés, migrations, IPC et recettes Electron devis/UX-01 permanentes.

Aucune modification graphique de Prospect A ou Client B, des prix, des modèles CGV ou de leurs textes n’est nécessaire pour cette décision.

## Tests de non-régression prévus

1. Ouverture répétée, StrictMode, changement de fiche, aperçu, PDF, copie Abby : historique et contenu SQL inchangés hors commandes explicites.
2. Comparaison/appliquer : confirmation et annulation, proposition périmée, clauses personnalisées, retraits/orphelins, ordre, aucun changement et journal exact.
3. Préparer/reprendre : gardes métier et revue canonique conservées, ancien artefact intact, nouvelle modification possible avant envoi seulement ; finaliser ne vaut ni envoyer ni accepter.
4. Envoi : contenu égal à la préparation, nouvelle bibliothèque sans effet, préparation périmée refusée, échecs injectés entre chaque écriture, rollback total, doubles clics et concurrence multifenêtres sans doublon.
5. Révision : contrat source intact octet pour octet, prix et lignes historiques conservés, adoption de CGV uniquement explicite, preuves non attribuées abusivement à la nouvelle version.
6. Acceptation Abby : bonne version/révision, preuve et empreinte correctes, ancien devis refusé si une autre révision est courante, conversion/provisionnement idempotents et atomiques.
7. Matrice historique complète : snapshots normaux, vides, partiels ou absents ; aucune reconstruction/acceptation implicite et aucune suppression de preuve.
8. Migration additive sur fixtures : historiques 1–70, FK/intégrité, rollback et restauration ; 35 restaurations et six équivalences binaires maintenues.
9. UX-01 : brouillons des deux sections contractuelles, dirty/pending, réponses IPC tardives, navigation, fenêtres détachées, focus et annulations.
10. Typecheck et suite Vitest complète en fin de lot ; recettes Electron réelles sur profils et bases temporaires, au SHA exact. CI hébergée uniquement sur autorisation.

## Vérifications réellement réalisées pour ce plan

Au code `f85fd498ff9bbe8bc04242144d10efb737e91716` :

`npm test -- --maxWorkers=2 src/main/commercial/QuoteService.test.ts src/main/commercial/ContractTermsService.test.ts src/main/commercial/QuoteContractPreparationService.test.ts`

**92/92 tests, trois fichiers, durée Vitest 13,22 s.** Journal local : `outputs/ec03-plan-20261016/baseline-tests.log`. Ces tests vérifient le comportement actuel, pas le nouveau protocole proposé. Aucune nouvelle suite complète, recette Electron ou CI exécutée pour ce plan documentaire ; les résultats précédents Client B ne prouvent pas les futures modifications EC03.

## Risques et ordre de réalisation après accord

Risques bloquants : confusion finalisé/envoyé ; adoption silencieuse de nouvelles CGV ; version Abby impossible à établir ; écritures partielles ; conflits interfenêtres ; altération d’un historique incomplet. Refuser l’opération ambiguë, conserver les pièces d’origine et présenter l’erreur, sans réparation silencieuse.

Ordre proposé sur une branche métier dédiée : (1) lecture pure et adoption explicite ; (2) stockage préparations/transmissions et transitions atomiques ; (3) révisions, preuves et interface ; (4) matrice historique et validation complète sur un candidat unique. Commits distincts, mais aucun déploiement intermédiaire avec un cycle contractuel incohérent.

**Accord demandé avant développement** : valider ce découpage, la préparation distincte avec reprise explicite du brouillon, la migration additive et la conservation sans dégel automatique des anciens devis finalisés. L’avenant après acceptation et la sauvegarde complète des logos restent hors périmètre. Aucun merge, migration de base réelle, installation ou publication n’est effectué par ce plan.
