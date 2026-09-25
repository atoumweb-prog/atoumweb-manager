# Décision d’architecture — Snapshots Bridge, médias locaux et déduplication

Date de décision : 24/09/2026  
Projet : AtoumWeb Manager / AtoumWeb Bridge  
Statut : **direction validée à implémenter progressivement**

## 1. Finalité

AtoumWeb Bridge doit permettre au Manager de conserver une copie technique exploitable d’un site WordPress/Divi à un instant T.

Cette copie ne doit pas dépendre durablement du site en ligne.

La cible est donc :

- conserver les pages, modules, HTML, CSS, JS, sources Divi, Theme Builder et dépendances ;
- conserver localement les médias nécessaires à la reconstruction lorsque Bridge peut les récupérer ;
- éviter de recopier physiquement les mêmes médias à chaque nouveau snapshot ;
- conserver l’historique des versions d’un même média si son contenu change ;
- permettre à la Bibliothèque AtoumWeb d’embarquer uniquement les assets nécessaires à un composant réutilisable.

## 2. Principe fondamental

> Un snapshot est une photographie logique du site. Les fichiers lourds partagés sont conservés dans un coffre local dédupliqué et référencés par empreinte de contenu.

Un nouveau snapshot ne doit pas créer une nouvelle copie physique d’un fichier déjà connu si son contenu est strictement identique.

## 3. Stockage adressé par contenu

Les ressources physiques doivent être identifiées par une empreinte cryptographique, prioritairement SHA-256.

Exemple :

```text
Snapshot 24/09
Accueil
 ├─ logo.webp        -> sha256:AAA
 ├─ hero.jpg         -> sha256:BBB
 └─ article-1.jpg    -> sha256:CCC

Snapshot 15/10
Accueil
 ├─ logo.webp        -> sha256:AAA   déjà présent
 ├─ hero.jpg         -> sha256:BBB   déjà présent
 └─ article-2.jpg    -> sha256:DDD   nouveau
```

Au second import :

- AAA n’est pas recopié ;
- BBB n’est pas recopié ;
- DDD est ajouté ;
- le snapshot du 24/09 continue de référencer CCC.

## 4. Même nom, contenu différent

Le nom de fichier ou l’URL ne doit jamais être utilisé comme preuve d’identité.

Si `hero.jpg` est remplacé sur le site mais garde le même nom :

- son SHA-256 change ;
- une nouvelle ressource physique est créée ;
- les anciens snapshots conservent l’ancienne version ;
- les nouveaux snapshots référencent la nouvelle version.

## 5. Même contenu, URLs différentes

Si deux URLs ou deux sites référencent exactement les mêmes octets :

- le SHA-256 est identique ;
- une seule copie physique peut être conservée dans le coffre ;
- plusieurs références métier peuvent pointer vers cette même ressource.

La provenance et l’URL d’origine restent historisées séparément.

## 6. Arborescence cible

Arborescence conceptuelle recommandée :

```text
<workspace>/
├─ data/
│  └─ atoumweb-manager.sqlite
├─ bridge/
│  ├─ objects/
│  │  ├─ sha256-AAA.webp
│  │  ├─ sha256-BBB.jpg
│  │  ├─ sha256-CCC.jpg
│  │  └─ sha256-DDD.jpg
│  └─ snapshots/
│     └─ <site-key>/
│        ├─ <snapshot-id-1>/
│        └─ <snapshot-id-2>/
└─ ...
```

Les snapshots doivent référencer les objets physiques ; ils ne doivent pas dupliquer les fichiers lourds dans chaque dossier de snapshot.

## 7. Priorité d’affichage dans Sites

Pour reconstruire une page ou un module :

1. utiliser l’asset local du coffre s’il existe ;
2. sinon utiliser l’URL distante conservée dans le snapshot comme secours ;
3. si ni la copie locale ni l’URL ne sont disponibles, afficher clairement **Média manquant**.

Le Manager ne doit jamais faire croire qu’une ressource est locale si elle est uniquement chargée depuis Internet.

## 8. Snapshot suivant

Lorsqu’un nouveau snapshot du même site est importé :

- comparer les empreintes ;
- réutiliser les objets déjà présents ;
- ajouter uniquement les nouveaux contenus physiques ;
- conserver un nouvel état logique du site ;
- ne pas écraser le snapshot précédent ;
- ne pas écraser une ancienne version de média.

Le mécanisme doit rester idempotent :

- réimporter exactement le même snapshot ne crée aucun doublon ;
- un snapshot différent mais contenant beaucoup de ressources identiques ne duplique pas ces ressources.

## 9. Suppression et garbage collection

Une ressource physique ne doit jamais être supprimée tant qu’elle est référencée par au moins :

- un snapshot Bridge ;
- une version de composant de Bibliothèque ;
- un export/paquet local conservé par le Manager si celui-ci référence le coffre.

La suppression physique d’objets orphelins devra être une opération volontaire et contrôlée, jamais une conséquence implicite de la suppression d’un snapshot ou d’une fiche.

## 10. Bibliothèque AtoumWeb

Lorsqu’un module est envoyé depuis Sites vers la Bibliothèque :

### Originale

La version originale conserve :

- HTML original ;
- CSS module original ;
- CSS page/global de référence ;
- JS original ;
- source Divi originale ;
- références d’assets ;
- provenance site/page/snapshot.

### Version de travail

La version de travail doit pouvoir :

- isoler le HTML utile ;
- consolider le CSS nécessaire ;
- séparer le JS ;
- détecter les dépendances ;
- référencer les assets locaux disponibles ;
- signaler les assets uniquement distants ;
- être modifiable/testable dans le Manager.

### Réutilisable

La version réutilisable n’est pas une copie conforme de la version de travail : elle devient un **modèle AtoumWeb générique**.

Elle doit :

- conserver la structure, les classes, le CSS, le responsive et le comportement validés ;
- remplacer les textes métier propres au site d’origine par des contenus de démonstration neutres ;
- neutraliser les liens propres au site d’origine ;
- remplacer les images de contenu et images de fond par des médias de démonstration locaux ;
- identifier explicitement les champs personnalisables (texte, lien, image) ;
- ne devenir `Prêt à réutiliser` que si la généralisation est valide et que les ressources nécessaires ne dépendent plus du site source.

Exemple de champs :

```text
Titre principal      -> Texte
Texte principal      -> Texte
Bouton principal     -> Texte
Lien principal       -> Lien
Image principale     -> Image
```

À terme, l’action **Utiliser ce composant** doit permettre de renseigner ces champs dans le Manager avant de produire le HTML/CSS/JS final du nouveau projet.

La version réutilisable doit également pouvoir devenir autonome sous forme de paquet :

```text
Home-Blog-V2/
├─ component.html
├─ component.css
├─ component.js
├─ assets/
│  ├─ image-1.webp
│  ├─ image-2.webp
│  └─ icon.svg
└─ README.txt
```

Les assets du paquet doivent être copiés depuis le coffre local, sans modifier les objets du coffre.

## 11. Médias et ressources concernés

À traiter comme assets potentiellement locaux :

- images WordPress ;
- SVG ;
- icônes personnalisées ;
- vidéos locales si taille/politique le permettent ;
- polices locales réellement nécessaires ;
- fichiers de téléchargement utilisés par un composant ;
- autres ressources statiques nécessaires à la reconstruction.

Pour les ressources très lourdes, un mécanisme de politique/limite pourra être ajouté, mais la référence exacte doit toujours être conservée.

## 12. Plugins et dépendances comme Forminator

Le Manager ne doit pas copier arbitrairement le code source d’un plugin tiers.

Pour une dépendance comme Forminator, WooCommerce ou un autre plugin :

- enregistrer le plugin et sa version détectée ;
- enregistrer l’usage du plugin par le composant/page ;
- conserver un export/configuration du formulaire ou élément si Bridge peut l’obtenir proprement ;
- conserver les assets spécifiques réellement nécessaires lorsqu’ils appartiennent au contenu ;
- documenter la dépendance dans la version réutilisable.

Exemple :

```text
Dépendance : Forminator
Formulaire : Contact principal
Export de configuration : disponible
Action sur nouveau site : installer Forminator puis importer le formulaire
```

Le but n’est pas de transformer un plugin tiers complet en composant autonome.

## 13. Différence sauvegarde / snapshot

Un snapshot Bridge n’est pas une sauvegarde WordPress complète permettant automatiquement une restauration du serveur.

Il s’agit d’une copie technique et documentaire orientée :

- compréhension ;
- historique ;
- migration ;
- réutilisation ;
- reconstruction de composants.

Les sauvegardes complètes WordPress/serveur restent gérées par le domaine Sauvegardes.

## 14. Sécurité

Les snapshots et assets importés restent passifs :

- aucune exécution automatique de JS/PHP ;
- previews en sandbox ;
- secrets et données sensibles redacted côté Bridge ;
- contrôles d’intégrité par hash ;
- provenance conservée.

## 15. Responsabilité Bridge / Manager

### AtoumWeb Bridge

Doit progressivement fournir :

- inventaire complet ;
- empreintes fiables ;
- objets/médias exportables ;
- provenance ;
- relations page/module/asset ;
- dépendances ;
- redaction avant export.

### AtoumWeb Manager

Doit progressivement assurer :

- import idempotent ;
- stockage local des objets ;
- déduplication par contenu ;
- référencement historique ;
- reconstruction offline prioritaire ;
- exploitation dans Sites ;
- transfert sélectif vers Bibliothèque ;
- export autonome de composants réutilisables.

## 16. Direction obligatoire pour les prochaines évolutions

Toute évolution future de Bridge / Sites / Bibliothèque doit respecter ces règles :

1. **archive fidèle avant transformation** ;
2. **pas de dépendance Internet obligatoire pour consulter un snapshot complet** ;
3. **pas de duplication physique inutile des médias** ;
4. **historique immuable des snapshots** ;
5. **un média modifié = nouvel objet, jamais écrasement de l’ancien** ;
6. **la Bibliothèque sélectionne et embarque uniquement ce qui est nécessaire au composant** ;
7. **les plugins tiers restent des dépendances documentées, pas du code à copier aveuglément** ;
8. **aucune suppression physique tant qu’une référence existe**.

## 17. État actuel au moment de la décision

Déjà présent :

- contrat Snapshot V1 ;
- SHA-256 pour les objets/paquets Bridge ;
- snapshots historiques dans le Manager ;
- import idempotent du même snapshot ;
- assets et dépendances référencés ;
- previews pouvant actuellement utiliser les URLs HTTPS distantes.

À construire ou renforcer :

- téléchargement/embarquement local systématique des médias pertinents côté Bridge ;
- coffre d’objets partagé côté Manager ;
- déduplication physique des assets entre snapshots ;
- priorité à la copie locale dans les previews ;
- gestion des références et suppression des objets orphelins ;
- export autonome des assets pour la Bibliothèque ;
- exports/configurations de plugins lorsque leur format le permet.

Cette différence doit rester explicite afin de ne pas présenter la cible comme déjà implémentée.

## 18. Transport Bibliothèque — lot 2 Manager

Le transport des assets déclarés utilise les champs existants : référence `hash` → fichier du manifeste `checksumSha256` → `archivePath`. Il ne change aucun contrat V1.

À l'export, Manager utilise d'abord les fichiers attachés à la version. Une référence peut également être résolue dans le coffre par SHA-256 ou par son couple snapshot d'origine / assetId. Le fichier est vérifié avant embarquement ; un même contenu n'est écrit qu'une fois dans le ZIP. Le `localPath` fourni par le site n'est jamais utilisé comme chemin local à ouvrir.

Quand le Snapshot fournit un objet vérifiable mais que la référence n'a pas de hash, seule la copie JSON exportée est enrichie. La version historique reste inchangée. Aucun téléchargement externe ni remapping du HTML n'est effectué.

Le bilan présenté à l'export et à l'inspection porte sur les assets **déclarés** : il ne certifie pas l'absence de dépendances non déclarées dans le code. Toutes les références déclarées sont traitées conservativement comme nécessaires. Les références externes ou non résolues restent conservées, avec un bilan incomplet. Un fichier déclaré embarqué mais absent ou altéré fait échouer la validation du ZIP.

Un package incomplet peut être exporté et inspecté, mais son import est refusé avant création d'un élément/version. Pour un package complet, les fichiers sont préparés avant la transaction métier. Une erreur pendant l'import annule les données, y compris les statuts courant/stable, l'index et le journal, puis supprime uniquement les fichiers créés par cette tentative. Les objets partagés du coffre ne sont jamais supprimés. Un échec de nettoyage est remonté explicitement ; des répertoires vides peuvent subsister. Cette compensation traite les exceptions de l'opération, pas une interruption brutale du processus.
