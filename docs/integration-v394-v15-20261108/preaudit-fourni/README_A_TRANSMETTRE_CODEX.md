# Complément au pack officiel V3.9.4 / V1.5

Ce dossier accompagne le ZIP officiel d'origine. Il **ne remplace aucun Word** et n'autorise aucune publication.

- `audit_preintegration.py` : validateur source + inventaire SQLite optionnel **en lecture seule**.
- `resultats/CONTROLES_SOURCE.json` : contrôles effectivement exécutés sur les sources fournies.
- `resultats/RAPPROCHEMENT_CATALOGUE_130.csv` : toutes les entrées en attente de rapprochement à l'ID réel.
- `resultats/RAPPROCHEMENT_V39_18.csv` : 18 codes provisoires à traiter individuellement.
- `resultats/RAPPORT_PREAUDIT.md` : lecture des résultats et limites.
- `ETAT_GITHUB_ET_CONSIGNES.md` : particularités vérifiées dans le code GitHub et étapes à mener sur le **worktree Windows actif**, où le lot 2 reste encore non committé.

Les CSV produits sans accès à la vraie base n'attribuent **aucun ID**. Exécuter le script avec `--db` sur la base confirmée pour produire les associations candidates. Même un nom égal ne vaut pas validation d'identité.

Le script utilise uniquement Python standard et ne déclenche ni migration ni insertion dans Manager. Les pièces `01_DOCUMENTS_APPROUVES_METIER/` et `02_EXTRACTIONS_MACHINE/` du ZIP officiel restent les sources d'intégration métier.
