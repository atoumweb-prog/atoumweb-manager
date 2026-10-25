# Manager — consignes et reprise courte

Mise à jour : 25/10/2026. Les demandes récentes de Carlos priment. Dépôt courant : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation. Lire AGENTS.md et ses sources obligatoires ; suivi PROJECT_STATUS. Ne pas reprendre tout le chat.

## Travail autorisé et protections

- Branche locale `codex/devis-cgv-parcours-humain`. Devis/CGV, préparation, PDF et lanceur ; aucun chantier Bridge implicite, pas de main/fusion/push/CI/installateur.
- Pas de délégation sans demande. Contrôles proportionnés : ne pas relancer ce qui a réussi sans changement pertinent.
- Fixtures TEMP déterministes. Anciennes recettes et saisies préservées, nouveaux portables Workspace/Profil séparés. Aucun reset global.
- Source unique des données, clauses publiées versionnées, adaptations locales et snapshots transmis/acceptés immuables. Aucune publication ou approbation juridique automatique.

## Dernière livraison utile

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-91dedc1c/LANCER-LE-MANAGER.cmd`.
Corrections du design PDF déjà approuvé : exemple10 pages/35 clauses, numérotation ordonnée, titres groupés, unité1an inline, paramètres compacts début d’annexe, références/signature communes. Champs et contrôles d’engagement par ligne ; création ponctuelle distincte de maintenance12mois. Périmètre mensuel retrouvé dans Reference-V2 copié localement au brouillon annuel, prix/snapshot annuel inchangés. 10produits inclus+51supplémentaires=61 explicités. [Bilan détaillé](DEVIS-PDF-CORRECTIONS-2026-10-25.md).
Typecheck,106 tests distincts,39 assertions natives et31 binaire réel, aucune erreur renderer ; PDF final10pages et stress14pages/30paragraphes contrôlés. Ne pas refaire toute la campagne à la reprise.
Données source b0a192ca lues seules et sauvegardées : chaque ligne conservée avant rebasing des chemins Projet ;118 modèles/118versions,3devis/7lignes et tous prospects. Ensuite3paramètres de lignes DEV003 complétés explicitement, sauvegarde et rapport dans Workspace/backups. Schéma74/intégrité/FK conformes. Exemples35clauses calculés sur TEMP ; appliquer la comparaison de clauses reste une commande explicite dans le devis utilisateur.
PDF : C:/Users/AtoumWeb/Downloads/DEV-2026-003-corrige-Atoum-20261025.pdf. BROUILLON, pas prêt à signer : données admin/TVA/dates/renouvellement réels encore à compléter. Question envoyée à Carlos pour identité/adresse/SIRET/TVA, pas de réponse à cette livraison.

## Décisions persistantes et suites

- Même éditeur trois rubriques depuis Prospection et Devis : Prestations/prix, Conditions/CGV, Vérifier/sortir. Une clause à la fois ; copie intégrale/PDF/Word conservés. Garder le design validé.
- Manager maître du devis+annexe+version transmise+preuve d’acceptation, Abby ensuite pour factures. Cahier §10.3. Code d’acceptation encore partiellement centré Abby : à adapter lors d’un lot ultérieur, sans contourner preuve/gel/Projet. Pas réalisé dans les corrections PDF.
- Nouvelle entreprise PR#1 distincte, branche chatgpt/creation-entreprise-compacte-20261023 vers codex/crm-saisie-coherente, pas de fusion. Ne pas y intégrer ce chantier Devis. Bilan historique CREATION-ENTREPRISE-PR1-RECETTE-2026-10-23.md.
- Prochaine action : recette utilisateur sur91dedc1c ; compléter les données réelles, puis vérifier le document définitif. Pas de réécriture des clauses supposées bonnes ni de refonte graphique.
