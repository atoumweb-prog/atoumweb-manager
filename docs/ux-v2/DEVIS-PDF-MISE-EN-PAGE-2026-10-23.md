# Devis PDF AtoumWeb — mise en page réalisée

23/10/2026. Carlos autorise le démarrage après avoir confirmé : priorité à la mise en page, logo et couleurs Atoum, document unique devis + annexe contractuelle, acceptation finale, titres jamais isolés en bas de page. La simplification du contexte de conclusion n’est pas le chantier demandé ici.

## Réalisation

- Modèle commun `src/shared/quoteDocumentHtml.ts`, utilisé par le véritable générateur Chromium et par l’aperçu du Manager. Symbole approuvé `BRAND_ICON_SVG`, identité textuelle AtoumWeb, jaune #ffda00, noir et blanc. Pas de nouvelle identité inventée ou de dépendance à un logo externe.
- Synthèse commerciale : parties, objet, tableau des prestations, quantités/unités, prix unitaires, ajustements éventuels, total/acompte/solde avec deux décimales, fiscalité selon les informations réellement enregistrées. Suppression des descriptions strictement identiques aux titres. Sur l’exemple DEV-2026-003, la synthèse tient en une page.
- Périmètre détaillé sur la page suivante, conservant le texte enregistré, complété par la composition vendue des offres. Le même périmètre n’est plus répété en fin d’annexe. Aucun contenu contractuel supprimé ou réécrit.
- Annexe contractuelle sur une nouvelle page ; chapitres, titres de clauses connus séparés du corps, textes complets, rythme typographique. Une clause courte reste entière ; une clause dépassant une page peut continuer sans perte. Pas de bloc global qui interdise toute fragmentation de plusieurs pages.
- Références des versions réellement jointes en deux colonnes et emplacement d’acceptation final réunis. Pour un devis déjà accepté, rappel de l’acceptation conservée plutôt qu’un nouvel emplacement de signature. Le brouillon est explicitement marqué, première page et pieds de page.
- Rappels de numéro, marge réservée en haut/bas et pagination continue Page x / y sur chaque page du PDF. Attente du chargement du symbole et des polices avant impression.
- Aperçu HTML dans un cadre isolé sans scripts, formulaires ou navigation autorisés ; même modèle que le PDF, pagination appliquée à l’impression. Corps et image réellement rendus vérifiés en recette, pas seulement présence de l’attribut srcdoc.
- Correction de visibilité liée au retour précédent : le bureau humain consulte automatiquement la proposition de mise à jour pour un brouillon et signale les clauses applicables absentes. Comparaison et application restent explicites et protégées par leur jeton/confirmation. Aucune réécriture automatique des clauses adaptées ou gelées, aucun ajout sur la base précédente de Carlos.

## Vérifications

- Typecheck réussi.
- 126 tests ciblés distincts réussis : ContractTermsService20, QuoteTransmission28, QuoteOptions16, ContractTypeService17, QuoteContractPreparationService39, modèle de document6. Un ancien attendu « 30 € » a été adapté au nouveau format voulu « 30,00 € » ; les quatre suites déjà réussies n’ont pas été relancées sans besoin.
- Recette native TEMP : **37 assertions**, aucun message d’erreur renderer. Scénario désormais représentatif de la rupture constatée : composer le socle, ajouter ensuite une prestation, voir la clause manquante et l’intégrer explicitement, puis adapter/copie/PDF/Word/réouverture entre Devis et Prospection. Aperçu et symbole réellement affichés, cadre sans scripts, garde d’abandon, thèmes.
- Recette visuelle opt-in `scripts/render-quote-pdf-layout.cjs WORKSPACE_TEST` : source c0bb85a3 lue seule, sauvegarde SQLite en TEMP, comparaison/apport des20 clauses uniquement sur cette copie ; aucun devis ou PDF du Workspace source réécrit. Prix 3 344,00 €, acompte 1 003,20 €, solde 2 340,80 € inchangés.
- PDF exemple complet : **35 clauses intégralement retrouvées par extraction**, 12 pages (synthèse1, périmètre1, annexe et références/acceptation10). Pagination et référence présentes sur chaque page ; aucun titre de clause en dernière ligne, aucune page vide. Les12 pages rendues par Poppler ont été inspectées visuellement. Police contractuelle9pt avec interligne1,6 ; textes non raccourcis artificiellement pour réduire le nombre de pages.
- Stress avec une clause dépassant une page : 16 pages, les30 paragraphes de test conservés. `CONTROLE-RENDU.json` dans les exemples. La longueur complète n’est pas un modèle de texte à publier.
- Package construit. Véritable exécutable : dernier contrôle31 assertions/12 visites/trois thèmes, intégrité/FK/registre74 corrects, sans erreur renderer. Première tentative : erreur Electron interne sandbox/startupData pendant la recette CDP, diagnostic TEMP UDrXNI conservé ; seconde tentative sur le **même binaire**, sans reconstruction ni changement applicatif, non reproduite. Ne pas présenter cette première tentative comme réussie.

## Livraison

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261023-b0a192ca/LANCER-LE-MANAGER.cmd`

- asar SHA256 `b0a192caeb1fda951f1ab16ef7beeb4635cb6046ebc8c2c167adaab7ce8531da` ; EXE `0820c6bff35f009a7866c93d99737fece7059c0ca9c96243e796fd1f7719b69a`.
- Workspace propre sauvegardé depuis c0bb85a3, ouvert par Carlos pendant le travail : SQLite backup cohérent et vérification de chaque ancienne ligne. **118 modèles /118 versions, 5 prospects, 3 devis, 7 lignes** conservés, aucun seed vide. Chiffres de cette copie, pas oracle des tests. Ancienne recette et son application jamais fermées ni modifiées pour ce travail.
- `Apercu-PDF/DEV-2026-003-mise-en-page.pdf` et copie `C:/Users/AtoumWeb/Downloads/DEV-2026-003-mise-en-page-Atoum.pdf`. Exemple créé sur copie TEMP avec les35 clauses ; les devis de la nouvelle livraison gardent exactement leurs clauses précédemment enregistrées jusqu’à application explicite de la comparaison visible.
- Exemple marqué BROUILLON : administration, fiscalité et engagements manquants ne sont pas inventés. Les mentions elliptiques de la maintenance sont encore celles de la version vendue ; la mise en page ne les remplace pas par un autre texte Catalogue.
- Copie, Word, gardes, moteurs métier, snapshots, schéma74 conservés. Pas d’implémentation de la nouvelle acceptation indépendante d’Abby dans cette passe ; confirmations historiques restent à adapter. Pas de push/fusion/CI/installateur/Bridge.

Prochaine action : recette visuelle utilisateur de ce PDF et de ce lanceur ; compléter les informations réelles et adapter ensuite le parcours d’acceptation selon la décision du cahier des charges §10.3. Ne pas lancer de suite complète ou nouvelle matrice sans changement pertinent.
