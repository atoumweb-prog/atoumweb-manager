# Client B — intégration de la présentation approuvée

Décision utilisateur du 16 octobre 2026 : **B — Espace central élargi** devient la présentation réelle du Résumé Client ; Client A est abandonnée. Départ exact : `4f0b0a1234f06727ac0e219a2d401fbef7d8ce28`. Branche locale dédiée : `codex/ux-v2-client-b-final`. Aucun nouveau travail de conception Prospect.

## Implémentation

- « Fiche client » administratif retiré : logo, nom, statut et coordonnées essentielles restent dans Identité.
- Les vrais contrôles d’action et les échéances ouvrent le Résumé. Le suivi commercial occupe la seconde colonne à partir de 600 px **dans la région de travail** ; en dessous, empilement dans le même ordre de lecture.
- L’activité récente reprend les trois premiers événements du même historique Client/conversion déjà chargé, sans nouvelle source ni duplication de données ; accès à l’onglet Historique complet.
- Coordonnées détaillées, moyens de contact, liens Annuaire et formulaires existants conservés dans une disclosure native. Les informations ne sont plus répétées en permanence. Replier ne démonte pas un éditeur.
- Gestion du statut, notes et confirmation d’archivage conservées dans « Gestion de la relation client ». La programmation de l’action est déplacée, sans duplication, dans la zone prioritaire. Aucun callback métier ni garde UX-01 remplacé.
- Cadres et marges superflus allégés ; aucun abaissement des polices fonctionnelles. Huit onglets, associations, séparateurs souris/clavier et comportement adaptatif préservés.

## Préférences, compatibilité et données

Sans préférence enregistrée, les panneaux Client utilisent 220 px pour Identité et 190 px pour Associations. Les valeurs Prospect restent strictement 260/280 px et sa borne minimale de 220 px ne change pas. Le minimum Associations de 190 px est réservé au Client, dans le composant et la normalisation par clé du store existant. Pas de nouveau store, de migration ou de version de préférence.

**Une largeur utilisateur déjà enregistrée est conservée**, même si elle est plus grande que les nouveaux défauts. Il n’y a pas de réinitialisation silencieuse. La touche Home sur chacun des séparateurs existants permet de retrouver volontairement les minima Client B ; une saisie reste montée pendant ce geste. Les préférences ne contiennent ni dossier, ni onglet, ni note, ni brouillon. L’aperçu de redimensionnement ne persiste rien ; un seul enregistrement a lieu à la fin du geste.

EC01 est conservé par ascendance. Prospect A, les moteurs contractuels/EC03, les IPC métier, SQLite, les migrations, les actifs logos et les mécanismes de sauvegarde ne sont pas modifiés. La sauvegarde des logos hors SQLite reste une réserve séparée.

## Tests permanents et protocole final

`node scripts/check-ux-v2-client-b.cjs` utilise le vrai renderer, preload, IPC, une base et un profil TEMP possédés par le banc existant. Aucune injection de maquette, de CSS de variante ou d’activité clonée n’est utilisée.

- 81 états : trois thèmes × trois densités × trois tailles (1510×1030, 1920×1080, 1280×720) × trois zooms (100/125/150 %).
- Limites de défilement mesurées dans les mêmes unités CSS (`scrollWidth`/`clientWidth`), sans tolérance ajoutée pour dissimuler un débordement.
- Priorités et commercial côte à côte quand la place le permet ; activité en dessous ; huit onglets sur une ligne, zone de travail consultable, police fonctionnelle ≥14 px.
- Quatre brouillons simultanés (contact, coordonnées, relation, action) conservés, avec leurs nœuds, à travers les huit onglets, les disclosures et neuf affichages étroits à 150 %.
- Navigation native au clavier, une confirmation Rester, puis abandon explicite avec seconde confirmation ; absence d’enregistrement implicite.
- Largeurs personnalisées conservées, aperçu immédiat sans écriture, écriture unique en fin de geste, Home accessible à 190 px.
- Client vide sans information inventée ; intégrité SQLite et clés étrangères sur TEMP.

Quatre tests Vitest supplémentaires couvrent les défauts distincts Client/Prospect, les préférences existantes, la borne de 190 px à travers le vrai adaptateur et la normalisation sûre. Les tests antérieurs restent présents.

La validation finale doit être exécutée **après commit sur son SHA exact** : typecheck, suite complète Vitest à deux workers, banc Client B avec captures synchronisées, CRM existant, UX-01, EC01 et Prospect A. Le manifeste local `outputs/client-b-final-20261016/final/tests.json` et le ZIP livré feront foi ; les résultats du candidat parent ne certifient pas ce nouveau code.

Captures prévues : Résumé dans les neuf thèmes/densités à 1510×1030/125 %, trois tailles en Noir/Confort/150 %, sept autres onglets ; comparaison à la fiche réelle du parent 4f0b0a12 sur les mêmes données synthétiques, et à la proposition B approuvée. La recette humaine du rendu implémenté reste distincte du choix de maquette déjà obtenu.

## Périmètre de livraison

Commit local uniquement : aucune publication, CI hébergée, fusion, installation, migration ou modification des données réelles/Validation-MSI. Aucun nouveau candidat graphique Client A n’est livré. Le seul point visuel attendu après les contrôles est l’examen des captures de Client B réellement intégré.
