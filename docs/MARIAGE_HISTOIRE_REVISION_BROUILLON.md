# Mariage Histoire — modification préparée en BROUILLON

**Dernier arbitrage AtoumWeb, 06/10/2026 : 1 Site / 4 Pages, 27 h 30 internes provisoires, vigilance 33 h, prix 899 € inchangé.** Les propositions intermédiaires 33 h standard et 1 290 € sont dépassées ; aucune application n'en a été faite. Le dossier de preuves conserve son nom initial technique `mariage-histoire-33h-brouillon`, mais son manifeste actuel et le dry-run utilisent 1650 min/89900 cents.

Aucune application au staging réel, aucun ready/publication/activation, commit/push/merge. Le banc d'essai isolé ne reçoit aucune nouvelle vue métier ni fonction. Le modèle réel et le banc existant restent au checkpoint 23 h ; les changements ci-dessous sont des candidats non activés.

## 1. Catalogue Histoire V3 candidat — prix inchangé

Le code `AW-MARIAGE-HISTOIRE` et l'item existant sont conservés. Nouvelle version draft V3 candidate, sans écrasement de V1/V2.

| Champ | Modification proposée |
|---|---|
| `description` | Mini-site mariage quatre Pages, souvenirs, Espace privé standard et livre d'or modéré |
| `inclusions` | Quatre Pages + chemins, navigation et responsive, mot de passe de Page, galerie jusqu'à 100 photos conservée, vidéo/diaporama fourni, livre d'or nom/message sans compte avec modération, une intervention post-mariage maximum 2 h dans les 60 jours |
| `exclusions` | Protection renforcée des médias et portail utilisateurs hors standard ; montage/shooting/gestion des fonds/hors volume conservés ; dépassements de l'intervention = complément après accord |
| `prerequisites` | Date mariage/remise contenus, droits sur contenus, périmètre réel des médias, responsable/modalités de modération à renseigner |
| `abbyLabel` | Site mariage Histoire — mini-site 4 Pages |
| `commercialParameters.work / deliverables / deliveryTerms / quoteRequiredWhen` | Structure/fonctions et fenêtre post-mariage, sans confondre ces 60 jours avec livraison initiale |
| `internalAdvice` | Référence provisoire 27 h 30 et recalibration au temps réel, vigilance 33 h, 120 min incluses dans A05, conditions particulières à ajouter explicitement au devis |
| `priceCents` / mode / unité | **89900 / fixed / forfait : inchangés** |
| `estimatedMinutes` catalogue | NULL conservé : référence de production dans le modèle opérationnel, pas de double source de temps ni de promesse commerciale |
| `recommendedDelayDays` | Inchangé ; pas de conversion erronée des 60 jours post-mariage en délai initial |
| `specialTerms` | Inchangé : ne pas compter sur ce champ pour ajouter automatiquement les modalités Histoire en présence de clauses catalogue publiées |
| Hébergement/corrections/garantie/renouvellement | Paramètres existants conservés (2 ans, 2 cycles, 30 jours, renouvellement selon données/décisions antérieures) ; aucune nouvelle politique récurrente |

La composition historique actuellement incluse est explicitement conservée dans le candidat ; aucune association opérationnelle nouvelle ne lui est donnée. Le dry-run confirme un seul modèle producteur des dix actions pour la ligne Histoire. Le raccord blueprint hérité est remplacé seulement dans la nouvelle V3, par la structure Histoire distincte ; l'ancien raccord V2 reste identique.

## 2. Modèle opérationnel V2 candidat — référence interne provisoire

Code/actionKeys, catégories métier, phases, quantité 1 forfait/1 Site et estimation obligatoire false conservés. `referenceMinutes=1650`, notes de provisionalité/recalibration explicites. Provenance de l'association indique référence provisoire, vigilance 1980 min hors standard et réserve post-mariage incluse. Ce n'est pas un crédit consommable, une routine ni un objet Lot8B.

| Action | V1 conservée | V2 candidate | Checklist/texte proposé |
|---|---:|---:|---|
| A01 — Atelier histoire, programme, invités et contenus | 90 | 90 | Valider le périmètre 1 Site / 4 Pages et les contenus fournis. Identifier la date du mariage et planifier une intervention post-mariage de maximum 2 h dans les 60 jours. Confirmer protection par mot de passe de la Page seulement, sans promesse de protection des URLs médias ; pas de portail utilisateurs. Désigner la personne chargée de la modération du livre d’or. Référence interne 27 h 30 provisoire, à recalibrer au temps réel. |
| A02 — Direction visuelle et architecture multipage | 120 | 150 | Définir architecture Accueil / Notre histoire / Le Jour J / Espace privé, navigation desktop/mobile, accès public/privé et direction visuelle commune. Prévoir RSVP, galerie et vidéo en sections/modules, sans Page supplémentaire. |
| A03 — Construire les quatre Pages et leur navigation | 360 | 420 | Construire les quatre Pages aux chemins /, /notre-histoire/, /jour-j/, /espace-prive/. Intégrer les contenus narratifs fournis, menus et liens entre Pages. Préparer les emplacements des modules de l’Espace privé ; aucun montage vidéo ni développement de portail sur mesure. |
| A04 — Configurer RSVP minimal et scénarios | 150 | 150 | Configurer RSVP minimal et ses scénarios ; limiter la collecte aux données nécessaires. Aucune donnée sensible de repas/régime/allergie activée par défaut. Vérifier informations et rôles de traitement selon le dispositif réel. |
| A05 — Espace privé, contenus enrichis et intervention post-mariage | 150 | 240 | Configurer mot de passe standard de la Page Espace privé ; documenter la limite des URLs directes des médias. Intégrer galerie/souvenirs et vidéo/diaporama fourni. Configurer un livre d’or nom + message, sans compte, avec modération ; responsable à préciser au devis. Inclure une unique intervention post-mariage, maximum 120 min, dans les 60 jours ; ces 120 min sont comprises dans les 240 min de A05. Tout dépassement de nombre, durée ou fenêtre nécessite un accord sur une prestation complémentaire. Ne pas clôturer ce volet avant intervention ou traitement explicite de fin de fenêtre. |
| A06 — Responsive et optimisation des quatre Pages | 120 | 150 | Adapter et vérifier les quatre Pages, menus, formulaires, galerie, vidéo et livre d’or aux formats desktop/tablette/mobile. Optimiser les médias et le chargement dans le périmètre prévu. |
| A07 — Tester navigation, fonctionnalités et accès privé | 90 | 150 | Tester les quatre chemins, navigation et liens, RSVP minimal, galerie, vidéo/diaporama et livre d’or. Tester accès avec/sans mot de passe et après rechargement. Vérifier la modération et l’absence de compte invité. Vérifier et expliquer la limite des URLs médias ; pas de certification de protection renforcée. |
| A08 — Corrections client | 150 | 150 | Traiter les deux cycles de corrections prévus, retours regroupés, dans la direction et le périmètre validés. Toute demande nouvelle est distinguée des corrections. |
| A09 — Mise en ligne et contrôles | 90 | 90 | Contrôler domaine, publication, navigation des quatre Pages et comportement de l’accès à l’Espace privé. Reconfirmer au Client la portée de la protection et la fenêtre de l’intervention post-mariage. |
| A10 — Sauvegarde et clôture | 60 | 60 | Sauvegarder et remettre les éléments prévus. Distinguer livraison initiale et clôture après le volet post-mariage ou sa fin explicitement traitée. Hébergement 2 ans selon offre inchangé ; aucune routine récurrente ou Lot 8B activé. |

**Total : 1380 → 1650 min**, soit 23 h historiques → 27 h 30 provisoires. Les cinq actions A02/A03/A05/A06/A07 changent de minutes ; toutes les checklists sont précisées pour le périmètre/les contrôles. A02/A03/A05/A06/A07 ont des libellés adaptés ; leurs identités restent les mêmes dans la nouvelle version.

**A05 = 240 min, dont au maximum 120 min pour l'intervention post-mariage**, pas 240+120. Le budget initial Espace privé/médias/livre d'or est donc serré : contrôler les premiers temps réels et ajuster l'estimation courante du Projet si nécessaire, sans réécrire la référence initiale ni les projets antérieurs. Les 33 h sont une estimation prudente/seuil de vigilance, pas un déclencheur automatique ni un temps ajouté. Aucune alerte Manager ou recalibration automatique développée ici.

Essentiel reste 630 min/10 h 30, Grand Jour 1020 min/17 h. Le premier Projet devra conserver sa référence initiale tout en permettant l'estimation courante et le suivi du chrono déjà existants.

## 3. Structure candidate

1 Site ; Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Page unique Landing/Essentiel/Grand Jour strictement conservée. Protection standard par mot de passe de la Page ; aucune promesse de protection des URLs directes des médias. Galerie, vidéo et RSVP ne deviennent pas des Pages supplémentaires. Aucun mot de passe réel enregistré dans la préparation.

## 4. Contrat : aucune clause partagée créée ou réécrite

**Zéro nouveau template et zéro nouvelle version de clause partagée.** Textes/templates/versions/liens, dont `MARIAGE-PRIVE`, `MARIAGE-POST-EVENEMENT`, `MARIAGE-CONTENUS`, `MARIAGE-DUREE`, `MARIAGE-PERIMETRE`, restent strictement identiques en base et sur copie. Aucun changement Essentiel/Grand Jour.

`MARIAGE-POST-EVENEMENT` contient actuellement trois mois. Le périmètre Histoire impose maintenant une fenêtre de 60 jours ; pour éviter de modifier les autres offres, préparer des **conditions particulières applicables à Histoire seule** dans le devis, avec dérogation explicite au délai général. Réutiliser le Builder existant, pas un nouveau contrat indépendant ni une nouvelle nomenclature de bibliothèque.

Les modules concernés par cette précision sont MARIAGE-PERIMETRE, MARIAGE-PRIVE et MARIAGE-POST-EVENEMENT ; BASE-DONNEES demeure une dépendance de socle, aucun nouveau lien catalogue. Les quantités/durée/fenêtre sont des modalités du devis Histoire, pas une règle globale de la bibliothèque.

### Texte particulier proposé, BROUILLON

Conditions particulières — Mariage Histoire, applicables à cette seule prestation décrite au devis.
Le mini-site comprend les quatre Pages Accueil, Notre histoire, Le Jour J et Espace privé. RSVP, galerie et vidéo sont des sections ou modules selon le périmètre prévu, sans Page supplémentaire implicite.
L’Espace privé utilise une protection standard par mot de passe de la Page. Cette protection ne comporte aucune promesse de protection des URLs directes des fichiers médias. Une protection renforcée des médias ou un portail à comptes utilisateurs n’est pas inclus et nécessite un périmètre et un accord distincts. Cette limite ne dispense pas AtoumWeb de ses obligations techniques et des obligations applicables à la protection des données ; les contenus et le dispositif réels doivent être adaptés au besoin.
Le livre d’or standard permet de déposer un nom et un message, sans compte, avec modération selon les modalités et le responsable précisés au devis.
Par dérogation au délai général des éléments post-mariage, cette prestation comprend une seule intervention après le mariage, limitée à deux heures et à réaliser dans les soixante jours suivant sa date. Elle porte sur les contenus et fonctionnalités déjà prévus. La date du mariage et la remise des éléments sont précisées au devis pour permettre cette planification. Les demandes excédant le nombre d’interventions, le temps ou cette période relèvent d’une prestation complémentaire après information et accord préalable du Client. Cette règle ne réduit pas les garanties applicables et ne permet pas de facturer au Client une correction due à un manquement imputable à AtoumWeb.

### Limite technique constatée

`ContractTermsService` ignore `snapshot.specialTerms` catalogue dès que des clauses catalogue publiées sont liées à cet item. Copier simplement ce texte dans le catalogue n'assure donc pas son injection. La préparation le conserve séparément comme proposition de conditions particulières ; le dry-run utilise `addCustomQuoteClause` du Builder existant dans un faux devis sur copie.

**Aucune injection/synchronisation automatique nouvelle implémentée.** Avant usage réel, ajouter et vérifier les conditions particulières, leur portée Histoire et leur présence dans le snapshot. Si Histoire est retiré/remplacé du devis, ces conditions personnalisées ne bénéficient pas automatiquement du mécanisme d'orphelin des templates catalogue ; une vérification explicite est nécessaire. Si plusieurs prestations figurent au devis, ne pas appliquer les 60 jours aux autres formules. Une adaptation automatique de ce raccord relève du prochain lot Devis autorisé, pas de cette préparation.

## 5. Informations et procédures à compléter

- Date réelle du mariage et date de remise des contenus, planification de l'intervention unique dans les 60 jours ; ne pas inventer une date/date limite supplémentaire.
- Responsable et modalités de modération du livre d'or ; aucune décision Client/AtoumWeb ou avant/après publication prise silencieusement.
- Information sur la limite des médias directs et validation du périmètre réellement adapté aux contenus. Si le risque exige une sécurité renforcée, revoir le besoin avant activation plutôt que supprimer les obligations par une clause.
- Suivi de l'intervention incluse : nombre 1, maximum 120 min, date/fenêtre, accord distinct pour toute prestation complémentaire ; pas de facturation automatique.
- A05 ne peut pas être considérée entièrement exécutée à la livraison initiale si son volet post-mariage reste attendu. Planifier dans le vrai Projet sans création d'objet récurrent ; politique de clôture si aucune demande n'arrive dans la fenêtre à préciser au dossier, aucune consommation/renonciation inventée.
- Mesurer les temps dans Manager, comparer la référence 1650 min et le seuil indicatif 1980 min, documenter une éventuelle révision future. Ne pas reclasser ou réécrire les sessions historiques.

## 6. Sources ciblées et réserves

Sources officielles consultées le **06/10/2026**, sans prétendre refaire l'audit global des 118 clauses :

- [Code civil, article 1119](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040866) : Articulation conditions générales / particulières, portée Histoire seule.
- [Code civil, article 1193](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041314) : Modification convenue sans réécriture des contrats antérieurs.
- [CNIL, RGPD articles 25 et 32](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) : Protection adaptée au risque ; limite mot de passe/URLs médias ne supprime pas les obligations.

La rédaction proposée est un brouillon à vérifier dans le contexte réel, pas une déclaration de conformité. Les conditions particulières doivent être effectivement portées à la connaissance du Client ; la limite des URLs médias ne vaut pas exonération de l'obligation de sécurité adaptée au risque.

## 7. Dry-run et impact historique exact

**47/47 contrôles sur copie**, importeur opérationnel et services Catalogue/Builder/staging réutilisés. Candidat catalogue V3 draft 899 € ; modèle V2 draft 1650 min ; quatre Pages ; association draft ; profil inactif ; aucun ready. Rejeu de la préparation : aucune mutation supplémentaire. Intégrité ok/FK vide.

Sur copie uniquement : +1 version catalogue, +1 import opérationnel/+1 modèle, +1 structure distincte/+1 profil, +1 association ; faux devis/ligne/condition particulière ajoutés pour le contrôle, jamais dans la source. Tous les anciens modèles/versions/catalogue/blueprints/liens/compositions sont conservés cellule par cellule ; projets, Sites/Pages, nœuds, temps, cibles et achats réels inchangés. Aucun texte partagé modifié, aucun lien contractuel ajouté.

**L'ancien Histoire 899 €/23 h reste intact**, comme ses versions V1/V2 et son modèle V1. La version candidate garde 899 € ; seule la nouvelle référence interne est 27 h 30. Aucun ancien devis ou Projet n'est recalculé. Aucune version à 1 290 € créée, sur copie ou en réel. Les IDs du dry-run sont éphémères et ne doivent pas être réutilisés pour l'application réelle.

Validation-MSI : **118 tables identiques**, SHA avant/après `3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526`, 112 modèles draft, 94 liens draft, sept profils inactifs, aucun objet opérationnel réel.

Les tests futurs concernent génération/checklists/referenceMinutes/provenance, conservation des modèles/pins historiques, paramètres de fenêtre, conditions particulières du Builder/snapshot et maintien des clauses partagées. Les contrôles réalisés vérifient la préparation et les invariants, pas le fonctionnement WordPress du mot de passe ou du livre d'or : ceux-ci seront à recetter dans le chantier réalisé.

## Livrables et arrêt

Manifeste complet (ancien/nouveau modèle, champs catalogue, conditions particulières, doctrine et historique des arbitrages) : `outputs/mariage-histoire-33h-brouillon/histoire-v3-modele-v2-candidats-brouillon.json`. Rapport `simulation-brouillon.json`, script de simulation et source-before/after.json dans le même dossier.

**Arrêt pour validation avant toute application au staging. Aucun code Manager fonctionnel modifié dans cette passe, aucun XLSX/base/migration, ready/publication/activation, commit/push/merge.**


## Mise à jour — application réelle autorisée du 06/10/2026

La préparation décrite ci-dessus est conservée comme historique. Les nouveaux éléments catalogue V3/modèle V2/structure/profil/association sont maintenant enregistrés en draft/inactifs, sans ready/publication. Le raccord des conditions particulières reste non implémenté.

## 06/10/2026 — Histoire appliqué au staging réel en BROUILLON uniquement

- Autorisation AtoumWeb appliquée : Catalogue Histoire **V3 draft / 899 €**, modèle opérationnel **V2 draft / 1650 min (27 h 30 internes provisoires)**, structure distincte **1 Site / 4 Pages**, profil inactif, association draft. UUID réels nouvellement alloués ; aucune réutilisation des IDs de simulation.
- Verrou EXCLUSIVE, sauvegarde physique SHA identique, concurrent writer refusé, plan/manifeste/code/Git recontrôlés. SHA avant=sauvegarde **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; SHA final après checkpoint/fermeture/rejeu **9aea84d704841cc8c29c2360031d10e99552514089082572441211b7dbcc65fb**. Aucun WAL/SHM/journal final.
- **108 contrôles application**, **148 contrôles indépendants Python ro/immutable** depuis sauvegarde. Intégrité ok/FK vide, schéma/migrations1–62 exacts. Rejeu complet logique et physique neutre ; mêmes IDs, aucun import/version/lien supplémentaire.
- Diff : quatorze tables avec ajouts seuls, sauf **catalog_items.updated_at** Histoire (une cellule de métadonnée). 104/118 tables identiques, anciennes lignes conservées. Templates8→9, versions9→10, nœuds59→64, Sites modèles8→9, Pages modèles17→21, profils7→8, catalogue159→160, raccords15→16, composants19→20, imports1→2, modèles112→113, liens94→95, activité483→484. Rapport complet hors dépôt.
- **113 modèles draft /0 ready ;95 associations draft /0 ready ;8 profils inactifs**. Essentiel630/GrandJour1020 exacts. Anciens Histoire899 €/23h, devis/projets/Sites/Pages/nœuds/temps, clauses118/liens409 conservés. Aucune Page RSVP/galerie/vidéo implicite.
- Conditions particulières automatiques toujours réservées au prochain lot Devis ; aucun texte de devis/contrat modifié. 33h = vigilance documentaire seulement. Aucun1290 €, ready/publication/activation, action/Projet/cible, Lot8B/Abby/Bridge/8C.
- Premier essai refusé sans écriture par garde trop strict sur les sidecars de son propre verrou ; SHA initial conservé. Garde sous verrou limité au WAL sans frame validée, répétition puis application réussies ; trace de refus conservée.
- Le banc operational-recipe conserve ses gardes du checkpoint antérieur et refusera la source après cette application, sans assouplissement automatique. Code fonctionnel/HEAD **c2bd002deec7e6742a24943132627c2d3a79bb5f** inchangés ; aucun commit/push/merge. **Arrêt pour validation.**
- Preuves/backup/IDs/diff : **outputs/mariage-histoire-33h-brouillon/application-reelle/BILAN_APPLICATION_HISTOIRE.md** (nom de dossier historique ; référence réelle27h30).
