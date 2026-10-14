# Lot 09C — Dépenses, échéances et justificatifs

**Statut : spécification UX V2, aucune dépense créée ou test exécuté.** Sources inspectées : ExpenseService.ts, ExpensesPage.tsx, shared/expenses.ts (main, 09/10/2026).
Références : [09A](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md), [09D](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md).

## 1. Existant et frontière
Le registre des dépenses gère catégories (hébergement, domaine, SaaS, licence, sous-traitance, publicité, déplacement, matériel, banque, taxe, bureau, autre), montant en centimes, TVA nullable, fournisseur, date, échéance, fréquence (aucune, mensuelle, trimestrielle, annuelle), prochaine échéance, statut (prévu, engagé, payé, annulé), Client/Projet facultatifs et un justificatif courant. Le service refuse montant négatif, TVA supérieure au montant et Projet d'un autre Client.

**« Payé » est une déclaration utilisateur, pas un paiement bancaire vérifié.** Fréquence stockée et prochaine échéance ne prouvent **pas une génération automatique d'occurrences** : ne pas promettre d'automatisation sans service dédié.

## 2. Interface V2
- **Liste gauche et fiche droite agrandissable** : date, libellé, fournisseur, catégorie, montant, statut, Client/Projet ou Interne, prochaine échéance, justificatif présent/manquant, actions sûres.
- **Saisie rapide** : date, montant, catégorie, fournisseur, intitulé, statut; justificatif possible après sauvegarde. **Champs avancés dépliables** : TVA, Client, Projet compatible, fréquence, échéance, paiement déclaré, notes.
- **Conservation de saisie UX-01** : fermer, Escape, changer de dépense ou Client, filtre, rafraîchissement; ne pas annoncer l'enregistrement avant confirmation du service.
- **Récurrence** : distinguer calendrier d'échéances de création effective d'une dépense. Une dépense SaaS mensuelle est un coût, **pas** un abonnement de maintenance vendu ni une facture Abby.
- **Juridique/comptable** : pas de calcul automatique HT/TTC ou de qualification fiscale sans données/règles prouvées; ne pas inventer un délai de conservation légal.

## 3. Justificatif : écart E258
ExpenseService.importReceipt copie une nouvelle pièce locale et remplace les métadonnées du justificatif courant. Le fichier précédent peut subsister, **mais aucun historique métier des versions rattachées à la dépense n'est établi**. La cible doit enregistrer versions, date, source, empreinte et choix actuel, sans écraser ni effacer l'ancienne preuve. En cas d'échec de copie, conserver ancien fichier et fiche. La présence d'un chemin ne certifie pas un reçu valide.

## 4. Recette prévue (17 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R09C-01 | Dépense interne sans Client | Autorisée |
| R09C-02 | Dépense sur bon Projet | Client cohérent |
| R09C-03 | Projet d'un autre Client | Refus |
| R09C-04 | Montant négatif | Refus |
| R09C-05 | TVA supérieure au montant | Refus |
| R09C-06 | Prévu puis engagé | Statuts historisés |
| R09C-07 | Déclarer Payé | Date et caractère déclaratif |
| R09C-08 | Dépense mensuelle | Fréquence et échéance, pas occurrence inventée |
| R09C-09 | Échéance passée | Alerte, pas double création |
| R09C-10 | Importer justificatif PDF | Bon ID et fichier contrôlé |
| R09C-11 | Remplacer justificatif | Ancienne preuve traçable (cible) |
| R09C-12 | Annuler l'import | Ancienne preuve préservée |
| R09C-13 | Fichier manquant | État Manquant explicite |
| R09C-14 | Corriger dépense déclarée payée | Confirmation/provenance |
| R09C-15 | Changer Client | Projet compatible ou alerte |
| R09C-16 | Fermer formulaire modifié | Garde UX-01 |
| R09C-17 | SQLite isolé, neuf modes visuels, clavier | Aucune Validation-MSI touchée |

**E269** fréquence vs occurrences automatiques ; **E270** versionnement et empreintes de reçus ; **E271** statut payé/données bancaires ; **E272** montant/TVA ; **E273** conservation et correction.
