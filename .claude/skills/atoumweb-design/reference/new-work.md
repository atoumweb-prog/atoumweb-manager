# Nouvel écran ou nouvelle surface

Méthode pour concevoir un écran, une surface ou un parcours nouveau dans AtoumWeb Manager. Adaptée de la méthode « new-work » d'Impeccable (Paul Bakaus, Apache-2.0, voir `NOTICE.md`), sans tirage au sort, sans maquettes générées, sans sous-agents ni programme externe.

Cette méthode ne s'applique qu'avec l'accord de l'utilisateur et dans le périmètre du lot en cours. **Une refonte complète d'un écran, ou le remplacement de l'univers visuel, n'est jamais décidé seul** : présente les options, attends le choix.

## 1. Établir ce qui est déjà vrai

Lis `docs/refonte/DESIGN.md` (s'il existe), le code représentatif, les tokens des trois thèmes, les composants et les écrans voisins.

- **Univers établi** : hérite-le. Un `DESIGN.md` absent n'efface pas une identité cohérente déjà présente dans le code ; décris-la, ne la remplace pas.
- **Identité incomplète** : conserve les éléments confirmés et les traits reconnaissables, puis complète le système avec l'utilisateur pour cette surface.
- **Aucune autorité visuelle** : propose des pistes à l'utilisateur ; ne tranche pas seul.
- **Refonte demandée** : conserve la vérité métier, les contenus, les fonctions, les contraintes et les engagements de marque ; l'ancien aspect est une preuve de ce qu'est le produit, pas une autorité sur ce qu'il devient.

Une section, un composant, une fonctionnalité ou un état à l'intérieur d'une surface établie hérite de cette surface. Ne transforme jamais un ajout local en exercice d'identité.

## 2. Demander ce qui change le travail

Avant d'implémenter, obtiens la réponse de l'utilisateur. Pose deux ou trois questions liées ; une demande précise n'appelle qu'une confirmation courte. Ne redemande pas ce qui est réglé (la charte règle l'univers visuel, pas le but de cette surface).

Pour un écran de travail (mode Operate, voir `operate.md`) : la tâche, l'information à lire en premier, les états importants (vide, chargement, erreur, long), la fréquence d'usage, les contraintes. Pour une page de lecture : la question du lecteur, la structure, le repérage. Pour une page de présentation : qui doit agir, ce qu'il doit croire, quelles preuves réelles.

Demande aussi : à quoi ressemble la réussite, ce qui ne doit surtout pas bouger, ce qui rendrait un résultat soigné mais faux. Ne demande jamais des valeurs CSS ni des « ambiances » toutes faites, et ne propose pas ton propre style avant d'avoir compris le besoin : une direction nommée dans une question est celle que la réponse confirme.

## 3. Choisir la bonne quantité d'invention

- **Étendre une surface existante** : hérite de son univers et de sa composition. Résous seulement le nouveau but, le contenu, la hiérarchie, les états, l'interaction et la jonction avec l'existant. Pas de tournoi de concepts, et aucune modification de `docs/refonte/DESIGN.md` sans accord.
- **Créer un écran entier dans un univers établi** : le système visuel reste fixe. Déduis du contenu, de la tâche et des comportements de 3 à 5 structures réellement différentes (organisation, navigation, densité), classées par pertinence. Présente-les à l'utilisateur sous forme de courtes fiches de même poids (principe, avantage, risque, effort), et laisse-le choisir. Ne tranche pas à sa place.
- **Créer ou remplacer l'univers visuel** : hors périmètre par défaut. Ne le fais que sur demande explicite, en proposant plusieurs directions complètes (univers + première expérience concrète) issues de la réalité des utilisateurs, et seulement après validation.

## 4. Cadrer avant de construire

Écris un court brief en texte (dans le chat, jamais dans un fichier sans accord) : but de la surface, tâche principale, contenu et états, structure retenue, ce qui est conservé, ce qui est hors lot. Obtiens l'accord, puis construis. Toute décision durable (tokens, règles de composants) est proposée comme ajout à `docs/refonte/DESIGN.md`, jamais écrite sans accord.

## 5. Construire avec engagement

- **Le premier écran répond à la tâche.** Le produit fait son travail dès la première vue, à l'échelle réelle ; ne l'enferme pas dans un en-tête ou une carte standard. Test de mémoire : si l'utilisateur partait après ce premier écran, que décrirait-il une heure plus tard ?
- **Montrer, ne pas affirmer.** Montre l'interface au travail avec des données crédibles. Les données de démonstration sont du matériau de conception : écris-les avec soin et étiquette-les clairement comme TEST ou fictives (cohérent avec les libellés de la base Validation-MSI). Les affirmations commerciales, prix et références restent non inventables.
- **Écrire de vrais contenus, jamais du décor à la place.** Libellés, entrées, textes d'aide, états vides : rédige-les à qualité de production. Dégradés, verre dépoli ou pastilles d'icônes génériques à la place d'un contenu sont des vides déguisés.
- **Le mouvement comme matière.** Un seul mouvement natif, orchestré, plutôt que des effets de survol dispersés ; garde le contenu visible par défaut (voir `animate.md`).
- **Conserver** sémantique, accessibilité, performance, responsive, conventions du projet et comportements existants.

## 6. Inspecter et finir

- Inspecte les tailles réellement livrées (largeur de fenêtre minimale et usuelle du Manager, les trois thèmes), en un seul tour groupé : corrige ce qu'un regard montre avant de regarder à nouveau.
- Sur tout élément interactif, passe en revue chaque état atteignable (ouvert, fermé, survol, focus, erreur, vide, contenu trop long) et contrôle chevauchements et rognages, pas seulement l'écran au repos.
- Une capture n'est une preuve que si elle est valable : calme d'abord les animations d'entrée (un élément caché par une animation passe pour un élément manquant), capture depuis le haut du document, puis ouvre chaque fichier et vérifie qu'il montre bien ce que son nom annonce (pas de zone noire ou vide, pas de mauvaise section, pas d'état à moitié chargé).
- Critique le rendu par rapport à la demande et au brief validé, corrige les écarts matériels, puis confirme par un dernier tour. Deux tours au maximum ; les corrections sont groupées entre les deux.
- Rapporte le verdict à son périmètre réel : « les trois corrections listées sont résolues » est une affirmation défendable, « il ne reste aucun problème » ne l'est pas. Un tableau avec des problèmes ouverts n'est jamais présenté comme réussi.
- Si l'utilisateur répond à une livraison par des preuves contraires (sa capture, un écart nommé), elles l'emportent sur tes propres captures : reprends une revue complète. Se corriger soi-même sans revue, c'est ainsi qu'une page refusée part deux fois.
- Termine par `polish` si l'utilisateur le souhaite, puis par les vérifications du projet (typecheck, tests ciblés) quand elles sont prévues, résultats réels à l'appui.
