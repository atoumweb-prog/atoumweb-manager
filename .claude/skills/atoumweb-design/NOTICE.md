# Notice

Ce skill est une version locale et modifiée de **Impeccable**, créé par **Paul Bakaus**
(https://github.com/pbakaus/impeccable), distribué sous licence **Apache License 2.0**
(texte intégral dans le fichier `LICENSE` de ce dossier).

## Modifications apportées (Apache-2.0, section 4b)

Par rapport à la version 4.9.0 d'Impeccable :

- suppression du binaire « engine », des lanceurs `scripts/`, du mode live, des hooks, de `doctor`, de `npx impeccable` et de la capture d'écran embarquée ;
- `new-work.md` conservé sous forme de version condensée et réécrite (sans tirage au sort, maquettes générées, sous-agents ni binaire) ; `craft.md`, simple alias déprécié sans méthode propre, n'est pas repris ;
- suppression des sous-agents, des références natives iOS / Android (dérivées de ehmo/platform-design-skills, licence MIT) et de la génération d'images ;
- suppression de la création de `PRODUCT.md`, `DESIGN.md` et `.impeccable/` ; remplacée par un unique document `docs/refonte/DESIGN.md`, jamais écrit sans accord de l'utilisateur ;
- réécriture de `SKILL.md` et de `critique.md` ; adaptation de `audit.md`, `polish.md`, `layout.md`, `typeset.md`, `shape.md`, `craft-floor.md` pour fonctionner par lecture du code et des captures d'écran ;
- ajout des règles propres au projet AtoumWeb Manager (AGENTS.md, périmètre du lot).

Les fichiers `reference/*.md` conservés restent, pour l'essentiel, le texte d'origine.
