# Lot 05E — Lecture client, préparation Abby, exports Word/PDF et preuves

**Statut : cible documentaire UX/UI V2 ; aucune nouvelle fonction d'export Word, d'import Word ou PDF n'a été implémentée par ce dossier.**
**Audit du code : `main@eb252d5c` (09/10/2026).** Voir [05A](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05D](LOT-05D-BUILDER-RESOLUTION.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Lot 09 Documents](LOT-09-GESTION-DOCUMENTS.md), [CATALOGUE-CGV](CATALOGUE-CGV.md).

## 1. Objectif
Disposer d'**une lecture client propre du contrat incorporé au devis**, consultable depuis le Builder et les fiches commerciales, et de sorties destinées à la **préparation Abby** et à la **relecture humaine**, sans que copier/exporter/importer vaille acceptation ou recrée un contrat autonome.

Trois objets ne doivent jamais être confondus :
- **Contrat préparatoire dans Manager** : texte versionné, paramètres, sections, contrôles et aide de lecture.
- **Devis officiel émis/accepté dans Abby et ses pièces** : PDF accepté, référence, date, provenance, empreinte, preuves et historique de remplacement ; source juridique à comparer aux pièces réellement acceptées.
- **Versions d'étude/export Word ou PDF** : supports de contrôle, **non preuves de consentement**, sauf dossier de preuve distinct et validé.

## 2. Ce qui existe en code et ce qui reste proposé
| Composant/service | Réalité établie | Différence V2 |
|---|---|---|
| `ContractReadPanel.tsx` | Lit `ContractPresentation.sections`, avertit si brouillon non enregistré, copie **pour Abby**, contrat seul ou complet via `contractCopy`. | Sommaire logique, paragraphes cohérents par rubrique 05C, renvois propres et visibilité des réserves/provenance en panneau distinct. |
| `src/shared/contractPresentation.ts` | Fonction pure `formatContractPresentation`, `contractCopy`, `contractPresentationHtml` et récupération depuis snapshot. | Préserver l'**identité exacte de la source** ; présentation V2 d'un Devis gelé **sans le reformater rétroactivement** si le résultat juridique change. |
| `ContractTermsService.presentation` | Sur snapshot figé avec `presentation`, **retourne la présentation conservée** ; `historical_missing` et gel vide explicitement gérés. | Versions futures doivent garantir même principe, y compris pour versions de document Word/PDF dérivées. |
| `QuoteContractDocumentPanel.tsx` | Référence Abby, import et ouverture du PDF accepté depuis la fiche Devis, anciens documents conservés selon affichage/service. | Montrer actif/historique, preuve, date, empreinte et rôle « PDF accepté » sans confusion avec export de travail. |
| `QuoteContractPreparationService` | Pièces liées et rôles `accepted_pdf` et autres, SHA-256, provenance, `supersedesId`, contrôles d'intégrité et déclaration d'acceptation. | Lister les pièces et replacements, statut vérifié/indisponible, **bloquer tout effacement physique de preuve liée**. |
| `DocumentsPage.tsx` et `ClientContractsPanel.tsx` | Archive documents par Client, onglet contrats constitué des **devis acceptés**, ouverture du PDF Abby si présent. | Navigation ID exact vers Devis, Contrat, pièces et Projet, sans créer « second contrat » distinct. |
| `ContractReadPanel` / `contractPresentationHtml` | Helpers de copie et rendu HTML disponibles ; certaines fonctions de PDF de Devis peuvent déjà consommer ce rendu. | **L'export DOCX éditable et le retour DOCX comparé ne sont pas attestés** dans ces interfaces ; les distinguer des exports réels existants, et auditer les fonctions de PDF avant promesse de fonctionnalité. |

## 3. Sorties UX V2
| Action | Contenu et destination | Autorisation/contrôles |
|---|---|---|
| **Copier pour Abby** | Texte contractuel propre, sans code interne ; éventuels éléments de Devis selon commande ; copié après réponse IPC | Disponible depuis valeurs **enregistrées**, interdit si brouillon `dirty` ou texte absent ; **pas de mutation d'état**. |
| **Aperçu client** | Lecture organisée en rubriques intelligibles, montants/conditions/annexes, sans `[À RENSEIGNER]`, IDs, code Abby ou termes d'atelier | Afficher avertissements et incohérences séparément, ne pas les camoufler dans le texte remis au client. |
| **Export PDF de présentation** | Copie de travail du contrat/devis, version/provenance, filigrane « Préparatoire » si non signé | **Cible à valider**, ne pas substituer au PDF accepté Abby ; vérifier les exports réels existants. |
| **Export Word éditable** | Fichier DOCX pour rédaction/relecture, rubriques et numérotation contrôlées, pièce de travail | **Fonction future**, version, table/liste/styles/champs à préserver ; pas d'altération du snapshot officiel. |
| **Import Word comparé** | Projet de modifications présenté sous forme **diff avant/après**, changements explicitement acceptés dans **un nouveau brouillon** | **Fonction future**, pas d'import direct dans une version publiée, figée, ni écrasement silencieux des clauses partagées. |
| **Ouvrir PDF accepté Abby** | PDF déjà lié au Devis Client, historique et empreinte de preuve | Jamais réédité comme texte source de CGV ; statut « accepté » déterminé par acte de validation, non par clic « Ouvrir ». |

## 4. Garde de fidélité Word / DOCX à prévoir
- L'export doit conserver **titres, niveaux, numérotation, listes, tableaux, gras/italique, renvois, paragraphes** ; si un élément ne peut être représenté, avertir **avant création** et joindre rapport de compatibilité.
- Le retour doit identifier **ajouts, suppressions, déplacements, modifications de mise en forme et contenu** ; déterminer la source clause/version pour chaque portion. Une « phrase inconnue » ne doit jamais modifier automatiquement plusieurs clauses.
- Diff **en lecture seule** d'abord ; l'utilisateur choisit **Créer un brouillon d'amendement**, conserve le fichier importé/provenance, rattache aux clauses voulues avec validation spécifique.
- Si contrat figé/accepté ou pièce Abby, **aucune modification in-place** n'est possible. Modifications futures via nouveau Devis/révision et nouveau snapshot autorisé.
- Un DOCX importé n'est ni une preuve de signature ni une revue juridique validée. Une signature scannée/PDF ne doit pas servir à réécrire une clause source.

## 5. Gestion des preuves et remplacements
1. **Préparation contractuelle** : indiquer clairement les pièces requises et les pièces déjà liées, avec rôle exact, date, source, statut d'intégrité.
2. **Rattacher un PDF accepté Abby** : référence du devis, type de document et empreinte ; absence de PDF distinguée d'un document perdu.
3. **Historique** : la nouvelle pièce active conserve une chaîne `supersedesId` / `replacementReason` et l'ancienne pièce, pas écrasement du fichier source.
4. **Accord explicite** : une attestation opérateur horodatée est distincte de la pièce signée ; si l'un manque, ne pas présenter l'autre comme preuve juridiquement suffisante sans vérification humaine.
5. **Intégrité** : fichier manquant/empreinte différente = anomalie visible, ouverture/refinalisation bloquée dans les cas réellement prévus par le service.
6. **Conservation** : une suppression définitive de preuve contractuelle référencée est refusée ; l'archivage n'efface ni le Devis ni l'empreinte ni les liens historiques. Durées légales précises **à contrôler juridiquement**, pas à inventer ici.
7. **Provenance** : le PDF officiel est une **pièce de Devis accepté**, le texte contrat dans Manager un **snapshot historique** ; les comparer sans les substituer.

## 6. Recette prévue (16 scénarios, non exécutés)
| ID | Scénario | Résultat |
|---|---|---|
| R05E-01 | Copier pour Abby avec brouillon enregistré | Texte propre et copie effective après retour du service |
| R05E-02 | Copier avec modification non enregistrée | Action refusée, avertissement `dirty` |
| R05E-03 | Lire un contrat modèle sans Devis | Prévisualisation seulement, aucune vente créée |
| R05E-04 | Lire Devis multi-prestations | Rubriques/numéros cohérents, texte client sans codes |
| R05E-05 | Lire ancien Devis gelé | Présentation de son snapshot exact, pas CGV du jour |
| R05E-06 | Lire gel explicitement vide | Afficher vide conservé, aucune reconstruction |
| R05E-07 | Lire historique sans snapshot | `historical_missing`, absence claire |
| R05E-08 | Export PDF de travail | Marqué travail, non substitué au PDF Abby |
| R05E-09 | Export DOCX avec listes/tableaux | Structure conservée ou limitations explicitement remontées |
| R05E-10 | Réimport DOCX modifié | Diff avant/après et choix humain, pas d'écrasement de clause partagée |
| R05E-11 | Importer PDF Abby accepté | Identifiant/empreinte/rôle/preuve conservés |
| R05E-12 | Remplacer PDF accepté | Ancienne pièce et motif de remplacement conservés |
| R05E-13 | Fichier de preuve supprimé hors Manager | Anomalie d'intégrité, aucune fausse confirmation |
| R05E-14 | Tentative de suppression physique d'une preuve liée | Refus de l'opération destructrice |
| R05E-15 | Client → Contrats → PDF / Devis exact | Bons IDs et retour contexte |
| R05E-16 | Neuf modes visuels + clavier, tests SQLite/fichiers fictifs | Pas de perte ni fuite, Validation-MSI intacte |

## 7. Risques/choix à instruire
- **E140** : sorties **PDF réelles déjà disponibles** dans l'app, leurs limites et leurs liens aux snapshots.
- **E141** : stratégie DOCX (formats/styles/tables et contrôle de fidélité) et analyse de réimport ; pas de faux « import complet ».
- **E142** : évolution/rétention des pièces Abby et preuves sans créer un second système d'archivage.
- **E143** : navigation Client–Devis–Contrat–Projet par identifiant, garde UX-01 et multi-fenêtres.
- **E144** : notion de « pièce contractuelle suffisante » : critères humains/juridiques hors automatisation.
- **E145** : historique / remplacement / integrité SHA et règles de conservation selon rôles.

**L'export/import Word est un objectif UX et documentaire, pas une fonction certifiée livrée par ce lot.**
