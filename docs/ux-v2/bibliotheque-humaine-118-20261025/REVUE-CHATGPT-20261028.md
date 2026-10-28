# Revue rédactionnelle ChatGPT — maintenance et deux clauses communes

Date : 28 octobre 2026 · **Propositions documentaires non validées** · branche `chatgpt/humanisation-maintenance-socle-20261028` dérivée de `codex/internal-reference-handoff-20261027`.

## Périmètre réalisé

La source documentaire unique des propositions révisées est [PROPOSITIONS.json](PROPOSITIONS.json). Ce lot modifie uniquement le champ `proposal` des neuf entrées ci-dessous, en conservant l'ancienne proposition dans `previousEditorialProposal` et la justification dans `editorialRevision`.

Les textes publiés de `data/handoff/2026-10-27/contrats-publies.json`, leurs versions, les liens Catalogue/clauses, les prix, les devis et contrats historiques, ainsi que les réglages du Manager, **n'ont pas été modifiés**. Les champs `approval` et `humanDecision` restent inchangés : **aucune adoption, aucune publication**.

| Code | Modification proposée | Point à contrôler avant adoption |
|---|---|---|
| `MAINT-PERIMETRE` | Présentation du périmètre, des inclusions et des travaux supplémentaires en phrases simples, sans liste à points-virgules. | Le devis doit réellement préciser l'étendue de la formule. |
| `MAINT-INTERVENTIONS` | Distingue le quota mensuel d'interventions d'une banque d'heures, y compris en cas de facturation annuelle. | Vérifier les limites réelles de chaque formule et ne pas transformer les interventions en crédit annuel. |
| `MAINT-MAJ` | Distingue report technique, information du client et corrections déjà dues. | Ne pas reporter un correctif légalement ou contractuellement dû sans traiter les obligations applicables. |
| `MAINT-RENOUVELLEMENT` | Sépare mensuel et annuel, accord exprès annuel conservé. | Confirmer le parcours réel de renouvellement/résiliation, y compris numérique si applicable. |
| `MAINT-SAUVEGARDE` | Simplifie fréquence, conservation et support de stockage. | Ne pas inventer de fréquence, de rétention ni de garantie de restauration ; connaître les conditions de l'hébergeur. |
| `MAINT-URGENCE` | Distingue plages de prise en charge, diagnostic et complément accepté. | Vérifier le délai convenu ; traiter les violations de données selon les rôles réels (RGPD). |
| `MAINT-WOOCOMMERCE` | Périmètre de la maintenance et exclusions client plus lisibles ; obligations dues préservées. | Vérifier les extensions effectivement listées au devis et les services tiers. |
| `BASE-CONFIDENTIALITE` | Engagement réciproque exprimé en « nous/vous » avec les exceptions conservées. | Préciser restitution/suppression/conservation selon les dossiers. |
| `BASE-FORCE-MAJEURE` | Ajoute explicitement l'effet d'un retard justifiant la résolution si l'empêchement est temporaire. | Contrôler avec l'article 1218 du Code civil et le contrat entier. |

## Vérifications réalisées

- 118 entrées contractuelles toujours présentes et identifiants sans doublon.
- Neuf propositions modifiées ; textes sources `origin.body`, empreintes sources, statuts et décisions d'approbation inchangés.
- Chaque proposition remplacée reste disponible dans `previousEditorialProposal`.
- Pas de ligne à tiret terminée par un point-virgule dans les neuf rédactions révisées.
- Aucun test d'exécution du moteur, aucune génération PDF, aucun changement de schéma ou de base : **contrôle documentaire uniquement**.

## Références légales externes consultées

- [Code civil, article 1218 — force majeure](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431).
- [CNIL, article 33 du RGPD — notification des violations de données](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

Ces références étayent des points précis, sans certifier automatiquement la validité de toutes les dispositions contractuelles.

## Suite prévue

1. Relecture humaine et arbitrages sur les neuf propositions ; ne pas publier sur simple approbation de style.
2. Examiner les clauses `WEB-*` et `ECOM-*` qui s'appliquent aux devis de création et de maintenance de sites.
3. Ensuite seulement, améliorer le **rendu PDF client** (listes, codes internes, calendrier, titres, enchaînements), sans altérer les snapshots historiques.
4. Tester les devis représentatifs et l'application B2B/B2C avant publication éventuelle des nouvelles versions.

## Décisions métier prises avec le responsable d'AtoumWeb (28 octobre 2026)

### D01 — Interventions comprises dans les formules de gestion et maintenance : VALIDÉ

**Décision explicite de l'utilisateur :**
- **Gestion / maintenance WordPress** : **2 petites interventions par mois** ; **30 minutes maximum par intervention**.
- **Gestion / maintenance WooCommerce** : **4 petites interventions par mois** ; **30 minutes maximum par intervention**.
- **Même règle pour la facturation mensuelle et annuelle** ; les interventions sont **non reportables** au mois suivant et **ne représentent pas une banque d'heures**.
- Les corrections qui sont déjà dues au titre d'une garantie ou d'une obligation indépendante n'entament pas les quotas commerciaux.

**Conséquence rédactionnelle** : conserver `MAINT-INTERVENTIONS` comme clause générique renvoyant au **quota exact inscrit au devis**, plutôt que de mentionner obligatoirement 2 ou 4 interventions dans toutes les prestations. Les conditions commerciales doivent reprendre les limites de 30 minutes et la non-reportabilité, y compris dans les formules annuelles.

**État** : règle métier approuvée, **pas** adoption globale ou publication de la clause contractuelle. La version publiée du Catalogue reste inchangée. Les fiches mensuelles `Gestion WordPress` et `Gestion WooCommerce` ne contiennent actuellement pas d'inclusions détaillées dans l'export daté du 27/10. Une future mise à jour **versionnée** des fiches commerciales sera donc nécessaire, avec contrôle de non-rétroactivité pour les devis déjà acceptés.

**D02 — Sauvegardes AtoumWeb + hébergeur : RÈGLE VALIDÉE.** Le responsable confirme deux dispositifs distincts : les sauvegardes effectuées par AtoumWeb et celles proposées par l’hébergeur. Les sauvegardes de l’hébergeur suivent leurs propres conditions et ne se substituent pas aux sauvegardes AtoumWeb. **Fréquence et durée de conservation de chaque dispositif non encore validées.** Aucune version contractuelle publiée n’est modifiée.

