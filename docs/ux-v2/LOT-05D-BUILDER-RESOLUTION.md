# Lot 05D — Builder CGV du Devis : assemblage, alertes et gel sans rétroactivité

**Statut : conception documentaire, non implémentée ni recettée.** Base auditée `main@eb252d5c` (09/10/2026).  
Références : [05A](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05B](LOT-05B-BIBLIOTHEQUE-EDITOR.md), [05C](LOT-05C-RUBRIQUES-CONDITIONS.md), [05E](LOT-05E-LECTURE-EXPORTS-PREUVES.md), [06 Devis](LOT-06-DEVIS-ABBY.md), [07P Projet](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Contrat d'usage
Le Builder n'est **pas un générateur de contrat indépendant** : il prépare la partie contractuelle **du Devis réel**, à partir des lignes et versions choisies, et de paramètres renseignés pour ce Devis. Il ne doit pas rédiger de promesse juridique non vérifiée, accepter le Devis, créer un Client ou transformer un pré-projet en commande.

**Garde majeure existante** : `QuoteContractBuild.snapshotState` est `draft/frozen/historical_missing`. L'état `frozen` correspond à une photographie contractuelle **y compris si le texte était vide** ; `historical_missing` constate une absence historique, sans réassemblage depuis les CGV d'aujourd'hui.

## 2. Existant vs cible
| Source | Comportement observé | Cible à réaliser |
|---|---|---|
| `ContractTermsService.getQuoteBuild` | Lit clauses, compile, renvoie warnings, audience, état de snapshot et références de types. | Montrer les avertissements liés **aux vraies clauses du Devis**, et distinguer warning de refus métier. |
| `syncQuoteInternal` | Résout clauses désirées, conserve la personnalisation locale des instances, marque orphelins, désactive les orphelins **non personnalisés**, sauvegarde transactionnellement. | Mise à jour sur demande, **aperçu du diff avant impact** ; avertissement sur orphelins personnalisés, aucun retrait silencieux de leur texte. |
| `ContractTermsService.compile` | Numérote les clauses `enabled` selon `sortOrder` ; pas de classement par rubriques juridiques. | Section/rang/numérotation V2 **après métadonnées validées 05C**, sans rupture des snapshots anciens. |
| `ContractTypeService.quoteReferences` | Récupère références de types/versions du Catalogue et composants **non optionnels** de l'offre ; les lignes optionnelles réellement achetées entrent comme lignes Devis. | Afficher provenance de chaque clause, résoudre ambiguïtés types, **ne pas ajouter les options non choisies**. |
| `ContractTypeService.orderWarnings` | Signale incompatibilité d'ordres entre types sur clauses partagées, propose réordonnancement humain. | Ajouter des alertes sémantiques de proximité/incompatibilité **sans fusion automatique**. |
| `ContractTermsService.freezeQuote` | Prend un payload de préparation `QuoteContractPreparationService.freezePayload`, peut refuser l'absence de socle publié/clauses vides, placeholder ou orphelin, puis fige version/texte/clauses/types/présentation via savepoint. | Rendre les contrôles et la résolution **visibles avant la demande de gel**, et distinguer clairement « Devis préparé / finalisé pour envoi » de « signé ». |
| `ContractTermsBuilder.tsx` | Aperçu, bibliothèques, instances éditables, clauses particulières, synchronisation, avertissements, lecture et copie. | Mise en page 3 zones **sommaire gauche / lecture contractuelle centrale / alertes-provenance droite**, conservant le même `contractTerms.quotes`. |
| `QuoteContractPreparationService` | État/valeurs administratives, paiement, public, consentement explicite, garanties, droits, renouvellement, annexes et pièces ; renvoie `issues` `blocking/warning`. | Rendre les issues navigables vers leur **champ réel**, conserver saisies non sauvées et preuves ; aucune validation juridique implicite. |
| `ContractReadPanel` / `formatContractPresentation` | Lecture en sections **par origine** et paramètres ; `contractCopy('abby'/'contract'/'all')`. | Lecture client naturelle ordonnée selon **rubriques** et renvois validés, sans codes Abby / IDs / placeholders. |

## 3. Pipeline cible de composition du Devis courant
1. **Contrôler le Devis** : état et révision courants, public `professional/consumer`, lignes/quantités/versions, composants inclus et options **réellement ajoutées**.
2. Charger **CGV communes publiées** adaptées au public + clauses spécifiques liées aux prestations retenues ; **une seule occurrence d'une clause canonique/version** même si plusieurs lignes la déclenchent.
3. Prévisualiser un **diff** entre l'instance du Devis et la composition maintenant applicable (nouvelle clause, retirée, devenue orpheline, personnalisée, version différente).
4. **Ne pas écraser** un texte d'instance personnalisé ; exiger une décision lorsqu'un lien cesse de s'appliquer ou que deux versions/règles sont en conflit.
5. Organiser selon **rubriques métier 05C**, position/rang réellement validés ; pas par simple ordre des produits ou des modules.
6. Examiner les **manques** : socle, audience, clause vide, placeholder, conflits d'ordre, clauses incompatibles, documents/pièces requis, paramètres de consentement et informations administratives.
7. Prévisualiser le document final avec **numéros, sommaire, renvois et annexes cohérents**.
8. Après résolution des issues **bloquantes définies selon dossier**, permettre la finalisation contrôlée et le **gel de la version exacte** (texte, origines, paramètres et présentation). Une simulation ou copie Abby ne réalise **pas** ce gel.
9. Le Devis officiel est ensuite transmis/accepté dans la procédure Abby ; **cette acceptation reste un acte distinct** de la préparation et du gel.
10. Si le Devis change après finalisation : **nouvelle révision/duplication explicite**, jamais réécriture des CGV figées ; comparer l'effet éventuel sur le Projet **prévisionnel** et synchroniser sans perte selon 07P.

## 4. Interface Builder (cible)
| Zone | Contenu | Comportement |
|---|---|---|
| **Sommaire gauche** | Rubriques et sous-clauses activées, statut, ordre réel, alertes, capacité de focus | Clic navigue au paragraphe exact, pas de démontage de brouillon |
| **Lecture centrale** | Une présentation client cohérente, clauses communes et spécifiques regroupées **par sujet**, montant/conditions/annexes selon Devis | Aucun code Abby, ID technique, marqueur de mise au point ni répétition artificielle |
| **Panneau droit** | Public, version, source, offres déclenchantes, revue, conditions, conflits et résolution proposée | Tous les contrôles applicables, choix explicite en cas d'ambiguïté |
| **Barre d'actions** | « Comparer / Synchroniser » ; « Modifier cette clause dans le Devis » ; « Ouvrir la bibliothèque » ; « Aperçu », « Copier pour Abby », statut « Gelé » | Les éditeurs ne modifient **jamais** la bibliothèque source par simple modification du Devis |

Les actions de validation/destruction respectent UX-01 (registre du #83 une fois intégré), droits métier du service, confirmation et vérification du retour IPC. La modification d'ordre manuelle doit afficher ses conséquences et **ne pas contourner** des contraintes de clause ou de type publiées.

## 5. Gestion de trois cas historiques critiques
| Cas | Affichage | Interdit |
|---|---|---|
| **`draft`** | Instances éditables, warnings, version calculée et aperçu pouvant changer jusqu'au gel | Prétendre le Devis accepté ou les clauses revues juridiquement |
| **`frozen` avec texte vide** | « Snapshot contractuel figé — vide », contenu vide effectivement stocké, preuves séparées | Recompiler avec CGV actuelles pour « améliorer » le texte |
| **`historical_missing`** | « Devis historique sans snapshot contractuel conservé », pièces PDF disponibles séparément le cas échéant | Générer rétrospectivement un faux texte contractuel qui n'a jamais été présent |

## 6. Contrôles d'applicabilité à valider humainement
- Le **socle** réellement requis pour le public visé doit être publié et lié au devis ; les brouillons ne valent pas clauses applicables.
- Clauses spécifiques des prestations **effectivement retenues** : pas de suggestions 04D, ni options non achetées.
- Lorsqu'une prestation nécessite un document annexe, son **rôle de pièce**, statut, empreinte et disponibilité doivent être visibles ; manquant = refus **si** juridiquement ou métier bloquant et validé comme tel.
- Public professionnel/consommateur, droit de rétractation, début anticipé, contenus numériques, garanties, paiements et droits font l'objet de contrôles appropriés **sans conseil juridique supposé exact**.
- La date « accord de principe / Finalisation » du pipeline Prospect n'est **pas** la preuve d'acceptation du Devis.

## 7. Recette proposée (16 cas, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R05D-01 | Devis brouillon Site vitrine + Contenu | Socle unique, clauses publiées et liens corrects |
| R05D-02 | Ajouter maintenance | Modules propres et rubrique financière / récurrente cohérente |
| R05D-03 | Option non achetée | Aucun module de cette option |
| R05D-04 | Deux services invoquent même clause/version | Une occurrence, plusieurs origines |
| R05D-05 | Modifier instance locale | Bibliothèque intacte |
| R05D-06 | Retirer prestation avec instance personnalisée | Alerte orphelin et aucune suppression silencieuse |
| R05D-07 | Renommer/retirer version source | Devis courant averti, figés inchangés |
| R05D-08 | Manque socle publié | Blocage si `freezePayload` exige socle, jamais ajout des brouillons |
| R05D-09 | Clause vide / placeholder | Message vers clause, refus de gel selon garde existante |
| R05D-10 | Conflit d'ordre entre types | Décision humaine, pas ordre inventé |
| R05D-11 | Confirmer l'aperçu puis modifier ligne Devis | Aperçu périmé reconnu ; nouvelle confirmation requise |
| R05D-12 | Copier pour Abby | Texte propre, aucun changement statut Devis/CGV |
| R05D-13 | Finaliser Devis préparé | Snapshot exact figé, preuve distincte de signature |
| R05D-14 | Relire snapshot gelé vide | Le vide demeure vide, ne devient pas texte courant |
| R05D-15 | Relire Devis historique sans snapshot | `historical_missing` explicitement sans reconstruction |
| R05D-16 | Recette 3 thèmes/densités + SQLite fictif + garde de sortie | Focus/onglets et données conservés, Validation-MSI intacte |

## 8. Points encore ouverts
- **E134** : matrice de correspondance `sectionKey/rank` et `ContractPresentation`, sans réécriture du snapshot historique.
- **E135** : diff de synchronisation sans effet métier avant confirmation et garde des clauses locales personnalisées.
- **E136** : résolution du conflit de types et collisions textuelles juridiques, sans détection faussement certifiée.
- **E137** : signatures/acceptations Abby, références et preuve d'accord selon règles réellement vérifiées.
- **E138** : interface trois panneaux accessible, lecture cliente sans codes et retours fiche bibliothèque.
- **E139** : interaction avec les Devis révisés et leurs Projets provisoires, sans gel prématuré.

**Ce dossier ne modifie ni texte contractuel, ni source SQL, ni document Abby : il prépare une future implémentation sur code et fixtures isolées.**
