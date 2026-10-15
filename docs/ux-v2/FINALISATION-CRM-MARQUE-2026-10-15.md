# Finalisation CRM et marque — 15 octobre 2026

## Périmètre et références

Demande utilisateur et dossier ZIP du 15/10, lu intégralement avec C01–C11. Départ local `3e2a1f326f58ecf46f7d25bb041f4cac50e73716`, branche `codex/ux-v2-final-crm-brand-help`. Travail local uniquement : aucune publication, fusion, CI hébergée, migration ou modification de données réelles. Installation et lanceur de référence non remplacés. Les résultats antérieurs ne valent pas validation de ce nouveau candidat.

## Décisions complémentaires (sans réécrire l'historique)

- **UX2-BRAND-20261015** : master original utilisateur `assets/brand/references/user-master-20261015.png`, SHA256 `998a65eddad66e6056fc311bcc7d7dbf4be635ef3032a080eb67577c8e0e52a1`, 2048×682. Pixels inchangés ; symbole extrait par cadrage SVG de la même image, aucun tracé manuel. Plaque claire discrète pour préserver le lettrage noir dans tous les thèmes. Ce nouveau master remplace les approximations typographiques précédentes pour le candidat renderer. ICO/fenêtre/Setup restent sur les ressources antérieures jusqu'au gate de fidélité ; pas de certification de packaging annoncée.
- **UX2-HEADER-BRAND-20261015** : logotype horizontal complémentaire du symbole du rail, sans dupliquer le nom du module ; le véritable GlobalTimer reste dans son slot existant.
- **UX2-CRM-LAYOUT-001** : nouvelle décision graphique, trois régions inégales sur fiche complète (identité, travail, associations). Le référentiel historique n'imposait pas trois colonnes. Huit onglets Client conservés ; sections commerciales Prospect et leurs conditions d'accès conservées, sans changement de stage ni de conversion. Régions toujours montées ; fenêtres étroites : associations sur rangée repliable, puis empilement sans duplication d'éditeur. Largeurs et replis seuls dans deux clés workspace autorisées ; jamais ID/notes/onglet/brouillon.
- **UX2-ACTIONS-20261015** : 49 icônes existantes préservées, 7 pictogrammes ajoutés dans OperationIcon. Ouvrir une fiche interne, agrandir/réduire une fiche, replier/déployer le rail, compacter/développer l'en-tête ont des graphismes distincts. La commande d'en-tête n'est pas un plein écran OS ; aucune fausse étiquette plein écran ajoutée. Les vrais liens/fichiers externes gardent leur icône dédiée.
- **UX2-AVATAR-20261015** : capacité existante confirmée : `crm_identity_assets`, CrmIdentityAssetService, IPC/preload et fichier dans `crm-identites` du workspace. Pas de migration ni moteur concurrent. Éditeur visible à gauche des fiches, source organisation partagée Client/Prospect/Annuaire, photo de contact distincte du logo produit.

## Causes et corrections

C11 : FieldHelp associait `title` natif et popover personnalisé. Le title est retiré ; une seule couche courte/détaillée et un propriétaire actif. Survol court, détail à 2,5 s si autorisé, clic/clavier explicite, Échap et retour de focus. Positionnement hors du champ associé, panneau scrollable dans la fenêtre.

Logos : ancien remplacement pouvait écraser/supprimer l'image avant succès SQLite. Nouvelle copie à chemin unique, validation signature/extension/taille et décodage Electron avant confirmation avec aperçu (Annuler par défaut). Ligne et journal sous savepoint, rollback en cas d'erreur. Conflit pendant les dialogues natifs détecté par révision de chemin ; source modifiée entre choix et validation refusée. Retrait logique confirmé, historique conservé. Anciennes copies physiques volontairement conservées pour que les sauvegardes SQLite antérieures retrouvent leurs fichiers ; pas de purge silencieuse.

**Limite sauvegarde explicite :** `DatabaseService.createBackup` sauvegarde SQLite, pas l'arborescence des médias. Les fichiers restent disponibles lors d'une restauration dans le même workspace grâce aux révisions conservées. Un transfert/restauration vers un autre workspace doit inclure `crm-identites` ; sinon l'aperçu signale l'absence. Aucun changement des règles de sauvegarde/restauration n'est introduit. Une purge physique ou une archive complète des médias relève d'un périmètre distinct.

Pipeline : six étapes dans un flux horizontal défilable, Conversion séparée sans cible de dépôt. Aucune modification de changeStage, température, montants ou conversion. Treize schémas de listes conservés ; largeurs par défaut adaptées à la place disponible, largeurs explicitement enregistrées conservées ; labels de colonnes peuvent revenir à la ligne.

## Plan de preuves

Copies avant sur worktree détaché TEMP au départ `3e2a1f32`, mêmes scénarios synthétiques 03D et pilote Prospection : 72 + 36 captures. Nouveau candidat : typecheck, Vitest complète, native CRM/identité/aides, UX-01, chrono, 13 tableaux, sauvegarde/restauration et intégrité/FK. Manifestes de capture SHA/arbre et marqueur composite ; seules les preuves effectivement passées seront consignées dans le bilan final.

Premiers contrôles de développement : 129 assertions Client ; 250 assertions de recette élargie hors capture (incluant aperçu annulé, image invalide, sauvegarde en cours, refus de sortie, conflit multifenêtre et trois régions à 1510 et 1920 px). Ces exécutions intermédiaires sont sur working tree et ne sont pas présentées comme validation du HEAD final.

## Gate humain requis

À présenter : comparaisons avant/après et master → rail → header clair/sombre, les neuf configurations et 1280×720/zoom. Attente de validation explicite de la fidélité du logo et des dispositions Client/Prospect. Pas de packaging final, généralisation supplémentaire ou remplacement du lanceur avant cette validation. Recette visuelle humaine non acquise.

## Ajustements issus de la recette élargie

Au candidat `4d71bc48`, Vitest 1500/1500 sur 166 fichiers, typecheck OK. La campagne native a passé 32 étapes puis détecté une régression dans 01F : la poignée de colonne recevait la largeur d'aperçu comme point de départ, son effet de nettoyage annulait donc son propre geste avant pointerup. Correction ciblée : point de départ stable, aperçu uniquement sur le tableau ; aucune assertion supprimée ou diminuée. Le contrôle existant 01F « une écriture finale » passe après correction. Les deux étapes suivantes (rail/en-tête) seront exécutées explicitement ; le premier rapport de campagne reste conservé avec son échec.

Compléments : éditeurs visuels Annuaire disponibles près de l'identité, également pendant l'édition des coordonnées ; rechargements des images séquencés, succès ET erreurs anciens ignorés après une réponse plus récente ; synchronisation des deux emplacements existants via l'événement CRM partagé. Recette supplémentaire avec de vraies réponses IPC volontairement retenues. Fenêtres étroites et zoom étendus aux neuf configurations, sans changement de préférence métier.
