# Lot 03A — Reprise CRM UX/UI V2 (13/10/2026)

## Périmètre et origine
Chantier parallèle documentaire/audit isolé de 02C. Base de branche : `main@278ff2da022ba5e58ae333de11e74bc4d12a2995` (merge #97). Source normative : `docs/ux-v2/LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md` sur `docs/ux-v2-reference-v1` (audit historique du 09/10). Ne pas confondre ses observations anciennes avec le code actuel.

Ordre du référentiel : 03A matrice existant/cible ; 03B pipeline Prospection ; 03C fiche Prospect et besoins ; 03D fiche Client ; 03E Annuaire. Aucun développement 03B–03E ni changement métier autorisé par ce checkpoint.

## Contrôles de lecture sur main après #97
- `src/shared/crm.ts` déclare toujours `PROSPECT_STAGES` ; ne pas créer de statut SQL `finalization` par simple choix d'interface.
- `src/main/crm/CrmService.ts` contient `MANUAL_PROSPECT_STAGE_TRANSITIONS` et `convertProspectToClient` : conserver le service comme arbitre des transitions et de la conversion.
- `src/renderer/crm/ProspectsPageV2.tsx` : `PIPELINE_GROUPS` existe ; `pipelineActive` exclut `stage='new'` ; `startProspecting` est une action dédiée. Cela correspond au principe E72 (new dans Annuaire, qualifying après démarrage volontaire), mais tous les parcours n'ont pas été testés.
- `src/renderer/crm/ClientsPage.tsx` expose encore six valeurs `ClientTab` (summary, contacts, contracts, documents, operations, history). La cible normative 03D est huit onglets : Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique. Ce constat ne justifie aucune migration ni duplication de données.
- La PR #97 a introduit le shell réel ; les travaux 02C restent locaux/non intégrés. Éviter `App.tsx`, `GlobalSearch.tsx`, le routage, `ClientsPage.tsx` et les autres écrans que 02C modifie tant que sa branche n'a pas été récupérée et ses diffs comparés.

## Contrats métier à préserver
1. `new` reste en Annuaire ; démarrage explicite de la prospection vers `qualifying`.
2. Six colonnes commerciales actives ; Conversion = historique réel des Prospects devenus Clients, non étape active glissable.
3. Finalisation = accord de principe en attente de signature. Aucun faux statut SQL ni confusion avec `quotes.finalize`; E73 technique à cadrer.
4. Besoin sélectionné ≠ ligne de devis ≠ projet prévisionnel ≠ achat signé.
5. Projet prévisionnel issu volontairement du devis courant non signé ; ni conversion ni facturation automatique.
6. Acceptation réelle (Abby) : même Client et même Projet autant que le permettent les services, sans doublons.
7. Navigation intermodules protégée par UX-01 ; aucune perte silencieuse de brouillon.

## Prochain travail sur cette branche
03A.1 : construire la matrice `contrôle → handler → IPC → service → état → test` pour le pipeline et la conversion, en lisant le HEAD courant et en distinguant existence, preuve, manque et risque. Analyser particulièrement les six vs sept colonnes, E72 et les transitions refusées. Ne modifier aucun écran/contrat/service avant cet audit. 03A.2–03A.5 restent à traiter dans l'ordre du référentiel, après examen des dépendances avec 02C. 

## Tests / limites
Lectures GitHub uniquement à ce checkpoint. Aucun typecheck, test Windows, Electron, SQL, CI hébergée ni recette humaine exécuté. Aucun fichier métier modifié. Aucun résultat de test historique n'est revendiqué ici.
