# Compatibilité avant contrainte de brouillon unique — 07/11/2026

Le schéma 1–80 et `CatalogService.createVersion` permettaient plusieurs versions `draft` d'un article. Aucune règle ne permet de déclarer rétroactivement l'une abandonnée. La migration expérimentale TEMP 81 doit donc refuser une base contenant plusieurs brouillons par article, avant toute reconstruction, et identifier ces articles. Aucun nettoyage automatique ni événement/date historique n'est inventé.

Après migration compatible, index unique partiel `(item_id) WHERE status='draft' AND abandoned_at IS NULL`. Créer une nouvelle version quand un brouillon opérationnel existe demande de le reprendre ou de l'abandonner explicitement. Restaurer un abandonné quand un autre est opérationnel échoue sans effet. Le rejeu d'une commande déjà réussie retrouve ses IDs avant cette vérification, même si son résultat a depuis changé d'état.

Migration non ajoutée à la liste appliquée automatiquement au démarrage. Son entrée expérimentale reste reconnue pour rouvrir les seules bases TEMP migrées explicitement. Aucune application à une base utilisateur ou Validation-MSI n'est autorisée par cette livraison.
