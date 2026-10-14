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


## Confirmation finale locale

À6e7aa15ec4a59f55d6b4c0c332b828116629a84f :typecheckOK et280/280 contrôles du banc03A–E,81 capturesClient/Annuaire auframe vérifié, zéro erreurconsole inattendue, SQLite/intégrité/FK/migrations1–66/nettoyageOK. Les capturesAnnuaire sont centrées sur les vrais champs de l’éditeur. Le dernier commit documentaire ne modifie plus aucun code/test ; laCIcandidate et son SHA exact seront consignés dans laPR. La suite complète1040 et les1421 contrôles historiques ont réellement été exécutés à79197709, pas inventés sur unautreSHA.

Statut des autres chantiers :103/104/106 enparallèle, non modifiés. Leurs validations ne sont pas couvertes par ce rapport. Toute fusion de105/03E reste soumise à autorisation.


## Contrôle clavier complémentaire aprèsCI873

CI873 SUCCESS sur7c770efd :1040 Vitest ettypecheck, mais une nouvelle assertion native a reproduit le retour de focus perdu après fermeture Annuaire, car la ligne déclenchante avait été reconstruite. Ce contrôle n'était pas couvert par le premier banc. Correction ciblée Client/Annuaire : retrouver l'action de la même identité après le rendu, ne pas reprendre le focus si une autre fiche a déjà été ouverte. Aucun changement métier ni nouvelle garde.

Deux assertions permanentes supplémentaires couvrent la ligne Annuaire reconstruite et l'action Client recréée après filtrage. Mise au point201 assertions sans captures verte. Le commit correctif doit être rejoué proprement avec81 frames (282 assertions attendues),typecheck etUX-01 ; seule ensuite une publication corrective avecCI de synchronisation au nouveauSHA. Ce contrôle supplémentaire justifie cette actualisation, sans rerun manuel ni ajustement de délais. Les résultats effectifs seront consignés dans laPR, aucune étape n'est annoncée réussie avant exécution.


Complément de focus : la ligne peut rester absente du filtre à la fermeture ; repli sur le champ de recherche, valeur inchangée. Deux assertions supplémentaires couvrent ce cas Client/Annuaire.693f6af était vert à282/81frames/UX-01183 ; dernier candidat à recetter avant publicationcorrective unique (284 contrôles avec captures attendus), sans nouveau changement métier.


## Intégration effective dans main — 14/10/2026

- Autorisation humaine reçue pour intégrer **03D + 03E uniquement**.
- Ascendance Git vérifiée : `main@b2796812` est l'ancêtre de `03D@bd406e1c`, lui-même ancêtre de `03E@c9e822d` (comparaisons : 0 commit de retard). La PR #107 contient la totalité de #105.
- **PR #107 fusionnée une seule fois par merge commit `575464258e3b8c88af843ea1cf34ad64ae50b7db`**. GitHub reconnaît également #105 comme intégrée par ascendance, sans deuxième merge.
- 03A, 03B, 03C déjà dans main ; **03D et 03E désormais intégrés**. Lots 04 et 05 exclus ; PR #104 et #106 restées en draft, non fusionnées.
- CI de candidature #855 : typecheck et 1029 tests OK ; #885 : typecheck et 1040 tests, 35 restaurations, 6 binaires OK. Recette Electron combinée et contrôles UX-01 attestés localement sur fixtures TEMP dans la documentation candidate, **non exécutés par la CI standard de #107**. Aucun test sur Validation-MSI ni données réelles revendiqué.
- **Réserve maintenue : archivage d'identité Annuaire non exposé.** La conservation des identités, relations et historiques existants est préservée ; aucune nouvelle règle d'archivage/suppression n'est supposée ni validée.
- Recette visuelle humaine toujours différée. La validation post-fusion sur `main` est à tracer séparément : ne pas assimiler les tests de la branche candidate à une exécution sur le commit fusionné.


## Validation technique post-fusion du lot 03 — 14/10/2026

- SHA réellement testé : `cc0bc679400321f5afacdbee3317ea8acc451518`, arbre `0c23141433f61230c591bcf8dc9c71aec5462c5e`. PR107 fusionnée par `575464258e3b8c88af843ea1cf34ad64ae50b7db` ; PR105 incluse par ascendance. Code `src/`, bancs et dépendances identiques au candidat c9e822d ; seul le bilan d'intégration a été ajouté ensuite.
- [CI post-fusion #889 SUCCESS](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38557050157), événement push sur ce SHA : installation/typecheck OK, 1040/1040 tests (109 fichiers), migrations 10/10, restaurations 35/35 (13,298 s), équivalence binaire 6/6 (77 ms), aucune erreur RPC. Durée 4 min34 s. Aucun workflow supplémentaire déclenché. Les étapes Electron sont ignorées par la CI standard : leur preuve est locale, ci-dessous.
- Rejeu Windows local complet au même SHA propre : typecheck et 1040/1040 Vitest ; 11 étapes du banc `scripts/check-ux-v2-lot03-validate.cjs` réussies. Convergence 37, CRM03A–E 284, CRM03B 77, recherche 92, Accueil 64, recette visuelle automatisée 527, parcours 67, shell 374, UX-01 183 : **1705 assertions exécutées avec recouvrements**, pas 1705 scénarios uniques.
- **297 captures synchronisées** : 216 historiques et 81 Client/Annuaire (72+9), trois thèmes × trois densités. Pas de recette visuelle humaine revendiquée. Manifeste local : `outputs/lot03-cc0bc679-1791977993453/manifest.json` ; logs par étape et empreintes des captures conservés dans ce répertoire ignoré par Git.
- Parcours Prospect → Qualification → Besoins → Devis → Projet prévisionnel → Client → Annuaire, vrais identifiants, contacts atomiques/idempotents, conflits d'écriture, réponses tardives, conservation des brouillons et retours de focus couverts. Chrono métier unique et protections UX-01 conservés.
- Schéma réel des fixtures : migrations exactement 1–66 ; `integrity_check=ok`, `foreign_key_check` vide, nettoyage des fixtures/profils TEMP réussi. Aucune base réelle ni Validation-MSI ouverte. Aucune migration ou règle métier modifiée.
- **Réserve explicite : l'archivage des identités Annuaire n'est pas exposé.** Aucune validation de cette commande absente. Recette humaine globale toujours différée.
- Conclusion : intégration technique du périmètre livré des lots01–03 validée, sans régression détectée par ces contrôles. Cette conclusion ne constitue pas une preuve d'absence de tout défaut ni une validation humaine. Lots04/05 et PR104/106 hors périmètre, non modifiés par cette intervention et non fusionnés. La branche106 a évolué en parallèle pendant les contrôles ; aucun de ses changements n’a été récupéré ou testé ici.
