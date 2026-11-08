# Ordre de mission pour Codex — intégration AtoumWeb Manager

## Décision métier, sans nouvelle question de validation
Le propriétaire d'AtoumWeb a **validé tel quel** ce pack V3.9.4 / V1.5 du 8 novembre 2026 pour servir de **référence métier** dans AtoumWeb Manager. Il **ne souhaite pas consulter un juriste**. Tu peux donc intégrer ces données et règles métier dans une branche de travail, sans redemander de relecture juridique. **Ne fais pas pour autant de déclaration de conformité légale, et ne masque pas les points de conformité/risques restant non satisfaits**.

Le pack a un **statut propriétaire : APPROUVÉ MÉTIER POUR INTÉGRATION INTERNE**. Les documents Word portent historiquement la mention non publiée ; c'est intentionnel. Ce statut n'autorise PAS publication commerciale, fusion dans `main`, déploiement, modifications de documents déjà signés ou application à la base utilisateur sans instruction distincte.

## Étape 1 : état exact du code (lecture seule)
1. Applique `AGENTS.md` du dépôt ; lis `PROJECT_STATUS.md`, `docs/ux-v2/CONSIGNES-ET-REPRISE.md` et la documentation propre au catalogue, moteur clauses/contrats, devis, RGPD et migrations. Le mémo joint est une photographie **du 3 novembre**, pas l'état actuel.
2. Affiche dépôt, branche, `git status --short --branch`, `git rev-parse HEAD`, PR ouvertes, migrations et fonctionnalités déjà présentes ; note toute divergence avec la photographie précédente.
3. Identifie les versions du catalogue, le système d'historisation des clauses/contrats et les préparateurs de brouillons. **Réutilise les moteurs existants, ne les recrée pas.**

## Étape 2 : cartographie et intégration sur branche isolée
1. Considère les Word de `01_DOCUMENTS_APPROUVES_METIER` comme source finale. Extrais/compare les 130 références (`CATALOGUE_V394_130_EXTRAIT_WORD.json`) et les 119 clauses (`CLAUSES_V394_119_EXTRAITES_WORD.json`). Conserve code, prix affiché, inclusions, exclusions, statut source, texte intégral, numéro, audience/public, version et provenance.
2. Garde les **130 montants et codes de la grille inchangés**. Les 47 prix sur délégation gardent `RETENU_SUR_DELEGATION_07_11_2026` ; les 6 fiches à vérifier, les références historiques et bases internes conservent leurs restrictions. La validation de ce pack **n'est pas une validation individuelle des 47 tarifs ni une autorisation générale de les publier**.
3. Il existe **18 codes `V39-`**, non 15. Pour chacun, rapproche-le par code/historique/offre/statut du catalogue du Manager, inscris l'ID actif éventuel, et indique les collisions/doublons ; **aucun alias ou renommage automatique sans preuve d'équivalence**. Préserver tous les devis liés aux IDs historiques. N'insère aucune référence identique en double.
4. Prépare une **nouvelle version volontaire, traçable et non publiée** des sources commerciales et contractuelles. Ne remplace ni n'écrase les clauses actives, devis acceptés, contrats signés, CGV archivées, snapshots ou données des clients. Évite les migrations destructives. Si des brouillons historiques existent, ajoute les nouveaux sans les réécrire rétroactivement.
5. Branche les sélecteurs Devis/Contrat sur les versions explicitement choisies ; les clauses à fournir dépendent de l'offre, du public et du devis. Les notes et annexes **internes** ne sont pas injectées comme clauses destinées au client. Conserve preuve de l'acceptation, de la date et de la version sélectionnée.
6. Respecte la distinction : **Abby reste responsable des factures réglementaires en V1** ; Manager gère l'activité commerciale/documentaire. Pas de factures réglementaires parallèles non validées.

## Étape 3 : règles métier ciblées / risques de régression
- **Clause 019** : le texte client de la bibliothèque rectificative n'expose plus `PAY-005` ; impayés ponctuels : relance J+7, mise en demeure J+15, suspension éventuellement possible à J+23 des seules tâches non exécutées selon conditions ; abonnements récurrents : procédure J+30 / J+60. Pas de suspension automatique, pas de suppression immédiate des données.
- **Clause 022** : responsabilité sans plafond ajouté ; préserver intégralement cette clause. **RC Pro : pas de couverture active prouvée ; ancienne décision LEGAL-006 différente de l'état récent.** Conserver une alerte explicite et un arbitrage séparé, sans présumer assurance ou renonciation.
- **Clauses 033, 069, 102, 119** : 033 ne pas dire CM2C conventionné sans preuve ; 069 maintenance, 102 Lune ; 119 autorisation commerciale distincte, facultative et révocable. Aucun logo/référence sans accord.
- **WooCommerce** : Essentiel 1 490 € = 10 produits simples ; Business 1 990 € = 25 produits simples au total et connexion newsletter standard 99 € **incluse**, plus les inclusions décrites dans OFF-003 ; Visibilité 2 390 € = 25 produits au total, reprise Business et prestations additionnelles décrites. Pas de double ligne 99 € lorsque déjà incluse.
- **Maintenance** : mensualités WP/Woo ; hébergement isolé Lune 149 €/an sans maintenance WP ; domaine standard distinct hors mariage ; ancienne fiche « hébergement seul 99 € » historique et non commercialisable comme alternative.
- **Reconductions** : distinguer maintenance annuelle seulement sur accord exprès et Lune/mariage/GBP/statistiques/newsletters lorsque reconduction automatique convenuellement prévue ; domaines hors mariage sur accord exprès. Suivre la date limite de refus, notification préalable, trace de l'information et résiliation accessible si exigée. Les mécanismes B2C encore non développés doivent rester signalés comme tels.
- **RGPD** : accords/sous-traitants/accès contrôlés par site ; ne pas prétendre que des annexes manquantes ou procédures de rétractation ont été finalisées ; ne pas inventer de nouvelle solution de sauvegarde au-delà des outils o2switch existants.
- **Tarifs** : hausses mensuelles annoncées au moins 30 jours avant et résiliation possible ; tarifs annuels fixes sur la période et nouvelle annualité à prix augmenté sur accord écrit. Pas d'évolution unilatérale cachée.

## Étape 4 : validation technique et rapport d'intégration
Effectue les contrôles adaptés à la branche et au code impacté, puis une recette pertinente :
1. Intégrité **130/130** codes, montants, statuts et inclusions ; **119/119** clauses avec ordre, code, public et texte ; signaler tout diff.
2. **47** prix délégués préservés ; **18** codes `V39-` réconciliés un par un, avec refus explicite des collisions ; **6** fiches à vérifier non publiées.
3. Cas Devis et Contrat : vitrine, Woo Essentiel/Business/Visibilité, maintenance WP/Woo, Lune, mariage, GBP, statistiques, newsletter (ponctuelle/récurrente) ; générer des simulations PDF/Word et inspecter visuellement les livrables concernés.
4. Régime consommateur/pro : clauses, acceptation/version, rétractation si applicable, reconduction et notifications, données/RGPD et absence de consentement de référence commerciale. Ne déclare « implémenté » que si le code et les tests l'attestent.
5. Contrôler migrations, sauvegarde et restauration sur copie isolée et rejouabilité, bases SQLite, reprise de données, tests TypeScript/Vitest/packaging Windows selon le périmètre touché ; ne pas annoncer un test Windows si non réellement exécuté.
6. Préparer le diff final, les rapports, la liste d'anomalies et des étapes d'activation **manuelle** avec rollback. Décrire les travaux non réalisés.

## Livraison attendue et bornes d'autorisation
- Créer une branche dédiée et une PR non fusionnée, après vérification de l'état actuel. Aucun changement de `main`, aucune fusion, aucun déploiement, aucune mutation des données réelles.
- Tu peux implémenter les corrections dans la branche conformément à cette mission. Si une décision technique requiert une vraie règle métier absente des sources (ex. mapping de deux IDs sans preuve), signale-la explicitement **au lieu d'inventer**. Ne redemande pas l'approbation du pack commercial dans son ensemble.
- Clôture avec : **Résultat livré / Contrôles exécutés (nombre, commandes, HEAD) / Écarts / Contrôles non exécutés / Bloqueurs techniques / Étapes pour validation de fusion et d'activation**.
