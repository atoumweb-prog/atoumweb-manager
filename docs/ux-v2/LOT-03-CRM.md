# Lot 03 — Prospection, Clients et Annuaire
**Statut : spécification cible, non implémentée par ce document.**
## Prospection
- Modes Annuaire / Pipeline / Historique, fiche rapide puis complète et éventuelle fenêtre de référence détachée.
- **Sept colonnes visuelles** : À qualifier, Besoins, Préparer le devis, Attente du retour, Négociation, Finalisation, Conversion. **Décision AtoumWeb : Conversion = historique consultable des Prospects effectivement convertis en Clients, séparé du pipeline actif** ; lien Client vérifiable, aucun `lost`, aucun doublon. Ne jamais inventer de valeurs backend nouvelles : cartographier les états existants avant le drag & drop. L'étape historique Conversion ne doit pas être une cible de drag & drop créant une conversion implicite ; celle-ci suit le parcours métier validé. `new`, Finalisation et période de l'historique restent à préciser (E59).
- Températures `cold`, `neutral`, `warm`, `hot` ; marqueur couleur discret sans libellé imposé sur la carte, aide accessible ; transitions de phase soumises aux gardes métier.
- Fiche Prospect : Résumé, Entreprise, Qualification, Besoins, Devis, Activités, Historique ; champs/décisionnaire et contrôle avant devis préservés.
- Fiche besoins : accès au catalogue central (voir LOT-04), inclus/exclus, services complémentaires et aide `?`. Sélection d'un besoin **ne crée pas d'achat**.
## Clients
- Fiche Client distincte de Prospect ; ordre résumé/coordonnées → relation → devis/contrats/projets → échéances/actions ; huit onglets Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique.
- Résumé personnalisable, widgets et actions utiles ; relation Client (appréciation qualitative, observation datée) distincte de température Prospect.
- Avatar logo, photo de personne ou icône ; organisation et personne physique différenciées ; coordonnées et contacts restent source unique.
- Accès transversal aux dossiers sans recopie des données. Contrats et preuves protégés.
## Annuaire
Organisations, contacts, recherche, catégories, dernière vérification ; entrée d'annuaire ≠ prospect converti.
## Ordre proposé
03A cartographie états/handlers ; 03B listes/pipeline ; 03C fiche Prospect et besoins ; 03D fiche Client ; 03E annuaire et parcours croisés.
## Recette
Qualification incomplète, changement phase valide/invalide, retour fiche, fermeture fenêtre détachée, synchronisation, création devis depuis besoin, conversion sans doublon, 3 thèmes/densités, garde UX-01.
## Arbitrages à vérifier
Noms/codes exacts des statuts relationnels Client, transitions backend, différence libellés statistiques et pipeline (UX-09).

## Dépendance E59 — sens de Finalisation (analyse technique, choix ouvert)
La décision **Conversion historique** est acquise. En revanche, aucun `ProspectStage=finalization` n'existe ; `quotes.finalize` ne représente que **Devis à envoyer**, et `quotes.accept` sur signature réelle Abby mène à Conversion. La piste à faire valider est **accord de principe / signature en attente**, avec indicateur traçable non destructif si réalisable, sans statut backend inventé. Source et vérification détaillées : [Lot 02D](LOT-02D-ACCUEIL-PILOTAGE.md). Ne pas laisser Codex mettre en œuvre cette classification avant l'arbitrage.

## 09/10/2026 — Finalisation validée + Projet avant signature
**Finalisation (validée par AtoumWeb)** : accord de principe obtenu ; dernières formalités, notamment signature Abby, encore à accomplir. Ce **classement commercial visuel** n'est pas synonyme de devis `finalizedAt` (simple prêt à envoyer). Il faut identifier un signal de classement explicite, fiable et historisé **sans créer arbitrairement un nouveau statut Prospect** ; le mapping reste une tâche technique.

**Projet prévisionnel (validé)** : pouvoir créer volontairement depuis les **lignes déjà inscrites au devis courant** même avant signature, **y compris avant l'étape Finalisation**, afin de travailler sur plan, Sites/Pages et ressources ; modifier/synchroniser ou **supprimer/remplacer de façon contrôlée** le pré-projet si le devis change fortement. Ce choix **ne transforme pas** le Prospect en Client et **ne déclenche pas** production/facturation officielle. Sur acceptation officielle, Projet retenu figé et Client créé/rattaché selon services existants. [Spécification 07P](LOT-07-PROJET-PRE-SIGNATURE.md).
