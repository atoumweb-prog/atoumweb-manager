# Builder CGV V1 — feuille de route

## Principe métier

AtoumWeb Manager ne gère pas un contrat séparé du devis.

Le devis rassemble :
- les prestations et prix proposés ;
- les paramètres commerciaux ;
- les Conditions Générales de Vente applicables ;
- les clauses propres aux prestations ;
- les éventuelles conditions particulières.

La finalisation puis l'acceptation du devis valent référence contractuelle. La version exacte des CGV intégrée au devis est figée afin qu'une évolution ultérieure de la bibliothèque ne modifie jamais l'historique.

Abby reste l'outil d'édition/finalisation externe du devis. AtoumWeb Manager prépare le texte contractuel final et fournit une action « Copier pour Abby ».

## Architecture V1

### 1. Bibliothèque de clauses

Deux familles de clauses versionnées :
- **Socle commun** : clauses fixes applicables à tous les devis. Elles ne sont ni désactivables ni modifiables au niveau d’un devis ; une évolution passe par une nouvelle version publiée dans la bibliothèque.
- **Clauses prestation** : clauses déclenchées par une ou plusieurs prestations du catalogue.

Une clause possède :
- un code stable ;
- un titre ;
- un type ;
- un statut ;
- plusieurs versions ;
- une seule version publiée courante.

Une nouvelle version ne modifie jamais les devis déjà finalisés.

### 2. Associations avec le catalogue

Une clause prestation peut être liée à plusieurs Services ou Offres du catalogue.

Lors de la préparation d'un devis :
- les prestations directes sont prises en compte ;
- les services inclus dans une Offre sont également pris en compte ;
- une même clause requise par plusieurs prestations n'apparaît qu'une seule fois ;
- les composants optionnels non sélectionnés ne déclenchent pas leurs clauses.

Les anciens champs `specialTerms` du catalogue restent utilisables comme compatibilité de transition tant que la bibliothèque structurée n'a pas remplacé leur contenu.

### 3. Instance contractuelle du devis

Le devis possède sa propre liste de clauses.

Chaque instance mémorise :
- son origine (socle, prestation ou particulière) ;
- la version source ;
- son texte ;
- son ordre ;
- son activation ;
- les prestations qui l'ont déclenchée ;
- si elle a été adaptée spécifiquement pour ce devis.

Modifier le texte d'une clause dans un devis n'altère jamais la bibliothèque générale.

### 4. Synchronisation intelligente

Tant que le devis reste brouillon :
- les nouvelles clauses requises sont ajoutées ;
- une clause commune à plusieurs prestations est dédupliquée ;
- les adaptations propres au devis sont conservées ;
- une clause dont la prestation disparaît est signalée comme orpheline et désactivée automatiquement si elle n'avait pas été personnalisée ;
- elle peut être réincluse volontairement.

Après finalisation, la structure contractuelle n'est plus modifiable. Une modification commerciale passe par la duplication du devis.

### 5. Conditions particulières

Un devis peut recevoir librement des clauses particulières :
- délai exceptionnel ;
- livraison en plusieurs phases ;
- remise ou condition particulière ;
- prestation offerte ;
- organisation spécifique convenue avec le client ;
- tout autre cas non couvert par le socle ou le catalogue.

Ces clauses appartiennent uniquement au devis concerné.

### 6. Sortie Abby

Le Builder produit un texte final numéroté :

```text
CONDITIONS GÉNÉRALES DE VENTE – ATOUMWEB

1. [clause du socle]
...

2. [clause liée à la prestation]
...

3. [condition particulière]
...
```

Une action copie ce texte dans le presse-papiers pour le coller directement dans le champ « Conditions Générales de Vente » d'Abby.

### 7. Snapshot contractuel

À la finalisation du devis, le Manager fige :
- le texte final complet ;
- la liste des clauses incluses ;
- leur texte exact ;
- leur ordre ;
- leurs versions et origines.

Le snapshot reste inchangé même si la bibliothèque CGV ou le catalogue évoluent ensuite.

Le devis accepté utilise ce snapshot comme référence contractuelle.

## Compatibilité avec l'existant

Le système conserve :
- les snapshots existants des lignes catalogue ;
- le workflow Brouillon → Finalisé → Envoyé → Accepté/Refusé ;
- la conversion Prospect → Client ;
- la création du projet depuis le devis accepté ;
- les PDF de devis ;
- les anciens `specialTerms` comme mécanisme de migration progressive.

Il n'est pas créé de module « Contrats » parallèle.

## Recette V1

La recette doit valider notamment :
1. ajout automatique du socle ;
2. ajout des clauses d'une prestation ;
3. déduplication d'une clause partagée ;
4. prise en compte des services inclus dans une Offre ;
5. adaptation d'une clause pour un seul devis ;
6. nouvelle version d'une clause sans écrasement d'une adaptation ;
7. retrait d'une prestation et gestion de la clause orpheline ;
8. ajout/suppression/réordonnancement de clauses particulières ;
9. copie du texte final pour Abby ;
10. prévisualisation et PDF avec les CGV ;
11. gel des CGV à la finalisation ;
12. impossibilité de modifier le devis finalisé ;
13. conservation des CGV après acceptation ;
14. duplication d'un devis en conservant ses adaptations comme base de négociation.

## Étapes suivantes

### V1.1 — Contenu contractuel AtoumWeb

Construire puis faire relire le contenu réel :
- socle CGV AtoumWeb ;
- création de site vitrine ;
- e-commerce ;
- landing page ;
- maintenance WordPress ;
- SEO / création de contenu ;
- identité visuelle / retouche ;
- sites de mariage ;
- prestations ponctuelles.

Le Builder fournit la mécanique ; les textes juridiques doivent être validés avant leur utilisation commerciale réelle.

### V1.2 — Dossier documentaire — implémenté dans la branche

Après acceptation :
- le PDF Abby accepté peut être importé directement depuis la fiche Devis ;
- il est classé dans les documents Client, catégorie `contract` ;
- le devis conserve le lien vers le document actif, sa date de rattachement et la référence Abby ;
- le PDF peut être ouvert directement depuis la fiche Devis ;
- une nouvelle version peut être importée sans supprimer les anciens documents du dossier Client.

Depuis la fiche Client, l’onglet **Contrats** liste les devis acceptés. Il ouvre directement le devis contractuel et, lorsqu’il existe, le PDF Abby rattaché.

### V1.3 — Confort et contrôle

Évolutions possibles :
- comparaison entre deux versions d'une clause ;
- signalement d'un devis utilisant une ancienne version, sans modifier son snapshot ;
- presets de clauses particulières ;
- contrôle de complétude avant finalisation ;
- vue dédiée de la bibliothèque CGV dans les Référentiels si l'usage justifie de la sortir de la fiche Devis.
