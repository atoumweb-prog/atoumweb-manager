# Rail réduit — correction de rendu et rapprochement du référentiel

Date : 15 octobre 2026. Base : `c4bb744dbe58531350a61fb16ad5f8fbe90bd59d`.
Branche : `codex/fix-v2-collapsed-rail-render`. Correctif : `241bf1d6`.

## Référentiel repris

La branche documentaire `docs/ux-v2-reference-v1` a été récupérée et lue au SHA `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`. Les documents utilisés sont `LOT-02A-RAIL-NAVIGATION.md`, `LOT-02B-ENTETE-RACCOURCIS.md`, `LOT-01A-TOKENS-VISUELS.md`, `DESIGN-SYSTEM.md` et les décisions E42/E45. Aucun ancien code de cette branche n'a été intégré.

| Attendu | Constat actuel | Traitement |
|---|---|---|
| E42 : Accueil, favoris, cinq groupes en mode réduit ; 17 modules déployés | Architecture conservée | Aucun changement de routes |
| Sous-menu explicite, fermeture accessible, recherche et chrono disponibles | Le menu commençait à 12 px du haut derrière l'en-tête | Placement mesuré sous l'en-tête et dans le viewport |
| Libellés explicites dans les groupes | Le centrage réservé aux icônes du rail s'appliquait également aux libellés | Alignement à gauche et marque active dans le flux |
| Clavier et retour du focus | À préserver au premier affichage aussi | Premier bouton focalisé, Échap et fermeture native testés |
| Trois thèmes, trois densités | Tokens existants conservés, dont le thème Blanc clair | Neuf configurations testées |
| Logo triangulaire et pictogrammes définitifs | AWM et certains repères alphabétiques restent provisoires | Réserve visuelle maintenue, aucun nouveau logo inventé |
| En-tête discret et repliable | Modes développé/compact existants ; un champ et une commande de recherche sont présents | Pas de refonte arbitraire de l'en-tête dans ce correctif |

Le référentiel n'est pas recréé. Cette vérification ciblée ne certifie pas la conformité graphique globale des lots 01–10 : les dimensions finales, les visuels provisoires et la recette humaine restent ouverts.

## Cause et correction

Le rail forme une couche `z-index:10`, tandis que l'en-tête est à `20`. Son sous-menu fixé à `top:12px` était peint sous l'en-tête. Un test qui utilise seulement `element.click()` n'identifie pas cette occultation.

Le menu reste dans le rail et conserve ses gestionnaires existants. Un effet de disposition mesure le bord du rail, le déclencheur, l'en-tête et le viewport avant peinture. Il recalcule le placement au redimensionnement, au défilement et lorsque l'en-tête change de hauteur (y compris le zoom). Le menu peut défiler avec fermeture persistante. Il n'est pas artificiellement placé au-dessus des dialogues du chrono ou de la recherche.

Aucune écriture supplémentaire de préférence, aucun service, IPC, schéma SQLite, règle commerciale ou garde UX-01 modifié. Les profils, workspaces et exécutables utilisateur restent inchangés.

## Preuves réellement obtenues sous Windows

- Reproduction avant correction : le nouveau contrôle échoue sur « Flyout title painted and unobscured atoumweb/compact/Commercial ».
- `npm run typecheck` : réussi sur les sources finales.
- `npm test -- --maxWorkers=2` : 1 453/1 453, 162 fichiers, 185,63 s ; restaurations 35/35 en 4,863 s, aucun échec ni erreur RPC rapportée. Exécution sur la copie de travail corrective avant commit, distincte d'une CI hébergée.
- `node scripts/check-ux-v2-lot02a-workshop.cjs` : 117 + 8 assertions, deux phases initialisation/redémarrage ; brouillon et identité du composant préservés.
- `node scripts/check-ux-v2-lot01a-real-ui.cjs` : 840 assertions réussies, 17 destinations, 54 visites thème/densité, 5 visites étroites, 10 visites zoom ; aucun débordement ni erreur console relevé. Inclut les dialogues du vrai chrono, les brouillons et les préférences interfenêtres.
- `node scripts/check-unsaved-inputs-ui.cjs --lot-b --lot-c --review` : 192 assertions, aucun échec ; les erreurs de conflits IPC injectées sont attendues, vérifiées et ne constituent pas des erreurs non gérées.
- Recette ciblée au commit `241bf1d6` : 470 assertions réussies, neuf captures synchronisées avec la peinture du compositeur, cinq groupes × neuf configurations ; fenêtres 850×750 et 500×700, zoom 150 %, mode compact et développé, redimensionnement pendant l'ouverture, hit-testing du titre/des boutons, dernier lien accessible par défilement, fermeture au pointeur natif, focus, chrono unique, absence de mutation métier, intégrité et FK.

Commande reproductible (nouveau dossier de captures absolu requis) :

```powershell
$env:ATOUMWEB_RAIL_RENDER_ONLY='1'
node scripts/check-ux-v2-lot01a-real-ui.cjs --captures C:\chemin\nouveau-dossier
```

Le scénario est aussi inclus dans la recette réelle ordinaire : il ne dépend pas d'un lancement manuel particulier pour rester couvert. Les captures et journaux locaux sont ignorés par Git ; aucune capture de données réelles n'a été produite.

## État de livraison et réserves

Correctif local indépendant ; aucun push, aucune CI hébergée, aucune fusion ni remplacement de l'application actuellement lancée. Les captures finales sont dans `captures/rail-render-241bf1d6/`. Avant distribution, publier/revoir le correctif puis préparer une version empaquetée validée ; ne pas écraser un exécutable en cours d'utilisation.

La correction rétablit les exigences de visibilité et d'accessibilité du rail. L'approbation du style global, des pictogrammes et du logo reste distincte. Aucun constat technique ne vaut approbation visuelle humaine.
