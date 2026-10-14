# Lot 08F — Recette transversale et plan d'intégration Interventions / Maintenance / Packs / Temps

**Statut : plan documentaire, aucun développement, aucune migration ni test exécutés.** Audit de référence : `atoumweb-manager/main` au 09/10/2026.
Sources : [08A état réel](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md), [08B interventions](LOT-08B-INTERVENTIONS-DEMANDES.md), [08C maintenance](LOT-08C-MAINTENANCE-CYCLES.md), [08D packs](LOT-08D-PACKS-DEBITS.md), [08E temps et rapports](LOT-08E-CHRONO-TEMPS-RAPPORTS.md), [07C Projet commercial](LOT-07C-BLUEPRINTS-DOSSIER-COMMERCIAL.md).

## 1. Contrat de recette non négociable
1. **Une seule intervention réelle par demande convertie**, identité Client/Projet exacts, pas d'effet au simple affichage.
2. **UX-03 : la terminaison** ne doit jamais laisser Intervention terminée sans débit attendu, pack débité sans statut approprié ou élément de facturation incohérent. Tester les pannes **après chaque écriture**. Idempotence nécessaire en cas de rejeu.
3. **Pack** : solde tiré des mouvements, débit du temps net terminé, non du temps estimé; correction et contrepassation traçables; pas de double débit.
4. **Maintenance UX-02** : **nouveaux abonnements manuels et vendus** en cycles date-à-date depuis début effectif. Engagement 12 mois payé une fois = **12 quotas mensuels sans report**, indépendants du cycle de facturation; aucun recalcul des anciens `calendar`.
5. **Dépassements** : le travail n'est pas automatiquement interdit mais la décision de couverture/facturation est justifiée et liée à la bonne période ou au bon mouvement.
6. **Un chrono global** avec bascule transactionnelle, récupération explicite et pauses exclues; sessions et durée exactes après correction.
7. **Facturable ≠ facturé** : une case de temps n'émet pas de facture Abby ; préparation d'un élément dans Manager ≠ émission officielle.
8. **Projet prévisionnel** : préparation interne possible avant signature, sans abonnement client/maintenance actif/vente. Acceptation Abby seule peut provisionner la vente réelle selon les règles du Devis.
9. **Garde UX-01** : fermer, sélectionner, réduire, filtrer, ouvrir une autre fiche, échapper ou perdre le réseau ne supprime pas un brouillon métier non sauvegardé.
10. **Validation-MSI** interdite en tests, migrations, démo, bootstrap ou modifications; seulement copie SQLite fictive isolée et restaurable.

## 2. Ordre de développement proposé — distinct du code en cours sur #81/#83
| Phase | Travail | Condition de sortie |
|---|---|---|
| 08.0 | Relever SHA `main` réel après intégration CI/restauration, enregistrer tables/IPC, transactions existantes, fixtures et tests | Matrice `UI→IPC→service→effet SQL→preuve`, seuils et permissions |
| 08.1 | Régler **UX-03 E222** : reproduire et tester la clôture partielle; modifier service seulement si faille confirmée, préserver idempotence | Pannes pack/statut/billing et rollback/reprise confirmés |
| 08.2 | Régler **UX-02 E223** : nouvel abonnement manuel date-à-date, cadence de quota distincte du paiement et aucune migration historique | 15→14, mois courts, 12 cycles, anciens `calendar` inchangés |
| 08.3 | Recomposer fiches Interventions/Demandes 08B et Packs 08D, détails des couvertures, débits et shortfalls | 3 thèmes×3 densités, actions disponibles uniquement si service autorise |
| 08.4 | Fiche Maintenance/cycles/rapports 08C, dépassements et décisions sans facturation implicite | Cycles, quotas, routines, rapports, vérifications métier fiables |
| 08.5 | Page Temps/GlobalTimer 08E et garde UX-01 des corrections | Sessions uniques et nettes, regain/stop connu, fiabilité au changement contexte |
| 08.6 | Vérifier toutes intégrations avec Projet/Devis/Client/Abby et les suites réelles | Typecheck, tests ciblés/complets et CI sur SHA exact après accord distinct |

**Codex MSI sur PR #81** : diagnostic local des trois tests de restauration, **pas** mandat pour traiter les points UX-02/UX-03 de cette documentation. **PR #82** reste documentaire; ne pas déclencher des runners Actions sur de simples mises à jour de Markdown.

## 3. Recette transverse future (26 scénarios, aucun exécuté ici)
| ID | Parcours | Attendu |
|---|---|---|
| R08F-01 | Créer demande avec Client/projet | Une demande, aucune intervention implicite |
| R08F-02 | Transformer demande deux fois | Une intervention unique |
| R08F-03 | Créer intervention avec couverture pack | Vérification Client/Projet/Pack |
| R08F-04 | Démarrer chrono intervention | Session unique, état cohérent |
| R08F-05 | Pause/reprise et arrêt | Temps net hors pauses |
| R08F-06 | Terminer intervention pack avec temps | Débit une seule fois et statut completed |
| R08F-07 | Échec injecté après débit pack | Pas de mouvement/statut partiel |
| R08F-08 | Échec injecté sur facturation hors forfait | Pas de statut completed isolé ni doublon |
| R08F-09 | Double clic Terminer | Même résultat, aucun second débit/billing |
| R08F-10 | Correction temps après débit Pack | Régularisation traceable, pas second débit total |
| R08F-11 | Pack insuffisant | Dépassement visible et décision |
| R08F-12 | Contrepasser mouvement pack | Ancien mouvement préservé et solde correct |
| R08F-13 | Abonnement manuel démarré le 15/10 | Cycle opérationnel 15/10→14/11 |
| R08F-14 | Abonnement annuel payé annuellement | 12 cycles mensuels et quotas remis à zéro |
| R08F-15 | Ancien abonnement `calendar` | Aucun changement historique |
| R08F-16 | Décision de dépassement maintenance | Motif, période, montant/traitement si nécessaire |
| R08F-17 | Contrôle de routine de maintenance | Intervention réelle, pas double quota sans règle |
| R08F-18 | Rapport de période | Données réelles et statut brouillon correct |
| R08F-19 | Clore période avec anomalie non résolue | Blocage/alerte selon contrat et service |
| R08F-20 | Projet prévisionnel sans Devis accepté | Pas de vente, pack ou abonnement actif |
| R08F-21 | Accepter bon Devis puis provisionner | Une souscription/pack conforme aux lignes vendues |
| R08F-22 | Simuler perte réseau pendant sauvegarde | Texte dirty préservé et erreur claire |
| R08F-23 | Basculer chrono A→B alors que B invalide | A préservé |
| R08F-24 | Récupérer session obsolète puis corriger | Aucun temps fantôme |
| R08F-25 | Aide/couleurs, tableaux, 3 thèmes × 3 densités | Compact >=14px, actions accessible clavier |
| R08F-26 | Tests SQLite FK/rejeu/rollback, CI au bon SHA | Logs contrôlables, jamais Validation-MSI |

## 4. Preuves attendues d'une future PR de code
- SHA de base, fichiers, migrations, éventuels flags/nouveaux champs, stratégie rollback, aucune mutation historique sans consentement.
- Trace d'essais d'injection de panne **à chaque étape de `InterventionCompletionService.complete`**, et refus de double comptage.
- Jeu de cas date-à-date : 15/10, 31/01, février (bissextile et non bissextile), fin annuelle, paiement annuel/quotas mensuels, abonnements legacy.
- Écart entre `usedSeconds` total et `remainingSeconds` mineur **expliqué par une règle métier testée**, pas camouflé en CSS.
- Recette chrono : sessions actives/récupérées/pauses/corrections, rapport, solde pack et décision Abby.
- Interface 3 thèmes × 3 densités, petite fenêtre, clavier/lecteur d'écran et `dirty` sur chaque bouton de sortie.
- Tests ciblés puis complets sur fixtures, CI réelle uniquement **après validation**, bilan des cas non couverts et merge uniquement avec accord.

## 5. Questions ouvertes
**E251** enveloppe transactionnelle interservices de `complete` et conséquences de facturation; **E252** stratégie de correction Pack après une session corrigée; **E253** décision juridique/métier sur quotas routines/temps d'intervention; **E254** stockage de facturation distincte sur nouveaux abonnements manuels; **E255** maintien des modes de report historiques; **E256** règles/autorisation de réouverture et correction d'une période close; **E257** parcours de revue/archivage rapport Client.

**Bilan : Lot 08A–08F entièrement spécifié et à recetter; aucun code, période, pack, intervention ou chrono réel modifié.**
