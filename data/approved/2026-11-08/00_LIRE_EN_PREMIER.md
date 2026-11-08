# AtoumWeb → Codex : lot métier validé pour intégration au Manager

**Date de décision : 8 novembre 2026**  
**Versions ciblées : grille V3.9.4 · métier V1.5 · clauses V3.9.4, avec rectificatif 019**

## Décision du dirigeant
Le dirigeant d'AtoumWeb **valide ce lot documentaire tel quel comme référence métier à intégrer au Manager**. Il ne sollicite **pas** de relecture par un juriste ; **Codex ne doit donc pas redemander une validation juridique comme préalable à la préparation et à l'implémentation internes**.

Cette décision n'est **ni une validation de conformité légale**, ni une preuve de souscription RC Pro, ni une adhésion effective au médiateur, ni une autorisation de publication ou de migration destructive. Les mentions de vigilance légale et les statuts source sont préservés. **La commande présente autorise la préparation et l'intégration sur branche de travail, pas une fusion/push sur `main`, ni une activation en production.**

## Commencer ici
1. Lire `05_CONSIGNES_CODEX/ORDRE_MISSION_CODEX.md` et `05_CONSIGNES_CODEX/DECISION_GERANT_PORTÉE_ET_LIMITES.json`.
2. Considérer les **trois Word** du dossier `01_DOCUMENTS_APPROUVES_METIER/` comme *sources métier finales de ce lot*. La bibliothèque retenue est **celle avec le rectificatif 019**.
3. Utiliser `02_EXTRACTIONS_MACHINE/` pour accélérer le rapprochement (données dérivées des Word et contrôlées, **pas une migration à importer aveuglément**).
4. Utiliser `03_SOURCES_COMPARAISON/` uniquement pour le contrôle de filiation et les arbitrages déjà consignés. Ces sources plus anciennes ne doivent pas écraser les trois Word finaux.
5. Lire les rapports et les différences du dossier `04_RAPPORTS_ET_TRACABILITE/`.

## Contrôles du paquet
- 130 références tarifaires, 130 codes distincts ; prix, codes et statuts comparés au JSON commercial V3.9.2 : **0 écart**.
- 119 clauses numérotées de 001 à 119 ; 119 codes contractuels distincts.
- 47 références `RETENU_SUR_DELEGATION_07_11_2026` : ne pas requalifier en approbation tarifaire individuelle.
- **18 codes `V39-`** dans la grille Word finale (la mention antérieure « 15 » est inexacte comme comptage de préfixe et ne doit pas servir de critère d'import).
- Clause 019 : aucun code interne `PAY-005` dans le corps client ; J+23 ponctuel / J+30 et J+60 récurrents selon texte.
- Trois Word copiés **sans modification de contenu** depuis le dernier pack rectificatif.

## Livrables attendus de Codex
Un état `avant/après` du catalogue et de la bibliothèque, un mapping des 18 codes provisoires, une branche et PR, scripts de rapprochement idempotents si requis, tests et rapports datés avec HEAD / commandes / résultats / anomalies, et une notice d'activation **manuelle**. Pas de modification rétroactive des historiques.
