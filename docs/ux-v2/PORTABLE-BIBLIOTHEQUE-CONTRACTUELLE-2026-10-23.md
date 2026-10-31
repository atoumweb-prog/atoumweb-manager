# Bibliothèque contractuelle ajoutée au portable — 23/10/2026

Demande explicite : vérifier le dernier lanceur et ajouter la base contractuelle absente avant de modifier l’interface. Le portable contient le Manager complet et ses corrections ; son Workspace TEST neuf était vide de référentiels contractuels. Ce sont deux sujets distincts : code applicatif et données du Workspace.

## Réalisation

Cible : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-1ddd01fb/Workspace/data/atoumweb-manager.sqlite. Même lanceur CMD, profil et exécutable inchangés ; aucune reconstruction nécessaire pour l’ajout de données.

Référence lue sans modification : C:/DEV/02_DONNEES/AtoumWeb/Reference-V2-20261015/data/atoumweb-manager.sqlite. Son état contractuel correspond au suivi antérieur de recette ; textes, versions, provenance et états conservés, sans nouvelle publication ni approbation juridique inventée.

Ajout : 118 clauses/118 versions publiées pour recette, dont 19 clauses de socle, 409 liens clause/prestation, 13 types et 13 versions de type en brouillon, 147 associations de modules et 112 rattachements de types au Catalogue, provenance d’import conservée. Aucun classement 05C approuvé inventé (référence sans classement).

Dépendances : 92 références Catalogue manquantes ajoutées avec leurs versions. Pour les 21 identités déjà présentes, 21 versions de référence supplémentaires en brouillon reçoivent les liens de type ; les anciennes versions publiées et leurs prix ne sont pas remplacés. Total 119 versions Catalogue ajoutées. Les clauses liées par identité de prestation restent utilisables sur les devis, selon composition explicite. Les types en brouillon ne sont pas présentés comme publiés.

## Préservation et contrôles

Manager fermé par Carlos avant application. Sauvegarde SQLite coordonnée conservée sous Workspace/backups/ajout-bibliotheque-20261023-2/avant-ajout-bibliotheque.sqlite ; première sauvegarde/essai sans application conservés sous ajout-bibliotheque-20261023.

Essai préalable sur copie indépendante, transaction et contraintes actives, puis vérification d’un rejeu neutre. Le premier essai a refusé de rattacher un type à une version Catalogue déjà vendue ; rollback de la copie, aucune modification de la cible par cet essai. Les versions de référence en brouillon respectent cette garde, aucun trigger supprimé ou contourné.

Après application, chaque ligne préexistante de chaque table est vérifiée identique : 2 devis, leurs 4 lignes, dossiers, identités, prix, snapshots, documents, paramètres et historiques conservés. Les tables hors import restent exactes. FK vide, intégrité ok ; source inchangée. Rapport détaillé et empreintes dans Workspace/backups/ajout-bibliotheque-20261023-2/RAPPORT.json.

Composition par les véritables services sur la copie indépendante uniquement : devis TEST E-commerce, 15 clauses du socle applicables + 13 de prestation, texte assemblé de 18 826 caractères, sources sans doublon, FK/intégrité correctes. Aucun devis de contrôle ajouté dans le Workspace utilisateur.

## Utilisation et limites

Relancer le même CMD : la bibliothèque est désormais dans sa base. Les devis existants n’ont pas été resynchronisés automatiquement ; la comparaison/adoption explicite des clauses reste à utiliser avant modification. Les informations administratives AtoumWeb et décisions propres au dossier restent à compléter selon les contrôles existants. L’ajout de la bibliothèque ne résout pas encore l’ergonomie ni tous les blocages de finalisation.

Aucune fusion/push/CI, aucun changement d’interface ou du code de la PR #1. Le code provient toujours du Manager complet avec les modules natifs ; le Workspace est une copie de travail indépendante et ne se synchronise pas avec les autres versions.

Pour la prochaine livraison : reprendre explicitement cette bibliothèque et ses dépendances en conservant les saisies du Workspace choisi ; le seed portable générique actuel ne l’importe pas automatiquement. Vérifier bibliothèque/clauses/liens et un véritable assemblage avant toute nouvelle annonce de livraison. Ne pas remplacer globalement les données ni republier les brouillons.
