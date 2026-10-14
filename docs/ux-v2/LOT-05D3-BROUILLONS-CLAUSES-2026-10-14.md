# Lot 05D.3 — Signalement précis des brouillons contractuels

Ce changement est uniquement visuel et ne modifie ni la persistance, ni les snapshots, ni le moteur de synchronisation des devis.

- Le Builder identifie les clauses dont le titre ou le texte diffère de la dernière version chargée.
- L'avertissement indique le nombre de clauses concernées.
- Chaque clause modifiée porte son propre libellé « Modifications non enregistrées », en plus des mentions existantes de personnalisation.
- Le mécanisme UX-01 `useUnsavedDraft` demeure inchangé, tout comme `mergeDraft` et les droits de modification selon les états du devis.

## Contrôles requis

Typecheck, tests Vitest, recette Electron TEMP : modification simultanée de deux clauses, enregistrement de l'une sans effacement de l'autre, Rester/Quitter, passage à un autre devis, synchronisation et réponses tardives, devis figé et devis historique incomplet. Contrôler thèmes, densités, clavier et focus.

La CI de la branche a précédemment échoué avant affectation d'un runner. Cet incrément ne doit pas être déclaré validé sans preuves au dernier HEAD. Aucune fusion dans `main` sans accord humain.
