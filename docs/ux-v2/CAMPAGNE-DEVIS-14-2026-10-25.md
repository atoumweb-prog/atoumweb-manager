# Campagne du moteur de devis — 14 demandes réalistes

Demande Carlos du25octobre2026 : observer le moteur réel sur un Catalogue réel, sans corriger silencieusement les défauts, publier de clauses ou modifier le Workspace utilisateur.

## Livrables et reproduction

- [Dossier de relecture](../../output/campagne-devis-20261025/Dossier-campagne/INDEX.md).
- [Synthèse détaillée](../../output/campagne-devis-20261025/Dossier-campagne/SYNTHESE.md).
- [Tableau des14résultats](../../output/campagne-devis-20261025/Dossier-campagne/TABLEAU-RESULTATS.md).
- Archive : `C:/Users/AtoumWeb/Downloads/AtoumWeb-Campagne-14-devis-20261025.zip`.
- Harnais opt-in : `scripts/campaign-real-quotes-20261025.cjs`, chargeant `output/campagne-devis-20261025/runner.ts` et l’inventaire `catalogue.json`. Workspace source absolu obligatoire ; sauvegarde SQLite vers un nouveau TEMP/Validation-MSI, profil séparé et empreinte logique source avant/après. Aucune mutation source.

Sources métier du dépôt courant, compilation Electron native du vrai renderer/preload/IPC et moteur `generateQuotePdf`/`renderQuotePdfBuffer`. Aucun PDF commercial reconstruit manuellement. Ce n’est pas une nouvelle validation du binaire portable livré ni un parcours manuel de saisie de chacun des champs.

## Résultats obtenus

-14PDF nominaux /135pages ;14fiches et14rapports.
-92contrôles automatiques réussis ;10calculs indépendants après modification conformes.
-14ouvertures dans React et exports via preload/IPC, texte identique à la voie de génération de service ; aucune erreur console au passage final.
- Corps des clauses actives retrouvés intégralement dans les14PDF. Logo, franchiseTVA et acceptation commune présents. Les14planches de rendu ont été inspectées ; défauts de pagination conservés et signalés.
-10PDF après modification, identifiants/numéros stables et snapshots des lignes survivantes inchangés. Retrait de maintenance : modules orphelins désactivés. Pas de prolongation calendaire démontrée sur correction deux jours plus tard ; seulement un changement de quelques millisecondes.
-2prévisualisations humanisées en mémoire, non adoptées et non publiées ; références v1désignant leurs sources, aucune nouvelle version publiée.
-2PDF de contrôle consommateurs démontrant la préparation autorisée avec des champs textuels non résolus.
- Empreinte logique de toutes les tables source identique avant/après ; intégrité et clés étrangères de la copie conformes.

## Défauts prioritaires observés, non corrigés

1. Critique : préparation autorisée malgré les champs de médiateur/réclamation/rétractation restés dans les corps publiés (10/11). Les paramètres ne les résolvent pas automatiquement.
2. Haute : quantité supplémentaire passée de5à11mais descriptif restant5et15au total (MOD-08). Arithmétique exacte, sens commercial incohérent.
3. Haute : coordonnées du destinataire absentes du PDF alors que les12entreprises fictives disposent d’adresse/email/téléphone. Adresse des particuliers non structurée dans le modèle Contact testé.
4. Donnée Catalogue incomplète / refus correct :03/07/13/14ne peuvent pas être préparés avec les maintenances annuelles «Même périmètre que mensuel / Mêmes exclusions» ; les gardes fonctionnent.
5. Pagination :04page2et13pages2/4presque vides ;14totaux séparés du tableau ; périmètres courts et signatures seules parfois trop espacés.
6. Rédaction : codes BASE-VALIDATION/BASE-DONNEES et «Je veux…» encore présents dans les sources publiées ; aucun texte remplacé pour cacher le défaut.
7. Catalogue : aucune option structurée ;09est une alternative Landing+entretien technique WordPress, pas une gestion marketing.11utilise un vrai renouvellement à30€mais la durée initiale de la formule reste une hypothèse explicite. Tranches19/17/15€sans pilotage structuré observé.

Le verdict est une réussite des calculs dans les cas testés et une validation seulement partielle de la production contractuelle. Les documents ne sont pas prêts pour des clients réels. Aucune certification juridique déduite du passage des contrôles.

## Limites et suite

Les périodes, droits, qualifications et informations administratives absentes ont des hypothèses TEST explicites, sans organisme ni accord réellement désigné. Les versions publiées restent intactes. Un nouveau brouillon TEST dans la seule copie vérifie l’absence d’adoption silencieuse ; il n’a pas été publié. Les documents nominaux restent brouillons ; aucune transmission ou acceptation client réelle simulée.

Le harnais a été ajusté lors de sa mise au point (API d’export, IPC annexes, unité de remise et cohérence des hypothèses). Ces erreurs de montage ne sont pas des défauts applicatifs. Les résultats finaux sont ceux remis ; aucune correction du moteur, du Catalogue ou des clauses publiées.

Prochaine décision : examiner les PDF et anomalies avec Carlos avant un lot correctif séparé. Pas de push, fusion, déploiement ou nouvel exécutable dans cette campagne.
