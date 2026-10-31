# Devis et CGV — audit de reprise des décisions — 23/10/2026

## Demande et périmètre de cette passe

Carlos demande de relire le suivi : socle commun, blocs selon les prestations incluses au devis, édition humaine et parcours identique depuis Prospection et Devis. Audit documentaire et statique uniquement au HEAD c4ab9cfc ; aucune modification applicative, import/publication de clauses ou données, aucun test/package. Ne pas incorporer ce nouveau chantier dans la PR #1 dédiée à Nouvelle entreprise, laissée ouverte. Le correctif de contrats doit être un chantier distinct si sa réalisation est demandée.

## Décisions retrouvées et état réel

| Règle | Sources de décision | État / correction nécessaire |
| --- | --- | --- |
| Un contrat intégré au devis, pas un contrat autonome parallèle | CGV_BUILDER_V1.md ; LOT-05A ; LOT-06D | Moteur présent : ContractTermsService et QuoteContractPreparationService. Les réutiliser. |
| Socle commun une fois, adapté au public ; blocs des lignes et services inclus réellement retenus | Builder V1 ; CATALOGUE-CGV ; LOT-05D | Résolveur présent. Conserver déduplication et exclusion des suggestions/options non achetées. Afficher les blocs retenus et pourquoi, sans imposer la lecture des métadonnées. |
| Socle modifié dans la bibliothèque via nouvelle version, pas désactivé/réécrit librement dans chaque devis | Builder V1, architecture §1 ; ContractTermsService.updateQuoteClause | Garde existante à conserver. Dans le devis, lecture claire du socle et accès identifié à son édition centrale ; adaptation des clauses de prestation sur l’instance, conditions particulières locales. Ne pas promettre une édition libre du socle dans le devis contraire à la règle écrite. |
| Adaptation d’une clause au seul devis sans modifier la bibliothèque | Builder V1 §3–5 ; LOT-05D | Éditeur actuel présent, mais séparé de la lecture et enfoui. Mettre Modifier cette clause à côté du paragraphe concerné ; sauvegarde/annulation locale, origine et personnalisation visibles à la demande. |
| Synchronisation explicite et personnalisations conservées | LOT-05D ; EC03-IMPLEMENTATION | Comparaison/application déjà implémentées, ouverture en lecture seule ; ne pas revenir à une synchronisation silencieuse à chaque ouverture. À un changement de lignes, présenter les effets et les conflits pertinents. |
| Ordre par sujet, pas par empilement des produits | CATALOGUE-CGV §7–8 ; LOT-05C-RUBRIQUES ; LOT-05D | L’assemblage approuvé existe avec ContractSectionReviewService et assembleReviewedDraftContract. Le compilateur historique et formatContractPresentation regroupent encore largement par origine. Ne pas dire que tout 05C est absent, ni que la cible ergonomique est entièrement terminée. |
| Sommaire, lecture client centrale, contrôles/provenance à part | LOT-05-CONTRATS ; LOT-05D §4 ; LOT-05E | L’écran actuel juxtapose paramètres, bibliothèque, diagnostics, aperçu et champs d’édition. Cible à achever : un texte lisible, navigation par sujets, éditeur lié au texte, panneau de contrôles distinct. |
| Même devis, même éditeur et même parcours quel que soit le point d’entrée | Demandes récentes Carlos ; LOT-06D | QuotesPage réutilisé mais branches embedded déplacent Projet/Options/Abby/Conditions avant ou après les lignes : divergence concrète. Une composition unique du contenu et des commandes ; seule la liste globale ou le contexte Prospect diffère. |
| Bibliothèque publiée disponible et informations AtoumWeb communes configurées | Builder V1 ; LOT-05B ; paramètres Lot5 | Le portable 1ddd01fb comporte le code mais son Workspace neuf a été livré sans ces référentiels. Diagnostic précédent en lecture seule : 0 template/version/type/lien de clause. Récupérer les sources autorisées et leurs états après comparaison ; pas inventer, republier en bloc ou supprimer les saisies du devis DEV-2026-002. |
| Paramètres du devis distincts des réglages communs | CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE ; LOT-06D | Configurer une fois l’identité/administration AtoumWeb ; afficher au dossier uniquement les décisions pertinentes non déterminables. Conserver toutes les gardes, sans remplir artificiellement les valeurs manquantes. |
| Préparation, envoi et acceptation distincts | EC03-IMPLEMENTATION-2026-10-16 | Règle la plus récente : préparation/finalisation = artefact immuable, snapshot définitif à l’envoi réel attesté, acceptation avec preuve distincte. Les anciens textes V1 parlant uniquement de gel à finalisation ne remplacent pas cette décision. |

## Références précises

- `docs/CGV_BUILDER_V1.md` : socle, liens catalogue, instances, modifications locales et conditions particulières.
- `docs/ux-v2/CATALOGUE-CGV.md` : ordre logique, services réellement achetés, interface de lecture.
- `docs/ux-v2/LOT-05-CONTRATS-CGV.md`, `LOT-05B-BIBLIOTHEQUE-EDITOR.md`, `LOT-05C-RUBRIQUES-CONDITIONS.md`, `LOT-05D-BUILDER-RESOLUTION.md`, `LOT-05E-LECTURE-EXPORTS-PREUVES.md`, `LOT-06D-CONTRAT-PREVISUALISATION.md` : cible UX et séparation existant/cible.
- `docs/ux-v2/EC03-IMPLEMENTATION-2026-10-16.md` : cycle actuellement retenu, protections et compatibilité historique.
- `PROJECT_STATUS.md`, entrées 08/10 et début octobre : des bibliothèques avaient été importées et publiées pour recette de développement, avec 118 clauses/409 liens puis 13 types/112 associations. Ce sont des états datés d’un autre Workspace, pas des données livrées automatiquement avec le code.
- `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md` : provenance historique du fichier AtoumWeb_Bibliotheque_Contractuelle_V1_APRES_AUDIT_JURIDIQUE_BROUILLON.xlsx et import contrôlé. Ne pas confondre ce fichier brouillon avec une bibliothèque déjà publiée/revue à recopier aveuglément.

## Correction proposée, dans l’ordre

1. **Rétablir une recette contractuelle complète sans perte** : localiser la bibliothèque de référence et la configuration AtoumWeb autorisées, comparer versions/liens/statuts, préserver la base actuelle et les saisies du devis. Préparer une reprise ciblée ; distinguer contenu de travail, publié pour recette et revue effective. Pas de remplacement global de Workspace.
2. **Unifier Devis** : même écran, ordre, actions, navigation et protections dans Prospection et menu Devis. Trois vues de travail : Prestations et prix / Conditions et CGV / Vérification et sortie. Le projet prévisionnel est une action séparée, pas le début imposé de l’édition du devis.
3. **Conditions et CGV lisibles et éditables** : sommaire par rubriques, document au centre, modification de la clause de prestation ou condition particulière dans son contexte. Socle identifié comme commun, édition centrale versionnée explicite. Actions Ajouter un bloc et Ajouter une condition particulière compréhensibles ; les blocs obligatoires/applicables suivent les règles déjà présentes, pas des cases autorisant de les supprimer sans contrôle.
4. **Achever le raccord de l’ordre approuvé** : exploiter le classement 05C déjà stocké/approuvé pour le brouillon et la lecture finale, signaler À classer pour ce qui ne l’est pas. Ne pas classer juridiquement par le seul nom du produit ni contourner l’option de revue. Conserver le rendu exact des devis historiques figés.
5. **Alléger les contrôles présentés** : trois listes distinctes Configuration commune / Décisions de ce devis / À vérifier avant sortie. Pas de répétition du même blocage dans plusieurs panneaux ; liens aux vrais champs, éléments non applicables explicitement évalués, détails/provenance avancés à la demande. Les gardes du serveur restent actives.
6. **Recetter le résultat réel** : devis multi-prestations avec socle unique, service inclus, option non achetée exclue ; modifier une clause uniquement sur le devis, ajouter une condition, retirer une ligne personnalisée sans perte ; lire le même devis depuis les deux entrées ; aperçu/copie/export cohérents ; comparaison des nouvelles versions ; préparation/envoi/acceptation séparés et historique protégé. Réutiliser les tests existants et ajouter uniquement la couverture manquante sur TEMP.

## Critère d’acceptation humain

Carlos ouvre son devis, voit ses prix, passe à Conditions et CGV, lit le texte applicable dans l’ordre, modifie une clause autorisée au bon endroit, ajoute sa condition particulière, voit les seules informations manquantes et prépare sa sortie. Il peut reprendre le même travail depuis Prospection ou Devis sans différence de parcours, perte de saisie ni création d’un autre contrat.

Cet audit ne constitue ni une validation de contenu juridique ni une activation des données. Aucun contournement des onze blocages constatés n’a été réalisé. La PR #1 et son portable restent inchangés.
