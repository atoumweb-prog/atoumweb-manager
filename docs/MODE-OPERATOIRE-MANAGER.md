# Mode opératoire — AtoumWeb Manager

*Pour : Carlos, utilisateur du Manager. Rédigé le 09/11/2026 à partir du code de la branche `claude/v394-decisions-20261109` (PR #166 + PR #168). Ce document décrit ce que fait réellement l'application ; quand une étape n'existe pas encore, il le dit.*

> **État au 09/11/2026 : la V3.9.4 n'est pas activée.** Le Manager que vous utilisez travaille encore avec le catalogue publié actuel. Les 130 tarifs et 119 clauses V3.9.4 existent seulement en brouillon, dans les copies de recette (TEMP). La partie 2 explique comment les activer, à la main, avec un retour arrière.

---

## Partie 1 — Le parcours quotidien

```
Prospect ──► Devis ──► Abby (envoi) ──► « Marquer envoyé » ──► Abby (acceptation) ──► « Confirmer accepté dans Abby »
                                                                                              │
                                     ┌────────────────────────────────────────────────────────┤ automatique
                                     ▼                          ▼                             ▼
                            prospect → Client          Projet confirmé          Maintenance, packs d'heures,
                                                                                interventions créés
```

### 1. Prospect

Menu **Prospects**.

1. Créez ou ouvrez la fiche du prospect. Renseignez le besoin (résumé du projet, contexte, échéance souhaitée) : ces informations pré-remplissent le devis.
2. Suivez l'avancement avec les étapes du pipeline ; **Programmer la relance** pose une date de rappel.
3. Si l'affaire est perdue : **Classer comme perdu**.
4. Quand le besoin est clair : **Préparer le devis**. Le devis est créé en brouillon et relié au prospect.

### 2. Devis : offre, options, clauses

Menu **Devis**, ou directement depuis la fiche prospect (**Éditer le devis dans cette fiche**). Le devis se construit en trois temps (**Prestations et prix → Conditions et CGV → Vérifier le devis**).

**a) Choisir l'offre et les prestations**
- Dans *Ajouter depuis le catalogue*, cherchez par nom, code AW, besoin ou mot-clé.
- **Seules les versions publiées des prestations actives** peuvent être ajoutées. Une prestation en brouillon (ou à statut restreint) n'apparaît pas : c'est voulu.
- Le prix vient de la version du catalogue ; il est **figé dans le devis** (une hausse ultérieure du catalogue ne modifie pas un devis existant).

**b) Options et compléments**
- Section *Contenu des offres, options et compléments* : options proposées avec l'offre, nombre de produits, périmètre, dates de début de service.
- Le Manager **bloque** les incohérences connues : par exemple une ligne newsletter à 99 € ajoutée à une formule WooCommerce Business/Visibilité qui l'inclut déjà, ou un nombre de produits inclus différent de celui de l'offre.

**c) Conditions et clauses**
- Étape *Conditions et CGV* : choisissez le **public** (particulier / professionnel). Les clauses proposées dépendent de l'offre, du public et du devis.
- Les avertissements affichés ne sont pas des erreurs, ce sont des rappels à traiter : RC Pro non attestée, médiation non conventionnée (particuliers), autorisation de référence commerciale distincte, règles d'impayés, reconduction.

**d) Vérifier et valider**
- **Prévisualiser côté client** pour relire le document.
- **Valider le devis pour envoi** (finalisation) : refusé si le devis est vide ou si une ligne a un problème bloquant. Ensuite, le contenu est figé ; pour changer quelque chose, utilisez **Créer une révision du même dossier**.

### 3. Copie vers Abby et envoi

Abby reste l'outil qui envoie les devis et produit les factures officielles. Le Manager ne les envoie pas lui-même.

1. Dans le devis : **Préparer Abby**, puis **Copier le bloc commercial pour Abby**. Collez ce bloc dans le devis Abby.
2. Envoyez le devis **depuis Abby**.
3. Revenez dans le Manager : **Marquer envoyé**. Le Manager demande une **attestation** : canal (Abby ou autre), date d'envoi, confirmation. Il enregistre quelle version exacte a été envoyée.
   - Refusé si le devis n'a pas été validé, ou si le destinataire a changé depuis la préparation (il faut alors reprendre).
4. Facultatif : **Marquer vu** quand le client l'a consulté.

### 4. Acceptation

Quand le client accepte dans Abby :

1. Dans **Devis** : **Confirmer accepté dans Abby** (aussi **Devis accepté / signé** depuis la fiche prospect).
2. Le Manager vous demande d'attester l'acceptation reçue (canal, date). Le PDF signé reste une pièce à joindre à part. Il vérifie que la version acceptée est bien celle envoyée. Puis, **en une seule opération** :
   - le prospect devient **client** (menu **Clients**) ;
   - le devis passe *Validé*, son contenu est définitivement figé ;
   - le **projet** prévu est confirmé (menu **Projets**) ;
   - selon les prestations vendues : **souscription de maintenance** avec ses périodes, **pack d'heures**, **intervention** (menu **Interventions & Maintenance**).
3. Autres issues : **À négocier**, **Refuser** (**Confirmer le refus du devis**), **Expirer**.

### 5. Projet

Menu **Projets** : lots, modules, tâches, ressources, avancement. Le temps passé se saisit et s'analyse dans **Gestion des temps**.

### 6. Maintenance et interventions

Menu **Interventions & Maintenance**.

- Les souscriptions créées à l'acceptation y apparaissent avec leurs **périodes**. **Générer / ouvrir la période actuelle** prépare la période en cours.
- **+ Nouvelle demande**, **+ Intervention de maintenance** : enregistrez les demandes du client et les interventions ; le temps est décompté du forfait ou du pack d'heures.
- Une maintenance mensuelle est une **période** d'un contrat, jamais un nouveau projet.
- **Tracer une sauvegarde avant / après validation** : garde la trace des sauvegardes faites autour d'une intervention (menu **Sauvegardes** pour l'historique).

### 7. Facturation

Menu **Facturation** : liste des éléments à facturer. Vous facturez **dans Abby**, puis vous archivez le PDF de la facture Abby dans le Manager. Le Manager ne produit pas de facture officielle.

### 8. Renouvellements — ce qui est fait et ce qui ne l'est pas

| Fait par le Manager | À faire vous-même |
|---|---|
| Distingue les modes de renouvellement selon la version vendue : **sur accord exprès** (maintenance annuelle, domaine hors mariage) ou **reconduction prévue au contrat** (Lune, GBP, statistiques, newsletters, mariage) | Repérer les échéances à venir |
| Affiche les rappels : hausse mensuelle annoncée 30 jours avant ; prix annuel fixe, hausse seulement sur accord écrit | Prévenir le client dans les délais (particuliers : information entre 3 mois et 1 mois avant la date limite de refus) et garder la preuve |
| Ne renouvelle et ne facture **rien automatiquement** | Créer le nouveau devis ou la nouvelle période, et facturer dans Abby |

---

## Partie 2 — Activation manuelle de la V3.9.4

> **Rien de ce qui suit n'a été exécuté.** Chaque étape marquée 🔒 demande votre accord explicite au moment de la faire. Le Manager refuse aujourd'hui, par sécurité, d'appliquer l'import et la migration ailleurs que sur une copie TEMP : la procédure s'appuie sur cette protection au lieu de la contourner.

### Principe

On ne modifie jamais directement la base en service. On **sauvegarde**, on **prépare une copie** activée et contrôlée, puis on **remplace** la base par cette copie, Manager fermé. Pour revenir en arrière, on remet la sauvegarde et l'ancienne version du Manager.

### Avant de commencer

- [ ] La PR #166 et la PR #168 sont relues et acceptées 🔒
- [ ] La base à activer est identifiée avec certitude (chemin exact du fichier `atoumweb-manager.sqlite` et du profil). Aujourd'hui la « préproduction » est `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-UX-V2-20261104/Workspace-TEST/` ; **sa bibliothèque de clauses est vide** : confirmez que c'est bien la base voulue.
- [ ] Un nouveau Manager (« runtime ») est construit depuis la branche validée, dans un **nouveau** dossier de livraison. L'ancien dossier est conservé tel quel : il sert au retour arrière.

### Étape A — Sauvegarde 🔒

1. **Fermez le Manager** (toutes les fenêtres).
2. Lancez la sauvegarde cohérente (base + journal WAL) avec vérification de restauration :
   ```bash
   python scripts/prepare-catalog-draft-snapshot.py --source "<chemin>\atoumweb-manager.sqlite" --profile "<chemin du profil>" --output "<dossier de sauvegarde>"
   ```
   Le script crée la sauvegarde, la restaure sur une copie TEMP et compare les empreintes.
3. Copiez aussi le dossier du profil et les documents du workspace : la sauvegarde SQLite ne contient pas les fichiers joints.
4. Notez l'empreinte (SHA-256) de la sauvegarde.

### Étape B — Préparer la copie de mise en service

Une seule commande, qui ne touche jamais la base en service :

```bash
node scripts/prepare-v394-activation-copy.cjs --snapshot-report "<dossier de sauvegarde>\SAUVEGARDE-RESTAURATION.json" --output "<dossier NOUVEAU>"
```

Ce qu'elle fait, sur une copie neuve de la sauvegarde :
1. vérifie que la sauvegarde est intacte **et que la base en service n'a pas changé depuis** (sinon : refus, refaites l'étape A) ;
2. migration 81 (brouillons du catalogue) — refus si plusieurs brouillons existent pour une même prestation ;
3. import du pack V3.9.4 : 130 tarifs et 119 clauses **en brouillon** ;
4. noms des 13 fiches et familles (décisions du 09/11) ;
5. contrôles : aucune ligne existante perdue ni modifiée en dehors des fiches du pack (nom, famille, code) ; ajouts seulement là où l'import les prévoit ; rien de publié ; aucune fiche « TEST » ; intégrité ; le moteur du Manager démarre sur la copie.

Résultat dans le dossier de sortie : `atoumweb-manager.sqlite` (la copie prête), `RAPPORT-ACTIVATION.md` (à lire) et `RAPPORT-ACTIVATION.json`. **Au moindre écart, la commande s'arrête avec « REFUSÉ » et ne laisse aucun fichier.**

*Répétition faite le 09/11/2026 sur la préproduction : copie prête, 21 fiches existantes modifiées (celles du pack, nom/famille/code uniquement), base de préproduction inchangée. Dossier : `C:\DEV\Livrables\Activation-V394-repetition-2026-11-09`.*

> Les anciens scripts `rehearse-catalog-draft-copy.cjs` et `integrate-approved-v394-temp.cjs` restent des outils de **test** : le premier écrit volontairement des fiches « TEST » dans sa copie. Ne jamais mettre en service une copie produite par eux.

### Étape C — Mise en service 🔒

1. Manager toujours fermé.
2. Vérifiez que la base en service n'a pas changé depuis la sauvegarde : son empreinte doit être celle notée dans `SAUVEGARDE-RESTAURATION.json` (`sourceFingerprintsBefore`).
   ```powershell
   Get-FileHash "<chemin>\atoumweb-manager.sqlite" -Algorithm SHA256
   ```
   Si elle diffère, ou si le fichier `atoumweb-manager.sqlite-wal` n'est pas vide (taille différente de 0), **arrêtez** et recommencez à l'étape A. Un fichier `-shm` seul, avec un `-wal` vide, est sans conséquence.
3. Renommez la base en service (par exemple `atoumweb-manager.sqlite.avant-v394`) et mettez de côté ses fichiers `-wal`/`-shm` avec elle. Copiez la copie prête à sa place, sous le nom `atoumweb-manager.sqlite`, et vérifiez son empreinte (celle du rapport).
4. Ouvrez le **nouveau** Manager sur ce workspace. *L'ancien Manager refusera d'ouvrir cette base (migration 81 inconnue) : c'est normal et protecteur.*
5. Vérification rapide : un ancien devis s'ouvre à l'identique ; **Offres & Tarifs** montre les brouillons V3.9.4 ; **Documents & Contrats** montre les 119 clauses en brouillon.

### Étape D — Publication commerciale 🔒

L'import ne rend rien vendable. Tant qu'une version n'est pas **publiée**, elle ne peut pas entrer dans un devis.

1. Dans **Offres & Tarifs**, publiez les versions V3.9.4 voulues. La publication d'une version remplace la précédente pour les **nouveaux** devis ; les devis existants gardent leur prix.
   - 118 références sont publiables. **12 sont bloquées par le Manager** : les 6 « à vérifier avant commercialisation », 2 bases internes de devis, 4 anciennes références.
   - Les 47 prix « retenus sur délégation » sont publiables, mais ce ne sont pas des validations tarifaires individuelles.
2. Dans **Documents & Contrats**, publiez les versions de clauses voulues, puis rattachez clauses et types de contrat aux prestations. La cartographie proposée (409 liens) **n'est pas appliquée automatiquement** : chaque rattachement est un choix explicite.
3. Faites un devis TEST complet (vitrine, Woo Business, maintenance) jusqu'à l'aperçu client, sans l'envoyer.

### Retour arrière

| Moment | Que faire |
|---|---|
| Échec pendant l'étape B | Rien à faire sur la base en service : elle n'a pas été touchée. Les opérations sur la copie sont annulées automatiquement en cas d'erreur. |
| Après l'étape C, **avant** tout nouveau devis | Fermez le Manager. Remettez le fichier `atoumweb-manager.sqlite.avant-v394` (ou la sauvegarde de l'étape A) sous son nom d'origine. Rouvrez avec **l'ancien** Manager. Vérifiez qu'un ancien devis s'ouvre. |
| Après l'étape C, **avec** des saisies nouvelles | Avant de restaurer, faites une **nouvelle sauvegarde** de la base activée, pour ne pas perdre ces saisies. Puis restauration comme ci-dessus. Les saisies postérieures seront à ressaisir ou à reprendre au cas par cas. |
| Une publication de l'étape D pose problème | Pas besoin de tout restaurer : publiez une nouvelle version corrigée de la prestation. Les devis déjà émis ne changent pas. |

Ne jamais : ouvrir la base activée avec l'ancien Manager en forçant ; supprimer des colonnes ou tables à la main ; copier seulement le fichier `.sqlite` pendant que le Manager est ouvert.

---

## Partie 3 — Ce qui n'est pas encore développé

| Sujet | État |
|---|---|
| **Mécanisme d'activation intégré** | La copie propre est préparée par une commande (étape B) ; le remplacement de la base (étape C) et la publication (étape D) restent manuels, par choix. Pas de bouton dans l'application. |
| **Renouvellements** | Pas de tableau des échéances, pas d'alerte avant la date limite de refus, pas d'envoi d'information au client, pas de reconduction ni de facturation automatique. |
| **Mécanismes B2C (particuliers)** | Rétractation : clauses et contrôle d'exécution anticipée présents, mais le parcours de vente réel reste à vérifier. Information de reconduction nominative et **résiliation en ligne** : non développées. |
| **RC Pro** | Aucune couverture attestée ; décision non arbitrée. Le Manager l'affiche en avertissement, sans rien présumer. |
| **Médiation (CM2C)** | Aucune convention attestée ; la clause 033 interdit de citer CM2C tant que ce n'est pas signé. |
| **Référence commerciale / logo** | La clause 119 ne vaut pas accord ; le consentement distinct, facultatif et révocable n'a pas de saisie dédiée. |
| **Rattachements clauses ↔ prestations V3.9.4** | Proposition de 409 liens non appliquée ; à faire à la main à l'étape D. |
| **Annexes de la bibliothèque** (définitions, extrait tarifaire, application commerciale) | Non intégrées, par décision du 09/11. |
| **RGPD par site** | Accords et sous-traitants suivis, mais annexes et procédures manquantes non finalisées. |
| **Factures** | Toujours dans Abby ; pas de lien automatique Abby ↔ Manager. Copier-coller du bloc commercial et archivage des PDF. |

---

*Sources : code de la branche (QuoteService, OperationalSalesService, ProjectCommercialService, ApprovedPackService, ApprovedPackActivationPlan, approvedBusinessPolicy), [rapport d'intégration V3.9.4](integration-v394-v15-20261108/RAPPORT-INTEGRATION-2026-11-08.md), [préparation de la migration 81](ux-v2/offres-tarifs-v2/PREPARATION-ACTIVATION81-PREPRODUCTION-2026-11-08.md), [compatibilité du lot 2](ux-v2/offres-tarifs-v2/COMPATIBILITE-ACTIVATION-LOT2-2026-11-08.md).*
