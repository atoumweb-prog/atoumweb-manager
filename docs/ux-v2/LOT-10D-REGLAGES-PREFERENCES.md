# Lot 10D — Réglages, thèmes, densités, aide et gestion du workspace

**Statut : spécification UX V2, aucune préférence/application métier modifiée.** Audit `src/renderer/App.tsx` et APIs `settings`/`workspace` sur `main`, 09/10/2026.
Liens : [10C sauvegardes/restore](LOT-10C-SAUVEGARDES-RESTAURATION.md), [Lot 01 fondations](LOT-01-FONDATIONS.md), [Lot 02 navigation](LOT-02-NAVIGATION-ACCUEIL.md), [10E recette](LOT-10E-RECETTE-PILOTAGE-REGLAGES.md).

## 1. Existant confirmé
- La page `SettingsPage` est actuellement **définie dans `App.tsx`** (pas un fichier settings autonome). Trois thèmes sont déclarés : `atoumweb`, `noir`, `blanc`, avec `settings.setTheme`.
- Trois densités réelles : `compact`, `comfort`, `comfort_plus` via `settings.setDisplayDensity`, appliquées sur `document.documentElement.dataset.density`.
- L'aide au **survol** est réglable par `settings.setShowHoverHelp`. Elle n'est pas l'unique moyen d'obtenir l'aide métier : une aide `?` accessible par **clic et clavier** doit rester disponible.
- L'écran montre le **chemin du workspace actuel**. `workspace.choose` **enregistre le nouveau dossier**, demande parfois **redémarrage**, et le message indique que les données de l'ancien workspace **ne sont pas déplacées automatiquement**.
- Une section Sécurité propose `backups.createManual` et `backups.restore` de la **base SQLite**, distincte du registre de sauvegardes métiers (Lot 10C).

## 2. Cible UX V2 : rubriques de réglages
| Rubrique | Contenu cible | Existant / limites |
|---|---|---|
| **Apparence** | Thèmes, aperçus, densité, contraste, rétablir les valeurs de ce thème | Trois thèmes et trois densités déjà présents ; règle Compact texte >=14 px à recetter, pas assumée |
| **Navigation et vues** | Rail/favoris, ordre de navigation, tailles de colonnes, filtre/onglet récent par module, réinitialisation **de l'interface du module seulement** | Persistance de ces préférences **à auditer** ; ne pas prétendre une API globale existante |
| **Aides** | Aide contextuelle au survol optionnelle, aide `?` au clic/clavier non masquée, explications métier et légendes | `showHoverHelp` existe; désactivation du survol ≠ désactivation des avertissements nécessaires |
| **Documents** | Emplacements, visualisation du workspace, liens dossiers et conventions, politique d'archive depuis module Documents | Il n'est **pas** établi qu'un réglage global de conservation soit implémenté ou conforme juridiquement |
| **Sauvegarde et sécurité** | Sauvegarder/restaurer SQLite, protections UX-16, état du run réel et copie de sécurité, lien registre métier | Conserver deux mécanismes distincts; ne pas affirmer restauration entière du workspace |
| **Workspace** | Chemin actif, choisir autre dossier, risques, relance et absence de copie automatique, contrôles d'environnement | **Changement de workspace ≠ migration de données**; confirmation explicite nécessaire |
| **Avancé** | Diagnostics, version/migrations, index, formats de logs, valeurs par défaut ciblées | Aucun bouton dangereux « Effacer toutes données / Restaurer défaut usine » sans service et protection testés |

**La recherche de paramètres** peut aider à trouver les contrôles, mais elle doit être une **fonction UI sans écriture** et respecter libellés réels. Ne pas créer une hiérarchie artificielle qui supprime un réglage existant.

## 3. Préférences vs règles de sûreté
**Réglages utilisateur** : thème, densité, état de panneau, favoris, aide au survol, filtres mémorisés si stockage réellement développé.  
**Règles non désactivables par réglage** : UX-01 (protection des saisies), confirmation d'acceptation du Devis Abby, intégrité des pièces contractuelles/factures, validation de source SQLite UX-16, interdiction d'effacer des preuves liées, contrôles de droits/Client.

L'utilisateur peut choisir un thème différent **sans modifier** un devis, une dépense, un contact, un chrono, une sauvegarde métier ou un état de projet. Les libellés de densité sont **Confort, Compact et Confort +** ; aucun des neuf modes ne peut cacher les commandes critiques dans un état inatteignable.

## 4. Actions sûres et retour d'erreur
1. **Choisir un thème** : appliquer seulement après `settings.setTheme` réussi ; erreur → garder thème précédent.
2. **Changer densité** : même règle; focus et scroll conservés quand les dimensions changent.
3. **Désactiver le survol** : garder l'aide `?` explicitement visible et accessible, les validations et les messages bloquants.
4. **Personnaliser une vue** (fonction cible) : sauvegarder filtres/tri/largeurs/onglet au niveau de **l'identité du module**, revenir sans perdre la sélection actuelle; aucune écriture métier.
5. **Réinitialiser les préférences d'un module** : afficher quels paramètres reviennent au défaut; ne pas réinitialiser ses formulaires, documents, contenu ou base.
6. **Choisir un workspace** : afficher le chemin actuel et futur, expliquer **aucun transfert automatique**, risques de bascule et redémarrage, refuser un choix ambigu en cas de brouillon dirty; vérifier service exact.
7. **Restaurer SQLite** : lien vers procédure 10C et moteur UX-16 **une fois #81 réellement intégré**; ne pas masquer la copie de sécurité ou prétendre l'action réussie si seulement programmée.
8. **Recherche de réglages** : résultats cliquables au bon champ, focus visible sans ouvrir une action destructrice.
9. **Compatibilité** : si des réglages anciennement persistés sont inconnus après migration, valeurs par défaut **côté préférence seulement**, non écrasement des données métier.

## 5. Recette prévue (18 scénarios, non exécutés)
| ID | Cas | Attendu |
|---|---|---|
| R10D-01 | Sélectionner AtoumWeb | Thème enregistré et appliqué |
| R10D-02 | Basculer Noir | Contraste, état conservé |
| R10D-03 | Basculer Blanc | Même règle |
| R10D-04 | Choisir Compact | Texte >=14 px, contrôles atteignables |
| R10D-05 | Choisir Confort | Lisibilité 16 px cible, sans troncature |
| R10D-06 | Choisir Confort+ | Lisibilité 18 px cible, pas scroll cassé |
| R10D-07 | Changer densité avec formulaire ouvert | Aucune saisie perdue |
| R10D-08 | Désactiver aide au survol | Aides cliquables et avertissements restent |
| R10D-09 | Persister largeur/filtre futur | Un seul module affecté |
| R10D-10 | Réinitialiser module | Données métier inchangées |
| R10D-11 | Chercher un réglage | Focus sur bon contrôle sans écriture |
| R10D-12 | Choisir workspace différent | Message absence de transfert automatique |
| R10D-13 | Annuler workspace | Chemin et données inchangés |
| R10D-14 | Enregistrer backup de base | Fichier de sauvegarde réel, distinct de registre Client |
| R10D-15 | Initier restore avec formulaire dirty | Garde UX-01 et contrôles UX-16 |
| R10D-16 | Erreur IPC de préférence | Conserver état précédent |
| R10D-17 | Bouton dangereux non disponible | Ne pas inventer d'effacement global |
| R10D-18 | Neuf combinaisons, clavier, 1280×720, test SQLite factice | Aucune Validation-MSI touchée |

## 6. Points techniques ouverts
**E309** stockage des préférences de navigation/vues/tailles; **E310** recherche et catégories Réglages sans doublon; **E311** méthode de mesure de lisibilité/contrastes dans les neuf combinaisons; **E312** reprise du focus/scroll/brouillons; **E313** changement workspace et redémarrage sécurisé; **E314** rôle de l'aide contextuelle et des confirmations non désactivables.

**Cette fiche ne crée aucune option ni service de configuration nouveau.**
