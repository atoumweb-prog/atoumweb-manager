# F71a : clauses des options, suggestions et champs vides (fiche à valider)

Date : 16/11/2026. Lot hors refonte d'interface, issu de F71 (« le moteur des devis et des mentions légales ne fonctionne pas correctement », Carlos). L'échéancier (fin du 30 % par défaut) est un lot à part, F71b.

## Constat (relevé du 16/11/2026)

Relevé fait par un test facultatif (`src/main/commercial/f71Diagnostic.test.ts`, lancé seulement avec `F71_DIAG_OUT`). Il a tourné sur le pack approuvé en mémoire, puis sur une **copie jetable** de la base de préproduction. La préproduction n'a été que lue : son empreinte est identique avant et après.

| Point | Résultat |
|---|---|
| Clauses posées à la création (125 prestations, professionnel et particulier) | toutes en reçoivent (19 à 41) ; aucune clause vide ; aucun champ « à renseigner » restant avec les réglages « Mon entreprise » de la préproduction |
| Offres mariage en professionnel | leurs clauses `MARIAGE-*` sont réservées aux particuliers : écartées en professionnel, présentes en particulier (voulu) |
| **Option ajoutée à un devis déjà créé** | **ses clauses ne viennent pas** : 1 à 30 changements restent à appliquer à la main (« Comparer les nouvelles versions ») ; la même option choisie dans l'assistant à la création : 0 écart |
| **Options suggérées** | **24 sur 42 pointent vers une version retirée** (v1, alors qu'une v2 est publiée) ; dans l'écran du devis, elles s'affichent « Indisponible » et ne s'ajoutent pas (l'assistant, lui, prend déjà la version publiée) ; plusieurs suggestions en double |
| **Champs vides des offres** | sur les 125 prestations publiées, vides partout : prix conseillé, délai recommandé, acompte par défaut, prérequis, conditions particulières, ancien libellé contractuel ; la colonne « Prix conseillé » d'Offres & Tarifs et la fiche affichent « — » pour toutes |
| Acompte | 122 prestations sur 125 reçoivent 30 % (119 en « 30 / 70 » par défaut) : traité en F71b |

## Décisions de Carlos (16/11/2026)

1. **Clauses automatiques** : sur un brouillon non figé, ajouter ou retirer une ligne ajoute ou retire aussitôt les clauses de cette ligne. Les clauses déjà posées et leurs versions ne bougent pas. Un devis figé ou envoyé ne bouge jamais.
2. **Suggestions** : une suggestion vise la prestation et prend toujours sa version publiée, comme l'assistant. Les doublons sont ignorés. Aucune donnée n'est réécrite.

## Ce que fait le lot

1. **Clauses à l'ajout d'une ligne** : `QuoteService.addCatalogLine` recompose les clauses (`ContractTermsService.composeQuote`, composition seule, sans mise à jour de version), comme le font déjà le retrait d'une ligne et l'achat d'une option incluse. La recomposition n'a lieu que si les CGV du devis sont déjà posées : un devis historique créé sans CGV ne reçoit rien d'office.
2. **Suggestions de l'écran du devis** (`QuoteCatalogRecommendationsPanel`, état `quoteRecommendationState`) : la suggestion se résout sur la version publiée de la prestation. Elle reste « Indisponible » seulement si la prestation n'a aucune version publiée ou si elle est inactive. Les doublons sont affichés une seule fois.
3. **Champs vides d'Offres & Tarifs** (affichage seulement, aucune donnée touchée) :
   - la colonne « Prix conseillé » est retirée de la vue standard ; elle reste disponible dans « Colonnes et vues » ;
   - dans la fiche, « Prix conseillé », « Délai recommandé », « Acompte par défaut » et « Ancien libellé contractuel » ne s'affichent que s'ils sont renseignés ;
   - les champs restent tous modifiables dans l'éditeur.

## Hors lot

- L'échéancier et l'acompte (F71b).
- Les particuliers hors établissement (J+8, demande expresse de démarrage, rétractation en ligne) : consignés le 13/11, pas encore à coder.
- La suppression ou le nettoyage des suggestions périmées dans les données (décision : corriger par le code).

## Preuves prévues

- Tests écrits d'abord : clauses d'une option ajoutée après coup (0 changement à appliquer) ; devis sans CGV non touché ; devis figé refusé ; suggestion sur version retirée résolue sur la version publiée ; doublon affiché une fois ; champs vides masqués dans la fiche.
- Relevé F71 repassé sur une copie jetable : 0 écart pour les options ajoutées après coup.
- Suite complète, typecheck, recettes devis natives.
