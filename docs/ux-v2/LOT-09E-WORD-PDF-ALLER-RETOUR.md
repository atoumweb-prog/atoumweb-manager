# Lot 09E — Textes éditables, aller-retour Word et exports PDF

**Statut : spécification cible, aucune génération/importation DOCX ni code de conversion réalisé.** Audit initial Manager main 09/10/2026.
Références : [09D documents](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md), [05B bibliothèque de clauses](LOT-05B-BIBLIOTHEQUE-EDITOR.md), [05D builder CGV](LOT-05D-BUILDER-RESOLUTION.md), [05E lecture/preuves](LOT-05E-LECTURE-EXPORTS-PREUVES.md), [09A inventaire](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md).

## 1. Intention : Word comme outil d'édition externe, jamais source de vérité immédiate
L'utilisateur veut pouvoir **exporter dans Word un texte réellement éditable**, le modifier, puis le **réimporter pour comparer et valider**. Ce parcours doit concerner les **textes éditables autorisés**, par exemple un **brouillon** de clause, de type contractuel, une trame non publiée ou un contenu rédactionnel selon service propriétaire. Il ne peut jamais transformer directement un PDF Abby signé, une clause publiée immuable, un Devis gelé ou un document de preuve en texte modifiable.

**Existant attesté** : import de fichiers DOC/DOCX dans Documents Clients, export PDF de **prévisualisation de Devis** déjà présent, génération de copies du texte contractuel via le Builder. **Non attesté** : générateur Word fidèle, parser aller-retour DOCX, diff structuré de blocs et validation humainement versionnée. Ne pas faire passer la simple acceptation MIME du DOCX pour un workflow Word complet.

## 2. Source canonique et objets à éditer
| Élément | Peut entrer en cycle Word ? | Conditions |
|---|---|---|
| Clause CGV **brouillon** | Cible OUI | ID/version brouillon + hash de base, texte proposé au bon service Lot 05 |
| Clause **publiée** partagée | Pas en place | Nouvelle version brouillon seulement ; anciens Devis figés intacts |
| Contrat type **brouillon** | Cible OUI | Préserver sections, liens de clauses et version, pas recréer deux bibliothèques |
| Instance CGV Devis **avant gel** | À instruire | Diff sur instance actuelle, liens et personnalisations ; si Devis modifié depuis export, refuser écrasement |
| CGV Devis **frozen ou historical_missing** | NON | Aucune mutation ni import de texte nouveau, même si le DOCX existe |
| PDF Abby devis accepté ou facture | NON | Import/archive probante uniquement ; aucun réimport Word modificateur |
| Texte d'aide commerciale / contenu de page | Éventuellement | Seulement si API de version/brouillon du module source; ne pas inventer support universel |
| Fichier DOCX Client générique | Document, pas texte métier | Import simple dans Documents Clients sans altérer de clause/Devis |

## 3. Parcours Word cible en sept phases
1. **Sélectionner le texte source exact** : type/ID/version de clause, état éditable, nom, audience et droits. Calculer une empreinte de référence des données (texte + structure + version) et exporter un **manifest** de provenance distinct du contenu lisible.
2. **Exporter DOCX** : document Word éditable avec **titres, paragraphes, listes, numéros et tableaux** quand la structure est supportée, styles lisibles et mentions d'édition. Ne pas exposer IDs internes dans la version client visible.
3. **Modifier dans Word hors Manager**, conserver le fichier exporté et son manifest de version. Aucun changement métier n'est enregistré automatiquement pendant l'ouverture dans Word.
4. **Réimporter dans une zone temporaire** : vérifier format/fichier, parser, signaler champs et structures non conservés (tableaux fusionnés, sections, champs automatiques, images, liens, notes, styles complexes) au lieu de supprimer silencieusement.
5. **Comparer** : avant/après par rubrique/paragraphe, ajouts/suppressions, changements de ponctuation, titres/numérotations, annexes et métadonnées; chaque différence est rattachée à la **version de source initiale**, sans écraser le brouillon courant.
6. **Décision humaine** : accepter/rejeter certains changements selon capacité du modèle; si source a changé depuis export, **conflit de version** et choix d'un nouveau diff, jamais « dernier import gagne ».
7. **Créer une nouvelle version ou mettre à jour le brouillon** dans une transaction du module propriétaire, avec auteur/date, fichiers d'origine, hash et rapport d'éventuelles pertes de format. Un bouton Annuler laisse les données inchangées.

## 4. Exports PDF et mentions
- **PDF de présentation Manager** : une sortie de lecture qui ne remplace **jamais** un PDF signé/accepté ou une facture Abby.
- **PDF archive finalisé** : nécessite version enregistrée, provenance et éventuellement outil d'export fiable; ne pas prétendre à une signature numérique automatique.
- La conservation d'un document historique doit être séparée du droit d'éditer sa source; l'édition future d'un modèle ne réécrit aucune archive de Client.
- Exporter un texte sensible nécessite avertissement sur le stockage d'une copie locale Word et ses fichiers temporaires; nettoyer seulement les **temporaire non référencés**, pas les pièces probantes.

## 5. Intégrité, lisibilité et limites techniques
- Un DOCX peut véhiculer **macros/liens externes/données cachées**; n'exécuter aucune macro et ne pas ouvrir/consommer automatiquement une ressource réseau externe.
- Les champs spéciaux de Word (numérotation automatique, sauts de section, tableaux complexes, commentaires, suivi des modifications) demandent **prise en charge explicite ou message de perte**; aucune promesse « 100 % identique » sans tests.
- **Diff de contenu** et **diff de mise en forme** séparés, validation humaine avant sauvegarde; une correction de style ne doit pas effacer texte ou liens de clauses.
- La **revue juridique de fond** est distincte du diff informatique et des tests; ne pas marquer « conforme » après import réussi.
- Les garde UX-01, annulation d'import, erreur de parser et défaut de droits conservent brouillon et version source sans altération.
- Le pipeline Word ne crée **ni API Abby, ni nouveau contrat légal signé, ni PDF officiel**.

## 6. Recette future (17 scénarios, non exécutés)
| ID | Scénario | Résultat |
|---|---|---|
| R09E-01 | Export clause brouillon Word | Bon ID, version et texte |
| R09E-02 | Import sans modification | Diff vide, pas nouvelle version forcée |
| R09E-03 | Changer un paragraphe | Diff localisé |
| R09E-04 | Ajouter/supprimer article | Sections et ordre explicités |
| R09E-05 | Modifier texte et gras | Diff texte/style distincts |
| R09E-06 | Word avec liste numérotée | Fidélité ou alerte précise |
| R09E-07 | Word avec tableau complexe | Fidélité testée ou avertissement |
| R09E-08 | Import DOCX corrompu | Refus, brouillon intact |
| R09E-09 | Word exporté depuis ancienne version | Conflit, pas écrasement |
| R09E-10 | Import texte sur clause publiée | Nouvelle version nécessaire |
| R09E-11 | Import sur Devis gelé | Refus absolu |
| R09E-12 | Import sur historique sans snapshot | Refus, absence préservée |
| R09E-13 | Import DOCX Client générique | Fichier classé, CGV inchangées |
| R09E-14 | Export PDF de travail | Jamais pièce officielle Abby |
| R09E-15 | Accepter modifications dans l'éditeur | Nouvelle version/provenance vérifiables |
| R09E-16 | Annuler ou fermer édition dirty | Aucune mutation, garde UX-01 |
| R09E-17 | Test PDF/DOCX 3×3, non-régression SQL | Aucune pièce réelle modifiée |

**E279** liste exacte des domaines/structures Word pris en charge; **E280** stratégies de diff, conflits et version; **E281** manifest/provenance/format; **E282** sécurité du parseur et fidélité de format; **E283** revue juridique avant publication d'une nouvelle version.
