# Intégration de l’accord RGPD V3 par Site

État : lot technique préparé sur une branche séparée, sans publication ni écriture dans une base utilisateur.

## Source conservée

- Document reçu : `AtoumWeb_Accord_RGPD_V3.docx`.
- SHA-256 : `7C646476C7F35E73D1681F2DAD602994873C018048A98ECCE086CDDD7B07B51F`.
- Export structuré : `data/contracts/atoumweb-rgpd-v3.json`.

## Architecture retenue

- Un accord est rattaché à un Site de Projet et au client maître du Projet.
- Il n’est jamais créé ni joint automatiquement à tous les devis.
- Sa préparation résulte d’une action explicite dans la fiche du Site.
- Les versions envoyées et signées sont immuables ; une modification crée une nouvelle révision liée à la précédente.
- La signature exige une preuve documentaire active appartenant au même client.
- Le contrôle ne bloque que les traitements déclarés dans la dernière version. Une révision comportant des traitements doit elle-même être signée avant leur exécution.
- La base interne rappelle le fonctionnement actuel : sauvegardes o2switch Cloud selon le service souscrit, sans présumer une sauvegarde indépendante AtoumWeb.

## Parcours disponible

Dans Projet > Sites & pages > fiche Site :

1. préparer volontairement l’accord ;
2. renseigner les traitements, finalités, données, sortie, contact incident, transferts et sous-traitants ;
3. enregistrer puis confirmer l’envoi ;
4. sélectionner la preuve signée du même client et confirmer la signature ;
5. créer au besoin une révision sans altérer l’historique.

La migration 80 crée uniquement la structure nécessaire. Elle n’insère aucun accord et ne modifie aucun devis, contrat ou document existant.

## Contrôles ciblés

- TypeScript : réussi.
- Migrations + service RGPD + non-régression Sites : 25 tests réussis.
- Cas couverts : consultation sans écriture, unicité du brouillon modifiable, validation de complétude, preuve du même client, immutabilité, historique, révision et contrôle limité aux traitements déclarés.
