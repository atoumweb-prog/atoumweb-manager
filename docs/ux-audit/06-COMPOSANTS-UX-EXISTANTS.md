# 06 — Composants et mécanismes UX existants

Référence : **eb252d5cbd0e95137eafa2b4759fcbcfd7263eda**. Réutilisation constatée et limites ; pas proposition automatique de réécrire les 84 fichiers React.

## Composants disponibles

| Domaine | Mécanisme | Source | Réutilisation / limite |
|---|---|---|---|
| Aide | FieldHelp, texte/title et focus clavier | [FieldHelp](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/ui/FieldHelp.tsx) | Composant commun ; pas un système complet de formulaires |
| Icônes | OperationIcon | [OperationIcon](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/operations/OperationIcon.tsx) | Employé au-delà d’Opérations |
| Identité | Avatar/visuels CRM et moyens de contact | [visuels CRM](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/CrmIdentityVisual.tsx), [coordonnées](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ContactMethodsPanel.tsx) | Source CRM commune ; vues différentes |
| Contrat | ContractReadPanel et formatContractPresentation | [lecture](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/ContractReadPanel.tsx), [formatContractPresentation](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/shared/contractPresentation.ts) | Lecture/copier/PDF à partir d’une source enregistrée ; unsaved des clauses local |
| Commercial | CommercialScope | [CommercialScope](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/CommercialScope.tsx) | Intérêt client/inclusions/exclusions repris de la version ; pas applicability juridique |
| Lignes | QuoteLineEditor et paramètres | [QuoteLineEditor](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuoteLineEditor.tsx), [paramètres](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuoteLineParametersPanel.tsx) | Quantité/prix/remise, données de dossier ; gardes serveur nécessaires |
| Périmètre | ProjectCommercialScopePanel / ContributionTargetChoices | [périmètre](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/projects/ProjectCommercialScopePanel.tsx), [cibles](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/projects/ContributionTargetChoices.tsx) | Synchronisation, conflits, capacité et contexte explicites |
| Réutilisation | ProjectReusePreparationPanel | [réutilisation](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/projects/ProjectReusePreparationPanel.tsx) | Version/copier/adaptation/relecture/création explicite ; busy + inFlight |
| Code/contenu | TechnicalContentViewer / componentPreview | [viewer](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/referentials/TechnicalContentViewer.tsx), [preview](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/projects/componentPreview.ts) | Aperçus statiques isolés ; pas exécution de code stocké annoncée |
| Chrono | GlobalTimer | [GlobalTimer](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/time/GlobalTimer.tsx) | Hors pages, conserve activité à travers navigation |
| Recherche | GlobalSearch | [GlobalSearch](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/GlobalSearch.tsx) | Debounce, clavier, ouverture par callback ; ciblage Catalogue à compléter |

Les modules possèdent aussi leurs propres petits helpers Field/Check/Summary, commandes, menus et tableaux. Le répertoire ui ne contient pas aujourd’hui un catalogue global Button/Form/Dialog/Table complet. Cela ne justifie pas, à lui seul, une refonte de tous les composants.

## Styles et conventions

- Trois thèmes et trois densités, valeurs typées partagées : [thèmes/densités](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/shared/contracts.ts).
- Chargement global de 52 fichiers CSS et plusieurs couches historiques dans [main.tsx](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/main.tsx).
- Styles de base [styles.css](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/styles.css), densité [display-density.css](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/display-density.css), typographie [typographie](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/ui-typography-consistency.css) et corrections [cohérence](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/ui-consistency-v2.css).
- Classes primary-button/secondary-button, status-pill, panel, notice partagées ; pas de composants uniques garantissant tous leurs comportements.
- Couleurs métier de température/qualité de relation distinctes des états opérationnels. Les textes/badges restent nécessaires pour ne pas reposer uniquement sur couleur.
- Des règles plus anciennes et !important peuvent contredire un objectif typographique global ; déclaration CSS ne vaut pas mesure du rendu réel.

## Navigation et contexte

App utilise activePage et plusieurs targets distincts ; les événements atoumweb:navigate/open-page/open-contract-library/open-catalog-item assurent des liens internes. Les pages se montent/démontent conditionnellement. Pas de routeur/historique de retour global identifié ; le bouton de header en forme de flèche masque le menu, pas un retour général.

Les sélections/filters/agrandissements sont souvent des états locaux ; seules certaines préférences globales sont persistées. Une prochaine analyse devra dire lesquelles doivent suivre la session ou survivre au redémarrage.

## Formulaires et sauvegarde

| Situation | Convention réellement trouvée | Limite |
|---|---|---|
| Réglages apparence | Sauvegarde immédiate via IPC + application au DOM | Traitement d’échec/busy non uniforme |
| Formulaires métier | Sauvegarde manuelle souvent partielle par domaine | UX-01 ; abandon/reload sans garde commune |
| Statuts/coordonnées | Certaines sélections/action enregistrent immédiatement | Le vocabulaire ne rend pas toujours la différence évidente |
| Actions composées | Plusieurs IPC ou SQL/fichiers | Transaction globale pas systématique |
| Doubles soumissions | busy fréquent, parfois inFlight | UX-12 ; présence de busy ne prouve pas toutes les courses évitées |
| Contrat enregistré | Lecture/copier porte sur valeurs enregistrées | À distinguer des saisies locales en attente |

## Messages, confirmations et fenêtres

Notification globale App (une notice courante), erreurs locales (form-error/role alert), status informatifs et message via onMessage coexistent. Pas de queue globale typée succès/erreur/urgence identifiée.

Modales JSX, panneaux agrandis, fenêtres Electron indépendantes et dialogues OS coexistent. Certains handlers Échap sont spécifiques ; le clic extérieur ferme certains panneaux. Confirmation OS pour suppression/restauration est distincte des prompts de saisie métier. Les tableaux/redimensionneurs sont souvent réimplémentés par module avec des conventions proches mais non centralisées.

L’absence de composant commun ne prouve pas un défaut, et sa présence ne prouve pas son emploi partout. Accessibilité, tailles/densités et comportements interfenêtres nécessitent une recette dédiée.

## Aperçus et frontière technique

Les aperçus emploient iframe sandbox et CSP/HTML préparé, avec JavaScript stocké non annoncé comme exécuté. Les politiques de ressources ne sont pas uniformes : certains aperçus admettent des médias/fontes HTTPS, d’autres seulement data. Ne pas assimiler aperçu statique, rendu parfaitement fidèle à Divi et absence universelle de ressource externe. La vérification complète de réseau/compatibilité WordPress n’a pas été effectuée ici.

## Réutiliser avant de créer

Proposition non validée : inventorier usages effectifs de chaque composant, ses domaines de sauvegarde, ses états et ses tests ; choisir ensuite les convergences utiles. Préserver ContractReadPanel, CommercialScope, les cibles, la recherche et les services existants avant de proposer une nouvelle infrastructure UX.
