# Lot 06D — Conditions du Devis, Builder CGV, contrôles et prévisualisation client

**Statut : spécification UX V2, non implémentée.** Constat statique `main@eb252d5c` (09/10/2026).
Références : [06A état réel](LOT-06A-MATRICE-DEVIS-ET-ETATS.md), [Lot 05 contrats](LOT-05-CONTRATS-CGV.md), [05D Builder](LOT-05D-BUILDER-RESOLUTION.md), [05E preuves](LOT-05E-LECTURE-EXPORTS-PREUVES.md).

## 1. Une préparation contractuelle attachée au bon Devis
L'édition commerciale et contractuelle ne doit pas reconstituer un « contrat autonome ». L'objet juridique est le **Devis réel**, avec lignes et versions de prestations/CGV, paramètres de préparation, conditions financières et annexes.

- **Finaliser pour envoi** = contrôles et **gel** du snapshot contractuel correspondant au devis. Il ne vaut ni envoi réel ni signature/acceptation dans Abby.
- **Conditions particulières** et personnalisations des clauses affectent seulement l'instance du Devis courant, pas la clause canonique partagée.
- **Socle CGV commun unique**, modules spécifiques fondés uniquement sur lignes effectivement retenues et composants inclus applicables, non sur recommandations ignorées.
- Ordonnancement par rubrique juridique validée humainement (Lot 05C futur), pas empilement des textes par produit ou ordre d'ajout.
- `draft`, `frozen` et `historical_missing` doivent rester distincts ; ne jamais enrichir rétrospectivement un ancien Devis gelé ou sans snapshot.

## 2. Capacités existantes et cible
| Élément observé | Code | Adaptation V2 |
|---|---|---|
| Préparation contractuelle | `QuoteConditions` et `QuoteContractPreparationPanel` | Échéanciers, public, droits, garanties, renouvellement, rétractation selon dossier, informations administratives **enregistrées** et sources, liens clairs vers champs manquants |
| Contrôles avant finalisation | `QuoteFinalizationPanel`, `quotePreparation.get` `issues blocking/warning` | Résumé global avec liens exacts, mise à jour des contrôles après enregistrement, aucune certification juridique automatique |
| Synchronisation clause | `contractTerms.quotes.sync` | Présenter le **diff** clauses ajoutées, supprimées, personnalisées/orphelines et avertissements avant application, sans effacer les brouillons |
| Gel contractuel | `QuoteService.finalize` appelle `freezeQuote`, puis `finalized_at` dans savepoint | Confirmations, version de Devis non périmée, aucune acceptation/Client/Projet effectif |
| Lecture client | `QuoteClientPreview`, `ContractReadPanel` et `ContractPresentation` | Contrat naturel avec titres, numérotation/renvois, périmètre, prix/conditions de version exacte ; avertissements techniques à part |
| PDF de travail | `QuoteClientPreview.generatePdf` → `quotes.generatePdf` | Fonction **déjà existante** ; l'export **ne vaut pas** PDF accepté/signé Abby et ne change pas le statut |
| Historique | `quoteContractText`, `presentation` et snapshots | Ne jamais recalculer les CGV actuelles pour un gel vide ou historique absent |

## 3. Parcours de lecture et de validation
1. **Composer** les lignes et options volontaires. Les modifications des lignes signalent un recalcul nécessaire de clauses et éventuellement du périmètre du Projet provisoire.
2. **Renseigner les paramètres** : public pro/consommateur, montant/échéancier, conditions d'exécution, annexes et droits selon les prestations. Les données absentes restent « Manquant/À vérifier » ; ne pas créer de preuve fictive.
3. **Synchroniser en contrôlant** : afficher ce qui change dans l'instance des clauses, ce qui reste personnalisé, les orphelines, les collisions et lacunes ; comparaison avant enregistrement si techniquement possible.
4. **Prévisualiser la version client** : texte contractuel lisible, prix affichés égaux aux lignes du Devis, pas de codes internes.
5. **Geler pour envoi** seulement après contrôles bloquants réels ; ne jamais remplacer les champs locaux non sauvegardés, ni effacer les versions anciennes.
6. **Marquer envoyé** séparément, uniquement après l'envoi réel par le commercial hors Manager ; pas de promesse d'envoi automatique.
7. **Accepter** uniquement après preuve Abby explicite et contrôles du service, sans confondre avec la colonne « Finalisation » du pipeline Prospect.

## 4. Garde-fous UX et erreurs
- Les avertissements techniques sont **distincts des décisions juridiques**. Un message « techniquement complet » ne signifie pas « juridiquement conforme ».
- Les champs obligatoires varient selon public et prestations ; ne pas forcer artificiellement des questions consommateur sur un client professionnel ni l'inverse.
- L'avertissement doit ouvrir **la bonne section/champ**, sans perdre le texte d'une autre section ni naviguer avant accord UX-01 si dirty.
- **Ne pas utiliser** le PDF de travail comme preuve Abby et ne pas ajouter le montant d'une option non achetée.
- Si une nouvelle révision du Devis modifie les lignes ou conditions, **nouveau gel** pour cette révision uniquement ; ancienne reste inchangée.

## 5. Recette prévue (15 scénarios, non exécutés)
| ID | Parcours | Attendu |
|---|---|---|
| R06D-01 | Préparer contrat pour Devis multi-services | Socle commun unique, clauses réellement applicables |
| R06D-02 | Option affichée non achetée | Pas de clause dédiée à l'option |
| R06D-03 | Modifier une instance clause personnalisée | Bibliothèque source inchangée |
| R06D-04 | Changer public `professional/consumer` | Bon périmètre et contrôles adaptés |
| R06D-05 | Informations administratives incomplètes | Avertissements et liens vers vrais champs |
| R06D-06 | Paramètres de paiement/garantie incomplets | Refus seulement sur contrôle métier réellement bloquant |
| R06D-07 | Clause vide/orpheline/placeholder | Garde de finalisation préservée |
| R06D-08 | Confirmer finalisation pour envoi | Snapshot et CGV figés, pas d'acceptation |
| R06D-09 | Copier CGV avant signature | Contenu de la bonne version, aucun statut modifié |
| R06D-10 | Générer PDF de travail | N'est pas marqué accepté Abby |
| R06D-11 | Relire gel explicitement vide | Snapshot reste vide |
| R06D-12 | Relire historique sans snapshot | `historical_missing`, aucun rechargement depuis CGV courantes |
| R06D-13 | Réviser Devis finalisé | Nouveau Devis, ancien contrat/provenance inchangés |
| R06D-14 | Avertissements sur panneau alors qu'autre éditeur sale | Garde UX-01 et saisie préservée |
| R06D-15 | Trois thèmes × trois densités, clavier, SQLite isolé | Contrôles atteignables et rapport réel |

## 6. Questions encore ouvertes
**E164** rendu par rubriques après métadonnées 05C ; **E165** diff non mutateur de synchronisation CGV ; **E166** conditions bloquantes/alertes par audience et prestations ; **E167** cohérence du PDF réel avec la présentation/texte versionné ; **E168** protection UX-01 des sous-panneaux contractuels et reprises.

**La rédaction de ces contrôles ne constitue pas une revue juridique des clauses.**
