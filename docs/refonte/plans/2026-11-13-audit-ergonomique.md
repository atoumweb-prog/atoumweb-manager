# Audit ergonomique : plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (ou `subagent-driven-development`). Skills de contenu : `atoumweb-design` (commandes `critique` et `audit`), citées à chaque étape. Cases à cocher pour le suivi.

**But** : produire, sans modifier le code du Manager, un rapport priorisé qui prépare une refonte écran par écran : parcours simplifiés, fonctions toutes gardées, interface homogène, **aucun doublon**.

**Architecture** : lecture du code et des captures Noir/Confort, constats prouvés par fichier et sélecteur, puis une fiche de refonte par écran (option à valider, jamais appliquée seule), puis une grille impact / effort qui fixe le contenu et l'ordre de R2+.

**Outils** : lecture de code, `scripts/capture-client-gallery.cjs` comme point de départ des captures, base TEST, aucun programme externe.

**Spec** : décisions de Carlos du 13/11/2026 (conversation d'audit), `docs/refonte/DESIGN.md` (section 11), `C:\DEV\Livrables\Cadrage-parcours\CADRAGE.md` (sections 3, 5, 6, 13).

## Contraintes globales

- Aucun code produit tant que Carlos n'a pas validé le rapport et chaque correction. Aucune modification de `src/`.
- Refonte des pages existantes **autorisée à l'étude** ; chaque écran est validé par Carlos avant d'être codé.
- Toutes les fonctions sont gardées ; « simplifier » = regrouper, ranger dans « Plus », fusionner les chemins. Jamais de suppression.
- Aucune donnée métier dupliquée ; fond (données, règles métier, Prospect → Devis → Projet) inchangé sans validation.
- **Un seul thème pendant la refonte : Noir / Confort** (décision de Carlos, 13/11/2026). Les thèmes AtoumWeb et Blanc ne sont ni audités ni vérifiés ; ils reçoivent une mise à jour de styles une fois le Manager terminé. L'audit note seulement ce qui rendrait cette mise à jour coûteuse (couleurs en dur, surcharges par thème).
- Captures en **Noir/Confort** uniquement (AtoumWeb sur demande). Lancement de l'application **une seule fois** par session, sur base TEST, **sans port de débogage**.
- Chaque constat cite un fichier et un sélecteur, ou une capture. Ce qui n'a pas été vu est dit.
- Pas de commit, push ni fusion sans accord. Textes sans tiret long, jamais « assuré ». Skills citées à chaque étape.
- Acompte, particuliers : décisions du 13/11 consignées, **rien appliqué** dans le Manager.

## Revue (points que les tâches ne testent pas)

- Écran vu seulement en code : le dire dans la fiche, ne pas noter le rendu.
- Doublon qui n'en est pas un (deux chemins aux effets différents) : vérifier l'effet avant de proposer une fusion.
- Fusion de chemins qui toucherait une règle métier : classer « décision requise ».
- Écran vide ou texte long non capturé : le lister dans « non vérifié ».
- Base TEST modifiée par les captures : n'utiliser que des libellés TEST.

## Fichiers

- Créer : `C:\DEV\Livrables\Cadrage-parcours\captures-audit\` (hors dépôt, captures neuves)
- Créer : `C:\DEV\Livrables\Cadrage-parcours\AUDIT-ERGONOMIQUE.md` (seulement après relecture et accord de Carlos)
- Modifier : `PROJECT_STATUS.md`, `docs/refonte/DESIGN.md` (décision, avec accord, tâche 0)
- Aucun fichier de `src/` ni de `scripts/` modifié ; un script de capture temporaire reste dans le scratchpad.

---

### Tâche 0 : Inscrire la décision (skill : atoumweb-design, règle « DESIGN.md »)

- [ ] Ajouter à `docs/refonte/DESIGN.md` (section 11) et à `PROJECT_STATUS.md` : « Refonte des pages existantes autorisée à l'étude : simplifier les parcours, garder et perfectionner toutes les fonctions, aucun doublon ; chaque écran est validé avant d'être codé. »
- [ ] Noter dans `PROJECT_STATUS.md` : pas de points de friction de recette (Carlos n'a pas encore utilisé le Manager) ; l'audit s'appuie sur le code, les captures et le cadrage ; prochaine action = tâche 1.
- Pas de commit sans accord.

### Tâche 1 : Préparer les captures (skill : atoumweb-design, `audit`)

**Produit** : liste fermée des écrans à capturer et script de capture prêt.

- [ ] Lire `scripts/capture-client-gallery.cjs` et les scripts natifs voisins ; relever comment l'application est lancée, quelle base est utilisée, si un port de débogage est ouvert. **S'il en ouvre un, s'arrêter et demander à Carlos** avant de lancer.
- [ ] Fixer la liste des écrans : les 17 destinations du rail (Accueil, Prospection, Clients, Annuaire, Offres & Tarifs, Devis, Projets, Interventions & Maintenance, Gestion des temps, Facturation, Dépenses, Documents & Contrats, Bibliothèque AtoumWeb, Sites, Sauvegardes, Statistiques, Réglages) plus : fiche prospect (7 onglets), assistant de devis (étapes), éditeur de devis (3 étapes), fiche projet, Mon entreprise.
- [ ] Prévoir pour chaque écran : état normal, état vide (base vierge ou filtre sans résultat), un texte long si faisable.
- Vérification : la liste correspond au tableau de `CADRAGE.md` section 5 ; aucune destination du rail oubliée.

### Tâche 2 : Captures Noir/Confort (skill : atoumweb-design, `audit`)

**Dépend de** : accord de lancement donné par Carlos (reçu le 13/11/2026), tâche 1.

- [ ] Lancer l'application **une fois**, sur base TEST, sans port de débogage ; produire les captures dans `captures-audit\` nommées `NN-ecran-etat.png`.
- [ ] Contrôler chaque capture (lisible, bon écran, libellés TEST) ; refaire seulement celles qui échouent.
- [ ] Noter les écrans impossibles à atteindre (donnée absente, erreur) dans « non vérifié ».
- Vérification : nombre de captures = liste de la tâche 1, moins les manques déclarés.

### Tâche 3 : Relevé technique transversal (skill : atoumweb-design, `audit`)

**Produit** : chiffres prouvés pour les zones C et D.

- [ ] Tailles de police sous 14 px effectives (dont `.quote-line small` à 12 px) : fichier et sélecteur, et si la couche `ui-typography-consistency.css` les neutralise.
- [ ] Couleurs écrites en dur à la place des tokens `--aw-*` (jaune, bleu, rouge, vert), par fichier ; `--text-muted` : portée réelle.
- [ ] `!important` : 99 dans `ui-consistency-v2.css`, plus le total par fichier ; pire cascade.
- [ ] Imports CSS de `main.tsx` (36) face aux scripts `check-ux-v2-lot01b-*` (31) et à la restriction « / » de `check-ux-v2-lot01a-typography.cjs`.
- [ ] Rayons, ombres, hauteurs de contrôle : valeurs distinctes en usage.
- [ ] Menus « Plus » et « Prochaine étape » : relire le code (focus, Échap, clic extérieur), noter « non exécuté ».
- [ ] Noir / Confort : contraste des états survol, actif, désactivé quand le code le permet. Autres thèmes : relever seulement les couleurs en dur et surcharges `html[data-theme] … !important` qui compliqueront la mise à jour finale.
- Vérification : chaque chiffre est reproductible par une recherche citée dans le rapport.

### Tâche 4 : Inventaire des doublons (skill : atoumweb-design, `distill` pour la décision)

**Produit** : tableau des doublons, avec décision proposée.

- [ ] **Chemins** : relever pour chaque action courante (créer un devis, créer un projet, ouvrir une fiche, envoyer, enregistrer, relancer) tous les chemins existants, avec fichier de la fonction.
- [ ] **Composants** : usages de `secondary-button` / `primary-button` / `status-pill` face à `AppButton` / `StatusPill` ; composants quasi identiques ; `*Workshop.tsx`.
- [ ] **Styles** : règles redéfinies dans plusieurs fichiers pour un même rôle.
- [ ] **Informations** : chiffre ou libellé affiché à plusieurs endroits ; vérifier que la source est unique (`AGENTS.md`), dont « Devis à préparer : 1 » face à la liste Devis vide.
- [ ] Pour chaque doublon : fusionner, ou un chemin + l'autre rangé dans « Plus », et indiquer si l'effet est réellement identique.
- Vérification : aucun doublon proposé sans avoir comparé l'effet des deux côtés.

### Tâche 5 : Critique du parcours principal (skill : atoumweb-design, `critique`)

**Dépend de** : tâches 2 à 4.

- [ ] Accueil, Prospection (liste, volet, fiche, onglets), Nouveau prospect, assistant de devis, éditeur de devis, Projets : hiérarchie, charge cognitive, cohérence, états, accessibilité, texte.
- [ ] Note Nielsen **par écran** (0 à 4 sur 10 critères, total / 40) et note du parcours.
- [ ] Défauts déjà connus (zone E) prouvés et chiffrés : logo, message vide de Devis, casse des en-têtes, « Devis à préparer », « Destinatai/re », « Racine du projet ».
- [ ] Vérifier la cohérence avec le cadrage (garder / simplifier / regrouper / masquer) et noter les écarts.
- Vérification : chaque problème a une preuve (fichier + sélecteur, ou capture) et une priorité P0, P1 ou P2.

### Tâche 6 : Critique des autres écrans (skill : atoumweb-design, `critique`)

- [ ] Offres & Tarifs, Facturation, Clients, Annuaire, Réglages, Mon entreprise, puis Interventions, Temps, Dépenses, Documents, Bibliothèque, Sites, Sauvegardes, Statistiques : même grille, plus courte pour les écrans de gestion.
- Vérification : tous les écrans de la tâche 1 sont notés ou déclarés « non vu ».

### Tâche 7 : Fiches de refonte et ordre R2+ (skills : atoumweb-design `shape` en mode option ; superpowers:brainstorming pour tout choix ouvert)

- [ ] Une fiche par écran : état actuel, parcours simplifié, ce qui est gardé et où, doublons résolus, coût, « interface seule » ou « décision requise ».
- [ ] Grille impact / effort ; ordre proposé de R2+ (ordre provisoire : Prospection, Devis, Projets, Catalogue, Bibliothèque / Sites, Paramètres) et écarts justifiés.
- [ ] Liste des scénarios de recette à réécrire en R2 (`check-unsaved-inputs-ui.cjs`, `check-contract-library-ui.cjs`) et du câblage à couvrir au banc natif (menus « Plus » et « Prochaine étape »).
- Chaque fiche est une **option** : aucune refonte lancée sans accord de Carlos.

### Tâche 8 : Rapport et suite (skill : atoumweb-design, règles « Audit »)

- [ ] Rapport dans le chat : verdict, scores, P0 / P1 / P2 avec preuves, ce qui est à garder, doublons, ordre R2+, **ce qui n'a pas été vu**.
- [ ] Après relecture et accord : écrire `AUDIT-ERGONOMIQUE.md` à côté de `CADRAGE.md`, mettre à jour `CADRAGE.md` (points de friction = constats de l'audit) et `PROJECT_STATUS.md`.
- [ ] Demander à Carlos de valider écran par écran les refontes avant R2.
- Vérification finale : `git status` ne montre aucun changement dans `src/` ni `scripts/` ; seuls les documents autorisés ont bougé.
