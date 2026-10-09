# Lot 03B — Annuaire Prospects, pipeline, Finalisation, Conversion et Projet prévisionnel

**Statut : cahier des charges CRM/UI, non codé ni testé.** Code vérifié : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, 09/10/2026.
**Sources associées :** [Lot 03](LOT-03-CRM.md), [03A — audit de code](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md), [02D — accueil/pipeline](LOT-02D-ACCUEIL-PILOTAGE.md), [07P — Projet prévisionnel](LOT-07-PROJET-PRE-SIGNATURE.md), [01E — garde des brouillons](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Trois vues distinctes, pas un entonnoir qui écrase les données
| Vue | Usage quotidien | Population |
|---|---|---|
| **Annuaire Prospects** | Créer/qualifier un dossier, rechercher entreprise/ville/métier, préparer une approche et une première action ; possibilité de lire toutes les fiches ouvertes non archivées. | Inclut `new`, actifs et cas visibles selon filtres, source identité unique. |
| **Parcours commercial** | Faire progresser **les Prospects actifs** par étapes commerciales **autorisées**, voir devis, prochaine action et relances. | Exclut gagnés effectivement convertis, perdus, archivés ; `new` exclu tant que la prospection n’a pas été démarrée (**E72 décidée**). |
| **Historique** | Consulter gagnés/convertis, perdus, clôturés et archivés ; motifs, dates, liens vers objets. | Historique conservé, jamais confusion « perdu » = « conversion ». |

**La septième étape visuelle Conversion est une vue d'historique intégrée au parcours, pas un statut actif ni une cible de drag & drop.** Les six premières étapes sont actives et la septième représente les dossiers effectivement devenus Clients, avec une présentation et période distinctes.

## 2. Correspondance candidat — règles métier validées vs non validées
| Colonne visuelle | Source(s) existante(s) candidates | Niveau de décision / garde |
|---|---|---|
| 1. **À qualifier** | `qualifying` seulement ; `new` demeure dans l’Annuaire | **E72 VALIDÉ** : `new` dans Annuaire uniquement ; `qualifying` dans le pipeline après « Démarrer la prospection » confirmé côté service. Aucun comptage implicite de `new`. |
| 2. **Besoins** | `need_identified` | Validation qualification côté CRM et progression prévue ; nom court du groupe, pas renommage backend. |
| 3. **Préparer le devis** | `quote_to_prepare`, `quote_to_send` | Devis en brouillon/prêt à envoyer selon workflow ; UI ne force pas une étape via drag non permis par le service. |
| 4. **Attente du retour** | `quote_sent`, `follow_up`, `waiting` | Relances dues/retard = **filtres transversaux** qui ne créent pas une colonne ou dupliquent les cartes. |
| 5. **Négociation** | `negotiation` | Devis révisé selon services ; conserve la provenance des lignes au projet prévisionnel. |
| 6. **Finalisation** | **Aucun `ProspectStage` actuel dédié** ; futur **signal volontaire et horodaté d'accord de principe** rattaché au dossier/devis courant | **Sens métier DÉCIDÉ** = accord obtenu, signature/dernières formalités en attente. **E73 technique ouverte** : définir un marqueur vérifiable (possiblement événement métier, après audit). Ne jamais utiliser `quote.finalizedAt` ni tout devis `sent` comme équivalent. |
| 7. **Conversion** | `prospect.clientAccountId` réel, `won_at`, événement de conversion vers Client | **DÉCIDÉ** : historique consultable, pas dossier actif, lien Client exact, période à choisir, aucune conversion automatique lors du drag/accord de principe/pré-projet. |

**Risque crucial** : `PROSPECT_STAGES` compte 11 valeurs et `CrmService.MANUAL_PROSPECT_STAGE_TRANSITIONS` limite les transitions. Aucun changement de colonne ne doit effectuer directement un `update stage`, forcer `won` ou contourner les validations. L'option Finalisation doit être reliée à une **intention métier explicitement confirmée** plutôt qu'à une fausse étape SQL ajoutée à la hâte.

## 3. Interface de la carte Prospection
- **En-tête** : organisation/personne + contact principal + pictogramme. Une éventuelle température `cold/neutral/warm/hot` reste un marqueur de **couleur subtil**, non un libellé imposé « Chaud / Tiède / Froid » sur toutes les cartes.
- **Contexte** : prestation/besoin prioritaire, prochaine action et date ; état d'un **devis actuel** seulement si existant, avec montant et échéance **qualifiés**.
- **Projet prévisionnel** : si devis courant déjà préparé, petite indication **« Projet en préparation — devis non signé »**, lien **Ouvrir le Projet** ; ne doit pas changer de colonne ni embellir le KPI conversion.
- **Alerte de révision** : si le devis du dossier change après préparation, signal **« Devis modifié — projet à vérifier »**, avec accès comparer/synchroniser, sans destruction automatique.
- **Actions** : ouvrir fiche rapide au clic, Agrandir, créer une relance/ouvrir un devis, Préparer Projet depuis un **devis non signé éligible**. Ne pas lancer de génération via ouverture de carte, cliquer sur badge ou glisser une carte.
- **Etats** : suivi des relances en retard perceptible sans couleur seule ; aucun nouveau compteur inventé par présentation.

## 4. Gestes de navigation et changements d'étape
1. Un **clic carte** ouvre la fiche rapide, avec contexte de recherche/filtre et brouillon préservés ; **Agrandir** conserve l'identité.
2. Un **drag & drop** ou changement de colonne n'est disponible **que** si le service `CrmService.changeStage` accepte la transition réelle. Les colonnes regroupant plusieurs statuts doivent afficher une décision lisible sur la destination technique valide, pas choisir arbitrairement la première.
3. La qualification incomplète peut nécessiter une confirmation humaine prévue par le service ; une saisie dirty est protégée avant démontage de la fiche.
4. Passer en « Finalisation » exigera une action **« Accord de principe confirmé »** explicite, datée, rapportée au devis courant ; ni auto-passage depuis Négociation ni signature fictive. Si aucun support fiable n'est implémenté, la colonne doit rester non-assignable et les cartes ne doivent pas y être projetées par déduction.
5. « Conversion » affiche des clients réellement issus d'un Prospect ; **jamais une destination de drag & drop**. La conversion suit la confirmation du Devis officiel Abby, pas l'enregistrement d'un accord de principe.
6. Un Prospect marqué `lost` n'est pas un Client ; il reste dans Historique avec motif, date et possibilité de réouverture selon service métier.
7. **Une création de Projet** depuis `draft/sent/viewed` est **indépendante** des transitions de colonnes. Le choix de blueprint provient des lignes du Devis, jamais des simples besoins Prospect.

## 5. Workflow transversal Devis/Projet dans la fiche Prospect (cible)
| État | Commande proposée | Résultat réel attendu |
|---|---|---|
| Prospect sans Devis | **Préparer un devis** | Ouvrir le parcours Devis/qualifications, pas créer Projet ou Client |
| Devis `draft` ou `sent/viewed` non signé, sans Projet | **Préparer le Projet** | Aperçu en lecture seule des lignes, versions, quantités, éventuels Sites/Pages et prérequis ; confirmation crée un Projet `provisional` |
| Devis non signé, Projet prévisionnel existant | **Ouvrir le Projet** | Même `projectId`, badge non signé, dossier commercial et activité |
| Devis révisé, Projet existant | **Comparer au devis actuel**, **Adapter** ou **Repartir de zéro** | Conflits et travaux conservés, remplacement sécurisé si choisi et possible, un seul Projet courant |
| Accord de principe confirmé | **Suivre la signature** | Indicateur Finalisation (après E73), relance documentée ; Projet toujours prévisionnel |
| Signature confirmée dans Abby | **Accepter le devis** via contrôles officiels | Service métier convertit/rattache Client, fige Projet actuel après résolution des conflits |
| Conversion acquise | **Ouvrir le Client** et **Voir le Projet** | Historique du Prospect consultable, documents et projet dans fiche Client |

Le bouton de préparation ne peut être invisible simplement parce que l'étape est « Attente du retour » ou « Négociation ». Vérifier les autorisations du devis courant, non la colonne visuelle.

## 6. Compteurs, filtres et statistiques
- **Une carte = un Prospect actif** dans une seule colonne au maximum. Si plusieurs devis du même Prospect, utiliser **le dossier/révision commerciale courante**, pas le premier devis retourné par ordre accidentel.
- Les filtres `relaunch` et `overdue` utilisent les actions ouvertes réelles ; un Prospect avec trois relances ne devient pas trois cartes.
- **Conversion historique** : population `prospect.clientAccountId` vérifiée ; envisager filtre date (mois, trimestre, tout l'historique) distinct des actifs. **Période non décidée** : ne pas présenter comparaison chiffrée « pipeline aujourd'hui » contre « conversions toutes années » sans libellés.
- `new` reste hors pipeline actuel jusqu'à démarrage ; **E72 est décidé et doit être respecté** par toute nouvelle agrégation (et synchronisé avec l'Accueil Lot 02D).
- Les KPI de devis doivent distinguer « devis à préparer » (Prospect) et factures Abby ; Projet non signé ne crée pas chiffre d'affaires acquis.

## 7. Étapes de développement proposées après autorisation
| Étape | Travail | Livrable |
|---|---|---|
| 03B.1 | Inventaire de tous les statuts, événements Devis/Prospect, transitions UI et service | Matrice `vue→transition→service→refus→test` |
| 03B.2 | Appliquer E72 validé et instruire E73 avec les champs/événements déjà existants | Projection complète sans nouveau stade backend |
| 03B.3 | Préparer le pipeline 6 actifs + 1 historique dans atelier fictif | Cartes, états vides, filtres/compteurs |
| 03B.4 | Raccorder navigation Prospect → Devis → Projet prévisionnel, sans créer un deuxième Projet | Actions exactes, preview/confirmation, pas de mutation au clic |
| 03B.5 | Raccorder Finalisation et Conversion historique avec contrôles de révisions/consentement | Traces, Client exact et refus des transitions prématurées |
| 03B.6 | Tests 3 thèmes × 3 densités, clavier, fenêtre réduite, UX-01, SQL fixtures, service et recette humaine | Bilan sourcé, aucune perte de données |

## 8. Recette à exécuter lors de l'implémentation
| ID | Scénario | Attendu |
|---|---|---|
| R03B-01 | Création Prospect en Annuaire | `new`, pas de Client ni de carte active forcée |
| R03B-02 | Démarrer la prospection | Transition service `qualifying` et lien Annuaire conservé |
| R03B-03 | Afficher six colonnes actives + historique Conversion | Tous intitulés validés et bons ensembles, zéro duplicata |
| R03B-04 | Déplacer carte vers transition interdite | Refus service sans modification optimiste de donnée |
| R03B-05 | Qualification incomplète | Garde/dérogation humaine existante préservée |
| R03B-06 | Température et date de relance | Statut inchangé, urgence lisible sans couleur seule |
| R03B-07 | Relances multiples | Une carte et un compteur par Prospect, pas trois |
| R03B-08 | Devis brouillon non signé → Préparer Projet | Preview puis même Projet provisoire, aucun statut Client |
| R03B-09 | Projet préparé depuis Négociation | Carte demeure en Négociation et affiche Projet provisoire |
| R03B-10 | Changer fortement lignes de devis | Comparatif et choix Adapter / Repartir de zéro |
| R03B-11 | Répéter préparation ou sync | Pas de second Projet lié au même dossier ni page doublée |
| R03B-12 | Marquer accord de principe | Finalisation uniquement sur signal volontaire tracé, sans `quote.accepted` |
| R03B-13 | Envoyer/voir un Devis sans accord | **Ne passe pas automatiquement** en Finalisation |
| R03B-14 | Signature Abby et acceptation du devis courant | Client créé ou rattaché exactement une fois, Projet figé |
| R03B-15 | Glisser carte dans Conversion | Impossible ; aucun faux Client |
| R03B-16 | Historique gagné/perdu/archivé | Perdus distincts des convertis, liens et motifs intacts |
| R03B-17 | Conversion d'un Prospect déjà lié à Client | Un seul lien Client, pas de doublon de conversion |
| R03B-18 | Revenir sur fiche après Agrandir et fermer | Pas de perte de brouillon ni de filtres ; garde UX-01 |
| R03B-19 | Petit écran / 3 thèmes × 3 densités | Cartes lisibles Compact 14 px, toutes étapes accessibles |
| R03B-20 | Tests ciblés/complète, SQL, preview périmé | Résultats datés/SHA, rollback et aucune donnée Validation-MSI |

## 9. Arbitrages et limites
- **E72 CLOS** : `new` reste dans l’Annuaire et n’entre dans la première colonne « À qualifier » qu’après « Démarrer la prospection » et succès du service `new → qualifying`.
- **E73 OUVERT TECHNIQUEMENT** : où et comment enregistrer un accord de principe daté/versionné/annulable sans le confondre avec `quotes.finalize` ni introduire de nouveau `ProspectStage`.
- **Conversion historique DÉCIDÉE** ; période du compteur encore à cadrer.
- **Projet prévisionnel et régénération DÉCIDÉS** ; UI d'accès et remplacement sûr de Projet entier pas encore livrés, voir [07P](LOT-07-PROJET-PRE-SIGNATURE.md).
- La protection UX-01 #83 n'est pas universelle sur les 17 modules ; **ne pas déclarer Clients/Projets complètement protégés** sans audit/implémentation et tests.

**Ce document est une spécification : ni nouvelle colonne en code ni nouvelle base, ni conversion Client, ni copie ni suppression de Projet n'ont été effectuées.**

### Observation transversale — Lot 06, conflit E72 réel (audit du 09/10/2026)
**La cible E72 reste validée, mais n'est pas encore garantie par le backend actuel :** dans `src/main/commercial/QuoteService.ts`, `create` fait `UPDATE prospects SET stage='quote_to_prepare'` sur les Prospects non gagnés/perdus, **y compris `new`**, sans clic « Démarrer la prospection ». Ce fait est incompatible avec « `new` reste dans l'Annuaire jusqu'au démarrage volontaire ». Corriger **le service**, couvrir `new + createWithLines`, puis contrôler les agrégations pipeline/Accueil. **Spécification et tests à venir**, rien n'est modifié ici. [Audit 06A](LOT-06A-MATRICE-DEVIS-ET-ETATS.md).
