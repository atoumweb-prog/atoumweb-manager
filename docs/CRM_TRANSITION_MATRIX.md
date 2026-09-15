# AtoumWeb Manager — Matrices de transitions métier

> Référence de travail : branche `fix/recette-commerciale-coherence`, issue de `fix/recette-commerciale-prospects` après le commit `0f5a461`.
>
> Ce document distingue le **parcours métier cible** des transitions actuellement techniquement possibles. Les matrices Prospect/Devis guident la recette commerciale en cours. Projet, Intervention et Maintenance restent documentés mais leur enforcement est reporté à la passe dédiée.

## Légende

- ✅ : transition métier normale.
- ↩ : retour/correction explicitement admis.
- ⚙ : transition produite par une action métier dédiée, pas par un simple changement manuel de statut.
- ⛔ : transition directe à interdire.
- 🔒 : état terminal ou protégé.

# 1. Prospect

États : `new`, `qualifying`, `need_identified`, `quote_to_prepare`, `quote_to_send`, `quote_sent`, `follow_up`, `negotiation`, `waiting`, `won`, `lost`.

| État actuel | Action métier | État suivant | Règle / précondition |
|---|---|---|---|
| Nouveau contact | Commencer la prospection / qualification | À qualifier | ✅ action utilisateur explicite |
| Nouveau contact | Programmer un rappel | Nouveau contact | ✅ crée une action, ne change pas le pipeline |
| Nouveau contact | Aller directement à Besoin identifié / Devis / Relance | — | ⛔ parcours incomplet |
| À qualifier | Enregistrer une qualification incomplète | À qualifier | ✅ les données sont conservées |
| À qualifier | Enregistrer une qualification complète | Besoin identifié | ⚙ résumé + décideur + budget + calendrier + au moins un besoin |
| À qualifier | Revenir à Nouveau contact | Nouveau contact | ↩ correction admise |
| Besoin identifié | Modifier la qualification | Besoin identifié | ✅ |
| Besoin identifié | Reprendre la qualification | À qualifier | ↩ correction admise |
| Besoin identifié | Créer le devis depuis les besoins | Devis en préparation | ⚙ le devis est créé avec ses lignes |
| Devis en préparation | Modifier lignes / conditions | Devis en préparation | ✅ |
| Devis en préparation | Mettre en pause pour information manquante | Devis en préparation | ✅ crée une action, ne change pas artificiellement l’étape |
| Devis en préparation | Déclarer « Devis prêt à envoyer » | Devis à envoyer | ⚙ finalisation explicite |
| Devis à envoyer | Enregistrer l’envoi | Devis envoyé | ⚙ canal + destinataire + date + note conservés |
| Devis à envoyer | Envoyer sans finalisation | — | ⛔ |
| Devis envoyé | Programmer une relance | À relancer | ✅ relance liée au devis |
| Devis envoyé | Passer en négociation | Négociation | ✅ |
| Devis envoyé | Mettre en attente | En attente | ✅ motif conservé |
| Devis envoyé | Accepter | Gagné | ⚙ acceptation du devis + conversion Client idempotente |
| Devis envoyé | Refuser | Perdu | ✅ raison obligatoire |
| À relancer | Clôturer la relance sans autre changement | À relancer | ✅ historique conservé |
| À relancer | Retour au suivi du devis | Devis envoyé | ↩ selon décision utilisateur |
| À relancer | Négociation | Négociation | ✅ |
| À relancer | Attente | En attente | ✅ |
| Négociation | Demande de nouvelle proposition | Devis en préparation | ⚙ duplication du devis ; l’ancien reste figé |
| Négociation | Attente / relance | En attente / À relancer | ✅ |
| En attente | Reprendre le suivi | Devis envoyé / À relancer / Négociation | ✅ selon le motif |
| Gagné | Modification ordinaire du pipeline | — | 🔒 passage par Client/Projet |
| Perdu | Réactiver commercialement | Nouveau contact ou À qualifier | ↩ historique de perte conservé dans le journal |

### Transitions à ne jamais produire par simple glisser-déposer

`new → quote_*`, `new → follow_up`, `qualifying → quote_*`, `need_identified → quote_to_send`, `quote_to_prepare → quote_sent`, `quote_to_send → won`, ainsi que tout saut qui remplace une action métier dédiée (création/finalisation/envoi/acceptation/duplication).

# 2. Devis

Le statut technique du devis est distinct de `finalized_at`.

| État / propriété | Action | Résultat | Règle |
|---|---|---|---|
| `draft`, non finalisé | Modifier lignes / conditions | `draft` | ✅ |
| `draft`, non finalisé | Finaliser | `draft` + `finalized_at` | ✅ devient « prêt à envoyer » |
| `draft`, finalisé | Finaliser à nouveau | inchangé | ✅ idempotent ; pas de nouvelle date/événement |
| `draft`, non finalisé | Marquer envoyé | — | ⛔ finalisation obligatoire |
| `draft`, finalisé | Enregistrer l’envoi | `sent` + `sent_at` | ✅ |
| `sent` | Modifier lignes | — | ⛔ créer une nouvelle version par duplication |
| `sent` | Marquer vu | `viewed` | ✅ |
| `sent/viewed` | Accepter | `accepted` | ✅ snapshot verrouillé, conversion Client |
| `accepted` | Accepter à nouveau | `accepted` | ✅ idempotent |
| `sent/viewed` | Refuser | `refused` | ✅ |
| `sent/viewed` | Expirer | `expired` | ✅ |
| `sent/viewed/refused/expired/cancelled` | Dupliquer | nouveau `draft` | ✅ ancien devis inchangé |
| `accepted` | Modifier / dupliquer comme négociation | — | 🔒 contrat accepté figé |

# 3. Client

| État actuel | Action | État suivant | Règle |
|---|---|---|---|
| Actif | Désactiver | Inactif | ✅ |
| Inactif | Réactiver | Actif | ✅ |
| Actif/Inactif | Archiver | Archivé | ✅ archivage logique, documents conservés |
| Archivé | Réactiver | Actif ou Inactif | ↩ même identifiant, mêmes documents |
| Archivé | Suppression automatique | — | ⛔ aucune suppression automatique RGPD |

La **relation Client** (`Excellente / Bonne / Neutre / À surveiller / Difficile`) est indépendante de ce statut.

# 4. Projet — à faire respecter lors de la passe Projet

Parcours recommandé :

`À préparer → En cours ↔ En attente client / Bloqué → À valider → Terminé → Archivé`

| Depuis | Vers | Règle cible |
|---|---|---|
| À préparer | En cours | ✅ |
| En cours | En attente client / Bloqué / À valider | ✅ |
| En attente client / Bloqué | En cours | ✅ |
| À valider | En cours | ↩ corrections |
| À valider | Terminé | ⚙ après contrôles de fin |
| Terminé | Archivé | ✅ |
| Terminé | En cours | ⛔ sauf commande dédiée « Rouvrir » avec traçabilité |
| Archivé | autre état | ⛔ sauf réactivation dédiée décidée explicitement |

# 5. Demande

Parcours recommandé :

`Nouvelle → À qualifier ↔ En attente client → Planifiée → Transformée`

Une demande peut aussi être `Close` sans intervention puis `Archivée`.

- `Transformée` est protégée : elle reste liée à son intervention.
- La transformation en intervention est idempotente.

# 6. Intervention — passe ultérieure

Parcours recommandé :

`À planifier → Planifiée → En cours ↔ En attente client / Bloquée → À valider → Terminée → Archivée`

Annulation possible avant terminaison selon le contexte. La réouverture d’une intervention terminée devra être une action dédiée afin de ne pas perdre silencieusement la première date de complétion.

# 7. Maintenance — passe ultérieure

Souscription :

`Active ↔ Suspendue → Terminée → Archivée`

Période :

`À venir → À faire / Ouverte → En cours → Terminée → Close`

Une période close ne doit pas revenir en cours par simple changement de statut.

# 8. Pack d’heures

- `Actif ↔ Suspendu` : action utilisateur.
- `Actif → Épuisé` : calculé par le solde.
- `Actif → Expiré` : calculé par la date.
- `Actif → Archivé` : action utilisateur.
- `Épuisé` et `Expiré` ne sont jamais choisis manuellement.
- Le débit d’une même intervention reste idempotent.

# 9. Timer

Le statut est calculé, il n’existe pas comme colonne :

`Arrêté → En cours → En pause → En cours → Arrêté`

Après interruption :

`En cours ancien → À récupérer → Reprendre` ou `Arrêter à la dernière activité connue`.

Invariants : une seule session active globalement et une seule pause ouverte par session.

# Recommandation d’enforcement

1. La couche **service** doit rester l’autorité pour les transitions interdites : masquer un bouton dans React ne suffit pas.
2. Les changements automatiques (`création devis`, `finalisation`, `envoi`, `acceptation`, `duplication`) doivent rester attachés à l’action métier qui les provoque.
3. Le sélecteur/drag-and-drop Prospect ne doit exposer que les corrections manuelles réellement autorisées.
4. Toute réouverture d’un état terminal doit produire un événement explicite et ne jamais effacer silencieusement une date historique.
5. Les tests doivent couvrir chaque transition autorisée importante et au moins un exemple de chaque saut interdit.
