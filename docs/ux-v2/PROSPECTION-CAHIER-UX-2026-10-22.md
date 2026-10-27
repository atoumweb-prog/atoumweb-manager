# ATOUMWEB MANAGER — CAHIER DES CHARGES D'IMPLÉMENTATION
## Refonte ergonomique complète du parcours Prospection (tous les lots)

**Date de référence :** 22 octobre 2026  
**Destinataire :** Codex — dépôt `atoumweb-prog/atoumweb-manager`  
**Statut :** demande d'implémentation couvrant **tous les lots**, avec vérifications à chaque étape, et non simple demande d'analyse.  
**Périmètre :** module **Prospection** et composants partagés strictement nécessaires à sa correction. Éviter de refondre Clients, Devis ou l'ensemble du shell hors des points réellement bloquants.  
**Sources de référence :** `Prospection-modele-actuel-20261022.zip` (69 captures 001–069, `LIRE-MOI.txt`, `manifest.json`, galerie `index.html`) ; audit `AtoumWeb_Prospection_Audit_UX_Codex_20261022.md` ; relevé de comportement du code transmis pour le candidat `666c0979` ; captures de l'application et décisions UX de cette conversation.  
**Précaution :** Les captures sont des *constats d'interface* à la date indiquée, avec données fictives TEST. Elles ne démontrent ni un dysfonctionnement runtime ni l'état actuel de `main`. Vérifier le code HEAD avant d'agir. Les maquettes visuelles antérieures sont des exemples d'apparence et **ne doivent pas primer sur les règles métier existantes**.

---

# 0. MISSION ET LIVRABLE FINAL

Implémenter **l'ensemble** des corrections UX décrites ci-dessous, de façon **séquentielle**, en six lots cohérents. Ne pas s'arrêter après un diagnostic ou au premier lot ; l'utilisateur a explicitement demandé que tous les lots soient réalisés. Toutefois, **ne pas travailler sur tous les lots en parallèle** : après chaque lot, lancer les contrôles, corriger les régressions puis avancer au suivant.

**Livrable exigé à la fin :** version du Manager utilisable, annuaire lisible dans une fenêtre réelle, fiche rapide ergonomique, création/édition cohérentes, fiche de travail utile au premier regard, référence exploitable, actions commerciales guidées, Kanban et historique lisibles, sans perte des mécanismes métier. Donner un compte rendu de fin de chantier avec : fichiers modifiés, commits/PR, tests, captures avant/après, points réellement vérifiés et éventuelles limites.

**Méthode d'exécution :**
1. Lire l'état actuel du dépôt et les règles métier ; noter brièvement les écarts avec les captures. Ne pas attendre une nouvelle validation pour une amélioration purement UI déjà décrite ici.
2. Créer une branche dédiée, vérifier que l'arbre de travail est propre ; ne pas écraser de modifications d'autrui.
3. Corriger **LOT 1 → LOT 2 → LOT 3 → LOT 4 → LOT 5 → LOT 6**. Un petit commit traçable par lot ou sous-lot.
4. Après chaque lot : typecheck, tests ciblés, vérification d'affichage et captures avant/après à 1920×1080 et largeur réduite.
5. Après LOT 6 : tests transversaux, suite de régression pertinente, rapport final, PR prête à relire.
6. Si un besoin implique une migration SQLite, une modification de contrat public, une suppression de fonctionnalité ou un changement métier non spécifié : **ne pas improviser**. Préserver le comportement actuel ; documenter le blocage et continuer les autres points sûrs. Ne pas créer un nouveau système parallèle pour contourner ce blocage.

**Priorités :** P0 = lisibilité/sauvegarde/navigation bloquantes ; P1 = organisation et parcours métier ; P2 = harmonisation et finitions. Chaque lot comprend P0/P1/P2 nécessaires.

---

# 1. CE QUI EST DÉJÀ PRÉSENT ET DOIT RESTER

## 1.1 Architecture et vues

- Les vues **Annuaire prospects**, **Parcours commercial**, **Historique**, et la sous-vue **Conversions** quand elle est accessible selon la logique actuelle.
- **Annuaire** : prospects non archivés ; filtre initial **« À suivre »** là où il existe réellement ; filtres par métier/activité, ville et situation ; recherche incluant entreprise, contact, activité, site et notes selon la recherche actuelle.
- **Tableau personnalisé existant** : colonnes déplaçables, redimensionnables, affichables/masquables, tri sur l'ensemble filtré chargé, vues enregistrées ; colonnes obligatoires **Entreprise** et **Ouvrir** ; conserver la sélection par ID réel indépendamment du tri.
- **Pipeline commercial** : six étapes actives, dans cet ordre : **À qualifier → Besoins → Préparer le devis → Attente du retour → Négociation → Finalisation** ; section distincte **Conversion / Historique**. Les libellés métier actuels et leur mapping technique priment sur les mots des maquettes.
- **Historique** : dossiers perdus, gagnés, convertis, archivés selon les catégories réellement stockées. Ne pas fusionner ces issues.
- **Fiche rapide** latérale, redimensionnable, ouverte depuis une ligne ou une carte.
- **Fiche Prospect A complète** : **trois zones** (Identité / Travail central / Associations), panneaux latéraux repliables et redimensionnables, préférences mémorisées, et **deux onglets** (Fiche de travail / Référence prospect). Ne pas remplacer par cinq ou huit onglets inventés.
- **Fiche de travail** : Température, Situation commerciale, Prochaine action ; groupes **Entreprise et contacts**, **Besoins et qualification**, **Devis et activités**, avec éditeurs conditionnels selon l'étape.
- **Référence prospect** : six rubriques **Entreprise**, **Web & visibilité**, **Contrôles**, **Opportunités**, **Conversation**, **Historique**, lecture/édition/versionnement et possibilité actuelle d'ouverture en fenêtre séparée.

## 1.2 Règles métier NON NÉGOCIABLES

- Créer un prospect **ne démarre pas** automatiquement le parcours : il reste **Nouveau contact** jusqu'au démarrage explicite.
- La sélection de prestations/besoins **ne crée pas** un devis.
- **Préparer** un devis, **valider sa préparation**, **enregistrer l'envoi**, **accepter / signer**, **convertir en client** sont des opérations distinctes.
- Refuser un devis **ne classe pas** automatiquement le prospect « Perdu ».
- Un glisser-déposer dans le Kanban ne peut exécuter que les **transitions autorisées** ; il ne remplace jamais une opération métier et ne convertit **jamais** en Client.
- La classification « Perdu » exige le **motif prévu**, et éventuellement sa précision ; **archivage** distinct ; **conversion réelle** ouvre ou rattache la fiche Client selon la logique existante.
- Liens et identifiants conservés entre **Organisation, Contact, Prospect, Devis et Client**, y compris historiques, anciennes versions et journaux.
- Garde de navigation/fermeture **UX-01** pour les brouillons ; protections contre chargements périmés, enregistrements concurrents et données non sauvées ; conserver les panneaux montés lors du repli si c'est leur contrat actuel.
- Pas de suppression d'un bouton métier sous prétexte « d'épurer » : le rendre contextuel, le déplacer ou le regrouper sans le rendre inaccessible.
- **Données TEMP** uniquement pour tests ; pas d'altération irréversible de véritables espaces de travail.

---

# 2. SYSTÈME UX COMMUN À APPLIQUER À PROSPECTION

**BUT : une interface plus compacte mais lisible, intégrée au thème AtoumWeb actuel.**

### UX-COM-01 — Palette et hiérarchie

- Respecter la palette AtoumWeb : jaune `#F2B705` pour action principale, accent d'état actif et repères ; rouge `#D62828` réservé à erreur/retard/danger réel ; bleu `#1565C0` pour information ; vert `#198754` pour succès/confirmation. Les tokens existants peuvent fournir les variantes adaptées au thème sombre.
- Ne jamais signifier un état seulement par sa couleur : le **libellé** reste visible.
- Éviter l'accumulation d'ombres, de bordures imbriquées et de « cartes dans des cartes ». Conserver une structure claire et un contraste suffisant.
- Un seul **bouton principal** par contexte ; actions secondaires dans menus explicites ou panneaux dédiés, sans en supprimer aucune.
- Garder la navigation globale AtoumWeb, le logo actuel et les fonctions recherche/timer/notifs/réglages ; pas de logo flottant doublé ni de métadonnées SQLite/workspace au centre des pages métier.

### UX-COM-02 — Répartition de l'espace et défilement

- Aucun contenu essentiel ni commande Enregistrer/Annuler ne doit être coupé hors du viewport ou piégé dans une zone impossible à faire défiler.
- Choisir des **propriétaires de scroll** explicites : dans l'annuaire double panneau, scroll de la table et du panneau rapide si besoin ; dans la fiche complète, scroll principal de la zone de travail avec colonnes latérales repliables ; éviter le triple scroll vertical inutile.
- Ne pas figer des hauteurs arbitraires à partir des seules captures 1920×1080 ; utiliser les dimensions réellement disponibles, vérifier overflow et `min-width: 0`/`min-height: 0` là où les layouts flex/grid l'exigent.
- Si un panneau étroit ferait tronquer les colonnes, basculer en **drawer superposé** ou vue pleine largeur, selon ce qui s'intègre le mieux aux composants actuels.
- Les en-têtes **sticky** sont acceptables s'ils ne réduisent pas excessivement la zone de contenu à 768 px de haut.
- Restaurer position de liste, filtres, sélection, onglet et focus autant que la navigation existante le permet.

### UX-COM-03 — États, contrôles et ergonomie

- Les états vides sont utiles : « Aucun devis lié », « Aucune prochaine action » avec action de création uniquement si autorisée.
- Titres/labels distincts et lisibles, pas de mots coupés **lettre par lettre**, textes trop longs tronqués sur 1–2 lignes avec titre complet récupérable au clavier/survol.
- Validation, erreur, chargement, désactivation, confirmations et feedback d'enregistrement cohérents ; focus visible, clavier utilisable, Escape/Entrée là où approprié sans contourner les gardes.
- Objectif de contraste **WCAG 2.2 AA** (texte courant au moins 4,5:1 lorsque applicable ; focus et composants utilisables). Pas de texte clair sur fond clair ou gris sombre illisible.
- Indications de date claires : date calendaire + « Aujourd'hui / Demain / En retard » calculés, jamais valeurs simulées dans le vrai Manager.

---

# 3. LOT UX-PRO-01 — ANNUAIRE + FICHE RAPIDE + VUES PERSONNELLES

**Références captures :** `001`, `003`, `004`, `005`, `058`. **Priorité P0/P1.**

### PRO-01.1 — Annuaire pleine largeur quand aucun dossier ouvert

**Constat :** le tableau et la fiche rapide se disputent l'espace disponible dès qu'un dossier est sélectionné. Le tableau écrase Entreprise/Prochaine action/Échéance et finit avec un défilement horizontal.

**À faire :**
- Sans sélection : afficher le tableau **sur toute la largeur disponible**, sans colonne réservée à un panneau vide.
- Avec sélection : fiche rapide à droite avec **largeur contenue** (cible 360–480 px sur grand écran, adaptable), panneau redimensionnable **dans les limites réelles** ; priorité d'espace au tableau.
- Si la largeur du tableau réellement nécessaire n'est plus disponible (à déterminer avec le nombre de colonnes actives, la sidebar et le zoom), **basculer automatiquement en drawer** plutôt que laisser la grille se casser.
- Réduire la **présentation par défaut** aux informations critiques *Entreprise, Prochaine action, Échéance, Situation*, plus la commande **Ouvrir** obligatoire. Activité, Ville et Contact restent disponibles dans la personnalisation et dans la fiche ; ne supprimer aucune colonne du composant existant.
- Conserver la séparation redimensionnable et les préférences tant que la disposition le permet ; ne pas stocker des largeurs invalides à la prochaine ouverture.

**Acceptation :** 1920×1080, 1440×900, 1366×768 et 125/150 % de zoom : aucune colonne devenue inutilisable ; lorsqu'il manque de place, le drawer fonctionne ; scroll/focus accessibles ; réouverture conserve le bon prospect.

### PRO-01.2 — Tableau optimisé pour scanner en quelques secondes

- Entreprise = nom clairement mis en avant ; activité/ville/origine très secondaire et seulement si place disponible.
- Prochaine action = titre court lié à la tâche réelle, **2 lignes maximum**, avec accès au libellé complet.
- Échéance = date courte et état lisible, retard bien signalé ; « Pas d'action prévue » lorsque c'est exact.
- Situation = libellé de l'état métier réel ; badge distingué de la température ou du motif d'urgence.
- Commande d'ouverture explicitement nommée pour lecteurs d'écran ; ligne sélectionnable au clic/clavier **sans collision avec checkbox, tri et menu `…`**.
- Tri existant conservé sur le bon jeu filtré ; ordre, largeur, visibilité des colonnes et préférences préservés.
- Scroll vertical de la table visible, en-tête fixe si pertinent, barre horizontale seulement dans une vue volontairement personnalisée très large, pas dans la vue par défaut.

### PRO-01.3 — KPI compacts et filtres réellement exploitables

- Compacter les compteurs : *Tous/À suivre*, *À qualifier*, *À relancer*, *Devis à préparer* selon les définitions du code ; clic = filtre utile, avec **état actif visible** et moyen de revenir à la vue précédente.
- Ne pas additionner les compteurs qui se chevauchent ; documenter leur périmètre, notamment annuaire non archivé vs pipeline réellement démarré.
- Recherche principale visible ; filtres métier, ville, statut accessibles ; si espace insuffisant, déplacer les moins courants sous **Filtres avancés** sans perte des valeurs.
- Bouton **Effacer les filtres** ; petit indicateur du nombre de filtres actifs ; résultats cohérents à la vue active.
- Conserver la recherche sur les champs réellement indexés/chargés actuellement.

### PRO-01.4 — « Colonnes et vues » non envahissant

- Préserver le composant de personnalisation existant.
- Présenter ses réglages dans panneau/popover compact au lieu de repousser la table sur plusieurs rangées.
- Afficher nom de la **vue active**, Enregistrer, Enregistrer sous, Dupliquer, Renommer, Supprimer/Restaurer selon autorisation réelle ; ne pas suggérer des actions indisponibles sans expliquer pourquoi.
- Colonnes obligatoires **Entreprise** et **Ouvrir** non désactivables ; fonctions de tri/reclassement/test de persistance inchangées.

### PRO-01.5 — Fiche rapide centrée sur la prochaine action

- En-tête compact : avatar/logo, nom entreprise, statut, activité/ville discrètes, Fermer et Ouvrir la fiche complète.
- Premier bloc : **Prochaine action réelle**, date, interlocuteur utile, **un CTA contextuel** (démarrer la prospection, qualifier, consulter une relance, reprendre le devis, enregistrer un retour… en fonction de l'étape et des commandes autorisées). En absence d'action, CTA « Programmer une action » si le code le permet.
- Ensuite : contact principal (nom, fonction, tél/email si présents), **dernier échange** résumé en 1–2 lignes, lien clair vers l'historique.
- « Informations et préparation », « Associations », détails facultatifs : **repliés par défaut**, disponibles sans constituer une deuxième fiche complète.
- Conserver accès *Fiche de travail* et *Référence prospect* ; ne pas dupliquer les éditeurs métier complets dans le panneau.
- Éviter le double rendu des mêmes coordonnées à plusieurs endroits du panneau.
- Fiche rapide en drawer si nécessaire ; fermer sans perdre sélection/filtres ni forcer la page en haut.

**Tests fonctionnels de lot :** ouvrir plusieurs lignes, trier après sélection, filtrer, ouvrir un résultat depuis Kanban, revenir, redimensionner, réduire/agrandir la fenêtre, clavier, retour de chargement tardif, préférences sauvegardées.

---

# 4. LOT UX-PRO-02 — CRÉATION, ORGANISATION, CONTACTS, COORDONNÉES

**Références :** `002`, `009–017`, `051`. **Priorité P1.**

### PRO-02.1 — Ne plus insérer la création au milieu de l'annuaire

- « + Entreprise » ouvre une **vue de création focalisée** (page dédiée ou panneau/modal de taille pertinente selon architecture), sans garder sous le formulaire une table écrasée.
- Première partie courte : entreprise/organisation, activité/présentation/site (avec cas actuel *existant, absent, à vérifier*), interlocuteur si connu, provenance et première action selon prérequis réels.
- Enrichissement facultatif dans sections structurées : connaissance commerciale, services/clientèles/différences, coordonnées, valeur estimée, température.
- Conserver **exactement** les champs et règles de validation existants ; ne pas imposer inutilement un contact ou une prestation si la règle métier ne l'impose pas. Relevé actuel : entreprise **ou** contact prénom+nom requis selon le cas.
- Expliquer visuellement qu'**enregistrer ne démarre pas la prospection** ; l'action *Démarrer* reste distincte.
- Afficher erreurs à proximité, actions *Créer / Annuler* accessibles en bas fixe si contenu long ; conserver garde brouillon et restauration de contexte à la fermeture.
- Bouton « Remplir données test » uniquement s'il est prévu en environnement de recette et protégé de la production.

### PRO-02.2 — Entreprise ≠ Contact ≠ Dossier de prospection

- Gestion principale de l'identité entreprise dans Organisation/Annuaire ; de l'identité et coordonnées de la personne dans Contacts ; du **suivi commercial** dans Prospect.
- Même information peut être **consultée** ailleurs, mais pas éditée via plusieurs formulaires indépendants susceptibles de diverger.
- Dans « Entreprise et contacts », présenter des **résumés liés**, bouton « Modifier l'entreprise » / « Modifier ce contact » clair, plutôt que recoder un clone complet d'annuaire.
- Adresses siège, facturation, intervention et infos juridiques seulement si le modèle actuel sait les traiter ; sinon les signaler comme proposition de chantier ultérieur, **ne pas migrer dans cette refonte UX**.

### PRO-02.3 — Ajouter un contact sans doublon

- Première commande : **Rechercher un contact existant** et l'associer si compatible ; seconde : créer une personne.
- Fonction/rôle et qualité d'interlocuteur principal/décideur sont des **relations de contexte entreprise**, pas une copie de l'identité de la personne.
- Préserver la possibilité de rattachement multi-entreprises **si elle est déjà supportée** ; sinon ne pas simuler cette fonction : auditer les relations existantes et reporter le manque dans le rapport.
- Éviter la création automatique d'un contact doublon si email, identité ou identifiant existant ; validation conforme aux règles actuelles, sans fusion automatique dangereuse.
- Ajouter, modifier, retirer une association sans supprimer le contact global à son insu.

### PRO-02.4 — Formulaires plus courts et persistants

- Regrouper éditeurs en **Entreprise / Contact principal / Contacts liés / Coordonnées**, sections denses mais distinctes.
- Un formulaire de modification à la fois, actions Enregistrer/Annuler proches, feedback de succès/erreur ; si formulaire long, pieds d'action visibles sans superposer les champs.
- Préserver tous les champs légaux et de qualification *déjà stockés*, même si on en cache certains dans « Informations complémentaires ».
- Contrôles d'erreurs, navigation non enregistrée et concurrence conservés.

**Tests :** créer dossier avec entreprise seule autorisée, contact seul si autorisé, associer existant, créer nouveau, doublon, modifier rôles, annuler des changements, revenir à la fiche, vérifier relations et absence de doublon involontaire.

---

# 5. LOT UX-PRO-03 — FICHE PROSPECT A, QUALIFICATION, BESOINS ET DEVIS

**Références :** `006–010`, `018–020`, `046–051`, `066–069`. **Priorité P1.**

### PRO-03.1 — La fiche de travail ne doit plus paraître vide

- **Conserver la fiche Prospect A validée** : trois zones et deux onglets ; les panneaux latéraux repliables restent disponibles et mémorisent leurs préférences.
- Au centre, sous le bandeau Température/Situation/Prochaine action, ajouter ou redistribuer une **synthèse compacte** avec : besoin principal, personne à contacter, prochaine action/date, statut de devis s'il existe, **information bloquante à compléter** si fournie par la logique métier.
- Afficher ces informations à partir des données réelles existantes, **jamais de valeurs inventées** ; quand elles manquent, une phrase utile et un lien d'action.
- Accordéons « Entreprise et contacts », « Besoins et qualification », « Devis et activités » : conserver, ajouter une ligne descriptive et compteur adapté. Ne pas ouvrir toutes les sections par défaut ; éventuellement ouvrir **la section pertinente pour l'étape actuelle** si cela respecte les préférences et les éditeurs montés.
- Les panneaux d'identité/associations ne doivent pas répéter la description complète du dossier : liens courts et contexte.

### PRO-03.2 — Qualification lisible et guidée

- Afficher clairement les informations **acquises**, **à préciser**, **indispensables à cette étape** ; utiliser le résultat réel du contrôle métier, pas une règle simplifiée inventée.
- Regrouper origine, motif ciblage, premier contact, intérêt, contexte, décideur, problème/opportunité en blocs compréhensibles.
- Aide contextuelle courte et progressive ; états manquants explicites ; progression si présente (`1/3…`) accompagnée de la liste des éléments concernés.
- Commandes de sauvegarde accessibles, sans auto-transition.

### PRO-03.3 — Besoins / Catalogue / Préparation au devis

- Afficher en haut un **résumé des prestations sélectionnées**, même pendant l'édition.
- Organisation en étapes UX : **Sélectionner → Préciser → Vérifier**, sans créer trois nouvelles étapes métier en base.
- Chercher dans le Catalogue actuel ; conserver catégories, prestations et options possibles.
- Regrouper budget, calendrier, existant, contraintes et données à compléter ; masquer les sous-détails sans bloquer leur modification.
- Actions séparées : **Enregistrer les besoins** puis **Contrôler avant devis**. La création du devis doit rester une commande spécifique suivant les droits/statuts.

### PRO-03.4 — Carte devis et opérations contrôlées

- Carte résumant n° de devis, statut réel, besoins liés, informations manquantes, dernière action/date, devise/montant si réellement calculés.
- Action principale = opération **permise par l'état du devis** : ouvrir/modifier brouillon, préparer pour envoi, enregistrer l'envoi, consulter retour, réviser, etc. Les autres fonctions restent accessibles dans un menu secondaire.
- Ne pas confondre **Valider sa préparation** avec **Envoyer**, ni **Accepter / signer** avec **Convertir**.
- « Mettre en pause / information manquante » conserve le brouillon et exige les motifs/contrôles actuels.
- « Préparer le Projet » peut rester comme préparation **prévisionnelle**, sans démarrer production ni convertir automatiquement ; préserver toutes validations de devis, CGV/contrat et la logique de projet existante.
- Attention : la galerie montre un **brouillon sans lignes**, les états envoyés/signés doivent être testés en fixtures avant de conclure.

### PRO-03.5 — Trois colonnes sans écrasement

- Colonne **Identité** plus compacte : nom/activité/contact/lien annuaire, pas de répétition massive.
- Centre en priorité, disponible sur toute la largeur restante.
- Colonne **Associations** : Organisation/Contacts/Devis/Client converti, liens directs, sections repliables.
- En fenêtre étroite, colonnes latérales repliées ou accessibles via panneaux secondaires, pas de centre à 250 px ou de texte vertical.
- État de repli mémorisé et protections UX-01 toujours effectives.

**Tests :** dossier Nouveau, À qualifier, Besoins, Préparer devis, Attente retour, Négociation, Finalisation ; tous les statuts de devis permis ; basculement d'onglets avec brouillon non sauvé ; panneaux repliés puis rouverts ; transitions autorisées uniquement.

---

# 6. LOT UX-PRO-04 — ACTIONS, RELANCES, HISTORIQUE, PERTE ET ARCHIVAGE

**Références :** `021–026`, `054–055`, `059–065`. **Priorité P0/P1.**

### PRO-04.1 — Correction immédiate des contrastes de confirmation

- Refaire styles des dialogues *Perdu* et *Archiver* (`023–026`) : titre, avertissement, champs motif, texte de conséquence et actions **tous lisibles** en mode sombre.
- Bouton dangereux distinct, étiquette explicite (« Classer perdu », « Archiver le prospect »), retour Annuler visible ; validation/motif conforme au code.
- Vérifier que le clic Annuler et la fermeture ne déclenchent pas l'action ; pas de perte de saisie non désirée.

### PRO-04.2 — Un parcours fluide pour gérer une action commerciale

- Regrouper visuellement les trois activités liées : **Planifier une action → Saisir le compte rendu → Programmer une suite** dans un éditeur focalisé, idéalement le composant existant réorganisé, pas un nouveau système de tâches.
- Afficher immédiatement : intitulé/type/canal, entreprise-contact, échéance, responsable, résultat et éventuelle prochaine action selon les données actuelles.
- Les boutons de sauvegarde restent accessibles sans défiler tout le dossier ; possibilité d'annuler la saisie sans annuler une tâche programmée.
- Différencier les termes : **Annuler la saisie**, **Annuler l'action programmée**, **Fermer** ; ne jamais mélanger annulation d'une réservation d'action avec fermeture d'un formulaire.
- Compte rendu → suite éventuelle avec données préremplies uniquement si déjà supporté ; journalisation et liens conservés.
- Prochaine action accessible depuis annuaire, fiche rapide et fiche de travail, **même éditeur/règles métier**.

### PRO-04.3 — Historique de l'activité non redondant

- Présenter dans la fiche de travail uniquement le **dernier événement pertinent** + lien « Voir le journal ».
- Vue Historique conserve la **chronologie complète** (actions, comptes rendus, changements d'état, devis, issue), avec filtres utiles et contexte.
- Historique Prospection (dossiers clôturés) : tableau compact, filtres selon issues réelles, affichage du motif/étape/date quand disponibles, panneau détail contextualisé ; ne pas inventer d'enregistrements pour remplir le vide.
- Conversions : l'accès Client est réel et distinct, pas une simple couleur de badge.

### PRO-04.4 — Perdu / Archivé / Converti : trois opérations distinctes

- Motifs de perte existants préservés (prix, concurrent, abandon, absence de réponse, délai, hors périmètre ou autre détaillé).
- Archivage avec confirmation propre, non fusionné avec « Perdu ».
- Conversion selon le parcours autorisé, pas une simple réaffectation de statut ; préserver relation Client et historique.
- Les catégories « Gagné », « Converti », « Archivé » ne sont pas interchangeables : respecter les modèles existants.

**Tests :** création, échéance passée, compte rendu, suite, annulation/fermeture, données non sauvées, perte motivée, archivage, retour historique, lien Client converti.

---

# 7. LOT UX-PRO-05 — RÉFÉRENCE PROSPECT : LECTURE, MODIFICATION, FENÊTRE SÉPARÉE

**Références :** `027–045`, `056–057`. **Priorité P0/P1.**

### PRO-05.1 — Une seule expérience Référence prospect

- Conserver les **six rubriques** (Entreprise / Web & visibilité / Contrôles / Opportunités / Conversation / Historique) et le **versionnement** actuel.
- Même contenu, mêmes validations et composants de saisie lorsque ouvert dans la fiche ou en fenêtre séparée.
- La fenêtre séparée doit respecter le **thème utilisateur** actuel ; sa palette verte/claire observée (`056–057`) doit être vérifiée : si voulue par paramétrage, préserver le choix, sinon appliquer les tokens communs.
- Retirer tout texte clair sur fond blanc quasi invisible. Aucune différence arbitraire de sémantique entre mode intégré et détaché.

### PRO-05.2 — Lecture par synthèse ; édition à la demande

- Première vue avec *Activité / Ville / Site / Dernière vérification* en synthèse compacte, non dupliquée dans chaque sous-section.
- Navigation des rubriques visible, avec état actif et éventuellement comptage « à vérifier ».
- Séparer **information constatée**, **hypothèse/opportunité**, **source vérifiée** et **note brute**. Les notes commerciales d'échange restent dans Fiche de travail / Actions.
- Un seul accès clair « Modifier », et commandes Enregistrer/Annuler accessibles pendant les formulaires longs.
- Conserver `Date de vérification`, `Source générale`, `URL source` et **nouvelle version explicite** selon l'éditeur actuel.

### PRO-05.3 — Les contrôles par groupe plutôt que liste interminable

- Le bloc « Contrôles » (`037–042`) est très long : classer par sujets déjà présents (par exemple informations légales, sécurité, SEO/visibilité, performance/accessibilité lorsque les contrôles existent réellement).
- Voir un **résumé d'états** *Vérifiés / À vérifier / Non applicable* si ce sont bien les valeurs du code ; ne pas modifier le modèle de contrôle.
- Réduire les détails non renseignés ou facultatifs, possibilité de développer un groupe sans perdre sa saisie.
- Conserver l'accès à chaque critère, son observation, sa source et sa date.

### PRO-05.4 — Fermeture, versioning et stabilité

- À la fermeture de la fenêtre séparée ou changement de rubrique, appliquer les gardes actuels contre perte de modifications.
- Vérifier la cohérence de version après modification depuis deux endroits, et la mise à jour des données affichées sans réponse tardive écrasant une version récente.

**Tests :** même référence dans les deux modes, recherche et rubriques, modification partielle, annulation, enregistrement de nouvelle version, retour, thème sombre/clair si disponible, fermeture avec données modifiées, conflit éventuel.

---

# 8. LOT UX-PRO-06 — PIPELINE, CARTES ET VUE HISTORIQUE COMMERCIALE

**Références :** `052–055`, `053`. **Priorité P1/P2.**

### PRO-06.1 — Six étapes réellement utilisables

- Garder exactement les six étapes métier et l'ordre existant ; **Conversions** dans une zone séparée historique/client, non une 7e colonne à déplacer librement.
- Les colonnes peuvent être horizontalement scrollables **dans le Kanban**, avec en-têtes visibles et repères de navigation ; cet overflow horizontal est légitime ici, contrairement au tableau annuaire de base.
- Cartes : nom entreprise, résumé de besoin/prochaine action, échéance/retard, signal visuel discret de statut. Éviter les cartes trop hautes ou vides et les colonnes avec hauteurs absurdes.
- Filtrage **Tous / À relancer / En retard** clairement défini et cohérent avec les compteurs. Ne pas présenter des compteurs qui se recouvrent comme additifs.

### PRO-06.2 — Transitions et accessibilité

- Garder les drag & drop **uniquement** pour transitions autorisées, avec un message compréhensible lorsqu'une opération métier dédiée est requise.
- Alternative au clavier pour naviguer/ouvrir les cartes et effectuer les transitions permises ; focus visible.
- Préserver l'interdiction stricte de conversion Client par glisser-déposer.
- Raccourcis de rappel « demain », « dans 7 jours », date personnalisée si déjà présents ; vérifier dates selon fuseau local et affichage.
- Les actions des cartes ouvrent **la fiche rapide / commande métier existante** sans dupliquer la logique.

### PRO-06.3 — Historique et Conversions

- Vérifier que les issues « Perdu », « Gagné », « Converti », « Archivé » visibles via Historique/Conversions correspondent au stockage existant ; présenter leurs libellés exacts.
- Rechercher et trier sans faire disparaître les associations ni confondre dossiers clos et comptes clients.
- Afficher en détail l'issue et le lien vers la fiche Client lorsqu'une conversion réelle existe.

**Tests :** pipeline avec colonnes vides/pleines, long nom d'entreprise, filtres, ouverture, transitions autorisées/interdites, rappel, clavier, conversion interdite au drag, historique et lien client.

---

# 9. MATRICE DE TESTS TRANSVERSAUX OBLIGATOIRES

## 9.1 Affichage et navigation

- [ ] 1920×1080, 1440×900, 1366×768 (ou largeur de fenêtre équivalente), plein écran et fenêtre redimensionnée.
- [ ] Zoom 100 %, 125 %, 150 % et si pertinent 200 % ; sidebar ouverte/réduite ; panneaux latéraux ouverts/fermés.
- [ ] Aucune coupure de mot verticale ni champ sans libellé ; aucun bouton hors d'atteinte ; `Tab`, `Shift+Tab`, `Entrée`, `Échap`, lecture des tooltips et focus visible.
- [ ] Table pleine largeur, table + fiche rapide, drawer superposé, fiches complète et référence séparée ; pas de scroll imbriqué bloquant.
- [ ] Recherche, tri, pagination, filtre KPI, filtres combinés, effacer filtres, vue personnalisée, choix colonnes, persistance et restauration du contexte.
- [ ] États chargement/vide/erreur, notifications non intrusives et absence de double soumission.

## 9.2 Données, sécurité et comportements

- [ ] Dossier nouveau : reste Nouveau contact après enregistrement ; démarrage explicite.
- [ ] Contact existant associable selon modèle ; aucun doublon créé automatiquement ; modification des liens sans perte.
- [ ] Qualification : exigences métier réelles, informations manquantes et gardes intactes.
- [ ] Besoins : sélectionner et sauvegarder ne crée ni devis ni projet.
- [ ] Devis : brouillon, préparé, envoyé, refusé, négociation, accepté/signé, conversion : opérations distinctes et transitions correctes.
- [ ] Clôture : perte exige un motif ; refus devis ne clôt pas seul ; archivage indépendant ; conversion réelle accessible depuis Client.
- [ ] Actions : planification, retard, compte rendu, suite, annulation et historique exact.
- [ ] Référence : versionnage, sources, date de vérification, édition dans les deux contextes, sans divergence.
- [ ] UX-01 : brouillons non enregistrés, changement de ligne/onglet/module, fermeture fenêtre/panneau, retour navigateur/Electron selon mécanisme actuel.
- [ ] Asynchronisme : réponses tardives ignorées, sauvegarde concurrente protégée, bonne sélection après tri.
- [ ] Aucun effet sur données utilisateur réelles et aucune migration superflue.

## 9.3 Contrôles techniques

- [ ] `typecheck` et build selon scripts existants ; ne pas inventer de commandes non présentes au dépôt.
- [ ] Tests automatisés ciblés des nouveaux comportements ; suite complète appropriée.
- [ ] Tests de navigation ou composants Electron/React lorsque l'environnement permet l'exécution ; sinon documenter précisément pourquoi et donner la recette manuelle.
- [ ] Captures **avant/après** (au minimum annuaire sans/avec fiche, fiche complète, création, référence intégrée/détachée, pipeline, confirmations Perdu/Archiver).
- [ ] Vérifier la conformité visuelle de **plusieurs longueurs de textes** et de **données manquantes** ; pas seulement les fixtures « heureuses ».

---

# 10. CONDITIONS D'ACCEPTATION — DÉFINITION DE « TERMINÉ »

La refonte n'est terminée que si :

1. **Toutes les corrections PRO-01 à PRO-06 et UX-COM sont évaluées, implémentées lorsqu'elles sont compatibles avec l'existant, et tracées** ; si un point est volontairement non appliqué, fournir raison précise (pas « à étudier » générique).
2. Aucune action métier utile auparavant n'est supprimée ou cachée de manière inaccessible.
3. Navigation Annuaire → fiche rapide → fiche de travail → référence → devis/relance → Historique/Client cohérente, **sans ressaisie ni perte de sélection** injustifiée.
4. Formulaires et confirmations lisibles, gardes UX-01 préservées, sauvegardes explicites et retour utilisateur présent.
5. Les six étapes, les issues historiques, les associations et les transitions métier restent intactes.
6. Les tests pertinents réussissent ; les défauts résiduels sont consignés de façon reproductible.
7. Un rapport final liste **tous les lots**, chemins de fichiers, modifications, tests, captures, commits/PR et vérifications manuelles restantes.

---

# 11. REPORTING DEMANDÉ À CODEX

À la fin de chaque lot, produire sans interrompre la mission :

| Lot | Modifications réelles | Fichiers | Tests passés | Captures | Risques / limites |
|---|---|---|---|---|---|
| UX-PRO-01 | … | … | … | … | … |
| UX-PRO-02 | … | … | … | … | … |
| UX-PRO-03 | … | … | … | … | … |
| UX-PRO-04 | … | … | … | … | … |
| UX-PRO-05 | … | … | … | … | … |
| UX-PRO-06 | … | … | … | … | … |

Puis fournir une **synthèse de régression** démontrant que le workflow commercial n'a pas été modifié silencieusement. Signaler toute fonction techniquement hors périmètre et toute correction conservée pour une intervention future distincte.

**Autorisation utilisateur :** réaliser **tous** les lots identifiés, de manière séquentielle, **sans demander une validation intermédiaire à chaque lot**, tant qu'il s'agit de refonte UX conforme à ce document et sans mutation métier irréversible ; ne pas déclarer « terminé » avant d'avoir exécuté les tests et rendu compte de tous les lots.

---

# 12. ANNEXE — INDEX DES CAPTURES À UTILISER

| Captures | Parcours documenté / point de contrôle |
|---|---|
| `001` | Annuaire / colonnes / filtres / compteurs |
| `002` | Création entreprise insérée dans l'annuaire |
| `003` | Colonnes et vues / préférences utilisateur |
| `004–005` | Fiche rapide, division de l'espace et scroll |
| `006–008` | Fiche Prospect A, identité, associations |
| `009–017` | Entreprise et contacts, édition, coordonnées, ajout contact |
| `018–020` | Qualification / renseignements manquants |
| `021–022` | Activités et historique dans le dossier |
| `023–024` | Confirmation Perdu et lisibilité |
| `025–026` | Archivage et lisibilité |
| `027–033` | Référence prospect : six rubriques en lecture |
| `034–045` | Référence prospect : six rubriques en modification, longs contrôles |
| `046–048` | Étape Besoins / Catalogue / contrôles |
| `049–050` | Étape Devis : brouillon sans lignes |
| `051` | Nouveau contact |
| `052–053` | Kanban / ouverture de carte |
| `054–055` | Historique et détail |
| `056–057` | Référence prospect en fenêtre séparée / édition |
| `058` | Annuaire contexte d'actions |
| `059–060` | Ajouter une action |
| `061–062` | Compte rendu |
| `063–065` | Programmer la suite d'une action |
| `066–067` | Étape Attente du retour |
| `068–069` | Étape Négociation |

**Limites des sources :** captures seules ne vérifient pas les devis envoyés/acceptés, le passage en production/Projet, tous les cas de conversion, ni la garde de fermeture sur brouillon. Codex doit tester ces situations lui-même avec fixtures sûres. Ne pas prendre les exemples de données comme des vérités métier.

## Références de bonnes pratiques (pour interprétation, sans copier un design tiers)

- W3C WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- Reflow et zoom : https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- Nielsen Norman Group : heuristiques UX (visibilité d'état, cohérence, prévention des erreurs, reconnaissance plutôt que rappel) : https://www.nngroup.com/articles/ten-usability-heuristics/
- Inspiration Cogivea/HUBYup : séparation Organisation/Contact, création du compte avant liaison des personnes, reprise de contexte dans les devis ; **pas de création d'un modèle parallèle sans audit de l'existant**.

**FIN DU CAHIER DES CHARGES — Tous les lots doivent être traités.**
