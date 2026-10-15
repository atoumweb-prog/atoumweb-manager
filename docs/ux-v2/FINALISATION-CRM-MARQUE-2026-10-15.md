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

## Bilan final de validation locale

**Code applicatif : `d2963d6864d7c1adf6421a536c702416cedda471`.** Branche `codex/ux-v2-final-crm-brand-help`. Départ `3e2a1f326f58ecf46f7d25bb041f4cac50e73716`. Les ajouts documentaires et le banc d'aide réelle qui suivent ce commit ne modifient pas `src/`. Aucune publication GitHub ni CI hébergée.

### Résultats réellement obtenus

| Contrôle | Résultat | Référence de preuve locale |
|---|---|---|
| Typecheck | OK | `outputs/final-typecheck-d2963d68.log` |
| Vitest complète, deux workers | **1500/1500**, 166 fichiers, **106,51 s**, aucune erreur RPC | `outputs/final-vitest-d2963d68.log` |
| Restaurations SQLite | **35/35**, 4,699 s | même log ; `restore.test.ts` |
| Équivalence binaire | **6/6**, 77 ms | même log ; `restoreBinaryEquality.test.ts` |
| CRM élargi, identité visuelle, formats, brouillons, largeurs, zoom et contraste | **580 assertions**, zéro erreur console | `outputs/final-visual-d2963d68/crm-final.log` |
| Rail02A, sauvegarde/rechargement | **117 + 8**, neuf configurations | `outputs/final-visual-d2963d68/02a.log` |
| En-tête02B, préférences et redémarrage | **158 + 9**, neuf configurations | `outputs/final-visual-d2963d68/02b.log` |
| Aide partagée, survol/clic/clavier/option/double source | **109**, neuf configurations et vue étroite/zoom | `outputs/final-visual-d2963d68/help.log` |
| Icônes | **42**, catalogue **56**, anciens49 conservés | `outputs/final-visual-d2963d68/icons.log` |
| Treize tableaux réels | **825**, dont117 vérifications de capture, zéro mutation métier | `outputs/final-visual-d2963d68/tables.log` |
| Pilote Prospection, sélection/pipeline/colonnes/UX-01 | **132**, 36 captures | `outputs/final-visual-d2963d68/prospect-pilot.log` |
| Annuaire et parcours CRM combiné | **214**, dont9 captures ; conflits et réponses tardives injectés | `outputs/final-visual-d2963d68/directory.log` |
| Aide dans la véritable fiche Prospect en édition | **52**, 18 captures, zéro confirmation UX-01 superflue, même champ/texte/composant après Échap | `outputs/final-real-help-d2963d68.log` |

Ces nombres sont des assertions de banc, incluent les contrôles de capture et ne constituent pas un nombre de parcours métier distincts. Les lignes stderr « TEST… », « OBSOLETE… » et « Injected… » sont des erreurs volontairement injectées et vérifiées, pas des succès supposés malgré une erreur imprévue. Les rapports finaux ont `failed:0` et les contrôles réels affichent `consoleErrors:[]`.

Campagne complémentaire de non-régression : **32 étapes de convergence** réussies au code `4d71bc48` (Contrats/CGV, devis/Abby, UX-01, restauration/relaunch, projets/Bridge sur fixtures, temps, documents Word, statistiques/réglages/sauvegardes). L'étape01F a ensuite révélé le défaut d'annulation du redimensionnement, corrigé sans diminuer ses assertions. Rejeu01F **123 + 14**, 01D126, 01C66, 01E95 et Abby25 au code `b3cdf081`, tous verts. Les dernières modifications de contraste, formats et marque ont été couvertes à nouveau au code final dans les huit bancs du manifeste `outputs/final-visual-d2963d68/manifest.json`. **Le premier rapport de convergence n'est pas présenté comme une campagne entièrement verte** : son échec reste consigné.

Le contrôle 13 tableaux a également signalé une lecture de géométrie trop tôt pendant la bascule native du zoom ; le banc attend maintenant la largeur CSS correspondant effectivement au nouveau viewport Chromium, au lieu d'un sommeil fixe de40 ms. Même assertion sur le débordement, mêmes délais existants, aucune répétition d'action. Diagnostic géométrique ajouté au message d'échec. Rejeu825 vert au candidat final.

### Formats et stockage : corrections et preuves

La capacité existante est la **migration historique34** `crm_identity_assets` et le dossier `crm-identites`, pas un nouveau champ ajouté aux organisations. Aucune migration n'est créée ou modifiée. Sous Windows, `nativeImage.createFromBuffer` décode PNG/JPEG mais refuse les buffers WEBP/GIF/ICO : constat effectué sur le runtime réel, pas déduit d'une simple extension. L'aperçu passe donc par **Chromium dans un monde isolé du renderer appelant** ; seul un petit aperçu PNG revient au processus principal. Aucun DOM modifié, aucune nouvelle fenêtre/instance du chrono, aucun accès réseau ajouté par ce décodeur. Le fichier enregistré conserve son format et ses octets originaux.

La recette native vérifie des fichiers réellement décodables **PNG, JPEG, WEBP, GIF et ICO**, leur aperçu avant confirmation, l'annulation sans écriture et l'enregistrement avec `Buffer.equals` sur **tout** le fichier copié. Contrôles complémentaires : image corrompue refusée, 8 Mo max, chemin interdit/refus d'évasion, annulation/retrait confirmé, rollback ligne+journal, ancien fichier conservé si remplacement échoue, base physique fermée/réouverte, autre workspace sans fuite de fichier, conflit pendant le dialogue, anciens succès et erreurs IPC incapables de remplacer la réponse la plus récente.

Les points d'entrée dans l'identité de gauche et dans l'éditeur historique de l'organisation utilisent **la même source partagée**, pas deux stockages. Logo produit, logo société et photo de contact restent des actifs différents. Les anciennes révisions physiques sont conservées ; aucun nettoyage historique automatique.

### Matrice du dossier utilisateur

| Critère | État technique / réserve |
|---|---|
| F01 Client trois zones + huit onglets | PASS ; disposition à valider humainement |
| F02 Prospect trois zones + sections métier existantes | PASS ; conditions d'accès par étape inchangées ; disposition à valider |
| F03 Identité, onglet, éditeur et brouillon | PASS dans les parcours testés : tri/filtre, agrandissement Client, replis, largeur, thèmes/densités, erreurs/pending et confirmations ; protections existantes de fermeture du poste Prospect conservées |
| F04 Fenêtres étroites et zoom | PASS fonctionnel :1920×1080,1510×1030,1280×720 à100/125/150%, neuf configurations ; régions repliables, scroll local |
| B01 Fidélité du master | PNG original inchangé, cadrage sans reconstruction ; **gate humain encore ouvert** |
| B02 Logotype de l'en-tête / contraste | PASS technique neuf configurations ; master décodé2048 px, symbole rail réellement44×44 ; accord visuel attendu |
| I01 Icônes | PASS technique : fiche/rail/en-tête/ouvrir interne distincts ; le mode Compacter n'est pas renommé en plein écran OS |
| H01 Aide unique | PASS : aucun title natif concurrent, une seule source, court/détail, option off sans masquer le bouton, Entrée/Espace/Échap ; preuve réelle C11 synthétique |
| A01 Entrée visible d'identité visuelle | PASS Client/Prospect/Annuaire ; logo et avatar différenciés |
| A02 Enregistrement réel | PASS sur fixtures ; sauvegarde SQLite seule n'emporte pas les images, réserve ci-dessous |
| T01 Pipeline6 + historique | PASS : six colonnes actives sur une ligne défilable, Conversion hors board, aucune conversion par dépôt |
| T02 Treize vues | PASS : colonnes obligatoires, ordres, tris et vues conservés ; largeurs explicites intactes ; défauts ajustables au viewport |
| T03 Ouvrir interne / externe | PASS : pictogrammes différents, callbacks inchangés |
| U01 Dirty/pending/UX-01 | PASS dans les bancs exécutés ; une seule architecture de protection |
| U02 SQLite / chrono | PASS : migrations1–70 et intégrité/FK sur TEMP, restaurations35, vrai timer unique inchangé ; aucune base réelle ouverte |
| V01 Captures / provenance | PASS :360 après +108 avant ; marqueurs de frame vérifiés et empreintes |
| V02 Accord humain logo et fiches | **ATTENDU — aucun packaging/déploiement final** |

### Galerie et traçabilité

Galerie locale : `captures/finalization-20261015/review/index.html`.

- Avant : worktree détaché TEMP au code3e2a1f32 ;72 captures Client +36 Prospection, mêmes scénarios synthétiques, IDs propres à chaque base TEMP.
- Après d2963d68 :72 onglets Client +108 scènes CRM/tailles/zooms/en-tête/pipeline +117 tableaux +36 pilote Prospection +9 Annuaire +18 aide dans la vraie fiche = **360**. Empreintes vérifiées dans les manifestes `frames.json` ; pilote contrôlé par le synchroniseur de composition natif et son journal36/36.
- C11 originale utilisateur présentée séparément : comparaison sémantique avec une fiche synthétique, pas prétention d'identité des données.
- Le carré coloré en bas à droite est un marqueur de contrôle des captures ; il n'appartient pas à l'interface livrable.
- ICO **candidat seulement**, sept tailles16/24/32/48/64/128/256, provenance dans `review/brand-proof.json`. Pas de modification de `forge.config.ts`, `windowBranding.ts`, EXE, Setup ou raccourcis de l'installation réelle.
- Un banc réel permanent est ajouté : `node scripts/check-ux-v2-final-real-help.cjs` ; profil/base/captures TEMP par défaut, export possible par `ATOUMWEB_FINAL_HELP_CAPTURES` vers un nouveau dossier absolu. Aucun workflow modifié.

### Limites et suite autorisée

1. **Avis humain requis** sur le logo, la plaque de contraste et les deux fiches à trois régions. Ce candidat n'est pas une validation visuelle acquise.
2. Packaging final / ressources Windows de la nouvelle marque / remplacement du lanceur : **pas effectués** avant cet avis. Le lanceur existant reste sur le candidat antérieur.
3. Sauvegarde/transfert de médias : SQLite seul ne transfère pas `crm-identites`. Révisions conservées dans le workspace pour les restaurations locales ; une purge ou une archive complète nécessite un périmètre distinct. Ce point n'est pas dissimulé par une prétendue sauvegarde complète des images.
4. Aucun changement de règles commerciales, juridiques, de facturation, de conversion, de chrono ou de restauration. Aucun push/PR/CI/merge, aucune intervention sur Validation-MSI ni sur contrats/temps réels. Les migrations et protections UX-01 restent inchangées.

**CANDIDAT PRÊT POUR VALIDATION VISUELLE — DIFFUSION ET FUSION NON EFFECTUÉES.**
