# Lot03 — matrice de clôture technique et intégration

## État à la préparation du candidat

| Sous-lot | Développé | Validation | main | Humain |
|---|---|---|---|---|
|03A InventaireCRM|Oui, #98/#102|CI780/781 et recette combinée|b2796812|Différé|
|03B Pipeline6+1/E72/E73|Oui, #98/#102|CI780/781,77 contrôlesCRM et convergence37|b2796812|Différé|
|03C Prospect/qualification/besoins/pré-devis|Oui, #98/#102|CI780/781, parcours réels/contrôles multi-fenêtres|b2796812|Différé|
|03D Client huit onglets|Oui,#105 àbd406e1c|CI855 verte,1029 Vitest ;1421 natifs +125 Client locaux|Non, draft105|Différé|
|03E Annuaire|Candidat dépendant03D|Validation complète finale à exécuter|Non|Différé|

Les termes « développé », « testé » et « fusionné » ne sont pas interchangeables. La clôture finale du candidat dépend du résultat réellement obtenu par la commande ci-dessous. Le référentiel03D/03E est conservé ; son marquage initial non implémenté reste historique.

## Validation reproductible

`node scripts/check-ux-v2-lot03-validate.cjs`

Le script refuse une arborescence sale ; figeSHA/arbre, lance typecheck/Vitest deuxworkers puis tous les bancs Electron réels. Le nouveau banc03E reprend le parcours Prospect→Qualification→Besoins→Devis→Projet prévisionnel→Client→Annuaire dans la même application et les mêmes identifiants. Il reprend aussi03D ; ses assertions ne sont donc **pas indépendantes** des autres bancs ni toutes inédites. Le nombre total d'exécutions doit être distingué du nombre de scénarios uniques.

Points vérifiés : conversions rejouées sans doublon ; contacts et coordonnées atomiques ; versions/contrats et Projet courant conservés ; brouillons/Stay/Quitter/pending/erreurs/conflits ; réponseIPC obsolète ; clavier/focus ; chrono réel unique sans session involontaire ; neuf combinaisons de thème/densité/étroit/zoom ; restaurations35/binaires6/intégrité/FK/migrations1–66 surTEMP uniquement. Captures :216 historiques +72 Client +9 Annuaire, frames vérifiés dans le nouveau candidat.

## Matrice de critères03D /03E

- R03D01–04 : conversion/historique/Projet courant et révisions via recettes existantes de102, rejouées ; pas de nouvelle règle de remplacement Projet.
- R03D05–06 : huit onglets, commercial vs vendu, projets prévisionnels distincts, aucune mutation par affichage.
- R03D07–09 : relation/note historisée et conflits atomiques ; Contact/coordonnées avec garde et comparaison ; erreurs/réponses tardives ne remplacent pas les brouillons.
- R03D10–14 : IDs exacts, opérations/contrats/documents réutilisés, clavier/neufmodes/chrono, erreurs par source, donnéesTEMP et tests auSHA.
- R03E01–08 : organisations/personnes et relations partagées, conversion idempotente, champs/méthodes conservés ; créations atomiques/rejeu/conflits et navigations vérifiés.
- R03E09 : conservation historique assurée ; aucune commande d'archivage d'identité n'existait ni n'a été ajoutée. Ne pas simuler un testUI d'une action absente. Évolution métier à cadrer séparément si souhaitée.
- R03E10–13 : vérification explicite datée/provenance, changement ultérieur signalé ; bonsIDs, neufmodes/étroit/clavier et tests surfixtures. Pas d'auteur authentifié fictif.

## Ordre d'intégration proposé, aucune fusion autorisée

1. Conserver105 draft. Revoir son HEAD exact etCI855. Son code est aussi présent dans la branche03E.
2. Publier03E enPRdraft vers main avec dépendance105 explicitée ; son diff inclut03D tant que105 n'est pas fusionnée. LaCIcandidate automatique typecheck/Vitest confirme la combinaison ; pas de rerun/dispatchextra.
3. Décider humainement l'ordre de fusion :105 puis03E, ou consolidation dédiée ultérieure pour réduire lesCI. Ne pas fusionner deux fois les mêmes changements ; aucune fermeture/retarget automatique.
4. Après accord et intégration du lot03, reprendre les spécifications04A–F déjà préparées dansPR82, sans nouveau travail de conception générale. Catalogue112, familles/tarifs/versions/associations conservés.

Recette humaine globale reportée à la fin de la refonte. Aucun accèsValidation-MSI, données réelles, nouveau schéma, règle commerciale, signature, budget ou publicationWordPress.


## Résultats effectifs du candidat figé79197709

Toutes les étapes du banc complet ont réussi :typecheck,1040 Vitest/109 fichiers,35 restaurations,6 binaires,sansRPC ;1421 assertions natives historiques +280 du banc combiné03A–E ;297 captures (216+72+9), frames vérifiés, intégrité/FK/migrations1–66 et nettoyageTEMP. Les280 reprennent convergence etClient : ne pas les compter comme280 scénarios inédits.

Le commit de publication apporte la mise à jour documentaire, le libellé conservateur « Projet existant » pour legacy et le recentrage des captures sur l’éditeur Annuaire. Nouveau passage ciblé280 et typecheck requis sur ce SHA ; résultats etCIcandidate exacts dans le corps dePR sans autrepush documentaire. Aucune règle de statut Projet modifiée.

État : techniquement recevable pour revue/intégration du périmètre livré, **pas fusionné**, recette humaine différée et archivage d’identité hors fonction exposée. Aucune preuve de cette commande absente n’est revendiquée.
