# Décisions de recette — parcours commercial AtoumWeb Manager

Référence fonctionnelle validée avec Carlos le 15/09/2026.

## Priorité actuelle

Le chantier prioritaire est le parcours commercial Prospect → Qualification → Besoin → Devis → Suivi → Acceptation / Négociation / Refus → Client.

La refonte détaillée de l’écran Projet est volontairement reportée. La Phase 5 Contrats / Abby reste en pause. L’éditeur de devis sera repris après la stabilisation du parcours Prospect et après l’intégration propre de toutes les offres AtoumWeb dans le catalogue.

## Lisibilité et densité

La passe actuelle inclut aussi la lisibilité générale. Le réglage de densité n’est pas reporté : il doit être disponible maintenant dans Réglages > Apparence.

- Compact : densité élevée, cartes et espacements resserrés.
- Confort : valeur par défaut, lecture équilibrée.
- Confort + : texte et zones cliquables plus grands.

Le réglage s’applique à toute l’application. La cible de lecture est environ 16 px pour le texte courant et au moins 14 px pour le secondaire, avec cases à cocher et zones cliquables suffisamment grandes.

## Couleur commerciale

La température commerciale est indépendante de l’étape du pipeline.

- Froid : bleu / gris froid.
- Neutre : teinte neutre positive légère.
- Tiède : jaune / orange doux.
- Chaud : rouge / orange doux.

La couleur suit le prospect partout pendant la prospection : carte pipeline, panneau rapide à droite et grande fiche de travail en mode bureau. Les champs restent lisibles dans les trois thèmes. Le badge texte reste présent pour l’accessibilité.

Après conversion en client, la logique visuelle continue avec la qualité de relation : Excellente / Bonne / Neutre / À surveiller / Difficile, sans réutiliser le champ de température prospect.

## Deux modes de travail, une seule donnée

Le panneau droit sert au travail rapide. La grande fiche Prospect sert au travail confortable pendant un appel ou un rendez-vous. Les deux vues utilisent les mêmes données et les mêmes services : aucune duplication métier.

Dans la grande fiche, la validation d’une étape doit pouvoir ouvrir directement l’étape suivante sans revenir au pipeline.

## Nouveau contact et démarrage de prospection

Un nouveau prospect reste en « Nouveau contact » jusqu’à une action explicite « Démarrer la prospection ».

Cette action :

- passe le prospect à « À qualifier » ;
- enregistre le démarrage de la prospection dans le journal ;
- ouvre la grande fiche de travail.

Ouvrir le panneau ou la fiche ne change jamais l’étape tout seul. Après démarrage, l’action peut devenir « Continuer la qualification ».

## Parcours avant devis

Le parcours de travail avant devis est :

Nouveau contact → À qualifier → Besoin à identifier → contrôle avant devis → Devis à préparer.

Le libellé de travail est « Besoin à identifier », pas « Besoin identifié ». Le code technique historique peut rester `need_identified` si cela évite une migration inutile, mais l’interface et la logique métier doivent refléter le nouveau sens.

De même, `quote_to_prepare` est affiché comme « Devis à préparer » et non « Devis en préparation ».

Le glisser-déposer vers la droite est une action métier : il valide les prérequis de l’étape courante. Si un élément manque, le déplacement est bloqué avec un message métier clair, jamais avec une erreur IPC brute. Les retours arrière avant devis officiel restent possibles et ne doivent pas effacer les données.

## Origine du prospect et questionnaire conditionnel

Une seule entité Prospect est conservée, mais le questionnaire varie selon l’origine.

Origines principales : Prospection AtoumWeb, Demande entrante, Recommandation, Ancien client / relation existante, Partenaire / apporteur, Autre.

Pour une prospection AtoumWeb, la première qualification porte surtout sur : motif de ciblage, constat, opportunité détectée, offre pressentie, première prise de contact, résultat du contact et niveau d’intérêt. Budget, calendrier et besoin détaillé n’apparaissent que quand l’intérêt devient réel.

Pour une demande entrante, on peut afficher immédiatement résumé de la demande, besoin, budget, délai, décisionnaire, existant et prestation envisagée.

Les menus doivent proposer des valeurs guidées avec « Autre » et un champ libre quand nécessaire.

## Qualification

« À qualifier » ne sert pas à identifier tout le projet. Cette étape répond à la question : le prospect mérite-t-il qu’on poursuive et avons-nous les éléments commerciaux minimums pour avancer ?

La qualification valide notamment, selon l’origine : identité, moyen de contact, origine, interlocuteur / chemin vers le décisionnaire, motif du contact, résultat du contact, intérêt et possibilité crédible de poursuivre.

Le bouton « Enregistrer la qualification » sauvegarde même si elle est incomplète et laisse le prospect dans « À qualifier ».

Quand les prérequis sont suffisants, « Valider la qualification » fait passer à « Besoin à identifier ».

En cas d’incomplétude, afficher un récapitulatif intégré : éléments acquis, éléments manquants, points d’attention et action recommandée. Pas de popup Windows.

## Décisionnaire

Dans « Entreprise & interlocuteur », distinguer l’interlocuteur courant et le décisionnaire.

Le statut décisionnaire est Oui / Non / Inconnu. Si l’interlocuteur n’est pas décisionnaire, pouvoir enregistrer le nom, le rôle et les coordonnées du décisionnaire. La qualification ne doit pas redemander les mêmes informations : elle vérifie simplement qu’elles sont suffisamment traitées.

## Coordonnées et validation

Emails et téléphones utilisent les mêmes règles partout dans Prospect, Client et Contacts.

Téléphone France : 10 chiffres commençant par 0 ; espaces de saisie tolérés ; affichage lisible ; international autorisé avec + indicatif. Les lettres et formats manifestement incohérents sont refusés.

Email : validation structurelle minimale `local@domaine.extension`.

Les coordonnées sont regroupées par propriétaire/rôle, pas par date : Entreprise / accueil ; Interlocuteur principal ; Décisionnaire ; Facturation ; Technique ; Autres contacts. Chaque personne peut avoir plusieurs moyens de contact avec libellé et principal.

## Besoin à identifier

Cette étape sert à déterminer ce qu’AtoumWeb doit réellement proposer et si le périmètre est suffisamment clair pour chiffrer.

On y traite projet / problématique, objectifs, besoins exprimés et détectés, offre envisagée, périmètre, budget, calendrier, contraintes et informations nécessaires au chiffrage.

Le budget est guidé : Non communiqué ; moins de 500 € ; 500–1 000 € ; 1 000–2 000 € ; 2 000–5 000 € ; 5 000–10 000 € ; 10 000 € et + ; fourchette personnalisée ; montant précis.

## Projet & solution AtoumWeb

Le bloc générique « Besoins / Offres / Services » est remplacé par une logique « Projet & solution AtoumWeb ».

Le sélecteur fonctionne Famille de solution → Offre / prestation envisagée, avec les noms et prix issus du catalogue comme source unique.

Quand une offre est sélectionnée, son socle inclus est affiché automatiquement. Exemple Site vitrine — à partir de 699 € : responsive jusqu’à 5 pages, design adapté, rédaction dans le cadre prévu, formulaire de contact, bases SEO / SSL / conformité, hébergement offert 1 an.

L’étape permet ensuite d’affiner le besoin pour déterminer : dans le cadre de l’offre de base ; supplément probable ; hors socle / chiffrage complémentaire.

Une prestation s’ajoute avec une seule action. Le double bouton actuel « Ajouter » puis « Ajouter la prestation » doit disparaître.

## Prérequis

Les prérequis ne sont pas une checklist universelle de qualification. Ils sont générés en fonction de la solution choisie et ont un moment d’exigence : avant devis, avant démarrage du projet ou pendant le projet.

Exemple : nombre de pages avant devis ; accès hébergement avant démarrage si nécessaire ; photos finales éventuellement pendant le projet.

Un élément requis uniquement pour l’exécution ne doit pas bloquer la création du devis.

## Contrôle avant devis

À la fin de « Besoin à identifier », un contrôle métier récapitule avant de basculer vers le devis : entreprise, interlocuteur, décisionnaire, projet, offre, socle inclus, options / hors-socle, budget, calendrier, éléments nécessaires au chiffrage, incertitudes et blocages.

Le résultat est « Prêt pour devis » ou « Devis non prêt » avec les raisons détaillées.

Le bouton final est « Passer à l’édition du devis ». Tant que le contrôle n’est pas validé, le prospect reste dans « Besoin à identifier ».

Aucun bloc « Devis actif » ni bouton de création de devis ne doit être affiché dans Nouveau contact, À qualifier ou Besoin à identifier avant ce contrôle.

## Brouillon et édition officielle du devis

Après validation du contrôle, un brouillon est créé et le prospect passe à « Devis à préparer ». La fiche Prospect indique simplement que le devis est en attente d’édition avec un accès au brouillon.

Tant que le devis reste brouillon : lignes, quantités, prix, remises, textes et conditions sont modifiables ; il peut être abandonné ; aucun numéro officiel ne doit être consommé si ce n’est pas nécessaire.

L’action future « Valider et éditer le devis » attribue le numéro officiel, la date, la durée de validité et fige le snapshot commercial.

Dès qu’un numéro officiel est attribué, le devis n’est plus supprimé ni modifié silencieusement. Une correction ou négociation nécessitant un changement crée une révision / nouveau devis et conserve le précédent avec son lien et son motif : Remplacé, Erreur de saisie, Refusé, Caduc ou Accepté selon le cas.

Un devis accepté ne se modifie plus comme un brouillon.

## Après l’envoi

« Devis envoyé » décrit une action passée. L’état courant affiché après envoi devient « En attente de retour », avec éventuellement un sous-état « En attente de signature ».

La vignette met alors le devis au premier plan : numéro, objet, montant, date d’envoi, canal, destinataire, validité, temps restant et prochaine relance.

Les trois issues métier principales sont :

- Devis accepté / signé ;
- À modifier / Négociation ;
- Devis refusé.

La caducité est un état du devis lié à sa date de validité. Un devis refusé ou caduc ne signifie pas automatiquement « Prospect perdu » : la perte du prospect reste une décision commerciale distincte.

## Actions, rappels et relances

Il n’existe qu’un système d’actions / relances transversal. Il est disponible depuis les cartes et les fiches à toutes les étapes pertinentes.

Depuis une vignette, création rapide : Rappel demain ; Rappel +7 jours ; Programmer… avec date précise.

Après création, les boutons ne doivent pas être confondus avec le rappel existant : la carte affiche la vraie prochaine action et sa date.

Dans la fiche complète, la même action peut être enrichie avec date / heure, canal, personne, objectif et note. Après réalisation, enregistrer un résultat structuré : Client joint, Message laissé, Email envoyé, Pas de réponse, Retour attendu, RDV fixé, Demande de modification, Autre, puis programmer éventuellement l’action suivante.

## Perdu, archive et journal

« Perdu » et « Archiver » restent distincts. Perdu conserve une raison structurée et un commentaire facultatif ; Archiver sert à sortir le dossier du travail courant.

Le journal du dossier reste en bas de la fiche et trace automatiquement création, démarrage prospection, étapes, qualification, besoin, actions, rendez-vous, modifications importantes, devis, envoi, relances, négociation et conversion client.

## Client et dossier documentaire

Après acceptation du devis, la conversion Prospect → Client reste idempotente et le devis accepté reste figé.

Le vrai dossier documentaire client est distinct des données techniques partagées en arrière-plan. Organisation cible : Administratif & identité ; Identité visuelle ; Devis & contrats ; Facturation & paiements ; Échanges importants ; Documents fournis par le client ; RGPD / consentements / demandes ; Archives.

Les fichiers de production restent dans Projet.
