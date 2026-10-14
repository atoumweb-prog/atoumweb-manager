# Lot 10E — Recette transverse Statistiques, Sauvegardes, Réglages

**Statut : spécification de recette et ordre futur d'intégration, aucun test ni restauration exécuté.** Lecture du Manager `main` le 09/10/2026.
Références : [10A audit des métriques](LOT-10A-AUDIT-INDICATEURS.md), [10B Statistiques](LOT-10B-STATISTIQUES-NAVIGATION.md), [10C Sauvegardes](LOT-10C-SAUVEGARDES-RESTAURATION.md), [10D Réglages](LOT-10D-REGLAGES-PREFERENCES.md), [Lot 09 Facturation](LOT-09-GESTION-DOCUMENTS.md), [Lot 01 fondations](LOT-01-FONDATIONS.md).

## 1. Conditions d'acceptation non négociables
1. **Aucun KPI sans périmètre et formule** : unité, source, date de référence, filtres, taille d'échantillon, exclusions, libellé stock/flux et comparaison sont explicables et contrôlables dans les données.
2. **Signé ≠ facturé ≠ encaissé** : les vues montrent des mesures distinctes; `cash_collected` et `outstanding_revenue` de `shared/analytics.ts` sont `available=false` tant qu'aucune source de paiement réelle n'existe, même si la fonction `calculate` possède un cas de retour 0 non utilisé. Indisponible n'est **jamais zéro**.
3. **Coût vs rendement** : `contractHourlyCents` est une valeur contractuelle par heure suivie, **pas marge nette** ni bénéfice fiscal; dépenses enregistrées ≠ sorties de trésorerie.
4. **CRM E72** : `ProspectStage new` demeure Annuaire; ne pas compter les nouveaux contacts dans **Pipeline actif**. Écart `QuoteService.create` E153 toujours à traiter au bon service.
5. **Un seul module Statistiques** : réutiliser les deux couches existantes tout en harmonisant périodes, taux d'acceptation et catégories; ne pas créer un troisième calcul.
6. **Sauvegarde métier = registre** : déclarer une sauvegarde/markStable/verifyLocation ne sauvegarde pas réellement WordPress et ne prouve pas une restauration testée.
7. **Sauvegarde SQLite != sauvegarde complète workspace**. Restauration technique gardée par le service **réellement intégré #81**; source/destination, WAL, intégrité, backups de sécurité et accès concurrent sont à tester sans jamais utiliser un workspace réel comme cobaye.
8. **Réglages utilisateur** : trois thèmes × trois densités et aide au survol, vues/filtres si services présents; ne modifient aucune donnée commerciale, pièces, backups métier, Projet ni Client.
9. **Avertissements/protections invariables** : UX-01 dirty, UX-03 fin Intervention, UX-16 restore, archives probantes, acceptation Abby et droits ne sont **jamais désactivables** par un réglage.
10. **17 modules, sous-vues et parcours conservés** : ne pas supprimer d'onglet existant, conserver navigation arrière et moteurs IPC/services.
11. **Pas de tests sur Validation-MSI** : uniquement bases SQLite fictives copiées dans des chemins temporaires, vrais tests Windows limités à fixtures; jamais de restauration réelle, export client ou répertoire WordPress de production.
12. **CI** : résultats locaux/CI GitHub des PR #84/#81 ne valident pas Lot 10. Pour future PR, tests ciblés puis suite complète, CI au commit exact uniquement après accord de budget et validation humaine de la fusion. Documentation sur #82 avec `[skip ci]`.

## 2. Ordre de livraison recommandé (futures PR techniques séparées)
| Étape | Périmètre | Critère de sortie |
|---|---|---|
| **10.0** | Relever SHA réel de `main`, état des PR #81/#83, IPC/rôles/migrations et fixture pour chaque source métrique/backup/réglage | Matrice `Vue→handler→API→service→tables→fichiers→preuves` |
| **10.1** | Harmoniser **E290** dénominateur et période, **E293** contacts `new`, **E291/E297** rendements/classement Client | Snapshots analytique/UI numériquement concordants |
| **10.2** | Améliorer Statistiques/Accueil et drilldown, y compris indicateurs indisponibles et stocks/flux | Chaque lien ouvre la même population que le KPI affiché |
| **10.3** | Améliorer le **registre métier** des sauvegardes et les alertes sans le transformer en moteur WordPress | États déclaré/existant/confirmé/testé séparés |
| **10.4** | Intégrer l'UX **réelle** de restauration SQLite après #81, sans réécrire son moteur de sécurité | Fixtures SQL/WAL/alias Windows, échecs, sauvegarde de sûreté et récupérabilité |
| **10.5** | Recomposer Réglages (apparence/aides/navigation/documents/workspace/avancé) et gestion par module | Aucune préférence ne supprime les protections ni les données |
| **10.6** | Recette transverse, 3 thèmes × 3 densités, clavier, petites fenêtres, navigation de tous modules et CI au SHA réel | Rapport des résultats/cas non couverts et accord humain distinct avant fusion |

## 3. Recette transverse future (30 cas ; aucun exécuté)
| ID | Parcours | Résultat attendu |
|---|---|---|
| R10E-01 | Signé/Facturé sur période | Agrégats sourcés différents et exacts |
| R10E-02 | Encaissement sans table `payments` | Marqué indisponible |
| R10E-03 | Dépenses prévues/non payées | Pas présentées comme payées |
| R10E-04 | Taux d'acceptation UI/AnalyticsService | Même définition et même échantillon |
| R10E-05 | Devis refusés/expirés | Dénominateur et dates conformes |
| R10E-06 | Contacts `new` Annuaire | Hors KPI Pipeline actif |
| R10E-07 | Projet provisoire non signé | Hors signé et chiffre acquis |
| R10E-08 | Intervention incluse au Projet | Pas comptée deux fois en livré |
| R10E-09 | Projet terminé sans heure | Ratio €/heure indisponible |
| R10E-10 | Prétendue « marge » sur taux horaire | Libellé exact, aucun bénéfice net imaginé |
| R10E-11 | Stocks `ready/planned` vs flux période | Source et fenêtre lisibles |
| R10E-12 | Personnaliser dates puis changer onglet | Une période cohérente |
| R10E-13 | Changement rapide de filtres | Réponse périmée non appliquée |
| R10E-14 | Clic KPI commercial → Devis | Bonne population, navigation retour |
| R10E-15 | Trier Clients par montant et heures | Deux colonnes/unités distinctes |
| R10E-16 | Déclarer backup Client | Enregistrement sans fichier automatique |
| R10E-17 | Vérifier emplacement local | Présence seulement, pas « testé » |
| R10E-18 | Vérifier externe | Confirmation humaine seulement |
| R10E-19 | Alerte pré/post-intervention | Bon dossier et dates de sauvegardes |
| R10E-20 | Créer backup de base SQLite | Chemin et fichier techniques, pas registre Client |
| R10E-21 | Restaurer SQLite invalide | Refus sans mutation de base |
| R10E-22 | Restauration pendant transaction | Refus/coordination UX-16 réelle |
| R10E-23 | Panne restauration post-backup | Copie de sécurité récupérable |
| R10E-24 | Dossier Client non inclus dans SQLite | Avertissement, aucune restauration promise |
| R10E-25 | Choisir thème Noir/Blanc/AtoumWeb | Persistance et contrastes |
| R10E-26 | Compact/Confort/Confort+ | Tailles cibles et aucun contrôle inaccessible |
| R10E-27 | Désactiver aide au survol | Aides `?` et warnings nécessaires restent |
| R10E-28 | Changer workspace | Explication aucun transfert de données, reprise maîtrisée |
| R10E-29 | Réinitialiser vue/module | Données métier et brouillons intacts |
| R10E-30 | Navigation 17 modules, SQL tests, UI neuf modes et CI | Preuves SHA, aucune Validation-MSI |

## 4. Bilan de recette exigé de chaque future livraison
- **Métriques** : export de données synthétiques et détail de chaque SQL/formule/filtre, dates incluses, comparatifs n/n-1, preuves que les montants sont des euros enregistrés et non encaissés.
- **Commercial** : E72/E153 et populations `new`, expiring, won, lost, taux d'acceptation calculé de la même manière par chaque moteur.
- **Projets** : prévisionnel vs confirmé, durée réelle hors pause, taux horaire et dépenses sans marge inventée.
- **Backups** : enregistrés/manuels/stables, emplacements manquants, séparation registre/source, dossier backup technique, restauration WAL/SHM et sécurité testées sur copies SQL fictives uniquement.
- **Réglages** : consentement changement workspace, help, navigation, configurations 3×3, accessibilité et invariants non désactivables.
- **Qualité** : typecheck, ciblés, suite complète avant merge, CI hébergée si autorisée, SHA et lien résultats, comparaison sur bon HEAD, absence de mutation de fichiers utilisateurs.
- **Limites** : toute fonctionnalité visée sans service dans `main` est **cible non livrée**; aucun test de ce document n'atteste de la conformité financière ou de l'intégrité d'une sauvegarde distante.

## 5. Sujets techniques ouverts
**E315** registre canonique des métriques et deux calculateurs, **E316** taux et périodes, **E317** réconciliation du pipeline E72, **E318** démonstration de parcours de statistiques exact, **E319** niveau de vérification des sauvegardes, **E320** modèle de préférence Navigation/Vues, **E321** état de restauration #81/UX-16 au HEAD final, **E322** garanties de non-mutation de données et protections non désactivables.

**Lot 10A–10E = spécification de conception. Aucun développement, contrôle qualité, backup/restauration ni fusion n'a été effectué par la présente rédaction.**
