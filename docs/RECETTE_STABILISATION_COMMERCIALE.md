# Recette Windows — stabilisation commerciale

Workspace obligatoire : une copie TEST, jamais `Documents\AtoumWeb Manager`.

1. Vérifier « SQLite · 19 migrations » et le chargement des données existantes.
2. Créer `DEMO TEST — Boulangerie Martin` sans besoin, puis passer à « À qualifier ».
3. Remplir la qualification et ajouter plusieurs emails/téléphones.
4. Ajouter Site vitrine et Article SEO, puis passer à « Besoin identifié ».
5. Créer le devis, le finaliser et vérifier « Devis à envoyer », puis l’envoyer.
6. Programmer et terminer une relance téléphonique avec résultat et note.
7. Tester négociation, attente avec motif, retour et acceptation.
8. Vérifier la conversion Client idempotente et la création du Projet.
9. Importer un logo et un contrat PDF, renseigner la conservation, archiver puis restaurer.
10. Vérifier historique, recherche globale, fenêtres étroites, trois thèmes et persistance après redémarrage.

La migration 19 reconstruit `prospects` pour étendre ses contraintes. Le moteur coupe les clés étrangères avant la transaction de cette migration uniquement, les réactive ensuite, puis les tests contrôlent `foreign_key_check` et l’intégrité des besoins et événements existants.
