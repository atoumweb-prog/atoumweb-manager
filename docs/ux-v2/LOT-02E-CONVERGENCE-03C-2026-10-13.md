# Convergence 02C / 02D / 03C — matrice préparatoire 02E

Lecture du [document de coordination de #98](https://github.com/atoumweb-prog/atoumweb-manager/blob/codex/ux-v2-lot03a-crm-audit/docs/ux-v2/LOT-03C-COORDINATION-02C-02D-2026-10-13.md), comparaison Git uniquement. **Aucune fusion, aucun arbre combiné appliqué, aucune validation combinée annoncée.**

## Références réellement examinées

| Source | SHA | État observé |
|---|---|---|
| main | 278ff2da022ba5e58ae333de11e74bc4d12a2995 | Inchangé |
| #99 / 02C | 7549770428fcbb53d89a60fcc92dd5cb6d8f258d | Draft, CI737 verte943/943 |
| #100 / 02D | d3ef589be9090bc1a5f04cab625228d2a4aa42d7 | Draft, CI741 verte963/963 ; contient #99 |
| #98 à la première lecture | 69e89044d33c5e27b41f2cfc314ecf9c972e5759 | CI746 verte936/936 et66 assertions Electron ; remplace la référence historique740/934 pour ce SHA |
| #98 à la vérification suivante | 46a190f56093c5c6ec052b18fc2416b0d48a5266 | Nouvelle CI en cours au relevé ; ne pas lui attribuer le résultat746 |

Entre69e8904 et46a190f, les trois fichiers communs ci-dessous sont **identiques** (diff Git vide). Les autres évolutions Contacts/Besoins/IPC restent la propriété de #98 et ne sont pas reprises ici. Ces références peuvent encore évoluer : figer à nouveau tous les HEAD avant une future branche d'intégration.

## Matrice des deltas et conditions de conservation

| Fichier commun | Delta #99 vs main | Delta #98 vs main | Conditions du futur rapprochement |
|---|---|---|---|
| scripts/check-ux-v2-lot01a-real-ui.cjs | +13/-4 : --search-only, vrais handlers IPC capturés, fenêtre visible, fixture02C et contrôles SQLite | +13/-6 : --lot03b, dossier de captures, neuf captures commerciales, sortie métier anticipée | Parsing commun explicite, modes exclusifs, dossiers neufs sûrs, zéro écrasement des sorties ; conserver les deux fixtures, la collecte IPC et les deux comptages |
| src/renderer/commercial/QuotesPage.tsx | +5/-2 : onEntityReady, confirmation du Devis effectivement chargé, erreur d'ouverture explicite | +2/-1 : canAccessQuoteProject(detail) et import de la règle commerciale | Conserver simultanément confirmation/anti-races/UX-01 et éligibilité Projet ; une auto-fusion textuelle ne certifie pas la cohérence métier |
| src/renderer/crm/ProspectsPageV2.tsx | +6/-2 : onEntityReady, ID exact, échec de chargement et callback de modèle chargé | +44/-24 : projection6+1, exclusion new, conversions réelles, navigation historique, restrictions du drop | Confirmer le **modèle affiché** dans Annuaire, Pipeline, Historique, Conversion et bureau ; ne pas confirmer un selectedId global dont le panneau est caché/filtré ; conserver E72/E73, onglet et brouillons |

Les fichiers communs de #100 sont exactement ceux de #99 : aucun delta02D propre sur ces trois chemins. Le conflit du banc partagé avait été relevé au jalon précédent par simulation ; **aucune nouvelle fusion ou résolution n'est effectuée dans ce jalon**. Les deux pages doivent être revues sémantiquement même si Git peut les auto-fusionner.

L'adaptateur UI commun a été durci dans le nouveau périmètre02E, sans modifier les pages CRM : reconnaissance de la fiche historique existante, priorité au panneau modal visible, refus des panneaux cachés, relecture lors du remplacement d'un panneau à ID constant. Cela fournit une capacité utile au rapprochement, mais **ne prouve pas le parcours Conversion de #98** avant recette combinée.

## Contrôles statiques automatisés

`node scripts/check-ux-v2-compatibility-map.cjs` lit les versions par git show/git diff, enregistre les SHA, SHA256 des trois sources, deltas et présence des mécanismes indispensables. Il ne checkout aucune branche, ne fusionne rien et n'exécute pas les services de #98. `combinedValidation:false` est explicite dans le manifeste.

Deux relevés locaux ont été faits :69e8904 au gel de la recette02E puis46a190f après fetch. Les trois empreintes CRM communes sont inchangées. Les résultats sont dans outputs/compatibility-02-03-*.json (ignorés). **Ce contrôle de présence est une cartographie, pas un test fonctionnel combiné.**

## Tests d'intégration nécessaires — non exécutés sur une combinaison

| ID | Exercice à faire dans la future branche autorisée | Assertions bloquantes |
|---|---|---|
| C01 | Parsing du banc : défaut, --captures, --search-only, --lot03b, --lot03b --captures, combinaison de modes interdite | Code de sortie correct, chaque fixture exécutée une fois,63/9 captures selon mode, aucun dossier existant écrasé |
| C02 | Recherche → Prospect dans chaque vue disponible | ID exact, vrai panneau monté et visible, garde avant remplacement, même onglet/instance/texte sur Rester |
| C03 | Deux réponses Prospect/Devis retardées, effacement, nouvelle cible, réponse échouée obsolète | Dernière intention propriétaire ; aucun vieux retour ni faux « ouvert » |
| C04 | Devis draft/sent/viewed/accepted/annulé + accès Projet | canAccessQuoteProject et guards métier conservés ; navigation n'autorise jamais un Projet interdit |
| C05 | Prospect new → création du Devis → démarrage volontaire | E72 conservé, aucun passage pipeline implicite ; service et interface cohérents |
| C06 | Finalisation E73 / signature / Conversion | Source tracée, aucun état SQL inventé, Client réellement lié, zéro doublon et pas de conversion par drop |
| C07 | Principal/décisionnaire et Besoins/Pré-devis en cours de saisie | IPC atomiques de #98 conservés, erreurs sans état partiel, dirty/pending et confirmations uniques |
| C08 | Home → recherche → Prospect → Devis → Client ; navigation retour | Vrais ID, session chrono unique, préférences indépendantes, pas de perte des brouillons |
| C09 | Alertes Home échouées ou anciennes, widgets masqués, actualisation IPC pendant édition ailleurs | Pas de faux zéro/fraicheur, critiques accessibles, aucune route ou mutation fantôme |
| C10 | Tab/Shift-Tab, pointeur, Échap, neuf thèmes/densités, étroit/zoom | Focus dans la couche active, frappe préservée, zéro double confirmation |
| C11 | Typecheck, suite Vitest réunie, restaurations35 et équivalence binaire6, SQLite integrity/FK/migrations | Résultats au SHA combiné exact, absence RPC/timeouts, historiques conservés |

Les comptages ne doivent pas être additionnés aveuglément : #100 contient #99, les tests communs existent dans les deux arbres et #98 évolue. Calculer le vrai nombre attendu à partir du registre du candidat combiné.

## Dépendances et portes de passage

1. Maintenir #98/#99/#100 et leurs branches intactes, drafts conservés pour #99/#100 ; intégrer #99 puis #100 uniquement après autorisation et vérification des HEAD/CI.
2. Créer la branche d'intégration dédiée uniquement après décision explicite ; aucune branche originale ne sera réécrite. Résolution normale avec conservation de chaque mode/scénario, sans squash/rebase/force-push.
3. Exécuter C01–C11 sur cette branche avant toute annonce de compatibilité. Les CI737/741/746 ne la prouvent pas.
4. La projection commerciale de l'Accueil (02D08–10) et la clôture globale02E restent dépendantes de ce rapprochement. La certification des17 modules n'est pas universelle : garder une recette par éditeur métier.

Le nouveau périmètre02E indépendant peut être publié et revu séparément. Aucune donnée réelle ou Validation-MSI utilisée ; aucune modification des règles commerciales de #98.
