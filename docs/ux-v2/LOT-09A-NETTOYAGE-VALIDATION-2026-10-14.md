# Lot 09A — Nettoyage contrôlé des copies temporaires

Date : 14 octobre 2026. Branche : `audit/ux-v2-lot09-20261014`.

## Implémentation
- Nouveau module `src/main/expenses/receiptPreviewCleanup.ts`.
- Avant de préparer une nouvelle prévisualisation, tentative de nettoyage **best effort** des répertoires temporaires portant le préfixe exact `atoumweb-receipt-preview-`, datant d'au moins 30 jours.
- Le nettoyage vérifie le type avec `lstatSync`, ignore les liens symboliques, fichiers ordinaires, dossiers récents et contenus d'autres applications. Les répertoires verrouillés par un lecteur externe sont laissés intacts.
- Les échecs de nettoyage ne bloquent pas l'ouverture d'un nouveau justificatif.
- Test Vitest `receiptPreviewCleanup.test.ts` couvrant ancien/récent, répertoire tiers et lien symbolique.

## Limites
- Nettoyage différé au prochain aperçu : une copie créée puis jamais revisitée peut subsister au-delà de 30 jours. Un purgeur autonome ne serait pas justifié à ce stade.
- Un lecteur externe gardant un fichier ouvert peut empêcher la suppression sur Windows ; le nettoyage réessaiera lors du prochain aperçu.
- La vérification `lstat` et la suppression restent séparées (course théorique) : le nettoyage vise uniquement des dossiers temporaires contrôlés, pas un espace partagé non fiable.
- Préservation de l'original et absence de modification de la base métier.
- **Aucun test complet réellement exécuté** : environnement local ne dispose pas du checkout ni du répertoire `node_modules` du dépôt. Les méthodes GitHub disponibles permettent de lire/écrire, pas d'exécuter la recette Windows/Electron. Aucune CI n'a été déclenchée ; ne pas annoncer la suite verte.

## Gates bloquantes
Dans un checkout Windows isolé, sur ce SHA : `npm ci`, `npm run typecheck`, `npm test`, tests ciblés des dépenses/documents/facturation, contrôles migrations et restaurations sur fixtures TEMP, Electron et UX-01. Aucun merge dans `main` avant ces résultats et revue de sécurité du nettoyage.


## PR de validation
La PR draft #113 a été créée pour recueillir des résultats réels du workflow qualité Windows. Cette étape ne constitue pas une autorisation de fusion.
