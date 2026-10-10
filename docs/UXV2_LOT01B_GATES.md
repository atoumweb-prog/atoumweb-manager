# UX/UI V2 — Lot 01B — Matrice de recette R01B-01…12 au 10/10/2026

**Source de vérité des attendus :** `docs/ux-v2/LOT-01B-COMPOSANTS-ELEMENTAIRES.md` sur branche de référence de la PR #82. **Branche d'implémentation :** `feature/ux-v2-lot01b-components-v1`, PR #87 **draft**, base PR #86 toujours sans fusion vers `main`. Les statuts ci-dessous concernent **l'incrément pilote 01B**, non les futurs écrans refondus.

**Preuves clés (logs Windows fournis)** :
- **SHA `36ef9e8f2af84e2a38922f5f0f67bf569ff81e6a`** : `check-ux-v2-lot01b-controls.cjs` **32/32** ; `check-ux-v2-lot01a-real-ui.cjs` **300/300**, 17 écrans, 9 combinaisons sur six vues, 5 passages étroits, 10 zooms, 86 visites, aucune erreur console ni dépassement candidat ; `npm test -- --maxWorkers=2` **87/87 fichiers, 801/801 tests** ; `npm run typecheck` **OK**. Les fixtures sont toutes temporaires.
- **SHA `2ef6e74`** : aide contextuelle `FieldHelp` **37/37** ; **SHA `18040b2`** : 36 icônes existantes et activation native Enter **42/42** ; **SHA `4da508d`** : notifications **30/30** et typecheck OK ; **SHA `d80409a`** : atelier intégré 5 composants **51/51**, 9/9 captures synchronisées, typecheck OK.
- Revue visuelle des neuf PNG `uxv2-01b-atelier-20261010-040237.zip` : cohérence générale des thèmes/densités ; petites finitions possibles du bouton icon-only et de l'espacement de la démonstration. Voir `UXV2_LOT01B_VISUAL_REVIEW.md`.

## Matrice, preuves, limites

| Code | Exigence du référentiel | Statut au périmètre pilote | Justification / prochaine preuve utile |
|---|---|---|---|
| R01B-01 | Boutons/champs sous 3 thèmes × 3 densités, base 14/16/18 px | **PASS — pilote** | 32/32 boutons/champs ; 51/51 atelier ; neuf PNG datés. Aucune migration exhaustive des écrans historiques. |
| R01B-02 | Ordre focus clavier, Entrée/Espace, Escape | **PARTIEL** | Vraie touche Enter sur bouton HTML + `AppButton` : 42/42 ; focus/Échap de `FieldHelp` validés dans 37/37. **Tabulation d'ordre global et Espace sur les commandes métiers non recettés séparément**. |
| R01B-03 | Double clic async : une action, état et échec exact | **PASS — pilote** | `asyncDedup:true`, `rejectionVisible:true` dans 32/32, aucun handler métier migré. |
| R01B-04 | Aide automatique OFF, icône ? visible et volontaire | **PASS — pilote** | 37/37 `FieldHelp` (désactivation du survol, clic volontaire et fermeture) ; contrôle de la vraie préférence dans le test IPC/UI 300/300. |
| R01B-05 | Aide ON, survol court/prolongé, détail non intrusif | **PASS pour délai ; PARTIEL pour non-intrusion** | 37/37 vérifie court vs 2,5 s et fermeture. **Pas de capture au zoom/avec modale ouverte sur formulaire métier dense**. |
| R01B-06 | Ouverture aide clavier, contenu accessible, Escape et retour focus | **PASS — composant pilote**, parcours clavier complet **à renforcer** | Bouton natif accessible, 37/37 Échap/focus, 51/51 aide ouverte/fermée ; pas d'audit lecteur d'écran exhaustif. |
| R01B-07 | Fermer notification sans action métier | **PASS — pilote** | 30/30 notifications (`actionOnlyByClick:true`, `dismissalIndependent:true`) + 51/51 atelier ; ancien bandeau `.notice` conservé intact. |
| R01B-08 | Échec service : pas de faux succès, saisies conservées | **PARTIEL** | Rejet async pilote visible dans 32/32. **Aucun vrai service métier échoué et aucun formulaire persistant rempli n'ont été reproduits dans la fixture 01B**. |
| R01B-09 | Annuler une action destructive, aucun handler de suppression | **À RECETTER SPÉCIFIQUEMENT** | Protections UX-01 actuelles conservées (`requestUnsavedExit`, `UnsavedRegistry`, IPC `confirmExit`). Le 01B **n'introduit pas** de nouvelle boîte destructrice, mais la recette particulière « confirmer puis annuler » n'est **pas démontrée par les journaux fournis**. |
| R01B-10 | « Copier pour Abby » sur contenu non enregistré, refus conforme | **À RECETTER SPÉCIFIQUEMENT** | Parcours commercial historique non modifié ; le 300/300 passe dans les écrans à SQLite TEMP, mais **ne teste pas explicitement cette commande et son refus**. Aucune assertion de blocage ou de création documentaire déduite. |
| R01B-11 | Étroit/zoom, libellés longs, erreur et aide non masquante | **PARTIEL** | Recette réelle 300/300 : 5 passages étroits + zoom 125/150 % sur cinq écrans ; 51/51 atelier et neuf captures standard. **Libellés très longs, contenu métier dense et aide superposée au zoom restent non photographiés**. |
| R01B-12 | Coexistence nouvelles et anciennes CSS sans dégradation | **PASS — non-régression automatisée** | 300/300 interface réelle sur les 17 destinations, 0 erreurs console/0 candidat dépassement, 801/801 Vitest. Ceci **ne garantit pas** une revue manuelle exhaustive des 17 fiches remplies. |

**Synthèse :** les **fondations, contrôles pilotes et non-régressions automatiques sont verts**. Plusieurs scénarios contractuels/personnalisés nécessitent encore une preuve **spécifique**, essentiellement R01B-09, R01B-10 et les compléments R01B-02/05/08/11. Ne pas appeler ces 12 critères « 12/12 PASS ».

## Frontières de responsabilité et politique de clôture

**E05 corrigé et testé** : l'aide `?` reste actionnable avec `showHoverHelp=false` ; temporisation uniquement pour détail automatique. **E06 traité au niveau pilote de présentation**, pas migration `App.tsx`/handlers existants. **E07 documenté et conservé** : pas de nouvelle garde `AppDialog`, `window.atoumweb.unsaved.confirmExit` et règles de sortie restent autoritaires. Le statut des contrats et CGV ne découle en rien de cette UI.

Les éléments `AppButton`, `AppTextField` et `AppNotice` sont des primitives disponibles **sans raccordement métier automatique**. Une préparation à l'intégration V2 ne vaut ni « nouvel AppShell », ni redesign des fiches, ni conversion du CRM, ni déploiement.

**Décision prudente :** garder #87 **draft** et #86 **draft**, ne déclencher ni CI facturable ni fusion `main`. Pour lever les réserves, vérifier **R01B-09/10 sans mutation ni données réelles** et renforcer les mesures clavier/étroit sur une fixture isolée. Toute protection observée doit provenir de l'API existante, sans bricoler une deuxième confirmation.
