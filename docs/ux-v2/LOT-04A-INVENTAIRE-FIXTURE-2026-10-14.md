# 04A — Inventaire vérifiable de la fixture Catalogue V1 (14 octobre 2026)

**Périmètre strict :** lecture de `data/catalogue/atoumweb-catalogue-v1.json` dans le dépôt GitHub. **Aucune base client ou Validation-MSI** consultée. La fixture vient du référentiel `AtoumWeb_Catalogue_V1_Contractuel_consolide.xlsx`, SHA source `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.

## Constat à l'inspection

- **112 fiches**, dont **6 offres** et **106 services**.
- **13 catégories brutes distinctes**, non nécessairement assimilables aux libellés UI finaux : `APP` (5), `CONTENU` (12), `DATA` (6), `DEVWP` (4), `ECOM` (7), `IDENTITE` (13), `LANDING` (7), `MAINT` (4), `MARIAGE` (5), `PHOTO` (10), `SEO` (13), `TECH` (13), `WEB` (13).
- Aucune fiche sans nom, catégorie ou code canonique dans cette fixture.
- Aucun doublon de code canonique normalisé, aucun doublon de nom normalisé observé dans cette fixture.
- Pas de collision entre les libellés de catégorie après normalisation française (casse, accents, espaces) dans cette fixture.

## Contrôle automatisé ajouté

`src/main/commercial/CatalogInventory04A.test.ts` vérifie sur cette source : unicité des codes canoniques normalisés, champs requis, présence des deux types métier `offer/service`, absence de collision des catégories normalisées, traçabilité de la source et présence des versions. **Ne pas annoncer PASS tant que la CI du SHA correspondant n'est pas verte.**

## Limites de preuve

- Une fixture de référence **n'est pas la base d'un client** ni un inventaire de ce qui est actuellement stocké par un utilisateur.
- Les noms de catégories techniques (`WEB`, `TECH`, etc.) ne sont **pas** des catégories d'interface à renommer automatiquement.
- L'intégration du référentiel administratif 04B sur une base existante doit conserver la valeur legacy `catalog_items.category`, sans supposer la migration de toutes les fiches réelles.
- Les archives, suppressions volontaires et anciennes lignes de devis doivent être testées sur fixtures historiques indépendantes.
