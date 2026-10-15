# Dernière passe ergonomique CRM — 15 octobre 2026

## Périmètre et traçabilité

Départ8dc861b5, branche locale `codex/ux-v2-final-crm-brand-help`. Aucun écrasement des correctifs de marque, des assets, des aides, du pipeline6+1, des treize tableaux ou des huit onglets. Code applicatif final389a1a70 (f05ed48e / b19e4645 /389a1a70). Ce document et PROJECT_STATUS n’ajoutent aucun changement applicatif. Les journaux et manifestes du ZIP identifient le HEAD final réellement exécuté ; ils sont la preuve du dernier passage, distincte des mesures intermédiaires ci-dessous.

## Changements ergonomiques

- Largeur de fiche mesurée par ResizeObserver, sensible au zoom natif. Sous1050px effectifs : trois régions toujours montées, Identité compacte et Associations repliables ; centre prioritaire avec un seul défilement vertical principal. Les régions secondaires dépliées défilent localement si nécessaire. Ce compromis est explicite : pas de promesse de zéro défilement secondaire pour une identité ouverte à150%.
- Nom, statut, fermeture et agrandissement/réduction restent visibles dans l’Identité compacte. Les autres actions restent accessibles en dépliant Identité. Le passage compact ne réécrit pas les préférences larges.
- Huit onglets métier conservés, sans retour à la ligne, défilement horizontal natif ; flèches, Home/End et sélection font apparaître l’onglet visé. Aucun onglet ni formulaire n’est recréé pour changer la présentation.
- Séparateurs discrets focusables : aperçu immédiat, flèches/Home/End au clavier, une écriture à pointerup ; pointercancel/blur/Escape annulent l’aperçu sans écrire. Seulement les clés de présentation existantes, aucun identifiant ni texte métier sauvegardé.
- Associations limitées à leur contenu, libellés plus utiles côté Client ; titres CRM et bloc de commande Devis réduits. Aucun callback métier de devis/contrat/projet modifié.
- Informations formats/stockage transférées vers FieldHelp activable au clic et au clavier. Les boutons Ajouter/Remplacer/Supprimer et leurs opérations réelles restent présents.

## Tests réels déjà exécutés au code389a1a70

- Typecheck OK ; Vitest1500/1500,166 fichiers,96,19s ; restaurations35/35 (3,804s), binaires6/6 (78ms), aucune erreur RPC.
- Ergonomie674 assertions et252 captures synchronisées,0 erreur console : mêmes composants, même brouillon texte, même chrono ; neuf combinaisons thème/densité, trois tailles1510×1030 /1920×1080 /1280×720 et trois zooms100/125/150%. Stay et abandon Client exacts :2 confirmations, aucune confirmation provoquée par la présentation.
- Aides réelles79 assertions,0 erreur console,18 captures,0 confirmation UX-01 : succession des survols, clic, Entrée, Échap, retour du focus et texte conservé. Le banc natif a d’abord révélé un Enter incomplet (absence d’événement char) ; corrigé en envoyant la même séquence native complète que le banc01B, sans changement du composant ni affaiblissement des assertions.
- Les premières assertions d’ergonomie ont révélé une ancienne règle CSS imposant une grille dans l’Identité compacte. La priorité CSS a été corrigée ; la limite de hauteur de l’Identité et la hauteur utile du centre sont maintenant vérifiées explicitement.
- La validation finale est répétée sur le HEAD documentaire propre avant le ZIP ; son bilan d’exécution est fourni dans le ZIP. Les mesures historiques d2963d68/015ff032 ne sont pas des preuves de ce HEAD.

## Sauvegarde : résultat et proposition soumise à autorisation

Le moteur existant `DatabaseService.createBackup` produit uniquement un fichier SQLite ; `restore.ts` restaure uniquement cette base avec ses contrôles et sauvegardes de sécurité. Les médias sont des versions physiques distinctes dans `crm-identites`, référencées par `crm_identity_assets`. Le registre Sauvegardes métier est déclaratif et n’est pas un export complet du Manager.

Le nouveau banc utilise réellement createBackup sur TEMP, ouvre sa copie en lecture seule, contrôle association/intégrité/FK, puis copie la base dans un nouveau dossier TEMP. Il constate explicitement l’absence du fichier image. Une copie du dossier médias dans cette destination rétablit le fichier associé, vérifié intégralement par Buffer.equals. Cela prouve la limite du backup actuel et la récupération sur copie maîtrisée ; **cela ne certifie pas un nouveau moteur de restauration complète**. Aucune base utilisateur ouverte ni modifiée.

Proposition pour un chantier distinct, non implémentée : export complet du workspace avec manifeste versionné, base issue du backup SQLite existant, liste des médias référencés et empreintes, chemins relatifs contrôlés, intégrité/FK et correspondance de chaque association. Écrire dans une destination temporaire puis publier l’archive uniquement après vérification. Tester d’abord la restauration dans un nouveau workspace, sans remplacer une base active. Réutiliser les gardes de restauration/workspace UX-01. Pas de purge automatique des anciennes révisions.

Risques à arbitrer avant modification : espace disque, copie interrompue, images modifiées pendant export, fichiers absents, liens symboliques ou chemins sortant du workspace, archives hostiles, fichiers occupés Windows, compatibilité des anciennes sauvegardes, périmètre des autres documents et cohérence base/fichiers. Définir aussi si un export « complet » inclut documents Clients/Bridge et sources externes. Ne pas annoncer une couverture globale des fichiers sur la seule inclusion de crm-identites.

## Livraison et réserves

ZIP autonome avec galerie index.html, captures avant/après comparables produites par la même fixture, logo original inchangé, pictogrammes, preuves d’aides, journaux et manifestes SHA/empreintes. Avant =8dc861b5 ; après =HEAD final indiqué dans le bilan du ZIP. Données synthétiques indépendantes, libellés identiques, identifiants propres à chaque base TEMP. Le carré coloré de capture est un marqueur de synchronisation absent du produit.

Avis humain final encore requis. Aucune fusion, publication GitHub, CI hébergée, migration, installation ou remplacement du lanceur. Aucune modification Validation-MSI/données réelles. Archivage Annuaire non exposé et réserves externes/contractuelles antérieures inchangés. Le logo Windows/ICO reste candidat non installé. Le moteur de sauvegarde complète attend une autorisation distincte.
