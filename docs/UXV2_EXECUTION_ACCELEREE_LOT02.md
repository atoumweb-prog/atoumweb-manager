# Exécution accélérée UX/UI V2 — consolidation 02A/02B puis intégration réelle

13/10/2026. Nouvelle méthode autorisée : autonomie à l'intérieur du lot explicitement autorisé, corrections mineures ciblées, tests ciblés pendant le développement, une validation complète en fin de lot et une seule CI candidate automatique. Les fusions restent soumises à un accord explicite ; aucun changement métier ou usage de Validation-MSI.

## Application immédiate : consolidation 02A+02B

Branche `codex/consolidation-ux-v2-02ab`, créée depuis #93@f7e2ae9. Fusion normale locale de main@a01c60d9 : commit `db407ba`, parents #93 et main, arbre `b462dce8f6944b6ec9cf426f299ac8676cbafdef`, strictement identique à la simulation testée `83127f07cebf045ba98629582d866f2e0e92fcc5`. Le seul conflit, PROJECT_STATUS, conserve les deux historiques. Aucun autre fichier corrigé.

Le rapport préparatoire et ce plan sont documentaires. Les sources/tests/scripts/workflow et les protections sont comparés octet par octet avec le candidat testé avant publication. Les 893 tests, ateliers 02A125/02B167/01F137 et UX-01183 déjà verts ne sont pas rejoués artificiellement pour des changements de documentation. La CI candidate testera le HEAD publié et le merge virtuel avec main ; les deux preuves restent distinguées.

Publication de la branche codex hors filtre push, puis PR draft unique vers main : seul l'événement pull_request:opened déclenche la candidate. Aucun dispatch, commit vide, modification du workflow ou skip ci pour masquer un contrôle. Si un run existe déjà, l'observer plutôt que le redéclencher. Aucun push ultérieur sur la candidate figée pendant ce run.

Frontière : consolidation de composants/ateliers, non activation d'un nouvel App/header/chrono métier. #90–93 conservées intactes ; aucune fusion de ces PR, fermeture ou retarget.

## Découpage conseillé — à autoriser séparément

| Lot groupé proposé | Résultat réellement utilisable | Sous-étapes autonomes | Validation de fin |
|---|---|---|---|
| Intégration réelle 02B.5 + 02B.6, avec raccord nécessaire du rail 02A | Un seul shell Manager utilisant rail E42 et header compact/développé, véritable chrono conservé à son propriétaire | Qualifier/corriger les collisions de couches démontrées ; adapter les préférences au workspace actuel ; brancher commandes existantes/routes et contextes ; connecter la présentation au chrono/notifications/horloge existants ; recette native du parcours réel | Typecheck, suite complète, restaurations, UX-01 et Electron réel trois thèmes × trois densités, clavier/étroit/zoom, une CI candidate |
| Intégration réelle 02C — recherche globale et ouvertures ciblées | Recherche du Manager vers les bons dossiers, sans perte de brouillon et sans requête périmée appliquée | Lire le référentiel 02C ; inventorier contrats/requêtes/routes ; réutiliser GlobalSearch/services ; rendre résultats/chargement/erreur accessibles ; sécuriser réponses tardives et ouverture ciblée/focus | Tests ciblés puis suite complète de fin, vrais handlers avec fixtures TEMP, gardes/identités/annulations et une CI candidate |

Ne pas regrouper d'emblée 02C avec le port du shell : changements de focus, de couches et de routage asynchrone se cumulent. Stabiliser le shell réel en un lot 02B.5/6, puis la recherche réelle en un lot 02C. Les ateliers deviennent des supports de non-régression ; aucun nouvel atelier autonome sans besoin démontré.

Ces deux lignes sont une proposition de périmètre, pas une autorisation actuelle de les implémenter. Le raccord du rail est nécessaire pour produire une interface réellement utilisable et doit être compris dans l'accord du lot réel, plutôt que relancer une préparation isolée 02A.

## Autonomie et automatisation

- En développement : tests ciblés pour chaque comportement modifié, tests permanents reproduisant le défaut avant correction ; pas de suite complète à chaque ajustement CSS/documentaire.
- En fin de lot : un passage complet sur le candidat figé (typecheck, Vitest deux workers, restaurations et bancs Electron concernés). Rejouer seulement après un changement de code, un échec ou un doute matériel ; aucune assertion affaiblie ni timeout global augmenté.
- Préparer un orchestrateur local de recette qui appelle les bancs existants, archive SHA/arbre/dirty/statuts/durées, compare les refs attendues et les fichiers protégés, et produit un seul manifeste. Réutiliser fixtures/cleanup existants ; pas de copie de données réelles, de nouveau registre UX-01 ou de retries masquant un échec.
- Automatiser avant publication : absence de conflits, correspondance source/candidat, inventaire des tests et assertions, intégrité/FK/migrations TEMP, diff métier/SQLite/workflow, vérification d'une seule CI et de son SHA/merge virtuel. Les automatismes rapportent les échecs et s'arrêtent ; ils ne les déclarent pas acceptés.
- Préparer une PR regroupée de fin de lot. Geler son HEAD avant ouverture pour éviter plusieurs synchronize pendant le développement. Le workflow inchangé exécute une candidate ; ses tests Vitest ne remplacent pas les bancs Electron locaux.
- Publication du bilan final en commentaire GitHub sans nouveau commit : aucune CI documentaire supplémentaire. Nouvelle CI après correctif d'un échec uniquement selon l'autorisation correspondante, jamais rerun automatique.

## Décisions qui exigent réellement AtoumWeb

1. Accord de fusion de la consolidation actuelle, après sa candidate verte. La CI post-fusion accompagne l'accord de fusion ; pas de merge implicite.
2. Accord sur le périmètre de chaque prochain lot réel (02B.5/6 puis 02C). Cet accord couvre les sous-étapes, corrections mineures et une candidate de fin, pas un changement de règles métier.
3. Modification métier, migration, restauration réelle, suppression, modification d'un invariant de chrono/facturation/snapshot : arrêt avant mutation et décision humaine.
4. Choix produit non tranché réellement nécessaire à l'intégration ; logo/pictogrammes définitifs restent séparés et peuvent conserver leurs emplacements provisoires. Les dimensions courantes peuvent être affinées techniquement dans le lot autorisé sans validation pixel par pixel.
5. Nouvelle tentative hébergée après échec ou blocage de quota : diagnostic ciblé puis accord si une autre exécution est nécessaire ; aucun contournement facturation/Stop usage.

Pas de validation supplémentaire pour une lecture, un test ciblé, une correction mineure de focus dans le périmètre, une adaptation documentaire, un regroupement de contrôles ou une correction technique sans effet métier. Les mises à jour intermédiaires restent brèves ; un bilan final porte les preuves et limites.

## Risques bloquants du futur port

- Échap consommé par plusieurs listeners (GlobalSearch/Projects/Bibliothèque/Bridge) : reproduire sur l'écran réel, puis corriger uniquement la couche concernée avec defaultPrevented/consommation locale et la garde existante. Toute perte de métadonnées/brouillon reste bloquante.
- GlobalTimer : même instance, session et propriétaire avant/après repli/navigation ; pointerdown ne doit pas annuler un dialogue à cause du repli. Tester démarrage/pause/reprise/arrêt/récupération via les vrais handlers sur TEMP, sans copier l'état dans les préférences.
- Préférences : isolation rail/header/bandeau, notifications multi-fenêtres et changement de workspace ; aucune note/session/id de dossier dans le magasin visuel. Sauvegarde refusée visible, pas de succès anticipé.
- Ouverture ciblée/recherche : garder l'identité et ne pas appliquer une réponse ancienne après changement de cible ; demander UX-01 avant démontage. Aucun changement de query métier ou filtrage silencieux.
- Le nouveau shell ne doit pas casser les 17 routes, les événements contextuels Projet/Bibliothèque ni les fenêtres détachées. Les preuves du pilote ne suffisent pas à certifier ces raccordements.

## Points de contrôle avant intégration définitive

Candidat figé et arbres comparés ; tests ciblés/permanents verts ; suite et typecheck verts ; restaurations/FK/migrations TEMP vertes ; banc réel des interactions modifiées et UX-01 verts ; aucun risque connu de perte/mutation ; candidate hébergée sur le bon SHA verte ; accord humain de merge ; contrôle de l'arbre fusionné et une CI post-fusion. Recette humaine globale différée, limites visuelles/OS/accessibilité signalées sans bloquer arbitrairement un composant isolé.

Consommation nominale : deux CI par lot groupé intégré (candidate + post-fusion), contre une multiplication par sous-étape. Pour 02A+02B puis intégration 02B.5/6 puis 02C, six runs nominaux au total, chacun dans le périmètre explicitement autorisé ; aucune autorisation de fusion anticipée ni permission de lancer dès maintenant les lots suivants.
