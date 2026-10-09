# Lot 03 — Prospection, Clients et Annuaire
**Statut : spécification cible, non implémentée par ce document.**
## Prospection
- Modes Annuaire / Pipeline / Historique, fiche rapide puis complète et éventuelle fenêtre de référence détachée.
- **Sept colonnes visuelles** : À qualifier, Besoins, Préparer le devis, Attente du retour, Négociation, Finalisation, Conversion. Ne jamais inventer deux nouvelles valeurs backend : cartographier les états existants avant le drag & drop.
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
