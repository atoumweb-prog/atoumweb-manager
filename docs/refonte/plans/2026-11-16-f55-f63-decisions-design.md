# F55 à F63 : décisions de Carlos du 16/11/2026, trois lots (fiche à valider)

Points relevés en P6b (registre `docs/refonte/FINITIONS.md`), restés en attente d'une décision de Carlos. Les décisions ont été prises le 16/11/2026, chaque fois sur l'option recommandée. Skill `atoumweb-design`. Règles A à J : une fiche validée avant le code, puis un commit local par lot après tests verts. Aucune donnée, règle métier ni ordre du parcours n'est modifié. Aucune fonction n'est retirée.

## Lot G1 : fiche devis

| Point | Décision | Ce que fait le lot |
|---|---|---|
| F55 | **Vue de lecture** pour un devis envoyé ou accepté | Les étapes de rédaction (« 1. Prestations et prix », « 2. Conditions et CGV », « Continuer vers les CGV → ») ne s'affichent qu'en brouillon. Un devis envoyé ou accepté montre un bandeau d'état (« Envoyé le… », « Accepté le… »). Son action principale est la suite logique : enregistrer la réponse du client (envoyé), créer le projet ou l'ouvrir (accepté). Aperçu, PDF, copie et historique restent accessibles. |
| F61 | **Boîte de la page** | « Confirmer accepté dans Abby » et « Prolonger la validité » passent par la boîte de dialogue du Manager. Le texte est explicite et la nouvelle date de validité se choisit dans un champ date. Il n'y a plus de `window.confirm` ni de `window.prompt`. |
| F62 | **En-tête sur une ligne** | « Prévisualiser côté client » et « Plus » rejoignent les autres actions de l'en-tête et ne passent à la ligne qu'en fenêtre étroite. |

## Lot G2 : Prospection et projets

| Point | Décision | Ce que fait le lot |
|---|---|---|
| F57 | **Prochaine étape selon l'état du devis** | Devis courant en brouillon : « Poursuivre le devis ». Devis envoyé : « Relancer le client » et « Enregistrer sa réponse ». Devis accepté : la suite déjà prévue. C'est un affichage seul : ni l'étape CRM ni aucune donnée ne change. |
| F58 | **Bandeau, chrono permis** | Un projet terminé affiche « Projet terminé le… » en tête. Ses prérequis et tâches restants sont présentés comme « non faits à la clôture », sans alerte. Le chrono reste possible (retouches après livraison), avec un rappel que le projet est terminé. |
| F60 | **Focus sur la fiche rapide** | À l'ouverture d'une fiche rapide depuis la liste, le focus va à son titre. Échap ou « Fermer » le ramène sur la ligne d'origine. Rien ne change à la souris. |

## Lot G3 : coque et libellés

| Point | Décision | Ce que fait le lot |
|---|---|---|
| F56 | **Un seul bouton jaune par vue** | Fiche de travail du prospect, fiche projet (onglet Production), Sites, Réglages : une seule action principale en jaune, les autres en secondaire. L'action principale de chaque vue est listée dans le lot, avec captures. |
| F59 | **Rail replié automatiquement en fenêtre étroite** | Sous une largeur de fenêtre donnée (environ 900 px), le rail s'affiche replié, sans toucher au réglage enregistré. Déplié à la demande, il passe par-dessus la page et se referme après un choix. En grande fenêtre, le réglage enregistré s'applique. |
| F63 | **Français simple dans Sites** | Les libellés changent : « copie du site » au lieu de « snapshot », « Comparer deux copies » au lieu du « diff », « Importer une copie depuis le Bridge ». « Bridge » reste le nom de l'outil. Aucune donnée, aucun format de fichier et aucun échange avec le Bridge n'est modifié. |

## Preuves prévues (par lot)

- Tests de câblage écrits d'abord.
- Mesures et captures internes avant / après en Noir Confort. Pour F59, une mesure en fenêtre étroite.
- Relevé rapide des autres thèmes.
- Recettes concernées, réécrites si elles décrivent l'ancien affichage (règle H).
- Suite complète et typecheck.

## Ordre proposé

G1 (devis), puis G2, puis G3.
