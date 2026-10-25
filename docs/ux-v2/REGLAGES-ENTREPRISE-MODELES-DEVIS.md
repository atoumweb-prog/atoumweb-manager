# Réglages entreprise et modèles de devis

Demande Carlos du25/10/2026. Cible à implémenter, pas une fonctionnalité livrée.

## Accès et organisation

Réglages > Mon entreprise et devis, accessible également par « Personnaliser le modèle » dans l’éditeur de devis.

1. Mon entreprise : nom légal/usage/commercial, statut, adresse, immatriculation, téléphone, email, site, régime fiscal et mentions correspondantes. Champs structurés compréhensibles, données requises clairement signalées. Réutiliser le stockage commun d’administration actuel (QuoteContractPreparationService) et sa gestion des conflits ; adaptation structurée/migration à concevoir sans deuxième identité métier.
2. Identité visuelle : importer/remplacer/retirer le logo, ajuster sa taille, couleurs, police parmi choix disponibles, coordonnées affichées et pied de page. Pas de logo/nom Atoum imposé dans les documents d’une autre entreprise. Actuel style Atoum conservé comme modèle initial du Workspace Carlos.
3. Devis par défaut : validité, libellés, présentation des prix/quantités/unités et de la fiscalité, acompte/échéancier proposés, textes d’introduction et d’acceptation, affichage des détails et annexes. Les règles fiscales réelles ne sont pas un simple thème ; aucun calcul de TVA inventé depuis un texte libre. Par défaut n’est pas un engagement convenu : valeurs confirmables dans chaque dossier.
4. Conditions contractuelles : accès à la bibliothèque versionnée existante, base commune, blocs liés aux prestations et conditions particulières du devis. Même éditeur de clauses, copie complète/PDF/Word conservés. Ne pas copier une seconde bibliothèque dans Réglages.

## Édition et aperçu

Un espace de travail commun Prospection/Devis. Saisie à gauche ; pages du document à droite avec zoom, navigation et agrandissement. Le rendu PDF paginé réel sert à contrôler les sauts de page ; l’HTML continu actuel ne suffit pas à certifier les coupures. Bouton « Actualiser l’aperçu » explicite au minimum, état « modifications non enregistrées / aperçu à actualiser » visible. Respecter les protections de saisie avant toute génération depuis les valeurs enregistrées.

Corriger les fautes dans le libellé, la description, l’identité ou le texte de clause source, puis actualiser : pas de retouche indépendante du PDF qui divergerait du dossier. Prévoir un raccourci vers le champ concerné. Éditer le modèle commun et adapter uniquement ce devis sont deux actions clairement distinctes.

Mise en page : format/marges dans des limites contrôlées, densité/espacements, largeur des colonnes, taille de logo et de texte, titre avec premier paragraphe, saut avant une section quand demandé. Auto-pagination par défaut. Pas de positionnement libre qui superpose les textes. Même moteur et mêmes paramètres pour aperçu et PDF exporté. Tout style importé doit être contrôlé, sans scripts ou HTML actifs arbitraires.

## Versionnement et conservation

Réglages propres au Workspace/entreprise utilisatrice, sans données personnelles Atoum préremplies pour un futur acheteur. Le Workspace Carlos peut recevoir ses informations confirmées. Logo et style font partie de la version documentaire conservée lors de la transmission, au même titre que les textes : ne jamais régénérer un ancien devis signé avec le nouveau logo/modèle. Gestion des fichiers logo référencés et contenus figés à concevoir avec les mécanismes de gel existants.

Modifier les valeurs communes s’applique aux futurs devis ; reprise explicite pour les brouillons existants. Un devis transmis/accepté conserve ses valeurs et son modèle. Source d’identité unique, bibliothèque unique, pas de devis parallèle pour l’aperçu.

## Données confirmées pour Carlos

Email professionnel agence@atoumweb.fr ; franchise en base de TVA confirmée actuelle. Synthèse Guichet unique du20/12/2024 fournie : Atoumweb, Carlos Filipe Rafael Brochado Da Silva (usage Rafael), entrepreneur individuel/micro,9rue du Breuil21440Vaux-Saules, SIREN938790607, SIRET93879060700015, APE6201Z, téléphone0650008996, atoumweb.fr. Ne pas reprendre numéro de sécurité sociale, naissance ou situation familiale dans les réglages commerciaux. Informations pas encore enregistrées dans la livraison91dedc1c.

## Vérification attendue du lot

Changer les coordonnées/logo/style, enregistrer et rouvrir ; créer un devis et vérifier la reprise ; corriger une faute et constater le même résultat aperçu/PDF ; vérifier un document long et les unités ; protéger les saisies ; geler un devis puis changer le modèle et démontrer que l’ancien document est inchangé. Pas de campagne globale sans changement pertinent.

La volonté de vendre le Manager définit ici la neutralité et la personnalisation des documents. Licence, distribution commerciale, mises à jour client et gestion simultanée de plusieurs entreprises sont des sujets distincts, pas implicitement réalisés par ce lot.
