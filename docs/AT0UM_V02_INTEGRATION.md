# Intégration des packs `.atoum` V0.2

Branche : `feature/atoum-v02-pack-integration`

Base : `fix/prospect-recipe-ux-v2` au SHA validé `3bc0f19be1ff47573403ba6ad525c2f6898f31ab`.

## Périmètre de cette première intégration

Cette étape ne prétend pas encore exécuter toutes les capacités métier du format V0.2. Elle met en place le socle nécessaire pour disposer de vraies références dans le Manager avant la refonte Devis :

- migration 22 : registre de packs, références portables, documents de pack et pin de version sur `crm_needs` ;
- lecteur ZIP natif des fichiers `.atoum`, sans dépendance NPM supplémentaire ;
- snapshot complet et immuable par `packageId + packageVersion` ;
- projection des entrées catalogue V0.2 vers `catalog_items` / `catalog_versions` ;
- réutilisation des alias locaux quand ils sont compatibles ;
- archivage des anciennes références devenues incompatibles ou remplacées ;
- création sans prix inventé des dépendances cœur `Hébergement annuel` et `Nom de domaine annuel` en `quote_only` ;
- extraction des DOCX dans le workspace `modeles-contrats/` ;
- copie du pack source dans `packs-atoum/` ;
- conservation des capacités non encore implémentées dans `capability_gaps_json` et état `staged` ;
- import idempotent : réimporter la même version ne crée pas de nouveau pack ni de nouvelles versions catalogue inutiles ;
- refus d’un même `packageId + packageVersion` si son SHA-256 diffère.

## Packs de recette attendus

Les trois binaires doivent être placés dans `resources/offer-packs/` :

- `Site-Vitrine-v0.2.atoum`
- `E-commerce-v0.2.atoum`
- `Maintenance-v0.2.atoum`

Leurs empreintes attendues sont documentées dans `resources/offer-packs/README.md`.

## Ce qui reste volontairement différé

- moteur complet de champs/règles/pricing V0.2 ;
- exécution des workflows de validation ;
- génération finale des contrats à partir des bindings DOCX ;
- gestion complète des actifs gérés/licences ;
- interface utilisateur d’import manuel des packs ;
- refonte de la page Devis.

Le snapshot du pack conserve déjà toutes ces définitions afin qu’elles puissent être activées progressivement sans réécrire les offres installées.

## Validation avant remise à zéro de la base de test

1. Copier les trois packs binaires dans `resources/offer-packs/`.
2. `npm run typecheck`.
3. `npm test`.
4. `npm run package`.
5. Tester une base temporaire neuve et vérifier les trois packs, le catalogue et les trois DOCX extraits.
6. Relancer sur la même base et vérifier l’absence de doublons.
7. Seulement après ces validations : sauvegarder puis supprimer la base SQLite de test utilisateur et redémarrer le Manager.
