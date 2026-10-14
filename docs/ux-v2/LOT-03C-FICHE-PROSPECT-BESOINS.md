# Lot 03C — Fiche Prospect, besoins, pré-devis et entrée vers Projet prévisionnel

**Statut : spécification UX/UI V2 ; aucune application modifiée, aucun test exécuté.**
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` au 09/10/2026.**
**Sources liées :** [Lot 03](LOT-03-CRM.md), [03A](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md), [03B](LOT-03B-PROSPECTION-PIPELINE.md), [07P](LOT-07-PROJET-PRE-SIGNATURE.md), [Lot 04 Catalogue](LOT-04-CATALOGUE.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Lot 01E formulaires](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Expérience attendue
- **Fiche rapide au premier clic**, **Agrandir** pour travailler, et fenêtre « Référence Prospect » détachable si disponible ; la même identité et les brouillons doivent être conservés.
- Ordre fonctionnel : **Résumé → Entreprise/contacts → Qualification → Besoins → Devis → Activités/relances → Historique**. L'écran existant peut employer des accordéons et des onglets spécialisés ; ne pas effacer les données ou moteurs en les réorganisant.
- L'utilisateur doit pouvoir suivre clairement quatre états **distincts** : *besoin identifié*, *prestation proposée dans le Devis*, *Projet préparatoire*, *Devis accepté / Client converti*.
- **Projet prévisionnel avant signature** : action volontaire sur un **devis existant éligible**, même si le Prospect n'est pas en Finalisation ; retour vers le même dossier, badge non signé. Voir [07P](LOT-07-PROJET-PRE-SIGNATURE.md).
- Interface Compact **14 px** cible, Confort 16, Confort+ 18 ; trois thèmes, aide `?` toujours consultable au clic/clavier.

## 2. Composants réels repérés
| Source | Comportement inspecté | Adaptation V2 |
|---|---|---|
| `ProspectsPageV2.tsx` / `ProspectDetailV2` | Fiche latérale/desk, onglets « commercial / référence », accordéons, actions changement de température/étape/archivage. | Conserver édition au repli, garde UX-01 et cible de fiche après navigation. |
| `ProspectIdentityPanel.tsx` | Coordonnées, identité de l'organisation et du contact, décisionnaire, contacts/méthodes, mises à jour CRM. | Identité source unique ; ne pas recopier en parallèle dans Client. |
| `ProspectResearchPanel.tsx` | Informations connaissance entreprise et vérifications, échanges et remarques. | Dates/vérification visibles, distinction observation vs affirmation vérifiée, aide courte/détaillée. |
| `ProspectQualificationPanelV2.tsx` | `draft` partiel, origine, décideur, motif, intérêt, budget/délai, contrôles et `updateQualification`. | Protection contre réponses tardives et recalcul de draft depuis `updatedAt` ; documenter champs obligatoires par étape. |
| `ProspectNeedsPanel.tsx` | `workflow.needs('prospect',id)` ; catalogue actif avec versions, offres/services, catégories FR, suggestions, `workflow.saveNeed` et suppression. | La sélection d'un besoin **n'achète pas** le service, n'ajoute aucune ligne au Devis et ne crée aucun blueprint sans action explicite. |
| `ProspectPreQuoteReview.tsx` | Assemble besoins et `catalog.list`, contrôle informations de pré-devis, réutilise draft Devis existant ou crée via `quotes.createWithLines`, puis ouvre la fiche devis. | **Le passage besoins → lignes de devis est déjà explicite** ; garder trace versions/quantités, avertir prix non chiffré et exigences incomplètes. |
| `ProspectQuotePanel.tsx` | Devis actuel, édition/envoi/relance, motif attente/refus, duplication de révision, `quotes.accept`. | Préparer le Projet **après création du devis** et avant signature ; `quotes.finalize` ≠ Finalisation commerciale. |
| `ProspectActionsPanel.tsx` | Actions ouvertes, relances, presets, motifs de suivi, rattachement au devis si pertinent. | Une action de relance ne duplique pas la carte ni ne déclenche une transition implicite. |
| `ProspectReferenceWindow.tsx` | Fenêtre de référence affichant/éditant identité et recherche. | Coordination multi-fenêtres et garde #83 selon édition réellement disponible ; pas de fenêtre de données divergentes. |

## 3. Contrat des besoins et du devis : seuil explicite
1. **Catalogue consultatif** dans fiche Besoins : voir offres principales, services complémentaires, suggestions et arguments, suivant le catalogue versionné du Lot 04.
2. **Sélection d'un besoin** : enregistre uniquement un `Need` (référence catalogue ou texte libre) et le contexte de qualification ; une suggestion complémentaire **n'est pas sélectionnée automatiquement**.
3. **Pré-devis** : affiche les besoins retenus, informations manquantes et prix à compléter ; le clic **Préparer un Devis** déclenche explicitement `quotes.createWithLines` ou ouvre un brouillon existant.
4. **Devis courant** : ses lignes réelles, prix, versions et quantités font foi pour la préparation ; une modification de besoins Prospect **ne synchronise pas à elle seule un Devis** déjà enregistré.
5. **Préparer le Projet** : bouton **sur Devis éligible et identifié** ; aperçu en lecture seule, empreinte `previewSHA256`, puis confirmation humaine `prepareQuote`, sans créer Client.
6. **Devis révisé** : comparer l'ancienne préparation aux lignes courantes et proposer **Adapter** ou **Repartir de zéro** (sécurisé), sans supprimer les contenus projet sans avertissement.
7. **Acceptation officielle** : `quotes.accept` seulement après vérification Abby, puis Client véritable et Projet accepté figé. Aucun projet prévisionnel ne vaut consentement contractuel.

**Conception importante :** ne pas placer un bouton « Créer projet » sur une simple suggestion de catalogue ou un besoin sélectionné ; la source commercialement pertinente est le **Devis actuel**, même non accepté.

## 4. Informations utiles sur la fiche
| Bloc | Contenu | Action/sécurité |
|---|---|---|
| En-tête | Société/contact, statut pipeline réel, température discrète, dernier contact, prochaine action | Nom fiable, sélection ID et retour |
| Qualification | Origine, décideur, besoin/objectif, budget, délais, obstacles et vérification | Champs incomplets signalés, dérogation seulement si service l'autorise |
| Besoins | Offres/suggestions, conditions, intérêts, contexte projet | Jamais de prix contractuel ou commande implicite |
| Devis | Brouillon/envoi/relances/version courante, lien Abby si référence | `quotes.finalize` signifie prêt à envoyer, pas accord de principe |
| Projet | Pas de Projet / Projet prévisionnel / Projet figé, révision devis source | Accès bon ID, comparaison, synchro, régénération protégée |
| Activités | Actions datées, relances, commentaires, décisions | Conserver l'historique sans écraser |
| Historique | Perdu/archivé/converti, motifs et Client exact si lié | Historique distinct du pipeline actif |

## 5. Sécurité des brouillons
- Reprendre la **même** garde UX-01 livrée dans #83 dès qu'elle sera intégrée ; ne pas créer un second registre. Les accordéons doivent conserver le composant monté ou sauvegarder son **draft non validé en mémoire** : pas de perte lors de `collapse`/Agrandir.
- Différencier clairement **enregistrement métier validé** et simple préférence d'affichage ; pour erreurs réseau/save, garder texte et sélection, pas de message « Enregistré » anticipé.
- En cas de création partielle d'identité (organisation/contact) suivie d'une erreur, faire apparaître l'objet existant et un chemin de reprise **sans doublon** ; ne pas relancer aveuglément toute la création.
- Une arrivée d'un événement `atoumweb:changed` ou de données plus récentes ne remplace pas un brouillon local `dirty` ; fusion/conflit prudent.
- Fenêtre Référence détachée et fiche principale doivent partager l'identité commerciale sans fermer l'une lors d'un refus de quitter l'autre.

## 6. Plan futur après autorisation et dépendances CI
| Étape | Travail | Preuve |
|---|---|---|
| 03C.1 | Répertorier formulaire/handler/service/erreur sur identité, qualification, besoins et pré-devis | Matrice code et garde UX-01 |
| 03C.2 | Maquette fiche compacte et agrandie, sections et accès Projet | Vues 3 thèmes × 3 densités et focus |
| 03C.3 | Harmoniser catalogue consultatif vs lignes achetées de Devis | Tests de non-ajout implicite |
| 03C.4 | Raccorder **aperçu Préparer Projet** via service existant | SHA/révision, lien vers même Projet, acceptation non changée |
| 03C.5 | Protéger modifications/fermetures, documents et versions de pré-projet | Tests erreurs/drafts/reprise |
| 03C.6 | Recette croisée CRM/Devis/Projet, SQLite fictif et qualité | Bilan SHA réel, aucune mutation Validation-MSI |

## 7. Recette proposée, **non exécutée**
| ID | Scénario | Résultat |
|---|---|---|
| R03C-01 | Ouvrir fiche Prospect et Agrandir/Réduire | Même ID, contexte et brouillon conservés |
| R03C-02 | Replier qualification alors que saisie sale | Aucun caractère perdu, garde non déclenchée inutilement |
| R03C-03 | Modifier décideur/contact principal | Contacts sources mis à jour une seule fois, erreurs récupérables |
| R03C-04 | Qualifier incomplet puis dérogation légitime | Contrôles service conservés, aucun saut métier automatique |
| R03C-05 | Ajouter besoin Catalogue | Besoin enregistré, aucun Devis/Projet créé |
| R03C-06 | Cliquer suggestion non choisie | Aucun achat implicite |
| R03C-07 | Ouvrir pré-devis avec besoin texte libre | Prix à compléter, avertissement explicite |
| R03C-08 | Créer Devis depuis besoins vérifiés | Devis identifié, lignes choisies et versions correctes |
| R03C-09 | Réutiliser un brouillon existant | Même ID Devis, pas de double devis |
| R03C-10 | Préparer Projet depuis Devis non signé | Bon ID Projet provisoire, lien devis courant, aucune conversion |
| R03C-11 | Réviser devis après préparation | Alerte changement, comparaison et options sûres |
| R03C-12 | Repartir de zéro avec Pages/temps/travaux | Suppression physique refusée si risquée ; archive/transition contrôlée |
| R03C-13 | Devis accepté avec Projet courant et conflits résolus | Même Projet figé, Client correctement lié, pas de duplicata |
| R03C-14 | Déclencher recherche globale et annuler navigation | Fiche et brouillon originaux toujours présents |
| R03C-15 | Modifier Référence Prospect détachée | Mise à jour/multi-fenêtres cohérentes, pas de deux registres concurrents |
| R03C-16 | Perdre connexion/service pendant `save` | Brouillon et message d'erreur conservés |
| R03C-17 | Essayer clavier seul, petite fenêtre, neuf modes visuels | Accès aux actions, focus et textes >=14px |
| R03C-18 | Typecheck/SQL/suite complète sur code d'implémentation | Preuves horodatées SHA, pas de Validation-MSI |

## 8. Questions à instruire en Lot 03 et 07
- Liste exacte des champs de qualification **obligatoires à chaque transition**, avec leurs dérogations et rapports ; ne pas imposer globalement « tout obligatoire ».
- Source du **devis courant** et de son **dossier commercial versionné** dans les actions Prospect, afin de ne pas préparer une ancienne révision.
- Lien visuel retour Devis ↔ Projet et limite du bouton « Repartir de zéro », dont la suppression complète du Projet n'est pas attestée.
- Contrôles de sauvegarde entre sous-éditeurs et réutilisation des protecteurs UX-01 déjà présents.
- Créer l'entrée « Préparer Projet » dans les interfaces **sans activer automatiquement la production opérationnelle**.

**La documentation facilite le futur développement, elle ne vaut aucune preuve d'implémentation ni validation du workflow en production.**
