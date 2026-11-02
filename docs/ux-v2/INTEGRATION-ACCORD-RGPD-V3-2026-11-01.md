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
- Le Manager distingue une attestation d’envoi externe d’un envoi réellement effectué par le Manager. Ce lot ne fournit aucun transport de courriel.
- L’attestation conserve canal, destinataire, référence, date et empreinte SHA-256 de la version exacte envoyée.
- La signature exige une preuve documentaire active appartenant au même client, la version attendue et la même empreinte que l’envoi attesté.
- Une évaluation explicite des services et traitements existe même sans fiche d’accord. L’absence de fiche ne signifie jamais « aucun accord requis ».
- Le contrôle ne bloque que les traitements déclarés dans la dernière version. Une révision comportant des traitements doit elle-même être signée avant leur exécution.
- Un registre d’incidents séparé par Site conserve les faits, dates, signalements et résolutions sans altérer les accords.
- La base interne rappelle le fonctionnement actuel : sauvegardes o2switch Cloud selon le service souscrit, sans présumer une sauvegarde indépendante AtoumWeb.

## Parcours disponible

Dans Projet > Sites & pages > fiche Site :

1. préparer volontairement l’accord ;
2. renseigner les traitements, finalités, données, sortie, contact incident, transferts et sous-traitants ;
3. enregistrer puis attester un envoi réellement effectué hors du Manager ;
4. sélectionner la preuve signée du même client et confirmer la signature de la version exacte envoyée ;
5. créer au besoin une révision sans altérer l’historique.

La migration 80 crée uniquement la structure nécessaire. Elle n’insère aucun accord et ne modifie aucun devis, contrat ou document existant.

## Contrôles ciblés

- TypeScript : réussi.
- Suite complète : 1 771 tests réussis, 1 test opt-in ignoré, aucune défaillance.
- Migrations 78 à 80, service RGPD et non-régression : 26 tests ciblés réussis.
- Recette opt-in #161 + #164 sur copie SQLite : réussie ; source inchangée, 118 brouillons contractuels et 6 brouillons Catalogue préparés dans la copie uniquement.
- Cas couverts : obligation à évaluer sans fiche, attestation externe, empreinte exacte, refus d’une autre version, preuve du même client, prestataires et transferts vérifiés, immutabilité, historique, révision et contrôle limité aux traitements déclarés.
