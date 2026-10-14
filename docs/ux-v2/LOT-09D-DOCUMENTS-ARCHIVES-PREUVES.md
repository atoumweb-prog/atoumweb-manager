# Lot 09D — Documents, archives, preuves et navigation

**Statut : conception UX/UI V2, aucune pièce réelle modifiée.** Sources : DocumentsPage.tsx, ClientDocumentsPanel.tsx, ClientDocumentService.ts et billingInvoiceMigration.ts, main du 09/10/2026.
Références : [09A](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md), [09B](LOT-09B-FACTURATION-ABBY.md), [05B](LOT-05B-BIBLIOTHEQUE-EDITOR.md), [05E](LOT-05E-LECTURE-EXPORTS-PREUVES.md).

## 1. Quatre accès cibles, pas quatre systèmes
1. **Bibliothèque contractuelle** : ouvrir ContractLibraryPage existante, types et clauses canoniques.
2. **Éditeur contractuel** : brouillons de textes/types et instances éditables, jamais une révision de Devis signée.
3. **Documents clients** : vrais fichiers classés par Client, contrats/devis/factures/briefs/contenus/technique/juridique/autres.
4. **Autres documents** : fichiers généraux AtoumWeb et modèles futurs; **une bibliothèque générique transversale hors Client n'a pas été établie dans le code**.

La page actuelle présente déjà les documents des Clients et un bouton Bibliothèque contractuelle. La navigation à quatre portes est une **nouvelle présentation cible**, avec réutilisation des vraies APIs du Lot 05.

## 2. Capacités en place
ClientDocumentService copie les fichiers dans le dossier Documents du Client, stocke titre, catégorie, nom, taille, chemin relatif, MIME, SHA-256, code/motif/date de conservation et provenance. DocumentsPage et ClientDocumentsPanel permettent import, ouverture, édition des **métadonnées**, recherche, archivage, restauration et suppression **si autorisée**. Un fichier DOCX est importable comme **document**, non comme clause réimportée et éditée.

Fiche V2 : titre, Client, type, origine liée vérifiée, fichier et empreinte, conservation, historique et boutons contextualisés. Les archives restent consultables, et un fichier manquant ou SHA différent affiche une anomalie claire.

## 3. Matrice des protections
| Pièce | État code observé | Règle V2 |
|---|---|---|
| PDF Devis accepté actif | Suppression refusée par ClientDocumentService | Préserver |
| Ancien PDF dans historique des preuves Devis | Suppression refusée | Préserver |
| **PDF facture Abby lié à un item de facturation** | **Pas de garde explicite** lors de deletePermanently ; clé SQL ON DELETE SET NULL | **E259 critique : bloquer la suppression physique, même après archivage** |
| Justificatif Dépense | Chemin distinct de ClientDocuments | Traçabilité des versions et conservation à étudier (E258) |
| Document Client générique non lié | Archive/suppression disponibles | Confirmation et contrôle des obligations de conservation |
| Ancien fichier sans SHA | Pas de certification rétroactive | Afficher l'absence et éviter fausse preuve |

L'archivage ne doit jamais effacer un fichier, sa provenance ou son lien. Les règles légales de conservation sont à vérifier séparément, pas calculées par défaut.

## 4. Parcours protégé
- Entrer par Client, Facturation ou Bibliothèque avec **ID réel**; revenir sans confusion de dossiers homonymes.
- Importer dans Client et catégorie correcte; horodater, calculer l'empreinte, classer sans écraser un autre fichier homonyme.
- Contrôler les relations **au service, à l'instant d'une suppression**, pas seulement en grisant un bouton.
- Une facture officielle liée ou preuve de signature : **archiver peut être permis**, mais **supprimer définitivement est interdit** tant qu'elle sert de preuve.
- En cas de fichier corrompu, SHA non correspondant, source hors workspace ou erreur de disque : refus, alerte et pas de succès factice.
- Protéger les métadonnées non sauvegardées avec UX-01 sur sélection, fermeture, Escape et rafraîchissement.

## 5. Recette prévue (18 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R09D-01 | Ouvrir Bibliothèque contractuelle | Type réel, pas copie |
| R09D-02 | Ouvrir éditeur brouillon | Version éditable |
| R09D-03 | Filtrer factures d'un Client | Bons IDs |
| R09D-04 | Importer document | Copie + empreinte |
| R09D-05 | Même nom sur 2 Clients | Distinction |
| R09D-06 | Ouvrir fichier manquant | Refus |
| R09D-07 | SHA différent | Refus |
| R09D-08 | Ancienne pièce sans SHA | Aucune fausse certification |
| R09D-09 | Archiver/restaurer | Identité et fichier conservés |
| R09D-10 | Supprimer PDF Devis actif | Refus |
| R09D-11 | Supprimer ancienne preuve Devis | Refus |
| R09D-12 | Supprimer PDF facture liée | Refus **après E259** |
| R09D-13 | Supprimer fichier générique autorisé | Confirmation |
| R09D-14 | Date de rétention atteinte | Alerte, pas effacement |
| R09D-15 | Modifier métadonnées | Fichier et SHA inchangés |
| R09D-16 | Quitter édition dirty | UX-01 |
| R09D-17 | Naviguer Client/Docs/Facturation | Bon document et contexte |
| R09D-18 | Tests FK, chemins Windows, UI 3×3 | Aucune donnée réelle touchée |

**E274** matrice exhaustive des références protégées ; **E275** dépôt Autres documents hors Client ; **E276** navigation quatre portes ; **E277** rétention vérifiée ; **E278** version et empreinte des pièces.
