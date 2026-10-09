# Lot 06B — Liste des devis, fiche rapide, assistant six étapes et édition sûre

**Statut : conception UX V2 uniquement, non développée.** Code de référence `main@eb252d5c` (09/10/2026).  
Références : [06A audit](LOT-06A-MATRICE-DEVIS-ET-ETATS.md), [01C fiches](LOT-01C-FICHES-PANNEAUX.md), [01D tableaux](LOT-01D-TABLEAUX-VUES.md), [01E garde UX-01](LOT-01E-FORMULAIRES-CONFIRMATIONS.md), [CRM](LOT-03-CRM.md).

## 1. Liste et consultation
- **Liste à gauche, fiche détail à droite**, dimension redimensionnable et restaurable, avec bouton **Agrandir** sans perdre ID, filtres, scroll, onglet ni saisies.
- Colonnes : numéro, Prospect/Client exact, objet, état officiel, révision/dossier, total proposé, dernière action, validité, projet prévisionnel/confirmé si lié. Tri, filtres, colonnes visibles et vues personnalisées = **préférences UX**, pas mutations métier.
- Conserver la recherche par numéro, destinataire, objet, statuts ; ouvrir **le bon Devis `id`**, pas le premier match de nom. Afficher la population comptée et état vide réel.
- Actions contextualisées : **Ouvrir**, **Prévisualiser**, **Créer une révision**, **Dupliquer**, **Marquer envoyé/vu**, **À négocier**, **Confirmer accepté dans Abby**, **Refuser/expirer**, uniquement quand autorisées par le service.
- **E152** : supprimer le libellé générique « Valider » pour l'action `quotes.accept`. Une confirmation doit mentionner les effets **Client, contrat, projet et opérations vendues**, et identifier la révision.

## 2. Assistant six étapes — existant à conserver
| Étape | Contenu réel actuel | Amélioration V2 |
|---|---|---|
| 1. **Prospect / Client** | Choix type/dossier, suggestion de public `professional/consumer`. | Sélection ID exact, raccourci CRM ; `new` peut recevoir un Devis **sans être déplacé automatiquement** avant Démarrer (écart E153). |
| 2. **Projet / Besoin** | Objet + résumé besoin, choix possible d'une prestation pour remplir les textes. | Un objet de devis n'est **pas** un Projet créé ; cohérence avec besoins réels et retour fiche. |
| 3. **Offre de départ** | Offre ou Service facultatif, tarif proposé saisi, paramètres de catalogue. | Quatre offres principales mises en valeur ; **codes Abby secondaires** ; si sur devis, prix explicite nécessaire ; aucune insertion automatique sans validation. |
| 4. **Services / lignes complémentaires** | `QuoteDraftLines` et lignes libres versionnées. | Même catalogue que Prospection, catégories FR, inclus/options/conseils distingués, quantités/prix révisables. |
| 5. **Conditions** | Public, texte particulier, validité jours, acompte %, délai. | Afficher projet d'échéancier, exigences annexes et contrat du Lot 05 ; ne pas confondre `acompte`/`arrhes`, conditions commerciales et droit applicable. |
| 6. **Prévisualisation** | Liste de lignes, prix catalogue et total partiel, puis création du Devis. | **Montants effectivement proposés** et remises, cohérence centimes, aperçu avant écriture ; état client et lignes explicites. Corriger E151. |

Les étapes demeurent navigables en arrière, sans perdre données saisies et sans création anticipée. L'utilisateur peut **créer un Devis libre** ou partir d'une Offre du Catalogue.

## 3. Fiche Devis après création (mode travail)
Ordre cible dans la fiche agrandie :
1. **Résumé** : numéro, état, destinataire, besoin, montant contractuel, validité, statut prévisionnel du Projet, actions prioritaires.
2. **Composition** : lignes, tarifs/quantités, remises et justifications, composition incluse/options d'Offre.
3. **Conditions** : texte particulier/prérequis, préparation contractuelle, contraintes.
4. **CGV et documents** : Builder, présentation client, avertissements, pièces.
5. **Abby & décisions** : bloc copier, suivi envoyé/vu, preuve d'acceptation, import PDF officiel et historiques.
6. **Projet lié** : préparation non signée, comparaison/adapter/repartir de zéro, puis confirmation.

**Ne pas reconstruire** une deuxième fiche métier ; réorganiser les panneaux réels `QuoteConditions`, `QuoteOfferOptionsPanel`, `QuoteClientPreview`, `ContractTermsBuilder`, `QuoteAbbyPanel`, `QuoteProjectPanel`, `QuoteContractDocumentPanel`.

## 4. Protections des modifications non enregistrées
- L'assistant garde champs, `wizardTerms`, lignes et prix lorsque l'on change d'étape, ferme l'assistant, change de module ou ouvre un autre Devis ; l'enregistrement du Devis est **une action explicite**.
- Le `QuoteLineEditor`, les conditions et la préparation CGV s'enregistrent via des services distincts. **Une sauvegarde de ligne ne doit pas jeter un brouillon CGV non enregistré**, ni vice versa.
- `QuotesPage` possède des fermetures par Escape, clic hors panneau et bouton ×. **Toutes doivent être connectées au registre UX-01** de #83 une fois intégré ; pas de seconde garde. Un bouton « Annuler » dans un sous-éditeur demande confirmation si le texte change réellement.
- Chargements `refresh`, événements de changement, re-sélection d'un Devis : **ne pas remplacer un `dirty` local** par un snapshot réseau plus tardif.
- Une erreur d'enregistrement ne ferme pas l'éditeur, ne change pas d'ID sélectionné et n'affiche pas « sauvegardé » avant retour du service ; prévenir le double clic, rejeu sécurisé.
- Les préférences de disposition restent indépendantes des champs de Devis, et l'aide `?` est toujours disponible au clic/clavier même sans survol.

## 5. Recette (17 scénarios prévus, non exécutés)
| ID | Test | Attendu |
|---|---|---|
| R06B-01 | Rechercher numéro exact dans une liste filtrée | Bon Devis, contexte liste préservé |
| R06B-02 | Sélectionner Prospect homonyme | Bon `prospectId`, coordonnées non dupliquées |
| R06B-03 | Ouvrir détail puis Agrandir/Réduire | Même ID/brouillons/onglet |
| R06B-04 | Créer Devis libre sans Offre initiale | Devis autorisé selon règles de lignes et prix |
| R06B-05 | Parcourir 6 étapes puis revenir étape 2 | Toutes les saisies intactes |
| R06B-06 | Modifier conditions/validité | Messages précis en cas de champ invalide |
| R06B-07 | Aperçu après prix sur devis personnalisé | Affiche exactement le prix qui sera créé |
| R06B-08 | Fermer l'assistant sale | Garde UX-01, choix continuer par défaut |
| R06B-09 | Fermer la fiche sale par Escape | Pas de perte de saisie |
| R06B-10 | Fermer par clic hors du panneau | Même garde, aucune suppression silencieuse |
| R06B-11 | Basculer entre deux devis avec éditeurs ouverts | Brouillons conservés ou confirmation de sortie |
| R06B-12 | Échec réseau en édition ligne | Saisie et édition persistent, erreur |
| R06B-13 | Liste « Valider » | Action renommée, confirmation de preuve et conséquences |
| R06B-14 | Fiche Devis avec Projet prévisionnel | Badge « non signé », pas de création Client |
| R06B-15 | Dossier Client et ancien devis accepté | Historique conservé en lecture seule |
| R06B-16 | Neuf thèmes/densités, clavier, fenêtre étroite | Compact texte principal >=14px et contrôles accessibles |
| R06B-17 | Tests vitest/ciblés/IPC sur fixtures | Compte rendu SHA réel, Validation-MSI intacte |

## 6. Points techniques à traiter
**E154** conservation des brouillons de l'assistant et sous-éditeurs sur toutes les sorties ; **E155** colonne révision/projet et persistance des filtres ; **E156** synchronisation de l'aperçu et données enregistrées ; **E157** navigation vers Devis exact en CRM/Client/recherche ; **E158** ergonomie clavier/9 modes et actions destructrices, sans casser UX-01.

**Statut : documentation, pas prototype ou nouvelle UI livrée.**
