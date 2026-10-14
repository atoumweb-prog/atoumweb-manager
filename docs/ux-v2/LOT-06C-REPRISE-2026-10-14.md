# Lot 06C — Composition des devis, catalogue, options et prix

Date : 14 octobre 2026. Branche indépendante depuis `main`.

## Audit initial

Le module `QuoteOfferOptionsPanel.tsx` présente les services obligatoires inclus et les options disponibles/achetées en utilisant les versions enregistrées dans les snapshots des lignes du devis. L'achat et le retrait passent par les méthodes explicites `selectOfferOption` et `deselectOfferOption`. Il ne faut jamais transformer implicitement une option disponible en option achetée ni recalculer un snapshot historique depuis la dernière version du catalogue.

Les lignes supplémentaires sont saisies dans `QuoteDraftLines.tsx`. La refonte 06C doit préserver la quantité au millième, les prix en centimes, le prix proposé distinct du tarif catalogue, les remises et l'origine de chaque ligne.

## Premier correctif : garde anti-double clic

Commit `9f74daf8260faef05bdc4a475330bf29c7b62324` : dans le panneau des options, un verrou `useRef` pris **avant le premier await** empêche de lancer deux mutations concurrentes si l'utilisateur clique deux fois très rapidement sur « Ajouter au devis », « Modifier l'option » ou « Retirer l'option ». Le verrou est relâché en `finally`, y compris après une erreur. Le state `busy` continue de désactiver les boutons et l'éditeur à l'écran.

## Suite et recette obligatoires

- Comparer prix catalogue, proposé, contractuel et total en centimes, quantités 0.001/1/1.5 et remises.
- Tester un double clic synchrone, succès et échec serveur puis nouvelle tentative.
- Tester sélection/retrait des options, version d'offre figée, refus de doublons, origine conservée.
- Vérifier le cas offre sans option, version historique et données de provenance manquantes sans requalification automatique.
- Rejouer typecheck, Vitest, puis un scénario Electron Windows TEMP **sur le SHA testé**.
- Coordonner 06A PR #110 et 06B PR #112 ; ne pas fusionner ce lot à `main` avant validation et arbitrage des dépendances.

**État : un correctif applicatif publié, aucune recette 06C exécutée au moment de cette rédaction.**
