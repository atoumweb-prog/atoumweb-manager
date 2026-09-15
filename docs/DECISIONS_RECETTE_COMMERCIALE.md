# Décisions de recette — parcours commercial AtoumWeb Manager

Référence fonctionnelle validée avec Carlos le 15/09/2026.

## Priorité actuelle

Le chantier prioritaire est : Prospect → Qualification → Besoin → Devis → Envoi → Relance → Négociation / Attente → Acceptation → Client.

La refonte détaillée de l’écran Projet est volontairement reportée à la passe suivante. La Phase 5 Contrats / Abby reste en pause.

## Cartes Prospect et état commercial

La température commerciale est indépendante de l’étape du pipeline et doit pouvoir être modifiée directement depuis la carte et la fiche Prospect.

- Neutre : vert très clair, orientation positive mais non qualifiée.
- Froid : bleu / gris froid.
- Tiède : jaune / orange doux.
- Chaud : rouge / orange doux.
- Gagné / devenu client : vert positif.

La carte entière est teintée ; le badge texte reste affiché pour l’accessibilité. La règle doit fonctionner dans les thèmes AtoumWeb, Noir et Blanc.

## Nouveau prospect

La création doit pouvoir enregistrer : société, activité/type de structure, description d’activité, site web, adresse postale, interlocuteur, fonction, email, téléphone, source, précision de source si « Autre », température et première action. Un prospect peut être créé sans besoin.

## Coordonnées

Emails et téléphones sont multiples et peuvent appartenir à l’entreprise/accueil ou à un interlocuteur. Ils possèdent un libellé et un principal. L’affichage est repliable et compact.

## Qualification

Le passage « Nouveau contact → À qualifier » dispose d’un bouton explicite « Commencer la prospection / qualification ».

Le questionnaire comprend résumé, contexte, décideur, budget, calendrier, site/outil existant et informations manquantes. Les champs sont conditionnels : montant si budget connu, min/max pour fourchette, vrai champ date pour calendrier connu, URL/remarques si existant.

Les informations manquantes proposent des cases : logo/charte, textes, photos, accès hébergement, nom de domaine, informations légales, budget, validation décideur, cahier des charges, plus une note libre.

Quand les informations essentielles sont complètes et que la qualification est enregistrée, le prospect passe automatiquement de « À qualifier » à « Besoin identifié ». Le changement reste réversible manuellement.

## Besoins / catalogue

Le sélecteur n’affiche pas une liste géante. Il fonctionne Catégorie → Offre/Service et peut proposer des services complémentaires selon l’offre principale.

## Devis depuis Prospect

Le devis créé depuis un prospect reprend réellement les besoins comme lignes. Sa création passe le prospect en « Devis en préparation ».

Dans « Devis en préparation », le devis peut rester en pause pour informations manquantes. Une action explicite « Devis prêt à envoyer » le fait passer en « Devis à envoyer ».

Les commandes commerciales usuelles doivent être accessibles depuis la fiche Prospect sans imposer d’ouvrir l’écran Devis : consulter/modifier, finaliser, enregistrer l’envoi, relancer, négocier, mettre en attente, dupliquer/refaire, accepter ou refuser.

L’envoi conserve canal, destinataire et note. Un devis déjà envoyé n’est jamais écrasé ; une négociation nécessitant une modification crée une copie/nouvelle proposition.

## Relances et attente

Une relance conserve le canal, le résultat et le compte rendu. Une prochaine action peut être programmée.

Les motifs d’attente proposés comprennent : réponse, informations, documents, validation par le décideur, nouveau devis envoyé, rendez-vous programmé, autre.

## Client

Après acceptation du devis, la conversion Prospect → Client reste idempotente et le devis accepté reste figé.

La relation Client utilise : Excellente / Bonne / Neutre / À surveiller / Difficile. Cette relation peut ensuite colorer discrètement la ligne/carte client, indépendamment du statut Actif/Inactif/Archivé.

## Dossier client

Le vrai dossier documentaire client est distinct des données techniques partagées en arrière-plan. Organisation cible : Administratif & identité ; Identité visuelle ; Devis & contrats ; Facturation & paiements ; Échanges importants ; Documents fournis par le client ; RGPD / consentements / demandes ; Archives.

Les fichiers de production restent dans Projet.
