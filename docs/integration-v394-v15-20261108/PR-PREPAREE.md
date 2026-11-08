# PR de revue #166

Titre : Intégrer le pack métier V3.9.4 / V1.5 en brouillons, avec le socle lot 2 préservé

Base : codex/ux-v2-offres-tarifs-20261106
Branche : codex/integration-v394-v15-20261108
État au 08/11/2026 : diffusion publique autorisée, push confirmé et [PR #166](https://github.com/atoumweb-prog/atoumweb-manager/pull/166) ouverte en brouillon. Base Offres & Tarifs publiée ; aucune fusion main ni activation habituelle.

Le pack métier approuvé V3.9.4 / V1.5 devient une source versionnée pour les imports Catalogue et clauses existants : 130 références, 119 candidats contractuels, conservation des 47 statuts de délégation et des 18 identifiants provisoires sans alias AW inventé. La transaction globale, les reçus durables, les contrôles de versions et les snapshots sont préservés ; aucune publication ni migration habituelle n’est déclenchée.

Cette branche inclut d’abord le lot 2 local validé (commit c7ee0a3), puis l’intégration. La base de revue est codex/ux-v2-offres-tarifs-20261106 ; aucune fusion main ni mise en service demandée.

Validation : 172 tests distincts ciblés, typecheck, 13 contrôles Electron sous trois thèmes, 14 PDF + 14 DOCX simulés et rendus contrôlés (154 pages), paquet Windows x64. Sauvegarde/restauration et migration 81 après import sur copie TEMP concluantes ; anciennes versions, 142 tables et snapshots protégés. Aucun brouillon multiple dans la base de référence.

À examiner : mapping des 21 IDs repris / 109 créations, 18 codes provisoires sans équivalent démontré et sans code canonique attribué, cartographie contractuelle proposée non activée, obligations B2C/notification/résiliation restant visibles et étapes d’activation manuelle. Aucun devis accepté/contrat signé ni base habituelle modifié. Aucun statut d’assurance/médiation inventé.

Rapport : docs/integration-v394-v15-20261108/RAPPORT-INTEGRATION-2026-11-08.md ; CSV des 130/18 et cartographie proposée dans le même dossier. Les sources Word originales et leurs extractions sont épinglées par SHA256.
