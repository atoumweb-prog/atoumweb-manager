# EC04 — Mutations CRM, Catalogue, paramètres et Bridge

Branche EC04 isolée ; aucune migration SQLite ni modification des règles métier.

**53 frontières IPC supplémentaires** sont encadrées par le même verrou partagé, en complément du sous-lot Devis/CGV :

- CRM : identités, organisations, contacts, méthodes de contact, prospects, qualification, conversions en clients, comptes clients, actions et reconstruction des index de recherche.
- Catalogue : création et publication de versions, changements de statut, visibilité, recommandations et composants d'offres, ainsi que les catégories et rattachements.
- Bridge local : import de snapshot et décision de correspondance de nœuds.
- Réglages : thème, densité et aides de survol ; les retours IPC des handlers autorisent désormais une Promise pour une demande de sauvegarde en cours.

La qualification Prospect reste une opération complète : mise à jour du décideur et enregistrement de la qualification sont couverts par **un même permis**, sans changement de contrôle concurrent déjà présent.

Le test `WorkspaceCrmCatalogMutationCoverage.test.ts` contrôle **statiquement** que les routes explicitement énumérées sont protégées et que les lectures CRM/Catalogue restent distinctes. Il ne démontre ni l'absence totale de chemins d'écriture hors IPC ni l'absence d'effets de bord dans les lectures.

**Toujours non couvert** : nombreuses modifications Projets (sites, ressources commerciales, secrets chiffrés Windows, modèle de tâches), certains flux workflow/demo/Bridge, imports et écritures de fichiers hors verrou ou depuis des tâches autonomes, le contrôle complet des références de fichiers et des chemins externes. Le système de capture EC04 n'est PAS raccordé à l'interface et ne peut PAS prétendre garantir une sauvegarde complète.

Aucune CI complète ni validation Windows sur ce commit à ce stade, et aucune modification du workspace réel.
