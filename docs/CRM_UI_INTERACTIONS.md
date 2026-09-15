# AtoumWeb Manager — Interactions UI consolidées

> Branche : `fix/recette-commerciale-coherence`.
>
> Périmètre stabilisé dans cette passe : Prospect, qualification, actions/relances, devis depuis la fiche Prospect et conversion Client. L’écran Projet reste le chantier suivant.

## Prospect — création

Le formulaire « Nouveau contact commercial » permet de saisir :

- société ;
- activité / type de structure ;
- description de l’activité ;
- site web ;
- adresse postale ;
- prénom, nom et fonction de l’interlocuteur ;
- email / téléphone ;
- source et précision si `Autre` ;
- état commercial Neutre / Froid / Tiède / Chaud ;
- valeur estimée ;
- besoins initiaux ;
- première action et date.

Les email/téléphone saisis à la création sont enregistrés dans `contact_methods` afin qu’ils apparaissent ensuite dans Coordonnées sans ressaisie.

## Pipeline Prospect

Chaque carte affiche le nom, l’interlocuteur, le besoin, la valeur estimée et les actions proches.

Toute la carte est teintée selon l’état commercial ; le badge texte reste présent pour ne pas dépendre uniquement de la couleur.

Le changement de température est directement accessible depuis la carte et depuis la fiche.

Les transitions manuelles proposées sont filtrées selon l’étape actuelle. Une transition qui correspond à une vraie opération métier — créer/finaliser/envoyer/accepter/dupliquer un devis — ne doit pas être exécutée par simple sélecteur ou glisser-déposer.

## Fiche Prospect — ordre de travail

Ordre recommandé et utilisé :

1. état commercial + étape ;
2. entreprise / interlocuteur ;
3. devis actif ;
4. besoins / offres / services ;
5. qualification ;
6. actions & relances ;
7. perte / archivage ;
8. journal.

Le devis actif est volontairement placé haut : dès qu’un devis existe, il devient l’objet commercial principal.

## Entreprise, interlocuteur et coordonnées

Les informations d’identité restent modifiables sans recréer le Prospect.

Les Coordonnées sont repliables afin d’éviter une fiche trop longue. Elles distinguent :

- entreprise / accueil ;
- interlocuteur.

On peut ajouter plusieurs emails et téléphones, avec libellé et coordonnée principale.

## Besoins / prestations

La sélection n’est plus pensée comme une liste géante unique. Le parcours est :

`Catégorie → prestation → Ajouter`.

Un texte libre « Autre besoin » reste possible.

Les besoins déjà sélectionnés sont visibles et supprimables. L’absence de besoin empêche la fin réelle de qualification.

## Qualification

Le panneau comporte des aides contextuelles `?` sur les champs importants.

Champs :

- résumé du projet ;
- contexte ;
- décideur ;
- précisions sur le décideur si nécessaire ;
- budget ;
- montant connu ou fourchette ;
- calendrier ;
- date souhaitée ou indication libre ;
- site ou outil déjà existant ;
- URL / remarques si oui ;
- informations encore nécessaires.

La jauge de préparation comporte cinq critères : Résumé, Décisionnaire, Budget, Calendrier, Besoin / prestation.

`Enregistrer la qualification` :

- conserve les données si le dossier est incomplet ;
- passe automatiquement de `À qualifier` à `Besoin identifié` seulement si les cinq critères sont satisfaits.

## Actions & relances

Les anciens prompts système ont été remplacés sur le parcours principal par un panneau structuré.

### Avant devis

Actions proposées :

- Appeler le prospect ;
- Envoyer un email ;
- Demander des informations ;
- Planifier un rendez-vous ;
- Préparer le devis ;
- Autre action.

Elles restent de type `action` et ne changent pas artificiellement l’étape du pipeline.

### Après envoi d’un devis

L’action « Relancer pour le devis » devient une vraie `follow_up` et exige une date.

Une action peut avoir une récurrence : aucune, semaine, mois, trimestre, année.

Pour clôturer une action, le formulaire demande :

- canal : Téléphone, Email, SMS, Rendez-vous, Autre ;
- résultat : Client joint, Message laissé, Email envoyé, Pas de réponse, Retour attendu, Demande de modification, Autre ;
- compte rendu ;
- prochaine action et date facultatives.

## Devis actif dans la fiche Prospect

### Brouillon non finalisé

Commandes :

- Modifier le devis ;
- Mettre en pause / informations manquantes ;
- Devis prêt à envoyer.

La pause crée une action liée au devis et le conserve en `Devis en préparation`.

### Brouillon finalisé

Le panneau affiche « prêt à envoyer » puis permet d’enregistrer l’envoi avec :

- canal ;
- destinataire ;
- note.

Un devis non finalisé ne peut pas être marqué envoyé.

### Devis envoyé / vu

Le panneau affiche :

- montant ;
- date d’envoi ;
- validité ;
- canal ;
- destinataire ;
- dernière relance ;
- prochaine relance ;
- note d’envoi si présente.

Commandes :

- consulter ;
- négociation ;
- refaire / dupliquer ;
- accepter ;
- refuser / perdu ;
- programmer une relance ;
- mettre en attente avec motif/date de reprise.

Le refus et la perte utilisent un formulaire structuré et une raison obligatoire.

## Conversion Client

`Devis accepté` convertit ou rattache au Client sans créer de doublon puis rend le devis prêt à être transformé en Projet.

Le Prospect sort du pipeline actif et reste consultable dans l’historique.

## Client

La liste Client utilise les coordonnées principales issues de `contact_methods` en priorité.

La fiche Client reste organisée autour de l’identité, de la relation, des projets/interventions/documents et de l’historique. Le composant technique historique « Dossier partagé » ne doit pas être présenté comme un concept utilisateur.

## Points de recette Windows obligatoires

- lisibilité des formulaires dans les thèmes AtoumWeb, Noir et Blanc ;
- teinte complète des cartes Prospect ;
- petite fenêtre et scroll de la fiche latérale ;
- Coordonnées repliables ;
- qualification avec champs conditionnels ;
- parcours `Nouveau → Qualification → Besoin → Devis préparation → À envoyer → Envoyé → Relance/Négociation/Attente → Accepté/Perdu` ;
- persistance après redémarrage ;
- absence de saut de pipeline par simple changement manuel ;
- affichage du canal/destinataire d’envoi après rechargement ;
- coordonnées Client cohérentes après modification d’un moyen de contact.