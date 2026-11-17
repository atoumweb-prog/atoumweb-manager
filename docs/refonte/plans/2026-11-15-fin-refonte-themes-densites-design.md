# Fin de refonte : thèmes AtoumWeb et Blanc, densités Compact et Confort + (fiche courte)

Statut : **décisions de Carlos prises le 15/11/2026** (outil de question).
Skills : `superpowers:brainstorming`, `atoumweb-design` (audit, adapt, colorize). Règles A à J d'`AGENTS.md` ; DESIGN section 2 (« les deux autres thèmes sont alignés ensuite sur les mêmes rôles de jetons, écran par écran »).

## Pourquoi

La refonte et la passe de finitions ont été faites et validées en **Noir / Confort** seulement (décision du 13/11/2026). Carlos voit en Blanc de nombreux textes tronqués (F76). Les quatre autres combinaisons (Blanc, AtoumWeb ; Compact, Confort +) doivent offrir le même écran, avec leurs couleurs.

## Constat (15/11/2026)

- **455 règles CSS ne s'appliquent qu'au Noir** (`:root[data-theme='noir']`), dans 24 fichiers ; 359 seulement en Noir **et** Confort. Elles portent surtout de la mise en page (taille, `display`, espacements, marges, grilles), rarement une couleur. Plus gros fichiers : `crm/client-expanded-v2.css` 76, `client-list-quick-v2.css` 64, `client-contacts-v2.css` 59, `ui-consistency-v2.css` 52, `client-contracts-v2.css` 38, `client-commercial-v2.css` 38, `home/HomeDashboardV2.css` 28. Les autres thèmes n'ont que 4 (Blanc) et 7 (AtoumWeb) règles propres.
- **Relevé des 17 pages, premier écran**, dans cinq combinaisons (Noir Confort, Blanc Confort, AtoumWeb Confort, Noir Compact, Noir Confort +) : aucun petit texte, aucun défilement, aucun débordement ; textes abrégés identiques au Noir (abréviations voulues). Les écarts sont donc dans les **fiches** (fiche client agrandie, contacts, contrats, commercial…), là où se concentrent les règles réservées au Noir.
- Vu en Blanc : **logo de l'Accueil à moitié invisible** (« Atoum » blanc sur fond blanc) et logo différent sur la page Clients ; en-têtes de colonne sur deux lignes.
- Captures du relevé : `C:\DEV\Livrables\Cadrage-parcours\captures-fin-refonte\releve\` (un dossier par combinaison).

## Approches considérées

1. **Règles communes** (**choisie par Carlos**) : une règle de mise en page vaut pour tous les thèmes et toutes les densités ; seules les couleurs changent, par les jetons de R0. Les préfixes `:root[data-theme='noir'][data-density='comfort']` des règles de mise en page sont retirés ; une couleur écrite en dur y devient un jeton.
2. Garder seulement le Noir (retirer Blanc et AtoumWeb des Réglages) : écartée, Carlos garde le choix d'un thème clair.
3. Recopier les règles pour chaque thème : écartée (trois fois plus de CSS, contraire à la charte).

## Découpage décidé (quatre lots, chacun avec captures avant / après dans les cinq combinaisons)

| Lot | Contenu |
|---|---|
| **F1 Clients** | les ~300 règles des fichiers `crm/client-*-v2.css` et `ClientsPageV2.css` deviennent communes ; fiche client rapide et agrandie, onglets Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique |
| **F2 Le reste** | les autres règles réservées au Noir (`ui-consistency-v2.css`, `home/HomeDashboardV2.css`, `ui/workspace-header.css`, `time.css`, `projects.css`, `projects/sites-pages-v2.css`…) |
| **F3 Couleurs et contrastes** | Blanc et AtoumWeb : logo (le même partout, lisible sur fond clair), boutons, pastilles, tons des chiffres clés, contrastes mesurés (texte normal ≥ 4,5:1) |
| **F4 Densités** | Compact et Confort + : hauteurs de contrôle, marges, retours à la ligne ; textes toujours ≥ 14 px |

## Thème par défaut (décision de Carlos)

Au premier lancement, le Manager s'ouvre en **Noir** (au lieu d'AtoumWeb). Le réglage déjà enregistré d'un poste n'est pas touché.

## Règles

- Aucune donnée, règle métier ni parcours modifiés ; aucune nouvelle couleur en dur ; `!important` d'`ui-consistency-v2.css` au plus 86 (à faire baisser quand une règle devient commune) ; budget des petits textes 12.
- Le rendu Noir / Confort validé ne doit pas bouger : captures Noir / Confort avant / après à chaque lot, mesures identiques.
- Tests d'abord : garde de source par fichier (« plus aucune règle de mise en page réservée au Noir ») ; mesure des cinq combinaisons sur les fiches.
- Un commit local par lot après la recette de Carlos ; aucun push sans son accord.

## Hors périmètre

Acompte par défaut et moteur des devis (F71), vue Parcours commercial (F69), décisions F55 à F63.

## Révisions

(aucune pour l'instant)
