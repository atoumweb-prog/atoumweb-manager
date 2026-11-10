# AtoumWeb Manager — Suivi du projet

## 10/11/2026 — Reprise parallèle Codex des recettes post-lot 5

Travail réalisé dans le worktree séparé `codex/restes-lots-3-5`, basé sur `claude/lot5-prospect-simplifie`, sans modification du worktree Claude ni de la préproduction.

- [x] `scripts/fixtures/creation-company.cjs` adapté à la création du prospect en une seule étape : contrôle de l’absence d’anciens onglets, présence du message indiquant que les champs complémentaires sont facultatifs.
- [x] `scripts/fixtures/ec03-transmission-scenarios.cjs` adapté au bureau de clauses actuel (`.contract-clause-desk`) et à son champ `Texte de la clause` ; l’ancien sélecteur `.cgv-clause` n’est plus attendu.
- [x] Typecheck réussi.
- [x] Suite complète réussie : 1 941 tests passés, 1 test ignoré.
- [x] Recette Electron de création du prospect exécutée sur workspace TEMP isolé : 42 contrôles réussis, 0 erreur console, fixture nettoyée.
- [x] Diagnostic du pilote commercial : le bundle renderer échouait silencieusement sur `pdfjs-dist/build/pdf.worker.min.mjs?url` avec esbuild seul ; alias et copie du worker ajoutés, puis démarrage Electron confirmé par trace (`app-ready`, `database-ready`, fenêtre, renderer chargé).
- [x] Banc recommandations spécialisé : 10 contrôles réussis, 0 exception renderer.
- [x] Parcours devis Electron spécialisé : 44 contrôles réussis, 0 erreur console.
- [ ] Pilote commercial complet arrêté ensuite sur son prérequis de fixture : la copie de préproduction contient 50 références publiées, tandis que le pilote exige 112 références publiées. Aucun scénario « Ouvrir le projet » ou devis consommateur n’est marqué validé par ce pilote.
- [x] Audit du PDF TEST vitrine : le 30/70 venait du générateur de démonstration qui n’envoyait pas `paymentPlan: 'sites_vitrines'`; la source applicative `approvedPaymentPlans.ts` et l’assistant Devis restent à 40/60. Le PDF TEST 699 € ne doit pas être considéré comme un devis conforme OFF-007.
- [x] Audit contractuel du PDF TEST : les renvois à la clause 014 et aux définitions sont présents dans les textes publiés assemblés ; aucune réécriture de clause effectuée.
- [ ] Validation de la substitution des informations administratives réelles dans un runtime isolé non terminée, car `set-company-info.cjs` détecte un processus Electron ouvert sur la préproduction. Le fichier source reste hors dépôt.
- [x] Analyse du prérequis 112 : le référentiel contient 112 identités AW, mais la copie de préproduction n’a que 23 versions AW publiées (50 versions publiées au total, 120 brouillons et 14 retirées). Le pilote confond donc le nombre d’identités canoniques avec un état de publication complet ; les références restreintes restent volontairement en brouillon selon le pack.
- [x] Audit des appels `createWithLines` : les chemins de production et les tests vitrine explicites transmettent `sites_vitrines` ; le seul PDF TEST incorrect venait du générateur temporaire de démonstration créé pour cette recette, qui omettait `paymentPlan`. Aucun appel applicatif à corriger dans `src/`.
- [x] Contrôles ciblés échéanciers : 17 tests réussis, dont 40/60 vitrine et 30/40/30 e-commerce.

Prochaine action : exécuter les deux recettes dans ce worktree, puis documenter les résultats avant de proposer les commits à transmettre à Claude.

## 10/11/2026 — Lot 5 : « Prospect simplifié » (branche claude/lot5-prospect-simplifie)

Demande de Carlos du 10/11 : terminer jusqu’au lot 5. Changements d’écran et de parcours uniquement ; aucune règle de devis ni de qualification modifiée.

- [x] Bouton « + Prospect » (au lieu de « + Entreprise ») ; création en **une seule étape** : société et contact visibles, adresse, analyse de l’entreprise et préparation du premier échange repliées et facultatives ; « Créer le prospect » remplace « Ajouter à l’annuaire ». Le nom seul suffit (inchangé côté moteur).
- [x] Prospection s’ouvre sans filtre actif (le filtre « À suivre » masquait un prospect sur quatre).
- [x] Fiche prospect à deux niveaux de navigation : les six étapes du parcours deviennent un repère d’avancement non cliquable ; restent les onglets et leurs sous-onglets. « Démarrer la prospection » est inchangé.
- [x] Besoins : « Enregistrer et continuer » (enregistre puis passe à la section suivante, seulement si l’enregistrement a réussi) ; « Enregistrer et faire le devis » remplace « Préparer le devis », qui n’enregistrait pas la saisie.
- [x] Accueil : « + Prospect », « + Devis », « + Demande » en haut, chacun ouvrant directement son formulaire.
- [x] Suite complète 1 941 tests et typecheck réussis (aucun nouveau test unitaire : changements d’interface). Essai réel sur copie jetable : 8 vérifications, 0 erreur console ; captures hors dépôt (`C:/DEV/Livrables/Lot5-prospect-simplifie-2026-11-10`).
- [ ] Recette `scripts/fixtures/creation-company.cjs` à adapter : elle vérifie encore les quatre onglets de l’ancienne création (libellé du bouton déjà mis à jour) ; non rejouée.
- [ ] « Démarrer la prospection » reste un geste séparé de la création (règle existante conservée) ; à revoir avec Carlos s’il veut le fusionner.
- [x] Préproduction de Carlos mise à jour avec le lot 5 le 10/11 (Manager du commit 0f705d64, données conservées). Lot 5 poussé le 10/11 avec l’accord de Carlos : PR brouillon #175.
- [x] Lot 4 poussé le 10/11 avec l’accord de Carlos : PR brouillon #174 sur `claude/lot3-devis-rapide`.

## 10/11/2026 — Lot 4 : « Envoyer et faire accepter » (branche claude/lot4-envoyer-accepter)

Décisions de Carlos du 10/11 (feu vert sur le plan) : le Manager prépare le PDF et un brouillon d’e-mail mais n’envoie rien lui-même ; restent obligatoires avant l’envoi « Mon entreprise », des CGV présentes, un échéancier complet et les règles propres aux particuliers ; les six points restants restent obligatoires mais sont pré-remplis ; la fiche Abby s’affiche dès l’envoi.

- [x] Vérification rapide (`src/shared/quoteQuickReview.ts`, `QuoteQuickReview.tsx`) : canal, nature et remise, calendrier, garantie, droits, renouvellement posés en six questions pré-remplies ; rien n’est enregistré avant « Valider mes réponses » ; une valeur déjà enregistrée l’emporte ; paiement, annexes et règles consommateur non touchés. Propositions tirées du référentiel V1.5 : OFF-013 (garantie corrective 30 jours dès la livraison officielle), OFF-005 (date estimée de livraison), MAINT-003 / CL-03 (maintenance mensuelle résiliable en fin de période payée, annuelle sur accord exprès), SQ-30 (export et conservation 30 jours). **La nature proposée par défaut (« prestation de service ») est une proposition à confirmer par l’utilisateur, sans vérification juridique.**
- [x] Bouton unique « Envoyer le devis » (`QuoteSendPanel.tsx`) : contrôle → préparation (ancienne « finalisation ») → PDF devis + CGV montré dans son dossier et brouillon d’e-mail (`quoteEmailDraft.ts`, sans pièce jointe : un lien mailto ne le permet pas) → « C’est envoyé ». L’envoi reste une attestation explicite ; la version transmise est alors figée (moteur `finalize` / `markSent` inchangé). « Corriger le devis » remplace « Reprendre le brouillon ».
- [x] Fiche « À recopier dans Abby » (`abbySheet.ts`, `QuoteAbbySheet.tsx`) dès le statut Envoyé : client, lignes, total, échéances prévues, bouton Copier par bloc ; elle ne dit jamais qu’un paiement est reçu. L’ancien bloc détaillé reste disponible, replié.
- [x] Bouton « Ouvrir le projet » sur un devis lié à un projet.
- [x] Tests : 10 nouveaux (règles de la vérification rapide ; parcours moteur devis neuf → réponses → préparation → envoi figé ; fiche Abby ; brouillon d’e-mail) ; suite complète 1 941 tests et typecheck réussis. Essai réel sur copie jetable (messagerie et explorateur neutralisés) : 9 vérifications, 0 erreur console, PDF de 107 Ko créé ; captures et PDF d’exemple hors dépôt (`C:/DEV/Livrables/Lot4-envoyer-accepter-2026-11-10`).
- [ ] Non vérifié en conditions réelles : le bouton « Ouvrir le projet » (aucun devis accepté rejoué) et un devis pour un particulier (contrôles de rétractation et de médiation, qui restent dans le réglage détaillé).
- [ ] Recettes Electron `ec03-transmission-scenarios.cjs` et `check-native-commercial-ui.cjs` adaptées aux nouveaux libellés (et messagerie neutralisée dans leurs bancs) mais **non validées** : EC03 s’arrête avant toute étape d’envoi, à l’attente de `.cgv-clause`, élément d’un écran de clauses antérieur à la refonte du parcours devis (non causé par le lot 4, non réparé ici) ; la recette native commerciale n’a pas été relancée.
- [x] Préproduction de Carlos mise à jour avec le lot 4 le 10/11 (Manager du commit f5ac2131, données conservées).

Prochaine action : essai de Carlos (six questions, envoi, fiche Abby) ; reprise par un autre modèle selon `docs/REPRISE-CLAUDE.md` — lot 5 puis lots visuels A–F.

## 10/11/2026 — Lot 3 : « Devis rapide » (branche claude/lot3-devis-rapide)

Décisions de Carlos du 10/11 : devis autorisé pour un prospect tout neuf, sans rien exiger ; options suggérées = seulement celles déjà liées à l’offre dans le Catalogue ; module Devis sur le même assistant.

- [x] Un seul assistant (`QuoteWizard.tsx`) pour le module Devis (Pour qui → Offre → Options → Conditions → Aperçu) et pour la fiche prospect (4 étapes, prospect déjà choisi). L’ancien bouton « Créer le brouillon » et la fenêtre « Phase précédente incomplète » avant l’onglet Devis sont retirés ; la qualification devient une liste « Conseillé avant d’envoyer le devis », non bloquante.
- [x] Besoin repris du prospect (besoin confirmé, sinon demande initiale, sinon besoin principal ; contraintes ; échéance), modifiable.
- [x] Offre choisie une seule fois : tuiles par famille avec icône (libellés d’une même famille fusionnés à l’affichage), cartes nom + prix en clair, recherche ; plus de « Sans code · v1 ».
- [x] Options : compléments recommandés actifs et composants facultatifs de l’offre, à cocher. **Constat : aucune option n’est liée aux offres dans la préproduction (0 recommandation, 0 composant facultatif)** ; l’étape l’indique et laisse ajouter une ligne. Liste d’options par offre à proposer à Carlos avant toute écriture.
- [x] Acompte selon l’offre : `src/shared/approvedPaymentPlans.ts`, source unique de la règle OFF-007 (vitrines 40 / 60, e-commerce 30 / 40 / 30), résolue par le code source de l’offre ; appliquée aux trois formules vitrine et aux trois formules WooCommerce ; la fixture de simulation réutilise cette source. Autre acompte toujours possible. Formule retenue par Carlos le 10/11 : celle du référentiel, « 60 % avant mise en ligne ».
- [x] CGV ajoutées automatiquement à un devis neuf créé par l’assistant (`createWithLines(…, {applyContractTerms})`, même service que « comparer / appliquer », trace distincte au journal). Mises à jour ultérieures toujours explicites ; devis figés inchangés.
- [x] Prospect « nouveau » passé à « Devis à préparer » par l’assistant seulement (`advanceNewProspect`). **Remplace E72 pour ce chemin (confirmé par Carlos le 10/11)** ; l’API `create` seule garde le comportement E72. `prepareProspectDraft` (ancien chemin, gardes de qualification) reste en place mais n’est plus appelé par l’écran.
- [x] Tests : 18 nouveaux (règle OFF-007, moteur devis rapide, modèle d’affichage) ; suite complète et typecheck réussis. Essai réel sur copie jetable de la préproduction : 15 vérifications, 0 erreur console, 13 captures hors dépôt (`C:/DEV/Livrables/Lot3-devis-rapide-2026-11-10`).
- [x] Options suggérées (liste validée par Carlos le 10/11) : `SuggestedOptionsPublication.ts` + `scripts/preproduction/publish-suggested-options.cjs`. Publie « Page supplémentaire » (AW-WEB-PAGE-SUP, 79 €) et la version V3.9.4 de « Rédaction page web » (250 à 450 mots, un cycle de corrections) avec leurs clauses (1 clause publiée : WEB-PAGE-SUP-PERIMETRE) ; nouvelle version publiée des 8 offres portant leurs options ; ancienne fiche sans code « Création d’une page » (99 €) désactivée, réversible. Vitrine : page supplémentaire, rédaction, article SEO, maintenance WP mensuelle/annuelle (Business sans rédaction, Visibilité sans rédaction ni article : déjà compris). WooCommerce : produit simple, produit variable, livraison avancée, paiement avancé, import, maintenance WooCommerce. Maintenance WP : audit de reprise. Non proposées : intégration texte/images, recherche d’images, page e-commerce supplémentaire. Appliqué à la préproduction le 10/11 (sauvegarde dans `Sauvegardes-lots`), essai réel rejoué : options affichées, 0 erreur.
- [x] Décisions de Carlos du 10/11 (suite) : dans Vitrine Business et Vitrine Visibilité, « Rédaction page web » et « Article SEO » restent vendables **en supplément** ; l’option affiche le rappel de ce que la formule comprend déjà (3 pages rédigées ; 1 article SEO pour Visibilité). Appliqué à la préproduction (nouvelle version de ces 2 offres seulement). Les formules WooCommerce Business/Visibilité ne proposent pas ces deux options (non demandé).
- [x] Plus de rattachement manuel : une nouvelle version d’une offre recopie déjà ses options (comportement existant du Catalogue) ; l’assistant propose désormais la version publiée **actuelle** de chaque option (`resolveSuggestions`), le lien enregistré restant inchangé ; l’outil compare par prestation. Limite : le panneau « compléments recommandés » d’un devis déjà créé (04D) garde sa lecture par version.
- [x] Recettes Electron rejouées : `check-unsaved-inputs-ui.cjs --lot-create` (15 vérifications, 3 thèmes) et `check-prospection-flow-native.cjs` (29 vérifications, 0 erreur console). Deux pannes antérieures au lot 3 réparées dans les bancs : import Vite « ?url » du moteur PDF non géré, et nombre de migrations figé à 74 remplacé par le registre déclaré.
- [x] Préproduction de Carlos mise à jour le 10/11 (Manager du commit 832dc49e, données conservées, ancien Manager gardé dans `Runtime-precedents`).

- [x] Accord de Carlos du 10/11 : les 5 branches empilées sont poussées et ouvertes en PR brouillon, chacune sur la précédente — #169 mode opératoire, #170 atelier, #171 lot 2, #172 lot 1, #173 lot 3 (base de la pile : #168). Aucune fusion.

Prochaine action : essai de Carlos sur la préproduction, puis lot 4 (envoyer et faire accepter).

## 09/11/2026 — Lot 1 : « Mon entreprise » simplifié (branche claude/lot1-mon-entreprise)

- [x] Écran Réglages › Mon entreprise et devis : les 4 informations exigées pour finaliser un devis (nom/statut, adresse/SIRET/coordonnées, TVA, réclamations) regroupées, avec exemples ; choix « Micro-entreprise : franchise en base de TVA » qui pose la mention « TVA non applicable, article 293 B du CGI » ; état « à vérifier / non applicable » replié en cas particulier.
- [x] Liste de vérification du devis : libellés français (« Mon entreprise : … à renseigner ») au lieu de identity/vat/complaints, avec l’endroit où corriger.
- [x] `scripts/preproduction/set-company-info.cjs` : renseigne une préproduction depuis un JSON tenu hors du dépôt (refus si le fichier est dans le dépôt), sauvegarde avant écriture.
- [x] Informations de Carlos (micro-entreprise, franchise TVA) renseignées dans la préproduction uniquement ; **aucune donnée personnelle dans le dépôt**. Adresse administrative imprimée sur les devis : à confirmer par Carlos (domiciliation possible).

## 09/11/2026 — Lot 2 : CGV disponibles pour les offres de départ (branche claude/lot2-cgv-disponibles)

Décisions de Carlos du 09/11 : couleurs Accueil bleu nuit/jaune ; qualification avant devis **conseillée** (non bloquante, lot à venir) ; premières offres : vitrine, WooCommerce, maintenance WordPress ; Abby option 1 (devis+CGV envoyés depuis le Manager, factures dans Abby). Audits « visuel » et « premier jour » livrés hors dépôt (C:/DEV/Livrables).

- [x] `StarterOffersPublication.ts` : publication par les services existants de 8 offres V3.9.4 (AW-WEB-VITRINE, V39-WEB-BUSINESS/VISIBILITE, AW-ECOM-BASE, V39-ECOM-BUSINESS/VISIBILITE, AW-MAINT-WP-M/A), du socle CGV et des clauses de prestation liées ; plan en lecture seule + empreinte, rejeu neutre.
- [x] Rattachements : cartographie proposée 409 pour les codes AW ; formules V39 = clauses de la formule de base + clauses des services que la grille dit inclus (texte « Inclus » ; includedCodes Woo). **Proposition à valider par Carlos.**
- [x] Non publiées : clause 119 (références commerciales, consentement distinct) et clause 033 (médiation, texte « À COMPLÉTER »). Aucune autre offre publiée.
- [x] Devis sans clause : message neutre indiquant quoi faire (comparer puis appliquer ; sinon publier/rattacher). Une première version affirmait à tort « CGV non publiées » : corrigée après vérification réelle.
- [x] `scripts/preproduction/publish-starter-offers.cjs` : aperçu / application avec empreinte, sauvegarde SQLite avant écriture, refus si Manager ouvert. 3 tests ciblés ; suite complète 1 909 tests.
- [ ] Lot 1 (Mon entreprise) toujours requis pour finaliser un devis ; consommateurs sans clause de médiation tant que la convention n’existe pas.

## 09/11/2026 — Préproduction V3.9.4 isolée construite par Claude

- [x] Choix de Carlos : une 2e préproduction à côté de celle du 04/11 (laissée intacte), avec un Manager construit depuis `claude/atelier-manager`, à faire évoluer ensemble.
- [x] `scripts/preproduction/assemble-preproduction.cjs` + `launch.cjs` : Workspace copié depuis la préproduction source (sans sa base), copie prête V3.9.4, Manager compilé (.vite) et moteur Electron copiés ; profil et workspace propres au dossier, choix d’un autre workspace bloqué, refus si dossier déplacé ou base absente.
- [x] Chemins absolus des 3 projets DEMO (`projects.resource_root_path`) relocalisés vers le nouveau dossier avec le planificateur EC04 existant ; aucun chemin ne pointe vers l’ancienne préproduction.
- [x] Dossier `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-V394-Claude-20261109` (commit 2216e077), raccourci Bureau. Ouverture automatisée : 5 écrans, 0 erreur console, 153 fiches (44 publiées, 130 brouillons). Préproduction du 04/11 : empreinte inchangée.
- [ ] Observation pour l’audit : la vue organisée du Catalogue annonce 23 familles (regroupement d’affichage distinct des 18 catégories).

## 09/11/2026 — Outil de copie propre pour l’activation V3.9.4 (branche claude/atelier-manager)

- [x] `ApprovedPackActivationCopy.ts` + `scripts/prepare-v394-activation-copy.cjs` : depuis la sauvegarde de l’étape A, copie TEMP neuve → migration 81 → import du pack → noms/familles → contrôles → fichier final dans un dossier nouveau. Refus si la sauvegarde est altérée ou si la base en service a changé depuis ; aucun fichier partiel. Aucune donnée de test écrite.
- [x] Contrôle de conservation générique : toutes les lignes de toutes les tables comparées avant/après ; seules les fiches du pack peuvent changer (nom, famille, code) ; ajouts limités aux tables prévues par l’import (liste justifiée par le rapport d’intégration du 08/11). Démarrage réel de DatabaseService sur une copie séparée.
- [x] 4 tests ciblés (copie conforme, base modifiée, sauvegarde altérée/sortie existante/sortie à côté de la base, détection des écarts).
- [x] Répétition sur la préproduction (lecture seule, empreinte inchangée `38f496cb…`) : copie PRÊTE, 130 tarifs et 119 clauses en brouillon, 21 fiches existantes modifiées (pack uniquement), 0 fiche TEST, moteur démarré. Fichiers hors dépôt : `C:/DEV/Livrables/Activation-V394-repetition-2026-11-09`.
- [ ] Mise en service (remplacement de la base) et publication : non faites, accord explicite requis.

## 09/11/2026 — Reprise par Claude : revue PR #166 et décisions utilisateur sur le pack V3.9.4

Revue en lecture seule de la PR #166 (HEAD `fb1ffa6`) : typecheck et 1 888 tests réussis ; 130 tarifs, 119 clauses, 47 délégués, 18 V39-, 6 à vérifier, clause 019 sans PAY-005 et règles Woo/maintenance/Lune conformes. Grille et bibliothèque « Approuvé métier – non publié » produites hors dépôt depuis l'import réel du Manager ; comparaison automatique aux trois Word du pack sans écart de données.

Décisions de Carlos du 09/11/2026 :
- [x] Pack (dont les trois Word) laissé tel quel sur la branche publique de la PR #166, malgré la consigne générale de ne pas committer le pack : décision explicite de ne pas réécrire l'historique.
- [x] Nom des 13 fiches historiques réutilisées : remplacé par le nom V3.9.4 **au moment de l'activation** seulement ; devis et snapshots inchangés.
- [x] Familles : un libellé unique par code de famille (`src/shared/approvedFamilies.ts`), via le registre `catalog_categories` existant ; nouvelles fiches à l'import, fiches historiques à l'activation.
- [x] Lecture des prix : un libellé qui ne commence pas par un montant reste « sur devis » (seul cas : AW-BRAND-IDENTITE, « À vérifier — ancienne offre 499 € »). AW-PHOTO-DETOUR était déjà correct (9 € l'unité « photo », minimum de ligne 45 €).
- [x] Annexes A, B, C et annexe interne de la bibliothèque : non intégrées au Manager.

Réalisation sur la branche `claude/v394-decisions-20261109` (PR brouillon vers la PR #166) :
- [x] `ApprovedPackActivationPlan.ts` : prévisualisation en lecture seule et application sur base TEMP isolée uniquement (garde partagée avec la migration 81), une transaction, valeurs attendues contrôlées, traces dans `catalog_category_audit` et `activity_log`. Aucun branchement au démarrage ni à l'IPC.
- [x] Tests ciblés : 13 renommages, 18 catégories, versions/devis/clauses/codes inchangés, rejeu sans effet, plan périmé et modification manuelle refusés sans écriture partielle, refus hors TEMP.
- [ ] Le mécanisme d'activation réel reste à concevoir et à autoriser ; ce plan en sera une étape. Les copies TEMP déjà importées avec l'ancienne lecture du prix d'AW-BRAND-IDENTITE devront être réimportées.

- [x] Mode opératoire utilisateur rédigé : [docs/MODE-OPERATOIRE-MANAGER.md](docs/MODE-OPERATOIRE-MANAGER.md) (parcours Prospect → Devis → Abby → acceptation → Projet/maintenance, activation manuelle V3.9.4 avec retour arrière, fonctions non développées). Constat : le script de répétition 81 écrit des fiches TEST dans sa copie ; une commande de copie propre (81 + import + renommage/familles, sans essai) reste à développer avant toute activation.

Prochaine action : revue utilisateur des PR #168 et du mode opératoire, puis étape 4 (audit ergonomique). Aucune fusion, activation, migration réelle ni publication.

## 08/11/2026 — PR #166 : corrections ciblées après revue indépendante

- [x] Cause NaN corrigée dans la fixture (`contractValueCents`), désormais incluse au typecheck ; présentation normale Manager contrôlée sur les 14 recettes TEMP.
- [x] Échéanciers OFF-007/SQ-24 et règles récurrentes explicités sans date fictive ; documents de travail affichant tous les jalons sauvegardés. Historiques figés et prix source préservés.
- [x] Deux CSV régénérés avec encodage UTF-8 explicite ; 130/18/47 et identifiants conservés.
- [x] Typecheck et 77 tests ciblés réussis ; 14 PDF + 14 DOCX régénérés, 14 rendus Word, contrôles sémantiques des montants/échéances/encodages et empreintes source. Les anciennes simulations sont remplacées : les contrôles précédents avaient omis NaN.
- [x] [Bilan du correctif](docs/integration-v394-v15-20261108/CORRECTIF-PR166-2026-11-08.md). Bibliothèque 119 clauses brouillon et cartographie inactive conservées ; aucune migration réelle ni publication commerciale.
- [ ] Revue utilisateur du correctif sur la PR #166 existante ; aucune fusion/activation autorisée.


## 08/11/2026 — Intégration officielle V3.9.4 / V1.5 autorisée, en cours

Autorisation métier expresse du pack (rectificatif 019), intégration sur branche dédiée et préparation de PR ; aucune nouvelle validation globale ou consultation juridique préalable. Pas de certification de conformité, de RC Pro présumée, de fusion main, de déploiement ni de mutation de la préproduction.

- [x] 50 fichiers locaux du lot 2 préservés dans un ZIP/patch/inventaire avec empreintes avant opération Git ; commit préalable `c7ee0a3c51b77d6bb92769f3614cecef4528daa7` sur la seule nouvelle branche `codex/integration-v394-v15-20261108`. Ancienne branche Offres & Tarifs conservée à `57ad50fd`.
- [x] Pack : 22 empreintes contrôlées ; extraits des trois Word effectivement comparés (923/959/379 paragraphes), 130 références, 119 clauses, 47 statuts délégués, 6 à vérifier, 18 V39 ; clause 019 sans PAY-005 dans le corps client. Préaudit distinct non présent dans les ZIP : emplacement demandé, rapports de préparation lus.
- [x] Adaptateurs sur CatalogImportService/ContractEditorialDraftService existants, transaction globale et idempotence ; sources Word/JSON finales conservées avec empreintes. Codes provisoires conservés comme références de provenance, sans canonicalisation/alias AW inventés.
- [x] Premier essai sur copie TEMP du backup confirmé : 21 IDs repris, 109 créations, 119 clauses brouillon ; aucune publication/archive. Source habituelle non ouverte/modifiée pour ce nouveau chantier. Contrôle complet : les 44 versions historiques sont publiées, les 21 reprises ajoutent un brouillon ; aucun brouillon opérationnel multiple. L’hypothèse initiale de 21 paires de brouillons a été corrigée avant livraison, sans aucun reclassement.
- [x] Préaudit séparé reçu/lu et exécuté en lecture seule sur la préproduction confirmée : empreintes DB/WAL inchangées. Rapport, CSV 130/18 et cartographie historique 409 proposée (non appliquée) préparés dans docs/integration-v394-v15-20261108.
- [x] 172 tests distincts ciblés, typecheck et paquet Windows x64 ; 13 contrôles Electron dans les trois thèmes ; 14 PDF + 14 DOCX de simulation, 154 pages finales, aucune page blanche/caractère hors page/PAY-005 client. Adaptation locale de l’export Word A4/fin vide ; sources Word métier inchangées. Aucune certification légale.
- [x] Migration 81 après import sur seconde copie TEMP : sauvegarde/restauration, conservation, FK/intégrité et parcours minimaux/duplication concluants ; zéro brouillon multiple. Aucune migration habituelle.
- [x] Décision explicite du 08/11/2026 : Carlos autorise le push et la PR sur ce dépôt PUBLIC, après information sur les trois Word, 130 tarifs et 119 clauses. Fusion main, publication commerciale et activation habituelle restent non autorisées. Commit technique abbe41f4f2af3170bcb48331b98f59aad68391a6 ; [PR #166](https://github.com/atoumweb-prog/atoumweb-manager/pull/166) ouverte en brouillon vers codex/ux-v2-offres-tarifs-20261106, push normal confirmé ; aucun conflit signalé, aucun contrôle CI distant lancé sur cette base. Aucun merge ni déploiement.


## 08/11/2026 — Lot 2 validé sur TEMP ; préparation migration sur copie PRÉPRODUCTION

- [x] Source confirmée par Carlos : PRÉPRODUCTION UX V2 du 04/11, Workspace-TEST/Profil-TEST ; autres environnements distingués, aucune base Validation-MSI ouverte. Données client fictives ; Catalogue/tarifs/CGV/référentiels/paramètres à préserver, aucune suppression automatique.
- [x] Backup SQLite cohérent et restauration isolée vérifiés, source et WAL aux empreintes inchangées. Registre 1–80 compatible, aucun brouillon multiple. Migration 81 sur copie TEMP uniquement : 142 tables historiques et 487 objets inventoriés, lignes/IDs/FK/objets préservés selon adaptations prévues ; intégrité ok, FK vide. Création/sauvegarde/reprise/duplication avec composition et rejeu réussis.
- [x] Précontrôle et outillage de préparation ajoutés ; 4 tests ciblés et typecheck réussis, essais backup/restauration sans WAL et avec WAL non vide sur fixtures. Protection TEMP inchangée, aucune activation automatique/IPC réel.
- [x] [Rapport et proposition d’activation](docs/ux-v2/offres-tarifs-v2/PREPARATION-ACTIVATION81-PREPRODUCTION-2026-11-08.md). Réserve : 44 articles/44 versions mais bibliothèque contractuelle vide dans la préproduction choisie ; confirmer la référence CGV avant mise en service.
- [ ] Autorisation distincte après retour utilisateur : contenu de référence CGV, runtime lot 2 et activation contrôlée sur chemin exact. Aucune migration source/commit/push/PR/fusion ni lot 3 autorisé.


## 08/11/2026 — Lot 2 : revue acceptée sur TEMP, compatibilité historique ciblée

- [x] Carlos valide la conception graphique et accepte les réalisations fonctionnelles dans le périmètre TEMP ; aucune nouvelle correction graphique. Clôture Git et mise en service non autorisées.
- [x] 19/19 contrôles Electron ciblés sur initialisation/redémarrage normaux sans migration 81 : lecture/tableau, création/version/sauvegarde historiques, conflits snapshot, compositions, conservation de deux brouillons historiques, FK vide et intégrité ok. Aucun correctif applicatif, aucune capture ; résultats précédents conservés.
- [x] [Compatibilité et procédure future](docs/ux-v2/offres-tarifs-v2/COMPATIBILITE-ACTIVATION-LOT2-2026-11-08.md) : indisponibilités sans 81, blocage des brouillons multiples, sauvegarde SQLite/WAL/restauration, retour arrière et mécanisme d’activation réel encore à concevoir/autoriser.
- [x] Registre OT-01 à OT-39 actualisé sans clôturer les lots suivants.
- [ ] Autorisation distincte avant clôture Git ou préparation/activation réelle. Aucun accès à une base utilisateur/Validation-MSI ni migration réelle.

Prochaine action : décision utilisateur sur les suites ; aucun lot 3 engagé.


## 08/11/2026 — Lot 2 : recette reprise et bilan consolidé pour revue finale

Validation utilisateur reçue : incrément 2 accepté pour développement/recette TEMP, présentation des trois captures duplication/conflit/sortie satisfaisante. La validation globale du lot 2 n'est pas donnée ; aucune clôture définitive ni publication Git autorisée.

- [x] État initial vérifié avant modification : même branche `codex/ux-v2-offres-tarifs-20261106`, HEAD/suivi à `57ad50fd41c2de038015b346edae0751c7f8b785`, 39 fichiers locaux modifiés/non suivis préservés par inventaire et empreintes. Aucun reset/clean/stash/changement de branche. Aucun fichier applicatif préexistant `src/` modifié pendant cette reprise.
- [x] Vérification interrompue récupérée : 74/74 tests ciblés sur huit fichiers, puis 18/18 contrôles Electron de persistance terminés. Résultats 24/24 de finalisation réutilisés ; pas de relance générale ni nouvelle capture.
- [x] Complément ciblé sans capture : 25/25 contrôles Electron TEMP. Second changement distant après comparaison de conflit : refus sous révision périmée, saisie conservée et nouveaux choix nécessaires. Huit onglets parcourus ; sauvegardes effectives séparées contrat/version et recommandations/identité, sans perte lors du remontage des composants. Devis/projets historiques de la fixture inchangés ; FK vide, intégrité ok, zéro erreur renderer.
- [x] [Bilan consolidé du lot 2](docs/ux-v2/offres-tarifs-v2/BILAN-CONSOLIDE-LOT2-2026-11-07.md) rédigé : fonctionnalités, limites, résultats, erreurs injectées attendues, inventaire Git, références des preuves TEMP. [Analyse préalable des brouillons multiples](docs/ux-v2/offres-tarifs-v2/ANALYSE-INCOMPATIBILITE-BROUILLONS-MULTIPLES-2026-11-07.md) sans proposition de reclassement ni exécution sur données historiques.
- [x] Duplication indépendante/version choisie, références explicites non vides, idempotence et rollback vérifiés dans la campagne récupérée. Résolution par champs, trois choix de sortie, conservation après échec et suggestions sans fusion livrés. Références opérationnelles non clonées ; reconfiguration par leurs services existants requise.
- [x] Registre des 39 décisions conservé et actualisé : périmètres du lot 2 livrés/vérifiés sur TEMP, validation globale encore attendue ; lots ultérieurs inchangés. Migration 81 toujours expérimentale, exclue du démarrage automatique et bloquante si plusieurs brouillons historiques.
- [x] Dossier/ZIP de revue préparés dans `outputs/Offres-Tarifs-Lot2-Revue-Consolidee-2026-11-07`, cinq captures existantes réutilisées, index HTML et preuves JSON. Aucune base, profil, secret, cache ni nouvelle galerie dans l'archive.
- [ ] Revue finale avec Carlos/ChatGPT puis décision de clôture. Aucune migration utilisateur/Validation-MSI, aucun commit/push/PR/fusion, aucune action sur un autre worktree et aucun développement du lot 3.

Prochaine action : examiner le dossier consolidé. Les entrées précédentes restent l'historique des incréments, pas l'état final de leur recette.

## 07/11/2026 — Lot 2 incrément 2 : brouillons persistants réalisés sur TEMP

Autorisation utilisateur : incrément 1 validé graphiquement dans son principe ; direction technique de persistance validée, développement de l'incrément 2 et migration autorisés uniquement sur bases TEMP isolées. Aucun accès à une base utilisateur ou Validation-MSI pour cette réalisation.

- [x] [Compatibilité documentée avant contrainte](docs/ux-v2/offres-tarifs-v2/COMPATIBILITE-BROUILLON-UNIQUE.md) : l'ancien schéma permet plusieurs brouillons ; la migration refuse ces cas sans reclasser de versions. Index unique du brouillon opérationnel non abandonné sur les bases compatibles.
- [x] Création nom/type seuls, sauvegarde manuelle dans la même version, mode/prix/catégorie/acompte non inventés ; date de dernière sauvegarde et révision ; reçus durables d'idempotence avec intention contrôlée et transaction article/version/activité/reçu. Aucun déclenchement de publication.
- [x] Mes brouillons : recherche, résultat vide, reprise exacte après fermeture/réouverture de la base et du renderer, abandon/restauration réversibles. Les abandonnés restent en historique et sont exclus des compteurs opérationnels OT-04. Restauration refusée si un autre brouillon est opérationnel.
- [x] Conflits de révision, conservation de saisie, comparaison distante/locale et nouvel essai manuel ; réponse IPC perdue rejouée sans doublon. Huit onglets et sauvegardes locales conservés ; gardes des versions abandonnées dans les sous-domaines. Publication et Devis incomplets refusés, snapshots existants inchangés.
- [x] Migration expérimentale TEMP 81 créée et testée, hors liste automatique : reconnaissance seulement dans le registre pour réouverture. Chemins mémoire/TEMP contrôlés, reconstruction transactionnelle, triggers dépendants/index/FK conservés, rollback et réglage FK restaurés si panne.
- [x] Typecheck, diff-check, 44 tests ciblés sur cinq fichiers dont 14 tests nouveaux ; 18 contrôles Electron TEMP, zéro erreur renderer. Deux erreurs IPC volontaires (réponse perdue et conflit), saisies conservées. Captures réelles Noir/Confort 1920×1080 zoom 100 dans outputs/Offres-Tarifs-Lot2-Increment2-2026-11-07. Confirmations interceptées, pas de recette humaine exhaustive des dialogues.
- [x] [Rapport de livraison et migration TEMP](docs/ux-v2/offres-tarifs-v2/RAPPORT-LOT2-INCREMENT2-2026-11-07.md) : 44 versions historiques, lignes de 140 tables protégées et 567 objets existants préservés sur la fixture ; FK vides et intégrité ok. Comptages propres à cette recette TEMP, jamais oracle Validation-MSI. Profil et base temporaires nettoyés.
- [ ] Revue utilisateur de cet incrément et éventuelle autorisation ultérieure hors TEMP. Duplication, suggestions de brouillons similaires et extensions métier des autres onglets non commencées. Le dialogue global de sortie reste le garde existant ; aucun remplacement général par un dialogue à trois boutons.

Branche/worktree conservés ; HEAD et suivi distant restent au lot 1 `57ad50fd41c2de038015b346edae0751c7f8b785`. Incréments 1 et 2 locaux non committés. Aucun commit, push, PR ou fusion ; aucun autre worktree modifié. Prochaine action : examiner les deux captures et le rapport TEMP avant toute poursuite.

## 07/11/2026 — Lot 1 sécurisé, lot 2 incrément 1 prêt pour première revue

- [x] Lot 1 enregistré une seule fois : `57ad50fd41c2de038015b346edae0751c7f8b785`, push normal confirmé sur `origin/codex/ux-v2-offres-tarifs-20261106` avec SHA distant identique. Vingt fichiers de source/tests/suivi, aucune base/profil/capture de recette. Worktree propre immédiatement après publication. Aucun force-push, PR ou fusion.
- [x] Autorisation du premier incrément du lot 2 dans ce même worktree : habillage Noir/Confort de la fiche, en-tête et synthèse Identité, huit onglets maintenus, sélecteur principal de consultation des versions. Prix et contenus consultés viennent de la version choisie ; les contextes locaux des Associations/Contrat/Production et leurs services restent distincts.
- [x] Création guidée en cinq sections des champs déjà existants, sans nouvelles fonctions métier dans les autres onglets. État de saisie commun, barre manuelle et gardes conservées. Code/visibilité restent accessibles dans les repères facultatifs. Enregistrement opérationnel via la commande existante après choix explicite du mode tarifaire ; nom/type seuls non enregistrables et annoncés comme tels, aucune simulation OT-31.
- [x] Typecheck ; 25 contrôles Electron ciblés sur TEMP : huit onglets, référence publiée initiale, changement effectif de contenu/prix entre versions, refus/acceptation de sortie, conservation code/création, contexte local composition, aucune écriture métier pendant consultation puis création explicite réelle d'un brouillon TEMP. Trois confirmations interceptées (pas une validation humaine du dialogue Windows), zéro erreur renderer. Présence des huit onglets contrôlée sous trois thèmes, absence de débordement horizontal global à 1280 px.
- [x] Trois captures Electron Noir/Confort 1920×1080 zoom 100 dans `outputs/Offres-Tarifs-Lot2-Increment1-2026-11-07`, données TEST isolées uniquement, profil et base TEMP nettoyés. Les tests métier précédents restent réutilisés ; pas de campagne générale.
- [x] [Spécification ciblée de persistance](docs/ux-v2/offres-tarifs-v2/SPEC-PERSISTANCE-BROUILLONS-LOT2-2026-11-07.md) rédigée, avec schéma/index/triggers/FK, dates réelles, idempotence, abandon réversible et protection publication/Devis. Aucun fichier de migration créé ni nouvelle migration exécutée.
- [ ] Revue graphique de ce premier incrément et approbation séparée de la spécification. Nom/type seuls, reprise persistante incomplète, Mes brouillons, duplication et résolution manuelle enrichie des conflits restent à réaliser. Les extensions métier des autres onglets ne sont pas commencées.

Les modifications du lot 2 sont locales et non committées ; aucune autorisation de commit/push du lot 2. Autres worktrees préservés, aucun prix ni clause utilisateur modifié. Prochaine action : examiner les trois captures et la spécification avant de poursuivre.

## 07/11/2026 — Sécurisation autorisée du lot 1

Validation graphique définitive reçue, y compris les deux finitions. Autorisation de commit et push normal du seul lot 1 sur `codex/ux-v2-offres-tarifs-20261106`. Fichiers source, tests déterministes et suivi documentaire uniquement ; sorties de recette, bases et profils exclus. Premier incrément visuel du lot 2 autorisé après sécurisation, sans migration ni publication Git du lot 2. Le résultat exact du push sera communiqué après exécution.

## 07/11/2026 - Lot 1 Offres & Tarifs V2 valide et finitions de cloture terminees

Validation explicite Carlos : direction graphique et ergonomique Noir/Confort du lot 1 acceptee apres comparaison aux maquettes 01/02. Les trois espaces, six indicateurs, cartes, quatre familles visibles/dix depliables, navigation filtree, recherche/filtres/vues et tableau/colonnes/pagination sont valides. Cette decision remplace la suspension des entrees historiques ci-dessous ; elle ne valide pas les 39 decisions dans leur ensemble.

- [x] Libelle Voir les prestations sur toutes les familles ; meme navigation au tableau filtre, sans changement des groupes/resultats.
- [x] Scrollbar du seul tableau Catalogue Noir/Confort : piste sombre, curseur contraste et survol, largeur 14 px ; aucune modification du fonctionnement des lignes, colonnes, preferences ou pagination. Autres themes/modules exclus par selecteurs locaux.
- [x] Typecheck et diff-check ; Electron reel Noir/Confort 1920x1080 zoom 100, deux captures dans outputs/Offres-Tarifs-Lot1-Cloture-2026-11-07. Navigation famille, libelle, styles de scrollbar et isolation blanc, defilement/pagination controles, zero erreur renderer. Tests fonctionnels deja reussis reutilises sans campagne generale. Base et WAL inchanges par comparaison des empreintes.
- [x] Lot 1 clos ergonomiquement ; details des fonctionnalites, controles, limites et OT partiels dans [le registre](docs/ux-v2/offres-tarifs-v2/SUIVI-OT01-OT39.md). OT-02/04 livres ; OT-06/20/29/30 partiels, autres extensions reportees selon leurs lots. Pas de certification exhaustive des parcours metier ou dialogues Windows.
- [x] [Cadrage technique du lot 2](docs/ux-v2/offres-tarifs-v2/CADRAGE-LOT2-2026-11-07.md) prepare : huit onglets, creation minimale, reprise manuelle, versions, duplication et conflits ; schema du tarif indetermine et autres migrations candidates a specifier avant execution.
- [ ] Developpement du lot 2 : non commence, autorisation attendue. Prochaine action : examiner le cadrage.

Aucun tarif, clause, donnee utilisateur ou migration modifie. Branche/worktree Offres & Tarifs preserves, aucun autre worktree modifie ; aucun commit, push, PR ou fusion.

## 07/11/2026 - Reprise de conformite graphique, lot 1 non valide graphiquement

Demande utilisateur lue depuis la piece jointe du 07/11 ; comparaison visuelle effective des maquettes principales 01 et 02 avec les captures Electron precedentes.

- [x] Composition graphique unifiee locale au Catalogue : surfaces bleu nuit nuancees, cartes avec icones, six indicateurs avec hierarchie lisible, bordures et accents jaunes, actions et pagination harmonisees. Le fichier CSS local est recompose en un ensemble coherent.
- [x] Quatre premieres familles dans l'ordre deja existant ; les dix suivantes depliables dans la meme section, sans nouveau classement commercial. Toutes les 14 familles et leurs liens filtres sont conserves. Offres reelles distinctes avec prix et ouverture de fiche.
- [x] Filtres avances accessibles dans les deux vues, ouverts automatiquement si un critere avance est actif. Aucun changement des calculs, tris, preferences, colonnes, vues, protections, tarifs ou schemas.
- [x] Typecheck et diff-check reussis. Recette Electron Windows ciblee en lecture seule : 14 familles, acces depuis une famille deployee vers son filtre, filtres actifs visibles, pagination avec preferences ouvertes et defilement des lignes, absence de debordement horizontal a 1280 px, zero erreur renderer. A 1920x1080 : debordement vertical externe nul et pagination a 1047 px. Suites metier deja reussies reutilisees sans relance.
- [x] Trois captures Noir/Confort 1920x1080 zoom 100 dans outputs/Offres-Tarifs-Lot1-Conformite-2026-11-07 ; anciens dossiers conserves.
- [ ] Validation graphique utilisateur suspendue, non acquise. Prochaine action : revue des trois captures. Lot 2 non commence. Aucun commit, push, PR ou fusion.

Ecarts volontaires : pas de groupes fictifs offres principales/autres/services ni donnees de demonstration ; six compteurs OT-04 au lieu des trois/quatre dessines ; 14 familles avec deploiement au lieu des seules familles illustrees ; toutes les colonnes et commandes du tableau configurable conservees ; pas de panneau de raccourcis/historique fictif ni logo redessine. Les reperes tarifaires qualifies restent depliables pour eviter de confondre ponctuel et abonnement.

## 07/11/2026 - Ajustements finaux de revue du lot 1 (validation visuelle en attente)

- [x] Les 14 familles et leur ordre existant sont conserves : cartes compactes, reperes tarifaires depliables et acces direct aux offres presentes.
- [x] Reperes monetaires qualifies par type, periode et unite, avec distinction des forfaits ponctuels et abonnements Maintenance. Aucun tarif ni categorie stockee modifie.
- [x] Tableau desktop : compteurs et filtres compacts, defilement des lignes et pagination visible, y compris avec les preferences ouvertes. A 1920 x 1080 : aucun debordement vertical du contenu, bas de pagination a 1049 px.
- [x] Verification limitee : typecheck, 9 tests du modele, recette Electron en lecture seule sans erreur renderer. Campagnes precedentes conservees sans relance globale. Trois nouvelles captures Noir/Confort, zoom 100 %, dans outputs/Offres-Tarifs-Lot1-Ajustements-2026-11-07.
- [ ] Validation ergonomique finale utilisateur. Prochaine action : examiner ces trois captures ; lot 2 non commence. Aucun commit, push, PR ou fusion.

## 07/11/2026 — Offres & Tarifs V2, lot 1 réalisé pour revue

**Autorisation utilisateur du 06/11 :** développement du seul lot 1 et création d’un worktree/branche dédiés depuis Clients V2 `2fda54610aa6b204a69c6ba3b4a626e7f8dd61a5`. Branche `codex/ux-v2-offres-tarifs-20261106`, worktree `C:/Users/AtoumWeb/.codex/worktrees/offres-tarifs-v2-20261106/atoumweb-manager-ec04-validation`. Aucun commit/push/PR/fusion autorisé ou réalisé. Les autres worktrees sont préservés.

- [x] Dossier des 18 maquettes et arbitrages OT-01 à OT-39 lu ; inventaire/captures précédents réutilisés. [Arbitrages intégraux](docs/ux-v2/offres-tarifs-v2/ARBITRAGES-VALIDES-OT01-OT39.md) et [registre des 39 décisions et futurs lots](docs/ux-v2/offres-tarifs-v2/SUIVI-OT01-OT39.md) conservés séparément de leurs statuts applicatifs.
- [x] Une destination Commercial → Offres & Tarifs, trois espaces internes ; Catalogue actionnable, Pilotage honnêtement à venir, Administration donnant accès aux catégories existantes sans faux outils futurs. Actifs officiels et Noir/Confort réutilisés.
- [x] Familles calculées depuis les sources existantes, ouverture du tableau filtré et retour organisé ; aucune modification d’identité/catégorie/tarif. Prix par mode/période/unité, offres distinguées des services pour les repères monétaires.
- [x] Six compteurs généraux et filtrés indépendants de la pagination, états article/version/visibilité distincts. Lecture des états de toutes les versions, sans migration ni réécriture de versions.
- [x] Tableau existant conservé : recherche/filtres, tri avant pagination 25/50/100, colonnes/ordre/largeurs, vues personnelles avec filtres. Extension de préférences limitée au domaine Catalogue, rétrocompatible et sans copie de donnée métier.
- [x] Typecheck ; 84 tests ciblés sur 8 fichiers lors de la campagne, puis recontrôles limités aux ajustements concernés ; recette Electron ciblée 32 contrôles réussis sur TEMP, zéro erreur renderer et lignes métier inchangées après préparation. Refus de lecture IPC volontaire puis reprise, erreur TEST attendue. Gardes Rester/Quitter interceptées, pas annoncées comme dialogues Windows validés humainement.
- [x] Fonctionnement des trois thèmes et adaptation 1280 px contrôlés ; revue réelle Noir/Confort 1920×1080 zoom 100 dans le dossier `outputs/Offres-Tarifs-Lot1-Revue-2026-11-07`. Sources TEST en lecture seule, sans initialisation/migration ; aucune donnée utilisateur, prix, clause ou version réelle modifié.
- [ ] Validation visuelle Carlos du lot 1. Une validation de maquette et des tests ne clôturent pas cette case.

Décisions d’architecture : projection des états de versions, pas d’agrégat persistant ; contexte des filtres enregistré uniquement dans les préférences Catalogue ; pagination dans le tableau partagé après tri global. [Détails et réserves](docs/ux-v2/offres-tarifs-v2/SUIVI-OT01-OT39.md). OT-20 est livré pour son périmètre lot 1, la sélection multiple/actions groupées OT-19 reste explicitement future. OT-06 et OT-30 ne sont pas déclarés entièrement clos par ce socle.

**Hors périmètre réalisé :** nouveaux métiers des maquettes 03–18, brouillons incomplets, duplication d’articles, hiérarchie des catégories, promotions, import/export, reporting, comparaison/PDF, nouveau paramétrage contractuel, enrichissement production/historique. Les décisions sont conservées pour leurs lots ; Abby reste manuel et aucun contenu n’est envoyé sur WordPress. Prochaine action : revue des captures par Carlos, puis autorisation du lot suivant. Aucune migration de base utilisateur ni nouveau lot lancé.


## 06/11/2026 — Clôture officielle Clients UX/UI V2 et passation

**Clients V2 — Refonte ergonomique validée le 06/11/2026.** Validation officielle Carlos après revue des24 captures et des3 correctifs : liste, fiche rapide, fiche agrandie, huit onglets et formulaires acceptés visuellement. Aucune nouvelle correction ergonomique demandée. Derniers intitulés, aperçus sans répétition, aides Contacts, anti-double rattachement, garde TEST et largeur Notes validés.

- [x] Clôture ergonomique seulement ; aucune certification de tous les parcours fonctionnels ou de l’ensemble du CRM.
- [x] Registre CLIENT-01 à CLIENT-18 conservé ; état actuel ci-dessous, historique et réserves non supprimés. Dialogues Windows, protections documentaires en conditions réelles et périodes de maintenance demeurent à vérifier.
- [x] Passation préparée : docs/ux-v2/REPRISE-APRES-CLIENTS-V2-2026-11-06.md, décisions, fonctionnalités, registre, inventaire exact des sources, worktrees et prochaine page Offres & Tarifs. Aucun développement de cette page commencé.
- [x] Autorisation explicite reçue pour un commit intitulé feat(clients): finaliser la refonte UX/UI Clients V2 et push normal sur origin de codex/client-v2-ab-20261104 uniquement. Base contrôlée9ca5a7edf10f50b3a688e11f76e0c929b6bc82b1 ; branche distante absente avant publication. Pas de PR, fusion main ni opération sur un autre worktree. Le résultat et le SHA exact de cette opération sont à vérifier après exécution puis à fournir dans le rapport final ; cette entrée ne prétend pas qu’un push non exécuté est réalisé.
- [x] Résultats techniques existants réutilisés : dernier typecheck,4 tests politique TEST,24 contrôles Electron ciblés ; précédents41 contrôles ergonomiques,12 tests de disposition et7 tests documentaires conservés. Aucun nouvel audit/test/capture. Espaces/lignes blanches superflus retirés pour git diff --check, aucun comportement modifié.

### Registre courant après validation officielle

| Point | État au 06/11/2026 et suite conservée |
|---|---|
| CLIENT-01 | Badges Principal dédupliqués, présentation validée ; rôle et contact principal restent distincts, aucune règle de service réécrite. |
| CLIENT-02 | Accès unique aux coordonnées avancées réalisé et validé, éditeur et protections conservés. |
| CLIENT-03 | Ouvert : création d’un devis depuis Client avec rattachement fiable à étudier dans Devis. |
| CLIENT-04 | Ouvert : définitions métier de À traiter et Clôturés à arbitrer, aucune classification arbitraire ajoutée. |
| CLIENT-05 | Finition du Résumé réalisée et validée : synthèse commerciale sourcée, note dans Gestion de la relation, rubrique vide masquée et raccourci Projets hors maintenances. Aucun nouvel agrégat financier. |
| CLIENT-06 | Partiel : projection consultative conservée, catégorie Devis acceptés clarifiée ; consolidation engagements/ventes/services et périodes réelles reste ouverte. |
| CLIENT-07 | Ouvert : renouvellement, accord exprès, préavis, résiliation et échéances contractuelles à concevoir/arbitrer. Aucun jalon de livraison assimilé à une échéance. |
| CLIENT-08 | Partiel : montants sourcés et unités connues affichés ; agrégation initial/récurrent et multi-périodes toujours reportée. |
| CLIENT-09 | Partiel : besoins existants consultables ; opportunités et ajout de propositions complémentaires à concevoir, aucune vente déduite. |
| CLIENT-10 | Consultation et présentation validées : devis accepté, attestation, document et signature distingués ; réserves natives documentaires CLIENT-16 maintenues. |
| CLIENT-11 | Partiel : lignes acceptées sans suivi et états terminés/archivés issus des sources visibles ; consolidation de l’historique des arrêts et motifs non fournis toujours ouverte. |
| CLIENT-12 | Présentation réalisée et validée : Associations contextuelles, repli manuel prioritaire, aperçu Devis non acceptés sans répéter les acceptés ; totaux et accès complets conservés. |
| CLIENT-13 | Sélecteur Projets unique réalisé et validé ; tous les états et archives accessibles, progression inchangée. |
| CLIENT-14 | Documents refondu et validé graphiquement ; fonctionnalités et réserves CLIENT-16 conservées. |
| CLIENT-15 | Éditeur documentaire V2 réalisé et validé graphiquement ; brouillons/tests TEMP vérifiés, réserves de recette native CLIENT-16 conservées. |
| CLIENT-16 | Partiel : disponibilité, intégrité et protections testées en service/TEMP ; dialogues Windows, ouverture fichier/dossier réelle et conditions natives restent à vérifier. |
| CLIENT-17 | Largeurs, lisibilité et défilement réalisés et validés : minima d’affichage300/240px, centre640px avant compact, préférences non écrasées, redimensionnement conservé. |
| CLIENT-18 | Ouvert : étude distincte de l’agrégation des journaux métier activity_log, rattachements, doublons, conservation et liens ; aucune agrégation ajoutée. |

Prochaine action de cette session : sécuriser les seules sources Clients V2 et cette documentation dans la branche dédiée, pousser sans force et vérifier le SHA distant. Les captures, ZIP, SQLite, profils, secrets et artefacts locaux restent hors dépôt. Ensuite terminer la session ; prochaine conversation Offres & Tarifs selon inventaire → capture → maquette → validation → développement, sans modifier les prix ni l’historique.

## 06/11/2026 — Dernières corrections après revue des24 captures

La présentation générale et les corrections précédentes du Résumé sont jugées satisfaisantes/validées visuellement par Carlos dans sa nouvelle consigne. Dernière passe ciblée autorisée ; validation ergonomique finale encore attendue, aucune nouvelle conception ni fonctionnalité métier.

- [x] Fiche rapide : « Devis et projets liés » remplace « Prestations liées », sans toucher aux données/rattachements ni suggérer qu’un brouillon est vendu.
- [x] Associations : compteur Devis conservé sur le même total dédupliqué ; aperçu affiche les non-acceptés, les acceptés restent dans Devis acceptés avec leur compteur inchangé. État d’aperçu explicite si seuls des acceptés existent ; Voir tous les devis conserve l’accès central. Repli manuel et dossier exact vérifiés.
- [x] Contact : aide adaptée aux modes créer/rattacher. Service existant idempotent pour même personne/même rôle vérifié, mais rôle différent peut former un second lien. Garde local du formulaire Client ajouté pour une personne déjà rattachée : message compréhensible vers Modifier la personne, aucune sauvegarde ni perte du brouillon. Service Annuaire, modèle multi-rôles et protections existantes inchangés.
- [x] Remplissage TEST : absence de garde réellement constatée. Capability bootstrap calculée côté principal par clientTestFillPolicy : uniquement Electron non empaqueté sur workspace exact Validation-MSI ; refus par défaut ailleurs, même si URL recette ou dossier TEST. Bouton masqué, handler et soumission protégés. Aucun garde fondé uniquement sur une chaîne fournie par le renderer.
- [x] Notes de création : largeur de grille complète via CSS local ; aucun champ ni règle d’enregistrement remplacé.
- [x] Typecheck réussi.4 tests ciblés de politique TEST réussis.24 contrôles Electron ciblés réussis (3 Flowers+21 Horizon) : compteurs/aperçus simples et mixtes, repli, liste complète et identifiant exact, modes de formulaire, doublon refusé, rattachement valide conservé et absence du bouton TEST en contexte non autorisé. Écritures exclusivement TEMP. Première erreur de banc : huit onglets contrôlés après navigation réelle Devis ; ordre de l’assertion corrigé, pas de changement applicatif pour ce défaut du banc.
- [x] Trois PNG originaux Electron1920×1080 zoom100%,Noir/Confort inspectés : outputs/ClientsV2-Corrections-finales-1793932749258 (index.html,01-fiche-rapide.png,02-associations-sans-doublon.png,03-creation-contact-aide.png,RECAPITULATIF.md). Flowers existant en lecture seule et SHA inchangé ; Horizon est la recette TEST du dépôt rejouée strictement en TEMP. Les créations supplémentaires des tests de mélange/rattachement interviennent après les captures, uniquement en TEMP nettoyé. Galerie24 précédente non remplacée.
- [ ] Validation ergonomique finale Carlos sur ces trois ajustements.

Registre CLIENT-01 à CLIENT-18 et statuts/reportages antérieurs intégralement conservés ; aucune évolution métier reportée close. Contrôles restant sur périodes de maintenance, alerte packs et fichiers/dialogues natifs maintenus. Autres travaux Client et Sites & Pages préservés. Aucun changement de base utilisateur, migration, reset/clean/stash/rebase, commit/push/PR/fusion.

## 06/11/2026 — Finitions restantes et galerie complète Clients V2

- [x] Consigne jointe « Finitions restantes et galerie visuelle complète » appliquée dans le worktree UX Client existant. Corrections antérieures vérifiées, non reconstruites : badges Principal dédupliqués, accès aux coordonnées avancées, synthèse commerciale, Associations contextuelles/manuelles et Devis acceptés, sélecteur Projets unique, éditeur documentaire protégé, minima Identité et préférences non réécrites.
- [x] Résumé A/B/C : rubrique Actions rapides masquée seulement si réellement vide ; Programmer une action reste au centre du Résumé et à gauche dans les autres onglets. Note de relation déplacée dans Gestion de la relation client avec le même éditeur, handlers et garde ; présentation des champs/boutons harmonisée. Raccourci Projets retiré du bloc commercial sous Maintenances actives ; onglet et Associations conservent les dossiers exacts. Aucun compteur, calcul ou service changé.
- [x] Deux défauts mineurs constatés sur les vrais formulaires corrigés localement : bordure native de création et alignement Logo ; marges/grille de l’éditeur des coordonnées avancées. Aucun champ, validation, règle de sauvegarde ou parcours remplacé.
- [x] Galerie de 24 PNG originaux Electron Windows,1920×1080,zoom100%,Noir/Confort : liste/rapide riche et sans coordonnées, création haut/bas, modification Client, huit onglets, bas du Résumé/Contrats et preuves, maintenance, création/rattachement Contact, coordonnées avancées, personne, éditeur documentaire et note de relation. Chaque image inspectée et fixture explicitée ; aucun ancien dossier de captures remplacé.
- [x] Sources : Atelier des Fleurs et les deux clients RGPD/historique sur bases de recette existantes en lecture seule, sans initialize/migration ; SHA SQLite inchangés avant/après. Atelier Horizon réinstancie strictement la recette TEST existante client-contracts-scenarios.cjs dans une base TEMP ensuite nettoyée, sans enrichissement pour la galerie. Aucun formulaire de galerie enregistré. Les horodatages générés par cette recette ne sont pas présentés comme des données de la base utilisateur.
- [x] Typecheck réussi ; recette Electron ergonomique ciblée41 contrôles réussis. Assertions des corrections A/B/C, résolution/zoom, onglets actifs et absence d’erreur renderer réussies pendant les captures. Le refus d’ouverture SHA-256 du fichier TEMP altéré est attendu ; handoff shell/dialogues interceptés, pas une recette native complète.
- [x] Livraison : outputs/ClientsV2-Revue-2026-11-06-1793928812746/index.html ; PNG originaux, RECAPITULATIF.md et manifest.json par image. ZIP frère ClientsV2-Revue-2026-11-06-1793928812746.zip, intégrité CRC et présence des24 PNG vérifiées.
- [ ] Validation visuelle globale Carlos via cette galerie. Aucun rendu déclaré validé à sa place.

Registre CLIENT-01 à CLIENT-18 conservé intégralement avec les décisions et réserves précédentes. CLIENT-05 reçoit seulement ces trois corrections de présentation ; aucun chantier métier reporté clos. Périodes réelles de maintenance, alerte d’expiration des packs à étudier, CLIENT-16 et les réserves natives restent ouverts. Aucune migration ni modification métier, aucun commit/push/PR/fusion. Sites & Pages et tous les fichiers locaux hors périmètre préservés.

## 06/11/2026 — Passe de finition ergonomique autorisée, en attente de revue humaine

Consigne jointe Dernière passe de corrections ergonomiques lue. Aucune nouvelle refonte métier, migration, prix/clause ou journal modifié. Le plan de clôture précédent est historique ; seules les corrections explicitement autorisées ci-dessous ont été développées. Aucun point reporté supprimé ni abandonné.

- [x] CLIENT-01/02 : badge principal équivalent dédupliqué, autres rôles/incohérences conservés ; un seul accès natif de type summary au ContactMethodsPanel existant, clavier vérifié. Aucun changement ClientContactService ou des données Contacts.
- [x] CLIENT-05 : ClientCommercialSummary présente les situations fiables séparément sans recopier les listes du panneau droit : propositions en préparation/envoyées/consultées, nombre de devis acceptés clairement nommé (pas un compteur de prestations vendues), maintenances actives, accès aux onglets du bon Client. Suppression des boutons Tous les devis/Tous les projets qui ouvraient des listes globales ; accès aux dossiers conservés dans les onglets et Associations. Ni moteur métier ni total financier ajouté ; note de relation et son brouillon inchangés.
- [x] CLIENT-06/12 : catégorie droite Devis acceptés, source actuelle et identifiants exacts inchangés ; repli initial de la catégorie centrale active, manipulation manuelle prioritaire et conservée lors des relectures. Projection Contrats non modifiée.
- [x] CLIENT-13 : sélecteur unique, tous états et archives accessibles, état entre onglets conservé ; progression inchangée.
- [x] CLIENT-17 : adaptation pure d’affichage à la largeur utile, minima Identité300px/Associations240px, centre640px réservé avant passage compact. Valeurs enregistrées conservées ; seul geste explicite souris/clavier écrit une nouvelle préférence. Prospect conserve son comportement et ses bornes par défaut. Défilement : défaut réel du Résumé long corrigé en généralisant au cadre Client la contrainte de hauteur auparavant spécifique à Contrats ; règle spécifique supprimée, onglets/en-tête restent visibles et sections inférieures accessibles.
- [x] CLIENT-15 : éditeur local V2 sans nouveau système de sauvegarde, mêmes champs titre/date/motif et mêmes métadonnées transmises. Dates anciennes conservées exactement si non modifiées, nom physique inchangé. Garde useUnsavedDraft, Annuler/Rester/Quitter sans enregistrer, pending et erreur backend réutilisés ; autres opérations mutantes désactivées pendant l’édition pour éviter un conflit local. Aucun service documentaire modifié.
- [x] Contrôle complémentaire : défaut typographique confirmé dans le formulaire de création Client (texte10px malgré champ42px) corrigé localement en Noir/Confort à14px, via la règle fonctionnelle existante. Aucun champ ni règle d’enregistrement changé. Création et édition existantes conservent leurs brouillons/confirmations.
- [x] Typecheck réussi. Douze tests ciblés crmRecordPresentation dont quatre nouveaux sur adaptation/minima/centre/préférences non mutées ; sept tests existants ClientDocumentService pour les protections documentaires. Aucun test global.
- [x] Trente-huit contrôles Electron spécifiques + trois de démarrage réussis (41total) sur fixture TEMP indépendante : création/édition et brouillons, cycle liste/rapide/agrandie/retour, sélection/onglet, souris/clavier et repli, valeurs anciennes220/190 non réécrites et valeurs modernes320/280 conservées, compact sans perte du brouillon, Associations manuelles et rafraîchissement, Contacts et coordonnées au clavier, sélecteur Projets, éditeur document réellement sauvegardé sur fixture avec métadonnées intactes. Navigation réelle vers Annuaire par l’action Contact et retour ciblé au Client via le mécanisme existant, identifiants vérifiés. Aucun nouveau mécanisme de retour intermodules ajouté.
- [x] Intégrité documentaire : ouverture par IPC vérifie le fichier exact avant transmission à shell.openPath ; lancement système intercepté dans ce contrôle, non annoncé comme ouverture native réelle. Altération du fichier TEMP : refus SHA-256 effectivement constaté avant tout appel shell. Erreur IPC Document modifié attendue ; zéro erreur renderer. Choix des confirmations Rester/Quitter simulés dans le banc, non présentés comme recette visuelle de dialogues natifs. TEMP nettoyé.
- [x] Capture Electron finale inspectée : outputs/client-ergonomics-final-1920x1080.png, TEST Atelier des Fleurs existant, Noir/Confort1920×1080 zoom100. Mesures320px Identité /1011px Travail /260px Associations, fiche de y93 à1066, en-tête commun visible, aucun scroll du document racine. Capture sur base existante ouverte en lecture seule sans initialize/migration, empreinte SQLite inchangée. Aucune donnée utilisateur modifiée.
- [ ] Revue et validation ergonomique Carlos, avant recette transversale et toute opération Git de sécurisation.

Réserves conservées : CLIENT-03/04/07/08/09/11/18 restent reportés ; statuts commerciaux exacts uniquement. CLIENT-10 et14 graphiquement préservés ; CLIENT-16 conserve la recette Windows réelle fichier/dossier/dialogues, non couverte par des handoffs interceptés. Périodes réelles de maintenance et alertes packs restent des vérifications ultérieures, aucune fonction nouvelle. Les changements d’affichage06/12 ne clôturent pas toute la consolidation fonctionnelle de06. Précédent/suivant et menu Actions toujours hors périmètre. Aucun calcul financier, prix, clause, mécanisme métier de temps ou agrégation de journal ajouté.

Fichiers de cette passe (uniquement le worktree Client) :

- src/renderer/crm/ClientsPage.tsx : raccords regroupés, badges/coordonnées et synthèse Résumé.
- src/renderer/crm/ClientCommercialSummary.tsx : nouveau composant de synthèse sans agrégation financière.
- src/renderer/crm/ClientAssociations.tsx : libellé et repli manuel/contextuel.
- src/renderer/crm/ClientProjectsTab.tsx et client-projects-v2.css : sélecteur unique et retrait du style des commandes retirées.
- src/renderer/crm/CrmRecordLayout.tsx, CrmPaneSeparator.tsx et crm-record-layout.css : adaptation commune, gestes explicites et lisibilité.
- src/shared/crmRecordPresentation.ts et crmRecordPresentation.test.ts : projection d’affichage et tests, normalisation persistée inchangée.
- src/renderer/crm/ClientDocumentsPanel.tsx et ClientDocumentsPanel.css : éditeur local et garde de brouillon.
- src/renderer/crm/ClientsPageV2.css : taille fonctionnelle du formulaire de création.
- src/renderer/crm/client-expanded-v2.css : contrainte commune de hauteur et styles de la synthèse ; client-contracts-v2.css : retrait de la contrainte devenue commune, projection Contrats intacte.
- scripts/check-client-ergonomics.cjs et scripts/fixtures/client-ergonomics-scenarios.cjs : contrôles isolés, aucune capture de données artificielles.
- PROJECT_STATUS.md : états et réserves actualisés, registre CLIENT-01 à CLIENT-18 intégralement conservé.

Prochaine action : Carlos examine la capture et les corrections ; aucune relance de refonte ou nouveau lot fonctionnel implicite. Aucun reset/stash/clean/rebase/commit/push/PR/fusion. Travaux locaux hors périmètre et worktree Sites&Pages conservés.


## 06/11/2026 — Historique validé ; plan de clôture globale Client V2 à approuver

Carlos valide visuellement Historique V2. Les huit onglets ont reçu une première refonte graphique ; cela ne clôt pas les réserves fonctionnelles. Autorisation actuelle : étude documentaire du plan seulement. Aucun développement de finition, test, migration, capture ou publication dans cette étape. Les propositions ci-dessous attendent validation avant exécution. Le registre CLIENT-01 à CLIENT-18 historique est conservé intégralement ; aucun point n’est abandonné ou réputé clos.

### Matrice de clôture CLIENT-01 à CLIENT-18

Lecture : chaque ligne distingue objectif, état/réalisation, manque/proposition, composants/services, risque/arbitrage et condition de clôture. Les preuves sont celles déjà consignées, non rejouées ici. Une validation graphique ne prouve pas toutes les transitions métier et ouvertures natives.

| ID et objectif exact | État réel et déjà réalisé | Manque et correction/évolution proposée | Composants et services concernés | Risque fonctionnel / arbitrage requis | Condition de validation et de clôture |
| --- | --- | --- | --- | --- | --- |
| CLIENT-01 — Distinguer rôle Principal et contact principal. | À corriger en présentation. Deux badges visibles ; ClientContactService.add force role=primary dès que makePrimary ou role=primary ; setPrimary impose aussi ce rôle et rétrograde l’ancien. Ce ne sont pas deux propriétés indépendantes dans ces parcours. | Afficher une seule désignation principale si les valeurs sont équivalentes ; conserver les autres rôles et les éventuelles incohérences historiques visibles pour examen, sans les réécrire. Ne pas confondre principal Client et moyen préféré. | ClientsPage/ROLE_LABELS, ClientContactService.add/setPrimary/list, CrmService.ensurePrimaryContactRole. | Risque moyen : perdre un rôle ou modifier le principal en changeant seulement l’affichage. Pas d’arbitrage métier pour dédupliquer l’affichage conforme au modèle ; dissocier réellement les deux notions exigerait une décision distincte. | Création, rattachement existant et changement de principal gardent la même personne/règle ; autres rôles inchangés, un seul badge équivalent, aucun doublon de personne. |
| CLIENT-02 — Clarifier Gérer/Modifier les coordonnées. | À corriger en présentation. Gérer les coordonnées bascule le details ContactMethodsPanel ; son summary comporte Modifier les coordonnées. Deux accès au même panneau, pas deux moteurs d’édition. | Unifier les libellés et l’accès de commande ; conserver le summary accessible et la gestion des emails/téléphones supplémentaires, usages, préférences et archives. | ClientsPage carte Contact, ContactMethodsPanel, API contactMethods/Annuaire. | Risque moyen sur accessibilité et accès aux coordonnées avancées. Arbitrage métier non ; choix UX à valider avec CLIENT-01. | Même personne/mêmes coordonnées après ouverture depuis les deux contextes, navigation clavier, sauvegarde/concurrence et brouillon préservés. |
| CLIENT-03 — Nouveau devis pré-rattaché au Client exact. | À développer. QuotesPage.createQuote sait transmettre clientAccountId depuis l’assistant ; initialId ouvre un devis existant et n’est pas une entrée de création Client. Aucun bouton fictif dans Commercial. | Ajouter un contexte explicite d’ouverture de l’assistant, pré-renseigner le bon Client et réutiliser le parcours Devis. Conserver l’identité Client si l’utilisateur revient ou annule, sans créer de devis à la simple navigation. | ClientCommercialTab, App/navigation, QuotesPage assistant/createQuote, API Devis, protections de brouillons. | Risque élevé : mauvais rattachement ou abandon d’un devis en cours. Pas de nouvelle règle commerciale ; validation du parcours pré-rattaché requise. | Client A → nouveau devis → sauvegarde : Client A exact ; annulation sans création, Client B jamais substitué, brouillon existant protégé et retour Client fonctionnel. |
| CLIENT-04 — Définir À traiter et Clôturés. | À arbitrer. Total/Brouillons/Acceptés/Refusés et filtre des sept statuts exacts existent ; les groupes ambigus sont volontairement absents. | Choix recommandé : conserver les statuts exacts. Alternative à valider explicitement : À traiter=draft+sent+viewed ; Clôturés=refused+expired+cancelled, accepted séparé. Ne jamais assimiler devis accepté et engagement terminé. | ClientCommercialTab, QuoteStatus/QuoteSummary. | Risque moyen de lecture commerciale trompeuse. Arbitrage de classification oui si les groupes sont retenus. | Définition écrite approuvée, compteurs conformes sur chaque statut, absence de double compte et libellés cohérents ; ou décision explicite de conserver les seuls états exacts. |
| CLIENT-05 — Résumé commercial sans doublons inutiles. | Partiellement réalisé. Trois zones et cartes existent ; le bloc Prestations liste encore des devis/projets et les maintenances actives, avec raccourcis déjà présents à droite. | Produire une synthèse à partir des ventes/engagements sourcés et situations de devis ; séparer vendu, en proposition, maintenance active et action à suivre. Garder les raccourcis utiles sans reproduire toutes les listes. | ClientsPage/Résumé, ClientAssociations, clientEngagementPresentation, lectures quotes/projects/subscriptions/actions. | Risque moyen : présenter une proposition comme vendue ou supprimer un accès utile. Choix UX oui, pas de nouvelle qualification métier automatique. | Chaque information possède sa source et son sens ; proposition/Brouillon distincts ; boutons devis/projets justifiés ; tous les accès métier restent disponibles et brouillon relation intact. |
| CLIENT-06 — Lecture unifiée des engagements et suivis. | Partiellement réalisé. Projection consultative des lignes acceptées, ventes opérationnelles, souscriptions, packs, interventions liées et périodes ; regroupement des souscriptions partagé avec compléments déjà couvert par tests ciblés. | Compléter la recette réelle et aligner la sémantique du contexte droit : Contrats dans ClientAssociations compte encore des devis acceptés, pas tous les engagements affichés au centre. Réutiliser une projection commune en lecture seule, ou expliciter le libellé de cette catégorie. | ClientContractsPanel, clientEngagementPresentation, ClientAssociations, operationalSalesForClient, services maintenance/packs/interventions et devis. | Risque élevé de double compte ou de compteur Contrats mal interprété. Décision UX sur libellé/source du panneau droit ; aucune règle à inventer. | Une vente/souscription non dupliquée ; données partielles signalées ; scénario réel avec périodes et plusieurs sources ; compteur de droite explicitement conforme à sa source. |
| CLIENT-07 — Renouvellements, accord exprès, résiliation et échéances fiables. | À développer / à arbitrer sur le workflow. Lecture de paramètres contractuels et dates existantes ; MaintenanceService possède changements de statut et périodes. Cela ne constitue pas un suivi complet accord/demande/préavis/date d’effet/preuve. | Concevoir le suivi daté et sourcé des décisions, demandes et effets, sans toucher au contrat accepté ; appliquer les règles déjà décidées, pas des dates déduites de l’acceptation. Migration éventuelle soumise à accord séparé. | ClientContractsPanel, quoteContractPreparation/ContractTerms, MaintenanceService, données de souscription et preuves. | Risque élevé, contractuel/historique. Mensuel et annuel déjà décidés ; restent à approuver workflow, champs, source de preuve et effets opérationnels, pas à revoter le principe d’accord exprès. | Cas mensuel/annuel, refus/absence d’accord, demande de résiliation et date d’effet ; preuve et source retrouvables ; aucune reconduction automatique ni modification rétroactive, jalons exclus des renouvellements. |
| CLIENT-08 — Montants initiaux et récurrents exacts. | Partiellement réalisé. Prix de ligne/suivi et unités/cadences explicites ; quantité de périodes distinguée ; aucune division ni total récurrent fabriqué. | Définir les bases homogènes puis afficher des totaux séparés ponctuels/mensuels/annuels/trimestriels lorsque le sens est connu. Inconnus signalés hors total, lignes et souscriptions partagées non additionnées deux fois. Équivalent mensuel seulement si autorisé et libellé analytique. | clientEngagementPresentation, ClientContractsPanel, OperationalSalePolicy/snapshots, QuoteDetail et souscriptions. | Risque élevé : addition de montants multi-périodes, unités/HT-TTC ou périodes incompatibles. Arbitrage de présentation/normalisation oui ; aucune règle d’encaissement ou de prix implicite. | Fixtures homogènes et multi-périodes, zéro réel/inconnu distincts, abonnements partagés et compléments ; chaque somme reconstituable depuis ses sources, jamais assimilée à du facturé/encaissé. |
| CLIENT-09 — Besoins, services complémentaires et propositions. | Partiellement réalisé. Besoins liés consultables avec réserve de qualification, propositions non acceptées dans Commercial ; pas de moteur d’opportunité ni ajout automatique. | Recommandation : qualifier manuellement un besoin via le parcours existant et permettre la proposition liée au bon Client via CLIENT-03. Présenter les besoins comme à qualifier tant que la couverture vendue n’est pas établie. | WorkflowService/needs, ClientContractsPanel, ClientCommercialTab et parcours Devis. | Risque moyen/élevé : vendre un service déjà couvert ou transformer une suggestion en engagement. Arbitrage oui sur parcours/qualification ; suggestions automatiques demanderaient une étude distincte. | Besoin lié → proposition → devis précis, ni doublon ni prestation vendue avant acceptation ; origine conservée et qualification explicite. |
| CLIENT-10 — Devis accepté, attestation, pièce et signature distincts. | Réalisé et vérifié pour la projection consultative. Sources de preuve et attestations distinguées ; aucune signature certifiée déduite du titre, du rôle accepted_pdf ou d’un hash. | Achever une recette croisée des accès aux preuves réelles avec CLIENT-16 ; maintenir ces distinctions lors de CLIENT-07/18. Ne pas ajouter un système de signature. | ClientContractsPanel, QuoteContractPreparationService/liens documentaires, ClientDocumentService, Devis. | Risque élevé de fausse preuve ou perte de référence historique. Pas de nouvel arbitrage pour conserver les distinctions ; signature nouvelle hors périmètre. | Ouvrir la pièce exacte, cas absent/remplacé/archivé/modifié, attestation distincte d’une signature ; liens historiques et devis acceptés inchangés. |
| CLIENT-11 — Ventes sans suivi et historique des arrêts. | Partiellement réalisé. Lignes acceptées sans objet opérationnel visibles ; états terminés/archivés/épuisés/expirés présentés selon source, sans motif inventé. | Rendre les éléments manquants explicites et relier l’historique disponible ; ne pas créer automatiquement un suivi opérationnel ni déduire une cause d’arrêt. Exploiter les futurs événements CLIENT-07/18 seulement après validation. | clientEngagementPresentation, ClientContractsPanel, operationalSalesForClient, historiques opérations/devis. | Risque élevé si rattrapage automatique ou réécriture d’une vente ancienne. Arbitrage nécessaire si l’on veut compléter le passé ou formaliser de nouveaux motifs. | Vente acceptée sans suivi retrouvable et sourcée ; suivi terminé/archivé conserve ses liens et dates ; absence de cause annoncée, pas de mutation historique. |
| CLIENT-12 — Associations contextuelles sans perdre d’accès. | À corriger en présentation. Aperçus repliables, compteurs réels sur leurs sources, deux éléments pertinents et accès exacts existent ; la catégorie active n’est pas traitée contextuellement. | Préférer le repli contextuel réversible plutôt que masquer/détruire la catégorie ; laisser l’ouverture manuelle prioritaire. Traiter ensemble avec CLIENT-05/06, y compris le sens du compteur Contrats. | ClientAssociations, ClientsPage/activeTab, CrmRecordLayout. | Risque moyen sur découverte, état replié, liens et lectures. Choix UX à valider : repli manuel/contextuel plutôt que masquage imposé. | Huit onglets, catégories vides/erreurs, ouverture manuelle et accès aux dossiers préservés ; aucun formulaire démonté, contexte cohérent et compteurs correctement nommés. |
| CLIENT-13 — Simplifier les filtres Projets. | Réalisé et vérifié fonctionnellement ; finition UX à décider. Filtres rapides et sélecteur pilotent le même état ; sélecteur couvre aussi attente client, blocage, validation. | Garder un seul état et éviter une double commande inutile ; recommandation : états fréquents en raccourcis, états supplémentaires dans un accès complémentaire lisible, ou conserver seulement le sélecteur si validé. | ClientProjectsTab. | Risque faible/moyen : rendre un statut inaccessible ou perdre le filtre sélectionné. Arbitrage UX oui ; aucune définition métier nouvelle. | Tous les statuts et archives atteignables, mêmes résultats/compteurs, état entre onglets conservé, une présentation validée sans second moteur de liste. |
| CLIENT-14 — Refonte Documents/recherche/filtre/actions. | Réalisé et vérifié en UI, validé graphiquement. Compteurs globaux, recherche, filtre distinct de l’import, archives, tableau et handlers existants. | Conserver cette version ; ne rouvrir que les éléments touchés par CLIENT-15/16. Les validations de navigation/paramètres interceptés ne prouvent pas toutes les actions natives réelles. | ClientDocumentsPanel et son CSS, API clientDocuments. | Risque faible de présentation, moyen pour import/édition selon CLIENT-15/16. Pas d’arbitrage de nouvelle refonte. | Régressions limitées après modification d’éditeur ou de protection, puis parcours réel validé avec CLIENT-16 ; aucun nouvel audit graphique. |
| CLIENT-15 — Harmoniser titre et conservation. | À développer, encore reporté. Prompts et annulations conservés ; catégorie/code/notes transmis sans perte. | Remplacer les prompts par un éditeur V2 protégé avec les mêmes champs et règles, annulation, erreur et retour au document ; réutiliser les composants/formulaires existants. | ClientDocumentsPanel, composants de formulaire V2, useUnsavedDraft, ClientDocumentService.update. | Risque moyen/élevé : perte de brouillon ou de métadonnées ; compatibilité des dialogues natifs à vérifier. Décision métier non, organisation de l’éditeur à valider. | Annuler/sortir/rester/enregistrer/erreur ; champs non édités et nom physique inchangés ; protections backend identiques ; validation sur vrai runtime Windows. |
| CLIENT-16 — Disponibilité, intégrité, protections documentaires. | Partiellement réalisé et vérifié. États présent/manquant séparés de l’archivage, sept tests service réussis ; projections IPC ont vérifié les états UI. Ouvertures et dialogues natifs restent partiellement interceptés dans les recettes. | Vérifier réellement import multiple/noms uniques, ouverture fichier/dossier, empreinte altérée, fichier déplacé/manquant, archive/restauration et confirmation/refus de suppression dans une fixture temporaire isolée. | ClientDocumentService, IPC client-documents/dialog/shell, ClientDocumentsPanel, liens Devis et facturation Abby. | Risque élevé de suppression de preuve/facture ou certification abusive. Pas d’arbitrage pour conserver les protections ; toute modification de règles requiert accord spécifique. | Preuves/factures courantes et remplacées non supprimables ; fichier/hash/chemin vérifiés, archives et annulation sans perte ; date de conservation non présentée comme verrou ; aucun hash/titre assimilé à une signature. |
| CLIENT-17 — Lisibilité/adaptation Identité. | À corriger. Appel Client avec défauts320/260px ; préférence existante normalisée autorise gauche220/droite190px et l’emporte. Compact déclenché sous1050px utiles. Captures démontrent des noms et boutons comprimés. | Mesurer espace utile, minima et compromis responsive ; prévoir une adaptation lisible des anciennes préférences sans les écraser arbitrairement, ni réduire excessivement le centre. Réviser une fois les styles de structure plutôt que par onglet. | CrmRecordLayout, CrmPaneSeparator, crmRecordPresentation, client-expanded-v2.css, ClientsPage. | Risque moyen/élevé sur redimensionnement, préférences, huit onglets et formulaires. Choix UX sur minima/comportement oui ; aucune modification de préférence dans l’étude actuelle. | Noms longs, volet replié, drag/clavier, préférences anciennes/nouvelles, centre étroit et écran27pouces ; huit onglets accessibles, brouillons persistants et redimensionnement conservé. |
| CLIENT-18 — Agréger les journaux métier fiables. | À développer après étude/arbitrage. Historique V2 validé visuellement ; activity_events fusionné par ID et trié, quatre événements conservés. activity_log non intégré. | Adapter en lecture seule les sources fiables via rattachements explicites, conserver journal+ID d’origine et dates, namespace des IDs pour éviter collisions. Événements ambigus non attribués automatiquement ; aucune suppression sémantique de deux traces distinctes. | CrmService.listActivity, clientHistory/ActivityEvent, journaux Quote/ContractPreparation/Project/Operations, ClientHistoryTab et Résumé. | Risque élevé de mauvaise attribution Client, doublons ou perte de traces ; relations courantes et historiques à distinguer. Arbitrage sur couverture initiale et regroupement visuel ; migration éventuelle séparée. | Chaque événement relié au bon Client avec preuve de rattachement, zéro fuite entre Clients, IDs et résumés originaux conservés, ordre stable, deux conversions intactes ; recherche/filtre/liens et trois récents du Résumé cohérents sur la source validée. |

### Vérifications complémentaires sans numéro — toutes conservées

- Périodes réelles de maintenance : vérifier lecture et usages/temps, périodes multiples, états et erreurs partielles depuis Interventions ET Contrats. La fixture Atelier des Fleurs ne couvre pas ce cas ; préparer une recette isolée après accord, sans fabriquer des données pour un visuel présenté comme réel.
- Alertes packs : fonction hour_pack_expiring existante dans OperationsAlertService/OperationsAlertsPanel, seuil réglable14jours par défaut, critique à3jours ou moins ; étudier un aperçu Client filtré sur son ID et un accès au pack exact, sans réécrire les seuils ni appeler actif un pack suspendu/épuisé. Valider absence d’alertes hors Client et absence d’alertes trompeuses sur archives/expiration.
- Parcours complet : liste pleine largeur/sélection/panneau rapide/fermeture/agrandissement/retour ; recherche, vues, colonnes et largeurs manuelles conservées. Pas de nouvelle refonte de la liste déjà validée.
- Création et édition Client : formulaires existants, Annuaire/rattachement, validations/concurrence, brouillons, sauvegarde/annulation/sortie/erreurs ; harmoniser seulement les écarts constatés, sans modifier les règles d’enregistrement ni dupliquer les personnes.
- Huit onglets, trois zones, défilements imbriqués et accès aux sections inférieures : y compris engagements sans suivi, documents, historique et services complémentaires. Repli ne doit pas démonter un éditeur.
- Cohérence finale des icônes, libellés, messages, boutons et cartes via composants communs ; Noir/Confort prioritaire, pas de matrice multi-thèmes. Vérifier les chemins partagés impactés sans étendre le chantier aux autres pages.
- Échéances : actions ouvertes en retard et états exacts, jalon de livraison distinct de fin d’engagement/renouvellement, périodes de service distinctes de facturation ; ne rien déduire de la seule date d’acceptation.
- Preuves et accès directs : Devis/Abby, Annuaire, Projet, intervention, maintenance/pack et document exact ; vérifier aussi l’arrivée réelle dans le module, car plusieurs recettes ont contrôlé seulement la transmission d’identifiants en interceptant la navigation.
- Anciennes réserves d’en-tête : précédent/suivant et menu Actions ne sont pas autorisés implicitement par la finition. Les compteurs explicitement validés dans les onglets ne justifient aucun nouveau compteur global. Obtenir une décision d’utilité/périmètre avant ajout ; rien n’est abandonné silencieusement.

### Décisions déjà applicables — ne pas les redemander

Source de reprise ciblée : docs/ux-v2/CONSIGNES-ET-REPRISE.md, rubrique Décisions commerciales persistantes, et paramètres/snapshots acceptés des devis concernés ; cahier des charges V1 pour source unique, archivage et rôle d’Abby.

- Maintenance mensuelle : fin de période payée ; annuel : engagement/renouvellement sur accord exprès. Aucun renouvellement automatique à inventer. Les durées de préavis non établies pour un dossier restent non renseignées ; ne pas reprendre une valeur de maquette.
- Prix de référence consignés : WP49€/mois2×30min et WooCommerce99€/mois4×30min ; interventions non cumulables/non reportables. Hébergement Lune149€/an distinct du domaine et de la maintenance ; anciennes offres et contrats acceptés conservés, pas de double facturation de transition.
- Ces décisions de projet ne republient pas une clause/édition de Catalogue. Les réserves documentaires de validation juridique/publiée restent celles déjà consignées ; aucune application rétroactive ni réécriture d’un snapshot accepté.
- Abby reste la source des factures réglementaires ; montant facturable, vendu, facturé et encaissé restent des notions distinctes.

### Arbitrages proposés avant les lots concernés

1. CLIENT-04 : statuts exacts seuls (recommandé), ou groupes explicites À traiter=draft/sent/viewed et Clôturés=refused/expired/cancelled avec accepted séparé. Aucune option n’est activée par ce plan.
2. CLIENT-07 : suivi manuel daté/sourcé des demandes, accords et dates d’effet (recommandé pour commencer), ou exécution opérationnelle automatisée après conception et autorisation spécifiques. Valider les effets sur une souscription existante, les champs/preuves et une éventuelle migration ; le principe mensuel/annuel ne change pas.
3. CLIENT-08 : totaux homogènes séparés par périodicité (recommandé), ou équivalent mensuel analytique explicitement distinct du montant à payer. Ne normaliser que si prix/quantité/période/taxe sont établis ; sinon conserver l’inconnu et sa source.
4. CLIENT-09 : qualification manuelle et proposition via besoins/Devis existants (recommandé) ; toute suggestion automatique doit faire l’objet d’une étude séparée, sans conditionner les corrections déjà possibles.
5. CLIENT-12/17 : repli contextuel réversible des Associations plutôt que masquage (recommandé) ; validation des minima Identité/Associations et de l’adaptation des préférences. Pour Contrats à droite : libellé explicite Devis acceptés, ou aperçu de la même projection d’engagements que le centre, à choisir sans mélange de compteurs.
6. CLIENT-18 : commencer avec les seuls événements dont le rattachement est démontré ; garder les traces distinctes visibles avec provenance (recommandé), ou regroupement visuel dépliable conservant chaque événement. Ne jamais fusionner/supprimer deux événements uniquement parce que leurs résumés se ressemblent. Le périmètre des modules inclus doit être approuvé après l’étude des jointures.
7. CLIENT-13 et anciennes commandes d’en-tête : valider une présentation de filtres unique et l’utilité des réserves précédent/suivant/Actions ; pas de nouvelle fonction décorative.

### Sous-lots proposés et recette progressive

Ordre proposé, aucun sous-lot autorisé à développer par cette note :

1. Composition et parcours V2 — CLIENT-01/02/05/12/13/15/17 ; contrôles liste/fiche rapide/création/édition. Préparer les interfaces communes, traiter ensemble Résumé/Associations et cadre responsive, puis Contacts/éditeur documentaire dans des unités visuellement revues. Réutiliser AppButton/OperationIcon/guards ; une feuille de structure maîtrisée, pas de retouches par onglet. Aucun nouveau calcul métier. Recette ciblée : états conservés, principal/coordonnées, filtres, minima/préférences, formulaires et annulation native remplacée.
2. Parcours commercial — CLIENT-03/04/09. Pré-rattachement à l’assistant existant, indicateurs selon décision, besoin/proposition manuels liés. Recette : Client A/B, brouillon préalable, création/annulation, acceptation non anticipée et retour exact. Ne pas ouvrir simultanément un nouveau moteur d’opportunités.
3. Contrats et engagements — CLIENT-06/07/08/10/11 avec raccord de09. D’abord consolider la projection/les unités et prouver les lectures ; ensuite seulement le workflow d’accord/résiliation approuvé. Garder ce volet distinct si une migration devient nécessaire : autre autorisation et sauvegarde avant toute opération importante. Recette : multi-périodes, compléments partagés, lignes sans suivi, preuves/archives, effet daté et absence d’accord.
4. Opérations réelles — vérifications maintenance et alertes packs sans nouvel ID. Réutiliser périodes/usages/alertes existants ; vues Client et liens du module global. Recette : périodes multiples/erreur, temps exact, pack faible/expirant/suspendu/épuisé, seuils conservés, dossier exact. Ne pas refaire la refonte graphique validée.
5. Historique élargi — CLIENT-18. Étudier les sources puis approuver le périmètre avant adaptateurs en lecture seule ; aucune réécriture des journaux. Recette : provenance, Client déplacé/historique, événements identiques dans deux sources, collision d’IDs, archives, accès exact et Résumé.
6. Clôture documentaire et transversale — CLIENT-14/16, vérifications restantes de10/15 puis une seule recette finale proportionnée. Réaliser les ouvertures et confirmations réellement dans Electron/Windows avec données temporaires isolées. Parcours final : liste → fiche rapide → agrandie/huit onglets → Annuaire/Devis/Contrats/Projet/Intervention/Documents → retour ; sauvegarde/annulation, repli/redimensionnement, erreurs et archives. Ne rejouer les tests historiques qu’en cas de modification ou doute nouveau identifié ; pas de campagne globale de l’application ni de matrice de captures.

Limiter les raccords répétés dans ClientsPage : définir les props/contexte communs au lot1, isoler les sous-composants déjà extraits et leur style local. Des changements ultérieurs du raccord seront possibles pour de nouvelles fonctions, mais sans réécrire le cadre à chaque lot. Validation humaine par unité avant passage au lot suivant. Aucun point clos uniquement sur passage de tests.

### Risques et protections de clôture

Rattachement Client erroné ; écrasement d’un brouillon ; duplication personne/vente/souscription ; perte de rôle/contact préféré ; compteurs ambigus ; mélange de périodicités/prix ; fausse signature ; suppression d’une preuve/facture ; attribution historique via une relation devenue différente ; perte de préférences ou d’accès après repli ; intégration accidentelle des travaux Sites&Pages.

Invariants : source maître unique, devis acceptés et versions/snapshots immuables, archivage réversible et références historiques conservées, aucune qualification juridique nouvelle, pas de secrets en clair, aucun calcul de temps ou règle métier changé sans nécessité/accord. Étendre un journal en lecture ne vaut pas autorisation de purger, migrer ou publier. Tests d’écriture exclusivement sur fixtures temporaires déterministes ; données utilisateur et recettes existantes préservées. Absence de preuve de vérification reste une réserve, pas une clôture.

### État Git local relevé le06/11/2026

Worktree Client : C:/Users/AtoumWeb/.codex/worktrees/client-v2-ab-20261104/atoumweb-manager-ec04-validation ; branche codex/client-v2-ab-20261104 ; HEAD9ca5a7ed. Treize fichiers suivis modifiés et31non suivis, listés ci-dessous. Aucun reset/rebase/stash/nettoyage/création de worktree. Aucun commit de finition créé.

Fichiers suivis modifiés :

- PROJECT_STATUS.md
- src/renderer/crm/ClientContractsPanel.tsx
- src/renderer/crm/ClientDocumentsPanel.tsx
- src/renderer/crm/ClientOperationsTab.css
- src/renderer/crm/ClientOperationsTab.tsx
- src/renderer/crm/ClientsPage.tsx
- src/renderer/crm/ClientsPageV2.css
- src/renderer/crm/CrmRecordLayout.tsx
- src/renderer/main.tsx
- src/renderer/ui/ConfiguredDataTable.tsx
- src/renderer/ui/NavigationRail.tsx
- src/shared/clientPresentation.test.ts
- src/shared/clientPresentation.ts

Fichiers non suivis préservés :

- scripts/check-client-commercial.cjs
- scripts/check-client-contacts.cjs
- scripts/check-client-contracts.cjs
- scripts/check-client-documents.cjs
- scripts/check-client-expanded.cjs
- scripts/check-client-history.cjs
- scripts/check-client-interventions.cjs
- scripts/check-client-projects.cjs
- scripts/check-client-v2-ab.cjs
- scripts/fixtures/client-ab-scenarios.cjs
- scripts/fixtures/client-commercial-scenarios.cjs
- scripts/fixtures/client-contacts-scenarios.cjs
- scripts/fixtures/client-contracts-scenarios.cjs
- scripts/fixtures/client-expanded-scenarios.cjs
- src/renderer/crm/ClientAssociations.tsx
- src/renderer/crm/ClientCommercialTab.tsx
- src/renderer/crm/ClientDetailIcon.tsx
- src/renderer/crm/ClientDocumentsPanel.css
- src/renderer/crm/ClientHistoryTab.tsx
- src/renderer/crm/ClientOperationsTab.test.ts
- src/renderer/crm/ClientProjectsTab.tsx
- src/renderer/crm/ClientQuickSummary.tsx
- src/renderer/crm/client-commercial-v2.css
- src/renderer/crm/client-contacts-v2.css
- src/renderer/crm/client-contracts-v2.css
- src/renderer/crm/client-expanded-v2.css
- src/renderer/crm/client-history-v2.css
- src/renderer/crm/client-list-quick-v2.css
- src/renderer/crm/client-projects-v2.css
- src/shared/clientEngagementPresentation.test.ts
- src/shared/clientEngagementPresentation.ts

Lot Sites&Pages séparé : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ux-home-shell-lot1-20261103, branche codex/ux-v2-sites-pages-lot2-20261103 ;11fichiers suivis modifiés et6non suivis constatés en lecture seule. Ils couvrent notamment PROJECT_STATUS, roadmap Bridge, reprise UX, services/composants Sites&Pages, scripts et tests dédiés. Aucun fichier de ce worktree n’est touché. Les autres worktrees restent hors intervention. Captures et sorties déjà présentes dans outputs ne sont ni supprimées ni régénérées ; elles sont ignorées par Git et ne sont pas comptées dans les31fichiers non suivis.

Nouveau point indispensable : aucun nouvel identifiant CLIENT-19 nécessaire à ce stade. Les constats supplémentaires sont rattachés explicitement à01/02,06/12,17 et18 ; les vérifications complémentaires restent listées et ouvertes. Cela ne vaut pas abandon des réserves anciennes. Si l’étude détaillée d’un lot révèle un changement fonctionnel non couvert, le documenter avant développement et demander décision.

Prochaine action : Carlos examine la matrice, valide les arbitrages et l’ordre des sous-lots. Aucun développement de finition ne commence automatiquement. Aucun test, nouvelle capture, commit, push, PR, fusion ou remplacement de préproduction dans cette étape documentaire.


## 06/11/2026 — Historique Client V2 : refonte autorisée, revue graphique attendue

Consigne jointe et maquette autorisent la présentation du dernier onglet, sans reconstruction des journaux. Sources et clientHistory existants conservés ; aucune écriture ni agrégation intermodules.

- [x] ClientHistoryTab : en-tête/compteur des événements réellement chargés, recherche sur résumés/source/date affichés, filtre dynamique sur entityType réellement présent, chronologie verticale et cartes avec icônes, résumé enregistré inchangé, source réelle, date locale et date ISO exacte dans time/dateTime et infobulle. Consultation seule, aucun auteur ni métadonnée certifiée inventé.
- [x] Tri décroissant et dédoublonnage existants par ID conservés sans fusion sémantique ; les deux traces de conversion restent distinctes. Compteur — en lecture indisponible ; chargement/erreur/réessai, absence totale et résultat filtré vide distincts. Filtres gardés entre onglets et réinitialisés au changement de client. Résumé inchangé : mêmes trois événements récents.
- [x] Navigation limitée aux types d’entités déjà pris en charge et identifiant non vide, jamais déduite du résumé ou des métadonnées. Pas de lien vers le Client actuellement ouvert. Fixture : liens Ouvrir le prospect vers l’ID du prospect enregistré, y compris pour l’action (pas de faux lien vers l’action).
- [x] Typecheck réussi et six tests existants clientPresentation (dont dédoublonnage par ID, traces distinctes et lectures partielles). Quinze contrôles Electron ciblés + trois de démarrage : IDs/résumés/dates/ordre, deux conversions, recherche, filtre source et conservation, transmission exacte du prospect (événement intercepté dans le banc), absence de lien redondant Client, trois récents du Résumé, source vide/filtre vide, erreur/réessai, largeur et dimensions/zoom ; zéro erreur renderer. Réponses vides et erreur IPC Historique TEST indisponible simulées seulement en mémoire, puis lecture réelle rétablie. Aucun test global.
- [x] Capture finale Electron inspectée : outputs/client-history-v2-1920x1080.png, TEST Client et historique conservé, Noir/Confort1920×1080 zoom100 ; quatre événements existants, aucun créé. Base schéma80 ouverte en lecture seule sans initialize/migration, empreinte inchangée et TEMP nettoyé.
- [x] CLIENT-01 à CLIENT-18 synchronisés : lignes01–17 et statuts intégralement préservés,18ajouté comme étude reportée. CLIENT-14 Documents reste validé ;15/16/17 et contrôle des périodes de maintenance réelles conservés. Aucun report développé.
- [x] Validation graphique Carlos reçue ; préparation documentaire de la consolidation globale autorisée, développement de finition non commencé.

Écarts assumés : résumés exacts conservés au lieu des reformulations illustratives ; badge Prospect pour l’action portée par une entité prospect, sans fausse source Action. Liens explicites vers le prospect ajoutés seulement lorsqu’une destination réelle existe. Aucune prétention à un historique exhaustif ou certifié ; journaux détaillés Devis/Contrats/Projets/Interventions non agrégés. Volets étroits non modifiés (CLIENT-17).

Fichiers : ClientsPage.tsx (raccord, erreur localisée et retrait du rendu Historique remplacé), nouveaux ClientHistoryTab.tsx, client-history-v2.css et scripts/check-client-history.cjs ; présent suivi. Autres onglets, Résumé, Associations, brouillons/préférences et travaux locaux/Sites&Pages préservés. Aucun commit/push/PR/fusion. Prochaine action : revue visuelle humaine ; aucune finition générale implicite.


## 06/11/2026 — Documents validé visuellement ; Historique en étude seule

Carlos valide Documents sans nouvelle correction graphique ; fonctionnalités/protections conservées. CLIENT-14 réalisé et validé visuellement, réserves fonctionnelles de CLIENT-16 maintenues ; CLIENT-15 toujours reporté. Ajout CLIENT-17 pour la lisibilité/adaptation du volet Identité, sans développement. Le contrôle des périodes réelles de maintenance reste ouvert. Historique : lecture/capture uniquement avant validation d’une maquette, aucun développement autorisé.

Seul le présent suivi est modifié ; CLIENT-01 à CLIENT-13 et CLIENT-15/16 inchangés. Aucun changement de code, journal, donnée, préférence, fixture ou autre travail local. Aucun commit/push/PR/fusion. Prochaine action : préparer puis valider la maquette Historique avant développement.


## 06/11/2026 — Documents Client V2 : présentation autorisée, validation graphique attendue

Consigne jointe et maquette reçues ; référence de composition uniquement. ClientDocumentsPanel et son style local refondus sans modifier le moteur documentaire, les services ou les règles de suppression.

- [x] Titre/compteur réel, trois indicateurs total/non archivés/archivés obtenus par la lecture existante list(clientId,true). Recherche titre/nom de fichier et filtre de consultation par catégorie en mémoire, indépendants de la catégorie du prochain import. Option Afficher les archives inclut les documents actifs et archivés ; compteurs globaux non affectés par les filtres. Aucun compteur Protégé ou commande décorative.
- [x] Tableau compact, titre et nom physique séparés, vraie catégorie, conservation renseignée ou absence explicite, état d’archivage distinct de présence du fichier. Ouverture empêchée si fichier manquant ; aucun SHA assimilé à une signature. Défilement horizontal contenu si le centre est étroit ; nombreux documents pris en charge par le défilement existant. Structure commune et préférences de largeur non modifiées.
- [x] Import multiple via le même handler, ouverture fichier/dossier client, modification titre/conservation par prompts, archivage/restauration et suppression d’archive via la confirmation native existante conservés. Relecture complète après action pour garder les archives et compteurs cohérents. Verrou d’action de présentation, erreurs capturées et réponses de chargement périmées ignorées ; aucun nouveau changement métier.
- [x] Typecheck réussi ; sept tests existants ClientDocumentService réussis dans leurs espaces temporaires (protections devis, factures/historique, SHA modifiée, suppression autorisée et rollback métadonnées/archives). Dix-huit contrôles Electron ciblés + trois de démarrage réussis : recherche/filtres, distinction import, conservation entre onglets, identifiants fichier/client, paramètres d’import/édition/archivage/restauration, annulation de suppression, fichier absent, archives, erreur/réessai, largeur contenue et dimensions/zoom. Cas indisponible/archivé et actions simulés uniquement en mémoire par IPC ; aucun écrit sur la recette. Erreur IPC Lecture documentaire TEST indisponible volontaire, zéro erreur renderer.
- [x] Capture finale inspectée : outputs/client-documents-v2-1920x1080.png, Electron1920×1080 Noir/Confort zoom100, TEST Recette RGPD croisée, fichier existant Accord RGPD signé classé Juridique (titre sans preuve de signature),1non archivé/0archivé. Base schéma80 existante en lecture seule sans initialize/migration, empreinte inchangée ; TEMP nettoyé. Aucune donnée ou document créé pour la capture.
- [x] Registre CLIENT-01 à CLIENT-16 synchronisé : lignes01–13 et statuts inchangés,14réalisé techniquement/en attente visuelle,15reporté,16réalisations et limites de vérification explicites. Vérification des périodes de maintenance réelles toujours ouverte ; Associations/CLIENT-12 et redondance Projets/CLIENT-13 non traités.
- [x] Validation graphique Carlos reçue : Documents conservé sans correction supplémentaire ; étude Historique seule autorisée.

Écarts assumés : pas de compteur Protégé faute de qualification exposée ; état Non archivé distinct de Fichier présent plutôt que faux badge Actif. Catégorie réelle Juridique, pas Autres de la maquette ; choix d’import clairement séparé. Bouton Ouvrir le dossier client conservé globalement sans doublon à chaque ligne. Prompts natifs laissés sous CLIENT-15 ; paramètres testés avec prompts remplacés temporairement dans le banc, pas d’harmonisation précipitée. Aucun aperçu/versionnement/téléchargement dédié ni signature inventé.

Fichiers de cette passe : src/renderer/crm/ClientDocumentsPanel.tsx ; nouveaux ClientDocumentsPanel.css et scripts/check-client-documents.cjs ; présent suivi. Autres travaux Client V2, brouillons/préférences, Sites&Pages et fichiers locaux non suivis préservés. Aucun commit/push/PR/fusion. Prochaine action : revue graphique humaine, Historique non commencé.


## 05/11/2026 — Interventions validé graphiquement ; Documents en étude seule

- [x] Carlos valide visuellement Interventions et maintenance ; aucune correction graphique supplémentaire. Documents : inventaire et capture seulement, aucun développement autorisé.
- [ ] Vérifier ultérieurement le parcours avec périodes de maintenance réelles, absent de la fixture actuelle ; cette limite reste ouverte.
- [ ] Piste de finition : pertinence d’un aperçu d’expiration des packs dans la fiche Client. Fonction déjà présente dans OperationsAlertService (hour_pack_expiring, seuil réglable14jours par défaut, critique à3jours ou moins), exposée par OperationsAlertsPanel dans le module global ; aucune duplication ni intégration Client développée ici.
- [x] Capture Documents existants en lecture seule : outputs/client-documents-current-1920x1080.png,1920×1080 Noir/Confort zoom100. Fixture TEST Recette RGPD croisée (livraison60c65a2b, schéma80) : un document Juridique existant intitulé Accord RGPD signé, fichier présent ; le titre ne certifie pas une signature. Atelier des Fleurs ne possède aucun document ; les recettes compatibles consultées n’en possèdent pas plusieurs. Ancienne base schéma71 non migrée. Empreinte SQLite inchangée, zéro erreur renderer, aucun test nouveau.

CLIENT-01 à CLIENT-13 préservés intégralement, Associations inchangé (CLIENT-12 reporté). Aucun code, donnée ou fixture modifié ; seul ce suivi est actualisé. Aucun commit/push/PR/fusion. Prochaine action : conception puis validation d’une maquette Documents avant développement.


## 05/11/2026 — Interventions Client V2 : refonte autorisée, revue graphique attendue

Consigne utilisateur jointe lue ; référence ergonomique validée, aucune donnée de maquette injectée. Développement limité à ClientOperationsTab et son style existant ; module Opérations, services et règles métier inchangés.

- [x] En-tête Interventions et maintenance, quatre compteurs exacts, cartes avec statuts français, projet/nœud, dates renseignées, temps enregistré et accès au dossier exact. Vue d’ensemble montrant les catégories non vides et navigation fonctionnelle vers les quatre catégories, y compris vides ; catégorie conservée entre onglets, réinitialisée au changement de client.
- [x] En cours = in_progress ; À planifier = to_plan ; Terminées = completed. Packs actifs selon état active déjà calculé en lecture par HourPackService (solde/expiration/suspension), sans nouveau calcul métier ; archives exclues des comptes actifs. Maintenances : total des souscriptions dans la navigation, nombre au statut Actif explicité dans la section.
- [x] Quatre services initiaux conservés ; lecture des périodes maintenance existantes ajoutée sans génération. Périodes opérationnelles repliables avec usage enregistré, chargement annulé ignoré et erreurs partielles/réessai explicites. Aucun prix, condition, renouvellement ou montant facturé recopié. Consommation du pack issue de consumedSeconds, distincte du temps de l’intervention. Liens d’origine présents seulement si identifiants disponibles.
- [x] Typecheck réussi ; deux tests déterministes ciblés des compteurs (tous états et archives). Onze contrôles Electron spécifiques + trois de démarrage : données/statuts, compteurs, catégories vides, conservation entre onglets, transmission exacte intervention/pack (interception de l’événement uniquement dans le banc), erreur de lecture volontaire sans anciens résultats/zéros trompeurs et réessai, largeur des cartes, dimensions/zoom, zéro erreur renderer. Le message IPC Lecture TEST indisponible est attendu dans cette vérification. Aucun audit/suite globale.
- [x] Une capture finale inspectée : outputs/client-interventions-v2-1920x1080.png, TEST Atelier des Fleurs, Noir/Confort1920×1080 zoom100. Intervention réelle INT-2026-001 En cours,0min, début04/11/2026 ; pack10h restantes, consommation0min, expiration09/11/2026. Base existante schéma80 ouverte en lecture seule sans initialize/migration ; empreinte inchangée, TEMP nettoyé. Aucune donnée/fixture créée.
- [x] Registre synchronisé CLIENT-01 à CLIENT-13 : entrées01–11 intégralement conservées, ajouts12/13 reportés, aucun point traité dans cette passe.
- [x] Validation visuelle Carlos reçue : Interventions et maintenance conservé sans nouvelle correction graphique.

Écarts/limites de vérification : Vue d’ensemble ajoutée pour présenter intervention et pack ensemble tout en conservant les quatre catégories ; pas de faux liens Voir tous. La fixture ne contient ni maintenance ni demande : la navigation vers leurs états vides est vérifiée, mais pas un parcours maintenance réel avec périodes. Pas de nouveau report fonctionnel nécessaire. Autres travaux Client V2, préférences/brouillons, Associations et Sites&Pages préservés. Aucun commit/push/PR/fusion.

Fichiers de cette passe : src/renderer/crm/ClientOperationsTab.tsx, ClientOperationsTab.css ; nouveaux ClientOperationsTab.test.ts et scripts/check-client-interventions.cjs ; présent suivi. Prochaine action : revue visuelle humaine avant Documents.


## 05/11/2026 — Projets validé visuellement ; étude Interventions seule

Carlos valide visuellement Projets (indicateurs, cartes, statuts, filtres, ouvertures), sans nouvelle correction. Développement Interventions non autorisé : inventaire et capture uniquement avant maquette.

- [x] Inventaire ciblé ClientOperationsTab : quatre lectures client, archives incluses, demandes/interventions/maintenance/packs ; indicateurs, états vides, erreur/réessai et actualisation ; ouvertures exactes via openEntity et cibles OperationsPage. Aucun formulaire/chrono/changement de statut dans cet onglet.
- [x] Modèles/services vérifiés : projet/nœud, demande source, période maintenance/souscription, pack ; dates prévues/début/fin, temps réel par sessions, estimation/référence, prise en charge et montants théorique/facturable. Pas de champ technicien/responsable dans Intervention. Suivi détaillé/chrono/conclusion dans le module Opérations, pas dans Client ; facturable ne signifie pas facturé.
- [x] Attention pour la maquette : KPI Interventions en cours compte toutes les interventions ouvertes, dont À planifier/Planifiée/Attente/Bloquée/À valider ; Maintenances inclut suspended ; Packs actifs inclut exhausted/suspended. Ne pas traduire ces comptes comme des états exacts sans revoir la présentation. Statuts techniques bruts et CSS de7–9px, grille deux colonnes pour trois cellules, boutons sur ligne suivante : ergonomie à concevoir, non corrigée ici.
- [x] Capture Electron réelle outputs/client-interventions-current-1920x1080.png,1920×1080 Noir/Confort zoom100, fixture existante TEST Atelier des Fleurs : une intervention in_progress,0min, sans projet, et un pack10h. Pas de fixture actuelle compatible avec plusieurs interventions trouvée dans les recettes consultées ; ancienne recette schéma71 non migrée. Capture avec code courant, base schéma80 ouverte en lecture seule sans initialize ; empreinte inchangée, zéro erreur renderer. Aucun nouveau test ni donnée créée.

Contrats conserve les engagements, ventes/souscriptions/packs et historique contractuel ; Interventions doit privilégier suivi opérationnel et temps, sans dupliquer la synthèse contractuelle. CLIENT-01 à CLIENT-11 intégralement conservés sans changement de statut. Aucun composant, fixture ou règle métier modifié ; seul présent suivi actualisé. Autres travaux locaux/Sites&Pages préservés. Aucun commit/push/PR/fusion. Prochaine action : concevoir puis valider la maquette Interventions avant développement.


## 05/11/2026 — Projets Client V2 : présentation autorisée, revue visuelle attendue

- [x] ClientProjectsTab raccordé aux résumés/services/handlers existants : titre, compte réel, indicateurs, cartes compactes, nature commerciale, statut français, archivage, progression réelle, type traduit, dates renseignées et devis source exact. Aucun changement du module Projets ou de la structure commune.
- [x] En cours = strictement in_progress hors archives ; aucun legacy/to_prepare promu actif. Terminés/archivés sans double compte. Filtres rapides et sélecteur pour tous les états (attente client, blocage, validation inclus). Filtre conservé entre onglets et réinitialisé au changement de client ; chargement, erreur/réessai, vide total et vide filtré distincts.
- [x] Typecheck réussi. Contrôles Electron ciblés : données/traductions/avancement, compte En cours, filtrage vide et À préparer, filtre entre onglets, transmission de l’identifiant exact (événement intercepté seulement dans le banc), largeur des cartes, dimensions1920×1080/zoom100, zéro erreur renderer. Pas de campagne globale ; TEMP nettoyé.
- [x] Capture inspectée : outputs/client-projects-v2-1920x1080.png, Noir/Confort, deux projets du client TEST — Atelier des Fleurs existant, tous deux À préparer et0%. Base SQLite en lecture seule, sans initialize/migration, empreinte identique avant/après. Aucune donnée créée.
- [x] Validation visuelle Carlos reçue ; présentation Projets conservée.

Écarts : En cours remplace Actifs pour respecter le statut exact ; sélecteur supplémentaire pour couvrir tous les états. Dates absentes et aucun devis source sur ces deux dossiers ; aucune valeur illustrative ajoutée. Avancement = tâches/checklists obligatoires terminées, pas temps consommé. Aucun nouveau report nécessaire ; CLIENT-01 à CLIENT-11 conservés sans modification de leurs statuts. Contacts/Commercial/Contrats/Résumé/Associations/liste/synthèse/Sites&Pages et autres fichiers locaux préservés. Aucun commit/push/PR/fusion.

Fichiers : ClientsPage.tsx (raccord et erreur localisée), nouveaux ClientProjectsTab.tsx, client-projects-v2.css, scripts/check-client-projects.cjs ; présent suivi. Prochaine action : revue humaine de la capture ; Interventions non démarré.


## 05/11/2026 — Contrats : vérifications finales ciblées ; Projets : étude seule

Carlos retient l'architecture Contrats sous réserve des trois vérifications. Aucun nouveau développement Projets autorisé.

- [x] Jalons : source et libellé Jalon prévu distincts des fins de suivi et périodes ; aucune assimilation au renouvellement/résiliation/fin d'engagement. Contrôle ciblé confirmé ; aucun changement de règle.
- [x] Un seul problème corrigé : préciser l'unité des prix lorsqu'elle est connue. Souscription manuelle : prix par période du plan avec cadence explicite (mensuelle/trimestrielle/annuelle). Vente multi-périodes : Total vendu · N périodes de facturation selon la politique et la quantité réelles, sans division. Sans unité fiable : prix enregistré neutre. CLIENT-08 reste partiel pour toute agrégation.
- [x] Défilement : accès confirmé à Documents/preuves, Autres engagements sans suivi, Historique et Services complémentaires. En-tête dégagé, navigation inchangée. Pas de nouvelle retouche du cadre.
- [x] Typecheck et4tests de projection réussis (dont unités et multi-périodes),8contrôles Electron ciblés +6du banc (14total), zéro erreur renderer. TEMP nettoyé. Aucun audit/campagne exhaustive.
- [x] Projets inventorié en lecture seule : liste filtrée clientAccountId, archives incluses, ordre création décroissant ; nom/état commercial/statut brut/avancement, ouverture exacte Projet et Devis source. ProjectSummary fournit aussi numéro/type/dates/montants/estimation, non affichés actuellement. Dossier Projet porte phases/nœuds/actions, sites/pages, prérequis, prestations/contributions issues des lignes du devis et temps par projet/nœud. Pourcentage basé sur éléments requis terminés, pas sur temps consommé. Aucun bouton d'édition/création/chrono/phases dans l'onglet Client actuel.
- [x] Capture Electron réelle Projets : `outputs/client-projects-current-1920x1080.png`,1920×1080 Noir/Confort zoom100. Atelier Horizon de la fixture existante ne possède aucun projet ; état vide montré sans fabriquer de projet pour la capture.

Diagnostic ergonomique Projets : titre générique, état vide minimal ; en présence de dossiers, référence/nom/état commercial/statut technique/avancement peu hiérarchisés, dates et contexte absents, actions non regroupées. Prochaine action : concevoir/valider la maquette Projets avant développement. CLIENT-01 à CLIENT-11 intégralement conservés ; pas de nouveau point reporté ajouté à ce stade. Contacts/Résumé/Associations/Commercial/liste/synthèse/Sites&Pages et brouillons/préférences préservés. Aucun commit/push/PR/fusion.

Fichiers de correction Contrats : shared/clientEngagementPresentation.ts et son test ; fixture client-contracts-scenarios.cjs (contrôles et capture Projets) ; présent suivi. Aucun composant Projets modifié.


## 05/11/2026 — Contrats et prestations : vue de consultation finalisée pour revue

Consigne jointe et registre utilisateur `AtoumWeb_Client_V2_registre_actualise_Contrats_2026-11-05.md` lus. Le visuel guide la composition, aucune donnée de maquette n'est injectée ; Contrats ne reproduit plus la liste Commercial.

- [x] Projection en lecture seule des souscriptions (y compris manuelles), packs, interventions liées aux ventes opérationnelles et lignes de devis acceptés. Une souscription partagée avec compléments reste un seul suivi, toutes les lignes sources restent accessibles. Lignes acceptées sans objet opérationnel dans un bloc distinct, sans état Actif inventé.
- [x] Début/fin enregistrés, cadence service et facturation distinctes, prix du suivi et montant total de ligne explicitement sourcés. Aucune division/agrégation mensuel-annuel ni déduction de fin depuis l'acceptation. Aucune somme assimilée à de l'encaissé.
- [x] Échéances issues des fins enregistrées, périodes existantes et jalons contractuels renseignés ; nature affichée (fin suivi, expiration pack, fin période opérationnelle, jalon), dates passées signalées. Aucun renouvellement automatique. Conditions enregistrées consultables sur les suivis ayant une origine devis et des paramètres revus/applicables.
- [x] Pièces et attestations via quotePreparation.get ; devis accepté, attestation d'acceptation, document rattaché et signature non établie distingués. Ouvertures existantes vers les preuves/documents, gestion détaillée dans Devis. Pas de PDF fabriqué ni de preuve de signature déduite du rôle accepted_pdf.
- [x] Historique terminé/archivé/expiré/épuisé et besoins réellement liés consultables. Les besoins sont présentés comme enregistrés et à qualifier, pas automatiquement complémentaires ou non couverts. Aucun bouton Ajouter une proposition.
- [x] Lecture partielle/erreur/réessai explicites ; compteurs — si source indisponible. Chargement seulement lorsque Contrats est actif ; résultats annulés ignorés. Panneau long contraint au défilement central pour conserver en-tête/onglets accessibles, ajustement limité à Contrats.
- [x] Typecheck réussi ;3tests déterministes de projection (souscription commune sans double compte, lignes sans suivi sans date fabriquée, propositions non acceptées exclues/historique/prix zéro),6contrôles Electron ciblés +6du banc (12total), zéro erreur renderer et TEMP nettoyé. Contrôle de relecture sans duplication après changement d'onglet et attestation distincte d'une signature. Aucune suite globale.
- [x] Capture Electron finale inspectée : `outputs/client-contracts-services-v2-1920x1080.png`, Atelier Horizon sur fixture TEST existante, Noir/Confort1920×1080 zoom100. Maintenance manuelle49€ par période de plan, début15/10/2026, facturation non renseignée ; ligne acceptée699€ sans suivi ; jalon Livraison existant de la fixture01/01/2027. Aucun hébergement149€, fin ou renouvellement de la maquette ajouté.
- [ ] Validation visuelle Carlos ; Projets ne démarre qu'après validation.

Limites restantes : pas de workflow renouvellement/résiliation ; pas d'agrégation récurrente ; pas de qualification automatique des besoins ; aucune signature certifiée si la source ne l'établit pas. Les conditions de renouvellement ne sont pas reconstruites depuis des clauses textuelles. Les interventions non liées à une ligne vendue restent dans leur onglet métier, sans promotion en prestation vendue. Associations, liste/synthèse, Contacts, Commercial, Résumé et Sites&Pages préservés. Aucun commit/push/PR/fusion/migration/base utilisateur.

Fichiers de cette passe : ClientContractsPanel.tsx, raccord ClientsPage.tsx ; nouveaux client-contracts-v2.css, shared/clientEngagementPresentation.ts et son test ; scripts/check-client-contracts.cjs et scripts/fixtures/client-contracts-scenarios.cjs ; présent suivi.

### Registre CLIENT-01 à CLIENT-18 synchronisé

Source utilisateur reçue le05/11 ; identifiants et décisions préservés. Les états ci-dessous distinguent réalisation technique et validation graphique. Les entrées historiques du présent fichier restent intégralement conservées.

| ID | Zone | Point | Statut / condition de clôture |
| --- | --- | --- | --- |
| CLIENT-01 | Contacts | Vérifier « Principal » / « Contact principal » : rôle métier versus désignation du contact principal. | Correction ergonomique réalisée : un seul badge Contact principal quand role=primary et isPrimary concordent ; autres rôles/incohérences non masqués. Service et données inchangés, invariant des rôles/coordonnées vérifié en fixture. Validation humaine de finition attendue. |
| CLIENT-02 | Contacts | Vérifier les accès « Gérer les coordonnées » / « Modifier les coordonnées ». | Correction ergonomique réalisée : commande Gérer les coordonnées redondante retirée ; summary Modifier les coordonnées conservé comme accès unique au panneau avancé existant. Ouverture clavier native vérifiée, aucune duplication d’éditeur ni modification de sauvegarde. Validation humaine de finition attendue. |
| CLIENT-03 | Commercial | Créer un devis depuis la fiche Client avec rattachement automatique fiable. | À arbitrer/développer ; aucun bouton factice ; fiabilité du parcours Devis à démontrer. |
| CLIENT-04 | Commercial | Définir les indicateurs « À traiter » et « Clôturés ». | À arbitrer ; aucune catégorie calculée arbitrairement. |
| CLIENT-05 | Résumé | Supprimer les redondances inutiles entre « Prestations et suivi commercial » et Associations. | Synthèse ergonomique réalisée avec situations déjà fiables : propositions draft/sent/viewed, nombre de devis acceptés explicitement nommé, maintenance au statut Actif et accès client Commercial/Contrats/Projets. Listes devis/projets répétées et boutons globaux retirés ; aucun total financier ni prestation déduite du sujet. Validation humaine de finition attendue. |
| CLIENT-06 | Contrats | Unifier la lecture des engagements acceptés, ventes par ligne, souscriptions/services opérationnels et périodes. | Projection consultative existante conservée. Correction de cohérence droite réalisée : catégorie renommée Devis acceptés, même source et mêmes liens. Consolidation fonctionnelle des engagements et vérification avec périodes réelles restent ouvertes ; aucun nouveau compteur/agrégat créé. |
| CLIENT-07 | Contrats | Workflow de renouvellement, accord exprès, préavis, résiliation, prochaines échéances contractuelles. | À arbitrer/développer ultérieurement ; affichage maintenant seulement si les données et échéances sont explicites et vérifiables. |
| CLIENT-08 | Contrats | Synthèse des montants initiaux et récurrents, multi-périodes et règles d'agrégation. | Partiel réalisé : montants sourcés par ligne et suivi, cadence et facturation distinctes lorsqu’elles sont connues ; aucun total récurrent ni division. Agrégation multi-périodes toujours reportée. |
| CLIENT-09 | Contrats | Services complémentaires à proposer : besoin/proposition existants vs suggestion nouvelle. | Partiel réalisé : lecture des besoins liés existants, avec avertissement de qualification ; propositions non acceptées accessibles dans Commercial. Aucun moteur, bouton d’ajout ou opportunité déduite. Parcours à concevoir reporté. |
| CLIENT-10 | Contrats | Distinguer devis accepté, acceptation attestée, document rattaché et PDF effectivement signé. | Réalisé en consultation : devis accepté / attestation / pièce rattachée distingués ; signature non affirmée ; gestion détaillée et ouverture de pièces via Devis. Validation visuelle attendue. |
| CLIENT-11 | Contrats | Lignes vendues sans objet opérationnel, ventes historiques non couvertes, historique des arrêts. | Partiel réalisé : lignes acceptées sans suivi listées et sourcées ; historique des états terminés/archivés disponible sans cause inventée. Historique unifié des arrêts reste limité aux sources existantes. |
| CLIENT-12 | Finition Client | Éviter les doublons de navigation entre l’onglet central actif et sa catégorie dans Associations, en conservant accès manuel et liens existants. | Correction ergonomique réalisée : catégorie de l’onglet central actif repliée par défaut ; l’utilisateur peut ouvrir/replier et son choix reste prioritaire pendant la consultation, y compris après rafraîchissement. Catégories et liens conservés ; Contrats renommé Devis acceptés. Validation humaine de finition attendue. |
| CLIENT-13 | Projets | Évaluer la redondance entre filtres rapides et sélecteur d’état. | Correction ergonomique réalisée : sélecteur unique couvrant les sept statuts opérationnels et Tous les états, archives conservées. Même état de filtre entre onglets, réinitialisé au changement de Client ; calcul de progression inchangé. Validation humaine de finition attendue. |
| CLIENT-14 | Documents | Refonte Documents : recherche, filtre, compteurs, présentation et actions. | Réalisé techniquement : tableau V2, titre/nom de fichier, trois compteurs globaux, recherche et filtre de consultation distinct du choix d’import, archives et actions existantes. Validation graphique Carlos reçue le06/11/2026 ; réserves fonctionnelles restantes de CLIENT-16 conservées. |
| CLIENT-15 | Documents | Harmonisation des éditeurs de titre et conservation. | Adaptation locale réalisée : éditeur V2 titre/date/motif remplace les prompts, réutilise useUnsavedDraft et confirmations existantes. Enregistrer/Annuler/Rester/Quitter, brouillon entre onglets et champ non édité conservés ; tests de confirmation simulée et vraie sauvegarde en fixture temporaire. Recette native Windows résiduelle CLIENT-16 et validation humaine restent ouvertes. |
| CLIENT-16 | Documents | Exactitude des états de disponibilité, empreinte et protections documentaires. | États fichier présent/introuvable et archivage distincts ; aucun badge Protégé ou signature déduit. Sept tests existants du service réussis, dont protections devis/factures/historique et empreinte modifiée ; cas UI manquant/archives vérifiés par projections IPC temporaires. Ouvertures système et dialogues natifs non rejoués réellement sur la base utilisateur ; vérification manuelle reste possible. |
| CLIENT-17 | Finition Client | Lisibilité et adaptation du volet Identité : minima de largeur, noms/rubriques/boutons, responsive et préférences enregistrées. | Adaptation d’affichage réalisée dans le cadre commun Client : minima300/240px sur espace suffisant, centre au moins640px sinon mode compact ; anciennes préférences non réécrites automatiquement. Drag/clavier/repli/préférences récentes et brouillons vérifiés. Capture320/1011/260px. Validation humaine de finition attendue. |
| CLIENT-18 | Historique | Étudier l’agrégation future des journaux métier activity_log avec l’historique Client. | Reporté à une étude distincte : sources, rattachements, doublons, conservation et accès exacts à définir ; aucune agrégation développée dans cette passe. |

Prochaine action : revue de la capture et des limites de consultation, puis seulement inventaire Projets autorisé séparément.


## 05/11/2026 — Onglet Commercial V2 : présentation autorisée

Visuel Commercial validé comme référence ergonomique ; aucun nouveau traitement métier ni réécriture Devis autorisé. Contacts reste référence provisoire ; distinction rôle Principal/contact principal et doublon de gestion coordonnées réservés à la finition, non modifiés.

- [x] Nouveau ClientCommercialTab raccordé à quotes/chargement/erreur/réessai existants. Titre Commercial — Devis, sous-titre, compte réel ; cartes compactes avec référence et objet séparés, badge français correspondant exactement aux sept statuts, montant réel contractValueCents (zéro affiché comme zéro), dates création/validité, référence Abby ou absence explicite. Aucun montant HT/TTC ou état inventé.
- [x] Indicateurs incontestables uniquement : total, Brouillons, Acceptés, Refusés. Aucun cumul arbitraire À traiter/Clôturés. Valeurs — en cas de chargement/erreur pour éviter des zéros trompeurs.
- [x] Filtre par statut exact et tri de création récent/ancien fonctionnels, sans écriture métier, état conservé entre onglets car composant toujours monté. Liste compacte et défilable par le conteneur existant, sans pagination fictive. Ouverture de chaque devis exact via AppButton/openEntity existants.
- [x] Chargement, absence totale de devis, résultat filtré vide et erreur/réessai disponibles. Erreur quotes affichée dans Commercial sans doublon du message global ; autres sections inchangées.
- [x] Typecheck réussi ;8contrôles Commercial +6du banc (14total) réussis : vrai statut distinct de l'objet, montant/total, filtre vide et état entre onglets, tris, erreur de lecture simulée sans faux total et réessai, ouverture exacte. L'erreur IPC TEST volontaire est distinguée d'une anomalie renderer ; zéro erreur renderer, TEMP nettoyé. Aucune suite globale.
- [x] Capture finale Electron inspectée : `outputs/client-commercial-v2-1920x1080.png`, Atelier Horizon, Noir/Confort1920×1080 zoom100. Données du dossier TEST existant (699€ et dates réelles de la fixture), non reprises de la maquette. Capture avant les ajouts techniques de test.
- [ ] Validation visuelle Carlos avant Contrats.

Arbitrages/écarts : À traiter et Clôturés exigent une définition métier ; non intégrés. Nouveau devis non ajouté : QuotesPage crée avec clientAccountId lorsque l'utilisateur choisit Client dans l'assistant, mais n'expose pas de paramètre de création pré-rattachée depuis cette fiche (initialId ouvre un devis existant, pas un client). Adapter ce parcours dépasserait la présentation autorisée. Aucun bouton décoratif ajouté. Rôles Commercial/Contrats/Associations conservés, aucune migration/base utilisateur modifiée.

Fichiers de cette passe : ClientsPage.tsx ; nouveaux ClientCommercialTab.tsx et client-commercial-v2.css ; scripts/check-client-commercial.cjs et scripts/fixtures/client-commercial-scenarios.cjs ; présent suivi. Contacts/Résumé/Associations/liste/synthèse/préférences/Sites&Pages et tous autres travaux locaux préservés. Prochaine action : validation de la capture et arbitrages éventuels, aucun développement Contrats implicite. Aucun commit/push/PR/fusion/remplacement de préproduction.


## 05/11/2026 — Onglet Contacts V2, refonte autorisée

Carlos valide Associations comme référence à conserver ; finition commerciale du Résumé différée et non développée ici. Nouvelle autorisation limitée à Contacts selon visuel joint, sans changement métier/base/shell.

- [x] Titre Contacts du client/compteur réel, ajout jaune, carte par personne : initiales/nom lisibles, fonction seulement si renseignée, badges rôle et contact principal distincts. Email/téléphone visibles avec icônes et liens réels ; aucun champ illustratif inventé.
- [x] Actions regroupées Modifier la personne / Gérer les coordonnées / Voir dans l'Annuaire. Handler d'édition existant conservé ; gestion ouvre le panneau ContactMethodsPanel existant, avec coordonnées supplémentaires/usages/moyens préférés/archivage inchangés. Action Définir principal conservée pour les autres personnes.
- [x] Formulaire existant conservé : choix explicite création ou rattachement depuis l'Annuaire via sélecteur groupé ; libellés Créer et rattacher / Rattacher la personne ; Annuler protégé ajouté. Champs/validations/sauvegarde/concurrence/guards existants inchangés. Aucune fonction/menu/rôle ajouté depuis l'image.
- [x] CSS strictement limité à Contacts dans la fiche agrandie Noir/Confort ; cartes moins imbriquées, tailles lisibles, actions adaptables selon largeur utile. Encadré explicatif distingue contact principal du client et moyens préférés.
- [x] Typecheck réussi.7contrôles Contacts +6contrôles de banc (13total) réussis, zéro erreur renderer : identité et coordonnées, gestion repliable, rattachement sans personne dupliquée, création persistée, brouillon entre onglets, rester sur confirmation de sortie, structure commune conservée. Fixture TEMP nettoyée. Un délai de rafraîchissement de création a été attendu explicitement dans le banc avant l'ouverture de l'éditeur ; aucun changement de handler.
- [x] Capture Electron finale inspectée : `outputs/client-contacts-v2-1920x1080.png`,1920×1080 Noir/Confort zoom100, Atelier Horizon/Camille Bernard. Capture avant les écritures de test pour garder la même fiche de référence.
- [ ] Validation visuelle utilisateur avant Commercial.

Fichiers de cette passe : ClientsPage.tsx ; nouveau client-contacts-v2.css ; scripts/check-client-contacts.cjs ; scripts/fixtures/client-contacts-scenarios.cjs ; présent suivi. Écarts : pas de fonction dans les données de Camille, donc aucune fonction affichée ; source de rattachement par sélecteur groupé existant plutôt que menu illustratif ; pas de menu supplémentaire à trois points. Liste/synthèse/Résumé/Associations/huit onglets/Sites&Pages préservés. Aucun commit/push/PR/fusion. Prochaine action : revue Carlos, aucune reprise Commercial implicite.


## 05/11/2026 — Associations Client : aperçus contextuels

Autorisation ciblée de remplacer les cinq boutons de navigation par des aperçus liés au Client, sans nouvelle règle métier.

- [x] Nouveau ClientAssociations : sections natives repliables, compteurs issus des listes réelles, deux dossiers maximum par aperçu, référence/nom/statut, ouverture exacte par openEntity. Priorité de présentation aux dossiers non terminés/non annulés ; ordre source conservé entre éléments équivalents. Accès liste complète via onglet existant seulement au-delà de deux éléments. Catégories vides repliées/discrètes et toujours découvrables. Échec/chargement affiche — et une indication, jamais un zéro trompeur.
- [x] Contrats = devis acceptés, conformément à ClientContractsPanel ; aucune entité contractuelle fictive. Documents = service clientDocuments.list(clientId,false), fichiers absents indiqués et ouverture désactivée. Pas de statut de traitement documentaire inventé : non archivé/introuvable seulement. Le callback facultatif de ClientDocumentsPanel actualise l'aperçu après import/édition/archivage/suppression, sans changer les handlers métier.
- [x] Panneau260px, redimensionnement/repli global, préférences, huit onglets et brouillons préservés. Centre inchangé ; liste/synthèse/Sites&Pages et autres travaux locaux conservés.
- [x] Typecheck réussi.11contrôles ciblés fiche/associations +6du banc =17réussis, zéro erreur renderer. Nouveaux contrôles : compteurs devis/intervention/contrat vide, ouverture du devis exact, repli conservé entre onglets. Le test d'ouverture a été adapté à la navigation réelle puis retour Client ; aucun handler produit contourné. TEMP nettoyé. Pas de suite globale.
- [x] Capture finale Electron inspectée : `outputs/client-expanded-v2-1920x1080.png`, Noir/Confort1920×1080 zoom100. Fixture avec1devis Brouillon,1intervention À planifier ;0contrat/projet/document réels pour ce dossier. Aucun remplissage fictif pour enrichir la capture.
- [ ] Validation visuelle Carlos.

Fichiers de cette passe : nouveau ClientAssociations.tsx ; raccord dans ClientsPage.tsx ; callback facultatif dans ClientDocumentsPanel.tsx ; styles client-expanded-v2.css ; fixture client-expanded-scenarios.cjs ; présent suivi. Prochaine action : revue visuelle utilisateur. Aucun commit/push/PR/fusion/remplacement de préproduction.


## 05/11/2026 — Ajustements ergonomiques fiche agrandie

Autorisation ciblée : mesurer puis équilibrer les zones et corriger le Résumé, sans nouvelle refonte ni changement métier.

- [x] Mesure Electron avant : identité320/centre1041/associations230px. Après :320/1011/260px. Onglets864,3px pour981px disponibles après ; huit visibles à1920×1080. Identité non réduite. Répartition par défaut uniquement : préférences enregistrées prioritaires ; largeur personnalisée280px testée avec identité320px. Repli/redimensionnement et responsive existants conservés.
- [x] Icônes adaptées contact/personne, téléphone, enveloppe email, localisation, calendrier/action, éclair/actions, historique. Nouveau ClientDetailIcon local à la fiche. Textes secondaires/dates renforcés.
- [x] Programmation unique dans le Résumé : accès central conservé, accès gauche masqué dans Résumé mais disponible dans les autres onglets pour éviter le retour préalable au Résumé. Même handler/éditeur/garde conservé.
- [x] Liens exacts devis/projets conservés au centre ; noms associés informatifs à droite avec accès aux onglets Client. Doublon de navigation Contrats central retiré, accès Association/onglet préservé. Raccourcis globaux explicitement libellés Tous les devis/Tous les projets, distincts des dossiers Client.
- [x] En retard · action ouverte affiché dans Résumé via isClientActionOverdue existant, projection CRM issue des seules actions ouvertes ; aucun statut/date/report modifié.
- [x] Typecheck réussi ;8contrôles Electron ciblés +6du banc (14total), zéro erreur renderer. Mesure initiale sans capture ; une capture après inspectée : `outputs/client-expanded-v2-1920x1080.png`. Aucune campagne générale/multi-résolutions. TEMP nettoyé.
- [ ] Validation visuelle finale Carlos.

Compromis : les anciennes largeurs personnalisées ne sont pas remplacées par260px ; onglets défilables/volets compacts et cartes empilées restent les adaptations existantes lorsque la largeur utile baisse. Les noms des associations se lisent au dépliage, sans dupliquer leurs boutons d'ouverture exacte présents au centre. Liste/fiche rapide/Sites&Pages et autres travaux locaux préservés. Aucun commit/push/PR/fusion. Prochaine action : revue de la capture par Carlos.


## 05/11/2026 — Fiche Client agrandie : reprise visuelle autorisée

Consigne jointe et visuel du 05/11 lus : périmètre fiche agrandie seulement, aucun changement métier/enregistrement/schéma/contrats, aucune publication.

- [x] Bandeau « Fiche client », retour à la liste et fermeture ; fiche positionnée sous l'en-tête commun et à droite du rail selon leurs dimensions réelles observées. Chrono/recherche restent visibles.
- [x] Volets par défaut320px identité /230px associations, via paramètres facultatifs de CrmRecordLayout ; aucune préférence enregistrée écrasée, autres appelants inchangés. Redimensionnement et repli existants conservés.
- [x] Identité/avatar renforcés, coordonnées lisibles et iconisées, ville issue de l'organisation réelle lorsqu'elle existe, actions rapides et téléphone clarifiés. Huit onglets présents sur une ligne à1920×1080 ; associations plus nettes, sans rupture du mot Interventions.
- [x] Résumé : cartes structurées, titres/icônes, liens devis/projets, activité récente et sections secondaires hiérarchisés. Données/handlers/onglets/détails gardés montés ; aucun compteur ni document inventé.
- [x] Typecheck réussi. Six contrôles Electron propres à la fiche + six contrôles du banc (12total) réussis, zéro erreur renderer : en-tête dégagé, largeur gauche, huit onglets entièrement visibles, navigation, brouillon conservé entre onglets, associations dans la fiche. Fixture TEMP nettoyée ; aucune campagne multi-résolutions.
- [x] Capture finale réelle inspectée : `outputs/client-expanded-v2-1920x1080.png`, Noir/Confort,1920×1080 zoom100. Aucune capture supplémentaire de volet nécessaire.
- [ ] Validation visuelle Carlos.

Fichiers de cette passe : ClientsPage.tsx, CrmRecordLayout.tsx, nouveau client-expanded-v2.css, scripts/check-client-expanded.cjs, scripts/fixtures/client-expanded-scenarios.cjs et présent suivi. Liste/fiche rapide et lot2 préservés ; les travaux précédents non commitées restent présents. Écart : largeur320/230 par défaut, anciennes largeurs personnalisées prioritaires ; visuel adapté aux contenus réels sans reproduire les données illustratives ni ajouter les raccourcis fictifs. Prochaine action : revue de la capture avant toute autre étape. Aucun commit/push/PR/fusion.


## 05/11/2026 — Présentation liste/synthèse retenue, deux vérifications ciblées

Carlos retient la présentation liste/fiche rapide sous réserve des deux vérifications suivantes ; aucune publication autorisée.

- [x] Agrandir et Ouvrir la fiche complète appelaient le même `onExpand` (`setLargeView(true)`). Doublon supérieur retiré, bouton principal inférieur conservé. Aucun autre changement de composition.
- [x] Source vérifiée : CrmService projette `nextActionAt/nextActionText` depuis `crm_actions status=open`, y compris les actions Prospect liées. Une action terminée/annulée ne contribue plus. Repère textuel « En retard » dans le tableau et « En retard · action ouverte » dans la synthèse si date valide strictement passée, selon la comparaison temporelle déjà utilisée en Prospection. Aucun statut, report ou écriture métier automatique.
- [x] Typecheck ;22tests ciblés (présentation Client + source unique CRM, dont transition terminée exclue) ;28contrôles natifs réussis, zéro erreur renderer, TEMP nettoyé. Dates future/absente/invalide/égale non signalées. Bouton inférieur ouvre toujours la même fiche et conserve le brouillon.
- [x] État actuel de la fiche agrandie capturé sans développement supplémentaire : `outputs/client-expanded-current-1920x1080.png`, Electron Noir/Confort 1920×1080 zoom100. Trois zones et huit onglets présents. Écarts constatés avec son visuel cible : absence de bandeau titre/commandes dédié, fiche recouvrant l'en-tête commun, volet identité étroit et petits textes, hiérarchie/espacements à reprendre. Aucun de ces points corrigé dans cette passe.

Prochaine action : montrer cette capture à Carlos puis attendre son accord avant toute reprise du développement de la fiche agrandie. Lot2, travaux locaux et checkouts historiques préservés ; aucun commit/push/fusion.


## 05/11/2026 — Lot structurel Clients V2 autorisé, livré à revue

Autorisation explicite des quatre axes, en un lot ; aucun commit/push/PR/fusion/remplacement de préproduction.

- [x] En-tête Client à deux rangées dans le flux : titre/compteur/création, puis recherche/statut/actualisation/personnalisation. Le titre shell reste dans le DOM pour les parcours existants et est masqué visuellement uniquement sur Clients Noir/Confort. Positions absolues supprimées.
- [x] `ClientQuickSummary` extrait : données/handlers existants, identité/statut/relation regroupés, une rangée de commandes, coordonnées simples, deux sections compactes, ouverture complète pleine largeur. AppButton pour les commandes et liens métier, OperationIcon réutilisé ; téléphone en SVG cohérent. Détails agrandis toujours montés, aucun contenu métier/éditeur/guard modifié.
- [x] Un seul ConfiguredDataTable, même scope et mêmes identifiants. Nouvelle option de présentation transitoire : coordonnées masquées à la sélection uniquement pour la vue standard sans préférence enregistrée. Personnalisation et largeur sauvegardées prioritaires. Portail facultatif pour placer les contrôles existants dans la barre Client sans recréer leur état ; comportement des autres appelants inchangé.
- [x] CSS liste/synthèse remplacé par une feuille consolidée : jetons communs, sélecteurs séparés des détails, couleurs active/inactive/archived distinctes. Les rares !important nécessaires contre les surcharges globales historiques sont conservés et identifiés ; pas de nouvelle accumulation par passage.
- [x] Typecheck réussi ; 27 tests ciblés table/largeurs/vues personnelles et 27 contrôles natifs réussis, zéro erreur renderer. Contrôles ajoutés : colonnes compactes par défaut, préférence explicite prioritaire, largeur300px conservée, en-tête pleine largeur. Brouillon et huit onglets toujours conservés. TEMP nettoyé, aucune base utilisateur touchée.
- [x] Deux PNG Electron réels 1920×1080 zoom100 Noir/Confort inspectés face à Option A : `outputs/client-option-a-list-1920x1080.png` et `outputs/client-option-a-quick-1920x1080.png`. Synthèse532px de haut (avant649,5), tableau1095px/panneau505px. Header structuré et coordonnées retirées du tableau compact par défaut ; footer complet pleine largeur.
- [ ] Validation visuelle humaine, distincte du résultat technique.

Écart de compatibilité retenu : email/téléphone restent sous l'identifiant historique `coordinates` dans la présentation détaillée ; pas de migration des vues ni de nouveaux identifiants risquant de modifier les préférences. Les vues déjà personnalisées peuvent donc conserver les coordonnées à la sélection. Autres différences avec la maquette : pas de filtre fictif, pagination, sélection multiple ou menu inventé ; vraies initiales sans logo, détail date client conservé, largeur de panneau mémorisée. Aucun nouveau fichier de données fictives ; fixture technique existante seule utilisée. Lot2 Sites & Pages, checkouts historiques et travaux locaux de la fiche agrandie préservés. Prochaine action : revue de la paire finale par Carlos, sans autre développement implicite.


## 05/11/2026 — Finition graphique Clients, rendu toujours soumis à validation

Nouvelle demande : non-validation graphique du précédent rendu ; finition ciblée sans changement métier ni fiche agrandie. Seul `client-list-quick-v2.css` modifié dans cette passe, en conservant tous les travaux locaux.

- [x] Personnalisation déplacée sur la ligne recherche/statut/actualisation, suppression de sa bande au-dessus du tableau ; création conservée à droite. Panneau de personnalisation ouvert en surimpression, commandes existantes conservées.
- [x] En-tête de tableau moins haut, bordures verticales atténuées, séparateurs horizontaux discrets ; avatars ronds avec initiales réelles, statuts verts contrastés, boutons de ligne encadrés et sélection marquée à gauche en jaune.
- [x] Synthèse : nom22px/avatar58px, coordonnées en carte, prochaine action en carte accentuée jaune, prestations en carte et liens sur surface distincte. Bouton de fiche complète jaune. Pas de données ni fonctionnalités ajoutées.
- [x] Une nouvelle paire Electron réelle 1920×1080 zoom100 produite et inspectée directement face à la maquette : `outputs/client-option-a-list-1920x1080.png`, `outputs/client-option-a-quick-1920x1080.png`. Tableau1095px/panneau505px ; synthèse649,5px contre671px précédemment. 23 contrôles natifs ciblés réussis, zéro erreur renderer ; pas de tests globaux, pas de nouveau typecheck nécessaire pour cette passe CSS seule.

Écarts restants : Coordonnées reste une colonne commune selon le schéma courant ; filtres illustratifs, cases de sélection multiple, pagination et menus supplémentaires non ajoutés. Largeurs mémorisées conservées (panneau plus large que celui illustré), avatar en initiales lorsqu'aucun logo réel n'existe. Le shell et le logo Manager actuels restent prioritaires. La mise en cartes est une adaptation du design cible et ne constitue pas une reproduction pixel à pixel. Validation humaine toujours attendue ; aucun commit/push/fusion, lot2 et worktree historique non touchés. Prochaine action : retour visuel de Carlos sur cette paire, avant toute autre étape.


## 05/11/2026 — Correction visuelle Option A, validation humaine requise

Retour utilisateur : premier rendu fonctionnel mais trop éloigné de la maquette ; correction autorisée liste/fiche rapide seulement, fiche agrandie inchangée dans cette passe, aucun commit/push/PR/fusion.

- [x] Synthèse rapide distincte du contenu détaillé : avatar/nom/statut, relation, raccourcis conditionnels et bouton Agrandir explicite ; coordonnées, prochaine action et aperçu des devis/projets liés. Contenus détaillés existants toujours montés et accessibles à l'agrandissement, sans réinitialiser les brouillons ni modifier le rendu interne de la fiche agrandie. Programmation et modification de relation ouvrent les éditeurs existants dans la fiche complète.
- [x] Hiérarchie de liste : compteur au-dessus de recherche/statuts/actualisation, création à droite ; personnalisation puis tableau. Lignes et en-têtes resserrés, alignements harmonisés ; colonnes/vues/largeurs enregistrées conservées. Aucun filtre ou compteur inventé.
- [x] Comparaison visuelle directe des rendus Electron avec la partie supérieure Option A et la précédente capture : disparition de la longue fiche comprimée, commandes visibles en tête, suppression du défilement d'onglets dans le panneau synthèse. Mesures à 1920×1080 zoom100 : tableau1095px/panneau505px, synthèse671px de haut, toutes ses sections visibles dans cette fixture. Les deux captures finales sont livrées, sans validation graphique automatique prétendue.
- [x] Typecheck réussi ; 23 contrôles natifs ciblés réussis, zéro erreur renderer, fixture TEMP nettoyée : pleine largeur/fermeture, accès personnalisation, huit onglets toujours montés, agrandissement et brouillon conservé, cas sans coordonnées, dimensions des deux PNG et absence de débordement global. Pas de suite complète ni audit global.
- [ ] Validation humaine de `outputs/client-option-a-list-1920x1080.png` et `outputs/client-option-a-quick-1920x1080.png`.

Limites : aperçu rapide limité aux deux premiers devis et au premier projet ; tous les éléments et fonctions restent accessibles via la fiche complète. Le panneau reste redimensionnable selon les préférences existantes ; un dossier plus fourni peut défiler. Autres thèmes, lot2 Sites & Pages, bases utilisateur et checkouts historiques préservés. Prochaine action : attendre le retour visuel de Carlos avant toute autre étape.


## 05/11/2026 — Clients V2, option A : liste et fiche rapide

Autorisation utilisateur : réaliser l'option A, sans commit/push/PR/fusion. Travail exclusivement dans le worktree Client indépendant ; adaptations locales antérieures de la fiche agrandie conservées, lot 2 Sites & Pages et checkouts historiques non modifiés.

- [x] Liste : tableau plein espace sans sélection, recherche/statuts et personnalisation colonnes/vues existantes conservés ; sélection et tableau harmonisés en Noir/Confort.
- [x] Fiche rapide : identité/statut/relation, coordonnées essentielles et prochaine action réelles ; raccourcis téléphone/email conditionnés aux données présentes, programmation existante ; prestations et huit onglets conservés, défilement vertical et accès à l'agrandissement.
- [x] Fermeture restitue la liste pleine largeur ; agrandissement/réduction conserve la sélection et les brouillons. Aucun changement des services ou règles d'enregistrement. Logo Accueil réutilisé sur Clients Noir/Confort ; autres thèmes inchangés par les styles de ce lot.
- [x] Typecheck ; 13 tests ciblés de présentation ; 20 contrôles App/preload/IPC natifs réussis, zéro erreur renderer, fixture TEMP nettoyée. Cas vide sans coordonnées, colonnes/vues, sélection, fermeture et brouillon contrôlés. Le premier essai natif attendait un dialogue de sortie de brouillon : réponse pilotée dans la seule fixture, protection produit conservée. Aucune suite globale.
- [x] Capture finale réelle 1920×1080 Noir/Confort : `outputs/client-option-a-1920x1080.png`, données TEST isolées. Correction du facteur système 150 % dans le banc pour obtenir les dimensions demandées ; une seule image finale livrée.
- [ ] Validation visuelle utilisateur de la liste/fiche rapide. Fiche agrandie et création/édition restent à valider séparément.

Écarts assumés : pas de filtres Type/Relation, pagination ou menu de ligne nouveaux depuis la maquette ; commandes et données existantes seulement. Huit onglets accessibles par défilement horizontal dans la fiche étroite ; contenu vertical défilant. Compteurs, précédent/suivant et menu Actions de la fiche agrandie toujours en attente d'arbitrage. Prochaine action : revue de la capture par Carlos, puis ajustements de cette vue avant de reprendre la fiche agrandie. Aucun commit/push/PR/fusion/remplacement de préproduction.


## 04/11/2026 — Client UX/UI V2 : reprise isolée et périmètre complet

- [x] Référence `9ca5a7ed` retrouvée ; worktree indépendant créé sous `C:/Users/AtoumWeb/.codex/worktrees/client-v2-ab-20261104/atoumweb-manager-ec04-validation`, branche `codex/client-v2-ab-20261104`. Checkout historique intact ; lot 2 Sites & Pages non commité laissé intégralement dans son worktree. Planche graphique ultérieure retrouvée dans `atoumweb-manager-ux-reference-20261104`, non importée.
- [x] Visuel cible reçu. Autorisation de développement A/B, sans commit/push/PR/fusion. Compteurs, précédent/suivant et menu Actions restent soumis à arbitrage.
- [x] Précision utilisateur : couvrir le parcours Client complet, mais préparer d'abord le plan liste + fiche rapide ; ne pas développer simultanément toutes les vues. Aucun nouveau test ni capture pour cette préparation.
- [ ] Premières adaptations locales de la fiche agrandie en cours : cartes Résumé, raccourcis disponibles, associations repliables. Non validées visuellement, non livrées. Premier typecheck : icône `phone` non reconnue, remplacée ; contrôle non relancé après la précision utilisateur. Aucune capture produite.

Architecture conservée : `ClientsPage` porte sélection, filtres et brouillons ; `ConfiguredDataTable` porte les colonnes/préférences ; `CrmRecordLayout` porte les volets et leurs largeurs ; `CrmIdentityAvatar`, `OperationIcon`, les éditeurs et gardes existants restent les sources communes. Ne pas modifier les règles métier ni créer de données pour le visuel.

Plan proposé, validations visuelles séparées : (1) liste Tous les clients : barre d'outils, hiérarchie du tableau, sélection, filtres et personnalisation existants ; (2) fiche rapide : identité/coordonnées prioritaires, boutons et accès à l'agrandissement ; (3) fiche agrandie : reprendre les adaptations locales et le visuel trois zones/huit onglets ; (4) création/édition : harmoniser les formulaires existants sans changer la sauvegarde. Styles limités à Client Noir/Confort ; ne retoucher le shell commun que si nécessaire. Écarts repérés dans le code : styles Client répartis entre plusieurs couches, barre de liste peu hiérarchisée, commandes de relation/fermeture/agrandissement regroupées dans l'identité, Résumé dense réutilisé dans le panneau étroit. Ce repérage ne constitue pas une recette visuelle.

Prochaine action : harmoniser d'abord la liste, puis la soumettre à validation visuelle avant la fiche rapide. Aucun audit global ni campagne de captures ; contrôles ciblés lors de chaque réalisation seulement.


## 03/11/2026 — UX lot 1 Accueil / en-tête / rail : rendu officiellement validé

Autorisation utilisateur : nouveau worktree `atoumweb-manager-ux-home-shell-lot1-20261103`, branche `codex/ux-v2-home-shell-lot1-20261103`, départ exact `8a24ae37d10573b7db54cc0268c6e9c0959e8532`. Autorisation initiale sans commit/push, complétée le 03/11 par la validation officielle du rendu et l’autorisation de commit/push sur la seule branche UX. Aucune fusion, modification de PR existante ou intégration à main. Le worktree a été créé avec Git après refus de rattachement du dépôt externe par l’outil desktop ; le checkout #165 reste intact.

- [x] Corrections locales : Temps & facturation selon la largeur de son propre bloc (valeurs nulles et non nulles), alertes ancrées sous l’en-tête mesuré, ligne supérieure optimisée à 125/150 %, personnalisation cohérente avec l’ordre affiché et les choix individuels, commandes contrastées / Échap / retour de focus, groupes du rail lisibles et repérage du groupe actif replié.
- [x] Marque : réutilisation du vecteur Accueil existant par cadrage, sans retracer la marque ni modifier les assets originaux. Variante Accueil uniquement ; symbole sans plaque limité à Noir/Confort. Les autres thèmes conservent leur symbole réduit existant.
- [x] Typecheck et 44/44 tests ciblés (4 fichiers). Recette native réelle App/preload/IPC sur profil/workspace TEMP neuf : 96/96 contrôles (90 du lot + 6 du banc), zéro erreur renderer ; intégrité/FK/registre 1–80 conformes et TEMP nettoyé. Lignes métier inchangées pendant les phases de présentation ; ajouts explicites de fixtures de temps/facturation et cycle du chrono TEST distingués. Tables contrats/Catalogue/RGPD/devis de la fixture inchangées.
- [x] Matrice comparable : 18 configurations Noir/Confort, 29 vues homologues + 13 complémentaires = 42 PNG après. Complément avant : cinq captures de la même fixture non nulle sur la source `8a24ae37` inchangée. Valeurs testées : 49,25 h (49,3 h affichées), 36,5 h facturables, 12,75 h non facturables, montant TEST 1 234 567,89 € (arrondi existant 1 234 568 €). Zéro collision textuelle locale mesurée sur la matrice et les cinq cas non nuls après ; anciens chevauchements reproduits avant. En-tête 82–83 px au lieu de 137 px sur les deux petits formats à 150 % / rail déployé.
- [x] Contrôles ciblés : personnalisation conservée après remount, Today monté pendant déplacement, garde UX01 Rester avec saisie exacte, chrono actif unique et dialogue de changement / Échap, alertes 1280/1366 à 150 %, repère du groupe actif. Échantillon fonctionnel Blanc/Confort, AtoumWeb/Confort, Noir/Compact et Noir/Confort+ ; aucune généralisation graphique ni certification exhaustive de ces variantes.
- [x] Validation officielle du rendu Accueil / en-tête / navigation par Carlos le 03/11/2026, après transmission du ZIP `AtoumWeb_Manager_UX_LOT1_AVANT_APRES_2026-11-03.zip` pour revue indépendante ; commit et push autorisés sur la seule branche UX. Typecheck, 44 tests ciblés et 96 contrôles natifs conservés, sans relance : seul le suivi documentaire change depuis le candidat validé.

Rapports/captures bruts locaux : `manager-ux-after-lot1-20261103-final` dans les artefacts de cette session ; banc reproductible `node scripts/check-home-shell-lot1.cjs` avec `ATOUMWEB_UX_LOT1_OUTPUT` vers un nouveau dossier absolu. Les essais de développement interrompus sont conservés dans le dossier de revue : préconditions de focus du banc et encodage du script corrigés, aucune assertion affaiblie. Aucun test contractuel/PDF complet ni suite exhaustive relancé.

Décision persistante : finaliser l’identité bleu nuit/jaune en **Noir / Confort**, écran par écran, avant toute déclinaison sur les autres thèmes. Leurs structures/fonctions restent préservées ; chantier de déclinaison seulement après validation explicite. Prochaine action après le commit/push autorisé du lot 1 sur la branche UX uniquement : attente d’un nouvel accord ; aucun lot 2 ni fusion implicitement autorisé.

## 02/11/2026 — Lanceur autonome de recette PR #161 + PR #164

Un portable Windows 11 strictement isolé a été préparé depuis `codex/rgpd-v3-site-agreements-20261101`. Il impose son propre `Profil-RECETTE`, son propre `Workspace-RECETTE` et le drapeau `--functional-recipe`; le titre et le bandeau jaune affichent en permanence « RECETTE / TEST ». La base dédiée contient uniquement les fixtures de convergence : clients/projet/site/devis fictifs, 118 propositions V3.7 et six propositions Catalogue toujours en brouillon, plus le parcours RGPD signé puis révisé. Aucun profil ou workspace utilisateur n'est consulté.

Le vrai `.cmd` a démarré le paquet Electron sous Windows ; contrôles CDP réussis sur le titre, le bandeau et le chemin exact du workspace isolé. La réinitialisation par double-clic a été testée : sauvegarde de la recette courante, restauration de la graine, intégrité SQLite et clés étrangères conformes. Typecheck et package réussis. [Procédure et protections](docs/ux-v2/RECETTE-FONCTIONNELLE-PR161-PR164-2026-11-02.md). Aucune base active, publication, fusion ou déploiement.

Le lanceur additionnel `RECETTE_AUTO.cmd` réutilise le pilotage CDP/Electron existant et produit un rapport HTML autonome. Exécution Windows réelle réussie : **27/27 contrôles**, navigation de 13 modules sans erreur renderer, **19 tests ciblés réussis / 1 intégration opt-in ignorée**, 118 clauses et six propositions contrôlées, parcours RGPD et empreintes vérifiés, **14 PDF / 199 pages / 0 page vide / 14 zones de signature**. Les pages 1 et les écrans importants sont capturés. Les empreintes des clauses/Catalogue publiés et devis acceptés restent identiques avant/après.

## 01/11/2026 — Bibliothèque V3.7 raccordée en brouillons

La bibliothèque Word V3.7 retenue par AtoumWeb remplace les propositions documentaires précédentes dans l'interface de convergence. Le référentiel structuré contient 118 clauses uniques ; 77 différences textuelles ou d'identité ont été relevées. La migration 79 versionne désormais le code et le public de chaque clause et conserve les anciens codes en alias lors d'une publication explicite. `BLOG-DONNEES → BLOG-ROLES-CONTENUS` et le public consommateur de `MARIAGE-PRIVE` restent donc sans effet sur les versions publiées tant que les brouillons ne sont pas publiés.

Les six plans Catalogue ont été alignés sur les décisions consolidées : sauvegardes o2switch Cloud sans copie indépendante AtoumWeb, maintenance mensuelle 49 €/99 €, fin avec période payée et préavis AtoumWeb de 30 jours, annuel ferme 12 mois sur accord exprès, Lune 149 €/an et transition sans double facturation. Recette SQLite isolée réussie : 118 brouillons contractuels, 6 brouillons Catalogue, idempotence et rollback conformes, historiques publiés inchangés. Typecheck et tests ciblés réussis. [Bilan du lot](docs/ux-v2/INTEGRATION-CONTRACTUELLE-V37-2026-11-01.md). Aucune base active, publication, fusion, PDF ou déploiement. Prochaine action : lot RGPD V3 séparé par client/site.

## 31/10/2026 — Migration 78 et préparation de fusion contrôlées

Reprise après synchronisation GitHub au commit `9274811c`. Migration 78, note/relecteur obligatoires et historique append-only inspectés. Cinq attentes de registre encore arrêtées à 77 ont été étendues à 78 ; la recette couvre désormais explicitement le rollback total d’une décision groupée dont la deuxième clause est inconnue. Typecheck réussi, **61/61 tests ciblés** et recette SQLite isolée **1/1** ; note vide sans écriture, décisions successives conservées, rattachement au bon brouillon, devis/contrats/versions publiées inchangés, SHA-256 source identique.

PR #158, #159 et #161 ouvertes, brouillon, fusionnables et `CLEAN` ; CI `quality` de #158 réussie. Les branches ont des commits parallèles de correction, mais les trois simulations `merge-tree` réussissent sans conflit. Ordre préparé : #158 vers main, actualiser/retargeter #159 puis la fusionner, actualiser/retargeter #161, lancer une seule campagne complète finale et seulement ensuite demander l’autorisation de fusion. Aucun merge, package, campagne complète, publication ou base active modifiée.

## 31/10/2026 — Consolidation finale et validation humaine préparée

[Rapport de clôture](docs/ux-v2/CLOTURE-CONVERGENCE-CONTRACTUELLE-2026-10-31.md) et [suivi exhaustif des 118 clauses](docs/ux-v2/SUIVI-FINAL-118-CLAUSES-2026-10-31.csv) ajoutés sans nouvelle réécriture. La migration 77 conserve séparément les décisions humaines sur chaque brouillon : « prête à soumettre » ou « révision demandée », avec relecteur, note, empreinte, confirmation native et journal. La décision peut porter sur une clause ou un groupe filtré et ne publie aucune version. Cinq arbitrages concrets seulement restent documentés : adhésion CM2C, périmètre de restauration, parcours de renouvellement, non-report des interventions et accès cPanel de la Lune.

Chaîne Git vérifiée : #158 vers main (fusionnable mais `UNSTABLE`), #159 vers #158 (`CLEAN`), #161 vers #159 (`CLEAN`). Plan d’intégration, sauvegardes, contrôles et retour arrière détaillés ; aucune fusion exécutée. Typecheck, paquet Electron, 32 tests ciblés et suite complète **1 746 réussis / 1 ignoré**. Recette SQLite isolée de la décision groupée réussie avec SHA-256 source inchangé. Prochaine action : validation humaine des cinq arbitrages puis intégration dans l’ordre documenté. Aucune base utilisateur, publication, tarif actif, devis ou contrat historique modifié.

## 31/10/2026 — Validation fonctionnelle des brouillons et réconciliation mensuelle

La PR #161 sait maintenant réconcilier les maintenances mensuelles historiques `atoumweb-wordpress` et `atoumweb-woocommerce` avec les codes canoniques `AW-MAINT-WP-M` et `AW-MAINT-WC-M`, sans créer de nouveau produit ni doublon. La simulation reste sans écriture ; l'application sur copie isolée attribue l'identité puis crée les six brouillons dans une transaction atomique. L'interface de revue affiche aussi la famille, le défaut corrigé, la vigilance et l'avis externe des 118 propositions, sans assimiler ce classement à une validation juridique.

[Validation fonctionnelle détaillée](docs/ux-v2/VALIDATION-FONCTIONNELLE-CONVERGENCE-2026-10-31.md). Base utilisateur contrôlée en lecture seule avec SHA-256 inchangé. Typecheck réussi, tests ciblés 8/8 et suite complète **1 746 réussis / 1 ignoré**. Les 14 scénarios ont été régénérés avec les brouillons : 202 pages, 0 clause sélectionnée manquante, signatures et mention BROUILLON présentes ; inspection visuelle sans anomalie bloquante. Aucune publication, adoption, modification historique, fusion ou déploiement. Restent uniquement les arbitrages humains et juridiques listés dans le rapport avant toute publication.

## 31/10/2026 — Interface de convergence, recette isolée et campagne PDF terminées

La PR #161 dispose maintenant d'une interface commune en Bibliothèque contractuelle : comparaison publié/proposé des 118 clauses et des six évolutions Catalogue, anomalies et dépendances visibles, simulation sans écriture, journal de traçabilité et deux confirmations distinctes avant préparation. Les imports créent seulement des versions brouillon ; aucune publication, adoption ou modification historique n'est possible par ce parcours. La trace Catalogue est atomique avec les six brouillons et reste unique au rejeu.

[Bilan détaillé](docs/ux-v2/VALIDATION-CONVERGENCE-CONTRATS-CATALOGUE-2026-10-31.md). Typecheck et paquet Electron réussis ; tests ciblés 8/8, recette SQLite isolée 1/1 et suite complète **1 746 réussis / 1 ignoré** sur 209 fichiers. Préparation 118+6, idempotence, plan périmé, rollback et conservation des devis/contrats/versions publiées vérifiés. La base source conserve la même empreinte SHA-256 avant/après. Campagne existante poursuivie sur la copie : 14 PDF, 131 pages, 103 contrôles, 181 montants sans rupture et 14 exports IPC identiques ; inspection visuelle complète sans page vide, débordement, chevauchement ni clause manquante. Les grands blancs de cinq dernières pages et les périmètres historiques peu détaillés restent signalés. Aucun import sur la base utilisateur, aucune publication, fusion ou déploiement. Prochaine action : validation humaine des formulations et décision explicite de publier, hors de cette PR.

## 31/10/2026 — Audit de convergence des 118 clauses et préparation sûre des brouillons

Reprise demandée depuis la PR #159 brouillon, elle-même basée sur la PR #158. Branche isolée `codex/contract-convergence-audit-20261031` au départ de `c7f73f2c`. [Audit reproductible](docs/ux-v2/bibliotheque-humaine-118-20261025/AUDIT-CONVERGENCE-20261031.md) : 118 propositions / 118 codes / 118 origines publiées exactes, corps et SHA-256 identiques, 28 dépendances résolues, 0 approbation/publication/adoption. Les maintenances mensuelles canoniques 49/99 € et leurs variantes annuelles facultatives 539/1 089 € ont été introduites ensemble le 03/10/2026 (`1ed1152c`) ; l’annualisation n’a pas remplacé le mensuel. Deux contradictions Catalogue restent ouvertes : hébergement publié 99 € face à la formule Lune 149 €, et migration interne gratuite non séparée de l’externe sur devis.

Préparation technique locale : migration 76 additive pour versionner le titre des clauses et tracer les imports éditoriaux ; service de simulation/import atomique créant 118 nouvelles versions `draft` avec provenance exacte, rejeu idempotent et rollback, sans publication ni modification de devis/snapshot. Deux titres révisés (`APP-GARANTIE`, `WEB-AR`) n’altèrent plus les titres historiques. Un second plan contrôlé prépare six brouillons Catalogue : quatre maintenances détaillées à prix inchangés, hébergement isolé 149 € et migration externe `sur devis`; il refuse toute origine publiée différente et son rejeu est neutre. Typecheck OK ; suite complète **1 741/1 741 tests** réussie sur 206 fichiers, plus 3/3 tests ciblés Catalogue. Aucun import sur la base utilisateur, aucun PDF/campagne/lanceur/déploiement ou fusion. Prochaine action : raccorder explicitement les deux simulations à l’interface, puis lancer les validations devis/PDF seulement après revue humaine des brouillons.

## 28/10/2026 — Hébergement isolé 149 €/an : prix validé, non publié

**Arbitrage utilisateur** : total annuel **149 €** pour la nouvelle formule « Hébergement isolé avec Lune dédiée », soit **99 €/an** d'hébergement WordPress standard (tarif Catalogue publié) et **50 €/an** de forfait commercial Lune dédiée. Lune **obligatoire** pour les nouvelles offres d'hébergement AtoumWeb **sans maintenance WordPress/WooCommerce**, que la Lune génère ou non un coût fournisseur. Les mises à jour WordPress/thèmes/plugins demeurent hors hébergement. WooCommerce complexe : devis adapté. Les contrats déjà acceptés sont inchangés.

**Travail GitHub PR #159 (brouillon)** : grille commerciale actualisée dans `OFFRES-HEBERGEMENT-LUNES-20261028.md`, décision D09 ajoutée à `REVUE-CHATGPT-20261028.md`, propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-RENOUVELLEMENT` annotées pour la tarification par devis. **Tarif approuvé, pas encore intégré comme produit publié dans la base Catalogue**, et pas de mutation de devis/contrat historique. **Clarification définitive (correction utilisateur)** : le déplacement **AtoumWeb → AtoumWeb** entre espaces d'hébergement, notamment vers une Lune dédiée, est **gratuit (0 €)**, indépendamment de l'année du contrat. La migration **depuis un hébergeur extérieur vers AtoumWeb est payante** (Catalogue : `AW-TECH-MIGRATION-AW` 99 € pour un cas standard ; autres cas sur devis). Cette décision remplace la formulation initiale « migration incluse la première année » et exclut toute double facturation. **À faire** : préparer nouvelle formule versionnée en brouillon sans double facturation, définir les modalités d'accès cPanel dédié, contrôler la fiscalité affichée et tester les devis/migrations techniques, puis validation de mise en service.

## 28/10/2026 — Arbitrage final : Lune obligatoire pour hébergement sans maintenance (non publié)

**Nouvelle décision utilisateur prioritaire par rapport à la règle précédente** : le client qui n'a **pas** de maintenance WordPress/WooCommerce mais conserve l'hébergement chez AtoumWeb doit souscrire **une Lune o2switch dédiée obligatoire**, **facturée séparément** de l'hébergement. Prix publié retrouvé dans le Catalogue : `AW-TECH-HEBERG-WP`, **99 €/an** pour WordPress seul (hébergement, SSL, maintien de l'espace). **Prix client de la Lune non encore fixé** ; montant o2switch de **1,50 € TTC/mois uniquement au-delà du quota fournisseur**, qui ne vaut pas tarif de revente. Hébergement WooCommerce / besoins techniques particuliers : devis. Distinguer maintenance de l'environnement d'hébergement et maintenance applicative ; limiter l'accès au cPanel dédié, jamais au compte maître.

**Réalisé sur PR #159 brouillon** : grille commerciale `docs/ux-v2/bibliotheque-humaine-118-20261025/OFFRES-HEBERGEMENT-LUNES-20261028.md` mise en cohérence, et propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-PERIMETRE`, `MAINT-RENOUVELLEMENT` révisées. Document de revue actualisé. **Aucun changement des versions Catalogue publiées, devis historiques, contrats signés ou bases de données.** Nouvelle formule à appliquer uniquement aux engagements/avenants acceptés ; migration éventuelle d'un site existant mutualisé à organiser contractuellement avant transition.

**À décider avant publication et implémentation : prix de vente et périodicité de la Lune, comptage exact sur l'abonnement o2switch, rédaction définitive des offres, recette des devis.**

## 28/10/2026 — Décision B : hébergement isolé avec Lune dédiée à prix fixe (non publié)

**Décision explicite du responsable** : tout nouveau client sans maintenance applicative qui reste hébergé chez AtoumWeb doit être placé dans une Lune o2switch dédiée ; la **formule commerciale à prix total annuel fixe** « Hébergement isolé avec Lune dédiée » sera vendue **même lorsque la Lune est comprise dans le quota fournisseur**. **Tarif déjà publié** pour la base `AW-TECH-HEBERG-WP` : **99 €/an**. **Forfait commercial Lune annuelle et prix total de la formule : pas encore chiffrés**. Distinguer les composantes au devis, éviter double facturation ; besoin WooCommerce complexe sur devis. Aucun contrat signé ne peut être changé unilatéralement.

Travail effectué sur la **PR #159 en brouillon** : mise à jour de `OFFRES-HEBERGEMENT-LUNES-20261028.md`, propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-RENOUVELLEMENT`, journal `REVUE-CHATGPT-20261028.md`. Préparation du code de nouvelle formule non persisté `AW-TECH-HEBERG-ISO-LUNE`. 118 clauses proposées, originaux et décisions de publication intacts ; **aucun import, changement dans le Catalogue actif, migration client ni application de tarif**. Étape suivante : fixer le **forfait annuel Lune** puis créer/valider les nouvelles versions brouillon du Catalogue et les scénarios de devis.

## 28/10/2026 — Hébergement AtoumWeb, suivi technique et Lunes : projet de formules non publié

Décision utilisateur : permettre l'hébergement chez AtoumWeb **sans maintenance WordPress/WooCommerce**, avec paiement de l'hébergement à l'issue de toute première année **explicitement incluse au devis**, et supplément éventuel pour une Lune isolée. Valoriser la gestion technique de l'espace (SSL, paramètres d'hébergement, évaluation de la version PHP) sans promettre les mises à jour applicatives ; l'infrastructure o2switch est gérée par le fournisseur. Ne jamais donner l'accès au cPanel maître. Vérification doc officielle o2switch : Grow 4 Lunes incluses, Cloud 8, Pro 16, supplément fournisseur 1,50 € TTC/mois au-delà ; la mention « payantes à partir de 3 » doit être confrontée au quota réel du compte.

Travail réalisé **sur PR brouillon #159 uniquement** : document `docs/ux-v2/bibliotheque-humaine-118-20261025/OFFRES-HEBERGEMENT-LUNES-20261028.md` avec grille de formules fondée sur le Catalogue existant (`AW-TECH-HEBERG-WP` 99 €/an, maintenance WP 49 €/mois ou 539 €/an, Woo 99 €/mois ou 1 089 €/an), option Lune sans prix client inventé, cas de renouvellement et sortie. Propositions des clauses `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-PERIMETRE` et `MAINT-RENOUVELLEMENT` ajustées dans `PROPOSITIONS.json`. Sources de 118 clauses, Catalogue exporté, devis acceptés et contrats publiés inchangés. Journal éditorial conservé.

**À faire avant intégration Catalogue** : valider l'offre o2switch réellement détenue et les Lunes disponibles, fixer le prix de vente/client et la périodicité de l'option, vérifier année 1 réellement comprise selon devis et fréquence du suivi technique PHP/SSL, puis créer des **versions brouillon** sans toucher aux versions acceptées ; recette devis/contrats. Aucune migration, import, publication, déploiement ou test applicatif effectué.

## 28/10/2026 — Revue rédactionnelle ChatGPT : maintenance et socle (propositions non adoptées)

Demande utilisateur : poursuivre la revue des clauses et modifier les propositions lorsque la rédaction s'améliore sans changement d'engagement. Branche dérivée de `codex/internal-reference-handoff-20261027`. Neuf propositions documentaires révisées dans `docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json` : sept `MAINT-*`, `BASE-CONFIDENTIALITE` et `BASE-FORCE-MAJEURE`. Les textes proposés précédents sont conservés, les 118 identifiants et textes publiés restent inchangés ; aucun statut d'approbation modifié. [Compte rendu et vigilance](docs/ux-v2/bibliotheque-humaine-118-20261025/REVUE-CHATGPT-20261028.md). Vérifications documentaires d'intégrité réussies ; aucune validation juridique finale, aucun test du moteur ni publication, aucune fusion ou mise en production. Prochaine étape : revoir les clauses WEB/ECOM, obtenir les décisions de contenu, puis traiter séparément le rendu PDF client et ses tests.

## 27/10/2026 — Centralisation GitHub du référentiel commercial

Autorisation explicite de publier sur une branche dédiée l'état courant déjà transmis et les données commerciales existantes, sans correction ni nouvelle campagne. Export SQLite strictement en lecture seule et limité aux tables Catalogue, contrats, associations et modèles/temps ; base, prospects, clients, contacts, devis réels, réglages, secrets et documents privés exclus. Les 118 propositions humanisées restent documentaires et séparées des 118 clauses publiées. [Passation et limites](PASSATION-REFERENTIEL-INTERNE-20261027.md). Aucun tarif, texte publié, contrat historique ou statut modifié ; aucune fusion, aucun déploiement.

## 27/10/2026 — Passation GitHub demandée, sans refonte

Autorisation explicite de synchroniser l’état local complet vers `atoumweb-prog/atoumweb-manager`, branche dédiée `codex/quote-pdf-handoff-20261027`, commit/push normaux et PR brouillon uniquement. Aucun changement de `main`, force-push, déploiement, nouvelle campagne ou correction PDF. Les 39 commits d’avance sur `origin/main` et les modifications source/tests/migration75 non commitées sont repris ensemble. [Point d’entrée](PASSATION-DEVIS-GITHUB-20261027.md) : sources, commandes, limites et éléments locaux exclus. `output/` ignoré ; bases, clients, secrets, binaires, archives et propositions métier non nécessaires exclus du lot. Contrôles de synchronisation uniquement, pas de nouveaux tests métier. La suite de présentation du PDF client est confiée à ChatGPT après cette passation.

## 27/10/2026 — Dossier final de validation commerciale

[Bilan et reprise](docs/ux-v2/FINALISATION-COMMERCIALE-2026-10-27.md). Pagination07de12à11pages, six lignes et total14réunis page1 ; toutes clauses/sections conservées. Vrai parcours CRM distinct vérifié sur TEMP. Typecheck,48tests ciblés distincts,14présentations natives et2PDF ciblés inspectés, sans campagne métier complète supplémentaire.44articles classés et correspondances sourcées, deux maintenances finales, progressif10à100en proposition/maquette uniquement. Références mariage retrouvées : Essentiel/GrandJour1an, Histoire2ans ; anciennes versions sans durée, aucun transfert automatique. Accents documentaires corrigés. Dossier output/finalisation-commerciale-20261027/Dossier-validation-commerciale et ZIP Downloads/AtoumWeb-Validation-Commerciale-20261027.zip. Base utilisateur/prix/pub/historique inchangés, aucun déploiement/push/fusion/exécutable. Prochaine étape : cinq décisions utilisateur avant intégration/publication.

## 27/10/2026 — Dernière revue ciblée du moteur de devis

[Bilan et reprise](docs/ux-v2/FINITION-DEVIS-2026-10-27.md). Montants insécables, coordonnées dédoublonnées, abréviations développées sur brouillons ; historiques conservés. Deux propositions annuelles autonomes, inventaire44articles/quatre rapprochements, arbitrage tranches sans application. Typecheck,1735tests/204fichiers,103contrôles,14PDF/130pages,10modifications,203montants PDF sans coupure, géométrie native15cas réussis. Source utilisateur inchangée, tests TEMP seulement. Dossier `output/finition-devis-20261027/Dossier-validation`, archive Downloads/AtoumWeb-Finition-Devis-20261027.zip. Tableau14encore sur2pages et continuation07aérée, limites documentées. Aucun exécutable/pub/prix/push/fusion/déploiement. Prochaine étape : décisions commerciales ; pas de relance des contrôles sans changement.

## 27/10/2026 — Correctifs locaux et nouvelle campagne des devis

Demande complète a6dcf0e5 traitée sur branche distincte `codex/devis-corrections-validation-20261026`. [Bilan et reprise](docs/ux-v2/CORRECTIONS-DEVIS-2026-10-27.md), index output/corrections-devis-20261027/Dossier-corrections, archive Downloads/AtoumWeb-Corrections-Devis-20261027.zip. Contrôles B2B/B2C et champs nommés, destinataire CRM/snapshot/adresse personne(migration75), quantités cohérentes et tranche signalée sans repricing, échéanciers explicites par ligne, copies et PDF alignés, descriptions et renvois lisibles, vraies prévisualisations humanisées, pagination ajustée.14PDF/129pages,10modifications,2prévisualisations (35/25articles changés),103contrôles et10montants indépendants réussis. Suite1729/1729,204fichiers, puis75présentation+13rendu+71copie/transmission ; typecheck réussi. Recette par les fenêtres React/preload :8étapes et3thèmes, zéro erreur console. Source47db9101 lue seule, empreinte toutes tables inchangée ; copie TEMP uniquement, pas de publication ni de prix modifié. Deux propositions de versions annuelles préparées sur copie isolée ; A09inclusions manquantes, A10règle de tranche, A11durée initiale mariage et données réelles restent à arbitrer.14reste un document long avec tableau poursuivi page2 ; limite documentée, aucune clause supprimée pour raccourcir. Aucun nouveau lanceur/exécutable, déploiement, fusion, push, Bridge ou modification de la base utilisateur. Prochaine action : examen des résultats et arbitrages ; ne pas relancer118clauses ou14scénarios sans changement pertinent.

## 25/10/2026 — Campagne réelle de14devis exécutée, anomalies conservées

Demande Carlos : Catalogue réel, scénarios crédibles, moteur réel et modifications avant/après sur environnement isolé, sans correctifs silencieux. [Bilan et reprise](docs/ux-v2/CAMPAGNE-DEVIS-14-2026-10-25.md).14PDF/135pages,14fiches/rapports,10PDF de modification,2prévisualisations humanisées non adoptées et2PDF de contrôle de finalisation.92contrôles réussis et10calculs indépendants ; vrai renderer/preload/IPC,14exports textuellement identiques, zéro erreur console finale, clauses actives intégrales. Source47db9101 lue seule et sauvegardée vers TEMP/Validation-MSI ; empreinte logique de toutes les tables inchangée. Aucun produit/texte publié/base utilisateur modifié. Défauts : préparation autorisée avec champs non résolus consommateurs, productCount restant5après quantité11, destinataire sans coordonnées PDF, périmètre annuel incomplet bloquant correctement03/07/13/14, sauts quasi vides04/13et totaux séparés14. Catalogue sans options structurées :09alternative technique explicite ;11durée initiale hypothétique faute de donnée publiée. Archive Downloads/AtoumWeb-Campagne-14-devis-20261025.zip et index output/campagne-devis-20261025/Dossier-campagne. Pas de nouveau lanceur/push/fusion/déploiement ; prochaine étape : examen des résultats avant autorisation d’un lot correctif.

## 25/10/2026 — Bibliothèque entière : 118 propositions rédactionnelles documentaires

Nouvelle demande Carlos : étendre les35analyses aux83autres clauses et harmoniser l’ensemble, sans publication ni base réelle modifiée. Source47db9101 relue en lecture seule :118versions inchangées,19socle/99Catalogue,409liens,13types brouillon/112liens. [Dossier complet](docs/ux-v2/bibliotheque-humaine-118-20261025/LIRE-DABORD.md) :118comparaisons intégrales avec identifiants sources et risques, tableau de validation, JSON, cohérence transversale et4assemblages éditoriaux de démonstration (24/35/24/23clauses).35propositions conservées et relues,83nouvelles spécifiques.26risques faibles/49modérés/43élevés, décisions humaines toutes en attente ; aucune certification juridique. Lecteur HTML autonome avant/après et contrats ; contenu/syntaxe vérifiés, inspection visuelle empêchée par refus file:// du navigateur, aucun contournement. Contrôles118/118origines/corps/identifiants et audiences des4exemples ; aucune mutation, publication, adoption, code applicatif, exécutable ou historique modifié. Pas de tests applicatifs/PDF de production relancés sans changement. Prochaine action : examen des propositions et décisions de Carlos, puis intégration en versions brouillon dans un lot séparé ; pas d’autorisation implicite de publier/appliquer/push/fusion/déployer.

## 25/10/2026 — Audit rédactionnel, phase A uniquement

Demande jointe Carlos : auditer les sources et les35clauses du PDF de référence avant modification, proposer un français naturel sans retirer les protections. [Rapport avant/après intégral](docs/ux-v2/audit-redaction-20261025/RAPPORT.md), [tableau à valider](docs/ux-v2/audit-redaction-20261025/TABLEAU-VALIDATION.md), inventaire118versions/13types et propositions JSON documentaires. Source portable47db9101 lue seule ; PDF10pages,35/35corps publiés retrouvés par extraction normalisée, versions identifiées. Le PDF de recette comprend20blocs spécifiques ajoutés sur TEMP ; le devis de la base en contient encore15socle, ne pas annoncer une adoption réalisée. Risques et données manquantes distingués ; revue externe prioritaire des dispositions sensibles. Points techniques à tester : détection hébergement offert, fourniture mixte, audience professionnel protégé et stabilité de validité lors d’une correction. Aucun code applicatif, base, brouillon en bibliothèque, prix, statut, clause publiée ou exécutable modifié ; aucun push/fusion/déploiement. Tests applicatifs non relancés sans changement. Prochaine action : examiner les propositions puis engager le lot technique retenu ; publication et adoption nécessitent une validation humaine explicite séparée.

## 25/10/2026 — Réglages entreprise et modèle livrés, aperçu paginé dans l’éditeur

Autorisation Carlos d’intégrer Réglages et poursuivre le devis. Quatre onglets, identité commune réutilisée, logo/style/défauts/textes personnalisables, bibliothèque existante accessible. Modèle repris aux nouveaux devis, adoption volontaire pour les brouillons, style/logo figés dans la présentation transmise. Aperçu réel du PDF en pages avec zoom dans Réglages et à côté de l’éditeur, via worker local embarqué. Coordonnées multilignes complètes sur la synthèse. Typecheck,79 tests distincts,44 assertions natives,34 binaire réel, zéro erreur renderer, PDF10pages/35clauses inspecté. [Bilan et limites](docs/ux-v2/REGLAGES-DEVIS-LIVRAISON-2026-10-25.md). Livraison `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-47db9101/LANCER-LE-MANAGER.cmd`, source91dedc1c sauvegardée/lue seule, toutes lignes conservées avant ajout des informations professionnelles confirmées dans la copie (sauvegarde/rapport). Email et franchiseTVA intégrés, autres mentions inconnues laissées manquantes, DEV003 reste brouillon. Pas de nouvelle table/migration, pas de push/fusion/CI/installateur/Bridge. Prochaine action : recette Carlos puis poursuite de l’ergonomie de l’éditeur.

## 25/10/2026 — Réglages entreprise et modèles de devis demandés

Carlos confirme email agence@atoumweb.fr et franchise en base de TVA actuelle. Document Guichet unique fourni : identité EI/micro, SIRET93879060700015, adresse9rue du Breuil21440Vaux-Saules. Ne pas importer les informations personnelles sans rapport avec le devis. Nouvelle cible produit : entreprise utilisatrice configurable, en vue de vendre le Manager ; onglet pour identité/coordonnées/fiscalité/logo et paramètres de devis, aperçu paginé dans l’éditeur pour corriger textes et mise en page, style personnalisable. Relevé statique : administration commune déjà stockée mais enfouie dans la préparation ; logo/couleurs encore codés dans le modèle, aperçu HTML non paginé. Réutiliser l’administration existante, ne pas créer une seconde source. [Spécification de ce prochain lot](docs/ux-v2/REGLAGES-ENTREPRISE-MODELES-DEVIS.md). Cadrage documenté, pas encore implémenté ni nouvelle livraison. Conservation des devis transmis/acceptés obligatoire ; réglages futurs appliqués aux brouillons explicitement, jamais rétrospectivement aux contrats figés. Pas de commercialisation/licence/multi-entreprise simultanée/Bridge implicitement engagés.

## 25/10/2026 — Corrections du moteur PDF et engagements par prestation

Design validé conservé. Numérotation dans l’ordre affiché, titres protégés, références compactes/signature explicite, exemple10 pages au lieu de12 avec35 clauses intégrales. Édition par ligne du périmètre/exclusions/date ou événement/durée/renouvellement ; calendrier ponctuel et continu distingué, contrôles de finalisation maintenus. Référence mensuelle complète retrouvée dans Reference-V2, copiée localement au nouveau brouillon annuel sans prix ni snapshot modifiés ; comptes10+51=61 explicités. Typecheck,106 tests distincts,39 assertions natives et31 binaire réel réussis, zéro erreur renderer, PDF et stress inspectés. [Bilan et limites](docs/ux-v2/DEVIS-PDF-CORRECTIONS-2026-10-25.md). Livraison `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-91dedc1c/LANCER-LE-MANAGER.cmd` ; b0a192ca lu seul, chaque ancienne ligne vérifiée avant rebasing des chemins dans la copie. Rattrapage ciblé de3 paramètres après sauvegarde, prix/lignes vendues inchangés. Administratif/TVA/dates/renouvellement non inventés, exemple brouillon. Acceptation indépendante d’Abby reste à faire. Aucun push/fusion/CI/installateur/Bridge. Prochaine action : recette Carlos et données réelles.

## 23/10/2026 — Mise en page PDF AtoumWeb livrée

Autorisation « je te laisse commencer » après priorité explicite à la présentation. Modèle commun aperçu/PDF, symbole approuvé jaune/noir/blanc, synthèse commerciale avec prix unitaires et deux décimales, périmètre détaillé, annexe sur nouvelle page, clauses courtes entières, références et acceptation finale, pagination continue, brouillon clairement marqué. Proposition de clauses absentes désormais visible dès ouverture des CGV, application explicite préservée. Typecheck, 126 tests ciblés, 37 assertions natives, exemple12 pages/35 clauses intégralement conservées et stress16 pages/30 paragraphes, inspection visuelle ; binaire31 assertions au dernier passage (premier échec Electron interne non reproduit, documenté). [Bilan, limites et reprise](docs/ux-v2/DEVIS-PDF-MISE-EN-PAGE-2026-10-23.md). Lanceur `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261023-b0a192ca/LANCER-LE-MANAGER.cmd` ; Workspace c0bb85a3 sauvegardé et copié, chaque ligne vérifiée, 118 modèles/118 versions, 5 prospects/3 devis/7 lignes conservés. PDF exemple dans Apercu-PDF et Downloads. Source précédente inchangée ; exemples et intégration des20 blocs sur copie TEMP seulement. Acceptation indépendante d’Abby reste à implémenter ; aucun contexte légal ni texte Catalogue inventé. Pas de push/fusion/CI/installateur/Bridge. Prochaine action : recette visuelle Carlos.

## 23/10/2026 — Décision : devis et contrat Manager, facturation Abby

Carlos confirme la répartition : Manager produit le devis et l’ensemble contractuel, conserve la version transmise puis la preuve d’acceptation ; Abby intervient ensuite pour les factures. Décision inscrite au cahier des charges §10.3 et remplaçant l’obligation antérieure d’accepter le devis « dans Abby ». Lecture du code : confirmations d’acceptation, messages, panneau de PDF accepté et étape de transfert encore centrés sur Abby ; les mécanismes d’attestation d’envoi, gel, preuve documentaire et activation Projet existent et doivent être conservés. Première cible : preuve PDF signé/autre acceptation datée importée avec provenance, pas de service de signature intégré présumé. Les corrections de complétude des20 blocs/PDF DEV-2026-003 restent prioritaires. Documentation uniquement lors de cette décision ; aucun comportement, données, clauses, exécutable ou connecteur modifiés. Prochaine réalisation : parcours transmission/acceptation indépendant d’Abby avec vérification de la preuve, puis référence facturation Abby après acceptation.

## 23/10/2026 — Retour utilisateur sur PDF DEV-2026-003

Audit du PDF réel en cinq pages et du rapport collé : défauts commerciaux/mise en page confirmés, calculs justes ; brouillon non identifié. Défaut supplémentaire constaté en base lue seule : 15 clauses socle, aucune spécifique malgré 13 liens E-commerce et7 Maintenance ; proposition moteur sur copie TEMP =20 ajouts. Lignes ordinaires sans composition au même moment que certaines options, comparaison explicite trop enfouie dans le nouveau bureau. [Constats et ordre de correction](docs/ux-v2/DEV-2026-003-PDF-AUDIT-2026-10-23.md). Revue seule, aucun devis/PDF/donnée/code/package modifié ; ne pas présenter la livraison actuelle comme un PDF final corrigé. Prochaine correction prioritaire : visibilité/complétude des blocs puis export brouillon/prix et présentation PDF, sans inventer informations fiscales, contenus Catalogue ou qualifications manquants.

## 23/10/2026 — Parcours Devis / CGV humain et exports

Maquette « Une rubrique à la fois » approuvée par Carlos avec demande de copie intégrale, PDF et Word ; implémentation autorisée puis réalisée sur branche locale distincte `codex/devis-cgv-parcours-humain`. Un même éditeur en trois onglets depuis Devis ou Prospection, clause lisible/éditable individuellement, socle versionné, informations de finalisation par rubrique, exports réels et protections de saisie. Pas de modification des moteurs, textes, schéma 74 ou snapshots. Typecheck, 60 tests ciblés, 32 assertions natives TEMP et 31 assertions du véritable exécutable réussis, aucune erreur renderer. [Bilan et reprise](docs/ux-v2/DEVIS-CGV-PARCOURS-RECETTE-2026-10-23.md). Nouveau lanceur `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261023-c0bb85a3/LANCER-LE-MANAGER.cmd` : bibliothèque 118 clauses, 5 prospects /3 devis /6 lignes et toutes les lignes du précédent Workspace conservées et vérifiées ; ancien portable intact. Aucun push/fusion/CI/installateur/Bridge. Prochaine action : recette utilisateur de ce portable.

## 23/10/2026 — Bibliothèque contractuelle reprise dans le portable courant

Autorisation explicite d’ajouter la base contractuelle manquante au dernier lanceur avant toute refonte Manager. Source Reference-V2-20261015 lue seule ; ajout ciblé sur Workspace du portable1ddd01fb, fermé par Carlos, après sauvegarde et essai sur copie. 118 clauses publiées pour recette / 409 liens / 13 types en brouillon / 112 liens de types ; dépendances Catalogue ajoutées sans réécrire les prestations/prix existants (21 versions de référence en brouillon pour respecter les gardes de versions vendues). Chaque ligne préexistante vérifiée inchangée, dont 2 devis/4 lignes ; rejeu neutre, intégrité/FK, source intacte. Composition réelle TEST sur copie seule : 15 clauses du socle +13 prestation E-commerce. [Bilan et limites](docs/ux-v2/PORTABLE-BIBLIOTHEQUE-CONTRACTUELLE-2026-10-23.md). Même lanceur, exécutable inchangé ; pas de synchronisation des devis existants, pas de config administrative inventée. Aucun code/UI/push/CI/fusion ; ne pas ajouter ce chantier à PR #1. Prochaine livraison : inclure explicitement ces référentiels, le seed neuf générique reste vide de bibliothèque. Continuer sur cette copie complète du Manager, avec Workspace indépendant ; refonte Devis/CGV distincte ensuite.

## 23/10/2026 — Audit de reprise du parcours Devis / CGV demandé par Carlos

Relecture des décisions Builder V1, Catalogue-CGV, lots05/06D et protocole EC03, comparée au code courant c4ab9cfc. [Règles, écarts et ordre de correction](docs/ux-v2/DEVIS-CGV-AUDIT-REPRISE-2026-10-23.md). Socle unique et blocs des prestations réellement retenues, édition locale des clauses prestation/conditions particulières ; socle commun versionné en bibliothèque, pas librement réécrit au devis. Moteur et classement approuvé05C présents, cible lecture/édition humaine encore incomplète. Divergence embedded/global confirmée dans QuotesPage. Workspace TEST livré sans bibliothèque contractuelle/configuration commune ; anciens référentiels datés non transportés avec le code. Propositions : reprise ciblée des données sans écraser les saisies, parcours unique, édition dans le texte et contrôles séparés. Audit uniquement : aucun code, import/publication, migration, test, package ou push ; ne pas mélanger avec PR #1 Nouvelle entreprise. Prochaine action : présenter les conclusions à Carlos et cadrer la réalisation distincte.

## 23/10/2026 — PR #1 : création Entreprise compacte, reprise locale

Autorisation explicite : reprendre la branche chatgpt/creation-entreprise-compacte-20261023 de la PR #1 (HEAD source 0a37d3d90cc5623e1e21970299330d879f93dad4), sans fusion, terminer uniquement Nouvelle entreprise et livrer un portable TEST distinct ; commit/push sur cette seule branche Prospection. Arbre initial propre, remotes vérifiés, ancien origin inchangé.

Quatre cartes et disposition de la PR conservées ; rubriques Présence numérique, Opportunités, Sources complétées avec champs structurés réellement sauvegardés. Zone d’activité et objectif du contact ajoutés comme propriétés facultatives du snapshot JSON existant, aucune table/migration. Objectif, angle et points dans conversation ; opportunités séparées des besoins confirmés. Logo avec aperçu et conservation lors de l’annulation du sélecteur. CSS limité à la fenêtre ; dimensions inchangées. Garde de création validée et référence de brouillon réinitialisée après succès, ouverture directe du dossier enregistré sans fausse alerte d’enregistrement en cours.

Exception minimale de lecture dans ProspectResearchPanel : afficher zone et objectif uniquement s’ils existent, afin de retrouver ces nouvelles données après création ; aucun éditeur, autre fiche, Client, parcours ou règle métier remanié. Identité réutilisée non modifiée silencieusement ; champs canoniques d’activité/présentation en lecture seule dans Analyse pour une entreprise existante. Schéma 74 intact.

Typecheck, 21 tests ciblés distincts (sources CRM et nouveau mapper/sauvegarde), recette native TEMP : 42 assertions sans erreur renderer, 13 captures, réouverture complète, logo, saisie non enregistrée, action ouverte non effectuée, trois thèmes ciblés. Bilan : docs/ux-v2/CREATION-ENTREPRISE-PR1-RECETTE-2026-10-23.md. Package 4d6021e5 contrôlé : 31 assertions / 12 visites / trois thèmes sans erreur renderer, intégrité/FK/registre74 conformes. Lanceur distinct : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-1ddd01fb/LANCER-LE-MANAGER.cmd ; galerie Downloads/Creation-entreprise-PR1-20261023-1ddd01fb, avec deux références avant. Profil/Workspace TEST indépendants, anciens intacts. Aucune fusion/CI/Bridge ; prochaine action : recette utilisateur de la PR ouverte.

## 23/10/2026 — Passation ChatGPT dans le dépôt dédié

Demande utilisateur de préparer la reprise avec ChatGPT. Fichier racine [PASSATION-CHATGPT.md](PASSATION-CHATGPT.md) : état et branche, logique UX acceptée, invariants métier, carte des sources, validations déjà faites, commandes ciblées, chemins locaux et limites d’accès distant, message de reprise prêt à coller. Lien visible en tête du README ; mémo actualisé (référence applicative 3c118101). Publication documentaire uniquement sur le dépôt privé Prospection ; aucun changement applicatif ni nouvelle campagne de tests/package/CI. Prochaine étape : retour de recette utilisateur.

## 23/10/2026 — Dépôt GitHub dédié à la version Prospection

Demande explicite utilisateur de créer un dépôt GitHub pour travailler sur cette version. Dépôt privé : https://github.com/atoumweb-prog/atoumweb-manager-prospection ; branche de travail codex/crm-saisie-coherente, historique conservé. Sources de la recette 166160dc et rapports inclus ; exécutables, bases, profils et captures locales exclus. Remote local prospection ; origin historique inchangé. GitHub Actions désactivé avant le premier push, aucune CI ni publication d’exécutable. Cette demande autorise le commit et le push de la version courante vers ce nouveau dépôt, sans fusion dans l’ancien dépôt. Prochaine action : poursuivre la recette et les corrections sur cette base dédiée.

## 23/10/2026 — Prospection : parcours compact et édition de devis intégrée

Passe autorisée : sept onglets, Préparer l’échange remplace Recherche/Préparation, Entreprise et site directement renseignables, cartes Contacts avec coordonnées et décisionnaire, Besoins réparti en quatre sous-onglets, intentions par cases sans prix, véritable éditeur de devis avec contexte et contrôle avant devis. Consultation/étape distinguées, champs manquants marqués, brouillons protégés, bouton Entreprise noir. Préparation initiale du devis atomique et rejouable, source unique conservée, schéma 74 inchangé. [Bilan, vérifications et limites](docs/ux-v2/PROSPECTION-PARCOURS-RECETTE-2026-10-23.md). Typecheck/package, 94 tests ciblés distincts + 5 du plan avant devis, 29 assertions natives TEMP, 16 captures ; véritable exécutable : 31 assertions/12 visites/trois thèmes sans erreur renderer. Nouveau lanceur `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-166160dc/LANCER-LE-MANAGER.cmd`, profil/Workspace TEST indépendants ; anciennes saisies intactes, aucun transfert automatique. Aucun main/push/CI/installateur/Bridge. Prochaine action : recette utilisateur.

## 23/10/2026 — Onglet actif clairement visible

Correction CSS ciblée : onglet sélectionné jaune / texte sombre, indépendant du focus, dans la création et la fiche Prospection (sous-onglets compris). Contrôle natif TEMP : sélection Recherche toujours visible après focus dans le textarea, aucune erreur renderer ; capture `outputs/onglet-recherche-selection.png`. Portable 16cfd49e inchangé ; correction source à inclure dans la prochaine livraison regroupée. Aucune donnée modifiée.

## 23/10/2026 — Passe utilisateur Prospection : onglets et nouveau lanceur

Récapitulatif des corrections explicitement autorisé, puis réalisation : huit onglets, parcours et commandes en en-tête, création à onglets avec logo, contacts/correction de nom et coordonnées à la demande, espaces et montants français, catalogue en dialogue, timeline et lisibilité. Aucune migration ajoutée (74). [Bilan et limites](docs/ux-v2/PROSPECTION-ONGLETS-RECETTE-2026-10-23.md). Typecheck/build, 127 tests ciblés distincts, 30 assertions natives TEMP et 20 captures ; package réel : 31 assertions, 12 visites, aucune erreur console. Nouveau portable `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-16cfd49e/LANCER-LE-MANAGER.cmd`. Ancien portable et saisies utilisateur conservés, aucune recopie automatique. Aucun main/push/CI/installateur. Prochaine étape : recette utilisateur de ce portable.

## 23/10/2026 — CRM : cinq lots réalisés et portable de recette

Validation utilisateur du plan complet puis demande d’exécutable. Branche dédiée `codex/crm-saisie-coherente` ; sources uniques, création atomique/rejouable, réconciliation 72, demande initiale/brief distincts 73, relations multi-entreprises 74, recherche partagée et continuité d’actions/historique Client. [Rapport, migrations, contrôles et limites](docs/ux-v2/PROSPECTION-CRM-CINQ-LOTS-2026-10-23.md). Typecheck, 1681 tests/197 fichiers, 17 assertions natives TEMP sans erreur console, 12 captures, 31 assertions sur le véritable package. Portable distinct `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-CRM-20261023-2e7f89a8/LANCER-LE-MANAGER.cmd`, profil et Workspace TEST neufs ; ancien portable intact. Aucun main/push/CI/installateur, aucune migration des données utilisateur. Prochaine étape : recette utilisateur du portable, avant toute fusion.

## 22/10/2026 — Diagnostic de la logique de saisie Prospection, avant validation

Audit statique demandé par l’utilisateur, sans modification applicative ni migration : [matrice des champs, sources SQLite et organisation cible](docs/ux-v2/PROSPECTION-AUDIT-SAISIE-DONNEES-2026-10-22.md). Identifie notamment besoin/catalogue et demande initiale/confirmée confondus, coordonnées historiques vs méthodes, création séquentielle, contact mono-organisation, circuits d’actions Prospect/Client et continuité d’historique. Proposition de lots et migrations conditionnelles ; aucune organisation cible encore validée. Aucun test applicatif relancé, aucune base consultée/modifiée, aucun portable/push/CI. Prochaine étape : validation de la propriété des champs et du périmètre relationnel avant implémentation.

## 22/10/2026 — Refonte Prospection : six lots locaux avec regression

Utilisateur autorise l'implementation sequentielle des six lots du cahier UX et confirme la disposition pleine largeur (identite en haut, panneaux a la demande, deux onglets). Branche codex/prospection-ux-six-lots, baseline50b749b0 preservee, code finale40dd129. Annuaire adaptatif/drawer, creation focalisee et contacts existants, synthese et editeurs metier, dialogues d'action et historique, controles de reference groupes, pipeline compact et commandes clavier. Typecheck/build renderer,1666 tests complets puis85 cibles,118 controles natifs TEMP cumules ;49 PNG apres/11 avant en galerie comparative Downloads/Prospection-refonte-six-lots-20261022. [Bilan, couverture de chaque point et limites](docs/ux-v2/PROSPECTION-SIX-LOTS-2026-10-22.md). Protections natives Tab/Maj+Tab/Escape et contrastes de confirmation verifies. Aucun service/migration/IPC public/donnee reelle/main/push/CI/installateur. Acceptation liee a conversion et Contact mono-entreprise conserves selon le modele actuel ; CAS atomique de reference non ajoute. PR preparee localement seulement, base de convergence a decider car le pilote parent n'est pas dans main. Portable42b12a93 inchange ; prochaine action : revue visuelle utilisateur et decision de livraison/publication.

## 22/10/2026 — Galerie du modèle Prospection pour revue externe

Demande utilisateur : disposer des captures du modèle en cours pour les transmettre à ChatGPT puis faire corriger l’interface.69 PNG réels capturés sur les sources locales, données synthétiques TEMP uniquement ; galerie outputs/prospection-galerie-20261022/index.html et ZIP Downloads/Prospection-modele-actuel-20261022.zip vérifié CRC. Capture ciblée via le banc existant, sans relancer les campagnes validées ni construire de portable. Rubriques longues en portions successives ; contrôles visuels ponctuels et aucune erreur console signalée. Périmètre exact et états conditionnels non couverts explicités dans LIRE-MOI.txt. Aucun changement produit supplémentaire ; prochaine action : retour de l’analyse utilisateur/ChatGPT.

## 22/10/2026 — Ajustement ciblé des cartes et de la colonne Ouvrir

Demande utilisateur sur deux captures : remplacer le résumé déplié du parcours par une grande fenêtre de travail modifiable et réduire la colonne Ouvrir. Cartes compactes, bouton « Ouvrir la fiche » vers le bureau existant, aucune expansion interne ; colonne Ouvrir fixée à76px sur le seul annuaire Prospection, même avec une ancienne largeur mémorisée. Éditeurs et gardes existants conservés. Portable42b12a93 inchangé ; aucune reconstruction demandée. Typecheck, syntaxe du scénario natif adapté et diff --check réussis ; scénario natif non réexécuté, validation visuelle du changement encore attendue.

## 22/10/2026 — Consignes de reprise et maîtrise des coûts

Synthèse courte des décisions utilisateur dans [CONSIGNES-ET-REPRISE](docs/ux-v2/CONSIGNES-ET-REPRISE.md), référencée par AGENTS.md. Évite les reprises de validation et les campagnes/livraisons répétées ; dernier portable42b12a93 inchangé. Documentation seulement, aucun test applicatif nécessaire.

## 22/10/2026 — Corrections regroupées de la recette Prospection

Utilisateur autorise tous les points relevés dans les captures : historique compact/détail borné, Clients acquis compact, référence interne et fenêtre séparée harmonisées, contraste et commandes Enregistrer/Annuler, informations manquantes regroupées, dates uniquement enregistrées, relances compactes et commandes explicites, journal unique, intérêt lisible et archivage confirmé. Liens web/email et copie téléphone sur clic explicite ; nouveau canal IPC limité aux protocoles HTTP(S)/mailto, aucune écriture métier associée. [Bilan et contrôles ciblés](docs/ux-v2/PROSPECTION-CORRECTIONS-RECETTE-2026-10-22.md). Typecheck,2 tests de destinations et41 contrôles natifs ciblés ; Noir/Confort/1920×1080/100% uniquement, bases TEMP. Aucun service métier/migration modifié, aucune donnée réelle, CI, fusion, activation B1 ou installateur. Ajustement demandé pendant la passe : parcours pleine largeur, six étapes visibles au standard, ouverture directe de la fiche cliquée et résumé à la demande ; plus de panneau latéral comprimant le parcours. Nouveau portable distinct prévu ; validation visuelle finale utilisateur.

## 22/10/2026 — Fiches Prospection : travail et référence

Application autorisée des recommandations issues des deux maquettes : identité compacte en haut, zone centrale prioritaire, associations facultatives repliables et trois groupes métier conservés. Référence en lecture par défaut, modification explicite et versionnement existant conservé ; six rubriques réelles. Liens Annuaire centralisés dans Associations pour cette fiche seulement. Styles limités au bureau Prospection ; Accueil/en-tête, Client, services et migrations inchangés. [Décisions et vérifications](docs/ux-v2/PROSPECTION-FICHES-2026-10-22.md). Une configuration standard uniquement, données synthétiques TEMP ; aucune donnée réelle/CI/push/main/installateur. Prochaine étape : recette visuelle utilisateur.

## 22/10/2026 — Prospection : lisibilité et défilement après recette

Table écrasée et défilements imbriqués signalés par l’utilisateur. Tableau/fiche bornés dans la hauteur utile, colonnes lisibles défilantes, fiche rapide limitée à480px et corps défilant, protection de la sélection lors des interactions avec les scrollbars. Indicateurs repliables, titre unique. Accueil/en-tête validés conservés ; aucun changement métier/IPC/migration/donnée réelle. [Décisions et protocole ciblé](docs/ux-v2/PROSPECTION-DEFILEMENT-2026-10-22.md). Contrôle limité à une configuration standard et aux interactions de Prospection, nouveau portable distinct prévu. Pas de CI/push/main/installateur.

## 22/10/2026 — Corrections de l’Accueil après recette réelle du portable

En-tête réel : cloche d’alertes et engrenage Réglages remplacent compactage/burger ; ancien réglage compact non appliqué au vrai shell. Indicateurs encadrés, repli à droite, listes à hauteur naturelle/plafond viewport et défilement. [Décisions, protocole ciblé et limites](docs/ux-v2/ACCUEIL-ADAPTATIF-2026-10-22.md). Aucune règle métier/migration/donnée réelle. Une configuration standard et un redimensionnement, pas de matrice exhaustive ; anciens bancs dépendants du compactage à adapter avant convergence. Nouvelle recette portable distincte prévue, sans remplacer une application ouverte.

## 22/10/2026 — Portable de recette du pilote

Utilisateur demande un exécutable pour vérifier connexions et responsive. Portable Windows x64 construit au code `139d7e71621e659b98e40b2d18bf5a74406589f4`, sans installateur, dans `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Pilote-20261022-139d7e71`. Lanceur obligatoire avec Profil/Workspace propres ;7 prospects,1 client,2 devis,1 projet et1 session synthétiques, aucune copie des données réelles. Contrôle du vrai package sur une copie TEMP :19 assertions,5 modules, intégrité/FK/migrations71 et chrono unique verts. Préparation du profil exécutée. ZIP dans Downloads `AtoumWeb-Pilote-139d7e71.zip`,161911754 octets,86 fichiers,CRC OK ; manifeste hashes EXE/ASAR et validation inclus. Cette note documentaire ne change pas le code empaqueté. Pas de CI/main/installation ou campagne multiconfiguration ; responsive étendu à contrôler par l’utilisateur. Les anciennes recettes restent intactes.

## 22/10/2026 — Pilote ergonomique Prospection

Suite aux13 visuels, branche locale `codex/ux-v2-prospection-visual-pilot` depuis01909b4b. Compteurs filtrants, colonnes action/échéance, fiche rapide hiérarchisée, pipeline compact avec échéances et conversion séparée ; historique conservé. Prospect A et moteurs métier/IPC/migrations inchangés. Garde historique de non-affichage du placeholder Prospects préservé. [Périmètre, contrôles et réserves](docs/ux-v2/PROSPECTION-PILOTE-2026-10-22.md). Validation limitée à Noir/Confort/1920×1080/100%, typecheck,12 unitaires ciblés et22 natifs ; résultats définitifs au SHA propre dans le bilan local. Client en attente ; aucune fusion/publication/CI/installation/donnée réelle. Remplacement des commandes d’en-tête par cloche/réglages encore à traiter séparément.

## 22/10/2026 — Correction de la composition Accueil selon référence

Correction ciblée suivante : logo AtoumWeb sans plaque blanche et vrai anneau Temps & facturation (conflit de spécificité CSS identifié), ratios issus des temps réels sans croissance inventée. Dernier arbitrage utilisateur : référence Accueil bleu nuit/jaune et style des icônes explicitement retenus, remplaçant le retour provisoire à la palette Noir. Application limitée à l’Accueil, pas aux autres pages. Première simplification jugée insuffisamment fidèle : reprise de la composition Today/Watch, cartes colorées, pipeline compact, projets récents et rail/en-tête. Nouveau protocole demandé : Noir, Confort,1920×1080,100% uniquement ; typecheck et recette ciblée, aucune nouvelle suite complète. Sources métier/services/IPC/migrations/CRM inchangés ; préférences personnelles conservées. [Audit des écarts et protocole](docs/ux-v2/RECETTE-VISUELLE-2026-10-22.md). Validation visuelle attendue ; aucune publication, fusion ou installation.

## 22/10/2026 — Reprise visuelle ciblée : Accueil et shell

Utilisateur autorise les corrections visibles de l'Accueil, du rail et de l'en-tête, avec adaptation aux fenêtres et zooms de PC. Branche locale `codex/ux-v2-shell-home-simplification` depuis main921f0066. Doublons/annotations retirés, détails à la demande, repli des six blocs et cinq groupes, préférences visuelles existantes étendues sans données métier. [Registre, décisions et protocole](docs/ux-v2/RECETTE-VISUELLE-2026-10-22.md). Validation visuelle humaine encore attendue ; preuves techniques finales rattachées au SHA propre dans le bilan. Aucune migration/service/prix/contrat ou fiche CRM modifié ; aucune publication/CI hébergée/installation/fusion. EC04 reste non exposé. La recette portable921f0066 déjà livrée reste inchangée.


## 18/10/2026 — EC04 : convergence GitHub autorisée, aucune fusion

PR draft #156 créée depuis ae33cccf sur main376eef94 ; simulation sans conflit/arbre identique. CI1808 : typecheck et4 contrôles Python verts,1659/1660 Vitest,35 restaurations vertes ; timeout du seul test de réouverture logo CRM (5258ms/5000ms), banc natif EC04 non exécuté. Correction fixture uniquement : export du vrai schéma migré en mémoire vers SQLite disque, import/réouverture/assertions conservés et registre71 explicitement vérifié. Ciblés43/43 verts ; validation complète du nouveau HEAD confiée à la CI automatique. [Bilan vivant de convergence](docs/ux-v2/EC04-CONVERGENCE-2026-10-18.md), résultats finaux/SHA dans la PR. Aucun service, migration, interface, données réelles ou installateur modifié. EC04 expérimental non exposé ; production/activation NO-GO. Main et toute fusion restent soumis à autorisation humaine.


## 18/10/2026 - EC04 : validation MSI isolee avant convergence

Worktree dedie atoumweb-manager-ec04-validation, branche feature/ec04-workspace-file-inventory-v1 depuis990d850e, main376eef94. Corrections demontrees : erreur masquee du bail invalide, fixtures de liens Windows, contournement preferences synchrones et empreinte documentaire legacy, refus du bootstrap corrompu, snapshots WAL creant des annexes a la lecture. Aucune migration ajoutee : registre1-71 conserve. Normalisation DELETE seulement de la copie privee, refus des liens avant conversion et diagnostics WAL fail-closed. Audit170 fichiers/1032sites candidats, limites hors IPC explicites ; capture globale toujours inaccessible et B1 non chiffre/non certifie. [Audit ecritures](docs/ux-v2/EC04-MSI-AUDIT-ECRITURES-2026-10-18.md). Preparation au code cf59ca43 : typecheck,1660/1660 Vitest (194 fichiers),36 controles natifs et reprise en2 processus verts. Campagne finale au commit documentaire fige : resultats au SHA publie dans la passation et le compte rendu de livraison. GO revue/convergence du socle experimental NON expose ; NO-GO activation/production. Aucun main, installateur, workspace reel ou CI hebergee.


## 16/10/2026 - PR155 / CI1805 : diagnostic minimal du blur 01C

CI1805 valide le focus530 et36 etapes natives puis echoue sur Blur completes moved gesture once. Banc seul instrumente : geometrie avant/apres et oracle boundedSplit reel, sonde700 puis deplacement relatif effectivement different avant blur ; assertions historiques conservees. Ordre des ateliers courts prepare dans convergence-state, memes46 commandes/environnements. Une seule execution locale01C autorisee et tracee dans outputs/pr155-01c-blur/ ; aucun autre test, push, CI, main, installation ou base reelle. Composant de production inchange.


## 16/10/2026 - PR155 : correction locale de la preparation du focus natif

CI1804 : typecheck et1532 tests verts, arret final-visual. Reproduction Windows : fenetre/webContents/document focalises, textarea dans le groupe Besoins ferme, checkVisibility=false, activeElement=BODY. La recette confondait montage et visibilite ; premier Tab faussement positif. Correctif exclusivement scripts/fixtures/final-visual-scenarios.cjs : ouvrir le groupe par son summary, verifier sa visibilite, vrai clic souris natif et Tab/Maj+Tab conserves, assertions renforcees. Premier essai corrige :530 controles/135 captures, aucun changement src/migration/workflow. [Diagnostic et protocole cible](docs/ux-v2/PR155-FOCUS-NATIF-2026-10-16.md). Repetitions et recettes residuelles tracees dans les preuves locales, sans relancer la campagne complete. Aucun push, nouvelle CI, merge, installation ou donnees reelles autorise.


## 16/10/2026 - Campagne candidate visuelle / EC03 autorisee

Les validations locales existantes sont conservees sans relancer les 41 commandes. Seule l'orchestration CI est completee pour EC01, Prospect A, Client B, EC03 et les recettes visuelles ; sources applicatives et migrations identiques au code teste ead8a16a. [Couverture et protocole unique](docs/ux-v2/CI-CANDIDATE-VISUELLE-EC03-2026-10-16.md). Publication en PR draft et une seule campagne candidate autorisees ; aucune fusion, installation ou donnee reelle. Les resultats heberges seront releves separement des preuves locales.


## 16/10/2026 — Clôture de l’investigation UX/UI V2, convergence non exécutée

Main distant `c4bb744dbe58531350a61fb16ad5f8fbe90bd59d`, CI #1803 verte (1 453 tests/162 fichiers), distincte des candidats locaux. Prospect A `03693f86`, Client B `f85fd498`, EC03 `b77a3ce5` conservés. Branche isolée `codex/ux-v2-closure-convergence-audit` : deux assertions natives obsolètes 1–70 corrigées en 1–71 au code `768b32b7`, puis visibilité des bancs Windows corrigée à `ead8a16a`; aucun code de production ou moteur de sauvegarde changé. Typecheck, 1 532/1 532 Vitest (167 fichiers, 35 restaurations, 6 binaires) et 41 commandes Electron/traçabilité réussis au SHA `ead8a16a684c89f2dbb9ec26763574adec3fb3fe`. Réexamen des 57 points : 40 conformes au scénario borné, 16 preuves insuffisantes, une décision métier ; 67 références et 58 sous-lots tracés sans prétendre à une certification exhaustive. [Bilan de clôture](docs/ux-v2/CLOTURE-CONFORMITE-2026-10-16.md), [architecture de sauvegarde](docs/ux-v2/SAUVEGARDE-WORKSPACE-ARCHITECTURE-2026-10-16.md), [ordre Git/CI/migration 71](docs/ux-v2/CONVERGENCE-VISUELLE-EC03-2026-10-16.md). Archivage des identités Annuaire non exposé ; sauvegarde actuelle SQLite seule, logos/fichiers externes hors périmètre. Recette humaine globale différée, variantes graphiques validées non rouvertes. Aucun push/PR/CI hébergée/merge/main/MSI ni base réelle ; autorisations de convergence et migration réelle encore nécessaires. Les entrées ci-dessous sont historiques.

## 16/10/2026 — EC03 : développement autorisé, candidat métier local

Plan EC03 approuvé explicitement. Branche isolée `codex/ec03-explicit-contract-lifecycle` depuis `472cfc59` / code visuel `f85fd498`. Lecture pure, comparaison/adoption volontaire, préparation distincte de l’envoi attesté, reprise explicite avant envoi, registre immuable et révisions reprenant les clauses sélectionnées. Migration additive **71 — quote_contract_transmission_v1**, disponible dans les 194 références vérifiées et les 15 worktrees ; appliquée uniquement sur fixtures. Migrations 1–70 inchangées. [Implémentation, compatibilité et réserves](docs/ux-v2/EC03-IMPLEMENTATION-2026-10-16.md). Tests ciblés et premières recettes Electron verts ; validation complète au SHA final à consigner dans `outputs/ec03-final-20261016/RESULTATS.md`, sans substituer les preuves intermédiaires. Aucun push, CI hébergée, main, installation ou données réelles. Ancienne entrée « plan à valider » ci-dessous conservée pour historique et remplacée par l’accord présent. Logos hors SQLite et avenants après acceptation restent distincts.


## 16/10/2026 — EC03 : arbitrage envoi approuvé, plan technique à valider

Option A approuvée : contrat/CGV figés à l’envoi effectif, distinct de la finalisation et de l’acceptation Abby. Lecture seule à l’ouverture ; adoption des nouvelles versions uniquement explicite. [Diagnostic, compatibilité historique, migration additive proposée et tests](docs/ux-v2/EC03-CONTRAT-FIGE-ENVOI-PLAN-2026-10-16.md). Analyse au code `f85fd498` ; 92/92 tests existants des trois services contractuels réussis (13,22 s), ils ne valident pas le protocole futur. Branche documentaire `codex/plan-ec03-sent-contracts` uniquement : aucun moteur, migration, donnée réelle, CI ou main modifié. **Implémentation en attente d’accord sur le plan** ; aucune reconstruction automatique des anciens snapshots. Prospect A et Client B conservés ; sauvegarde des logos hors SQLite toujours distincte.


## 16/10/2026 — Client B approuvée : raccordement réel du Résumé

Décision utilisateur : Client B « Espace central élargi » est retenue définitivement ; Client A abandonnée. Branche `codex/ux-v2-client-b-final` depuis `4f0b0a12` : vrais éditeurs prioritaires, suivi commercial responsive, activité récente issue de l’historique existant, coordonnées et gestion secondaires repliables mais montées ; titre administratif retiré. Défauts Client 220/190 px uniquement en l’absence de préférences ; réglages existants et Prospect A préservés. [Implémentation, compatibilité et protocole](docs/ux-v2/CLIENT-B-CLOTURE-2026-10-16.md). Tests ciblés de développement verts ; preuves finales à produire au SHA commité. EC01 conservé ; EC03/moteur contractuel et sauvegarde des logos hors SQLite restent hors périmètre. Aucun main, CI hébergée, installation, migration ou donnée réelle modifié.

## 16/10/2026 — Revue ciblée EC01 / EC02 / EC03

Prospect A reste graphiquement approuvée et inchangée. Branche locale `codex/ux-v2-ec01-client-review` issue de `03693f86` : retour à la ligne de l'en-tête selon sa largeur réelle, avec régression native permanente (270 états). Diagnostic CGV sur fixtures : deux synchronisations en développement StrictMode, une avec React production ; l'ouverture écrit déjà des clauses/journaux, aucun moteur ni historique modifié. Deux propositions Client uniquement TEMP, sans activation définitive. [Cause, protocole, propositions et réserves](docs/ux-v2/EC01-EC02-EC03-REVUE-2026-10-16.md). Validation du candidat final à rattacher au SHA réellement testé dans le bilan local. Aucune fusion, CI hébergée, installation, migration ou donnée réelle. La sauvegarde des logos hors SQLite reste à arbitrer séparément.

## 15/10/2026 — Prospect : variante A validée, deux ajustements de clôture

Décision explicite utilisateur : **A — Synthèse en bandeau** devient la référence ; B est abandonnée, sans généralisation Client. Le statut réel reste dans la synthèse commerciale, retiré de la seule colonne Identité de la fiche complète. Prochaine action : icône horloge partagée et libellé légèrement renforcé, sans nouvelle carte ni nouveau statut, avec le même accès à la relance réelle. Trois groupes initialement fermés, éditeurs montés, brouillons et garde UX-01 inchangés.

Relecture du dossier des 67 captures et de la branche documentaire GitHub `0bb0860e` : les maquettes historiques ne sont pas des décisions supplémentaires. La demande ancienne de deux variantes est remplacée par le choix A explicite. [Décisions, périmètre et protocole de preuve](docs/ux-v2/PROSPECT-A-CLOTURE-2026-10-15.md). Résultats nouveaux et captures à produire après commit, rattachés à son SHA exact ; les anciens résultats ne certifient pas ce candidat. Aucune fusion, publication, installation, migration ou donnée réelle/Validation-MSI.

## 15/10/2026 — Deux compositions Prospect uniquement, choix visuel en attente

L’utilisateur valide l’architecture trois régions mais demande un allègement plus net de la fiche Prospect, particulièrement Noir/Confort/125%. Branche locale `codex/ux-v2-prospect-density-options`, départf66a06d1. Deux propositions réelles sur les mêmes éditeurs : A Synthèse en bandeau, B Action prioritaire. Après schéma transmis par l’utilisateur, trois groupes fermés au départ : Entreprise et contacts, Besoins et qualification, Devis et activités. Les groupes utilisent les disclosures natifs, gardent leurs composants montés et ne créent aucune autre garde. Les liens Associations sont sans cartes, les informations source et visuels restent dans Logo et actions. Titre « Fiche de travail prospect » retiré ; logo/nom/statut prioritaires, référence/provenance dans un volet secondaire ; température/situation/prochaine action regroupées, détails consultables, cadres Devis allégés. Aucun corps métier ni callback supprimé. Un lien de synthèse déplie l’accordéon existant avant de le cibler et rend le focus au bouton.

B est une variante de présentation réservée au banc isolé (attribut DOM), sans nouveau réglage utilisateur ni deuxième architecture UX-01. Les deux propositions partagent la même fiche et le même brouillon. Tests/captures réellement exécutés au HEAD candidat dans le bilan local livré ; ne pas les déduire des résultats f66a06d1. Aucune généralisation Client, fusion, publication GitHub, CI, migration, installation ou données réelles/Validation-MSI. Les demandes transversales du fichier joint restent à reprendre après le choix de densité demandé dans le message principal. **Prochain gate : choix visuel A/B ; aucune option n’est déclarée validée humainement.**


## 15/10/2026 — Dernière passe ergonomique CRM, avant avis visuel final

Principe des trois zones accepté par l’utilisateur ; validation du rendu final encore ouverte. Sur `codex/ux-v2-final-crm-brand-help`, code `389a1a70` : adaptation à la largeur effective de la fiche (zoom compris), Identité compacte et Associations repliables sans démontage, huit onglets sur une ligne avec accès clavier/défilement, séparateurs souris/clavier avec une seule écriture en fin de geste. Explications techniques des visuels déplacées dans FieldHelp. Aucun service, migration, règle métier ou protection UX-01 modifié par cette passe.

Contrôles exécutés au code389a1a70 : typecheck OK,1500/1500 Vitest (166 fichiers,96,19s),35 restaurations/6 binaires ;674 assertions du nouveau banc ergonomique et79 aides dans une vraie fiche, aucune erreur console/RPC. Comparaison avant/après sur fixtures identiques : trois tailles × trois zooms × neuf thèmes/densités, huit onglets Client, Prospect, pipeline et Annuaire. Dernière validation répétée et preuves finales rattachées au HEAD documentaire dans le ZIP autonome demandé ; ne pas réutiliser les anciennes captures015ff032 comme preuve de ce candidat.

Sauvegarde : test réel TEMP prouve que `createBackup` conserve l’association SQLite mais pas les fichiers. Copie TEMP du dossier `crm-identites` rétablit les octets correspondants. **Aucune sauvegarde/restauration complète automatique du workspace n’est certifiée.** [Proposition et risques avant toute évolution du moteur](docs/ux-v2/DERNIERE-PASSE-ERGONOMIQUE-2026-10-15.md). Aucun push, CI, merge, installation, lanceur ou donnée réelle/Validation-MSI modifié. Prochain gate : avis visuel sur le ZIP, puis décision distincte concernant la sauvegarde complète.


## 15/10/2026 — Finalisation CRM et master de marque utilisateur : candidat local

Le dossier utilisateur C01–C11 précise les critères de fin : logo original du 9 octobre, aides sans doublon, pictogrammes différenciés, logo d'entreprise persistant et fiches complètes à trois régions. Nouvelle branche locale `codex/ux-v2-final-crm-brand-help`, départ `3e2a1f32`. Les validations graphiques précédentes ne valent pas acceptation de ces nouveaux rendus. [Décisions, audit ciblé et limites de sauvegarde des médias](docs/ux-v2/FINALISATION-CRM-MARQUE-2026-10-15.md). Code applicatif `d2963d6864d7c1adf6421a536c702416cedda471` : typecheck OK,1500/1500 Vitest,35 restaurations/6 binaires,580 assertions CRM,825 tableaux,109 aides +52 sur vraie fiche,132 pilote Prospection,214 Annuaire ;468 captures avant/après. Gate humain du logo et des deux fiches encore ouvert avant packaging ou installation. Galerie locale `captures/finalization-20261015/review/index.html`. Aucun push, main, migration, workspace réel ou Validation-MSI modifié.

## 15/10/2026 — Direction graphique approuvée, généralisation en cours

L’utilisateur a validé le pilote, puis demandé explicitement son application aux autres onglets, au pipeline, aux icônes et aux interactions du référentiel. Branche locale `codex/ux-v2-visual-generalization`, départ `b1c3964b` ; main non modifié. Le symbole proposé est approuvé ; les wordmarks restent des approximations typographiques documentées.

Premier incrément : Clients (huit onglets préservés), Annuaire, Catalogue, Devis, Projets, Demandes/Interventions, Temps, Facturation, Dépenses et Documents raccordés aux contrôles existants de colonnes/vues/tri, avec schémas propres et préférences workspace limitées à la présentation. Treize schémas de listes réelles. Colonnes Décision Devis et Actions Temps obligatoires. Les listes compactes et les éditeurs spécialisés restent conservés. Pipeline6+1 iconifié, cartes accessibles par Entrée/Espace via la même garde UX-01 ; aucune transition modifiée. Icône de destination et aide contextuelle commune dans les titres des modules. Boutons de fermeture/retrait iconifiés sans changement de callbacks ; labels conservés/ajoutés. Packaging et fenêtres raccordés au même symbole approuvé, sans modifier les identifiants de l’application ni un exécutable livré.

Validation du jalon : typecheck OK,1487 Vitest/164 fichiers,35 restaurations/6 binaires,35 gates natives au code0b6d598e puis contrôles ciblés sur le code43a2129b. Treize tableaux réels825, CRM205, pipeline132, UX-01 192, Catalogue109 et galerie49 icônes42 ;234 captures synchronisées. Package réel331 contrôles/162 visites sur TEMP, aucun déploiement. [Bilan et traçabilité détaillés](docs/ux-v2/VISUAL-GENERALISATION-2026-10-15.md). Le HEAD a6396f50 ajoute seulement une robustesse de banc Windows après le code43a2129b ; sources applicatives identiques. Les autres dispositions spécialisées04–10 ne sont pas présumées intégralement harmonisées. Aucune donnée réelle/Validation-MSI, service métier, IPC ou migration modifié ; aucune fusion/push/CI hébergée autorisé par cette validation graphique.

## 15/10/2026 — Reprise graphique : pilote Prospection en attente d’avis humain

`main@c4bb744d` / PR153 / CI1803 verte confirme l’intégration technique01–10, **pas la conformité graphique globale**. Référentiel officiel relu sur `docs/ux-v2-reference-v1@0bb0860e`. Nouvelle branche locale `codex/ux-v2-visual-pilot`, correctifs du rail préservés ; code `78bad55f` puis alias typographique `5c6086d5`.

Travail réel :48 icônes communes,17 destinations sans initiales provisoires, symbole candidat d’après les trois références utilisateur, en-tête allégé avec le vrai chrono unique, tableau Prospection réellement configurable (tri, largeurs, ordre, visibilité, vues personnelles) utilisant les contrôles01D et le magasin workspace existants. Aplats des fiches remplacés par surfaces du thème, température discrète, aides et actions iconifiées. Services, IPC métier, migrations1–70 et données utilisateur inchangés.

[Matrice01–10, registre des écarts et bilan](docs/ux-v2/VISUAL-REPRISE-2026-10-15.md).36 captures avant +36 après sur neuf configurations ; comparateur local `captures/visual-pilot-review/index.html`. Pilote105 assertions et interface réelle840 au code5c6086d5 ; UX-01 192, CRM76, en-tête167, rail125, atelier tableaux126 et galerie42. Suite globale finale1 461/1 461 (164 fichiers,103,90 s),35 restaurations et6 contrôles binaires réussis au code5c6086d5. Aucun push, CI supplémentaire, merge, installation ou modification d’un workspace réel.

**Prochain point obligatoire : validation de la direction graphique du pilote et du master de marque.** SVG/PNG/ICO proposés ne sont pas approuvés ; activation Windows/Squirrel et généralisation03D–10 attendent cet accord. Les huit onglets Client ne sont pas à recréer ; archivage Annuaire non exposé, réserves contractuelles05C et externes conservées. Ne pas déclarer la refonte globale achevée sur la seule convergence technique.

## 15/10/2026 — Correction visuelle du rail réduit

Après signalement utilisateur, reprise du référentiel 02A/02B et correction locale du sous-menu masqué par l'en-tête. Base `c4bb744d`, branche `codex/fix-v2-collapsed-rail-render`, code `241bf1d6`. Placement réactif sous l'en-tête, libellés alignés, clavier/focus préservés. Typecheck OK ; 1 453 tests Vitest, 840 contrôles de l'application réelle, 125 contrôles atelier et 192 UX-01 réussis sur fixtures temporaires. Neuf captures synchronisées ; [bilan et réserves visuelles](docs/ux-v2/RAIL-REDUIT-RENDU-2026-10-15.md). Aucun déploiement, merge ou changement des données réelles. Logo/pictogrammes provisoires et recette humaine restent ouverts.


## 15/10/2026 — Convergence04–09 intégrée, candidat10 et nouveau workspace V2

PR148 à152 fusionnées normalement après CI verte ; mainf72ddc9f contient04–09. PR sources conservées. Candidat10 préserve filtres de facturation/cohortes exactes, retour Projet/Devis, UX-01 et contrats05/09. Tests et preuves empaquetées dans le [bilan de convergence](docs/ux-v2/CONVERGENCE-04-10-2026-10-15.md). Validation finale35 recettes/typecheck/1453 tests à relever au SHA du candidat puis en CI.

Utilisateur choisit un nouveau workspace réunissant contrats récents et226 temps/6 pauses historiques ; rapprochement sur copie vérifié par service réel et interface empaquetée. Originaux, profils et lanceurs existants inchangés. Nouveau workspace persistant en préparation, pas de bascule quotidienne implicite. Recette humaine/juridique et réserves externes maintenues.


## 15/10/2026 — Convergence10 et parcours statistiques

Source130 fc054e73 reprise avec son historique10A–E. Cohortes exactes10B combinées aux filtres09, protections de saisie facture et retour Projet/Devis07. Préférences10D et garde workspace/restauration existante conservées. Aucun changement de migration ou de durée historique. Les102 scénarios10 restent une matrice de couverture (42 traces,43 partiels,17 humains/intégration), pas102 réussites présumées. Recettes natives, couverture, UX-01 et restauration exigées sur candidat propre.

## 15/10/2026 — Correction du workflow candidat09

CI1799 refusée avant création de jobs : l’étape08A avait perdu son bloc run lors du rapprochement, déplacé sous un doublon mal nommé03B. Rétablissement exact des commandes08A et suppression du seul doublon ; étape03B originale conservée. Validation locale actionlint1.7.12 et parsing YAML réussis. Aucun test, délai, service ou migration modifié. Nouvelle CI candidate nécessaire ; la précédente n’a exécuté aucun test.


## 15/10/2026 — Convergence09 et protection de revue Word

Source134 11631769 incorporée avec historique09A–E ; branches de coexistence135/136 non fusionnées. Bibliothèque05 (classement huit rubriques, UX-01, versions) préservée conjointement au DOCX de brouillon09E. Revue Word modifiée désormais protégée par la garde UX-01 existante : Rester conserve la comparaison, Quitter abandonne seulement le brouillon non approuvé, aucune publication implicite. Nouvelles assertions Electron explicites. Aucun texte juridique ni migration modifié. Source Abby reste externe et facturé ne signifie pas payé.

## 15/10/2026 — Convergence08 sur socle04–07

PR131 e9f5e817 intégrée une seule fois dans le candidat isolé ; sources109/115/137 non rejouées. Projections de débit sans écriture, clôture atomique, périodes anniversaire et protections de rapport/dépassement conservées. Aucun ajout de réouverture commerciale ou de contrepassation automatique. Migrations1–70 inchangées. Recettes08, UX-01, restauration et shell exécutées par la gate de convergence sur le SHA candidat. Données persistantes intactes.


## 15/10/2026 — Préparation isolée07 après rapprochement04–06

Sources07 incorporées une seule fois :116d05ab7d7 →1454c82c077 →146fda0e6ae. Brouillons et retourProjet/Devis, Projet prévisionnel, garde remplacement/archives, ordre/undo de compositions, réutilisation et preuve de package local conservés. Les workflows07 sources restent conditionnés à leurs branches ; le nouveau candidat exécute leurs recettes dans la gate native de convergence sur son propreSHA, sans assimiler les jobs ignorés à des réussites.

Registre final1–70 conservé ; fixture07A actualisée vers ce registre complet, assertions intactes. Tests métier complets et recettes réelles à exécuter sur candidat propre. Aucune intervention Bridge/WordPress, publication distante ou données réelles. Réserves WordPress/Divi4/5, MSI et recette humaine toujours explicites ; aucun moteur de publication production inventé.


## 15/10/2026 — Préparation de convergence06, dépendance04+05 en CI

06#1248cf467c3 rapproché du candidat04+05 via merge normal ; conservation conjointe des filtres Catalogue, gardes de rafraîchissement/versions/acceptation Abby et option canonique05C. Les clauses orphelines restent en historique mais sont exclues du texte, y compris des conditions particulières ; aucune modification du contenu publié. CI148 du socle04+05 attendue avant toute intégration06 dansmain. Référentiel#82 manquant importé comme documentation historique, sans écraser les rapports existants ni fusionner son ancien code.

La recette06 couvre les six modes natifs Devis (PDF, création, prérequis, rafraîchissement, versions, acceptation), recommandations, bibliothèque contractuelle, UX-01, restauration et banc01–03. Chaque résultat à relever au SHA exact ; aucune assimilation des anciennesCI à la convergence actuelle.


## 15/10/2026 — Convergence générale autorisée, premier candidat04+05

Autorisation utilisateur explicite : intégration progressive04–10, corrections et CI/fusions après contrôles verts. Aucune autorisation de publication externe de production. Contrats/CGV et temps/historiques/rattachements intangibles ; aucun nettoyage nécessaire ni effectué.

Candidat depuis maincc0bc679 : Catalogue118e549bdd7 et tardif04B57afcdae, Contrats1211404f432, garde13812730939. Registre1–70 :67 catégories,68 recommandations,69 revues contractuelles,70 détails recommandations. SQL1–66 comparé au socle sans changement. Conflits résolus par conservation des quatre migrations et des assertions des deux branches ; workflow natif désormais exécuté sur le candidat assemblé et après merge main, pas seulement sur les anciens numéros de PR.

Première suite assemblée :1262 tests existants verts/typecheck. Deux régressions supplémentaires sur la conservation et la reprise après échec70 passent. Copies des bases Windows66/18/34/65 migrées vers70 : textes/versions/identifiants/timestamps et données protégées identiques ;226 sessions et6 pauses de la sauvegarde65 conservées ;29+149 fichiers de référence copiés et empreintes identiques. Sauvegardes/restaurations des copies et FK/intégrité réussies. Originaux non ouverts en écriture, aucune réinjection dans la base active. Les preuves privées restent sous outputs ignoré par Git ; pas de données contractuelles ou temporelles réelles dans la CI.

Recette finale du SHA porteur à exécuter avant publication, résultats exacts dans la PR de convergence. Recette humaine finale différée ; pas de certification juridique, Word/Abby/WordPress réels ni MSI installé revendiquée.

## 14/10/2026 — Finalisation PR111 : brouillons Projets/Sites/Composition

- Branche isolée `fix/ux-v2-07a-composition-unsaved-20261014` depuis2cc1bd2f, base maincc0bc679 ; aucune branche parallèle modifiée. Corrections de démontage des réglages, baseline par occurrence, création/modales/modes, reset/retrait, pending et réponses périmées via UX-01 existant.
- Checkpoint e3a8942d : typecheck,1042 Vitest/109 fichiers,35 restaurations,6 binaires,10 tests migrations1–66 ;70 contrôles natifs dédiés/neuf captures,65 Composition historique,183 UX-01 ; intégrité/FK/TEMP OK. Trois régressions clavier supplémentaires passent ensuite (banc64 sans captures). Résultats/SHA définitifs du commit porteur dansPR111, sans présumer une CI verte.
- CI38564044517 refusée avant toute étape : facturation/plafond (annotation GitHub consultée), pas erreur TypeScript. Aucun dispatch/rerun, budget ou timeout modifié. Publication normale autorisée après validation ; pas de merge.
- [Rapport07A](docs/ux-v2/LOT-07A-CORRECTIF-BROUILLONS-2026-10-14.md). 07B non commencé ici, nécessite reprise du référentiel existant et autorisation. Recette humaine différée ; archivage identités Annuaire non exposé. Validation-MSI/données réelles/Bridge/WordPress et branches des autres lots préservés.

## 14/10/2026 — Lot 09F : clôture technique du candidat complet 09A–09E, sans fusion dans main

- **VALIDÉ TECHNIQUEMENT** dans [PR #134](https://github.com/atoumweb-prog/atoumweb-manager/pull/134) draft. [CI Windows #38618468110](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38618468110) **SUCCESS** sur le SHA du code `8bf6d8e6f05bc1ad32d93853e2e652fb8495cf54`.
- Un seul arbre Windows TEMP : TypeScript OK, **114 fichiers Vitest**, **85 assertions Electron Abby**, **67 Dépenses**, **73 Documents**, **65 Word/DOCX-PDF**, **373 UX générales** (soit **663 assertions Electron/UX**) et restauration/fermeture Windows OK. Contrôles d'intégrité SQLite et 3 thèmes × 3 densités inclus.
- Conflit résolu : `ClientDocumentService` conserve la vérification de signature PDF et SHA du 09B **avec** les garde-fous historiques Abby, les transactions documentaires et l'archivage du 09D. Les tests de PDF frauduleux désormais passent sur le candidat combiné.
- Les sous-lots 09A, 09B, 09C, 09D, 09E et 09F sont **validés techniquement sur leur périmètre livré** ; 09E ne prétend pas convertir fidèlement les tableaux, images, macros et éléments riches Word.
- Seuls restent les contrôles liés au `main` de destination (réconciliation des lots parallèles, recette CI/Windows post-inclusion), et la recette humaine de présentation/Word/juridique. Ordre proposé : #113 (base 09A) puis #134 (candidat intégré), **pas** de fusion supplémentaire de #119/#129/#132/#133 ; aucune fusion effectuée.
- Détails, limites et gates : `docs/ux-v2/LOT-09F-CONVERGENCE-2026-10-14.md`.

## 14/10/2026 — 09D Documents : validé techniquement (périmètre isolé)

- PR [#132](https://github.com/atoumweb-prog/atoumweb-manager/pull/132) draft sur 09A, sans merge. CI [#38602868964](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38602868964) **SUCCESS** sur `d708297` : typecheck, 110 fichiers de tests, 73 assertions natives Electron Documents, 373 UX générales, restauration Windows.
- Quatre entrées documentaires avec vrais services (et dépôt hors Client honnêtement indiqué non disponible), garde UX-01 sur métadonnées, SHA et provenance visibles, fichiers manquants et modifiés refusés, archivage et correction de métadonnées atomiques.
- Dépendance à 09B/#119 pour les anciennes factures Abby remplacées : convergence à vérifier avant `main`. Pas de validation humaine ni fusion.
- Détails : `docs/ux-v2/LOT-09D-PLAN-EXECUTION-2026-10-14.md`.


## 14/10/2026 — Lot 09C : validé techniquement (Dépenses/justificatifs)

- PR [#129](https://github.com/atoumweb-prog/atoumweb-manager/pull/129) **draft**, base 09A/#113, indépendante de 09B/#119 ; aucun merge dans main.
- CI Windows [#38600849268](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38600849268) **SUCCESS** sur `607eb0d` : TypeScript, 110 fichiers Vitest, 67 assertions Electron Dépenses, 373 UX générales, restauration Windows TEMP.
- Métier : justificatifs versionnés et protégés SHA-256, sauvegardes atomiques avec rollback, corrections de dépenses payées déclarées tracées et confirmées, garde UX-01, Client/Projet cohérents, alerte d'échéance sans occurrence artificielle.
- Matrice R09C-01 à R09C-17 couverte : `docs/ux-v2/LOT-09C-PLAN-EXECUTION-2026-10-14.md`.
- Validation humaine et convergence des sous-lots 09A/09B/09C, puis contrôles d'intégration main, demeurent à faire. 09D ouvert séparément, sans fusion.


## 14/10/2026 — Lot 09B : clôture technique facturation Abby (validé techniquement)

- Branche `feature/ux-v2-lot09b-billing-20261014`, [PR #119](https://github.com/atoumweb-prog/atoumweb-manager/pull/119) **draft**, base PR #113/09A, sans fusion dans `main`.
- Garanties implémentées : Client et catégorie facture contrôlés ; rejet des PDF archivés, mal typés, altérés ou sans signature PDF ; empreinte SHA-256 au niveau du service métier ; pièces anciennes conservées et protégées même après remplacement ; journal de provenance avec ancien/nouveau document et références/dates.
- Cohérence : rattachement et journal, ainsi que modifications de métadonnées et journal, sont atomiques (SAVEPOINT SQLite) ; refus de déclasser un dépassement maintenance facturé ; idempotence même document ; prévention de l'association implicite d'un même document ou d'un même SHA à plusieurs éléments facturables.
- UX : confirmation native « Rester / Quitter sans enregistrer » pour référence/date lors du changement de fiche, fermeture de fiche ou navigation, sans confondre `invoiced` et `paid`.
- Recette : nouvelle fixture sur **vraie interface Facturation React + preload + IPC + SQLite et fichiers PDF TEMP**, tests d'import, remplacement, annulation du sélecteur, refus d'ouverture altérée et protections UX-01 ; smoke Electron global et restauration distincts.
- CI Windows [38598204165](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38598204165) **SUCCESS** sur `20e0557d` : TypeScript, 111 fichiers Vitest, 85 assertions Electron dédiées Abby, 373 assertions UX globales, 3 thèmes × 3 densités et restauration Windows. **09B validé techniquement**, sans validation humaine ni fusion.
- Matrice R09B-01 à R09B-17 : `docs/ux-v2/LOT-09B-PLAN-EXECUTION-2026-10-14.md`. Regroupement multi-sources jamais inféré automatiquement, suite métier explicite à concevoir si requis. Il ne reste pour 09B que l'inspection humaine et les vérifications d'intégration dans `main` après les autres lots.

## 14/10/2026 — Lot 09A : clôture technique et préparation 09B

- Branche isolée `audit/ux-v2-lot09-20261014`, PR #113 **draft**, sans merge. CI #1042 (run 38579044064) **SUCCESS** sur `8b57e3e` : typecheck, suite Vitest, Electron UI/SQLite TEMP et restauration/redémarrage TEMP. Contrôles 09A exécutés, sans validation humaine anticipée.
- Sécurisé : suppression impossible d'un document de facture référencé ; copies de justificatifs versionnées et vérifiées SHA-256 ; ouverture d'un exemplaire temporaire ; purge prudente de prévisualisations anciennes appartenant au Manager. Aucun changement de migration requis.
- **09A = Validé techniquement**, sous réserve de la recette humaine et de la revue finale d'intégration. `main` à `cc0bc679` lors du contrôle ; PR déclarée mergeable par GitHub mais aucun rebase ni merge réalisé.
- Prochaine étape 09B : auditer les parcours sources→Abby→facture PDF, références client et états, puis introduire uniquement les corrections minimales justifiées par des tests, sans émettre de facture dans le Manager. 09C–09F restent cadrés/non livrés.

## 14/10/2026 — Convergence technique UX/UI V2 lot 10, candidat isolé

- Source main cc0bc679 ; 10A+10B PR #125/#126 f56cf381, 10C PR #127 33095a38 (validation de la dernière CI à vérifier), 10D PR #128 c69a0c78. Copie des blobs exacts de leurs fichiers applicatifs sur une branche de convergence dédiée ; aucun service de restauration ou schéma modifié. [Gates de recette](docs/ux-v2/LOT-10E-GATES-2026-10-14.md).
- Aucun test ni recette du **candidat combiné** n'a été déclaré réussi. CI TypeScript/Vitest, Electron Windows/UX-01 et restore round-trip TEMP exigés au HEAD exact avant toute conclusion ou demande de fusion. Aucune donnée Validation-MSI ni workspace de production utilisée.

## 14/10/2026 — Dernier cas de focus : ligne toujours masquée

- Le correctif693f6af a passé typecheck/282 natifs avec81 frames/UX-01183. Complément final : si le filtre masque encore la ligne à la fermeture, retour à la recherche et conservation de sa valeur. Deux assertions clavier supplémentaires, sans mutation métier. Nouveau candidat à recetter puis une seule actualisation corrective107/CIautomatique, aucun rerun manuel.

## 14/10/2026 — PR107 et contrôle de focus complémentaire

- #107 draft publiée à7c770efd, dépendante105 ;CI873 SUCCESS/typecheck/1040 Vitest. Une assertion clavier ajoutée après publication a néanmoins reproduit le retour de focus perdu sur la liste Annuaire reconstruite.
- Correction Client/Annuaire ciblée, sans service/IPC/migration : restauration sur l'identité courante après rendu, abandonnée si une autre fiche est déjà ouverte. Deux régressions permanentes,201 contrôles natifs de mise au point verts. Validation propre du nouveaucommit :typecheck/282 avec81 frames/UX-01 avant push correctif unique etCI synchronize ; résultat exact dansPR.
- Aucune fusion105/107, mainb2796812 et branches de référence préservés. Recette humaine différée et réserve d'archivage d'identité maintenue.

## 14/10/2026 — Livraison documentaire finale du lot03

- Code publié préparé6e7aa15 :typecheck/280 contrôles03A–E/81 capturesCRM frame-vérifié, intégrité/FK/migrations/nettoyagesOK. Suite complète1040 et1421 natifs historiques à79197709. Dernière miseàjour documentaire seule ; aucune validation humaine anticipée. #105 draft/CI855 verte ; prochainePR03E draft dépendante, uniqueCIcandidate automatique.
- Suivi58 sous-lots01–10 actualisé ; travaux parallèles#103/#104/#106 signalés sans modification ni réaudit. GitHub a reconnu98–101 fusionnées par ascendance de102, mêmesHEAD, aucun merge supplémentaire dansmain, branches conservées.
- Clôture technique du périmètre03A–E proposée avec réserve d’archivage d’identité non exposé ;03D/E restent horsmain. Aucun démarrageCatalogue ni migration.

## 14/10/2026 — Validation combinée03A–03E et préparation de publication

- Code79197709 propre : typecheck,1040/1040 Vitest/109 fichiers,35 restaurations/6 binaires/sansRPC ;1421 natifs historiques +280 banc combiné (avec recouvrements),297 captures compositées. Manifeste `outputs/lot03-79197709-1791974377401/manifest.json`, toutes étapes exécutées, TEMP/intégrité/FK/migrations1–66/nettoyages OK.
- Documentation mise à jour et revue finale : clarification du libellé Projet legacy et cadrage des images sur l’éditeur Annuaire ; recette ciblée au commit de publication à relever dansPR,CIcandidate non présumée avant résultat.105 reste draft/CI855 verte ;03E dépend de105 et son diff inclut03D tant qu’il n’est pas fusionné.
- [Bilan de clôture03](docs/ux-v2/LOT-03-CLOTURE-TECHNIQUE-2026-10-14.md). Périmètre fonctionnel livré techniquement recevable ; réserve explicite sur l’archivage d’identité Annuaire, aucune nouvelle règle d’archivage inventée. Recette humaine globale différée. mainb2796812 seul intégré ; aucune fusion105/03E autorisée.

## 14/10/2026 — 03D publiée ; candidat03E et recette globale03

- #105 draft, HEAD `bd406e1c98cb2048dbc26b8f4ec612c91dd7d15e`, [CI855 SUCCESS](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38548252238) : typecheck/1029 Vitest ;35 restaurations/6 binaires/sansRPC. Au même SHA, local :1421 natifs historiques/216 captures +125 Client/72 captures, TEMP/FK/intégrité/migrations/nettoyage OK. main reste b2796812 ; aucune fusion105.
- Branche03E `codex/ux-v2-03e-directory` dépend explicitement de105. RegistreUX-01 réutilisé, sauvegardes identité/coordonnées atomiques, jetons de création anti-rejeu, comparaison avant écritures, réponses tardives invalidées et historiques de vérification explicite dans activity_events. Les fiches Prospect/Client réemploient ce contrôle pour leurs identités communes ; contacts principaux/décisionnaires03C existants préservés.
- Aucun nouveau schéma ni migration. Aucun Catalogue/CGV/contrat, règle de conversion ou dossier réel modifié. [Exécution03E](docs/ux-v2/LOT-03E-EXECUTION-2026-10-14.md) et [matrice03A–E](docs/ux-v2/LOT-03-CLOTURE-TECHNIQUE-2026-10-14.md). Recette finale du candidat propre à exécuter : ne pas convertir les résultats de mise au point en validation de son SHA.
- 04 reste préparé dansPR82, non repris en code ici. Recette humaine globale différée. Publication03E draft autorisée après recette complète ; fusion ultérieure interdite sans nouvel accord.

## 14/10/2026 — PR102 intégrée ; reprise 03D puis 03E

- PR102 fusionnée normalement à `b2796812ee24c9e9e824f3d66564f2c1a335bffe`, parents `278ff2da` et `9223f267` ; arbre `88834f9068a3f5a4bd3857cd89b2a6c23df348ce`, identique à la candidate CI780. CI post-fusion [781](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38521894631) SUCCESS : typecheck,1020 Vitest/107 fichiers,35 restaurations,6 binaires,sansRPC. Recette native locale sur **le merge exact** :1421 contrôles,216 captures,intégrité/FK/migrations1–66/nettoyages OK ; les étapes natives conditionnelles ne sont pas exécutées par le workflow push main.
- Développements 02C–02E et03A–03C intégrés ; sources98–101 incluses par ascendance, ni refusionnées ni fermées. Clôture comme remplacées à proposer après contrôle des HEAD. Aucun historique/branche supprimé.
- Branche03D depuis ce main : huit onglets Client, état des sections indépendant, panneaux montés, garde UX-01 et préférences de largeur par workspace ; relation/note avec comparaison sous verrou SQLite et journal atomique. Aucun nouveau schéma ni règle de conversion/vente. Les résultats finaux du candidat sont à relever au SHA testé, pas à déduire de ces changements.
- Référentiel03D/03E récupéré depuis PR82 à `0bb0860e`, contenu historique conservé. [Suivi complet](docs/ux-v2/SUIVI-AVANCEMENT.md), [exécution03D](docs/ux-v2/LOT-03D-EXECUTION-2026-10-14.md). **Lot03 non clos :03D en validation,03E à réaliser.** Recette humaine globale différée à la fin de la refonte, décision utilisateur prioritaire sur les anciennes gates demandant une recette humaine par lot.
- Lot04 préparé dansPR82 conservé ; aucune nouvelle conception, implémentation Catalogue ou migration. Suite autorisée : stabiliser03D, développer03E sur branche dédiée, recette combinée03A–E, puis reprise04A–F. Aucune autre fusion autorisée.

## 14/10/2026 — Recette finale de PR102, sans fusion

- Départ8d8b359a/CI779 verte, base278ff2da, worktree propre ; sources98–101 intactes. Inspection agent effective des81 PNG de référence, distincte de toute acceptation humaine métier.
- Défauts de lisibilité reproduits : action critique Home Noir1,0336:1 ; champs historiques blancs/text-fill clair ; actions primaires et textes des fiches/chrono. Corrections CSS ciblées, sans changement de services, règles, migrations ou workflow.
- Recette permanente complémentaire :15 scènes réellement ouvertes ×9 variantes=135 captures synchronisées ; même devis issu du Pré-devis, Projet prévisionnel, acceptation explicite TEST et Client idempotent ; qualification pending/error/draft, Tab/Shift-Tab et confirmations exactes.527 contrôles locaux de mise au point réussis ; validation finale propre/typecheck/1020 Vitest/ensemble natif à rejouer au SHA de stabilisation avant publication.
- [Rapport final et procédure de fusion/retour arrière](docs/ux-v2/RECETTE-FINALE-PR102-2026-10-14.md). Résultats définitifs au SHA publié dans le manifeste et le corps de PR pour éviter une CI documentaire supplémentaire. PR102 reste draft, aucun merge/04A/Validation-MSI ; revue humaine et accord de fusion encore nécessaires.

## 14/10/2026 — Finalisation de l'intégration 02E / 03C

- PR102 reste draft ; main278ff2da, sources98–101 et références inchangés. Checkpoint74782268 local complet vert :1020tests/35restaurations/6binaires/sansRPC ; convergence37/CRM77/Recherche92/Home55/parcours62/shell374/UX01183 et81captures, TEMP/intégrité/FK/migrations/nettoyages OK.
- Échec natif778 précisé : reproduction locale avec fenêtre initiale1050px, saisie forcée sur recherche masquée ; synchroniser Échap seul ne suffisait pas. Banc permanent aux départs1510/1050, ouverture par vrai bouton si masqué, focus/visibilité préalables vérifiés, assertion finale conservée ; parcours67 verts, délais inchangés. Aucun correctif métier/header inventé pour masquer le défaut du banc.
- Dernier commit limité aux fixtures/preuves/docs, sourcesTS/TSX identiques à74782268. Recettes natives rejouées sur ce HEAD, puis pushFF dans102 et candidate synchronize ; résultats exacts dans le corps de PR, pas de nouvelle PR ni CI documentaire/dispatch/rerun. Aucun merge main, donnée réelle ou Validation-MSI.

## 13/10/2026 — Rapprochement autorisé 02C–02E / 03A–03C

- Nouveau worktree isolé et branche `integration/ux-v2-02e-03c-v1`, depuis #101 bd1985b ; merge normal #98 10933ae à40e12e6. main278ff2da et quatre branches sources préservés. Dernières CI contrôlées : #98/#777, #99/#737, #100/#741, #101/#760 SUCCESS.
- Conflit unique du banc Electron résolu en conservant Recherche/CRM/captures. Confirmation des fiches et garde Projet conservées ; réponse Prospect périmée reproduite/corrigée ; erreurs Devis obsolètes et journal annulés. Accueil raccordé à la projection6+1/E73 existante et historique Conversion, sans nouveau statut ni changement de service.
- Checkpoint737ce54 : typecheck OK,1020/1020/107fichiers/35restaurations/6binaires/sansRPC ; Electron convergence34/CRM77/Recherche92/Home54/parcours61/shell374/UX01183 ;81captures/TEMP/intégrité/FK/migrations1–66/nettoyages. Complément final convergence36 ; dernière recette complète au HEAD publié via manifeste et PR, distincte de ces preuves checkpoint.
- [Rapport et C01–C11](docs/ux-v2/INTEGRATION-02E-03C-2026-10-13.md). Publication d'une PR draft groupée autorisée après résultats locaux verts ; CI unique opened avec recettes combinées réellement exécutées. Aucun merge main, retarget, force-push, budget, branche historique ou Validation-MSI modifié. Recette humaine globale toujours différée.
- PR102 draft publiée à476945fc, candidate778 ; recette locale complète au même HEAD verte,36convergence. Revue visuelle : compte Home8 devenu obsolète après sourceDevis9, corrigé avec assertion native supplémentaire(Home55). Nouvelle candidate synchronize nécessaire sur ce correctif ; pas rerun ni dispatch. Résultats définitifs/HEAD et références dans la PR pour éviter une CI documentaire supplémentaire.
- CI778 :1020tests/typecheck/CRM77/Recherche92/Home54/convergence36 verts, puis focus resize02E en échec. Synchronisation du scénario : attendre l'acquittement natif Échap avant la saisie suivante, assertion de focus initiale conservée, délais inchangés (02E62). Historique Conversion Home aligné sur les archivés CRM avec non-régression (convergence37). Validation complète à refaire sur le HEAD final avant pushFF unique et nouvelle candidate automatique ; pas de main/branches sources modifiés.

## 13/10/2026 — 02E indépendant : parcours réels, focus et préparation de convergence

- Branche `codex/ux-v2-02e-transverse-shell` depuis#100@d3ef589. #99/#100 maintenues drafts ; main278ff2da inchangé. #98 lue à69e8904 puis46a190f, aucun merge/import/écrasement ; comparaison des trois fichiers communs et tests combinés à préparer, pas preuve de compatibilité par addition des CI.
- Défauts reproduits/corrigés hors fichiers CRM98 : focus du vrai bouton Rechercher, recherche masquée au resize pendant frappe, fermeture seulement après ouverture confirmée, reconnaissance du panneau Historique visible. Chrono prioritaire, aucune nouvelle garde ou règle métier.
- Codebf7eae0 validé en une recette groupée : typecheck OK,54 ciblés,963 Vitest/35 restaurations/6 binaires ; nouveaux parcours61, recherche92, Accueil54/9captures, shell374/63captures, UX-01183, en-tête167. TEMP/intégrité/FK/migrations/nettoyages OK, sansRPC.
- [Exécution et réserves02E](docs/ux-v2/LOT-02E-EXECUTION-2026-10-13.md), [matrice de convergence et C01–C11](docs/ux-v2/LOT-02E-CONVERGENCE-03C-2026-10-13.md). Publication draft distincte autorisée ; résultat CI dans la PR sans doublon de push. Clôture globale02E/pipeline/CRM combiné encore non acquis ; prochaine porte : branche d'intégration après décision explicite. Aucune utilisation Validation-MSI.

## 13/10/2026 — 02C complément publié, Accueil02D réel validé au périmètre indépendant

- #99 draft actualisée à7549770, CI #737 SUCCESS (943/943), complément natif92/92/clavier/focus/conclusion protégé. Corps de PR et bilan actualisés, aucun merge.
- Branche `codex/ux-v2-02d-home-trust` depuis#99 : huit sources Accueil indépendantes, erreurs/cache/fraîcheur/générations, alertes complètes et critiques permanentes, actions « Ouvrir » honnêtes, disposition Home par workspace via01F, reset visuel et texte lisible. Pipeline02D2/E59 non refait, dépend de#98.
- Typecheck/42 ciblés/963 Vitest àebf4e0d verts ; après correction de synchronisation de capture et lisibilité CSS, natifs à3343ebc verts : Home54/54/neuf captures, recherche92, shell374/63captures, UX-01183 ; TEMP/FK/intégrité/migrations/nettoyages OK. Aucun changement TS/TSX entre ces SHA ; les deux manifestes distinguent les tests réellement exécutés.
- #98 recontrôlée à9f697b0, aucun fichier de son chantier actuel modifié par02D. Aucun service métier, contrat, migration ou donnée réelle modifié. [Audit, matrice et preuves02D](docs/ux-v2/LOT-02D-EXECUTION-2026-10-13.md).
- Publication draft02D vers main autorisée pour une unique CI automatique existante ; parent02C explicitement inclus/dépendant, ordre#99 puisAccueil. Résultat à consigner dans la PR sans second push. Pas de fusion, budget inchangé et zéroValidation-MSI. Suite02D pipeline/02E après coordination et intégration contrôlée.

## 13/10/2026 — Complément 02C et poursuite autonome autorisés

- PR #99 draft, CI initiale #720 verte. Complément local `223980eb` : Tab/Shift-Tab neuf variantes, focus conclusion d'incident depuis Accueil et sous-éditeur protégé par UX-01/DraftSection, conflits explicites et pending conservés ; aucune règle de clôture modifiée.
- Validation complète au SHA exact : typecheck OK, 943/943 Vitest, 36 ciblés, 92/92 recherche Electron, 374 shell/63 captures, 183 UX-01 ; restaurations35, binaires6, TEMP/FK/intégrité/migrations OK et zéroRPC. Bilan [02C](docs/UXV2_LOT02C_REAL_SEARCH.md) actualisé ; publication autorisée sans fusion.
- #98 contrôlée à4eeb5a7 : composants Prospect/Devis, projection CRM, QuoteService/IPC/preload, banc partagé en cours ; aucun de ces fichiers modifié par le complément. Rapprochement différé. Aucun Validation-MSI.
- Prochain périmètre indépendant issu du référentiel : **02D Accueil**, huit lectures/erreurs/réponses tardives, alertes visibles, liens honnêtes, préférences de widgets ; pipeline E59 et évolutions03A–03C restent à leur propriétaire #98.

## 13/10/2026 — Publication 02C autorisée

- Autorisation utilisateur : publication de `codex/ux-v2-02c-real-search`, une PR draft vers main, sans fusion ; PR #98 et chantier 03C exclus du périmètre.
- Références contrôlées : main `278ff2da` inchangé, working tree propre, aucun homologue distant de 02C ni PR existante ; HEAD documentaire `89a1dc9`, code testé `1b0fbb9`. Diff entre ces deux commits limité au bilan et au présent suivi.
- Preuves locales vérifiées dans le manifeste du SHA `1b0fbb9` : typecheck, 943 Vitest, 68 Electron recherche, 374 shell, 183 UX-01. Le commit de préparation de publication ajoute uniquement ce suivi ; aucun code supplémentaire.
- Le push de cette branche n'est pas un déclencheur du workflow ; l'ouverture de la PR vers main déclenchera une unique CI candidate. Aucun dispatch/rerun prévu. Le résultat sera consigné dans le corps de la PR pour ne pas provoquer une seconde CI documentaire. Aucune utilisation de Validation-MSI, aucune fusion ou modification du chantier 03C.

## 13/10/2026 — Reprise 02C : recherche réelle validée localement

- Travail interrompu préservé à `c9fc199`, actualisation locale normale à `c149dfe` depuis main `278ff2da` (PR #97 fusionnée, CI #665 SUCCESS). Aucune branche historique modifiée.
- Code `1b0fbb999a90409026e8e8aa161d75e7e133a682` sur `codex/ux-v2-02c-real-search` : confirmation du chargement par ID, garde UX-01 avant changement, Catalogue ciblé, réponses tardives invalidées, erreurs/recherche conservées, focus et idempotence. Raccordement Bibliothèque manquant et course Catalogue A/B/A corrigés avec reproductions permanentes.
- Validation finale réelle Windows : typecheck OK ; 36 ciblés conservés ; 943/943 Vitest (100 fichiers), 35 restaurations, 6 binaires, sans RPC ; recherche Electron 68/68, shell 374/374/63 captures/neuf variantes, UX-01 183/183 ; intégrité/FK/migrations TEMP et nettoyage OK. Aucun changement de services/main/preload ou données réelles.
- [Bilan et limites de couverture](docs/UXV2_LOT02C_REAL_SEARCH.md) : comportement contractuel historique journalisé explicitement qualifié ; Tab/Shift-Tab exhaustif, focus conclusion depuis Accueil et recette complète des sous-éditeurs restent non certifiés par 02C. Recette humaine globale différée.
- Aucun push/PR/CI 02C ni fusion. Prochaine action : revue du candidat local, puis accord distinct avant publication et validation GitHub. Validation-MSI non utilisée.

## 13/10/2026 — Shell réel 02B.5/02B.6 validé localement

- Main61960d5 etCI663verte aprèsmerge96normal, branches90–93inchangées. Nouveaucode8105de4 sur codex/ux-v2-real-shell-02b : rail/header réels dansApp, vraiGlobalTimerunique, recherche/horlogeexistantes, préférencesparworkspace ; pas nouveauchrono/service métier/migration.
- Validationfinale8105de4 : typecheckOK,907/907(99fichiers,96,13s)/restaurations35/binaires6/sansRPC ; renderer réel374/374/17routes/63captures synchronisées/neufvariantes/étroitzoom ; UX-01natif183/183, intégrité/FK/migrations1–66TEMP/nettoyagesconfirmés. AteliersA125/B167/F137aucheckpointfc98e9a, héritage explicitementdistingué.
- Pointerdown/Escape/focus/pending et métadonnéesBibliothèque sécurisésparregistreUX-01existant, régressionpermanente late-edit ; deuxerreursdefixturescorrigées sansaffaiblirlesassertions. [Bilanunique ettraçabilité](docs/UXV2_LOT02B_REAL_INTEGRATION.md). Ordonnanceurlocal sansretry/CI ; validationcomplète regroupée, contrôlesconcernésrejouésaprèséchec.
- Lotprêtpourautorisationdepublication/PR/CI, mais zéro push/PR/CIhébergée pourlenouveaulot, pasfusion/main. Recettehumaineglobaledifférée ; 02Cnoncommencé. AucunValidation-MSI/donnée réelle/budget/branchehistorique supprimé oumodifié.

## 13/10/2026 — Raccord réel du shell 02A / 02B.5–02B.6, validation locale en cours

- #96 fusionnée normalement à61960d5 ; CIpostfusion663SUCCESS,893/893/35restaurations/6binaires,sansRPC. Arbre1f3d6f6 identique au candidat662. #90–93 etbranches conservées.
- Branchelocale codex/ux-v2-real-shell-02b depuismain61960d5 : NavigationRail/WorkspaceHeader raccordés àApp, véritablesGlobalTimer/GlobalSearch/GlobalClock montésuniquementunefois etservicesinchangés. Adaptateur01FavecIPCvisuelwhitelistérail/header, notificationmulti-fenêtres etconfirmationAnnuler pardéfaut ; pas migration.
- Reproductionsnatives TEMP : pointerdownderepli effaçaitlespanneaux, Escape/requêtepérimée réouvraitla recherche, focussortaitpendantpending etEscapeBibliothèque perdaitlesmétadonnées. GardesUX-01 réutilisées pourchronoetmétadonnées, pending/refus/éditiontardive protégés ; aucunsecondregistre, aucunchangementmétier.
- Ciblés42/42 etpremierbanc réel340/340verts. Validationcomplète de fin surSHAfigé àexécuter via scripts/check-ux-v2-real-shell.cjs ; nepasconfondreavecpreuvesantérieures. Aucunpush/PR/CIhébergée pource nouveaulot ; zéroValidation-MSI. 02Cnoncommencé, fusionssoumis àaccord.

## 13/10/2026 — Méthode accélérée, candidate groupée 02A/02B autorisée

- Autonomie à intérieur du lot, ciblés pendant développement et validation complète de fin ; une candidate par lot explicitement autorisé, merges toujours humains. Consolidation depuis93, merge local db407ba de main a01c60d9 ; arbre b462dce8 exactement simulé/testé, conflit journal seul résolu sans perte. Pas de nouveau code métier ni réexécution complète pour documentation seule.
- Publication PR draft groupée et candidate automatique opened autorisées par nouvelle méthode ; pas de dispatch/rerun ni main/90–93 modifiés. [Plan accéléré](docs/UXV2_EXECUTION_ACCELEREE_LOT02.md) : proposer raccord réel 02B.5/6 et rail en un lot, puis02C séparément ; scopes futurs restent à autoriser. ZéroValidation-MSI, pas de nouvelle architecture UX-01 ou chrono.

## 13/10/2026 — Préparation locale consolidation 02A / 02B

- main a01c60d9 après #95/CI661 verte, #92 893b40bc et #93 f7e2ae9b inchangées. Simulations 02A seul et groupée : conflit uniquement PROJECT_STATUS, deux historiques conservés ; aucun conflit/code métier modifié. Branche locale codex/prep-consolidation-ux-v2-02ab, candidat testé 83127f07, arbre b462dce8.
- Typecheck OK, 893/893 (97 fichiers,82,38s), ciblés69/69, restaurations35/35, binaires6/6 sansRPC ; Electron02A125/02B167/F137 dont61 assertionsÉchap, UX-01 complet183 et sections33, troisthèmes/neufvariantes, captures synchronisées, intégrité/FK/migrations1–66 TEMP et cleanup confirmés.
- [Rapport de préparation](docs/UXV2_CONSOLIDATION_02AB_PREPARATION.md) : groupée recommandée, deuxCI futures(candidate/postfusion), pas déclenchées. RisquesEscape hérité etpointerdown GlobalTimer àqualifier avant02B.5 ; ateliersnonraccordés, chronoTESTdistinct, 02B.5/6 et02C suspendus. Aucunpush/PR/CI/mergePR/retarget, main et90–93 préservés, zéroValidation-MSI ; attendreaccordpublication.

## 13/10/2026 — Correctif local tests binaires #95

- Branchelocaledédiée codex/fix-95-native-buffer-assertions depuis95@b0e9bb0 ; commit66e0fc2.14comparaisonsFSBuffer.equals intégrales, sixcontrôles permanents (identique,first/middle/last,shorter/longer) surfichiersTEMP2,4Mo.35restaurations conservées, aucuneassertionSQL/timeout/service/migration/guard modifié.
- Code66e0fc2 : typecheckOK,ciblés41/41,complet873/873(95fichiers,88,08s,sansRPC),DELETE0,371s/WAL0,264s/A→B0,067s local. [Rapport avant/après etplan](docs/UXV2_PR95_NATIVE_BUFFER_FIX.md). LespreuvesduHEADdocumentaire final sont rejouées avantlivraison etconsignéesdanslebilan.
- Aucunpush/PR/CI/merge autorisé àcetteétape ;95resteb0e9bb0/draft/CI659échouée, main31167754 et90–93préservés, Validation-MSI intacte. Aprèsaccorddistinct :pushFFunique verssource95→synchronize→candidateunique, sansdispatch/rerun/workflow/forçage ;fusionaprèsnouvellevalidationhumaine.

## 13/10/2026 — Publication groupée 01E/01F préparée, CI non autorisée

- Nouvellebranche codex/consolidation-ux-v2-01ef depuiscorrectif1e593d0, merge normal00f37774 de main31167754 ; arbre ee378ea identique avant/après merge, aucunfichiermodifié. Sources/tests depuis85040fb identiques,61assertionsÉchappermanentes conservées, originales90–93 inchangées.
- Premiercontrôle du merge00f37774 : typecheckOK,867/867(94fichiers,113,60s,sansRPC), restaurations35/35(A→B4,951s). Lesdernièrespreuves surHEADdocumentaire final serontconsignéesdans lebilanaprèsrejeu ; ne pasconfondre avec résultats antérieurs85040fb.
- [Déclencheurs etprocédure](docs/UXV2_CONSOLIDATION_01EF_PUBLICATION.md) : pushbranche seul non ciblé ; ouverturePRdraftversmain déclencheraitquality. Publicationbranche conditionnéeauxcontrôles, **aucunePR avantautorisationCI**. Pas deskipci/retarget/changementworkflow pourcontournerlecontrôle.
- Budget/Validation-MSI/main/PR90–93 préservés, aucuneCI/fusion/reprise02A/B/C. Aprèsaccord : PRuniqueouverte surHEADfigé, runautomaticunique sansdispatch/rerun ; postfusion sousaccorddistinct.

## 12/10/2026 — Correctif local Échap 01E / 01F validé

- Nouvelle branche codex/fix-ux-v2-01ef-escape depuis91@765f66db, code85040fb. TraitementÉchap local àl'atelieractif, événementconsommé/IMEignoré ; onglettable/formulairesrestentmontés, registreUX-01/services/migrationsinchangés. Aucunmain/90–93 modifié.
- Lesdeuxreproductionsbloquantespassent désormais ;61assertionsElectronpermanentes couvrent compte exact1confirmation, identités/textes cachés, sensinverse, aidesimbriquées, Rester/Quitter, pending etréponsetardive, onglets etpréférences.
- AuSHA85040fb propre : typecheckOK ; ciblés97/97 ; Vitest867/867(94fichiers,104,73s,sansRPC), restaurations35/35(A→B4,464s) ; E95/F137/D126/C66/UX-01183 verts. DeuxbasesTEMPtableshorssettingsinchangées, intégritéOK/FKvide/migrations1–66/nettoyagesconfirmés.
- Simulationgroupéemain31167754+codecorrigé sansconflit : arbref7d7486 identique àsourcecorrigée. [Bilan, preuves etplan](docs/UXV2_CONSOLIDATION_01EF_ESCAPE_FIX.md) : prête àsoumettre àvalidation, pasuneautorisationdepublication/CI/fusion.
- Prochainaccorddistinct : publication/branchegroupée/mergemainversbranchecorrective puisPRdraftcandidateunique ; fusionetpostCI aprèsvalidationhumaine. ZéroCI/push/PR/merge/retarget/budget ouValidation-MSI, 02B.5/02B.6/02C suspendus.

## 12/10/2026 — 02B.3 pilote et audit clavier 02B.4

- Reprise propre de #93@8b241c4, base #92 et dépendances #90/#91/#92 conservées ; main confirmé31167754 après fusion #94, CI post-fusion38273325333 SUCCESS (846/846, sansRPC). Aucun merge/retarget/CI nouveau effectué dans cette tâche.
- Code final e78f1ee : huit états header/rail/bandeau indépendants, préférence visuelle sans données métier, garde UX-01 existante ; focus Options corrigé après reproduction, dialogues chrono TEST et brouillons conservés, mots du contexte lisibles. Aucun App/GlobalTimer/GlobalSearch/IPC/service ou migration modifié.
- Typecheck OK ; ciblés28/28 ; complet887/887 dans96fichiers,140,15s,sansRPC ; restaurations35/35, A→B5,344s. Atelier02B167/167 en deux processus et18captures auSHAexact dirty:false. Régressions02A125/125, UX-01183/183 etrenderer300/300 sur40a40b8, sources de ces bancs inchangées par la dernière correction CSS du pilote. TEMP intégritéOK/FKvide/migrations1–66 etnettoyage confirmés.
- [Rapport et limites](docs/UXV2_LOT02B_EXECUTION.md), [audit clavier](docs/UXV2_LOT02B_RACCOURCIS.md) : aucun nouveau raccourci global. Risques Escape hérités et pointerdown du vrai chrono à qualifier avantport ; cette validation n'est pas une certification desdialogues métier dansV2.
- Publication #93 draft avecskipci, aucunusageValidation-MSI, budget oudonnée réelle. Suite : revue indépendante puisprochaineconsolidation avant décision02B.5 ; aucun02C/03/raccordementmassif commencé.

## 12/10/2026 — 02B.3 suspendu ; consolidation86–93 préparée

- HuitPR draft/mergeable, baseslinéaires ancêtres, retard0 etaucuncheck courant. Main07dde9c8 inchangé. Simulations16pairesbase/source etmain/source sansconflit, arbreségaux auxsources ; aucun merge appliqué oubasechangée.
- Runmain38006715403 :800PASS/1timeout20s (A→Brestore). Fichiersrestore/service/config/runtime identiques àtouteslesbranches ; aucun nouveau correctif. TreecheckoutCIpréfusionverte91b6d31 identique àmain. Local3/3 ciblés4,665/4,655/4,644s puisrestore35/35 en73,59s : neprouvepas correctionhosted.
- [Bilan/plan/autorisation](docs/UXV2_CONSOLIDATION_86_93_PREPARATION.md) publié enMarkdown dans93 ; aucunecode/UI/règlemétier modifiée. QuotaAPIinaccessible(scopeuser), budget0/StopusageYes historiquesnonreconfirmés. Sixruns premièretranche,16runs potentielschaîneentière àautoriser ; zéroCI déclenchée.
- Avantfusion : confirmationbudget/quota, CIcandidate unique verte puisaccorddemerge parSHA, CIpostmergeverte ; retarget/actualisation normales autoriséesuneétapeàlafois. Aucun02B.3/02C/03, Validation-MSI, rebase/squash/force/suppressionbranche.

## 12/10/2026 — 02B.1–02B.2 : audit et atelier d’en-tête

- Branche codex/ux-v2-lot02b-header-v1 depuis #92@893b40b, revue ChatGPT lue. [Inventaire](docs/UXV2_LOT02B_INVENTAIRE.md) du header, commandes, GlobalSearch/Timer/Clock, notifications, breakpoints et clavier. Aucun nouveau raccourci global attribué.
- Présentations développé/compact/étroit, slot chrono TEST unique toujours monté, motif et focus conservés au repli ; contrôles du rail02A partagés, préférence header distincte via01F, bandeau Bibliothèque indépendant. Formulaires/motifs fictifs gardés parUX-01, aucune API métier exposée.
- Code f7099aa : typecheck OK, ciblés25/25, suite884/884 (96fichiers,117,82s,sansRPC), natif86/deuxprocessus/18captures auSHAexact ; 02A125/UX-01183/renderer300 verts. Tables horssettings intactes, intégrité/FK/migrations1–66 TEMP, nettoyage confirmé. [Rapport et16critères](docs/UXV2_LOT02B_EXECUTION.md).
- PR93 draft/base92 ; App/GlobalTimer/GlobalSearch/GlobalClock réels inchangés. Port métier/chrono réel/routage etrecette humaine globale différés. Aucun02C/03, fusion/CIhébergée/Validation-MSI.

## 12/10/2026 — Préparation 02A et atelier de navigation E42

- Branche `codex/ux-v2-lot02a-navigation-v1` depuis #91@765f66d ; revue ChatGPT lue. [Inventaire](docs/UXV2_LOT02A_INVENTAIRE.md) des 17 clés, événements, raccourcis, CSS, icônes et gardes avant code. PR #92 draft, base #91 ; parents préservés.
- Option E42 A : réduit = Accueil + favoris + cinq groupes ; déployé = 17 destinations. Groupes explicites/clavier/focus, favoris ordonnés et reset confirmé, persistance visuelle 01F. Demande Projet temporaire sans écriture durable. Logo triangulaire et nouveaux pictogrammes seulement réservés ; aucun visuel définitif adopté.
- Code final 5f8480e : typecheck OK, ciblés 18/18, suite 877/877 (95 fichiers, 112,99 s, sans RPC), natif 125/125 sur deux processus, neuf captures au SHA exact. Régressions F76 / UX-01183 / renderer300 sur 5ba1168 ; tables hors settings inchangées, intégrité/FK et migrations 1–66 TEMP, nettoyage confirmé. [Rapport et 18 critères](docs/UXV2_LOT02A_EXECUTION.md).
- Atelier autonome ; App.tsx, GlobalTimer, routes ciblées et services métier inchangés. Raccord réel de navigation, atlas/logo final et lecteur d'écran restent à qualifier. Aucun 02B/lot03, merge, CI hébergée ni Validation-MSI. Recette humaine globale différée.

## 12/10/2026 — 01F : persistance par workspace et recette transversale

- Branche distincte `codex/ux-v2-lot01f-preferences-v1` depuis90@4653e58. Stockage inspecté : apparence dansSQLite/settings parworkspace, bootstrapworkspace.json seulement pour choisir le dossier. Adaptateur de dispositions versionné sur le même propriétaire, sans migration ; aucun texte/id de dossier dans les préférences.
- Atelier01A–01E autonome, injection du magasin, onglets gardant leurs éditeurs montés, notifications entre deuxfenêtres et reset limité aux dispositions. DeuxbasesTEMP, vrais handlerssettings seulement ; aucune APIbusiness exposée ni raccord App.tsx/preloadproduction. [Bilan et contrat](docs/UXV2_LOT01F_EXECUTION.md).
- Code31ed71e (depuisfc3fc3e) : typecheckOK, ciblés49/49, complet867/867 dans94fichiers,100,46s,sansRPC ; natif76/deuxprocessus/neufcaptures/SHAexact. RégressionsE95/D126/C66/UX-01183, renderer300/17destinations aucheckpointfc3 ; B70/40/Abby25 finaux. Tables horssettings inchangées, intégrité/FK et migrations1–66 TEMP, nettoyages confirmés. Test60vues empêche troncature silencieuse.
- [22critères](docs/UXV2_LOT01F_GATES.md) : limitesCI20 et revuehumaine22 explicitement différées. Socle technique proposé àreview, pas migration desmodules ni garantie collaborative. PRdistincte draft/base90, publicationsskipci, aucuneCIhébergée/fusion/Validation-MSI.
- Prochaine étape : lot02 après revue/consolidation. Prospection/lot03 noncommencés ; l'ancien piloteProspection proposé aprèsD n'est plus l'étape suivante autorisée. Save-and-exit métier et crash recovery restent nonactivés.

## 12/10/2026 — 01E Windows stabilisé, suite01F autorisée

- Départ90@ce8d1767 propre, base89 préservée. CastTypeScript corrigé sansaffaiblirassertions ; shelldubanc corrigé aprèscapturecompressée. Code8f52747/bancfinald4b38798 : atelierA/B, saveéchecasync/déduplication, sixétats, clavier/Escape/reload/twofenêtres viaUX-01existant.
- TypecheckOK, ciblés52/52, complet859/859(93fichiers,100,20s,sansRPC), natif95/neufcaptures/SHAexact. UX-01183/D126/C66verts, migrations1–66/intégrité/FK TEMP, aucuneValidation-MSI. [20gates/limites](docs/UXV2_LOT01E_GATES.md).
- Clôture technique01E.5/6 pilote proposée ; save-and-exit resteconception, aucuneactivationmétier. Suite01F autorisée dansbranche/PRdistinctes ; paslot02/03/migrationgénérale. AucuneCIhébergée/fusion, PR86–90préservées.

## 12/10/2026 — 01D.4 terminé, clôture technique du socle proposée

- Code7c46651 sur PR89 draft/base88 : source complète ou page partielle simulée, tri/filtre global avant pagination, compteurs exacts, loading/erreur/retry/vide distincts. Succès et erreurs périmés ignorés ; fiche/key/onglet/brouillon conservés. Aucune API métier ni port d'écran réel.
- TypecheckOK, ciblés36/36, complet846/846 (92fichiers,121,24s,sansRPC), natif126/126/neufcaptures auSHAexact avec dirty:false. Non-régressionC66/UX-01183/B40/Abby25 ; intégrité/FK et migrations1–66 surTEMP, nettoyage confirmé. [Rapport,16critères et limites](docs/UXV2_LOT01D_EXECUTION.md).
- Clôture technique01A–01D proposée au périmètre composants/ateliers, recette humaine globale différée. Prochain pilote proposé Annuaire prospects, adaptateur préférences profil/workspace et sources métier à qualifier ; aucune migration générale commencée.
- Main toujours07dde9c8 ;86/87/88 drafts/cibles/HEAD inchangés. CI86 en attente quota/protections confirmés par utilisateur ; aucun run/merge/retarget, aucune Validation-MSI. Publication89 avec skipci.

## 12/10/2026 — 01D.3 colonnes et vues personnelles validées techniquement

- Code17499bf sur PR89 draft/base88 : ordre drag/clavier, resize borné/aperçu immédiat/écriture unique, annulation sans écriture ; vues personnelles CRUD, standard rétablissable, préférencesv2 compatiblesv1. Aucun id/note/query persisté, aucun écran métier migré.
- TypecheckOK, ciblés27/27, complet837/837 (91fichiers,116,53s,sansRPC), natif112/112/neuf captures ; C66, UX-01183, contrôlesB40 etAbby25 verts, TEMP nettoyé, intégrité/FK/migrations1–66 TEMP. [Rapport](docs/UXV2_LOT01D_EXECUTION.md).
- Suite autorisée01D.4 async/pagination synthétiques. Six CI de consolidation autorisées conditionnellement, lancement86 différé par demande utilisateur tant que quota/protections pas confirmés. Aucun merge, retarget86/87/88, budget ou Validation-MSI modifié.

## 12/10/2026 — 01D.2 : atelier de tableaux avec fiche et brouillon protégés

- Branche et PR89 existantes conservées, départ3edf5e3 ; code fbc029d, banc renforcé eda2eae. DataTable/TableFilterBar/TableColumnManager et atelier sur120 dossiers immuables : rechercher/filtrer/trier/montrer-masquer colonnes et ouvrir/agrandir une fiche avec les primitives01B/01C. Aucun écran métier ni service réel modifié.
- Priorité vérifiée : selectedId et détail résolus depuis la source complète ; filtre/tri/colonne ne démonte ni fiche, onglet, ni brouillon. Garde UX-01 existante sur nouvel objet/vue/fermeture, pas de deuxième registre. Préférences whitelistées, query/id/note exclus ; panne de stockage sans perte de saisie.
- TypecheckOK ; ciblés16/16 ; complet826/826 dans90fichiers,109,41s sansRPC surfbc029d ; atelier01D92/92 et neuf captures synchronisées sureda2eae ; atelier01C66/66 et UX-01183/183 verts. Migrations1–66/intégrité/FK sur fixtures uniquement, TEMP nettoyé, captures horsGit, aucune utilisation Validation-MSI.
- [Rapport et critères partiels](docs/UXV2_LOT01D_EXECUTION.md) : 01D.2 livré, pas clôture totale01D. Vues personnelles, réordonnancement/resize de colonnes et async/pagination restent ultérieurs. Lanceur indépendant scripts/launch-ux-v2-lot01d-workshop.cmd.
- Publication régulière PR89 draft avec skipci ; #86/#87/#88 ni reciblées ni fusionnées, aucune CI hébergée. Le plan de consolidation reste prêt, mais non exécuté dans cette mission. Recette humaine globale différée et risques de perte/mutation toujours bloquants.

## 12/10/2026 — Plan de consolidation 01A/B/C et inventaire 01D.1

- Plan publié pour autorisation, **aucune fusion ni CI déclenchée** : #86→main puis #87→main puis #88→main après validation de chaque étape. Chaîne actuelle linéaire (29/48/4 commits propres, zéro retard), toutes draft/mergeable ; simulations d'arbres sans conflit. Main07dde9c8 non protégée selon l'API : accord humain et checks réels explicitement exigés par la procédure. [Plan et risques](docs/UXV2_CONSOLIDATION_01ABC_PLAN.md).
- Branche documentaire distincte `codex/ux-v2-lot01d-inventory-v1` depuis01C@0fab2ae. [Inventaire 01D.1](docs/UXV2_LOT01D_INVENTAIRE_01.md) : sept vues pilotes, colonnes/champs/identités, tris/filtres/handlers, contrats de liste, archivés et limites UX-01. Atelier défini sur120 dossiers synthétiques, réutilisant01B/01C ; aucun composant de table ou écran métier implémenté à ce stade.
- Préserver tri catégorie/nomCatalogue, sortOrder contractuel/production, services de recherche/filtrage et commandes métier séparées de l'ouverture. Filtre masquant sélection : garder détail/brouillon montés. États01D prévus, aucun PASS anticipé. [Cadrage initial](docs/UXV2_LOT01D_CADRAGE.md) reste normatif avec le référentiel#82.
- Publication draft sans CIhébergée via skipci, pas de retarget de86/87/88 exécuté ; Main et Validation-MSI inchangés. Recette humaine globale différée. Prochaine étape : autorisation de consolidation/CI séparée, puis types/fixtures/atelier01D.2 selon le plan, sans port simultané des17modules.

## 12/10/2026 — 01C : écriture en fin de geste, bilan technique et cadrage 01D

- Observation de la revue #88 corrigée au code `01b95a4a8ded84984e908fa982324e63e83ca1ef` : affichage immédiat au pointermove, aucune écriture intermédiaire, une sauvegarde de la largeur finale au relâchement ou blur. Fin doublée ignorée ; geste immobile/annulé et changement de module sans écriture tardive. Clavier/reset conservés, aucun service métier modifié.
- Atelier **66/66**, neuf captures synchronisées hors Git, tests ciblés **19/19**, typecheck OK, suite **810/810 dans 88 fichiers, 107,08 s**, sans RPC. Préférences corrompues et reset refusé/réussi contrôlés sans perte de brouillon. Fixtures TEMP nettoyées ; aucune utilisation de Validation-MSI.
- [Bilan final 01C au périmètre socle/atelier](docs/UXV2_LOT01C_EXECUTION.md), recette humaine globale différée. Adaptation settings/workspace et ports métier restent hors de cette clôture, pas de couverture implicite des futures fiches. [Cadrage 01D](docs/UXV2_LOT01D_CADRAGE.md) préparé depuis le référentiel #82 : aucun développement de tableau ou modification des écrans métier.
- Publication sur la branche existante #88, messages skipci ; PR conservées draft. Aucun merge/main, CI hébergée supplémentaire, migration réelle ou Bridge. Pertes de saisie et mutations métier incorrectes restent bloquantes.

## 12/10/2026 — 01B publié, premier atelier fonctionnel 01C

- Autorisation AtoumWeb : clôture **technique** 01B au périmètre pilote, recette humaine globale différée à la fin V2 ; tests techniques obligatoires, pertes de saisie/mutations incorrectes toujours bloquantes. #87 publié normalement à `2d1ddb7604422850df4921e10250b6186a0094b4`, deux commits validés et16fichiers présents ; messages skipci, pas de nouvelle CI. #82 actualisé à0bb0860, #82/#86/#87 draft.
- Branche indépendante `codex/ux-v2-lot01c-panels-v1` depuis ce HEAD01B. Inventaire des fiches/séparateurs existants, nouvelles primitives isolées ResizableSplitView/RecordPane, atelier React/Electron TEST et stockage visuel injectable. Code `f8d60c4deef5109b8179722f20e612b43d10be85`, aucune migration des17modules ni modification Main/preload/contrats/SQLite.
- Atelier51/51, neuf captures frame-vérifiées sous outputs ignoré, typecheckOK, ciblés19/19, UX-01 natif183/183, suite **810/810 dans88fichiers,107,47s,sansRPC** sur f8d60c4. [Rapport01C](docs/UXV2_LOT01C_EXECUTION.md). Profil/banc TEMP, aucun accès Validation-MSI. Préférences uniquement visuelles ; adaptation settings/workspace et ports métier restent ultérieurs.
- Premier incrément01C autorisé à être publié en PR distincte draft empilée sur87, sans merge. Recette humaine finale différée ; prochaine étape technique : approfondir erreurs de préférence/fenêtres détachées et préparer l'adaptateur lors des ports. Aucun développement de Enregistrer et quitter, aucune nouvelle architecture de confirmation, aucun Bridge/WordPress.

## 12/10/2026 — Reprise UX/UI V2 : lot 01B et garde Abby

- Main distant `07dde9c85dab337ee0ed3a5a92034a139d7ebad2`, #81 terminée et #83 fermée sans fusion. Référentiel #82 lu à efb4fe6 ; reprise propre de #87 sur `feature/ux-v2-lot01b-components-v1@b9679c3`, base #86 toujours draft. Aucun retour aux anciennes branches ni réinitialisation.
- Correctif local `af5cdc559517e049c45f80acf551928e0dd28772` : garde Abby existant conservé ; référence/document, options pending, mutations du détail, préparation Projet et destination opérationnelle raccordés au même registre UX-01, après reproductions. Aide longue coupée en bas de fenêtre reproduite puis corrigée ; aucune nouvelle architecture de confirmation.
- Recettes Windows isolées : Abby 25/25 ; vrai Devis 21/21 ; UX-01 183/183 ; boutons/champs 40/40 ; aide 70/70 ; icônes 42/42 ; notifications 30/30 ; atelier 50/50 sans captures ; interface réelle 300/300. Typecheck OK, suite complète **801/801 dans 87 fichiers, 108,59 s, sans RPC** sur af5cdc5. [Rapport de reprise](docs/UXV2_LOT01B_REPRISE_2026-10-12.md). Migrations 1–66/intégrité/FK correctes sur TEMP, fixtures nettoyées, aucun accès Validation-MSI.
- [12 critères R01B](docs/UXV2_LOT01B_GATES.md) démontrés au périmètre pilote/parcours testés ; pas une migration de toutes les fiches ni un audit WCAG global. Proposition de clôture technique après validation humaine ; prochaine étape 01C uniquement à planifier. Aucun push/CI hébergée/merge/déploiement, code métier/Main/preload/schéma/CGV/signature inchangés ; #86/#87 restent draft.

Les entrées suivantes sont historiques et conservent les états GitHub annoncés à leur date.

## 10/10/2026 — Validation Windows de la recette packagée IPC / app.relaunch UX-01 × UX-16

- **SHA réellement testé :** `prep/ux01-restore-quit-gate-v2@61786e1f5449cf93d4272458480b302ad2dc4bde`. Exécutable de recette Electron **44.3.0** packagé indépendamment sous TEMP, réutilisant le vrai gestionnaire de `backups:restore` et le cycle de vie Electron `app.isPackaged`.
- **Acceptation : PASS**. PID 9924 programme `restartScheduled:true`, atteint `before-quit` puis `will-quit`, enregistre le marqueur et ferme SQLite ; `app.relaunch()` crée automatiquement un nouveau PID 4976, qui restaure `before`, conserve `after` sous `pre-restore`, consomme le marqueur et vérifie l'intégrité.
- **Refus : PASS**. PID 27704 : `before-quit`, **pas de `will-quit`**, `markerAbsent:true`. Démarrage manuel contrôlé PID 10500 : `restored:false`, données préservées.
- **Sortie exacte :** `SUCCESS: independent packaged app, real IPC, app.relaunch, SQLite restore and refusal.` / `Fixture cleaned: true`. Aucun MSI ni workspace réel ouvert.
- **Limites :** harness de test réellement packagé, distinct de la distribution Forge/renderer/entrée `main.ts` finale ; aucune CI GitHub sur ce HEAD. Les autres validations restent celles de `88efb788` (typecheck, 801/801, 183/183) et `dbfd0e2` (12/12 natifs), sans changement de code `src/` entre ces SHAs. [Procédure / preuve détaillée](docs/UX01_PACKAGED_RELAUNCH_RECIPE.md).
- Aucun merge ni changement `main`, PR originales #82/#83, migrations, workflows ou Validation-MSI ; #83 reste draft et conflictuelle avec main.

## 10/10/2026 — Recette packagée UX-01 : vrai IPC et relancement automatique préparés

- **Harness indépendant** ajouté sur `prep/ux01-restore-quit-gate-v2` : `scripts/check-ux01-packaged-relaunch.cjs` et `scripts/fixtures/ux01-packaged-{main,preload}.cjs`. Il construit un **exécutable Electron packagé temporaire** dans `%TEMP%`, et réutilise les vraies implémentations `registerIpcHandlers`, `DatabaseService`, `registerGuardedShutdown`, `restore`, `RestoreQuitGate`.
- Acceptation : appel réel `backups:restore` sous `app.isPackaged`, quit automatique, marqueur en `will-quit`, **`app.relaunch()` déclenchant un autre PID**, restauration au démarrage et sauvegarde `pre-restore`. Refus : enregistrement pending après accord IPC, fermeture veto et vérification à un démarrage manuel ultérieur sans restauration. **Tout est sous un nouveau profil/workspace TEMP avec nonce, aucune base réelle.**
- **Contrôle effectué :** syntaxe JavaScript des trois fichiers OK ; présence de `@electron/packager@18.4.4` confirmée dans `package-lock.json` ; assertions statiques des garde-fous. **Le test packagé n'a PAS été exécuté sous Windows à ce stade.**
- **Périmètre :** exécutable de test indépendant utilisant le vrai IPC (pas le package final du Manager, son `main.ts` complet ni le MSI). Voir [la recette et ses limites](docs/UX01_PACKAGED_RELAUNCH_RECIPE.md). Ne pas inférer une validation Windows avant la sortie du script.
- `main`, #82, la PR officielle #83, migrations, fichiers `src/`, workflows et Validation-MSI inchangés. Pas de CI ou fusion.

## 10/10/2026 — Validation Windows du parcours natif restauration/fermeture UX-01 × UX-16

- **Révision testée :** `prep/ux01-restore-quit-gate-v2@dbfd0e2f2171f6f66b222e2b7cc1256649af1490`. Exécution PowerShell `node --check scripts/check-restore-quit-roundtrip.cjs` OK ; `node scripts/check-restore-quit-roundtrip.cjs` **12/12 contrôles, 5/5 processus Electron, 0 échec, `Fixture cleaned: true`**.
- Quit accepté : vrais événements Electron `before-quit=1`, `will-quit=1`, fermeture de la fenêtre et de SQLite, marqueur `pending` créé seulement après acceptation. Nouveau processus : `restored:true`, source conforme 66 migrations, sauvegarde `pre-restore`, marqueur consommé. Deuxième lancement : `restored:false` sans rejeu.
- Quit refusé pendant un enregistrement : `before-quit=1`, **pas de `will-quit`**, fenêtre et SQLite conservées, aucun marqueur ; démarrage suivant : `restored:false`, données conservées. Scripts confinés à des workspaces TEMP isolés, effacés à la fin.
- **Comparaison Git :** depuis `88efb788` (801/801 tests, typecheck, 183/183 natifs 3 thèmes validés localement), seuls les scripts de recette et la documentation ont évolué ; aucun fichier de production `src/` ni migration changé.
- **Limite restante :** la recette 5 processus emploie Electron natif avec les vrais services, **pas le binaire distribué en mode `app.isPackaged` et son `app.relaunch()` réel**. Pas de CI combinée sur le HEAD, ni de validation de l'exécutable packagé, ni de fusion. [Protocole / limites](docs/UX01_RESTORE_QUIT_ROUNDTRIP.md).
- `main`, PR officielles #82/#83 et Validation-MSI non modifiés ; #83 reste draft.

## 10/10/2026 — Recette de restauration de bout en bout préparée sur branche isolée UX-01

- AtoumWeb a vérifié `prep/ux01-restore-quit-gate-v2@88efb788` sur Windows : typecheck OK, **31/31** ciblés, **801/801** tests complets dans 87 fichiers et **183/183** contrôles natifs sur les trois thèmes ; fixtures supprimées. Aucune CI GitHub ni recette d'exécutable packagé revendiquée.
- Script additionnel `scripts/check-restore-quit-roundtrip.cjs` ajouté pour tester dans cinq processus Electron natifs (fixtures TEMP exclusivement) le vrai quit, l'application au lancement suivant, la sauvegarde `pre-restore`, l'absence de rejeu et le refus de sortie. [Protocole et limites](docs/UX01_RESTORE_QUIT_ROUNDTRIP.md). **Syntaxe du script vérifiée, mais exécution Electron Windows non réalisée pour ce nouveau script** ; les succès précédents ne le couvrent pas.
- PR officielle #83, #82, main et Validation-MSI inchangés, ni CI ni fusion. Prochaine vérification : exécuter le nouveau script sur Windows et compléter la recette packagée avant intégration.

## 10/10/2026 — #81 fusionnée ; #83 en intégration préparatoire isolée

- **État GitHub confirmé :** #81 fusionnée normalement dans `main@68bfd952e394169ade65e3f0697422d8c00c2cc7`, CI post-merge **#652 SUCCESS** au même SHA ; typecheck et 750/750 tests (35 restaurations) confirmés par le bilan de fusion. L'historique #81 ci-dessous reste relatif à ses checkpoints des 09–10/10.
- **UX-01 / #83 :** PR originale `codex/fix-manager-unsaved-inputs-ux01@5b38cbe1` en draft, **non fusionnée**, travaux A/B/C et revue finale historique ajoutés ci-dessous. Ses anciens 734/734 tests et 177/177 natifs valident seulement sa propre branche à cette date, **pas** la combinaison actuelle avec #81.
- **Préparation combinée dédiée :** `prep/ux01-restore-quit-gate-v2` dérivée de `prep/ux01-with-integrity-v1@8a577f1`. Les gardes de fermeture et la restauration UX-16 sont réunis : restauration packagée programmée à `will-quit` après acceptation Electron, annulation d'intention sur veto. Deux tests supplémentaires de fenêtre UX-01 déjà préparés ; cinq nouveaux tests du garde `RestoreQuitGate` et deux contrôles natifs par thème ajoutés en préparation.
- **Contrôle réel limité :** compilation stricte et **5/5** scénarios isolés du garde sous Node 22. Le typecheck du dépôt, la suite complète, la recette native Electron et une CI de cette combinaison **ne sont pas exécutés**. Les tests cumulés 750 (#81) et 734 (#83) ne doivent jamais être présentés comme validation intégrée.
- **Suite bloquée jusqu'à vérification :** recetter refus de quit, création/absence de marqueur au redémarrage, restauration acceptée, source/cible workspace, fenêtre détachée et enregistrement pending sur fixtures temporaires. Préserver migrations 1–66, CGV, contrats, packs, restauration #81 ; aucune ouverture de Validation-MSI ni modification de #82/#83/main.
- [Préparation, limites et tests à réaliser](docs/UX01_WITH_INTEGRITY_PREPARATION.md).

## 09/10/2026 — Revue finale UX-01 / PR #83 avant fusion

- Trois pertes résiduelles reproduites puis corrigées uniquement dans UX-01 : archivage Prospect/groupe mal hiérarchisé, suppression ligne Devis avant garde, réduction d’une section Prospect démontant son draft. Garde avant mutation (également classement Perdu), groupes cohérents et conservation des sections réduites ; aucun Enregistrer et quitter V2, migration ou règle métier nouvelle.
- Typecheck OK, **734/734 complets**, **177/177 natifs trois thèmes**, intégrité/FK et 1–66 sur fixtures supprimées. Simulation #81+#83 en copie temporaire : typecheck, **87/87 ciblés** et **177/177 natifs** verts ; conflit IPC à résoudre en conservant la destination/restauration #81 et les gardes de sortie #83. Aucun merge réel. #80 : conflits de journaux seulement ; #82 : pas de conflit, garde UX-01 réutilisable pour le futur Lot 01.
- **CI quality toujours queued**, aucun runner enregistré, ne pas annoncer ses contrôles verts. PR prête pour revue humaine ; recommandation de fusion suspendue au succès CI et aux résolutions futures avec #81/#80. [Détail de revue](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md). Validation-MSI non ouverte, aucun dossier métier modifié, #80/#81/#82 inchangées.

## 09/10/2026 — UX-01A/B/C : correction livrée sur branche indépendante

- Branche `codex/fix-manager-unsaved-inputs-ux01` depuis `main@eb252d5c` ; commits distincts A (`df1b6f3`), B (`80300a4`) et C. [Bilan complet, fichiers, scénarios et limites](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md). Reprise du travail interrompu sans reset ; B isolé dans l’index puis vérifié dans une copie temporaire, sans perte des changements C.
- A : brouillons contractuels indépendants, fusion des rafraîchissements avec conflits explicites, refus des enregistrements périmés et détail Devis maintenu lors des refresh. B : registre par éditeur, confirmations de sortie Prospection/Devis et sous-formulaires, annulation limitée à la saisie concernée, réponses Devis tardives ignorées. C : fermetures/rechargements/quitter Electron, fenêtre Référence Prospect détachée et choix différé de workspace ; aucun brouillon déclaré enregistré avant confirmation du serveur.
- Validation finale : typecheck OK ; ciblés **75/75**, complets **733/733 dans 82 fichiers** (`npm test -- --maxWorkers=2`), **153 contrôles natifs** sur les trois thèmes. Premier run complet à concurrence par défaut : un timeout de fixture et timeout RPC sous charge ; fixture rejouée isolément 21/21 puis suite complète verte avec deux workers, sans changement de délai ni de règle. Snapshot B seul : typecheck et 81 contrôles natifs verts.
- Fixtures exclusivement temporaires, supprimées après fermeture ; migrations **1–66 inchangées**, integrity_check `ok`, FK vides. **Validation-MSI non ouverte ni modifiée** ; aucune migration, réparation historique, autosauvegarde ou refonte UX/UI V2. Les autres modules ne sont pas encore raccordés au registre ; crash/arrêt forcé/récupération persistante restent hors périmètre.
- Livraison par PR dédiée en draft, sans fusion automatique ; #80 et #81 inchangées. Prochaine action : CI puis validation AtoumWeb avant fusion. Les entrées suivantes sont les checkpoints historiques des lots.

## 09/10/2026 — UX-01B : sorties par éditeur

- Registre/hook par éditeur et groupe, Rester par défaut/abandon limité, attente des saves, sorties sidebar/recherche/événements/fiche/panneau et sous-formulaires Prospection/Devis. Contrôles locaux conservés ; réponses de lecture Devis tardives invalidées, refresh maintient les composants, aucun nouveau style ou serveur métier.
- Séparation prudente à la reprise : UX-01A déjà isolé dans df1b6f3 ; B reconstruit dans l’index sans remettre à zéro le working tree C. Copie temporaire du tree B : typecheck et 81 contrôles natifs trois thèmes verts ; 9 tests de registre en plus des 8 tests de sections. Aucun accès Validation-MSI, copie contrôlée/nettoyée. C reste ensuite à committer et valider.

## 09/10/2026 — UX-01A : sections contractuelles corrigées

- Autorisation AtoumWeb : A/B/C sur la branche indépendante, commits distincts et PR sans fusion. A sépare les baselines des paramètres du devis et de l’administration ; refresh trois voies, conflits explicites et garde optimiste optionnelle à l’enregistrement. Règles de finalisation/snapshots inchangées, aucun schéma nouveau.
- Cause supplémentaire reproduite et corrigée : le loading de refresh remontait tout le détail Devis, détruisant les drafts voisins. Le chargement initial est conservé ; les rafraîchissements gardent les éditeurs montés.
- Contrôles A : 47 tests ciblés et typecheck OK ; 33 contrôles natifs sur trois thèmes, deux sens de conservation et absence de save implicite, conflit interfenêtre refusé/draft conservé/résolution explicite ; 1–66/intégrité/FK verts sur fixture nettoyée. Validation-MSI non ouverte. B/C restent à réaliser.

## 09/10/2026 — UX-01 : diagnostic indépendant avant correction

- AtoumWeb demande la protection des saisies, en commençant par diagnostic/reproduction/proposition, sans modification transversale risquée ni UX/UI V2. Branche `codex/fix-manager-unsaved-inputs-ux01`, depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, origin/main identique après fetch. PR #81 reste draft, sans fusion automatique ; PR #80 et #81 non modifiées, code non fusionné de #81 non repris.
- Inventaire AST : 82 TSX raccordés, 58 fichiers avec contrôles/709 déclarations natives, 8 form ; filtres/readonly/helpers compris. Pas de garde commune de navigation/fermeture ; protections locales à réutiliser (Builder/copies, Qualification, dirty/undo/code, conservation de certains drafts masqués).
- 13 scénarios natifs temporaires avec App/preload/vrais IPC : **9 pertes reproduites**, 3 comportements locaux utiles, 1 risque de workspace différé. Navigation, reload, changement de fiche, Escape/clic extérieur, fermeture native, clause malgré avertissement ; deux directions de perte entre paramètres du devis et administration lors d'un save voisin. Choix du workspace B accepté avec saisie encore dans A, sans bascule immédiate.
- [Diagnostic, inventaire et petits lots proposés](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DIAGNOSIS.md) : A préserver les deux sections contractuelles ; B registre/hook et navigation avec pilotes ; C natif/workspace/détaché ; D/E/F extensions progressives. Rester par défaut/abandon explicite, baselines par section, saves en cours et retours asynchrones coordonnés, aucune autosauvegarde/finalisation implicite.
- Fixture fermée/supprimée, intégrité ok/FK vide/migrations 1–66 ; aucun accès Validation-MSI. Trois documents seulement, aucun code/test fonctionnel/graphisme/migration modifié ; tests permanents prévus après validation. Aucun commit/push/PR nouveau ; arrêt au diagnostic pour arbitrage.

## 09/10/2026 — #650 : diagnostic RPC local et hook commun de fin de test

- CI #650 sur 50f2b40 : installation/typecheck et 748/748 assertions réussis, mais sortie en erreur RPC onTaskUpdate ; aucune validation hébergée acquise. Diagnostic local autorisé, aucun push/run/merge/#82/#83 ni accès Validation-MSI.
- Reproduction exacte sur 60 tests SQLite synchrones isolés : 60/60 assertions mais RPC en erreur ; réponse parent immédiate, worker bloqué 66 s pour un délai RPC natif de 60 s. Cause probable de #650, dont les logs ne désignent pas le worker responsable. L'ancien hook Restore ne couvre pas les autres suites synchrones.
- Correctif local minimal : setupFiles commun avec afterEach/setImmediate natif ; pool forks, versions, délais, assertions et code métier conservés. Même stress 60/60 sans RPC, attente maximale 66→2,2 s ; 92 tests réels verts, attente RPC 18,5→5,8 s. Deux tests ajoutés pour préserver les horloges simulées ; contrôle négatif conserve l'échec réel.
- Typecheck OK ; ciblés 24/24 ; suite complète **750/750, 82 fichiers, 99,76 s**, sortie 0 sans RPC. Restaurations 35/35, migrations/intégrité/FK et atomicité existantes passent sur fixtures. [Diagnostic détaillé](docs/VITEST_RPC_LOCAL_DIAGNOSIS.md). Aucun timeout augmenté, test masqué ou mise à niveau majeure. Correction non publiée ; prochaine étape : décision humaine sur publication et unique confirmation Windows hébergée. Un appel synchrone unique >60 s reste une limite à profiler séparément.

## 09/10/2026 — Diagnostic #649 et correction locale ciblée de restore.test.ts

- Échecs d’injection reproduits avec une jonction contrôlée : destination de production canonisée par realpathSync.native, mocks comparant un chemin brut. Ancien filtre ignore la destination réelle : pas d’erreur injectée / pas de callback concurrent. Comparaison canonisée des deux côtés, alias maintenu dans les deux cas pour prévenir la régression, nettoyage explicite de la jonction et preuve supplémentaire replacementInjected=true.
- Fixture historique 65 : vraies migrations 1–65 désormais préparées en SQLite mémoire puis export VACUUM INTO, même registre/données/source indépendante. Mesure locale création **1491→166 ms**, migrations **1489→140 ms**, restauration **94→88–97 ms**. Comparaison byte pour byte ~2 s conservée ; essai de transaction de lecture sans gain retiré. Aucune modification du service, des migrations, du YAML/Vitest ou des délais/assertions existantes.
- Trois tests corrigés **3/3 sur trois répétitions** (65 : 2,500–2,512 s ; récupération : 0,427–0,439 s ; concurrence : 0,173–0,193 s). **35/35 restore.test.ts, 63,91 s**, aucune erreur RPC ; typecheck OK. 80 assertions initiales intactes et un contrôle supplémentaire ; sources historiques, sauvegarde/récupération, writer réellement bloqué et intégrité/FK préservés. Pas de suite complète 748 rejouée, conformément à la demande.
- [Diagnostic et limites](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md) : graphie précise du TEMP CI non enregistrée, pas d’affirmation d’un nom 8.3 particulier ; mécanisme de comparaison confirmé par reproduction locale. Sondes retirées, fixtures finales et deux résidus de ce diagnostic nettoyés ; anciens TEMP refusés laissés intacts. Correctif committé localement seulement, aucun push/run/rerun/merge/visibilité/budget ou Validation-MSI modifié, #82/#83 non touchées. Nouvelle CI Windows hébergée à autoriser pour confirmer.

## 09/10/2026 — #81 actualisée, contrôles locaux verts, CI préparée

- Main local/distant **2b3906328d237b962f053acdf25b1ebeeba1222c**, #84 merged normalement, contenu exact f4bc0197 validé par #589 ; CI post-merge **#628 /37952828225 success** sur le SHA main. #81 reprend ce main par merge normal local e215125 ; deux conflits de suivi résolus en conservant les deux historiques, aucun conflit fonctionnel.
- Correctif autorisé limité à src/main/restore.test.ts : afterEach async puis setImmediate après fermeture/nettoyage/vérifications. Comparaison automatique au SHA #81 initial 593a4611 : seules ces deux lignes diffèrent ; toutes les assertions/durées et les services restauration/IPC/main/terminaison/packs/migrations sont identiques. Aucun relâchement des protections ni réparation historique.
- **Typecheck OK**, **68/68 ciblés** avec deux workers (141,92 s), **748/748 complets dans 81 fichiers** avec deux workers (207,78 s), aucune erreur RPC. Les 35 restaurations physiques isolées couvrent source/cible/migrations/intégrité/FK, backup/récupération, WAL/DELETE, alias, fichiers occupés et replay ; opérations atomiques et idempotentes, schema 1–66 inchangé. Fixtures finales fermées/supprimées ; aucun accès Validation-MSI.
- Publication de #81 avec HEAD documentaire [skip ci] pour préparer le workflow hébergé sans nouvelle exécution #81. Draft maintenue, aucun merge #81 ; anciennes demandes CI restent liées à leurs anciens commits. Après accord de run, nouveau commit sans skip, quality Windows-2022/Node 24/npm ci/typecheck/complet deux workers sur le vrai HEAD, preuves de résultat puis validation humaine de fusion. #82/#83 non modifiées par Codex, budget inchangé.

## 09/10/2026 — Reprise #81 après fusion normale de #84

- #84 fusionnée après contrôle du HEAD f4bc0197 et du run réel #589 vert (698 tests) : main/origin/main **2b3906328d237b962f053acdf25b1ebeeba1222c**, tree identique au HEAD validé. Mise à jour locale de main en fast-forward, puis intégration normale de ce main dans la branche #81.
- Seuls conflits : PROJECT_STATUS et roadmap ; historiques conservés. Aucun changement des services de restauration/terminaison/packs, des assertions ou délais par cette intégration. Correctif RPC de cycle de test autorisé ensuite, à isoler dans un commit distinct ; contrôles locaux et préparation CI avant toute validation de fusion #81. #82/#83 inchangées par Codex, aucune intervention Validation-MSI, aucun budget modifié.

## 09/10/2026 — UX-16 / UX-03 : corrections fonctionnelles isolées

- Validation AtoumWeb reçue : implémentation des deux corrections, tests permanents, commits et PR dédiée sans fusion sur `codex/fix-manager-integrity-ux16-ux03`. Base `main@eb252d5c` ; PR documentaire #80 inchangée, UX/UI V2 séparé.
- UX-16 : destination canonique/identité épinglées, empreinte source, compatibilité schéma/migrations/intégrité/FK, copie indépendante et contraintes vérifiées avant remplacement ; ancienne demande ambiguë ou interrompue non exécutée. Copie de sécurité validée, remplacement transactionnel SQLite, refus explicites et récupération volontaire, aucun WAL/SHM supprimé manuellement.
- UX-03 : terminaison et débit sous savepoints imbriquables, rollback des statuts/mouvements/solde/timestamps/activités, gardes/facturation/idempotence inchangés, aucune réparation historique automatique.
- Validation finale : **58/58 ciblés, 745/745 complets (80 fichiers), typecheck OK**. Windows : casse/séparateurs/jonctions/hardlinks, writers DELETE/WAL, échec de copie/remplacement, récupération depuis pre-restore et rejeu ; erreurs multiétapes de débit/journaux, transactions parentes et autres couvertures. Fixtures uniquement ; schéma toujours 1–66, intégrité/FK/replay verts, aucun accès Validation-MSI ni lancement Manager.
- 11 fichiers code/tests/suivi ; aucune navigation/React/CSS/règle commerciale/migration changée. [Bilan et limites](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md). Deux fixtures de premiers tests interrompus restent dans TEMP, suppression native refusée par revue automatique ; aucun contournement, aucun artefact dans Git. Prochaine action : revue de la PR corrective, aucune fusion automatique ; UX-01/04/05/02 ultérieurs.

## 09/10/2026 — UX-16 / UX-03 : diagnostic isolé avant correction

- AtoumWeb autorise un chantier fonctionnel distinct de la PR documentaire #80 et de la conception UX/UI V2 ; commencer par restauration/workspace et terminaison d'intervention, présenter les corrections avant changement risqué. Branche dédiée `codex/fix-manager-integrity-ux16-ux03`, depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.
- **UX-16 reproduit** : restauration programmée dans A appliquée à B après changement de workspace. La sauvegarde pré-restauration préserve B mais n'empêche pas le remplacement incorrect. Une source non SQLite existante est aussi acceptée et rend la destination temporaire illisible.
- **UX-03 reproduit** : sans temps terminé, erreur mais statut devenu `to_validate` ; erreur tardive injectée sur le journal, statut intermédiaire et pack déjà débité. Nominal répété : un seul débit. Propositions : cible de restauration épinglée/validée et terminaison transactionnelle avec débit imbriquable.
- Six probes sur fixtures isolées, 8/8 tests existants ciblés verts ; ces tests n'incluent pas les défauts. Intégrité/FK des fixtures valides correctes, migrations mémoire 1–66, nettoyage effectué. Aucun accès à Validation-MSI, démarrage du Manager ou modification de code/migration/UI.
- Diagnostic, tests à ajouter, limites et fichiers envisagés : [FUNCTIONAL_INTEGRITY_UX16_UX03.md](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md). **Corrections proposées, non implémentées** ; arrêt pour validation, aucun commit/push/merge. Autres anomalies ensuite, sans refonte graphique.

## 09/10/2026 — Validation GitHub unique du correctif fixtures autorisée

- AtoumWeb autorise un seul nouveau run #84 avec 5a175eb conservé ; workflow Windows 2022/Node 24/npm ci/typecheck/complet deux workers inchangé. Budget 0 USD/Stop usage confirmé dans la session ; API quota toujours inaccessible (scope user absent), aucun solde gratuit inventé ni budget/paiement modifié. Si refus ou échec : pas de nouvelle relance sans accord.
- Commit sans skip déclenche l’essai ; relever depuis les logs les trois anciens timeouts, totaux et durées réels. Si vert, simulations locales isolées et préparation technique #81 puis #83 autorisées ; aucune modification de #81/#82/#83, merge, Validation-MSI ou données réelles. Résultats sur le run du commit et le bilan PR, sans pousser un deuxième commit de résultat déclenchant Actions.

## 09/10/2026 — Publication du correctif fixtures #84 sans déclenchement CI

- AtoumWeb valide 5a175eb et autorise sa publication, avec skip CI ; aucune réécriture du commit. Un commit de suivi uniquement documentaire portant [skip ci] devient le HEAD poussé avec le correctif. Même périmètre : helper/test de fixture et trois fichiers de suivi, aucun code métier/référentiel/migration/timeout global modifié.
- Dernier contrôle avant push : typecheck et **27/27 ciblés** verts, intégrité/FK/migrations 1–66, journal/durabilité inchangés, isolation/échecs/nettoyage vérifiés. Suite complète 698/698 déjà verte sur les mêmes sources. Aucun budget ou Validation-MSI touché.
- [Protocole CI et plan d’intégration](docs/CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS.md) préparés ; aucune modification des branches #81/#83. merge-tree en lecture : #84 contre chacune ne rencontre que les journaux de suivi ; #81 contre #83 nécessite aussi une résolution IPC conservant les protections des deux. Aucun merge réel.
- Attendre accord séparé pour un nouveau commit sans skip/run hébergé ; les résultats locaux ne valident pas GitHub. La publication avec skip ne remplace pas le premier run échoué par un succès. Aucun merge automatique.

## 09/10/2026 — Diagnostic et correctif local des timeouts CI #84

- Analyse des trois timeouts réels : 26–27 s par cas Histoire, 56 s pour deux sessions, délai 5 s. Profilage du helper : 176 autocommit/68 fins de transactions-savepoints sur disque par fixture ; preview ~12 ms. Stockage Windows hébergé probablement amplificateur, sans diagnostic certain CPU/antivirus/fsync à distance. [Analyse, mesures et limites](docs/CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS.md).
- Correctif limité à testSupport : vraies migrations/références construites en SQLite mémoire puis export complet VACUUM INTO une fois ; aucune durabilité/FK/timeout/assertion désactivée, pas de cache partagé. Modèles/actions/temps/blueprints inchangés, variante historique conservée. Fichiers persistants indépendants utilisés normalement ensuite par le banc technique et les tests.
- Typecheck OK, **27/27 ciblés**, **698/698 complets /80 fichiers /72,02 s**. Les trois tests d’origine sont inchangés ; test deux sessions ~0,44 s, Histoire ~0,24/0,30 s. Nouveaux contrôles d’export : intégrité/FK/migrations/modèles, isolation, journal DELETE/synchronous FULL, absence de fichier partiel après erreur et préservation d’une destination existante.
- Fixtures/instruments locaux supprimés, aucune ouverture Validation-MSI, aucune installation ni changement de workflow, de configuration Vitest ou des autres PR. Correctif local non poussé ; run GitHub précédent toujours échoué, aucun nouveau run/merge. Attendre nouvel accord AtoumWeb avant push et vérification réelle sur Windows hébergé.

## 09/10/2026 — Premier essai GitHub Actions autorisé sur #84

- AtoumWeb confirme avoir vérifié le budget Actions : 0 USD, Stop usage = Yes ; dépassements payants bloqués. Autorise un seul premier essai de quality dans le quota gratuit disponible, par nouveau commit sans skip. Aucun budget, paiement ou paramètre de facturation modifié par Codex.
- Workflow Windows hébergé/Node 24/npm ci/typecheck/tests deux workers inchangé. Ce commit déclenche le run de la PR #84 ; résultat à lire dans GitHub, aucune simulation locale présentée comme CI. Si GitHub refuse pour quota/facturation, arrêt sans relance ni contournement. Aucun merge ou accès Validation-MSI.

## 09/10/2026 — Préparation CI Windows hébergée, sans exécution facturable

- Branche technique indépendante depuis main@eb252d5c : quality sur windows-2022, Node 24 conservé, npm ci/lockfile et tests complets avec deux workers. Aucun module métier/UX, migration ou Validation-MSI modifié ; PR #80/#81/#82/#83 conservées.
- Vérification GitHub : Actions enabled/allowed_actions all, permissions dépôt admin/push, zéro runner local ; quatre PR draft et quality queued. Windows hébergé disponible selon GitHub ; quota/usage/budget du compte non vérifiables avec le jeton actuel (API billing 404 et scope user manquant, plan absent). Aucune modification des droits, budgets ou moyens de paiement.
- PR technique préparée avec marqueur [skip ci] : aucune exécution automatique, aucun résultat CI revendiqué. Arrêt avant lancement jusqu’à confirmation du quota restant et d’un blocage des dépassements, ou arbitrage explicite du coût. Après cela, nouveau commit sans marqueur pour tester la PR ; après fusion autorisée de la CI, mise à jour de #81/#83 pour créer de nouveaux runs utilisant ce YAML. Relancer leurs anciens runs ne change pas le workflow de leur ancien commit.

## 09/10/2026 — Checkpoint GitHub et fichiers de liaison autorisés

- AtoumWeb autorise la publication GitHub des sources validées et la mise à jour du suivi. Branche active **main** ; parent de consolidation **8e05a47296d478587b11841e36ca5acb2e936726**, origin/main identique après fetch. Le commit contenant cette entrée est le nouveau checkpoint ; push normal, sans merge ni force.
- Périmètre : Bibliothèque contractuelle, migration additive 66, 13 types/socles, liens versionnés Catalogue, restitution commune Devis/copies/PDF, corrections UX de la recette manuelle. **61 fichiers source/tests/documentation** ; aucune base SQLite, sauvegarde, capture, output ou donnée de recette dans Git. Anciens journaux conservés historiquement.
- README, HANDOFF MSI et état courant de la roadmap alignés sur main /1–66 /695 tests et recette manuelle en cours. Aucun nouveau développement pendant cette publication ; garde-fous inchangés, pas de publication/activation de référentiel, Abby manuel, pas de validation juridique globale ni travail Bridge/8C.
- Lanceur local : **C:/DEV/Lanceurs/AtoumWeb-Recette-Validation-MSI.cmd**, sources via npm start, contrôle du workspace Validation-MSI. Ancien lanceur/package du 29/09 obsolète ; aucun nouveau package livré. Aucune exécution ou remise à zéro de la base pour publier Git.
- Derniers contrôles : **695/695 tests, typecheck OK, UI 134 natifs +37 Prospection +21 préparation +20 options sur trois thèmes**, intégrité/FK correctes. Prochaine action métier : recette manuelle AtoumWeb sur la base existante.

## 09/10/2026 — Corrections de la recette manuelle Prospect / Devis / Contrat

- AtoumWeb autorise la correction des points UX signalés pendant sa recette. Les contrôles contractuels incomplets sont cliquables : ouverture des rubriques/accordéons, défilement et focus sur le premier champ concerné ; bilan de finalisation près du bouton, actualisé après enregistrement.
- Les informations connues proviennent des versions réellement vendues : objet, livrables, événements du preset de paiement, garanties explicites et hébergement/domaine inclus. Aucune qualification juridique, cession, date ou tarification de renouvellement inventée. Qualification avancée, décisions droits/renouvellement et données Catalogue absentes distinctes. Un brouillon incomplet se sauvegarde, sans autoriser sa finalisation ; un jalon peut porter une date ou un événement/délai convenu (JSON compatible, aucune migration nouvelle).
- Contrat/copies/PDF conservent la même source : sections lisibles, groupes de modules fondés sur les familles des versions vendues et périmètre/inclusions/exclusions. Les corps/applicabilités des clauses et anciens snapshots ne sont pas réécrits. Les valeurs administratives TEST sont refusées hors workspace de développement.
- Prospection : Site facultatif/absence explicite, Offres et Services séparés, alias de familles pour l’affichage seulement, contenus commerciaux partagés pendant le RDV et dans Devis, cartes repliables, contrôle avant devis indépendant, décisionnaire modifiable dans Qualification sur les mêmes contacts, défilement borné dans la référence détachée et l’annuaire, action de détachement dédupliquée. Noms/prix/totaux lisibles.
- Validation : typecheck OK, **695/695 tests**, **134 contrôles natifs App/preload/IPC**, **37 contrôles UI Prospection**, **21 préparation /20 options**, trois thèmes. Fixtures/workspaces temporaires uniquement ; aucun dossier automatique créé dans Validation-MSI. Contrôles readonly : 1–66, integrity_check ok, FK vide, 118 clauses /409 liens /13 types /112 rattachements ; le Prospect et le devis de la recette manuelle sont conservés (1 chacun).
- État de livraison : modifications locales non committées sur main, aucun push/merge/publication ni nouvelle sauvegarde. La fenêtre de recette réelle n’est pas redémarrée pendant une possible saisie non enregistrée ; le nouveau backend doit être chargé par un redémarrage normal après sauvegarde de cette saisie. Pas de recette globale automatique.

## 08/10/2026 — Aperçus de contrats de base pour les 13 types

- Retour AtoumWeb : lire le contrat de base sans devoir créer un Devis ; disponible pour tous les socles/types. Dans la Bibliothèque contractuelle, « Voir le contrat type assemblé » propose une référence Catalogue et le choix Professionnel/Particulier.
- Lecture seule : même sélection de clauses que le moteur Devis, socle commun selon audience, périmètre de la référence, clauses applicables et paramètres à compléter. La composition du type n’active pas les options disponibles non achetées. Aucun prix convenu/client/délai inventé, aucun snapshot ou dossier créé.
- Typecheck OK, 32 tests ciblés (dont 13 types et comparaison de toutes les tables avant/après aperçu), 687 tests complets, 106 contrôles natifs sur trois thèmes. Capture/cas uniquement temporaires. Validation-MSI : 13 types, 112 liens, migrations 1–66 et dossiers toujours à zéro ; aucune migration/publication/réinitialisation/sauvegarde nouvelle.
- Redémarrage normal pour charger les nouveaux handlers IPC/preload ; pas de recette globale. Aucun commit/push/merge. Prochaine action : consultation manuelle AtoumWeb des socles et modules.

## État réel — 08/10/2026 — migration 66 et types contractuels appliqués

- Autorisation AtoumWeb : appliquer 66 et initialiser les 13 types/112 rattachements validés, sans nouvelle sauvegarde, publication automatique ni recette globale. Seule correction métier : « Maintenance WordPress & WooCommerce » ; code MAINTENANCE, rattachements et composition inchangés.
- Renommage contrôlé par 15/15 tests ciblés. Les validations de préparation (684 tests complets, typecheck et UI 106/106) restent les contrôles précédents ; aucune suite globale relancée pour le libellé.
- Validation-MSI : migrations 1–66, 13 types et 13 compositions draft, 112 rattachements à des versions Catalogue, 0 composition publiée. 118 clauses et 409 liens existants conservés, comparaison des autres références et compositions avec le plan validé ; intégrité ok/FK vide, zéro dossier de recette créé.
- Sauvegarde existante réutilisée à la demande d’AtoumWeb ; aucune nouvelle sauvegarde. Application sous verrou, écriture concurrente refusée, rejeu 0 création /0 lien /112 inchangés. Rapport hors Git : outputs/parcours-contractuel-2026-10-08/application-reelle-66.json dans le workspace documentaire.
- Démarrage normal du Manager autorisé sur le workspace Validation-MSI existant ; aucune navigation de recette automatique. Aucun nouveau commit/push/merge. Prochaine action : recette manuelle AtoumWeb.

## Historique de préparation — 08/10/2026 — avant application de 66

- Base officielle : `main@8e05a47296d478587b11841e36ca5acb2e936726`. Pas de nouveau commit/push/merge pour cette passe. AtoumWeb a demandé explicitement de travailler sur ce main pour l’évolution contractuelle.
- Validation-MSI a été nettoyée après autorisation : dossiers commerciaux, Projets, opérations, documents et chronos fictifs retirés ; références et réglages conservés. Sauvegarde physique avant nettoyage et sauvegarde complète récupérable. Pas de nouvelle recette globale sur cette base.
- Types de contrat : quatre tables additives préparées en migration 66, avec rattachement à `catalog_versions`, aucune copie de texte. Les versions de modules et les 409 liens existants restent la source d’applicabilité ; type/composition ordonne sans activer les options non vendues.
- Bibliothèque contractuelle accessible depuis Documents & Contrats ; création, versions, modules, ordre, archivage et navigation bidirectionnelle Catalogue. Lecture Devis Contrat & CGV scrollable, copies Abby/contrat/tout et PDF utilisent une présentation commune ; présentation et références de types conservées dans les futurs snapshots. Les anciens snapshots restent inchangés.
- Initialisation sur copie uniquement : 13 types / 13 compositions BROUILLON et 112 rattachements à des versions Catalogue ; aucune conversion de `contract_type` legacy, notamment « test ». Rejeu neutre, tables de référence préservées.
- Vérification locale : typecheck OK, ciblés 85/85, suite complète 684/684, UI native ciblée 106/106 sur trois thèmes, ancien banc Builder 21/21. Tests/captures/projets uniquement temporaires. Une modification manuelle de texte ne conserve pas silencieusement la validation documentaire de l’ancienne rédaction.
- **Migration 66 NON APPLIQUÉE sur Validation-MSI ; base toujours en 1–65, propre, intégrité/FK correctes.** Manager fermé : ne pas le relancer sur cette base avant validation AtoumWeb de l’application. La migration est inscrite dans le registre local testé, donc un démarrage normal l’appliquerait.
- Prochaine action : restituer le bilan et obtenir validation avant application réelle. Pas de publication/activation automatique, aucun travail Bridge/8C.

## Historique — 08/10/2026 — documentation avant consolidation dans main

- Branche consolidée active : **`fix/pre-phase5-commercial-ux`**. Checkpoint fonctionnel validé : **`8662c3fbeaf2e3b26a68cffa779422f395edd400`**, après intégration de Phase 7 dans son parent `1f7dafc…` et port sélectif du réemploi guidé.
- Projet V2, Sites/Pages/compositions, Devis/contrats/Builder CGV, Catalogue 112, opérations et Phase 7 Statistiques/Rentabilité intégrés. **Migrations 1–65** ; aucun nouveau schéma pour le port.
- Dernière validation acquise : **typecheck OK, ciblés 56/56, complets 670/670, UI 55/55 sur trois thèmes, intégrité SQLite OK et foreign_key_check vide**. Les durées restent indicatives et les dossiers de Validation-MSI sont TEST/non productifs.
- Le parcours Projet → préparation indépendante → adaptation humaine → création volontaire d’une brique AtoumWeb avec provenance est désormais disponible sur les services actuels. **Ne pas fusionner #62** : seul ce parcours utile a été porté. **#68 reste un prototype historique de packs commerciaux .atoum V0.2**, non intégré et non bloquant ; ne pas le présenter comme fonctionnalité actuelle.
- Abby manuel ; aucune validation juridique globale des clauses ; Bridge WordPress, Lot 8C et futurs lots restent distincts. Les échanges déjà présents côté Manager sont conservés sans nouveau développement plugin.
- README et HANDOFF MSI remis à jour ; cohérence vérifiée avec ce suivi, la roadmap et AGENTS, dont les règles restent inchangées. Cette passe modifie uniquement la documentation ; les validations fonctionnelles ci-dessus restent celles du checkpoint 8662c3f.
- **Prochaine étape Git : PR finale `fix/pre-phase5-commercial-ux` → `main`**, après autorisation de push des commits locaux. Commit documentaire séparé autorisé, aucun push/PR/merge pendant cette synchronisation.

Les entrées datées suivantes sont le journal historique. Une ancienne mention de branche active, checkpoint, migration ou étape à venir ne remplace pas l’état courant ci-dessus.


## 08/10/2026 — Port sélectif du réemploi guidé depuis la PR #62

- Instruction AtoumWeb : ne merger ni #62 ni #68. #68 reste un prototype historique hors consolidation ; port du seul parcours UI guidé de #62 sur fix/pre-phase5-commercial-ux@1f7dafc, sans nouvelle migration ni reprise de service ancien.
- Panneau ajouté à la Bibliothèque technique du Projet actuel : choix de version source, copie de travail indépendante, adaptation du contenu/métadonnées et création volontaire d’une brique globale avec provenance. Backend ReusePreparationService et API prepareProjectItem/createGlobal/openPackage inchangés.
- Catégories actuelles reprises, dont code_snippet par défaut pour les snippets PHP/JavaScript. État cible par défaut « À adapter », verticale facultative. Relecture humaine requise avant création et réinitialisée après modification ; création réussie non rejouée par le panneau.
- Export simple conservé et libellé distinct, nouvelles versions, liens aux ressources, stabilité, historique et archivage conservés dans le nouvel écran. Aucune généralisation, création globale ou modification du Projet automatique ; seules les étapes explicites sont journalisées.
- Typecheck OK ; 56/56 tests ciblés de réemploi/référentiels ; 670/670 tests complets dans 77 fichiers. Un test de version source ancienne et code_snippet ajouté.
- Recette native App/preload/IPC : 55/55 contrôles sur AtoumWeb, Noir et Blanc. Préparation sans création globale, contenu/version exacts, adaptation humaine, création explicite unique, provenance et conservation des lignes/versions/fichiers Projet vérifiées. Ouverture OS capturée par le harness, chemin réel contrôlé ; services métier non simulés.
- Migrations exactement 1–65, aucune modification de leur code. Intégrité/FK vérifiées sur fixture et Validation-MSI en lecture seule. Aucun import réel, aucune réécriture du référentiel ou donnée client de Validation-MSI. Captures et rapports hors Git.
- Commit local dédié proposé ; arrêt avant push, fusion de PR ou consolidation vers main. Aucune fonctionnalité de packs commerciaux .atoum V0.2 reprise et aucun travail Bridge/8C.


## 07/10/2026 — Réalignement local Phase 7 sur le Manager consolidé

- Autorisation AtoumWeb : intégrer le HEAD de fix/pre-phase5-commercial-ux par merge normal dans feature/phase-7-analytics-v1, sans rebase, push ni fusion de PR #71. Source distante Phase 7 : 14da58bb2cc5c7bfe47f6000c670a8fd131bd8a3 ; cible intégrée : 4ada08050bd4ee40f9094b475dab04ec7083a1db. Les 44 commits spécifiques Phase 7 restent dans l’historique.
- Trois conflits Git résolus : ipc.ts conserve Analytics et TimePauseReason ; preload.ts expose Analytics et toutes les API consolidées, dont bridgeSnapshots ; App.tsx conserve la navigation et les réglages récents. Aucun ancien écran ne remplace silencieusement un écran consolidé.
- Les quatre vues Statistiques consolidées restent accessibles et par défaut. Phase 7 est raccordée dans « Rentabilité & analyse détaillée », avec ses périodes, comparaisons, volumes, délais, rendements et détails agrandis. Classes CSS Phase 7 isolées pour préserver les styles récents.
- Adaptations de compatibilité : suivi facturé lu dans billing_items et dépenses dans expenses ; aucun encaissement fictif. Estimations des projets opérationnels alignées sur les tâches actives, sans conteneur ni tâche archivée, sans transformer un cadrage incomplet en estimation finale. Calcul historique conservé pour les projets sans modèle opérationnel.
- 669/669 tests complets (77 fichiers), typecheck OK et 35/35 contrôles du vrai App/preload/IPC sur workspace temporaire, trois thèmes, sans erreur renderer. Statistiques, rendement, détails agrandis, Devis, Projets, opérations, catalogue et réglages vérifiés ; captures hors Git.
- Migrations 1–65 identiques au Manager consolidé, aucune migration nouvelle. Validation-MSI contrôlée en lecture seule : integrity_check=ok, foreign_key_check vide, 112 AW /118 clauses /409 liens. Aucun démarrage ni modification de cette base pour la recette UI.
- Prochaine action : clôturer le merge local puis restituer son hash, ses deux parents, le périmètre et un working tree propre. Aucun push ou merge GitHub sans nouvelle validation. Aucun travail Bridge/8C ; conservation de leurs API existantes uniquement.


## 07/10/2026 — Validation AtoumWeb et clôture locale autorisée

- AtoumWeb valide la recette des 112 références, les 655 tests, le typecheck, les migrations 63–65, l’intégrité/FK et le rejeu neutre. Commit local autorisé : « Catalogue 112 — parcours Devis, contrat et opérations », limité aux 62 fichiers proposés, sur la branche courante. Aucun push ni merge autorisé.
- Les quotas inutilisés sont perdus à la fin du cycle, sans report. Chaque nouveau cycle remet à disposition uniquement son quota prévu. Cette confirmation conserve la règle déjà implémentée et testée ; aucun changement fonctionnel supplémentaire.
- Les durées estimées, notamment Histoire à 27 h 30, restent des références internes indicatives, ajustables au dossier et recalibrables avec les temps réels. Elles ne constituent pas des durées contractuelles figées.
- Limites inchangées : environnement TEST, aucune validation juridique globale, Abby manuel, aucun paiement ou facturation réel, aucun travail Bridge/8C. Aucune modification de Validation-MSI pour le commit.
- Parent du checkpoint : 111b9196a7ee17ef1d9faa494d8b24197ca1086c. La prochaine étape reste soumise à une instruction séparée après restitution du hash et de l’état Git.

## 07/10/2026 — Intégration et recette des 112 références terminées

- **112/112 références avec dossier TEST accepté et preuve native : 94 en 8A, 18 en 8B.** Parcours réalisés dans App, preload, IPC et services réels. Les 45 dernières références ont été rejouées après correction d’une attente du harness, sans erreur de rendu.
- **655/655 tests déterministes dans 75 fichiers, typecheck OK, diagnostic sur fixtures 484/484 et 783 contrôles finaux en lecture seule.** Les tests normaux ne lisent pas Validation-MSI.
- Validation-MSI en migrations 1–65, intégrité ok et FK vide. 112 modèles courants et 112 associations courantes ready, catalogue en usage TEST, 118 clauses canoniques et 409 liens. Aucun lien BASE, LANDING-GESTION dormant et contrôle consumer hors bibliothèque textuelle. Rejeu des référentiels : zéro modification.
- 432 définitions d’actions conservées, 72 références 8A fixes et 22 variables, 24 variables tous lots. Classification 6 A / 6 B / 43 C / 39 D et mapping 59/33/24/30 intacts. Histoire : 899 €, 1650 min et 4 Pages ; Essentiel 630 min et Grand Jour 1020 min.
- Nouveaux cycles de date à date, facturation distincte et quota par cycle. Annuel : 12 cycles puis arrêt sans renouvellement. Mensuel : poursuite jusqu’à arrêt. Les routines futures reprennent la version vendue ; le calendrier historique reste inchangé. Tests des cycles du 15 au 14, quota renouvelé, treizième cycle refusé, mois courts et résiliation.
- Options : disponibilité sans effet ; achat de 2 Pages et Blog = 34 actions, 31 h et 8 Pages. Même Projet lors de révision et acceptation, renommage conservé et duplication sans modifier l’original. Crédits 3/5/10 h après 45 min : 135/255/555 min.
- Les 112 dossiers sélectionnés possèdent un document maître Client et un PDF TEST importé/rattaché avec SHA. Les essais intermédiaires restent TEST. Aucune édition/signature réelle Abby ni validation juridique globale. La publication contractuelle concerne le développement seulement.
- Rapport, matrice de 9 onglets, captures et preuves dans outputs/recette-native-112, hors Git. Limites : informations réelles et revue juridique avant production, qualification des Sites existants, administration des référentiels et ergonomie détaillée du Projet.
- **62 fichiers code/doc proposés au commit.** HEAD 111b919 sur feature/project-page-compositions-v1, aucun nouveau commit/push/merge. Message proposé : « Catalogue 112 — parcours Devis, contrat et opérations ». Arrêt pour validation avant commit ; Bridge et 8C hors périmètre.

## 07/10/2026 — Intégration112 en recette finale, migrations63–65 appliquées

- Autorisation globale AtoumWeb :94 références8A +18 références8B, vrais dossiersTEST dans Validation-MSI non productive. Source Git111b919 conservée, aucun commit/push/merge nouveau.
- Migrations63/64 appliquées après sauvegarde SQLite coordonnée. Migration65 appliquée après seconde sauvegarde et tests de conservation : ventes et cibles, crédits/mouvements, souscriptions/périodes/checks et interventions existantes conservés cellule par cellule, intégritéok/FKvide.
-112 modèles courants et112 associations courantes mis en usage par les services réels ;118 clauses publiées **pour recette de développement seulement**, sans déclaration de conformité juridique. Versions historiques conservées.409liens contractuels intacts.
- Raccords natifs : sélecteur AW/famille/version/prix, paramètres des lignes et suppléments rattachés, minimum détour45€ quantité réelle, minimum horaire1h sans unités fictives, particularités Histoire au Builder et snapshot, blocs Abby manuels, Projetprévisionnel/sync/acceptation même Projet, ventes8B et cibles explicites, routines/chrono/consommation.
- Recette a fermé le blocage module/Pageparente : Site résolu ne remplace jamais un parentPage pending ; module différé, puis créé sous la Pageexplicitement choisie. Conservation des réaffectations humaines et gardes existantes.
- Derniers compléments8B : GBP ciblé sur contexte d'établissement ; établissement supplémentaire dans **le même abonnement**, sans nouvelle souscription ; routine variable conserve la référence indicative et une estimation courante absente tant que non renseignée. Périodes futures utilisent le modèle de routines vendu, même si catalogue/plan évoluent.
- Décision AtoumWeb07/10 : **nouveaux abonnements de date à date depuis démarrage réel**, facturation indépendante,12cycles mensuels par engagement annuel ; quotas par cycle. Mensuel jusqu'à résiliation, annuel renouvellementexprès. Historiques calendaires inchangés. Configuration versionnée, aucun défaut calendaire imposé aux nouveaux dossiers.
-653/653 tests complets, typecheckOK au dernier état contrôlé. Recette finale112 en cours : ne pas déclarer112validés avant son résultat. Tests normaux surfixtures et bases temporaires ; bancdiagnostic maîtrisé conservé.
- FauxPDF imprimés pour simuler la pièce externe, puis véritable import Manager vers documentmaître Client avecSHA/rattachement. Aucun connecteur ou envoiAbby. Identité/TVA/médiation/RGPD de recette explicitementTEST, sans valeur réelle.
- Preuves : outputs/recette-native-112 horsGit. Sauvegardes physiques dans Validation-MSI/backups. Fichiers sources XLSX et référentiel contractuel canonique non réécrits ; anciens audits restent historiques.
- À achever : recette112 finale +thèmes/scénarios, contrôle final, classeur et bilan, commitproposé seulement.

## 06/10/2026 — Intégration native des 112 références autorisée, en cours

- Audit exhaustif validé. AtoumWeb autorise la clôture des raccords 94 références 8A **et 18 références 8B**, puis la recette exhaustive dans la vraie interface Manager sur Validation-MSI non productive. Cette autorisation remplace la suspension du Lot 8B opérationnel ; Bridge/8C restent hors périmètre.
- Checkpoint de départ `111b9196a7ee17ef1d9faa494d8b24197ca1086c`, branche `feature/project-page-compositions-v1`. Aucun nouveau commit/push/merge autorisé implicitement ; commit proposé à la restitution.
- Abby définitivement manuel : bloc commercial + Builder contractuel à copier, PDF accepté référencé ; aucun connecteur.
- Décisions conservées : Histoire899€/1650min/4Pages/33h vigilance, supplément urgent rattaché et sans production autonome, détour9€/image minimum45€ et quantité réelle, compléments checklists photo sans changement de temps, page document rattachée au principal, 22 estimations variables explicites.
- **Arbitrage complémentaire reçu** : mise en service hébergement99€/an incluse, avec estimation spécifique du dossier à renseigner ; aucun temps standard inventé. Routine20min et renouvellement distincts.
- Préparation code : migrations63 (règles commerciales versionnées/paramètres ligne) et64 (provenance des ventes8B/routines/quotas), non appliquées à ce stade. Réutilisation Quote/Builder/Projet, HourPack/Maintenance/Operations/Time ; pas de moteur parallèle.
- Premiers tests ciblés règles commerciales et ventes8B verts. Première suite complète : 635/643 ; écarts identifiés sur listes de migrations attendues et fixtures variables devenues insuffisantes, en correction explicite. Ne pas présenter la recette112 comme terminée.
- Prochaine action : terminer les raccords et contrôles, sauvegarder avant migration, mettre les référentiels nécessaires en usage par les vrais services dans cet environnement de développement, puis recette native112/112 avec dossiers TEST. Aucun prix/temps arbitraire.

## 06/10/2026 — Audit exhaustif 112 AW terminé, sans activation

- Checkpoint local du découplage **111b9196a7ee17ef1d9faa494d8b24197ca1086c**, branche feature/project-page-compositions-v1, 30 fichiers ; **630/630 tests, typecheck OK, Chromium 484/484**. Working tree propre au commit ; aucun push/merge. Sources/fixtures/doc uniquement, aucun artefact.
- Audit Validation-MSI en lecture seule directe : **112 références / 432 actions effectives (388 8A, 44 8B) / 409 liens contractuels exacts**. 112 modèles validés nativement, 94 politiques 8A valides ; aucune différence non autorisée au manifeste, seul Histoire V2 applique les arbitrages validés. Aucune application Histoire rejouée.
- Classement proposé du référentiel : **64 PRÊTE 8A / 28 À COMPLÉTER 8A / 18 LOT 8B / 2 BLOQUÉE**. Prête = données/raccords disponibles pour vente directe/base compatible, pas publiée ni recette complète. Les 28 incluent 22 estimations/plans Projet et six raccords/checklists. Deux urgences autonomes à 0 min (AW-CONT-URGENT-48/AW-TECH-URGENT) demandent clarification de portée.
- **72 références 8A chiffrées / 22 à estimation Projet obligatoire** (24 tous lots), toutes hypothèses initiales à recalibrer. 12 références avec structure, 41 nécessitant une cible. Les 146 mappings D restent 59/33/24/30. Les définitions historiques Histoire portent le total stocké à 442 actions sur toutes versions, pas 442 actions effectives.
- Défis transversaux : états actuels draft/inactifs, sélection publiée ancienne/lecture AW-version, options d'offres non configurées, données commerciales détaillées/bloc Abby, conditions particulières Histoire, estimation/production personnalisée et recette end-to-end réelle. **0 chaîne V1 complète utilisable actuellement**, conséquence des états et raccords, pas absence de moteur.
- 8B : services génériques périodes/quotas/checklists, interventions, packs/mouvements/solde, consommation/dépassements/rapports déjà présents ; raccords AW/version/ligne et paramètres/calendriers restent à construire. Aucun 8B artificiellement activé dans 8A.
- Rapport et classeur filtrable 11 onglets dans **outputs/audit-exhaustif-112-aw/**, hors Git : BILAN_AUDIT_112_AW.md et AtoumWeb_Matrice_112_References_2026-10-06.xlsx ; 432 actions détaillées/112 revues/118 clauses/409 liens, totaux calculés, aucune erreur de formule, vérification visuelle et export.
- Aucun état, prix, temps, règle métier ou donnée de recette modifié par l'audit. Aucun lot Devis/8B démarré, aucun push/merge. **Arrêt pour validation.** Seuls PROJECT_STATUS/roadmap mis à jour après le checkpoint, non committés ; aucun changement fonctionnel après les contrôles.

## 06/10/2026 — Découplage du banc technique avant checkpoint

- AtoumWeb autorise le correctif, la suite/typecheck/harness et le commit local si verts, puis l'audit exhaustif112AW ; aucun push/merge. Lot Devis et Lot8B non démarrés, aucune publication/ready pendant l'audit.
- Nouvelle doctrine : Validation-MSI = développement/test non productif, données mutables identifiées TEST. Plus de SHA/comptages immuables ni copies systématiques pour la recette métier. Sauvegardes avant migrations/destructions importantes, intégrité et versionnement conservés. AGENTS et exclusions Git alignés.
- Banc conservé comme diagnostic : source par défaut = fixture JSON versionnée (18 modèles/8 structures pour19scénarios), construite par les migrations et sans lecture Validation-MSI. Source explicite optionnelle pour diagnostic maîtrisé, jamais chemin de développement codé. Comptages calculés, validation par schéma/intégrité et non photographie de la base.
- Trois tests Histoire devenus fixture-based, dont état historique23h et état courant27h30/4Pages. Empreintes de documents/packages/fixtures conservées ; empreinte du JSON de fixture documentée, aucune empreinte Validation-MSI dans la suite normale. Fenêtres/harness alimentés par fixture, répertoires temporaires propres par test. Rollback du banc uniquement pour rejouer ses scénarios ; aucun mécanisme de recette utilisateur parallèle ajouté.
- 630/630 tests complets et typecheck OK ; harness Chromium 484/484, 19 scénarios × trois thèmes, sans source Validation-MSI. États métier du Manager, modèleHistoire appliqué et Validation-MSI non modifiés. Anciens simulateurs à SHA de checkpoint conservés comme outils historiques hors suite normale.
- Checkpoint prévu : **Lot 8A.2C — diagnostic opérationnel et checkpoint Mariage Histoire**, sources/doc/tests/fixtures uniquement, aucun SQLite/backup/capture/output. Harness vert : checkpoint local autorisé, audit 112 AW lecture directe ensuite, sans activation ni changement des temps.

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

## 06/10/2026 — Histoire : dernier arbitrage 27 h 30 provisoires / 899 €, candidats seuls

- Consigne finale AtoumWeb prioritaire : structure 1 Site/4 Pages validée ; référence interne **1650 min/27 h 30 provisoires**, à recalibrer sur les premiers temps réels. **1980 min/33 h = estimation prudente/seuil de vigilance uniquement**. Répartir selon le scénario minimum de la revue : 90/150/420/150/240/150/150/150/90/60. Essentiel 630 et Grand Jour 1020 inchangés.
- Prix **899 € inchangé** ; aucune version à 1290 créée. Propositions 33 h standard et 1290 supersédées avant application, trace conservée. Candidat catalogue V3 draft (textes/périmètre seuls) + modèle V2 draft + structure Histoire distincte/profil inactif/association draft, dans manifeste hors dépôt ; aucune écriture réelle.
- Doctrine : mot de passe de Page seulement, pas de promesse de protection des URLs médias ; portail/protection renforcée hors standard. Livre d'or nom/message, sans compte, avec modération. Une intervention post-mariage maximum 120 min dans les 60 jours, incluse dans A05 240 min ; au-delà complément après accord. Responsable/modalités de modération et dates à renseigner, pas d'invention.
- Textes/checklists candidats adaptés au multipage/fonctions/tests/planification. Référence non dupliquée en durée catalogue et aucune promesse de temps Client. Aucun objet Lot8B, compteur de crédit ou facturation créé. La charge reste une hypothèse, pas un forfait de temps garanti.
- Clauses partagées **intactes** : zéro nouveau template/version/liens. Conditions particulières Histoire proposées via Builder existant ; dérogation explicite 60 jours à la règle générale trois mois pour cette seule prestation. `specialTerms` catalogue seul ne suffit pas lorsque des templates publiés sont liés ; injection/retrait automatiques non implémentés, vérification dans le devis requise avant usage.
- **47/47 contrôles natifs sur copie**, arithmétique/provenance/statuts/historique/rejeu/FK/integrity ; bibliothèque partagée inchangée. Aucun code moteur/UI modifié, suite complète 629 précédemment validée non relancée pour artefacts/documentation. Détail **docs/MARIAGE_HISTOIRE_REVISION_BROUILLON.md** ; manifeste/rapport dans outputs/mariage-histoire-33h-brouillon (nom de dossier historique, contenu courant 27 h 30).
- Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, anciens Histoire899/23h, devis/projets/temps/sourceXLSX intacts. Doctrine/matrice/actions/sources/changelog juridiques vivants actualisés, archives de recherche conservées.
- **Arrêt pour validation avant application.** Aucun staging réel, ready/publication/activation, migration/import réel, commit/push/merge, Lot8B/Abby/Bridge/8C.

## 06/10/2026 — Revue métier des 23 h Histoire, propositions sans application

- Structure Histoire 1 Site/4 Pages validée par AtoumWeb ; revue de charge autorisée sans modification de temps/modèle/staging/prix. Référence réelle maintenue à 10 actions/23 h et 899 €.
- **Propositions à arbitrer** : minimum 1650 min/27 h 30/32,69 €/h ; référence recommandée 1980 min/33 h/27,24 €/h ; prudent 2400 min/40 h/22,48 €/h. Ratio brut prix/temps, pas rémunération nette ou rentabilité démontrée. Prudent = +7 h/+21,2 % sur la proposition 33 h.
- Détail par action et hypothèses dans **docs/REVUE_CHARGE_MARIAGE_HISTOIRE.md**. Variation limitée aux A02/A03/A05/A06/A07 ; cinq autres budgets maintenus dans les propositions. Contenus fournis, solutions standard maîtrisées, protection standard sans portail membres, deux cycles bornés, une passe post-mariage bornée. Pas de montage/retouche/développement sur mesure inclus implicitement.
- Point critique : A05 150 min actuel trop serré pour protection/galerie/vidéo/livre d'or/post-mariage ; A06/A07 doivent couvrir quatre Pages, navigation et accès négatifs. Périmètre de protection des médias directs à préciser ; aucun mécanisme choisi ou activé.
- Aucune adoption de 33 h, marge ou réévaluation du prix. Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. Documents de revue seulement ; aucun code, migration, modèle, temps, staging, ready/publication/activation réelle, commit/push/merge ou nouveau lot. **Arrêt pour arbitrage AtoumWeb.**

## 06/10/2026 — Correction préparatoire Mariage Histoire, arbitrage des quatre Pages appliqué sur copies

- AtoumWeb précise Histoire : **1 Site / 4 Pages** — Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Espace privé = protection prévue pour galerie/souvenirs, vidéo/diaporama, livre d'or, contenus post-mariage ; aucune protection activée par le plan. RSVP/galerie/vidéo restent des sections/modules selon Projet, pas des Pages supplémentaires.
- Configuration versionnée **mariageHistoireStructure.json** ; préparation distincte du blueprint Page unique partagé, profil inactif et association candidate draft. Raccord Histoire remplacé seulement dans le savepoint de la copie de recette, puis rollback intégral. Aucun moteur normal ni schéma/migration modifié ; aucune application dans Validation-MSI.
- Essentiel et Grand Jour restent 1/1 ; Landing inchangée. Modèle Histoire, dix textes d'actions, checklist, catégories, minutes et politiques/cibles existantes intacts : **10 actions / 1380 min = 23 h**. Aucune multiplication des actions par quatre Pages.
- Quatre tests de non-régression ajoutés : profil distinct/draft/idempotence/rollback/historique ; refus du chemin réel ; vrai staging des trois Mariage et actions exactes ; génération synthétique des quatre slugs et conservation du partage one-page. Le moteur existant normalise les slugs de Projet sans slash final ; chemins de configuration/preview gardés comme demandés, aucune modification de ce moteur.
- **629/629 tests complets**, typecheck OK, Chromium **485/485**, 19 scénarios × trois thèmes. Histoire 1/4/10/23h, chemins et intention de protection contrôlés ; les 18 autres DTO identiques hors exposition descriptive des chemins et descriptions. Trois captures Histoire ajoutées aux 36 captures habituelles.
- Réserve métier avant validation de la charge : A02 architecture/navigation, A03 contenus des quatre Pages, A05 espace privé/enrichissements, A06 responsive multi-pages, A07 navigation/liens/accès protégé méritent précision/revue. Aucun intitulé n'impose une Page unique ; les 23 h ne sont ni changées ni certifiées suffisantes. Checklist protection/navigation non inventée ou ajoutée sans accord.
- Validation-MSI avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables exactes, migrations 1–62, 112 modèles draft / 94 liens draft / sept profils inactifs / zéro action/cible/achat. Le staging réel reste au checkpoint antérieur : seule la préparation sur copies est corrigée ; application réelle sur instruction distincte.
- Preuves : **outputs/mariage-histoire-4-pages/** hors dépôt. Aucun ready/publication/activation réelle, import/backfill, commit/push/merge, Lot8B/Abby/Bridge/8C. **Arrêt pour validation.**

## 06/10/2026 — Recette 8A.2C sur le principe, audit du vrai Devis

- AtoumWeb termine la recette sur le principe : operational-recipe reste un banc d'essai isolé du moteur, jamais une vue métier autonome. Parcours cible Prospect → Devis/prestations/options/clauses → préparation Abby → Projet prévisionnel → même Projet actif après acceptation ; le devis signé comprend le contrat, aucun contrat indépendant.
- Future vraie vue Projet : bloc global **Conditions avant démarrage** (devis accepté, acompte, contenus/visuels, accès, informations légales, autres prérequis), puis **Origine commerciale → Structure prévue → Affectation → Plan de travail**, ce dernier ouvert par défaut en production si pertinent. Réutiliser Sites/Pages/slug/sections/modules, actions manuelles, référence immuable/estimation courante/chrono et provenance ; ne pas ajouter ces fonctions au banc.
- Nouvelle décision : Mariage Essentiel et Grand Jour restent chacun 1 Site/1 Page ; **Histoire devient mini-site multipage**. L'ancienne décision commune 1/1 est dépassée pour Histoire uniquement, et demeure conservée historiquement. Configuration actuelle partagée 1/1 non modifiée : nombre/liste/rôles des Pages Histoire non précisés, question à AtoumWeb en attente. Aucune structure commerciale inventée, temps 10 actions/23 h non modifié. Préparer ensuite un profil/version distinct sans toucher la Page unique des autres formules.
- Audit maître : **docs/AUDIT_DEVIS_POST_RECETTE_8A2C.md**. Devis/option/CGV/snapshot/Client/Projet prévisionnel et moteur opérationnel existent ; principales limites : sélection privilégiant ancien publié, brouillons affichables mais refusés à l'ajout, zéro option configurée sur les V3, 118 clauses draft non consommées, runtime opérationnel exige ready, copie Abby limitée au texte contractuel, absence de taxonomie sous-catégorie et d'admin opérationnel complet.
- Exigence future de roadmap : séparation moteur / base métier ; administration depuis Manager des AW, taxonomie, types/prix/textes Abby/commerciaux, clauses, actions/temps, structures, capacités/cibles, versions/états ; exports complets et métier éditables, réimport avec diff/version brouillon. Architecture versionnée compatible, module non développé. Ne pas confondre publication commerciale/contractuelle et états opérationnels ready.
- Proposition minimale non démarrée : recette sur vraie UI Devis en workspace isolé avec faux dossiers explicites et consultation staging réutilisée, sans ready/publication/Projet matérialisé. Bout-en-bout acceptance/Projet V1 à cadrer séparément sans contourner les guards. Aucun nouveau gros développement.
- **174/174 tests ciblés**, huit fichiers existants. Validation-MSI source SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; contre-vérification avant/après et 118 tables inchangées dans outputs/audit-devis-post-recette-8a2c. Historique, 112 modèles draft, 94 liens draft, sept profils inactifs et zéro action/cible/achat conservés.
- Documentation seulement dans cette passe ; aucun code fonctionnel modifié, aucun import, ready, activation, publication, base/migration, commit/push/merge ou Lot8B/Abby/Bridge/8C. **Arrêt pour validation du diagnostic et précision des Pages Histoire.**

## 05/10/2026 — Lot 8A.2C, passe UX seule réalisée avant recette manuelle

- Validation technique AtoumWeb reçue, puis autorisation d'une passe UX seule. Aucune nouvelle règle métier, aucune modification de moteur, scénario, temps, quantité, mapping ou association.
- Vue principale : noms catalogue, quantités, actions/temps, Sites/Pages/modules, estimation complète/incomplète, option achetée/non achetée, destination définie/à choisir. Codes, UUID, états internes et provenance dans **Détails techniques** repliés par défaut, accessibles sur demande. Libellés accessibles des champs également simplifiés.
- Bandeau courant : **RECETTE — simulation uniquement — aucune donnée enregistrée**. Avertissement visible : rien activé ni enregistré dans devis/projets. Message SEO Performance conforme à la demande ; aucune résolution de destination inventée. Limites Landing existant / contextes / Sites historiques conservées en langage métier.
- **Typecheck OK ; Chromium 481/481**, 19 scénarios dans chacun des trois thèmes et quatre vues, 36 captures après + 36 captures avant conservées. **19 DTO complets strictement identiques** à la recette technique précédente. Empreintes des dix fichiers techniques protégés identiques ; état/effets/handlers UI inchangés. Suite **625/625** précédemment validée, non relancée pour cette passe de présentation uniquement.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, migrations 1–62, intégrité ok, FK vide, aucun WAL/SHM/journal source. Modèles/liens draft uniquement, profils inactifs, zéro action/cible/achat.
- Première passe Chromium interrompue par sa limite de 120 s ; délai du harness adapté, passe finale complète verte. Les copies des sessions terminées et échecs contrôlés sont supprimées. Une copie du premier processus interrompu reste dans **%TEMP%/atoumweb-operational-recipe-2e23Wn** : nettoyage shell refusé par la politique automatique, y compris fichiers explicites sans récursion. Source Validation-MSI intacte ; ce reliquat est signalé, aucun nettoyage global revendiqué.
- Passe limitée à six fichiers déjà dans le Lot 8A.2C : renderer TSX/CSS, harness UI, PROJECT_STATUS, roadmap commune et plan de recette. Preuves et galerie **outputs/operational-lot8a2c-ux/** hors dépôt. **Aucun commit/push/merge, ready, activation ou matérialisation. Arrêt pour recette manuelle AtoumWeb.**

## 05/10/2026 — Lot 8A.2C réalisé, recette manuelle à faire

- Plan et implémentation autorisés par AtoumWeb depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f**, branche **feature/project-page-compositions-v1**. Aucun commit/push/merge.
- Démarrage **--operational-recipe** avant workspace/restore/DatabaseService.initialize ; copie physique éphémère du staging réel, jamais de connexion en écriture à la source. Fixtures privées dans savepoint, rollback et comparaison exhaustive après chaque calcul. Moteur **OperationalStagingService.previewQuote**, adaptateur get/all uniquement.
- Fenêtre dédiée / preload restreint : cinq opérations état, références, scénarios, preview, fermeture. API métier normale absente ; propriétaire/frame et champs contrôlés. Aucun bouton/IPC ready, activation, Projet/action/cible ou chrono.
- UI trois thèmes, quantités/options de recette, choix logiques Site/Page, structure/actions/checklist/provenance/pending ; bandeau **BROUILLON — simulation uniquement — aucune donnée Projet créée**.
- **625/625 tests**, typecheck OK, Chromium **133/133** avec vraie IPC/preload et cycle de fenêtre ; **19/19 scénarios** dont AW-SEO-PERF pending, A04 site/integration ; **36 captures**. Aucun changement des temps, politiques, modèles ou migrations.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** strictement identique. Python SQLite ro/immutable : **118 tables identiques**, migrations 1–62, intégrité ok, FK vide, absence WAL/SHM/journal ; 112 modèles draft/0 ready, 94 liens draft/0 ready, sept profils readiness=0, zéro action/cible/achat. Historique intact.
- Nettoyage vérifié sur fermeture API/native et échec contrôlé d'initialisation/chargement. Rejeu déterministe, aucun résidu du scénario précédent. Refus métier de quantité/cible : rollback neutre, scénario corrigeable.
- Limites conservées : Landing sur Site existant non validé ; contextes D et Sites historiques pending. Options fixtures signalées comme non configurées dans l'offre réelle ; aucune résolution inventée.
- Preuves hors dépôt : **outputs/operational-lot8a2c/BILAN_LOT8A2C.md**, recette-chromium.json, source-before/after.json, journaux et captures. **16 fichiers code/doc**, aucune migration.
- **Arrêt pour validation AtoumWeb ; recette manuelle à faire. Aucun ready/activation/publication, Lot 8B, Abby, Bridge ou 8C.**


## Checkpoint courant — 05/10/2026 — Lot 8A.2C plan UX/technique proposé seulement

- AtoumWeb autorise uniquement la préparation du plan de recette visuelle BROUILLON, depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f** sur feature/project-page-compositions-v1. Working tree propre au départ. **Aucune implémentation autorisée à ce stade**.
- Lecture ciblée des moteurs staging, bootstrap, IPC/preload et composants existants. Le staging calcule déjà les plans, mais exige des lignes persistées et n’est pas exposé à la UI. Le démarrage Manager normal reconstruit des index : une simple page sans bouton de sauvegarde ne garantit pas l’invariance physique.
- Proposition documentée dans **docs/OPERATIONAL_LOT8A2C_PREVIEW_PLAN.md** : mode de lancement recette isolé, copie éphémère du staging réel, scénarios de lignes fictifs clairement signalés, IPC de consultation dédiée, arbre Sites/Pages/modules, actions/temps, provenance et choix logiques. Aucun changement des temps/quantités/politiques.
- Les fixtures d’options ne sont pas présentées comme une composition réelle de Vitrine/Landing V3. Limites explicites du staging actuel : Site/Page de base projetés sélectionnables ; contexts et Sites historiques non affectables par cette API, affichés pending. Aucune extension silencieuse.
- Scénarios prévus : 18 cas validés + vrai D pending AW-SEO-PERF ; gardes et tests envisagés pour source stable, refus de mutation, runtime draft, isolation, trois thèmes Electron et recette manuelle.
- Validation-MSI non ouverte en écriture, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** recontrôlé, aucun WAL/SHM/journal. Aucun Manager lancé, aucune copie/scénario appliqué, aucun test/simulation lancé pour cette passe documentaire.
- **Plan proposé, non validé.** Seule documentation modifiée. Aucun code, migration, ready, activation, matérialisation Projet/action/cible, commit/push/merge, Lot8B/Abby/Bridge/8C. Attendre la validation du plan avant implémentation.

## Historique — 05/10/2026 — Lot 8A.2B clôture locale dédiée

- AtoumWeb valide le staging réel et autorise le commit local **Lot 8A.2B — stage operational structures and draft associations**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; SHA et vérifications sont consignés hors dépôt dans **outputs/operational-lot8a2b/application-staging-reel/cloture-git-lot8a2b.json**.
- Parent attendu **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**, branche **feature/project-page-compositions-v1**. **27 fichiers code/doc validés** seulement ; aucun SQLite, backup, XLSX, CSV/JSON de preuves ou artefact inclus. Code fonctionnel et migration 62 inchangés depuis **600/600 tests et typecheck OK**.
- Validation-MSI vérifiée en lecture seule : migrations **1–62**, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. **112 modèles draft/0 ready ; 94 associations draft/0 ready ; 7 profils operational_ready=0 ; 0 action Projet ; 0 cible contribution**. Aucune écriture pendant cette clôture.
- Staging réel validé, previews et contre-vérifications conservés dans le checkpoint historique suivant. Vitrine/Landing V3 et sept structures demeurent draft ; aucune activation, publication, backfill ou reconstruction historique.
- **Recette manuelle AtoumWeb toujours à faire. Aucun push/merge, aucun Lot 8B/Abby/Bridge/8C. Arrêt après commit propre ; Lot 8A.2C non commencé.**

## Historique — 05/10/2026 — Lot 8A.2B staging réel BROUILLON seul, avant commit

- Autorisation AtoumWeb : staging réel BROUILLON seul. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés. 27 fichiers préparés, code exact des **600/600 tests + typecheck OK** ; aucun changement fonctionnel.
- Empreintes base/XLSX/manifeste/configuration vérifiées ; garde et plan réel recalculés sous verrou EXCLUSIVE, deuxième écriture refusée, sauvegarde physique juste avant écriture. SHA avant=sauvegarde **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574** ; SHA final après fermeture/rejeu **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**.
- Migrations **1–62** inchangées. Ajouts seuls : templates 2→8, versions blueprint 2→9, nœuds modèles 29→59, slots Site 1→8, Pages modèles 5→17, profils 0→7, raccords catalogue-blueprint 3→15, liens opérationnels 0→94, versions catalogue 157→159.
- Vitrine V3 et Landing V3 **draft**, zéro composant historique hérité, zéro raccord historique hérité et un nouveau raccord explicite chacune. Sept structures draft / sept profils **operational_ready=0** / 94 associations **draft, zéro ready**. UUID réels nouvellement alloués ; les IDs modèles réels sont conservés.
- **112 modèles draft, zéro ready** ; 18 modèles 8B inertes, 432 actions exactes. Instances/cibles/achats zéro ; 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens conservés. Matrice D **59/33/24/30** exacte.
- Page unique partagée Landing/trois Mariage, Landing create/existing explicite, Mariage create uniquement. Capacités selon décisions validées ; aucun Site manuel/historique qualifié, aucune tâche de production dupliquée.
- **18/18 previews** depuis copies du staging réel et ses vrais IDs, 323 contrôles ; contre-épreuve D AW-SEO-PERF réellement pending. Vitrine 21/24h30/1Site/5Pages ; Landing 13/12h45/1/1 ; Woo 20/42h30/1/4 ; Vitrine+2Pages+Blog 34/31h/8Pages. Options disponibles non achetées sans effet. Runtime normal refuse draft ; aucun Projet/action/cible matérialisé.
- **109/118 tables identiques**, neuf tables avec ajouts seuls ; toutes les anciennes cellules/multiplicités conservées. 17511 contrôles application ; 559 contre-vérifications Python indépendantes depuis sauvegarde. Trois devis / deux Projets / tous Sites/Pages/nœuds/sessions et blueprints historiques intacts.
- Rejeu exact : 69 lignes structurelles, 12 raccords, deux V3, 94 liens unchanged ; aucune mutation logique ou physique. Intégrité ok, FK vide, aucun WAL/SHM/journal.
- Bilan/SHA/94 IDs/manifeste réel/previews : **outputs/operational-lot8a2b/application-staging-reel**, hors dépôt. Préparations et conclusions historiques conservées.
- **Arrêt après staging réel. Aucun ready, publication, commit/push/merge, backfill/recalcul, Lot 8B/Abby/Bridge/8C. Recette manuelle AtoumWeb toujours à faire.** Suite uniquement sur nouvelle instruction.

## Historique — 05/10/2026 — Migration 62 seule appliquée, avant commit

- AtoumWeb valide la préparation corrigée 8A.2B et autorise **uniquement migration 62** sur Validation-MSI. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés ; 27 fichiers préparés et code exact des **600/600 tests + typecheck OK**. Aucun commit/push/merge ; aucun nouveau changement fonctionnel.
- Protocole répété sur copie puis réel : verrou EXCLUSIVE, deuxième écriture refusée, sauvegarde physique juste avant écriture et garde recalculée. Source/sauvegarde SHA **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607**. SQL strictement identique à la préparation validée ; migrations 1–61 inchangées.
- Registre désormais **1–62** ; seule colonne **catalog_operational_links.status draft/ready** et triggers/index préparés. UPDATE historique vers ready **0 ligne affectée**, aucun lien présent.
- Après checkpoint/fermeture/rejeu : SHA **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574**, aucun WAL/SHM/journal. Intégrité **ok**, FK **vide** ; rejeu du vrai point d'entrée migrations **[]**, mutations logique et physique zéro.
- **118 tables historiques contrôlées**, toutes les anciennes cellules conservées ; **117 tables hors ledger sans modification de données**, 61 anciennes migrations exactes + ligne 62. Contre-vérification indépendante read-only immutable depuis la sauvegarde, schémas/colonnes historiques et séquences conservés hors seules modifications autorisées.
- **112 modèles draft / 0 ready**, payloads/import/provenance/IDs/dates strictement identiques. Associations/profils/instances/cibles **0**. 112 AW, 112 versions catalogue V1 draft, 118 clauses draft, 409 liens, 0 achat d'option exacts. Trois devis sans action opérationnelle ; deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions et deux versions blueprint conservés.
- Aucune structure réelle, Vitrine V3/Landing V3, version commerciale, raccord catalogue-blueprint, ready, backfill/recalcul ou objet Lot 8B créé. La préparation candidate sur copies reste séparée et non autorisée pour application.
- Preuves/bilan/sauvegarde/répétition/contre-vérification : **outputs/operational-lot8a2b/application-migration62**, hors dépôt. Recette manuelle AtoumWeb toujours à faire.
- **Arrêt après migration 62 ; ne pas commencer le raccord réel. Aucun commit/push/merge, Lot 8B/Abby/Bridge/8C.** Attendre l'instruction suivante.

## Historique — 05/10/2026 — Lot 8A.2B, blocages fermés en préparation sur copies

- AtoumWeb autorise la préparation du cycle relationnel draft→ready des associations, migration 62 si nécessaire, et Landing V3 autonome. Aucune application réelle autorisée. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés ; aucun commit/push/merge.
- **Migration 62 préparée seulement** : colonne catalog_operational_links.status explicite, défaut draft ; anciennes associations éventuelles conservées avec ready pour préserver leur comportement, activation indépendante contrôlant modèle/profil/capacités, contenu immuable et aucune rétrogradation. Migrations 1–61 inchangées. **Ne pas démarrer Manager sur Validation-MSI tant que 62 pendante/non autorisée.**
- Staging lit les devis/lignes et associations enregistrés sur copie avec les **IDs modèles réels**. Plans marqués staging, impossibles à matérialiser ; runtime filtre ready et markReady ne peut activer un lien draft, notamment C/D. Anciennes révisions actives/épinglées préservées.
- Copie : **7 structures draft / 7 profils operational_ready=0 / 94 associations draft / 12 raccords structurels / Vitrine et Landing V3 draft** sans atoumweb-web-v1 ni raccord hérité. 112 modèles draft / 0 ready, zéro action/cible/Projet généré. 6 A / 6 B / 43 C / 39 D ; D **59/33/24/30** inchangée.
- Capacités explicites : Vitrine/Page unique wordpress ; Woo wordpress+woocommerce. Addons provides=[] consomment la base ; aucun Site manuel/historique implicitement qualifié. Page unique partagée Landing/Mariage, rôles commerciaux conservés. Liens contractuels exacts.
- **600/600 tests (68 fichiers), typecheck OK** ; 18 scénarios du staging enregistré et contre-épreuve D AW-SEO-PERF réellement pending. 17 249 contrôles dry-run, 17 151 contre-vérifications indépendantes, zéro échec. Aucun changement UI/thème ; recette manuelle toujours à faire.
- Les anciens intitulés D pending ne démontraient pas une cible manquante : cadrage WordPress sans cible et application classée C. Mapping conservé ; AW-SEO-PERF démontre quatre actions, zéro Site/Page, un slot Site pending. Rejeu : 69 lignes structurelles, 12 raccords, 94 liens et deux V3 inchangés, zéro mutation logique/physique.
- Toutes les anciennes cellules de la copie conservées ; **108/118 tables identiques**, dix avec ajouts seuls. **Validation-MSI 118/118 tables inchangées, migrations 1–61**, SHA **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607** ; XLSX exact. Profils/liens/instances/cibles réels zéro. Historique, 112 AW, 112 catalogue V1 draft, 118 clauses draft et 409 liens conservés.
- Bilan/SQL/manifeste/CSV94/IDs/scénarios/logs/preuves : **outputs/operational-lot8a2b/staging-draft**, hors dépôt. Préparation partielle précédente conservée historiquement.
- **Arrêt avant application réelle.** Aucun ready, import réel supplémentaire, version/structure/association réelle, backfill, recalcul, publication, Lot 8B/Abby/Bridge/8C. Autorisation séparée pour la suite.

## Historique - 05/10/2026 - Lot 8A.2B, preparation seule avec blocages identifies

- Preparation autorisee sur copies seulement. HEAD d9bbac5739310e5ed8ee1645fbad3db22f39ce79, code et migrations inchanges. Seuls les deux documents de suivi deja modifies sont actualises ; aucun commit/push/merge.
- 94 candidats avec IDs REELS : 6 A / 6 B / 43 C / 39 D ; matrice D 59/33/24/30 conservee. Sept structures draft/operational_ready=0 sur copie, six nouveaux templates, zero tache de production. Future Vitrine V3 preparee en JSON seulement, aucune creation commerciale meme sur copie.
- Copie : versions 2->9, profils 0->7 ; 30 noeuds / 7 slots Site / 12 Pages template ajoutes ; historique conserve. Rejeu structures neutre logique/physique. 112 modeles draft / 0 ready. Liens, instances et cibles zero ; 18 modeles 8B inertes.
- Blocage technique reproduit : simulate/link exigent ready pour un lien, 94 refus attendus sans contournement. Proposer staging draft separe de l activation, aucune implementation ici. Blocage Landing reproduit : atoumweb-web-v1 apporte Vitrine V1 et la composition v2 le refuse ; traitement versionne a valider.
- 18 scenarios de planification, jamais conversions materialisees. 553 controles reussis, 107/107 tests cibles, typecheck OK. Mappings A/B candidats a relire ; D valide. Page unique partage la geometrie, roles commerciaux AW conserves, role SQL standard sans override implicite.
- Validation-MSI 118 tables inchangees cellule par cellule, migrations 1-61, SHA e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607. Profils/liens/instances/cibles zero. Livrables hors depot outputs/operational-lot8a2b.
- Arret avant application. Fermer les blocages et refaire un dry-run complet avant import. Aucun ready/publication/backfill/recalcul/8B/Abby/Bridge/8C. Recette manuelle toujours a faire.

## Historique — 05/10/2026 — Lot 8A.2A, import réel BROUILLON seul appliqué

- AtoumWeb autorise l'import réel strictement limité aux versions de modèles en draft. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés. Code fonctionnel/migrations inchangés ; deux documents de suivi seulement modifiés, aucun commit/push/merge.
- Empreintes validées recontrôlées sous verrou SQLite EXCLUSIVE et plan réel recalculé : **112 create / 0 unchanged / 0 conflit**, jeton **940cad726862ffc8197dadf0b7382e6aec7ad3dad76bcc0f0bd3139810827f13**. Seconde écriture refusée ; sauvegarde physique SHA égal à la source **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. XLSX/manifeste/empreinte canonique inchangés.
- Seules **operational_import_runs 0→1 / operational_model_versions 0→112** changent ; journal réel **b76ea681-fefd-452e-872c-c39b0002fa83**. **112 versions n°1 draft / 0 ready**, **94 modèles 8A / 18 modèles 8B inertes**, **432 définitions d'actions**, **24 estimateRequired (22 8A / 2 8B)**, catégories 418/14. Trois packs restent sans actions ni crédits activés. Matrice D séparée **59 none / 33 site / 24 page / 30 context**, non activée.
- Les quatre tables blueprint_operational_profiles, catalog_operational_links, project_action_instances, project_contribution_targets restent **vides**. Aucun blueprint V2, version commerciale, association, recalcul, backfill, pack, abonnement, intervention ou objet opérationnel créé.
- Application et répétition sur copie : **681/681 contrôles chacune**, intégrité OK/FK vide. Rejeu réel avec plan recalculé **112 unchanged / 0 create**, zéro INSERT/nouveau journal, aucune mutation logique ou physique. Checkpoint/fermeture, aucun WAL/SHM/journal. SHA final **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607**.
- **116 autres tables strictement identiques cellule par cellule**, schéma et séquences inchangés ; contre-vérification indépendante Python depuis la sauvegarde et le baseline validé. Trois devis historiques résolus à **zéro action opérationnelle**. 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens / options zéro ; Projets/Sites/Pages/nœuds/sessions/blueprints et documents historiques conservés.
- Bilan/IDs réels/CSV/plans/trace SQL/preuves : outputs/operational-lot8a2a/application-reelle, hors dépôt. Préparation antérieure conservée comme snapshot historique. Tests ciblés **87/87** et typecheck OK de la préparation : pas de nouvelle exécution de suite, aucun changement applicatif.
- **Arrêt après import. Ne pas commencer Lot 8A.2B. Aucun ready/raccord/activation Lot 8B, Abby, Bridge ou 8C. Recette manuelle AtoumWeb toujours à faire. Aucun commit autorisé.**

## Historique — 05/10/2026 — Lot 8A.2A, import des modèles BROUILLON préparé seulement

- Base technique vérifiée avant toute préparation : working tree **propre**, branche `feature/project-page-compositions-v1`, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**. Validation-MSI migrations **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**, 118 tables, aucune écriture réelle.
- Manifeste réextrait du XLSX **inchangé** et identique au référentiel validé : **112 modèles / 432 actions** ; **94/388 Lot 8A**, **18/44 Lot 8B**. 22 estimations obligatoires 8A et deux autres 8B conservées ; catégories 418 Inclus au forfait / 14 Supplément facturable ; trois packs heures zéro action. A16/A19 Vitrine complétés selon décisions validées, sans changer les temps. Matrice D **59 none / 33 site / 24 page / 30 context** conservée documentairement, aucune activation.
- Importeur existant inchangé : dry-run sur copie **729/729 contrôles**, **112 versions n°1 en draft**, **1 ligne operational_import_runs**, aucun ready/lien/profil/Projet/action réelle/cible/blueprint/version commerciale. Les IDs catalogue sont exacts ; les UUID modèle/import générés sur copie sont uniquement des preuves de simulation, les UUID réels seront alloués par l'importeur au moment autorisé.
- Rejeu : plan recalculé **112 unchanged**, zéro INSERT et zéro mutation logique/physique. Jeton initial après import périmé et refusé. Changement synthétique de note → V2 draft, puis rollback intégral ; aucune modification des valeurs métier. Absence de conflits présents : 112 codes trouvés exactement, tables opérationnelles vides. Les autres 116 tables et le schéma sont inchangés sur copie.
- **87/87 tests ciblés, typecheck OK**. Les trois devis historiques résolus en lecture seule sur copie restent sans action opérationnelle rétroactive. Les modèles importés mais non associés ne génèrent rien ; une tentative nouvelle avec la dernière version catalogue est bloquée explicitement par la garde de compatibilité existante, pas préparée implicitement.
- Livrables hors dépôt `outputs/operational-lot8a2a` : manifeste réel, enveloppe/empreintes, plan initial, IDs/versions et actions en CSV, dry-run, diff attendu, preuves et logs. Seuls ce suivi et la roadmap sont actualisés dans le dépôt ; aucun changement fonctionnel ni migration.
- **Arrêt avant import réel** : Validation-MSI et XLSX intacts, six tables cibles/opérationnelles toujours vides. Aucun ready, association, Vitrine V2, nouvelle version commerciale, recalcul/backfill, commit/push/merge, Lot 8B activé, Abby, Bridge ou 8C.

## Historique — 05/10/2026 — Lot 8A.1, clôture locale dédiée autorisée

- AtoumWeb valide la migration 61 et autorise le commit local **Lot 8A.1 — secure structural targets and contribution policies**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les contrôles sont consignés hors dépôt dans `outputs/operational-lot8a1/cloture-git-lot8a1.json`.
- Parent attendu **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**, branche `feature/project-page-compositions-v1`. **40 fichiers Lot 8A.1** vérifiés ; aucun artefact de base/sauvegarde/XLSX/capture/JSON de simulation inclus. Code fonctionnel et migration 61 identiques aux empreintes validées : **590/590 tests, typecheck OK, UI 180/180, simulation 971/971**. Les trois documents post-application ne font que refléter les décisions et résultats validés ; cette clôture ajoute uniquement leur suivi.
- Matrice D V1 : seule correction **AW-SEO-PERF-A04 → site/integration**, répartition **59 none / 33 site / 24 page / 30 context**. Aucune activation ni modification XLSX.
- Validation-MSI en migrations **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33** conservé sans écriture pendant clôture. `project_contribution_targets` et les cinq tables Lot 8A vides ; aucun import, modèle ready, Vitrine V2, nouvelle version commerciale ou raccord réel.
- **Recette manuelle AtoumWeb toujours à faire. Aucun push/merge, aucun Lot 8B, Abby, Bridge ou 8C. Étape suivante non commencée ; arrêt après commit.**

## Historique — 04/10/2026 — Migration 61 seule appliquée, commit non autorisé

- AtoumWeb valide la préparation 8A.1 et la matrice D V1 avec une correction unique : **AW-SEO-PERF-A04 none/integration → site/integration**. Répartition finale **59 none / 33 site / 24 page / 30 context = 146 actionKey** ; aucun autre mapping changé. Matrice validée mais non activée, XLSX inchangé.
- Avant écriture : branche `feature/project-page-compositions-v1`, HEAD **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**, **40 fichiers** conformes aux empreintes du bilan, index vide. Aucun code fonctionnel modifié depuis les contrôles **590/590, typecheck OK, UI 180/180, simulation 971/971**. Verrou SQLite exclusif, seconde écriture refusée et sauvegarde physique avant migration.
- SHA source = sauvegarde **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** ; SHA final après checkpoint/fermeture/rejeu **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. Migrations **1–61** ; `project_contribution_targets` présente et **vide**. Aucun WAL/SHM/journal résiduel. Intégrité OK/FK vide. Rejeu du point d’entrée migrations neutre logiquement et physiquement.
- **117 tables historiques conservées cellule par cellule**, contre-vérification indépendante depuis la sauvegarde. Exception explicite attendue : `schema_migrations` conserve exactement ses lignes 1–60 et reçoit seulement la ligne 61. Séquences SQLite, schémas historiques et catégories business_category historiques inchangés/NULL.
- Cinq tables 8A toujours vides ; 112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options zéro. Trois devis, deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions, deux versions blueprint conservés.
- Aucun import, modèle réel, ready, Vitrine V2 réelle, nouvelle version commerciale, association opérationnelle, backfill, cible ou recalcul. Aucun Lot 8B, Abby, Bridge ou 8C. **Aucun commit/push/merge ; recette manuelle toujours à faire. Arrêt avant toute activation réelle.**
- Preuves et bilan réel : `outputs/operational-lot8a1/application-migration61-validation-msi.md/json`, `contre-verification-migration61.json`, `sauvegarde-migration61-sous-verrou.json`. Les preuves de préparation antérieures sont conservées comme snapshots historiques.

## Historique — 04/10/2026 — Lot 8A.1 préparé, aucune application réelle

- HEAD **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e** et branche `feature/project-page-compositions-v1` conservés. Aucun commit/push/merge. Préparation autorisée des politiques A/B/C/D, plan v2 multi-bases, cibles persistées et contrôles quantité/capacités.
- Migration **61 additive préparée uniquement** : seule nouvelle table `project_contribution_targets`, quatre index, six triggers. Migrations 1–60 inchangées. Première affectation D après acceptation historisée sans révision commerciale ; actions dépendantes bloquées en pending. Sites manuels/historiques sans capacité implicite.
- **590/590 tests, typecheck OK, UI 180/180 sur trois thèmes, simulation SQLite sur copie 971/971 (47 scénarios)**. Recette manuelle AtoumWeb à faire. Matrice **39 D / 146 actionKey proposée, non validée pour activation**.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** identique avant/après ; 117 tables existantes comparées, intégrité OK/FK vide, aucun WAL/SHM/journal. Cinq tables 8A toujours vides. 112 AW, 112 catalogue BROUILLON, 118 clauses BROUILLON, 409 liens et tout historique inchangés. XLSX opérationnel inchangé.
- Aucun import réel, ready, Vitrine V2 réelle, nouvelle version commerciale, association métier, backfill ou objet Lot 8B. Aucun Abby, Bridge ou 8C. **Ne pas démarrer Manager sur Validation-MSI : 61 pendante.** Attendre le feu vert distinct pour toute application réelle.
- Bilan : `docs/OPERATIONAL_LOT8A1_TARGETS.md` ; SQL exact, matrice, rapports, logs, captures et preuves dans `outputs/operational-lot8a1`, hors dépôt.

## Historique — 04/10/2026 — Lot 8A appliqué, clôture locale dédiée

- AtoumWeb valide la migration 60 seule et autorise le commit local dédié **Lot 8A — actions opérationnelles, temps et provenance**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les preuves sont consignés hors dépôt dans `outputs/operational-lot8a/cloture-git-lot8a.json`.
- Avant commit : **36 fichiers préparés**, toutes les empreintes validées conformes, aucun artefact de base/sauvegarde/XLSX/JSON de simulation/capture inclus. Code fonctionnel et migration 60 identiques à **534/534 tests, typecheck OK, UI 69/69, simulation 209/209**. Seuls les documents de suivi et le bilan préparatoire sont actualisés pour refléter l’application et cette clôture.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** conservé sans écriture pendant clôture. Sauvegarde avant migration : **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, égal à la source sous verrou ; seconde écriture refusée. 113 tables historiques comparées exhaustivement et contre-vérifiées indépendamment, intégrité OK/FK vide, rejeu neutre logiquement/physiquement, aucun auxiliaire résiduel.
- Les cinq tables `operational_import_runs`, `operational_model_versions`, `blueprint_operational_profiles`, `catalog_operational_links`, `project_action_instances` sont **vides**. Colonnes business_category historiques **NULL**. Aucun import XLSX, modèle réel, ready, Vitrine V2 réelle, association opérationnelle, recalcul ou backfill.
- 112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options vides intacts ; les trois devis et deux Projets, Sites/Pages, nœuds, sessions, blueprints et documents historiques conservés. Aucun objet Lot 8B.
- **Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Raccord réel des associations commerciales non commencé.** Aucun Lot 8B, Abby, Bridge ou 8C ; aucun push/merge. Attendre une nouvelle autorisation avant import ou raccord réel.
- Bilan préparatoire `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md` ; application réelle et contre-vérification dans `outputs/operational-lot8a/application-migration60-validation-msi.md/json` et `contre-verification-migration60.json`, hors dépôt. Les manifestes préparatoires validés sont conservés historiquement sans réécriture.

## Historique — 04/10/2026 — Lot 8A opérationnel préparé, copie uniquement

- Décisions AtoumWeb appliquées au manifeste : A19 point de restauration avant publication et A16 consentement uniquement technique, 60 min chacune inchangées ; A12 pages légales, A21 sauvegarde livraison. XLSX intact. Projet standard V1 strictement historique.
- Migration **60 préparée seulement** : cinq tables, deux colonnes métier nullable, références initiales/compatibilités immuables. Versions des modèles indépendantes des publications catalogue/clauses. Aucun backfill.
- Audit complet : Vitrine V1 13 tâches / 525 min inchangée ; V2 structurelle simulée sans ces tâches, conteneurs/Site/5 Pages conservés. V1 publiée maintenue ; V2 draft mise en usage opérationnel explicite/figée, associations exactes versionnées. Ancienne V1 + modèle bloquée ; structure sans modèle bloquée.
- **112 modèles / 432 actions importés en BROUILLON sur copie** : 94 refs/388 actions 8A ; 18 refs/44 actions 8B inertes ; trois packs zéro action ; 22 refs 8A à estimation obligatoire gardent estimation courante NULL. Aucun mapping réel inventé ni publication.
- **534/534 tests (63 fichiers, 31 nouveaux), typecheck OK, UI 69/69 sur trois thèmes, simulation SQLite 209/209**, intégrité OK/FK vide. Vitrine 21 actions/24 h 30 ; +2 Pages 29/28 h ; +Blog 34/31 h ; pack 4 articles 4/13 h ; application 3/3 h indicatives, estimation finale absente.
- Génération intégrée au Projet prévisionnel et aux révisions/acceptation ; provenance complète, versions épinglées, manuel conservé, retrait vierge et conflits travaillés. Chrono existant inchangé dans son calcul hors pauses ; cinq catégories métier historisées. Recette manuelle AtoumWeb à faire.
- Validation-MSI **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, et XLSX **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangés. 112 AW/112 catalogue draft/118 clauses draft/409 liens/achats vides/historiques intacts.
- Branche `feature/project-page-compositions-v1`, HEAD **378f11568cddc462e29df6117425631e03e89b80** inchangé. Aucun commit/push/merge ni application réelle ; **ne pas démarrer Manager sur Validation-MSI (60 pendante)**. Aucun Lot 8B, Abby, Bridge ou 8C.
- Bilan `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`, matrice exhaustive 112 et preuves dans `outputs/operational-lot8a` du dossier documentaire partagé. Les associations commerciales réelles, notamment le service historique inclus lié à Vitrine V1, restent à configurer explicitement après autorisation : les scénarios commerciaux sont synthétiques, le blueprint cloné est réel.

## Historique — 04/10/2026 — Lot 8A, audit des blueprints avant préparation

- AtoumWeb valide une seule source de tâches de production, une nouvelle version structurelle Vitrine et une compatibilité versionnée explicite avec les modèles opérationnels. Préparation locale seulement ; aucun commit ni application de migration 60 sur Validation-MSI.
- Audit exhaustif de la base en lecture immutable : **2 blueprints / 2 versions publiées / 14 tâches**. Vitrine V1 : 13 tâches / 525 minutes, conservées avec PRO-2026-002 ; Projet standard V1 : une validation de livraison sans estimation ni liaison AW, conservée avec PRO-2026-001.
- **Arrêt conformément à la consigne sur les tâches complémentaires** : `launch.backup_before` (15 min) prévoit un point de retour avant publication, non explicite dans A19/A21 ; `quality.rgpd` (45 min pour la tâche entière) inclut le contrôle du bandeau/consentement, non explicite dans A12/A16. Aucun retrait, fusion, neutralisation ou changement du XLSX. La validation de livraison du modèle standard n'a pas de périmètre suffisant pour être rapprochée d'un modèle AW.
- Proposition soumise à AtoumWeb : confirmer les deux contrôles dans le périmètre des actions A19 et A16 et dans leurs temps existants, ou décider explicitement d'un complément avec effet sur les cibles. Aucune décision appliquée. Le modèle standard non lié au catalogue reste hors associations V1.
- Rapport et **matrice complète des 112 AW** : `C:/Users/AtoumWeb/Documents/ChatGPT/manager atoumweb+ bridge/outputs/operational-lot8a/audit-blueprints-et-matrice-aw-lot8a.md`. Aucune version opérationnelle, compatibilité ou nouvelle version structurelle créée. Migration 60 non créée.
- Validation-MSI toujours migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc** ; XLSX opérationnel SHA **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangé. Code fonctionnel inchangé ; contrôles 503/503/typecheck/UI 54/54 restent les contrôles du 7B, aucune validation technique 8A annoncée.
- Seul suivi documentaire mis à jour. Aucun backfill, publication, commit/push/merge, Lot 8B, Abby, Bridge ou 8C. Attendre la décision sur ces compléments avant reprise.

## Checkpoint courant — 04/10/2026 — Clôture locale dédiée Lot 7B

- AtoumWeb valide l'application réelle et autorise le **commit local dédié Lot 7B — projet prévisionnel et révisions commerciales**, sans push ni merge. Le commit contenant ce bloc clôture localement le 7B ; son SHA est consigné hors dépôt dans `outputs/contract-project-provisional-lot7b/cloture-git-lot7b.json`.
- **33 fichiers Lot 7B attendus uniquement**, contrôlés avant commit. Aucun artefact SQLite, sauvegarde, classeur, JSON de simulation ni sortie générée inclus. Aucun changement fonctionnel depuis **503/503 tests, typecheck OK, UI 54/54** ; migration 59 telle qu'appliquée. Seuls les trois documents de suivi ont été actualisés pour cette clôture.
- Validation-MSI reste en migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Aucune écriture base pendant la clôture ; données historiques, 112 AW/112 catalogue V1 BROUILLON/118 clauses BROUILLON/409 liens et achats d'options vides conservés. Huit tables 7B vides ; aucun Projet historique requalifié.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 8 non commencé.** Aucun push/merge, publication, Abby, Bridge ou 8C. Attendre une instruction séparée pour la suite.

## Historique — 04/10/2026 — Lot 7B appliqué, avant commit

- AtoumWeb valide la préparation et autorise **migration 59 seule**. Application réelle terminée, aucun commit autorisé ; attendre validation du bilan réel. Branche `feature/project-page-compositions-v1`, HEAD `c1cc00c9934ce78909f6ccf4b9b37952657e3c50` inchangé.
- Avant écriture : les **33 fichiers exacts**, **350 sources** et preuves validées **503/503 tests, typecheck OK, UI 54/54** ont été revérifiés ; aucun changement fonctionnel ni répétition inutile de suite. Index vide, Manager non démarré.
- Sauvegarde physique sous verrou : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot7b-2026-10-04T07-51-43-253Z.sqlite`, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**, égal à la source. Seconde écriture concurrente refusée, aucun WAL/SHM/journal actif. Jeton `8fa7d0de1b7650f425d3571197846293d4452b80ba6df488d8504340eabdef2c` recalculé avant écriture.
- **Migrations 1–59** ; schéma 7B présent, huit nouvelles tables **vides**, zéro backfill. Reconstruction projects : les **2 Projets / 19 anciennes colonnes / toutes les cellules** et les **21 tables qui les référencent** restent exacts. Indexes et trigger runtime `demo_track_projects` restaurés à SQL identique dans la transaction. Anciens Projets `legacy`, nouvelles relations Prospect/dossier/devis accepté/gel null.
- **104 tables métier + sqlite_sequence** préservées. 3 anciens devis / 6 lignes, 2 Projets, 36 nœuds, 3 Sites / 11 liens Pages, documents et provenance historiques exacts ; aucun Client/Projet/plan/Site/Page/objet Lot 8 créé.
- **112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / quote_option_purchases vide** intacts. Aucune publication ni injection rétroactive.
- Intégrité **ok**, FK **vide** ; rejeu aucune mutation logique **ni physique** ; checkpoints et fermeture réussis, aucun auxiliaire résiduel. SHA final **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Contre-vérification Python/SQLite indépendante en lecture immutable depuis la sauvegarde réussie.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Bilan/proofs dans `outputs/contract-project-provisional-lot7b/application-lot7b-validation-msi.md/json` et `contre-verification-lot7b.json`.
- **Lot 7B appliqué, non committé ; attendre validation du bilan réel. Recette manuelle AtoumWeb toujours à faire.** Aucun Lot 8, Abby, Bridge, 8C, publication, push/merge.

## Historique — 04/10/2026 — Lot 7B préparé, copie uniquement

- Lot 7 clôturé localement : **c1cc00c9934ce78909f6ccf4b9b37952657e3c50**, 27 fichiers validés, working tree propre après commit. Aucun push/merge. Les changements 7B sont séparés et non committés.
- Doctrine AtoumWeb validée : un seul Projet par dossier commercial, préparé avant acceptation sans Client artificiel ; révisions explicites, synchronisation différentielle préservant le manuel ; acceptation atomique sur le même Projet et gel exact. Le statut commercial est distinct du travail.
- Migration **59 préparée seulement**, migrations 1–58 intactes. Reconstruction contrôlée de la table projects pour assouplir la contrainte Client, avec copie exacte des anciennes colonnes ; huit tables, conflits/révisions immuables et protections opérationnelles. Aucun backfill historique.
- **503/503 tests**, 62 fichiers, 24 nouveaux tests 7B ; typecheck OK ; **54/54 UI isolée** dans les trois thèmes ; 11 observations de simulation, intégrité OK/FK vide, 104 tables antérieures préservées. Recette manuelle AtoumWeb à faire.
- Validation-MSI réelle inchangée en migrations **1–58**, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; XLSX inchangé au SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucune connexion SQLite à la source, seulement lecture physique/copie.
- 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens et anciens devis/Projets/documents conservés. Fixtures synthétiques seulement sur copies ; aucune publication réelle.
- Bilan : `docs/CONTRACTUAL_LOT7B_PROVISIONAL_PROJECTS.md` ; preuves `outputs/contract-project-provisional-lot7b` hors dépôt.
- **Arrêt avant application réelle et commit 7B. Ne pas démarrer Manager sur Validation-MSI : 59 pendante.** Aucun Lot 8, Abby, Bridge, 8C, push/merge. Attendre validation du bilan et autorisation séparée.

## Historique — 03/10/2026 — Clôture locale Lot 7

- Application migration 58 et bilan technique validés par AtoumWeb. Commit local dédié **Lot 7 — blueprints composés et quantités** autorisé, uniquement les 27 fichiers validés ; aucun push ni merge.
- 27 empreintes identiques à la fermeture avant actualisation documentaire ; aucun changement fonctionnel depuis **479/479 tests, typecheck OK, UI 24/24**. Recette manuelle AtoumWeb toujours à faire.
- Validation-MSI inchangée, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**, contrôle physique sans ouverture SQLite. Aucune publication ni modification historique.
- Audit Projet prévisionnel validé. La préparation du **Lot 7B** est autorisée séparément après ce commit, sur copies uniquement ; migration 58 intacte. Aucun Lot 8, Abby, Bridge ou 8C.
- Le SHA de clôture est obtenu par `git log -1` et consigné hors dépôt dans `outputs/contract-blueprints-lot7/cloture-git-lot7.json`.

## Historique — 03/10/2026 — Lot 7 appliqué, avant validation du bilan réel

Checkpoint historique conservé ; le checkpoint courant en tête fait foi.

- Feu vert AtoumWeb : **application réelle du Lot 7 uniquement / migration 58**, sans backfill, reconstruction historique, politique/destination commerciale inventée, publication ou objet opérationnel. **Application terminée ; aucun commit autorisé avant validation du bilan réel.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. **27 fichiers Lot 7 attendus**, index vide ; aucun push/merge.
- Empreintes vérifiées : 27 fichiers exacts, 336 sources applicatives et preuves validées **479/479 tests, typecheck sortie 0, UI 24/24**. Le plan d'application couvre 343 sources/fichiers de configuration ; aucun code fonctionnel changé, aucune répétition inutile de suite.
- Manager non démarré. Base initiale **1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide et SHM de verrou 32 768 octets, aucun journal actif.
- Sauvegarde physique immédiatement avant migration sous verrou : `C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot7-2026-10-03T21-01-27-408Z.sqlite`, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, identique au checkpoint initial. Intégrité/FK vérifiées indépendamment en lecture immutable.
- Jeton du plan **61e9e8156b3b20b28b7332584d9a54959b83f1d97022f69db31bde8177c44f4f** recalculé et empreintes revérifiées immédiatement avant le seul changement durable autorisé.
- Migration **58 seule appliquée** : migrations **1–58** présentes ; colonnes `quantity_mode/site_mode` et tables `project_blueprint_plans`, `project_composed_node_bindings`, `project_composed_site_bindings`, `project_composed_prerequisite_sources`. Les **quatre tables sont vides**.
- Seuls les défauts de schéma `once/create` apparaissent sur les **3 anciens liens blueprint** ; aucun mapping AW, règle de quantité ou destination commerciale renseigné. Les anciennes colonnes/valeurs de ces liens sont intactes.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle** ; 44 publications catalogue historiques inchangées. `quote_option_purchases` reste vide.
- Conservation exhaustive des **100 anciennes tables/colonnes/lignes**, hors ligne de migration 58 et nouvelles colonnes techniques autorisées. **DEV-2026-001/002/003**, leurs 2 lignes chacun, les **2 Projets**, leurs Sites/Pages et documents restent exacts ; aucun plan composé historique ni instance contractuelle ajouté.
- `integrity_check=ok`, `foreign_key_check` vide ; rejeu migrations **[]**, aucune modification logique **ni physique**. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; aucun WAL/SHM/journal résiduel. Contre-vérification indépendante Python/SQLite read-only immutable réussie contre la sauvegarde.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucun pack/maintenance/intervention, Abby, Bridge, Lot 8 ou 8C.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; preuves `application-lot7-validation-msi.md/json`, `contre-verification-lot7.json` et plan dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Lot 7 appliqué, non committé. Attendre validation du résultat avant commit local dédié, sans push/merge. Recette manuelle AtoumWeb toujours à faire.** Le mapping `AW → blueprint → rôle → destination → quantité` reste à décider/configurer explicitement et à versionner dans une étape autorisée séparément.

## Historique — 03/10/2026 — Lot 7 préparé, copie uniquement

Checkpoint historique conservé ; le checkpoint courant en tête fait foi.

- Autorisation AtoumWeb : **Lot 7 — Blueprints composés et quantités**, code/tests/UI/simulation uniquement. **Aucune écriture Validation-MSI ni commit Lot 7 autorisés.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. Aucun push/merge.
- Composition des lignes réellement vendues : base/addon, composants obligatoires, achats persistés Lot 6. Options disponibles seules sans contribution/prérequis. Quantité `once/per_unit`, destination `create/extend_base` explicites ; bases concurrentes bloquées.
- Migration additive **58 préparée seulement**, SQL 1–57 intacts. Plan composé figé et haché ; bindings des nœuds/Sites/unité et provenance des prérequis. Zéro backfill des Projets historiques ; rejeu conservant renommages/ajouts/détachements manuels.
- **479/479 tests**, 61 fichiers, 20 nouveaux cas Lot 7 ; typecheck sortie 0 ; **UI isolée 24/24**, trois thèmes. Recette réelle AtoumWeb à faire.
- Simulation complète sur copie : 11 observations, 1 Site/5 Pages ; +Page x2 → 7 ; +Blog → 6 ; option achetée uniquement → 6 ; Page x2 +Blog+SEO → 8 ; modification quantité 1→3 → 8 ; plusieurs bases bloquées. Rejeux sans mutation, 100 tables antérieures préservées par migration, intégrité ok/FK vide ; zéro objet opérationnel.
- Validation-MSI réelle demeure **migrations 1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal au contrôle. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** exact.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens** intacts ; devis DEV-2026-001/002/003, Projets et documents conservés.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; simulation, captures et fermeture technique dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Arrêt avant application réelle. Ne pas démarrer Manager sur Validation-MSI (58 pendante).** Attendre validation du bilan et autorisation séparée. Aucun Lot 8 opérationnel, Abby, Bridge, 8C ou publication.

## Historique — 03/10/2026 — Lot 6 validé, clôture locale dédiée

Ce bloc fait foi ; les préparations et bilans antérieurs restent historiques.

- AtoumWeb valide le bilan réel et autorise le **commit local dédié Lot 6 — options réellement achetées**, sans push ni merge. Le commit contenant ce bloc clôture localement le Lot 6 ; son SHA et la liste exhaustive des fichiers sont consignés dans outputs/contract-options-lot6/cloture-git-lot6.json.
- Migration **57 appliquée sur Validation-MSI** ; quote_option_purchases présente et **vide**. Aucun backfill historique, aucune requalification implicite, aucune publication catalogue/contractuelle ni création de Projet/Site/Page/pack/maintenance.
- Contrôle avant commit : **24 fichiers Lot 6 attendus uniquement**, index initialement vide ; 335 sources applicatives identiques à la fermeture validée **459/459 tests, typecheck OK et UI 20/20**. Aucun changement fonctionnel depuis ces contrôles ; seules trois documentations de suivi actualisées.
- Aucun artefact de sauvegarde/simulation/base/classeur inclus ; les scripts de simulation/contrôle prévus font partie du code Lot 6, leurs sorties demeurent hors dépôt.
- Validation-MSI demeure au SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens, devis historiques, Projets et documents conservés.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 7 non commencé.** Aucun démarrage Manager ni écriture base pendant cette clôture. Aucun push/merge, publication, Abby, Bridge ou 8C.


## Historique — 03/10/2026 — Lot 6 appliqué, avant validation de clôture

Ce bloc fait foi ; les préparations précédentes restent historiques.

- AtoumWeb autorise l'application réelle du Lot 6 uniquement, migration **57**, après validation 459/459 tests, typecheck OK et UI 20/20. **Application terminée, aucun commit autorisé à ce stade ; attendre validation du bilan réel.**
- Branche feature/project-page-compositions-v1, HEAD **fa52b68911d8649013a4a4e40e19d91a56d0c6e6** inchangé. Les 24 fichiers Lot 6 et leurs empreintes correspondent exactement à la fermeture validée avant écriture ; 335 sources applicatives contrôlées. Aucun code fonctionnel changé, aucune suite répétée inutilement.
- Manager non démarré. Base initiale 1–56 au SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide, SHM de verrou 32 768 octets, aucun journal actif sous verrou.
- Sauvegarde physique immédiatement avant application sous verrou : C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot6-2026-10-03T19-57-38-123Z.sqlite, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, identique à la base avant. Intégrité de la sauvegarde vérifiée indépendamment en lecture immutable.
- Jeton du plan **7a5e7f86e43f15c815ec437ec102ac51f0a07d1dafd351332fea4fc5eb4d286f** revérifié juste avant migration ; empreintes du plan, de la base, du XLSX, des sources et des preuves de tests inchangées. Aucune autre migration pendante acceptée.
- Migration **57 seule appliquée** : migrations **1–57** présentes ; quote_option_purchases et ses trois triggers créés, **0 achat**, aucun backfill/requalification historique.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts**. 0 nouvelle publication ; les 44 versions catalogue publiées anciennes demeurent inchangées. 0 lien catalogue BASE, LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE hors bibliothèque.
- Conservation exhaustive des **99 anciennes tables**, colonnes, lignes et objets de schéma : toutes les empreintes avant/après identiques, hors nouvelle ligne de migration 57. DEV-2026-001/002/003 et leurs deux lignes chacun strictement inchangés ; 0 clause rétroactive. Deux Projets et état documentaire exacts ; aucun Projet/Site/Page/pack/maintenance/objet opérationnel créé.
- integrity_check **ok**, foreign_key_check **vide** ; rejeu migration **[]**, aucune modification logique ni physique. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; aucun WAL/SHM/journal résiduel.
- Contre-vérification indépendante Python/SQLite mode=ro immutable réussie contre la sauvegarde. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** conservé ; aucune modification Abby, Bridge ou 8C.
- Rapports : outputs/contract-options-lot6/application-lot6-validation-msi.md/json, contre-verification-lot6.json et fermeture-reelle/plan-application-lot6.json.
- **Lot 6 appliqué, non committé. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Aucun push/merge. Lot 7 non commencé. Attendre validation du bilan avant commit local.**


## Historique — 03/10/2026 — Lot 6 préparé localement, avant autorisation réelle

- Autorisation AtoumWeb : **Lot 6 — Options réellement achetées** uniquement, implémentation locale/tests/simulation sur copie. Aucun Lot 7, publication, Abby, Bridge ou 8C.
- Base : commit Lot 5 **fa52b68911d8649013a4a4e40e19d91a56d0c6e6**, feature/project-page-compositions-v1. Lot 6 non committé ; aucun push/merge.
- Relation additive quote_option_purchases : achat explicite par ligne persistée, origine offre/version/composant exacte, jamais par nom. Prix/remise/quantité/version du service restent dans la ligne et son snapshot.
- Migration **57 préparée seulement**. SQL 1–56 inchangé. Validation-MSI réelle reste en **1–56**, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**.
- UI : services inclus, disponibles non achetés, options achetées, quantité/prix/provenance ; achat/retrait transactionnels et idempotents ; duplication brouillon sans mutation de l'original ; origine incluse dans le snapshot figé.
- **459/459 tests**, 60 fichiers, 16 cas Lot 6, typecheck sortie 0 ; UI isolée **20/20**, trois thèmes. Recette manuelle AtoumWeb à faire ; Manager réel non démarré.
- Simulation 3 devis fictifs : 1/2/3 lignes, 100/120/208,60 euros, 1/3/3 clauses. Quantités 3 et 2 conservées, aucun Projet/Site/Page/objet opérationnel créé. Publications exclusivement synthétiques sur copie.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts** ; trois devis historiques/projets/documents exacts. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** inchangé.
- Bilan docs/CONTRACTUAL_LOT6_PURCHASED_OPTIONS.md ; outputs/contract-options-lot6. **Arrêt avant application Validation-MSI et Lot 7 ; attendre instruction distincte.**


## Historique — 03/10/2026 — Lot 5 validé, clôture locale dédiée

Ce bloc fait foi ; les préparations et bilans d’application antérieurs restent historiques.

- AtoumWeb valide le bilan réel et autorise le commit local dédié **Lot 5 — paramètres contractuels et preuves**, sans push ni merge, sur feature/project-page-compositions-v1. Le commit contenant ce bloc constitue le checkpoint Lot 5 ; son SHA exact figure dans outputs/contract-parameters-lot5/cloture-git-lot5.json et git log -1.
- Migration **56 appliquée avec succès sur Validation-MSI**, aucun backfill des anciens devis, aucune publication catalogue ou contractuelle, aucune donnée administrative fictive.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts** ; devis historiques et Projets inchangés. Aucun DEV-2026-004, aucun document ou preuve fictif.
- Contrôle avant commit : **38 fichiers Lot 5 attendus**, 332 sources applicatives identiques à la fermeture validée 443/443 tests + typecheck OK ; aucun changement fonctionnel. Aucun fichier généré de simulation, base, sauvegarde ou journal inclus ; les trois scripts de contrôle/simulation font partie du code prévu.
- Validation-MSI conserve l’empreinte **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71** ; aucun démarrage Manager ni écriture base pendant la clôture.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 6 non commencé.** Bridge et 8C restent suspendus ; aucune publication ni push/merge.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; application et contre-vérification conservées dans outputs/contract-parameters-lot5. Aucun autre lot inclus dans la clôture.


## Historique — 03/10/2026 — Lot 5 appliqué, avant validation de clôture

Ce bloc fait foi ; les préparations et checkpoints précédents restent historiques.

- AtoumWeb valide le dry-run et autorise l’application réelle du Lot 5, migration 56 seule, sans backfill, devis de simulation, administration fictive ni publication. **Application terminée ; aucun commit Lot 5 autorisé avant validation du résultat.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé. 38 fichiers Lot 5 attendus, index vide, aucun push/merge. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale.
- Code inchangé depuis les **443/443 tests + typecheck sortie 0**, UI isolée 20/20 ; aucune répétition inutile de suite. Horodatages contrôlés puis empreintes des 332 sources applicatives et des 38 fichiers attendus revérifiées avant écriture.
- Manager non démarré. Verrou exclusif acquis et seconde connexion d’écriture refusée ; WAL vide, SHM 32 768 octets, aucun journal actif. Sauvegarde physique immédiate : C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot5-2026-10-03T18-56-43-167Z.sqlite, SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; intégrité/FK vérifiées.
- Migration **56 seule appliquée**, migrations 1–55 intactes ; comparaison exhaustive des **98 anciennes tables/colonnes/lignes** contre le backup. Aucun devis, preuve, configuration administrative ou empreinte documentaire historique ajouté.
- Validation-MSI : **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle**. Les 44 versions catalogue publiées anciennes sont inchangées. DEV-2026-001/002/003, les 2 Projets et l’état documentaire antérieur sont exacts ; aucun DEV-2026-004, aucune instance de clause rétroactive.
- Nouveaux paramètres de tous les devis NULL ; table de preuves vide ; configuration contract-administration-v1 absente, états à renseigner retournés sans seed. CONS-RETRACTATION-EN-LIGNE hors bibliothèque ; RSVP sensible désactivé, qualification numérique multi-indicateurs. Garde-fous du Builder confirmés en lecture pure, aucun devis test réel.
- integrity_check ok / foreign_key_check vide, migrations **1–56** présentes. Rejeu réel aucune migration et aucune modification logique **ni physique**, checkpoint WAL réussi. Contre-vérification indépendante Python/SQLite read-only réussie.
- Base avant/backup SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; base après fermeture SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**. XLSX inchangé 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves réelles application-lot5-validation-msi.md/json et contre-verification-lot5.json dans outputs/contract-parameters-lot5 du dossier documentaire partagé.
- **Lot 5 appliqué, non committé : attendre validation du bilan réel avant commit local dédié. Aucun Lot 6, publication, Abby, Bridge ou 8C ; aucun push/merge.**


## Historique — 03/10/2026 — Lot 5 préparé, simulation uniquement

Ce bloc fait foi pour l’état actuel ; les checkpoints antérieurs restent historiques.

- AtoumWeb autorise uniquement l’implémentation locale, les tests et le dry-run du Lot 5 — Paramètres contractuels du devis et preuves. **Aucune écriture Validation-MSI ni commit Lot 5 autorisé pour cette passe.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé, aucun push/merge. Recette manuelle AtoumWeb à faire avant validation fonctionnelle finale.
- Migration additive **56** préparée après contrôle de la base 55 ; exécutée seulement en mémoire/copie. SQL 1–55 intacts ; aucune donnée historique complétée automatiquement.
- Préparation intégrée au devis : échéancier, qualification numérique/contextuelle, garanties 30/60/90 distinctes des droits légaux, validation explicite, droits/renouvellement, administration sans valeurs fictives, B2C et RSVP minimal. Gel transactionnel enrichi ; preuves génériques et PDF SHA-256, contrôle à l’ouverture, historique de remplacement et archivage sans perte.
- Vérifications finales : **443/443 tests (59 fichiers, dont 34 nouveaux cas), typecheck sortie 0, UI Electron isolée 20/20**. Interface simulée distincte de la recette réelle AtoumWeb.
- Dry-run final sur copie : **98 tables historiques préservées à la migration**, integrity_check ok, FK vide, rejeu migration sans effet ; ancien historique exact. DEV-2026-004 test sur copie seulement, finalisation refusée pour administration réellement absente/socle publié manquant. Aucun Client/preuve/PDF inventé.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / 0 publication** conservés. DEV-2026-001/002/003 et Projets inchangés. Seuls compteur +1/index dérivé sont rafraîchis par la création CRM sur copie.
- Validation-MSI réelle toujours migration 55 et SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; XLSX SHA 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 inchangé. Manager non démarré sur Validation-MSI.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves dans outputs/contract-parameters-lot5 du dossier documentaire partagé. **Arrêt avant application réelle et attente du feu vert. Ne pas démarrer Manager sur Validation-MSI (56 pendante). Aucun Lot 6, publication, Abby, Bridge ou 8C.**


## Historique — 03/10/2026 — Lot 4 validé, clôture locale dédiée

Ce bloc fait foi ; les états précédents restent historiques.

- AtoumWeb valide le résultat réel du Lot 4 et autorise son **commit local dédié uniquement**, intitulé `Lot 4 — import bibliothèque contractuelle V1`, sur `feature/project-page-compositions-v1`. Le commit contenant ce bloc fait foi pour le checkpoint Lot 4 ; récupérer son SHA avec `git log -1 --format=%H`. Aucun push/merge.
- 118 clauses/versions BROUILLON et 409 liens ; aucune publication contractuelle. Les 112 versions catalogue V1 restent également BROUILLON. Textes/provenance et anciens devis/Projets préservés ; migration 55 appliquée seule, intégrité et rejeu validés.
- **RECETTE MANUELLE ATOUMWEB À FAIRE avant validation fonctionnelle finale. Lot 5 non commencé ; attendre un feu vert séparé.** Bridge et 8C restent suspendus.
- Avant clôture : 21 fichiers Lot 4 attendus uniquement, aucun changement fonctionnel depuis suite complète 409/409 et typecheck OK. Validation-MSI inchangée par cette clôture, SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`. Manager non démarré, aucune écriture base.
- Rapports réels dans `outputs/contract-library-lot4` du dossier documentaire, bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`. Le bilan de clôture Git hors dépôt donne l'empreinte exacte du commit et la vérification de working tree propre.


## Historique — 03/10/2026 — Lot 4 appliqué avant validation de clôture

Ce bloc fait foi ; les blocs antérieurs et le dry-run restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934` (commit Lot 3). **Lot 4 non committé, aucun push/merge.** Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.
- AtoumWeb valide le dry-run et autorise l'application réelle sous conditions. Fermeture sur le code exact : **58 fichiers / 409 tests / 0 échec**, typecheck sortie 0, 21 fichiers Lot 4 prévus, aucun staged. Aucun changement fonctionnel après ces tests.
- Manager non démarré. WAL vide, SHM présent (32 768 octets), aucun journal actif ; writer concurrent bloqué sous verrou exclusif. Sauvegarde physique immédiate, intégrité OK : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot4-2026-10-03T12-37-38-123Z.sqlite`, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`.
- Migration **55** et import sous transaction englobante, savepoints des opérations existantes ; migrations 1–54 intactes. Empreintes XLSX/extraction/manifeste/documents/base/code contrôlées, jeton recalculé immédiatement avant import identique au validé : `8f5b0c9b3ba4a08eab134fed6061de13cd32881f295c5ed6ade66c22d1323bff`.
- Résultat réel : **118 templates / 118 versions initiales BROUILLON / 409 liens explicites** ; 19 base/99 catalog, 105 all/3 professional/10 consumer ; **0 published / 0 lien BASE**, journal 1 passage/118 entrées. LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE absent, aucun ancien alias importé.
- Textes/revues/sources/réserves/provenance exacts au XLSX du 03/10, SHA inchangé `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. Cinq niveaux et suivi 42/52/22/2 conservés sans visa juriste automatique ; aucun arbitrage métier rouvert ni action hors clause transformée.
- Les **112 AW et 112 versions catalogue V1 BROUILLON** restent intacts ; 44 anciennes versions publiées inchangées. Devis DEV-2026-001/002/003, Projets, anciennes versions, documents et autres tables métier identiques au backup. **0 instance de clause historique**, absence `historical_missing` conservée. Builder : 0 version courante publiée éligible, brouillons non consommés.
- Après COMMIT : rejeu **0 création/version/lien supplémentaire**, toutes les tables identiques, activité/journal inclus. `integrity_check=ok`, FK vide, checkpoint WAL réussi. Contre-vérification indépendante SQLite en lecture seule contre backup : **96 tables historiques**, textes/revues/liens exacts.
- Base avant/backup SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; base après checkpoint/fermeture SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, preuves réelles `outputs/contract-library-lot4/application-lot4-validation-msi.md/json`, contre-vérification et fermeture conservées. **Attendre la validation du bilan réel avant commit local dédié Lot 4. Aucune publication ni Lot 5, Abby, Bridge ou 8C.**


## Historique — 03/10/2026 — Lot 4 préparé, avant autorisation réelle

Ce bloc fait foi ; les blocs antérieurs restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local **`1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`** : commit Lot 3 dédié uniquement, aucun push/merge. Working tree propre constaté avant les modifications Lot 4. Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale, mentionnée dans le commit.
- Lot 3 validé : catalogue réellement importé à Validation-MSI, 112 AW, 91 créations/21 reprises/15 archives/9 conservations, versions V1 brouillon, historique et rejeu préservés. Base réelle migrations **1–54**, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` inchangé pendant Lot 4.
- Autorisation Lot 4 limitée à préparation et dry-run sur copie. Référentiel XLSX du 03/10 SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` ; textes exacts, huit documents juridiques préservés.
- Migration additive **55 préparée et testée uniquement sur copie/mémoire** : revue/provenance des versions et journal d'import. Migrations 1–54 inchangées, aucun seed/import automatique. **Ne pas démarrer Manager contre Validation-MSI avant feu vert pour la migration/import.**
- Simulation/répétition : **118 clauses / 118 versions BROUILLON / 409 liens explicites**, 19 base/99 catalog ; 105 all/3 professional/10 consumer ; zéro anomalie/publication/lien BASE. `LANDING-GESTION` seule dormante, contrôle `CONS-RETRACTATION-EN-LIGNE` exclu. Rejeu zéro changement, intégrité SQLite OK et FK vide, anciens devis/Projets/catalogue strictement préservés.
- Suivi documentaire 42 modifier/52 inchangé/22 hors clause/2 qualifications et cinq niveaux de revue conservés, sans blocage automatique juriste. Les 16 décisions restent closes ; les 44 actions hors clause ne deviennent pas de nouvelles clauses/tables.
- Tests ciblés **59/59**, typecheck sortie 0, UI Chromium isolée **21/21** ; recette réelle non effectuée puisque import réel interdit pour cette passe. Extraction déterministe contrôlée, empreintes DB/XLSX/documents avant/après identiques.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, dry-run exhaustif MD/CSV/JSON `outputs/contract-library-lot4` du dossier documentaire. **Arrêt avant écriture réelle, attente du feu vert AtoumWeb.** Aucun commit Lot 4, publication, Lot 5, Abby, Bridge ou 8C ; aucun push/merge.


## Historique — 03/10/2026 — Contrats Lot 3 appliqué, avant commit

Ce bloc fait foi pour la reprise actuelle ; les comptes rendus datés ci-dessous restent historiques.

- Branche : `feature/project-page-compositions-v1`. HEAD local Lot 2 `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9` ; Lot 1 `dedb865f4cdabd518391b63f067ed8e2647c869b`. Aucun push/merge. **Lot 3 non committé**, 20 fichiers prévus seulement, aucun changement staged.
- Lots 1/2 validés techniquement ; **RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD avant validation fonctionnelle finale**, réserve portée dans les commits. Brouillon/publication séparés, snapshot vide figé, absence contractuelle historique conservée, PDF rattaché protégé ; empreinte PDF/historique des remplacements différés au Lot 5.
- AtoumWeb a validé le dry-run Lot 3 puis autorisé l'application réelle, après suite complète **57 fichiers / 390 tests / 0 échec**, typecheck sortie 0 et contrôle du working tree. Aucun changement de code depuis ces tests ; seules preuves/documentation ajoutées ensuite.
- Sauvegarde physique immédiate sous verrou d'écriture exclusif : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`, SHA-256 `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base mode WAL, WAL vide et SHM présent ; seconde connexion d'écriture bloquée, backup intact et `integrity_check=ok`. Manager n'a pas été démarré.
- Migrations additives **53 et 54 réellement appliquées**, avec l'import dans une transaction englobante. Migrations 1–52 et leurs données préservées, aucun seed ; ancien SQL 53 inchangé. Jeton recalculé immédiatement avant application identique au validé : `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4` ; fichier base, classeur et payload contrôlés, rollback prévu au moindre écart.
- Application réelle : **91 créations, 21 reprises par nouvelle version, 15 archives réversibles sans AW, 9 historiques génériques conservés ; 112/112 codes AW ; 112 nouvelles versions BROUILLON**. Totaux : 136 items, 157 versions, 44 anciennes versions publiées inchangées, 113 brouillons incluant l'ancien, 127 entrées / 1 passage d'import.
- Les huit anciennes ambiguïtés sont archivées sans code AW ni nouvelle version ; les huit cibles V1 sont des références distinctes. Aucun rapprochement par nom. Les 21 reprises gardent leurs UUID ; anciennes versions/prix et compositions exacts préservés, liens blueprint recopiés exactement (2 anciens + 1 copie = 3).
- Trois devis `DEV-2026-001/002/003`, leurs lignes/snapshots, Projets, documents et toutes les autres tables métier inchangés. Comparaison exhaustive contre l'état initial et contre la sauvegarde par une seconde lecture SQLite indépendante. **Aucune clause V1 injectée rétroactivement.**
- `integrity_check=ok`, `foreign_key_check` vide. Rejeu sur l'état réellement committé : **zéro modification**, 136 conservations ; empreinte logique de toutes les tables inchangée, activité/journal inclus. Checkpoint WAL final réussi avant empreinte physique.
- Base avant : `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base après : `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`. XLSX inchangé : `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
- Bilan : `docs/CONTRACTUAL_LOT3_CATALOG_IMPORT.md` ; preuves réelles `outputs/catalogue-lot3/application-lot3-validation-msi.md/json` et `contre-verification-lecture-seule.json` dans le dossier documentaire. Le dry-run antérieur reste conservé comme historique.
- **Aucune version catalogue V1 publiée. Arrêt avant Lot 4, attente du nouveau feu vert.** Aucun import des 118 clauses/409 liens, paramétrage contractuel du devis, options achetées, blueprint composé, Abby ou Bridge. Lot 8C suspendu. Aucun commit Lot 3/push/merge.

## Lot 8A en cours — Export Page Manager

- Branche empilée : `codex/lot8a-page-export`, basée sur le HEAD validé du Lot 7 ; PR #76 non fusionnée.
- L'export générique `atoumweb_bridge_project_package` V1 reste inchangé.
- Une Page rattachée à un Site actif et possédant une composition peut produire une enveloppe V2 avec `scope=page`, `exportId` et destination `projectId/siteId/pageId`.
- Migration additive **52** : historique immuable des exports Page et empreinte du ZIP.
- Les adaptations locales HTML/CSS/JS enregistrées dans l'atelier sont transportées avec checksums recalculés ; la provenance Bibliothèque source reste intacte.
- Contrat et schéma ajoutés : `docs/ATOUMWEB_PAGE_PACKAGE_V2.md` et `.schema.json`.
- Typecheck réussi ; tests ciblés package/migrations : **14/14**.
- État : modifications locales sans commit/push, recette du bouton « Préparer pour Bridge » requise. Le support d'import idempotent côté plugin Bridge reste à implémenter après confirmation de son dépôt local.

## Lot 7 en cours — Squelette blueprint Sites / Pages

- Branche de travail : `codex/lot7-blueprint-sites`, créée depuis le checkpoint canonique `cf747c5855eec90df725861d22375d65f78f12db`.
- Premier incrément local : déclarations explicites Site/Page par version de blueprint, provenance durable et application idempotente lors de la création d'un Projet.
- Les réapplications conservent les renommages, domaines, rattachements et Pages ajoutées manuellement ; elles ne créent aucun doublon ni journal d'activité supplémentaire.
- Le blueprint vitrine V1 déclare un Site principal, une Accueil et quatre Pages complémentaires.
- Les versions brouillon peuvent configurer cette structure via l'API de modèles ; une nouvelle version recopie les déclarations avec les nouveaux identifiants de nœuds.
- L'écran Sites & pages expose « Initialiser depuis le blueprint » pour les Projets historiques ; un blueprint sans déclaration produit un message explicite.
- Migrations additives prévues : **50** pour le modèle Site/Page, puis **51** pour la compatibilité explicite des anciens Projets `web` / `website` déjà liés à un blueprint sans structure Site/Page.
- La recette réelle de `PRO-2026-001` a révélé ce cas historique. Le fallback utilise le type du Projet, jamais son nom, conserve son blueprint d'origine et matérialise uniquement les Pages déclarées et leurs ancêtres manquants.
- Validation locale après correction : `npm run typecheck` réussi ; tests ciblés migrations / ProjectService / ProjectSiteService **33/33 réussis**.
- Recette réelle validée sur `PRO-2026-001` : création de 1 Site et 5 Pages, réapplication sans doublon, renommages Site/Page conservés et Page manuelle conservée ; résultat final 1 Site / 6 Pages.
- Architecture suivante actée : le projet moderne sera composé depuis le devis (`offre de base → options/prestations → blueprint final`). Le mapping par `project_type` ajouté en migration 51 reste strictement une compatibilité legacy.
- État : prêt pour commit, push et PR vers `feature/project-page-compositions-v1`. Le harness Electron n'a pas démarré ses contrôles lors du dernier essai, Chromium ayant arrêté son processus GPU Windows (`GPU process isn't usable`).

## Lot 6B clos — 29/09/2026 — PR #75 intégrée et contrôles post-intégration verts

- Branche de stabilisation : `wip/codex-6b-ui-fix`.
- Branche canonique : `feature/project-page-compositions-v1` au HEAD `3df2168d7a3e662d98f68525550309ea71be0d67`.
- Comparaison pré-intégration vérifiée : la WIP était **strictement devant / 0 derrière** la branche canonique ; aucune divergence concurrente détectée.
- [x] Barre fantôme identifiée et supprimée : `main.project-production-secondary` vide n'est plus rendu sous Sites & pages.
- [x] Structure Sites & pages stabilisée : **Arborescence | Fiche Page | Atelier latéral**.
- [x] Replis/restaurations indépendants de l'Arborescence, de la Fiche Page, de Réglages et de Code / aperçu.
- [x] Réduire la Fiche Page ne démonte plus Réglages / Code ; les brouillons et aperçus restent actifs.
- [x] Réglages et Code / aperçu peuvent être ouverts seuls ou ensemble ; synchro du brouillon Réglages vers Code / aperçu en direct.
- [x] Timer Page compact.
- [x] Informations de Page repliables au-dessus de la composition.
- [x] Aperçus isolés pour éviter la contamination CSS entre composants ; JavaScript source non exécuté.
- [x] Desktop / Tablette / Mobile disponibles dans Réglages et Code / aperçu.
- [x] Grand écran harmonisé Réglages / Code : preview dominante à gauche, outils scrollables à droite, ratio cible ~75/25.
- [x] Validation explicite des modifications locales, Undo / Redo, retour Version Bibliothèque et promotion en variante conservés.
- [x] Pickers couleurs étendus (hex/alpha/HSL) et réglages visuels locaux conservés.
- [x] Migration 49 inchangée ; aucune nouvelle migration ajoutée pendant la stabilisation UX.
- [x] `npm run typecheck` réussi sur MSI.
- [x] Tests Vitest ciblés historiques : **35/35 réussis**.
- [x] Harness Electron final : **65/65 contrôles réussis, 0 échec** sur le checkpoint `d464ad2b2d7f500a6a1443059e50f706dc244200`.
- [x] Recette visuelle réelle Carlos validée le 29/09/2026 : replis, atelier docké, aperçu scrollable, grand écran Réglages, grand écran Code et disposition 75/25 jugés conformes.
- [x] PR **#75** (`wip/codex-6b-ui-fix` → `feature/project-page-compositions-v1`) fusionnée le 29/09/2026 par le merge commit `3df2168d7a3e662d98f68525550309ea71be0d67` ; aucune fusion vers `main`.
- [x] Après intégration sur le HEAD canonique `3df2168d7a3e662d98f68525550309ea71be0d67` : `npm run typecheck` réussi, harness Electron **65/65**, tests Vitest ciblés **35/35**.
- [x] Suite Vitest complète lancée le 29/09/2026 : premier passage **336/339**, 3 échecs transverses identifiés hors UX 6B.
- [x] Correctifs poussés :
  - test migration legacy rendu dynamique jusqu'à la migration courante ;
  - test Workflow aligné sur le Builder CGV structuré ;
  - `quote_contract_clauses` ajouté au tracking/purge DemoService.
- [x] Suite complète relancée après ces trois correctifs : **53 fichiers / 339 tests réussis, 0 échec**.
- [x] `npm run package` : package Windows **win32 x64** généré avec succès.
- [ ] Corriger à faible priorité l'avertissement Electron du harness `console-message` déprécié ; aucun impact fonctionnel Manager.
- [ ] Lot suivant : Lot 7 de la feuille de route Manager ↔ Bridge (préparation Site / package / Workbench), à commencer uniquement après autorisation explicite ; aucun travail Bridge effectué pendant le Lot 6B.

Détails complets et journal de décisions : `docs/MANAGER_BRIDGE_ROADMAP.md`.


## Coordination Manager ↔ Bridge — 27/09/2026

- [x] Note d'architecture Pages hybrides et feuille de route consignées dans [`docs/MANAGER_BRIDGE_ROADMAP.md`](docs/MANAGER_BRIDGE_ROADMAP.md), avec journal partagé des consignes/décisions pour les agents.
- [x] Checkpoint MSI sur `4f8fa15c80da874e084648b1d643a316cbfcbcb2` : typecheck réussi et **34 tests ciblés réussis / 0 échoué** (CGV 9, devis 8, migrations 10, composition 5, package composition 2).
- [x] Validation-MSI contrôlé en lecture seule : migrations 1–43 sans collision CGV ; 44–46 restent à appliquer dans ce workspace. Pas de lancement de l'application ni d'accès Production.
- [ ] Recette visuelle CGV après lancement/migrations à effectuer par Carlos ; aucune suite complète ni packaging relancé pour ce checkpoint.
- Direction proposée : Page opérationnelle existante + Site + composition facultative/partielle, Divi comme atelier, occurrences durables, provenance distincte de la destination.
- Prochaine action : lire la feuille de route, confronter les identités/contrats au vrai plugin Bridge et confirmer les arbitrages avant d'autoriser un lot. **Aucun lot 6–9 commencé ou autorisé par la publication documentaire.**
- La PR #74 est déjà intégrée. Les mentions historiques contraires plus bas ne constituent pas une instruction de la fusionner à nouveau. Le journal partagé contient les consignes courantes ; l'historique ci-dessous est conservé.


## Checkpoint — convergence CGV Builder V1 — 27/09/2026

- [x] Le travail de `feature/quote-cgv-builder-v1` / PR #74 a été sécurisé puis réconcilié avec le HEAD Projet V2 `51b7ca247652a85929ae4ff580beaf329c0f6b9b`.
- [x] Les 28 fichiers fonctionnels du Builder CGV ont été repris sans supprimer les avancées Bridge / Familles / Correspondances / Composition.
- [x] Les migrations CGV initialement numérotées 40 / 41 / 42 sur la branche parallèle sont renumérotées **44 / 45 / 46** pour conserver les migrations actuelles 40 à 43.
- [x] Builder : bibliothèque de clauses versionnées, clauses prestation, conditions particulières, public professionnel/consommateur, snapshot contractuel et copie pour Abby.
- [x] PDF Abby accepté rattachable au devis ; onglet Contrats côté Client conservé.
- [x] Les brouillons `CGV_CONTENT_DRAFT.md` et `CGV_SERVICE_MODULE_TEXTS_DRAFT.md` sont intégrés ; ils ne constituent pas encore des textes juridiques de production.
- [ ] Validation MSI obligatoire après synchronisation : `npm run typecheck`, tests migrations + ContractTerms + QuoteService, puis recette visuelle Devis/Client.
- [ ] Avant d’ouvrir un ancien workspace ayant éventuellement servi à la branche CGV historique, contrôler `schema_migrations` : les anciens IDs 40/41/42 CGV ne doivent pas être confondus avec les migrations 40/41/42 désormais attribuées au chantier Bridge.
- [ ] Le prochain lot d’architecture reste **Projet → Site → Page → Composition**, avant le vrai round-trip multi-composants Bridge.

## Lot suivant — Package projet / Workbench multi-composants — 27/09/2026

- [x] Convention interne `atoumweb_bridge_project_package` 0.1 ajoutée sans modifier les contrats Component / Fields / Identity V1.
- [x] Une composition Manager peut préparer un ZIP unique en conservant l’ordre, la version exacte, la Famille / Variante et les SHA-256 de chaque composant.
- [x] Les Component Package V1 existants sont réutilisés comme source ; aucun composant Bibliothèque n’est réécrit.
- [x] Bibliothèque : action **Préparer pour Bridge** + accès au ZIP généré.
- [x] Bridge 0.8.0 : import du package projet dans **un seul Workbench Divi**, avec un module Code distinct par composant et ordre Manager conservé.
- [x] Bridge crée une **Site Occurrence V1 distincte par composant** du Workbench projet et conserve la provenance de la composition.
- [x] Les Workbenches projet sont distingués des Workbenches composant / production dans l’interface Bridge.
- [ ] Validation MSI Manager : typecheck + tests Composition / Package / migrations.
- [ ] Validation réelle Bridge 0.8.0 : installer le plugin, importer un package de composition et vérifier le Workbench Divi.
- [ ] Lot suivant : provenance/retour multi-composants (configuration et Occurrence Return composant par composant).
- [ ] Publication production et intégration des branches parallèles 40/41/42 restent différées.

## Lot suivant — Composition multi-composants — 27/09/2026

- [x] Migration 43 : stockage dédié des compositions et de leurs occurrences de composants, sans modifier les composants Bibliothèque sources.
- [x] Une composition possède un nom, un métier cible, un statut et un ordre explicite de composants.
- [x] Chaque occurrence de composition mémorise l’item source, la version exacte, la famille, la variante, la catégorie et le métier au moment de l’ajout.
- [x] Ajout, retrait et réorganisation d’occurrences implémentés ; une même source peut être utilisée plusieurs fois sans mutation de la Bibliothèque.
- [x] Les composants Bridge marqués `ready` sans validation humaine restent refusés ; seuls les composants réellement « Prêt à réutiliser » sont composables.
- [x] API Electron / preload ajoutée pour lister, créer et éditer les compositions.
- [x] Bibliothèque : action **Composer un site**, création d’une composition, sélection du métier, panier ordonné et ajout de composants prêts.
- [x] Tests unitaires ajoutés pour provenance/version figée, réorganisation, retrait, refus des composants non prêts, validation humaine Bridge et archivage.
- [ ] Validation MSI : `npm run typecheck`, migrations, tests Composition ciblés puis recette visuelle.
- [ ] Lot suivant après validation : **Package projet / Workbench multi-composants**. Aucun format de package projet ni publication WordPress n’est ouvert dans ce lot.
- [ ] Les branches parallèles 40/41/42 restent volontairement hors intégration jusqu’au checkpoint final des lots.

## Correction UX — Reconnaissance des éléments et réexamen — 26/09/2026

- Retour Carlos : persistance confirmée, mais la validation basée sur des IDs / scores est incompréhensible. La première recette valide le stockage, pas la pertinence des correspondances choisies.
- [x] Revue ouverte directement sous la page concernée. Chargement des aperçus avant/après uniquement à la demande, contexte de page, dates, position, extrait de contenu ; IDs et score repliés dans les détails techniques.
- [x] Décision affichée sur le bloc qui reste en place : « C’est le même élément » / « Ce sont deux éléments différents ». Les propositions peuvent rester en attente sans bloquer le parcours ; « À examiner plus tard » replie la carte sans écrire de décision.
- [x] Les aperçus sont reconstruits, sans exécution JavaScript ni chargement externe ; leur rendu peut être incomplet. Pas de décision proposée sans contenu reconnaissable ; les conteneurs sans aperçu restent en attente.
- [x] Migration 42 additive pour historiser les réexamens, compatible avec les décisions déjà enregistrées sous migration 41. Réexamen transactionnel et idempotent, historique conservé, attributions retirées seulement si aucune validation dépendante ne les utilise. Sinon, message demandant de réexaminer d’abord les validations suivantes.
- [x] Tests ciblés : **35 réussis / 0 échoué** (Snapshot 26, migrations 9) ; typecheck réussi. Aucun contrat V1 ni snapshot modifié. Aucun commit/push, suite complète ou packaging.
- [x] Recette Carlos : nouvelle présentation avant/après, décisions sur place et réexamen validés visuellement. Contrôles ciblés confirmés verts : typecheck + **35/35 tests**.

## Validation humaine des correspondances de nœuds — 26/09/2026

- [x] Migration 41 : identités logiques, attributions et décisions dans des tables Manager séparées. Les snapshots, objets et `bridge_nodes.logical_node_id` importés restent intacts.
- [x] Validation / refus explicites depuis Sites → comparaison → Correspondances modules ; accès possible aux pages sans écart.
- [x] Provenance conservée : couple de nœuds/pages/snapshots, proposition et score au moment de la décision, date, origine `manager_human`, journal d'activité. Aucun nom d'opérateur n'est inventé : le Manager local n'identifie pas l'humain connecté.
- [x] Une identité ne peut désigner deux nœuds d'un même snapshot. Les identités déjà distinctes ne sont jamais fusionnées silencieusement ; les refus restent respectés même par les chaînes de validations.
- [x] Décisions transactionnelles et idempotentes ; erreur de journalisation = annulation complète. Un refus n'attribue aucune identité.
- [x] Les propositions ne constituent plus un appariement validé dans les compteurs. La restriction initiale « décision définitive » est remplacée par le réexamen historisé décrit ci-dessus.
- [x] Typecheck réussi ; tests ciblés finaux : **32 réussis / 0 échoué** (BridgeSnapshotService 23, migrations 9). Suite complète et packaging réservés au checkpoint final.
- [ ] Recette Carlos : valider une proposition vérifiée, refuser une autre, rouvrir la comparaison et vérifier historique/identité, contrôler que le bilan A/B ne change pas. Utiliser le profil de validation.
- [ ] Recette réelle sur une prochaine modification naturelle du site à compléter ; elle ne bloque pas les lots suivants si les contrôles ciblés restent verts.
- Base locale connue : `d05c38fd6e445c7d4adaedc47c0c8266a0df29e6`. Aucun commit, push ou intégration de branches 40/41/42 dans cette passe.
- Prochaine étape : recette de cet écran puis composition multi-composants ; publication production et intégration des branches différées.

## Lot 5 — Familles / Variantes depuis les retours Bridge — 26/09/2026

- [x] Migration 40 : familles de composants et variantes explicites, sans modifier les contrats Bridge V1.
- [x] Un composant source devient la variante de base de sa famille uniquement lors d’une décision humaine de promotion.
- [x] Une occurrence peut rester seule, devenir une nouvelle variante, mettre à jour une variante existante ou être détachée dans une nouvelle famille.
- [x] Une occurrence déjà marquée « Conserver uniquement cette occurrence » peut ensuite être promue ; l’historique des décisions reste journalisé.
- [x] Les changements structurels créent une variante `forked` et imposent une nouvelle validation humaine.
- [x] Les adaptations limitées aux champs configurables d’une source stable et validée peuvent hériter de la validation ; les changements inexpliqués restent « À adapter ».
- [x] Compatibilité avec les retours Bridge 0.7.4 : l’ancien faux positif HTML dû à un espace terminal insignifiant ne bloque pas une promotion sûre.
- [x] Les assets de la version source sont copiés vers la nouvelle version avec compensation des fichiers en cas d’échec transactionnel.
- [x] L’identité Family / Variant gérée par Manager prime lors de l’export du Component Package vers Bridge.
- [x] La Bibliothèque affiche désormais un arbre Famille → Base → Variantes, rend ces éléments recherchables et permet d’ouvrir puis de réexporter un composant promu.
- [x] Les retours Bridge sont revus dans une fenêtre contextuelle avec son propre scroll ; après décision la fenêtre se ferme et la Bibliothèque est rafraîchie.
- [x] L’écran de revue d’un retour active les décisions Famille / Variante et ouvre directement le composant créé ou mis à jour.
- [x] Tests ajoutés pour migration 40, promotion après conservation, variante sûre, variante structurelle forkée, copie d’assets, nouvelle famille, mise à jour de variante et identité exportée.
- [x] Validation MSI : typecheck réussi ; tests ciblés **52/52** (migrations 9, Occurrence Return 10, packages 33) ; recette réelle confirmée avec `Section — Mariage Why`, famille/base/variante et modales de retour.
- [x] Validation humaine de la version réutilisable confirmée : une v4 peut devenir stable et « Prêt à réutiliser » sans écraser l’historique.
- [ ] Finition UX en attente de recette après dernier correctif : actions du bandeau regroupées visuellement et bouton masquer/afficher Bibliothèque aligné sur le bouton masquer/afficher du menu principal.
- Aucun changement automatique de la Bibliothèque à l’import d’un retour ; toute promotion reste une décision humaine.

## Prochain lot — Diff Snapshot A / B — 26/09/2026

- [x] Recette MSI : les 29 écarts et le Workbench #3671 restaient classés modifiés/ajouté sur `d05c38f` ; la distinction technique et l'exclusion décrites dans le document de reprise étaient absentes du code.
- [x] Correctif local : catégorie interne `technical` et compteur dédiés lorsque les versions Bridge diffèrent, que la source brute est présente et identique, sans écart de titre/slug, statut, URL, builder, empreinte brute ou références d'assets. Les écarts d'extraction/dépendances restent visibles ; ce classement ne valide ni le rendu ni les ressources externes.
- [x] Les brouillons de type page portant le préfixe réservé `AWB Workbench — Bibliothèque —` sont exclus du bilan et listés explicitement. Les pages publiées, les titres ordinaires et les transitions vers un contenu non interne restent comparés. Aucun snapshot enregistré n'est modifié.
- [x] Validation locale du correctif : typecheck réussi ; `BridgeSnapshotService.test.ts` **16 réussis / 0 échoué**. Pas de suite complète, packaging, commit ou push.
- [x] Recette Carlos confirmée par capture : 24/09/2026 01:14 → 26/09/2026 13:48, 0 ajouté / 0 supprimé / 0 modifié réel / 29 techniques / 53 sans écart ; Workbench #3671 explicitement ignoré. Les détails affichent « Écart technique » pour les dépendances et les écarts structure/sources.
- [x] Vérification archive-à-archive : les **82/82 contenus communs** conservent le même SHA-256 de source brute WordPress/Divi ; les **169 assets** sont identiques. Les 29 écarts observés proviennent de l’évolution du scanner Bridge 0.4.2 → 0.7.5, pas d’une modification du contenu source.
- [x] Le compteur `ignoredInternal` et la liste explicite des Workbenches ignorés décrivent la même exclusion sans réécrire les snapshots.
- [x] Contrat interne de comparaison en lecture seule ajouté sans modifier Snapshot Schema V1.
- [x] Comparaison de deux snapshots du même site par `source_page_key` : ajouté / supprimé / modifié / inchangé.
- [x] Détection des écarts sur titre/slug, statut, URL, builder, source brute, empreintes, structure/modules, sources, assets et dépendances.
- [x] Comparaison des nœuds sans dépendre de leurs `occurrence_id` ; aucune mutation des snapshots.
- [x] API Electron + preload exposés pour lancer la comparaison depuis la page Sites.
- [x] Fenêtre contextuelle « Comparer deux copies » avec synthèse et détails des pages modifiées.
- [x] Revue des correspondances de modules ajoutée : score, confiance et raisons à partir du type, empreintes, libellé, profondeur, position, classes, IDs et matching hints.
- [x] Les correspondances ambiguës ou concurrentes restent explicitement « faible / à vérifier » et ne sont jamais écrites en base.
- [x] Le diff de structure ignore volontairement `logical_node_id` afin qu’une future annotation Manager ne crée pas elle-même un faux changement de snapshot.
- [x] Tests ajoutés pour comparaison nominale, refus de comparer un snapshot avec lui-même, pages ajoutées/supprimées, avertissements de snapshot partiel et proposition de correspondance non mutante malgré des `occurrence_id` différents.
- [x] Les snapshots partiels / scans incomplets produisent des avertissements explicites afin de ne pas présenter une absence comme une suppression certaine.
- [x] Correctif après recette réelle : les `source_id`, `page_snapshot_id` et `occurrence_id` étant propres à chaque snapshot, le diff compare désormais les fingerprints/contenus stables et non ces IDs volatils.
- [x] `audit_status` n’est plus assimilé à un changement métier du statut WordPress.
- [x] Les sélecteurs Avant / Après sont normalisés chronologiquement, même si la copie actuellement ouverte est la plus ancienne.
- [x] Avertissement prévu lorsque les deux copies proviennent de versions Bridge ou profils de fingerprint différents.
- [x] Test de régression ajouté : deux scans identiques avec IDs techniques différents doivent produire **0 modifié / 1 inchangé**.
- [x] Validation MSI : typecheck + test ciblé `BridgeSnapshotService.test.ts` (8/8 avant correctif, 16/16 après).
- [x] Recette réelle : bilan corrigé validé par Carlos sur les deux snapshots AtoumWeb.fr. Prochaine étape : validation humaine des correspondances de nœuds, sans attribution automatique ni modification des snapshots historiques.
- [x] Attribution des identités logiques uniquement après décision humaine dans le registre Manager (migration 41), sans réécriture des snapshots ; recette de l'écran en attente.

### Finition du round-trip LOT 4

- Bridge 0.7.5 : le diff HTML ignore les espaces finaux non significatifs juste avant la fermeture d’un élément de bloc.
- Le retour réel de `Section — Mariage Why · v4` / Workbench `#3671` a validé le cycle Manager → Bridge → Manager ; les trois couleurs configurées sont revenues comme variables CSS modifiées.
- Le correctif 0.7.5 ne réécrit pas les anciens retours déjà importés ; Manager reconnaît néanmoins ce faux positif historique lors d’une promotion LOT 5.

## Lot 4 — Réception Occurrence Return V1 — 25/09/2026

- [x] Stockage SQL dédié aux retours Bridge sans détourner les snapshots ni les versions de Bibliothèque.
- [x] Inspection ZIP sécurisée : manifest V1, SHA-256 de chaque fichier déclaré, Site Occurrence V1 et cohérence des identifiants.
- [x] Vérification que le composant et la version Bibliothèque source existent réellement dans Manager.
- [x] Import idempotent par empreinte du package et conservation locale du ZIP source.
- [x] API Electron pour lister, ouvrir, inspecter, importer et décider.
- [x] Écran Bibliothèque pour voir les changements, le contenu retourné et la provenance.
- [x] Décision « Conserver uniquement cette occurrence » enregistrée de manière transactionnelle.
- [x] Au périmètre du LOT 4, les choix « nouvelle variante / mise à jour variante / nouvelle famille » étaient visibles mais volontairement désactivés ; ils sont désormais implémentés par le LOT 5.
- [x] Tests ciblés ajoutés pour import nominal, déduplication, checksum invalide, version source inconnue et décision.
- [x] Validation MSI : typecheck réussi ; tests ciblés 12/12 (4 Occurrence Return + 8 migrations), 0 échec.
- Aucun changement des contrats V1, aucune publication production, aucune décision Family / Variant automatique.
- [x] Recette réelle 26/09/2026 : package Manager v4 → Workbench Bridge #3671 → configuration des champs → Occurrence Return V1 → import Manager → décision « occurrence conservée ».

## Lot 3 — Validation humaine des versions réutilisables — 25/09/2026

- [x] Une préparation automatique ne passe plus seule le composant à « Prêt à réutiliser » et ne marque plus la version stable.
- [x] Validation humaine explicite ajoutée avant le couple statut `ready` + version stable.
- [x] La validation humaine est enregistrée par un marqueur interne ; les anciens états auto `ready`/stable ne sont donc pas présentés comme validés humainement.
- [x] Compatibilité historique : les anciens composants Bridge `ready`/stable sans marqueur humain sont présentés comme « À adapter » et leur stabilité est explicitement qualifiée de technique/ancienne, sans réécriture automatique des données.
- [x] Généralisation incomplète et ressources distantes bloquent la validation ; JavaScript et dépendances imposent une confirmation humaine.
- [x] Les badges et messages distinguent désormais « préparé », « à reprendre » et « validé humainement ».
- [x] Le statut « Prêt à réutiliser » n’est plus attribuable par simple édition de métadonnées pour un composant Bridge non validé.
- [x] Tests unitaires ciblés ajoutés pour la décision automatique / humaine.
- [ ] Typecheck et tests locaux à exécuter sur le MSI après synchronisation.
- Aucun changement de migration, de contrat V1, de Famille / Variante ou de retour Bridge.

## Lot 2 — Transport des assets et imports — 25/09/2026

- Base vérifiée avant modification : 4fb795035b32f312ea16496ab13f6a7b8d74e682 ; working tree initialement propre.
- [x] Correspondance des références déclarées avec les fichiers du package par SHA-256 ; récupération ciblée des objets du coffre et déduplication.
- [x] Assets absents, externes ou sans correspondance signalés ; import incomplet refusé avant toute création.
- [x] Préparation des fichiers avant écriture métier ; transaction couvrant version, assets, index et journal ; compensation des seuls fichiers créés lors d'un échec.
- [x] Nouvelle tentative après échec testée pour nouveau composant et nouvelle version.
- [x] Typecheck réussi ; tests ciblés : 46 réussis / 0 échec ; suite complète exécutée une fois : 257 réussis / 0 échec (46 fichiers).
- Aucun changement des contrats V1 ni de migration. Les champs existants hash / checksumSha256 / archivePath assurent la correspondance ; le bilan de transport est calculé, pas ajouté au manifeste.
- Les originaux en base restent inchangés ; une empreinte prouvée peut enrichir seulement le JSON exporté.
- Bridge repo pending. Aucun push ; prochain lot en attente de validation utilisateur.


## Lot 1 — Fiabilisation des contrats V1 — 25/09/2026

- [x] Cibles image explicites src/srcset conservées ; style inline et anciennes images sans attribut cible explicite exportés unresolved.
- [x] Validation des schémas V1 existants aux frontières du package et des occurrences, sans dépendance supplémentaire.
- [x] Identités comparées structurellement ; identifiants Bibliothèque/version cohérents entre composant, identité et provenance.
- [x] Typecheck réussi ; tests ciblés : 53 réussis / 0 échec ; suite complète exécutée une fois : 247 réussis / 0 échec (46 fichiers).
- Aucun changement de migration, de contrat V1, de publication ou de qualification prêt/stable.
- Bridge repo pending.
- Prochaine action : validation utilisateur du lot 1 ; aucun lot 2 engagé.


## État canonique — 24/09/2026

> Cette section prime sur les entrées historiques plus bas. Source de vérité partagée ChatGPT / Codex MSI.

### Socle courant

- Branche de base fonctionnelle : `fix/pre-phase5-commercial-ux` au commit `3494a76`.
- Phase 6 intégrée dans ce socle.
- Phase 5 Administration / Finance : **différée, pas supprimée**.
- Branche active : `feature/project-blueprints-v1`.
- PR active : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**.
- Branche Phase 7 existante en parallèle : `feature/phase-7-analytics-v1` / PR #71 ; ne pas la poursuivre sans la réaligner sur Projet V2.
- Migrations sur Projet V2 / recette visuelle : **36**.
- `main` reste historique et très en retard par rapport au socle de travail ; ne pas l'utiliser comme base de développement courant.

### Projet V2 — réalisé

- [x] devis accepté → projet généré depuis les blueprints Catalogue ;
- [x] snapshot projet indépendant du modèle après création ;
- [x] phases repliées + étapes numérotées ;
- [x] glisser-déposer des étapes ;
- [x] plan / fiche redimensionnables ;
- [x] barre latérale escamotable et masquée automatiquement en Production ;
- [x] timer directement rattaché à une étape ;
- [x] notes et actions libres dans chaque étape ;
- [x] ressources / technique / temps ouverts en fenêtre sans quitter Production ;
- [x] pages renommables directement ;
- [x] validation avant clôture d'une phase et passage groupé de toutes les étapes en Terminé ;
- [x] undo / redo du travail de production ;
- [x] aide contextuelle des champs désactivable dans Réglages ;
- [x] coffre d'accès projet / étape chiffré avec Electron `safeStorage` ;
- [x] couche de cohérence UI transverse pour rapprocher les anciens écrans des pages récemment recettées.
- [x] page Facturation opérationnelle : éléments à facturer, tableau de bord, liste/fiche redimensionnable, import et ouverture du PDF Abby ;
- [x] statut Facturé verrouillé par la présence d’un PDF de facture client ;
- [x] facture PDF classée dans les Documents client / `03 Factures` sans API Abby ;
- [x] création d’un pack d’heures payant raccordée automatiquement aux éléments à facturer.
- [x] page Dépenses opérationnelle : frais internes AtoumWeb, client/projet, catégories, statuts, récurrence et justificatifs ;
- [x] suivi des frais engagés / payés avec dashboard mensuel et montant récurrent mensuel équivalent ;
- [x] justificatifs PDF/images stockés dans le workspace, avec classement client/projet lorsque disponible ;
- [x] migration 33 : table `expenses`.
- [x] thème Noir : contraste CRM/Prospection corrigé avec teintes sémantiques adaptées au sombre ;
- [x] identité visuelle CRM : logo + favicon pour les entreprises, photo/avatar pour les contacts, fallback initiales ;
- [x] identité réutilisée dans Annuaire Prospection, cartes du parcours et Clients ;
- [x] URL CRM normalisées : saisie sans protocole → `https://`, `http://` explicite conservé ;
- [x] migration 34 : table `crm_identity_assets`.
- [x] timer Intervention : démarrage → statut En cours ; arrêt guidé entre résolution et pause ; motif de pause historisé ;
- [x] incident résolu : passage À valider puis panneau Conclusion & rapport de fin avant clôture ;
- [x] migration 35 : motifs de pause sur `time_session_pauses` ;
- [x] Facturation / Dépenses : pictos SVG cohérents, splitter redimensionnable, fiche agrandissable et responsive ;
- [x] Bibliothèque AtoumWeb / Sauvegardes : liste + fiche redimensionnable, plein écran, fermeture explicite, responsive et hiérarchie typographique harmonisée.
- [x] protection renderer globale : une erreur React non interceptée n’aboutit plus à un écran noir muet ; l’erreur exacte est affichée dans AtoumWeb Manager ;
- [x] protection page Clients alignée sur la logique de la fenêtre Référence Prospect pour éviter qu’une fiche défaillante fasse disparaître toute l’interface ;
- [x] Gestion des temps : correction du plantage `ReferenceError: OperationIcon is not defined` introduit lors du remplacement des anciens symboles par les pictos SVG ; correctif confirmé visuellement sur MSI par l’utilisateur ;
- [x] thème Noir : contraste des teintes métier CRM renforcé pendant la recette visuelle continue.
- [x] Annuaire professionnel central : vues Organisations / Contacts, recherche et filtres, liens réels Client / Prospect / Externe, identité visuelle, fiche redimensionnable et agrandissable, sans migration supplémentaire ;
- [x] Statistiques V1 intégrées sur le socle Projet V2 : Vue d’ensemble / Commercial / Projets & temps / Clients, périodes mois / trimestre / année / toutes données, comparaison à la période précédente et indicateurs dérivés des données métier existantes ;
- [x] import Snapshot V1 AtoumWeb Bridge : nouvelle page **Sites**, inspection du ZIP avant import, contrôles SHA-256 / package fingerprint / références / arbres / compteurs, stockage historique Site → Snapshot → Page → Node, Sources / Assets / Dependencies, payloads en lecture seule et conservation des warnings du scan ;
- [x] migration 36 : stockage central des sites, snapshots, pages, nœuds, sources, assets, dépendances, relations et objets adressés par hash issus d’AtoumWeb Bridge ;
- [x] lecteur ZIP durci pour l’import Bridge : chemins dangereux, entrées chiffrées, types Unix spéciaux, doublons, CRC, tailles et ratios de compression suspects refusés ;
- [ ] diff Snapshot A / B et attribution des `logical_node_id` Manager à valider après réception d’un second snapshot réel.
- [ ] analytique avancée Phase 7 encore à réaligner : encaissements/paiements, rentabilité complète par prestation, exports statistiques et pilotage avancé.

### Validation

- [x] dernier checkpoint MSI confirmé par l’utilisateur avant ce lot : **40 fichiers / 187 tests réussis**, SQLite à **34 migrations**.
- [ ] revalider le HEAD actuel après le dernier lot : aide / actions / coffre sécurisé / Catalogue Offres & Tarifs / ateliers Interventions & Packs / Gestion des temps / Facturation PDF Abby / Dépenses / identité CRM / timer Intervention / Bibliothèque / Sauvegardes / Documents & Contrats / Annuaire / Statistiques / migrations 31–36 / import Bridge / cohérence UI globale. La recette visuelle a déjà confirmé le correctif du plantage Gestion des temps après import manquant de `OperationIcon`.
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Validation-MSI : Projet + anciens écrans principaux + trois thèmes.

### Prochaine action

Sur MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Voir aussi : `docs/HANDOFF_CODEX_MSI.md`.


## Lot UX commercial avant Phase 5 — 19/09/2026

Branche `fix/pre-phase5-commercial-ux`, créée depuis `fix/prospect-recipe-ux-v2` à `3bc0f19`. Phase 5 en pause ; Phase 6 non intégrée. Aucune migration modifiée.

- [x] Fiches Prospect et Client : mode compact et vue agrandie avec défilement interne et hauteur disponible corrigée.
- [x] Couleurs métier des fiches, cartes et champs blancs ; température retirée du texte des cartes Prospect sans changer la donnée.
- [x] Qualification Prospect : accès direct aux champs manquants ; raccourcis vers besoin et relance.
- [x] Fiche Client : coordonnées prioritaires, éléments liés réellement présents, échéances conditionnelles et accès secondaires repliés.
- [x] Relation Client : cinq états distincts de la température Prospect, changement rapide, couleur de la fiche et des lignes, historique de transition.
- [x] `npm run typecheck` et `npm test` : 30 fichiers / 135 tests réussis.
- [ ] Recette visuelle Windows finale sur le profil de validation, plusieurs résolutions et trois thèmes.

Prochaine action : terminer la recette visuelle du lot avant toute validation finale ou fusion. Aucune migration ajoutée.

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche Git historique** : `main` (non utilisée comme base courante tant que le socle n'est pas consolidé)
- **Socle fonctionnel courant** : `fix/pre-phase5-commercial-ux`
- **Chantier actif** : `feature/project-blueprints-v1` — PR #73
- **Statistiques V1 initiales intégrées dans le chantier actif** ; la branche historique `feature/phase-7-analytics-v1` / PR #71 reste à réaligner uniquement pour l’analytique avancée non encore reprise
- **Migrations courantes sur Projet V2 / recette visuelle** : 35
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

### Stabilisation transverse — 15/09/2026

- [x] migration SQLite 19 : pipeline enrichi, température neutre, qualification, coordonnées multiples, actions structurées et documents client
- [x] ancien libellé « Dossier partagé » retiré de l’interface ; l’identité, les besoins, les devis et les projets restent des données liées
- [x] parcours devis « en préparation → à envoyer → envoyé » sans modifier le statut technique `draft` avant envoi
- [x] fichiers client stockés hors SQLite sous `clients/<client-id>/Documents`, métadonnées en base
- [x] correction du paquet Windows vide : renderer désormais inclus dans `app.asar`
- [x] validations automatisées : 28 fichiers, 118 tests, TypeScript et packaging
- [ ] recette fonctionnelle et visuelle Windows du scénario Boulangerie Martin

### Prospect Workflow V2 — 15/09/2026

Branche : `feature/prospect-workflow-v2`  
Base fonctionnelle : `fix/recette-commerciale-coherence` au commit `b30d2a89e0515f4193e4958097be838fbd0eba44`.  
Aucune fusion dans `main`.

- [x] migration 20 : origine commerciale, démarrage de prospection, qualification V2 et référence `decision_maker_contact_id`
- [x] parcours clarifié : `Nouveau contact → À qualifier → Besoin à identifier → Devis à préparer`
- [x] bouton explicite `Démarrer la prospection` et ouverture de la fiche de travail bureau
- [x] qualification conditionnelle selon l’origine du contact ; le besoin détaillé n’est plus demandé à cette étape
- [x] `Projet & solution AtoumWeb` raccordé au catalogue existant avec ajout de prestation en une seule action
- [x] contrôle avant devis intégré à l’étape `Besoin à identifier` ; ancien placeholder séparé supprimé
- [x] validation téléphone/email centralisée via `contactValidation`
- [x] décisionnaire rattaché à un vrai `contacts.id` ; coordonnées via `contact_methods`, anciennes colonnes conservées seulement pour compatibilité de migration
- [x] `Compact / Confort / Confort +` disponible dans les Réglages
- [x] température commerciale visible sur la carte, le panneau rapide et la fiche bureau
- [x] rappels rapides `demain / +7 jours / date précise` raccordés à `crm_actions`
- [x] suivi devis recentré sur `Devis à préparer → Devis à envoyer → En attente de retour`
- [x] après envoi : devis, montant, validité, délai restant et prochaine relance mis en évidence dans la fiche et la vignette pipeline
- [x] issues distinctes après envoi : `Accepté / signé`, `À modifier / Négociation`, `Refusé`; refus du devis distinct du statut Prospect `Perdu`
- [x] alerte de validité du devis dans les 7 derniers jours
- [x] ancien composant de qualification V1 supprimé
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] recette visuelle Windows sur le workspace de test propre

La CI de cette branche a été branchée sur le workflow GitHub. Les runners disponibles dans l’environnement GitHub actuel n’exécutent cependant aucune étape (`runner_id` nul/0), y compris avec `windows-latest`; un statut rouge sans étape n’est donc pas un résultat de compilation ou de test. La validation TypeScript/tests doit être exécutée localement tant qu’un runner utilisable n’est pas disponible.

Périmètre volontairement différé : refonte profonde de l’éditeur de devis et système d’import des packs d’offres `.atoum`. Les offres/contrats seront d’abord préparés comme configuration métier, puis le Manager évoluera selon le contrat technique commun validé.

### Correctifs de recette UX Prospect — 16/09/2026

Branche : `fix/prospect-recipe-ux-v2`  
PR : #67, conservée en brouillon.  
Base : `feature/prospect-workflow-v2` au commit validé `8284e1fc64c53bb4e5976a58c1fdb52715c5c671`.  
Aucune fusion dans `feature/prospect-workflow-v2` ni dans `main` avant validation technique et recette visuelle.

- [x] taille de texte fonctionnelle minimale portée à 14 px, y compris en densité Compact
- [x] fiche de travail Prospect élargie et agrandie sans plein écran forcé ; densité verticale réduite
- [x] teinte commerciale conservée sur la fiche avec champs neutres et contours liés à la température
- [x] interlocuteur principal ajoutable ou modifiable après création du prospect
- [x] décisionnaire sélectionnable parmi les Contacts liés, créable comme nouveau Contact ou conservé inconnu
- [x] autres Contacts d’entreprise avec fonction libre (`Gérant`, `Patron`, `Banquier`, `Comptable`…) sans détourner le libellé d’une coordonnée
- [x] bloc Coordonnées pleine largeur : propriétaire distinct de l’usage, plusieurs téléphones/emails par Contact
- [x] Actions / Relances enrichies avec cible Contact, motif, date, heure, contexte et récurrence avancée
- [x] compte rendu d’action en pleine largeur avec suites proposées selon le résultat
- [x] refus catégorique : classement Prospect `Perdu` sans recréation automatique d’une récurrence
- [x] informations nécessaires au devis transformées en checklist conservant les réponses et les points à obtenir plus tard
- [x] historique du dossier replié par défaut avec aperçu des 10 événements les plus récents
- [x] suivi devis du panneau latéral rendu lisible en disposition verticale
- [x] migration 21 limitée au contexte structuré des actions (`target_contact_id`, `reason_code`, `reason_text`)
- [x] tests ajoutés pour le contexte des actions, l’arrêt explicite d’une récurrence et les Contacts liés du workflow
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Windows de la fiche Prospect corrigée

Le workflow CI de la PR #67 est actuellement créé mais reste en file d’attente sur le runner Windows ; aucun résultat de compilation ou de test ne doit être déduit tant qu’aucune étape n’a réellement démarré.

## Phase 0 — Fondation

Validations réelles effectuées sous Windows le 13/09/2026 :

- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] démarrage réel Electron
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] workspace local
- [x] sauvegarde manuelle SQLite
- [x] restauration SQLite
- [x] sauvegarde automatique `pre-restore` avant restauration
- [x] correction du redémarrage de restauration en mode développement
- [x] `package-lock.json` versionné
- [ ] fusion finale de la fondation dans `main`

Workspace Windows validé :

- `C:\Users\carlo\Documents\AtoumWeb Manager`
- base : `data\atoumweb-manager.sqlite`
- sauvegardes : `backups\automatic`, `manual`, `pre-migration`, `pre-restore`

## Phase 1 — CRM

Branche : `feature/phase-1-crm`  
PR : #58 (brouillon)

### Fonctionnel

- [x] Organisations / Contacts maîtres
- [x] Prospects et pipeline
- [x] Clients
- [x] contacts multiples + rôles
- [x] conversion Prospect → Client transactionnelle et idempotente
- [x] archivage/réactivation
- [x] recherche globale CRM
- [x] journal d’activité
- [x] Actions / Relances multiples
- [x] prochaine échéance dérivée des actions ouvertes
- [x] Relance → étape `À relancer`
- [x] vue Prospects Pipeline / Historique
- [x] panneaux Prospect/Client à droite avec retour pleine largeur quand fermés
- [ ] deep-links précis Client/Prospect depuis tous les résultats de recherche
- [ ] enrichissement Client avec Projets/Facturation/Temps au fil des phases suivantes

### Validation réelle Windows

- [x] SQLite à 4 migrations
- [x] `npm run typecheck`
- [x] `npm test` — **5 fichiers / 17 tests réussis**
- [x] pipeline / drag-and-drop / piles de cartes
- [x] comportement panneaux latéraux validé visuellement
- [ ] dernier test visuel Actions / Relances multiples + Historique dédié

## Phase 2 — Commercial

Branche : `feature/phase-2-commercial`  
PR : #59 (brouillon)

### Développé

- [x] migration 5 — Catalogue Services / Offres
- [x] migration 6 — Devis
- [x] Services et Offres versionnés
- [x] composition d’une Offre à partir de versions de Services
- [x] inclus / optionnels / quantités
- [x] prix, prix conseillé, modes tarifaires, prérequis, inclusions/exclusions
- [x] version publiée immuable
- [x] création de nouvelle version sans modifier l’historique
- [x] numérotation `DEV-YYYY-001`
- [x] lignes Catalogue et lignes libres
- [x] snapshots autonomes du catalogue et des compositions d’Offres
- [x] remises % / montant / prix imposé / gratuité
- [x] valeur catalogue distincte de la valeur contractuelle
- [x] acompte / solde
- [x] statuts Devis
- [x] acceptation Prospect → Client
- [x] prévisualisation client sans données internes
- [x] génération PDF sous `exports\devis`
- [x] recherche globale Offres / Services / Devis

### Validation restante

- [ ] migration réelle 4 → 6 sous Windows avec sauvegarde `pre-migration`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] parcours visuel complet Catalogue / Devis / PDF
- [ ] trois thèmes

## Phase 3 — Projets & Production

Branche : `feature/phase-3-projects`  
PR : #60 (brouillon, empilée au-dessus de Phase 2)

### Migration 7 — Projets

- [x] modèles de projets
- [x] versions de modèles
- [x] arbre modèle Lot → Module/Page → Tâche → Checklist
- [x] versions publiées figées
- [x] `projects`, `project_nodes`, `project_services`, `project_prerequisites`
- [x] lien unique Devis ↔ Projet
- [x] numérotation `PRO-YYYY-001`
- [x] transformation Devis accepté → Projet idempotente
- [x] copie du snapshot commercial dans le projet
- [x] prérequis issus du devis/catalogue
- [x] projet interne AtoumWeb sans client externe
- [x] progression calculée depuis les tâches obligatoires
- [x] prévention des boucles parent/enfant
- [x] déplacement/réordonnancement transactionnel des nœuds Projet
- [x] arborescence physique Ressources créée automatiquement
- [x] checklist d’avertissement non bloquante avant passage `Terminé`

### Interface Projets

- [x] liste + filtres
- [x] fiche latérale Projet
- [x] création depuis devis accepté
- [x] création Projet interne
- [x] gestion des Modèles de projets
- [x] publication / nouvelle version de modèle
- [x] Résumé
- [x] Plan / Tâches
- [x] déplacement de parent + ordre ↑/↓ dans le plan
- [x] Prérequis
- [x] Ressources
- [x] Bibliothèque technique projet
- [x] Temps
- [x] Commercial
- [x] recherche globale Projet / tâches / Ressources / Bibliothèque
- [x] Dashboard alimenté par les projets actifs

### Migration 8 — Ressources projet

- [x] `file_assets`
- [x] `file_asset_links`
- [x] fichiers physiques conservés hors SQLite
- [x] dossiers `01 Identité` à `07 Archives`
- [x] import de fichiers dans le workspace
- [x] checksum SHA-256
- [x] prévention des doublons par checksum dans un projet
- [x] statut Reçu / À traiter / En cours / Validé / Obsolète
- [x] rôle Client / Réécriture AtoumWeb / Final / Autre
- [x] même fichier lié à plusieurs tâches sans duplication physique
- [x] détection fichier manquant
- [x] relocalisation/restauration d’une ressource
- [x] ouverture fichier / dossier depuis Electron
- [x] interface Ressources raccordée à la fiche Projet
- [x] indexation dans la recherche globale
- [x] tests Ressources écrits
- [ ] galerie miniature images/médias

### Migration 9 — Bibliothèque technique projet

- [x] `technical_items`
- [x] `technical_item_versions`
- [x] `technical_item_assets`
- [x] catégories Header / Footer / Hero / Page / Section / CSS / JS / PHP / ACF / Divi / Woo / Plugin / Config / Note
- [x] contenu Code / JSON / Texte / Référence
- [x] version actuelle
- [x] version stable distincte de la version actuelle
- [x] historique immuable
- [x] liaison aux vraies Ressources du projet
- [x] archivage
- [x] aucun code exécuté automatiquement
- [x] interface Bibliothèque dans la fiche Projet
- [x] `Préparer pour réutilisation` génère un paquet projet sans généralisation automatique
- [x] recherche globale des éléments techniques
- [x] tests versioning / stable / ressources / réutilisation écrits
- [x] schéma déjà extensible à `scope=atoumweb` pour la future Phase 6 sans modifier les projets clients
- [ ] coloration syntaxique avancée / Monaco plus tard
- [ ] captures/aperçus avancés plus tard

### Migration 10 — Timer & sessions de temps

- [x] `time_sessions`
- [x] `time_session_pauses`
- [x] une seule session active globalement garantie par SQLite
- [x] contexte Client / Projet / Tâche
- [x] catégories de temps
- [x] facturable / non facturable
- [x] source Timer / Manuel / Import
- [x] démarrer / pause / reprendre / arrêter
- [x] durée réelle calculée depuis timestamps et pauses
- [x] session active conservée après navigation et fermeture de l’application
- [x] heartbeat du chrono pour mémoriser le dernier point connu
- [x] détection d’une session oubliée après fermeture/redémarrage
- [x] reprise sans compter l’interruption
- [x] arrêt au dernier point connu
- [x] saisie manuelle
- [x] correction d’une session historique terminée
- [x] protection des pauses existantes pendant une correction
- [x] changement d’activité transactionnel : terminer l’ancienne + démarrer la nouvelle au même instant
- [x] synthèse temps total / facturable / non facturable
- [x] filtres Aujourd’hui / Semaine / Mois / Client / Projet / Catégorie / Facturable
- [x] vrai timer global dans le header
- [x] page `Gestion des temps`
- [x] onglet Temps dans la fiche Projet
- [x] temps estimé vs réel + écart dans Projet
- [x] raccourcis Projet/Tâche → timer global prérempli
- [x] Dashboard : temps du mois dérivé des sessions
- [x] tests Timer/pause/reprise/redémarrage/correction/changement d’activité écrits
- [x] doublon d’enregistrement IPC Timer supprimé

### Reste Phase 3 avant validation finale

- [ ] réorganisation/duplication plus complète des nœuds dans les **modèles** de projets
- [ ] galerie miniature images/médias
- [ ] ergonomie avancée Bibliothèque (copie/agrandissement/coloration)
- [ ] validation du cas de référence Cazor
- [ ] validation locale Windows migrations 6 → 10
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] test visuel complet trois thèmes
- [ ] mise à jour finale documentation Phase 3 après validation

## CI GitHub

Le workflow couvre maintenant les branches Fondation / Phase 1 / Phase 2 / Phase 3.

Les runs Phase 3 observés restent **non exploitables** : GitHub crée le job `windows-latest` mais lui attribue `runner_id: 0` et n’exécute aucune étape. Il n’y a donc ni checkout, ni installation, ni typecheck, ni tests. Le statut rouge ne constitue pas un échec du code.

La validation réelle continue donc d’être effectuée localement sur Windows.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Règles à ne pas casser

1. Prospect et Client partagent les mêmes Organisations/Contacts ; aucune recopie d’identité.
2. Archivage plutôt que suppression destructive.
3. Conversion Prospect → Client idempotente.
4. Valeur commerciale, valeur contractuelle, facturé, encaissé et dépenses restent distincts.
5. Fichiers lourds hors SQLite ; la base stocke les références et métadonnées.
6. Abby reste la source des factures réglementaires en V1.
7. Bibliothèque projet et Bibliothèque AtoumWeb restent indépendantes.
8. Aucun code de bibliothèque n’est exécuté automatiquement.
9. Une sauvegarde serveur n’est jamais considérée comme une sauvegarde locale.
10. Statistiques et recherche sont dérivées/reconstruisibles.
11. Tous les éléments historiques importants sont journalisés.
12. Une Relance et une Action sont deux objets distincts ; plusieurs peuvent coexister sur un même dossier.
13. Les panneaux latéraux Prospect/Client/Projet restent à droite et les listes reprennent la largeur disponible lorsqu’ils sont fermés.
14. Le temps réel a une seule source : `time_sessions`. Aucun module ne maintient un compteur indépendant.
15. Une version de modèle, de catalogue ou de composant déjà utilisée ne modifie jamais rétroactivement un dossier existant.

## Travail en cours

**Phase 3 — fermeture des derniers écarts fonctionnels avant validation Windows.**

Prochaine validation Windows après stabilisation de la branche : migration vers 10 migrations, `npm run typecheck`, `npm test`, puis parcours Projet / Ressources / Bibliothèque / Timer / Gestion des temps.

## Phase 4 — Validation automatisée du 14/09/2026

Cette entrée actualise le travail en cours décrit plus haut : Phase 4 en gel fonctionnel, validation visuelle Windows restante.
Branche : feature/phase-4-operations — PR #61 conservée en brouillon.
Point de départ distant vérifié : 6d09156.

- [x] Node local 20.19.3 / npm 10.8.2 vérifiés.
- [x] npm run typecheck : aucune erreur.
- [x] npm test : **26 fichiers / 102 tests réussis**, aucun échec ni test désactivé.
- [x] Tests exécutés par le script du dépôt sous Electron 44.3.0 / Node embarqué 24.20.0.
- [x] Correction du tri SQLite des alertes : alias explicite created_at dans le UNION ALL.
- [x] Temps Intervention calculé par TimeService : suppression de la troncature SQL imprécise, mêmes pauses et même arrêt au dernier point connu que le Timer.
- [x] Tests de non-régression des pauses avec millisecondes et de la récupération d'une session oubliée.
- [x] Migrations 1 à 17 : base vierge, ordre, application unique, mises à niveau depuis 4 / 6 / 10, préservation des données sentinelles et d'une session Phase 3, index composite, intégrité SQLite.
- [x] Revue du périmètre : services Opérations, tests et suivi documentaire uniquement ; aucune migration modifiée ou renumérotée.
- [ ] Validation visuelle Windows et migration sur données existantes avec sauvegarde pré-migration.
- [ ] Parcours Intervention / Demande → Intervention / modification et retrait du rattachement / Timer au contexte sauvegardé / persistance après redémarrage.
- [ ] Régressions Opérations / Maintenance / Packs / Incidents / recherche / fiches Client et Projet / trois thèmes.

Aucune donnée du dossier utilisateur Documents\AtoumWeb Manager touchée. Les tests utilisent uniquement des bases en mémoire et des espaces temporaires de test.
Le nouveau test d'index a été corrigé après constat : l'index existant comprend intervention_id puis started_at DESC ; l'assertion contrôle ces deux colonnes et leur ordre.
Gel fonctionnel Phase 4 maintenu. Phase 5 différée, aucun apport de la branche Phase 6, aucune fusion.
Point d'attention manuel : vérifier aussi la fluidité des listes d'interventions avec un historique de temps volumineux, le total utilisant désormais le service de temps commun.

Prochaine action : lancement normal du Manager et parcours du plan docs/PHASE_4_VALIDATION_WINDOWS.md avec les données existantes et sauvegarde pré-migration. Conserver la PR #61 en brouillon ; aucune fusion avant validation Phase 4.


## Stabilisation transverse — issue #65

Branche feature/stabilisation-parcours-metier créée depuis 4f1323a (Phases 1 à 4 validées). Périmètre étendu explicitement par la demande utilisateur : catalogue AtoumWeb, besoins CRM référencés, continuité devis/projet/dashboard, données demo et responsive. Phase 6 non intégrée, Phase 5 non démarrée, aucune fusion.

- [x] Socle propre vérifié : 26 fichiers / 102 tests, typecheck vert.
- [x] Migration 18 ajoutée sans renuméroter 1 à 17 : catalogue AtoumWeb, conditions commerciales, besoins CRM et marquage des lots demo.
- [x] Parcours raccordé : fiche Prospect/Client, devis et conditions, acceptation vers Projet, dashboard et liens profonds.
- [x] Saisies de démonstration identifiables, trois parcours cohérents, sauvegarde obligatoire et purge transactionnelle sélective.
- [x] Responsive, défilement des panneaux et taille des textes harmonisés.
- [x] `npm run typecheck` : aucune erreur.
- [x] `npm test` : **27 fichiers / 113 tests réussis**, aucun échec ni test désactivé.
- [x] `npm run package` : package Electron Windows x64 généré avec succès pendant la stabilisation.
- [ ] Validation visuelle Windows sur un workspace temporaire, puis parcours métier sur données utilisateur uniquement après sauvegarde explicite.

Les tests couvrent les migrations vierges et mises à niveau, les prix confirmés / Sur devis, les besoins multiples, la conversion idempotente, les données vivantes, les snapshots, les lignes de devis atomiques, la création Projet, le dashboard et la purge demo sans suppression des références ni des dossiers réels.

Prochaine action : validation visuelle du parcours complet et des trois thèmes sous Windows. Aucune ouverture du workspace utilisateur sans sauvegarde explicite.

Clôture Lot 3 — 03/10/2026 : bilan réel validé par AtoumWeb ; commit local dédié autorisé, sans push ni merge. La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Cette clôture ne contient aucune modification du Lot 4.






## UX/UI V2 — Lot 04D/04E — démarrage du 14/10/2026

- Branche isolée `feature/ux-v2-lot04d-04e-catalogue-v1` depuis 04C `2412513b` ; aucune fusion vers `main`.
- **04D (en cours)** : règles pures de déduplication des recommandations et exclusion des versions non publiées, cibles archivées et composants déjà inclus ; test Vitest ajouté. Persistances N:N, IPC et écran restant à réaliser.
- **04E (en cours)** : projection de l'aide à la vente par version, sans texte inventé ni injection dans les clauses contractuelles ; test Vitest ajouté. Persistance structurée, interface et UX-01 restant à réaliser.
- Documentation : `docs/ux-v2/LOT-04D-04E-DEMARRAGE-2026-10-14.md`.
- **Validation : aucun test exécuté sur la nouvelle branche à la date de cette entrée ; résultats CI à attendre.** Les 1 092 tests réussis de la CI #1003 concernent exclusivement l'ancien HEAD 04C.
- Ordre d'intégration à maintenir : `main` ← 04B ← 04C ← 04D/04E après validation de chaque convergence. Aucune fusion autorisée automatiquement.

- **Complément 04E** : projection `salesGuidanceFromCatalogVersion` branchée sur les champs commerciaux déjà versionnés (`commercialParameters.clientNeed`, `benefits`, `internalAdvice`) ; test additionnel écrit. Aucun contrat modifié. Les objections structurées restent une extension non persistée ; UI/IPC non livrés. Les tests de ce nouvel HEAD restent à exécuter.


### 04D — Persistance SQLite des recommandations (14/10/2026)

- Migration additive **68** `catalog_version_recommendations_v1` créée sur la branche 04D/04E : liens source/target entre versions Catalogue, contraintes FK, unicité, index ; aucun devis historique modifié.
- `CatalogRecommendationsService` : lecture et remplacement transactionnel sous `BEGIN IMMEDIATE`, source obligatoirement brouillon, cible publiée et active, rejet des autoréférences, doublons de prestation et services déjà inclus ; rollback complet en erreur.
- `CatalogRecommendationsService.test.ts` : quatre scénarios ajoutés (persistance/FK, rollback, statut et doublons, non-duplication avec la composition de l'offre). **Tests écrits, pas encore certifiés par CI.**
- **Réserves** : API IPC/preload, UI UX-01, conservation/copie des recommandations lors de la création vN+1, tests Electron Windows, vérification de collision éventuelle de l'identifiant de migration 68 avec les branches parallèles, convergence `main` ; aucune intégration dans `main`.

- **Incrément 04D suivant** : `CatalogService.createVersion` recopie désormais les recommandations de la version précédente vers la nouvelle version brouillon (nouveaux UUID, mêmes cibles publiées), sans modifier les liens de la version historique ; un test SQLite dédié a été ajouté dans `CatalogRecommendationsService.test.ts`. Aucun test de cet incrément n'est déclaré réussi avant CI. Restent IPC, preload, interface et garde UX-01, ainsi que contrôle des migrations concurrentes.

- **04D — raccordement Electron** : `DatabaseService` expose `catalogRecommendations`; commandes IPC `catalog:list-recommendations` et `catalog:replace-recommendations` ajoutées, exposées par preload et contrat `CatalogApi` typé. Le service conserve les restrictions transactionnelles (uniquement sources draft, cibles publiées actives, sans doublons). **Non vérifié par typecheck/CI sur ce nouveau HEAD.** Restent une interface éditeur avec garde UX-01, test Electron du circuit réel et revue de migration 68 face aux autres branches. Les changements sont sur PR #118, sans fusion.

- **04D — incrément interface** : `CatalogRecommendationsPanel.tsx` ajouté dans l'onglet Associations ; lecture des versions liées, choix parmi les prestations actives publiées, retrait, enregistrement volontaire, distinction claire des devis/CGV et affichage des erreurs. Les sélections non sauvegardées sont enregistrées dans la garde UX-01 avec confirmation avant de quitter l'onglet. `CatalogPage.tsx` raccordé. **Réserve** : tests TypeScript, Vitest et Electron pas encore exécutés sur ce HEAD ; vérifier aussi la sélection concurrente, les réponses réseau tardives, la fermeture et l'état publié. Pas de fusion.

- **04D — contrôle des écritures concurrentes et CI (14/10/2026)** : le workflow `ci.yml` accepte désormais les PR empilées sur la branche 04C. `CatalogRecommendationsService.replace` compare, dans la transaction, les cibles enregistrées avec le snapshot attendu de l'interface (CAS) avant de remplacer les lignes ; IPC, preload, `CatalogApi` et panneau transmettent cet état attendu. Un test de refus de sauvegarde périmée a été ajouté. **Aucun résultat de test n'est présumé sur ce HEAD** : attendre CI Windows, typecheck, Vitest et recette Electron dédiée. En cas de conflit, la saisie locale reste visible pour résolution humaine. Aucune fusion.

- **CI #1089 analysée** : TypeScript réussi ; 1 102/1 104 Vitest réussis, dont les 6 tests `CatalogRecommendationsService` et les 4 tests `catalogSalesGuidance`. Deux échecs dus à des plafonds de migrations figés (`67`, `[66,67]`) dans `migrations.test.ts` et `ContractTypeService.test.ts`. Assertions actualisées pour le registre 68 (dont liste dynamique des migrations après 65). **Rerun sur nouveau HEAD requis** ; ne pas marquer ces deux tests comme PASS avant CI.

- **04D — garde des réponses tardives** : le panneau compare désormais l'identité de version au retour d'une sauvegarde IPC ; les réponses/erreurs d'une ancienne version n'écrasent pas l'état de la fiche suivante. Réinitialisation de `saving` au changement de version. **Protection implémentée, pas encore certifiée par recette Electron**. La CI #1095 concernait un HEAD documentaire précédent et ne suffit pas à valider le dernier code.

- **04E — objections commerciales versionnées** : ajout du champ `commercialParameters.objections` dans les types, l'éditeur de l'onglet Aide à la vente, le récapitulatif et `salesGuidanceFromCatalogVersion` ; test de projection actualisé. Les données passent par le JSON commercial versionné existant, sans migration supplémentaire et sans insertion automatique dans les CGV. **Validation CI du dernier HEAD en attente**. 04D : CI #1089 = 1102/1104, deux assertions de migration corrigées ; résultats CI suivants à confirmer.

- **04E — recette SQLite complémentaire** : ajout de `CatalogSalesGuidance04E.test.ts` avec deux scénarios : historique des objections entre version publiée et nouveau brouillon, et refus CAS d'une sauvegarde obsolète sans effacer la nouvelle objection. Tests écrits sur PR #118, CI du HEAD à vérifier. La CI #1110 concernant le commit `5b0d7898` était encore en cours au début de cet incrément. Aucun merge.

- **04F — contrôle CI élargi pour PR #118** : étapes Windows TEMP `Electron Catalogue 04D-04E` (`check-catalog-identity-ui.cjs`) et `UX-01 Catalogue 04D-04E` (`check-unsaved-inputs-ui.cjs --lot-b --lot-c --review`) ajoutées au workflow. Ces recettes sont transversales et **ne constituent pas encore une recette 04D complète d'interaction sur les recommandations** : prévoir un script dédié (sélection, retrait, CAS, changement de fiche, réponses IPC retardées). Résultats du nouveau workflow à vérifier sur son HEAD.

- **04D — cohérence bidirectionnelle des associations (14/10/2026)** : `setOfferComponents` refuse désormais d'inclure une prestation déjà recommandée par la même version d'Offre ; cela complète le contrôle inverse déjà présent dans `CatalogRecommendationsService.replace`. Test SQLite ajouté : collision refusée, composition et recommandation existantes intactes. **Tests sur le dernier HEAD encore à valider en CI**, sans intégration `main`.

- **04D — tests historiques supplémentaires** : scénarios SQLite ajoutés pour une cible devenue inactive (lecture historique conservée, refus de réenregistrer la cible inactive) et pour le retrait explicite d'une recommandation (version cible préservée, FK intactes). Tests à certifier sur le nouveau HEAD. Au contrôle intermédiaire, CI #1116 et #1125 étaient encore en cours : résultats définitifs non présumés.

- **04D — sauvegarde idempotente (14/10/2026)** : `CatalogRecommendationsService.replace` conserve les UUID d'associations lorsqu'une demande identique est rejouée, après vérification CAS et validation métier des cibles (y compris inactives). Nouveau test de rejeu identique et d'intégrité FK ajouté. Tests du dernier HEAD en attente de CI, `main` inchangé.

- **Validation confirmée** : CI #1125, #1132, #1140 vertes sur leurs SHA respectifs (04D cohérence, historique et idempotence). **04E** : test SQLite complémentaire ajouté pour héritage de `commercialParameters.objections` dans vN+1 lorsque non redéfini, avec conservation de la version précédente et FK. Ce nouveau HEAD n'est pas encore certifié ; recette Electron spécifiquement interactive du panneau Recommandations toujours à établir avant clôture fonctionnelle.

- **04D — recette Electron dédiée (14/10/2026)** : `scripts/check-catalog-recommendations-ui.cjs` ajouté à la CI de la PR #118 (`Windows TEMP`, navigateur Electron réel + panneau React réel, IPC simulé en fixture isolée). Vérifie sélection, garde UX-01 Rester/Quitter, sauvegarde, erreur et conservation du brouillon, réponse retardée, double-clic, non-contamination au changement de fiche et erreurs renderer. Le script n'utilise aucune donnée utilisateur. **Résultat du run CI #1168 non encore confirmé** ; les contrôles de SQLite réel restent couverts séparément par Vitest. 
- **CI #1147 — échec TypeScript corrigé** : le test 04E utilisait `CatalogService.getVersion` (méthode privée) ; remplacé par `getItem(...).versions.find(...)` (API publique). Correction publiée, à certifier via CI sur dernier HEAD. 

- **04D — recette et lisibilité de l'historique (14/10/2026)** : le premier passage du nouveau script Electron dans la CI #1168 a échoué sur un sélecteur de test (bouton rebaptisé `Enregistrement…` pendant l'écriture), et non sur un invariant métier ; scénario corrigé et relancé. La logique du panneau protège désormais les sauvegardes tardives avec une époque de chargement et empêche les doubles clics avant même la mise à jour React. Le service `list` joint maintenant la version cible et la prestation pour afficher **nom, numéro de version, statut actif/inactif/archivé**, y compris lorsque la version cible n'est plus la version courante. Test historique SQLite étendu. **Dernier HEAD à valider via CI** ; aucun merge.

- **04D — validation ciblée et traçabilité (14/10/2026)** : CI #1171 **verte** (étape Electron Recommandations 04D, contrôles Catalogue et UX-01, TypeScript, Vitest). Le script 04D vérifie la navigation avec confirmation, les sauvegardes, les erreurs IPC, le refus pendant écriture, le double-clic, et l'absence de contamination après changement de version. Le service et le contrat IPC renvoient désormais aussi `targetName`, `targetVersionNumber`, `targetItemStatus` pour rendre lisibles les recommandations historiques (y compris lorsque la cible est inactive). Test SQLite correspondant renforcé. L'onglet Associations est explicitement admissible sur Service et Offre. La fixture Electron générale expose désormais les méthodes simulées pour ce panneau. **Les commits ultérieurs doivent repasser la CI ; ne pas confondre 04D UI en IPC simulé avec une recette intégrée Electron+SQLite réelle.** Pas de fusion vers `main`.

- **04F / 04E — suite autonome (14/10/2026)** : CI #1192, #1207 et #1213 vertes sur leurs commits ; #1207 valide la recette native Electron + IPC + vraie SQLite TEMP ; #1213 inclut la recette UX-01 restauration/fermeture. Audit 04E : l'objection était enregistrable dans les modèles mais le formulaire ne la proposait pas réellement — corrigé, avec nouveaux champs humains versionnés `salesPitch` et `qualificationQuestions` (aucune injection dans les CGV). Projection et tests SQLite augmentés. **La CI du HEAD post-04E doit encore être contrôlée ; aucune CI ancienne ne vaut preuve pour ce dernier code.** PR #118 toujours draft, dépend de #108 puis #104 ; aucun merge dans `main`.

- **04D/04E/04F — preuves consolidées (14/10/2026)** : CI #1229 et #1230 vertes (formulaire commercial et pilote natif avec **vrai preload de production**), CI #1236 verte (saisie Electron 04E : pitch, questions de qualification et objections). `check-catalog-recommendations-native.cjs` utilise vraie SQLite TEMP et vrai preload, vérifie l'IPC et le CAS. Nouveau test Vitest de **backup/restore SQLite + migration 68 + FK** publié et en attente de conclusion CI #1245 au point de contrôle. Workflow #1252 enrichi de neuf captures de thèmes/densités vérifiées par SHA, sans upload d'artefacts. `docs/ux-v2/LOT-04F-RECETTE-CONSOLIDEE-2026-10-14.md` expose les preuves et la dépendance #104→#108→#118 ; comparaison GitHub : branche 04 **10 commits derrière, 279 devant** `main@cc0bc679`. Aucun `main` modifié ; PR #118 reste draft. La convergence et le contrôle sur candidate restent distincts.

- **04D — accessibilité retrait (14/10/2026)** : chaque bouton « Retirer » reçoit un nom accessible spécifique à la prestation ciblée ; assertion Electron ajoutée au pilote pour éviter une série de boutons indistinguables au lecteur d'écran. Contrôle du HEAD après correction en attente ; aucune fusion `main`.

- **Audit contradictoire LOT 04 (14/10/2026)** : nouveau référentiel d'audit `docs/ux-v2/LOT-04-AUDIT-AVANCEMENT-2026-10-14.md` ; scores indicatifs d'acceptation **développement 34/50=68 %**, **validation 29/50=58 %**, **préparation convergence 1/5=20 %** (non équivalents à une certification). PR #104 HEAD `57afcdae` CI #1045 verte ; PR #108 HEAD `2412513b` CI #1003 verte ; PR #118 CI #1275 verte sur `b56c1f6d` : 1 113/1 113 Vitest, Electron 04D 15/15, Electron native avec vrai preload/SQLite 7/7, 9 captures contrôlées par SHA. Référentiel #82 confirmé ; 04D et 04E n'atteignent **pas** encore le périmètre Prospect/Devis et la totalité des aides/recommandations. Ajouté depuis : `relevantSituations`, `commercialCautions` à l'éditeur versionné, aide '?' basée sur `CommercialScope` dans Prospect/Devis, tests unitaires/SQLite/Electron. CI #1300 échec TypeScript (propriétés de fixture doublées) **corrigé** par `df37e55c`; nouveaux HEAD en cours de validation. Risque de dépendances : 04C divergent de 04B (2 derrière), candidat 04D/04E 10 derrière `main@cc0bc679`, 296 commits devant à l'audit ; aucune convergence ni fusion effectuée.

- **Complément 04D post-audit** : le sélecteur de besoins Prospect préfère les liens administrés publiés et actifs, avec déduplication et protection contre les réponses tardives ; la liste historique `SUGGESTIONS` reste un repli **transitoire**, notamment faute de distinguer absence de configuration et intention de ne recommander personne (à décider avant suppression du repli). Tests purs de sélection et contrôle SQLite « pas de Devis créé » ajoutés. Le service retourne maintenant le statut de la **version cible**, et le panneau distingue une version retirée d'une prestation inactive. Test de conservation des cibles retirées ajouté. **Ces nouveaux commits ne sont pas encore certifiés par CI sur dernier HEAD**.

- **14/10/2026 — Correctifs audit 04D/04E** : CI #1355 verte sur l'audit initial ; suite de corrections Prospect (uniquement Services actifs/publiés, recommandations administrées chargées avec états loading/ready/error, repli historique explicitement signalé, pas de repli en cas de lien administré inadmissible), aide `?` Electron TEMP 10/10 via CI #1380 verte, snapshot d'aide/prix conservé dans Devis après nouvelle version via CI #1384 verte ; comparaison détaillée des textes 04E avant publication (code + tests en vérification). `CatalogRecommendationsService` refuse désormais toute cible Offre même via IPC ; test de non-mutation ajouté, CI du dernier HEAD à contrôler. Les motifs/priorités E105, la suppression définitive du repli E106 et la convergence `main` demeurent ouverts. Aucune fusion.

## UX/UI V2 — Lot 04, préparation d'intégration (14/10/2026)

**État constaté sur GitHub, sans fusion.** Ce relevé concerne la branche 04B ; il ne vaut pas certification du code convergé avec `main`.

- `main` observé à `cc0bc679400321f5afacdbee3317ea8acc451518` (lot 03D/03E intégré).
- **04B / PR #104** : HEAD initial audité `98caad750b723f29896de0c0185c3183d9e4dcae`, draft, cible `main`. CI #883 réussie sur ce HEAD. Divergence avec `main` : 109 commits d'avance, 10 de retard, base commune `b2796812ee24c9e9e824f3d66564f2c1a335bffe`. Réconciliation non réalisée.
- **04C / PR #108** : HEAD `2412513be4fb0f2ca87602adcdef4aaa31760ea3`, draft, cible la branche #104. Avant la présente mise à jour documentaire : 77 commits d'avance et 0 de retard sur le HEAD 04B, donc 04C contient déjà le code 04B. CI #1003 **SUCCESS** sur ce HEAD : Electron Catalogue 04C Windows TEMP, typecheck, 1 092/1 092 Vitest (118 fichiers), UX-01 brouillons/navigation, restauration/fermeture Electron (12 contrôles, 0 échec).
- Tests spécifiques du fichier `CatalogDraftEditing04C.test.ts` : 10/10 réussis dans la CI #1003, comprenant sauvegarde CAS sans nouvelle version, conflit entre snapshots de fenêtres, retry UUID sans doublon après réponse IPC perdue, conservation des prix historiques, refus d'écriture sur publié/retiré et refus de publication périmée.
- **Limites** : aucune exécution de tests sur un merge de #104 ou #108 avec le `main` actuel ; aucune recette visuelle humaine ni essai dans un binaire Electron installé. Ne pas présenter la réussite CI des branches comme une validation de la convergence. Le clonage local du dépôt public n'a pas fonctionné dans cet environnement (résolution DNS indisponible), donc aucun test local n'y a été exécuté.
- **Séquence exigée** : (1) convergence 04B avec `main` en worktree temporaire, revue migrations jusqu'à 67, CRM 03D/03E et garde UX-01 ; (2) tests complets TypeScript, Vitest, Electron Windows TEMP, FK, restauration, navigation ; (3) convergence 04C sur le résultat 04B, avec CAS, brouillons multi-fenêtres, publication et historiques ; (4) nouveaux tests sur les SHAs convergés ; (5) intégration **04B puis 04C**, seulement après contrôle et autorisation distincte.
- **Préservation** : ne pas toucher aux données MSI, ni écraser les développements parallèles 05–09. L'ajout de ce relevé dans 04B crée une nouvelle tête documentaire ; recontrôler l'ascendance et le head de #108 avant toute réconciliation.

**Statut : validation de branches acquise, convergence en attente, fusion non effectuée.**


### Audit additionnel de convergence — 14/10/2026

- Récupération des métadonnées à jour : #104 HEAD `63de9f3721efe178f713e9a7026e55b1a9d53118`, #108 HEAD `2412513be4fb0f2ca87602adcdef4aaa31760ea3`, #106 lot 05 HEAD `f80a23821563a09ba5de2c8ceae64e2fe011d195`. Ces trois PR restent en draft.
- Différence `b2796812...main` croisée avec `main...04B` : **trois fichiers modifiés des deux côtés** : `PROJECT_STATUS.md`, `src/main/ipc.ts`, `src/preload/preload.ts`. Ce sont des zones de revue, pas une preuve de conflit textuel. Inspecter particulièrement les commandes 03D/03E et le câblage Catalogue 04B lors de la fusion de test.
- Depuis le commit documentaire de 04B, `compare 04B...04C` indique **77 commits d'avance et 1 de retard** pour 04C ; ce commit documentaire doit être reporté lors de la synchronisation, sans écraser le code 04C.
- **Blocage d'exécution** : aucun dépôt Git local disponible dans le conteneur d'exécution ; `git ls-remote https://github.com/atoumweb-prog/atoumweb-manager.git HEAD` échoue avec `Could not resolve host: github.com`. Le connecteur GitHub permet la lecture et l'écriture de fichiers, mais pas l'exécution de `git merge`, `npm run typecheck` ou Electron Windows. Aucune convergence réelle ni nouveau test de code n'ont été exécutés dans cet environnement.
- Résultats **déjà établis** : #883 SUCCESS pour le HEAD de code 04B antérieur au suivi documentaire et #1003 SUCCESS pour le HEAD 04C indiqué ci-dessus. Ne pas confondre ces campagnes avec des résultats sur une branche intégrée.
- **Action bloquée à reprendre dans un vrai runner/worktree** : merge de test 04B sur main, revue des trois fichiers communs, tests TypeScript/Vitest/Windows/SQLite ; puis merge de test 04C sur 04B, mêmes tests plus parcours E99/E101/E102. N'envoyer les PR vers `main` qu'après ces preuves. Aucun merge ni rebase forcé réalisé dans cet audit.
# 01/11/2026 — Recette finale ciblée Devis & Contrats (#161)

Branche #161 synchronisée à 6da50a91. Correction d’un typage de test nullable, sans changement métier. TypeScript vert ; 92 tests ciblés verts sur cohérence éditoriale, rendu HTML/PDF, consommateur/rétractation, assemblage, préparation et préservation des versions.

Recette reproductible ajoutée dans `scripts/final-contract-recipe-20261101.cjs`. Elle sauvegarde la source en lecture seule vers une copie isolée, prépare et publie les 118 propositions et 6 versions Catalogue uniquement dans cette copie, puis compose quatre dossiers par les services réels du Manager. Source SHA-256 avant/après inchangée (`964da31efac12ad54effaa9e6c22e5e591053a1185d7bc51762a02adcbfdc0cb`), intégrité OK, FK vide et devis historiques conservés.

Quatre PDF inspectés intégralement, 49 pages : vitrine 699 €, WooCommerce 1 490 €, maintenance 49 €/mois suivie de Lune dédiée 149 €/an, Mariage Essentiel 399 €. Aucun placeholder, registre technique visible, texte coupé ou page vide ; acceptation présente dans les quatre. Blocages avant usage client : réclamations, prestataires/hébergeurs, RGPD, et médiateur consommateur effectif ; validation juridique finale maintenue. Aucune base active modifiée, aucune publication réelle, fusion ou déploiement.
# 01/11/2026 — accord RGPD V3 par Site (branche dédiée, non publié)

- Source RGPD V3 structurée avec provenance et empreinte ; aucun texte publié automatiquement.
- Migration 80 ajoutée : accords versionnés par Site et client, preuve signée, historique immuable.
- Service, frontière IPC avec confirmations explicites et panneau Projet > Sites & pages raccordés.
- Un accord n’est jamais créé depuis un devis ni rattaché automatiquement ; seuls les traitements déclarés sont bloqués avant signature.
- Registre d’incidents par Site ajouté avec dates, signalement et clôture ; les accords restent inchangés.
- Typecheck réussi ; 26 tests ciblés réussis. Aucune base utilisateur, publication, fusion ou déploiement.
- Détail : `docs/ux-v2/INTEGRATION-ACCORD-RGPD-V3-2026-11-01.md`.
# 02/11/2026 — préparation V3.8 distincte, sans publication

- Sources DOCX de relecture extraites de façon déterministe vers `data/contracts/atoumweb-contract-library-v38-review.json` et `data/catalogue/atoumweb-catalogue-v38-review.json` ; aucune base Manager ouverte.
- Bibliothèque : 119 clauses, dont 115 identiques à V3.7, 014/087/106 réécrites et 119 nouvelle. La clause 022 est contrôlée identique, sans plafond de responsabilité.
- Catalogue : 112 références rapprochées par code canonique, 105 fiches identiques et 7 écarts à soumettre à validation ; formule Lune dédiée conservée sans code inventé, comme nouveau brouillon éventuel.
- `ContractEditorialDraftService` accepte un nombre attendu versionné et sait préparer atomiquement une nouvelle clause en brouillon. V3.7 reste à 118 et tous ses tests restent valides ; aucune publication, adoption ou modification historique.
- Contrôles exécutés : TypeScript réussi ; 6 tests ciblés réussis, dont simulation sans écriture, 119 brouillons, idempotence, absence de publication et rollback d’une clause 119 invalide.
- Rapport : `docs/ux-v2/AUDIT-V38-2026-11-02.md`. Étape suivante : interface de comparaison V3.8 et préparation explicite des brouillons Catalogue, puis campagne devis/PDF seulement après changements correspondants.
