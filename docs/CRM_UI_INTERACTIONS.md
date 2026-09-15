# AtoumWeb Manager — Inventaire UI et interactions

> Référence : `fix/recette-commerciale-prospects` @ `be9d086bd4b284269eabeb7b0199b275cbda59a7`.
>
> Ce document inventorie les interactions visibles dans le build de référence. Les pages Facturation, Dépenses, Documents & Contrats, Bibliothèque, Sauvegardes, Annuaire et Statistiques restent principalement des emplacements de navigation/Phase ultérieure ; elles ne doivent pas être confondues avec des modules métier finalisés.

## Navigation globale

| Écran / interaction | Visible | Action / données | Résultat / impact |
|---|---|---|---|
| Barre latérale | Toujours après bootstrap | `Accueil`, `Prospects`, `Clients`, `Offres & Tarifs`, `Devis`, `Projets`, `Interventions & Maintenance`, `Gestion des temps`, pages futures, `Réglages` | Change la page React active |
| Recherche globale | Topbar | Recherche CRM + catalogue + devis + projets + opérations + documents client | Ouvre l’écran cible et l’entité lorsque le routage existe |
| Timer global | Topbar | démarre/pause/reprend/arrête une session | persiste dans `time_sessions`/`time_session_pauses` |
| Badge SQLite | En-tête | lecture bootstrap | affiche le nombre réel de migrations |
| Thèmes | Réglages | AtoumWeb / Noir / Blanc | persiste `settings.theme`; applique `data-theme` |
| Workspace | Réglages | Choisir dossier | mémorise nouveau workspace ; redémarrage requis si changement |
| Sauvegarde manuelle | Réglages | création backup DB | fichier backup dans workspace |
| Restauration | Réglages | choisir sauvegarde + confirmation | restauration programmée, redémarrage selon mode |

## Accueil

### `WorkflowDashboard`

L’Accueil agrège des entrées cliquables issues de `WorkflowService.dashboard()`.

| Groupe | Condition réelle |
|---|---|
| Prospects à relancer | stage `follow_up` ou `next_action_at <= aujourd’hui` |
| Devis à préparer | prospect `need_identified` ou `quote_to_prepare`, plus devis `draft` |
| Devis à envoyer | prospect `quote_to_send` |
| Devis en attente de réponse | devis `sent` ou `viewed` |
| Devis acceptés à démarrer | devis `accepted` sans projet source |
| Projets à préparer / en cours / attente Client / bloqués / à valider | selon statut Projet |
| Projets en retard / échéances proches | `target_date` passée ou <= 7 jours |
| Demandes nouvelles | demande `new` |
| Interventions en cours / à valider | statuts correspondants |
| Aujourd’hui / À venir | actions CRM ouvertes avec échéance |
| RGPD / conservation | document actif avec `retention_until <= +90 jours` |

### KPI

Prospects actifs, projets actifs, clients, temps du mois. Le CA encaissé reste affiché à `0 €` avec mention Abby à venir : ce n’est pas une donnée métier finalisée.

## Prospects — Pipeline

### Création « Nouveau contact commercial »

| Champ | Type / choix | Validation / effet |
|---|---|---|
| Société | texte | société OU prénom+nom requis |
| Activité / type de structure | texte | stocké `organizations.industry` |
| Site web | URL | `organizations.website` |
| Description activité | textarea | stockée actuellement dans `organizations.notes` |
| Adresse / complément / CP / ville / pays | texte | `organizations.address_*` |
| Prénom / nom interlocuteur | texte | crée `contacts`; les deux sont nécessaires pour créer le contact |
| Fonction | texte | `contacts.job_title` |
| Email / téléphone | texte | écrit à la fois legacy sur Contact et dans `contact_methods` si contact créé ; sinon `contact_methods` organisation |
| Source | liste 8 valeurs | `prospects.source` |
| Préciser la source | visible si Autre | `source_detail` |
| État commercial | Neutre/Froid/Tiède/Chaud | `prospects.temperature` |
| Valeur estimée | euros | convertie en centimes, >=0 |
| Besoins | sélecteur catégorie → prestation | crée ensuite `crm_needs`; peut être vide au stade new |
| Première action/date | optionnel | crée `crm_actions` type `action` |

### Carte Prospect

- **Toute la carte** porte une classe de température : `prospect-temperature-neutral/cold/warm/hot`.
- Le libellé reste visible pour l’accessibilité.
- Un sélecteur `État commercial` permet le changement immédiat.
- Affiche interlocuteur, besoin principal calculé, valeur estimée, jusqu’à deux actions.
- Raccourcis : `Relance demain`, `+7 j`, `+ Action`.
- Sélecteur d’étape expose actuellement toutes les étapes actives : le service contrôle surtout la présence d’un besoin, pas l’adjacence métier.
- Drag & drop vers une colonne appelle la même transition de service.

**Critère visuel validé** : Neutre = vert très clair/positif neutre ; Froid = teinte froide ; Tiède = jaune/orange ; Chaud = rouge/orange ; le badge ne doit pas être le seul indicateur.

## Fiche Prospect

Ordre réel V2 :

1. état commercial + étape ;
2. badges température/statut/source ;
3. bouton `Commencer la prospection / qualification` si `new` ;
4. `Entreprise & interlocuteur` ;
5. `Devis actif` ;
6. `Besoins / Offres / Services` ;
7. Qualification si `qualifying` ou `need_identified` ;
8. bouton création devis si `need_identified` ;
9. Actions & relances ;
10. Perdu / Archivage ;
11. Journal.

### Entreprise & interlocuteur

Mode lecture : société, activité, site, adresse, description, interlocuteur, fonction.

Mode édition : les mêmes champs. Les aides `?` sont présentes sur société, activité, description et rôle. La gestion email/téléphone n’est plus dans ce formulaire : elle passe par `ContactMethodsPanel`.

### Coordonnées multiples

Bloc `<details>` replié par défaut : résumé `X email(s) · Y téléphone(s)`.

- Groupes : `Entreprise / accueil` et `Interlocuteur`.
- Ajout : rattachement, type Email/Téléphone, valeur, libellé libre.
- La première coordonnée d’un type/propriétaire devient principale.
- Action `Archiver` = soft archive de la coordonnée.

### Besoins

Sélecteur : catégorie → prestation → Ajouter. Choix `Autre besoin` ouvre un texte libre. Les besoins sélectionnés sont des chips supprimables avant enregistrement.

Suggestions codées actuellement : Site vitrine, Landing, E-commerce et Applications proposent certains compléments par IDs catalogue. La liste des catégories est d’abord triée selon Web, E-commerce, Maintenance, Contenu, Visibilité, Création, Applications, Mariage puis catégories inconnues.

Sur la fiche : Modifier / Retirer / Ajouter. Aucun besoin n’est exigé pour `new`/`qualifying`, mais le service en exige un au-delà.

### Qualification

| Champ | Interaction |
|---|---|
| Résumé du projet | textarea + aide |
| Contexte | textarea + aide |
| Décisionnaire | À préciser / Oui / Non / Inconnu |
| Qui décide / précisions | visible sauf si Oui |
| Budget | À préciser / Connu / Fourchette / Non communiqué |
| Budget connu | visible si Connu |
| Min / Max | visibles si Fourchette ; min <= max |
| Calendrier | À préciser / Date connue / Indication libre / Non communiqué |
| Date souhaitée | champ date conditionnel |
| Précision calendrier | conditionnel |
| Site ou outil existant ? | À préciser / Oui / Non / Inconnu |
| URL + remarques | si Oui |
| Informations nécessaires | cases logo, textes, photos, hébergement, domaine, juridique, budget, décideur, brief + champ libre |

`Enregistrer la qualification` met à jour d’abord budget/date via `crm.prospects.update`, puis qualification via `updateQualification`. Si les **4 critères UI** Résumé + Décisionnaire + Budget + Calendrier sont remplis et le prospect est `qualifying`, l’UI tente `changeStage(need_identified)`.

**Point à corriger/valider** : le compteur de préparation ne teste pas la présence d’un `crm_need`, alors que le service l’exige.

## Devis actif dans Prospect

Le panneau charge les devis liés et considère le plus récent comme actif.

| Situation | Commandes visibles | Effet |
|---|---|---|
| Aucun devis | résumé uniquement | création disponible plus bas si Besoin identifié |
| Draft non finalisé | Ouvrir/Modifier, Mettre en pause, Devis prêt à envoyer | pause = action CRM liée au devis ; finalisation renseigne `finalized_at`, Prospect → `quote_to_send` |
| Draft finalisé | Envoyer / enregistrer l’envoi | formulaire canal, destinataire, note ; `markSent` + action CRM complétée servant de trace d’envoi |
| Sent/Viewed | consulter, Négociation, Refaire/Dupliquer, Accepté, Refusé/Perdu, programmer relance, mettre en attente | changements devis + Prospect/actions selon commande |
| Plusieurs devis | détails anciens devis repliables | navigation vers écran Devis |

Canaux d’envoi proposés : Email, Courrier, Remis en main propre, Autre.

Motifs d’attente : réponse, informations, documents, validation décideur, nouveau devis envoyé, rendez-vous, autre ; date de reprise optionnelle crée une action.

**Traçabilité** : canal/destinataire/note sont enregistrés via la complétion d’une `crm_action`, pas dans des colonnes propres à `quotes`.

## Relances / actions Prospect

- Création rapide de relance : `crm_actions` `follow_up` ; le service déplace le Prospect en `follow_up`.
- `+ Action` utilise encore `window.prompt` dans V2.
- Clôture utilise encore trois prompts : canal, résultat, compte rendu.
- La complétion stocke `completion_channel`, `completion_outcome`, `completion_notes` et peut générer la prochaine action récurrente.

**Recommandation UX** : remplacer les prompts par formulaires structurés avant validation finale de la recette.

## Historique Prospect

Liste dossiers clos (`won`, `lost`, convertis ou archivés) + recherche. La fiche historique affiche activité et résumé. Les libellés de stages bruts sont transformés en français côté UI.

## Clients

### Liste

Filtres statut `Tous / Actifs / Inactifs / Archivés`, recherche locale sur nom/contact/email/téléphone, création directe, ouverture par ligne.

Colonnes : Client, Statut, Contact principal, Coordonnées, Prochaine action.

**Point de cohérence** : les colonnes email/téléphone de `ClientSummary` proviennent encore des champs legacy organisation/contact et non de l’ensemble `contact_methods`.

### Fiche Client

Onglets réels : Résumé, Contacts, Documents, Interventions, Commercial, Historique.

Résumé : statut actif/inactif/archivé ; qualité relation Excellente/Bonne/Neutre/À surveiller/Difficile ; contact/email/téléphone ; prochaine action ; notes ; programmer/retirer action.

Contacts : ajout prénom/nom/fonction/email/téléphone/rôle ; option contact principal ; rôles Principal, Administratif, Facturation, Technique, Autre.

Documents : panneau `ClientDocumentsPanel`, import de fichiers, catégorie, titre, conservation, archivage/restauration, ouverture, suppression définitive confirmée.

Interventions : `ClientOperationsTab` agrège opérations du client.

Commercial : devis/besoins selon les composants existants.

Historique : `activity_events` client.

**Recommandation** : réorganiser progressivement la fiche autour du projet actif et du travail à faire, avec Coordonnées repliables ; ne plus exposer le composant technique `DossierPanel` comme un bloc conceptuel.

## Devis — écran dédié

L’écran Devis reste la zone d’édition détaillée : lignes catalogue/libres, quantité, prix proposé, remise/ajustement, conditions, dépôt, PDF et transitions.

Règles de service :
- modifications de lignes/conditions seulement lorsque le devis est éditable (`draft`) ;
- finalisation exige au moins une ligne mais garde le statut `draft` ;
- envoi : `draft → sent` ;
- vu : `sent/viewed → viewed` ;
- accepté/refusé/expiré : depuis sent/viewed ;
- duplication possible depuis sent/viewed/refused/expired/cancelled.

## Projets

Écran existant : listes/filtres, transformation devis accepté, projet interne, statut, structure lot/module/tâche/checklist, prérequis, ressources, bibliothèque technique, revue de fin.

Le projet issu d’un devis exige une **version de modèle publiée**. La transformation copie le snapshot commercial, les nœuds du modèle et les prérequis.

**Décision recette** : l’écran Projet est volontairement le chantier suivant ; ne pas interpréter son UX actuelle comme finalisée.

## Interventions & Maintenance

Le module regroupe :
- demandes client ;
- interventions ;
- plans/souscriptions/périodes/checklists de maintenance ;
- packs d’heures ;
- alertes/décisions de dépassement.

Interactions clés : créer/qualifier/fermer/transformer une demande ; créer et rattacher une intervention au client/projet/nœud ; changer statut ; compléter ; associer maintenance ou pack d’heures ; gérer périodes/checks ; créer/débiter/corriger/annuler mouvements de packs.

Les services vérifient que projet/nœud/maintenance appartiennent au bon client.

## Gestion des temps / Timer

Actions : démarrer, basculer, heartbeat, pause, reprendre, récupération après interruption, arrêter, arrêter au dernier point connu, ajouter une saisie manuelle, corriger une session, filtrer et synthétiser.

Une session en cours persiste en SQLite ; le redémarrage peut détecter une session stale et proposer la récupération. Le contexte Projet/Nœud/Intervention est résolu et stocké au démarrage de la session : le Timer utilise donc le **rattachement sauvegardé de la session**, pas une sélection d’écran ultérieure.

## Recherche globale

Sources : index CRM, catalogue, devis, projets, demandes, interventions, maintenance, packs d’heures, documents client.

Routage direct : Prospect, Client, Devis, Projet, Demande, Intervention, Maintenance, Pack, document Client. Organisation/Contact basculent vers Clients sans ciblage aussi précis.

## Réglages / thèmes

Thèmes : AtoumWeb (défaut), Noir, Blanc. Changement persisté dans `settings` et appliqué immédiatement. Workspace, backups, restauration et données démo sont accessibles ici.

## Interactions qui nécessitent une recette Windows

1. lisibilité input/select/textarea dans les trois thèmes ;
2. carte Prospect entièrement teintée et texte lisible ;
3. comportement des `details` Coordonnées en fenêtre réduite ;
4. sélecteur catégorie/prestation et suggestions ;
5. qualification conditionnelle + auto-passage ;
6. commandes Devis directement depuis Prospect ;
7. scroll fiche latérale ;
8. persistance après redémarrage ;
9. ouverture de fichiers physiques client/projet ;
10. récupération Timer après fermeture/interruption.
