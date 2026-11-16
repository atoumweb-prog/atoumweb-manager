# F71b : échéancier des devis, fin du 30 % par défaut (fiche à valider)

Date : 16/11/2026. Suite de F71a. Lot métier (règle A : décision de Carlos), hors refonte d'interface.

## Pourquoi

Le Manager pose 30 % d'acompte par défaut : **122 prestations sur 125** le reçoivent (relevé F71 sur copie jetable de la préproduction, 119 en « 30 / 70 »). Exigence de Carlos depuis le 13/11 : **jamais de 30 % par défaut** ; appliquer les règles d'échéancier ; sinon « Échéancier à définir » et envoi bloqué.

## Décisions de Carlos

Du 13/11/2026 (CADRAGE section 13), toujours valables :

- prestations ponctuelles : 100 % à la commande ;
- facilité de paiement manuelle uniquement, jamais posée automatiquement ;
- abonnements hors acompte ;
- jamais de 30 % par défaut.

Du 16/11/2026 (elles remplacent ce qui les contredit) :

1. **Tous les sites se paient selon le montant**, vitrines comprises : **moins de 1 000 € : 40 / 60** (commande, avant mise en ligne) ; **1 000 € et plus : 30 / 40 / 30** (commande, validation du design, avant mise en ligne). La landing et le mariage sont des offres de site au même titre que la vitrine et la boutique. Cette décision remplace « la règle propre à l'offre l'emporte » (OFF-007) pour les sites.
2. **Familles de création et de développement** : WEB, ECOM, LANDING, MARIAGE, APP (outil métier), DEVWP (développement WordPress). Contenu, photo, SEO, technique, identité, données, newsletter ponctuelle restent des ponctuelles à 100 %, quel que soit le montant.
3. **SEO Premium (899 €) : 100 % à la commande**, comme toutes les ponctuelles (le 50 / 50 du lot 4 n'est pas repris).
4. **Réglage « Acompte proposé (%) »** de « Mon entreprise et devis » : **retiré de l'écran**. La valeur enregistrée reste en base, inutilisée. La facilité de paiement reste possible à la main sur chaque devis.

## Effet sur les offres de site du catalogue

| Offre | Prix | Aujourd'hui | Après F71b |
|---|---|---|---|
| Mariage Essentiel | 399 € | 30 / 70 | 40 / 60 |
| Landing Page | 499 € | 30 / 70 | 40 / 60 |
| Mariage Grand Jour | 649 € | 30 / 70 | 40 / 60 |
| Site vitrine 5 pages | 699 € | 40 / 60 | 40 / 60 |
| Mariage Histoire | 899 € | 30 / 70 | 40 / 60 |
| Vitrine Business | 1 149 € | 40 / 60 | **30 / 40 / 30** |
| Vitrine Visibilité | 1 449 € | 40 / 60 | **30 / 40 / 30** |
| Boutique WooCommerce, Business, Visibilité | 1 490 à 2 390 € | 30 / 40 / 30 | 30 / 40 / 30 |

Le montant pris en compte est celui de la **partie création** du devis : les lignes ponctuelles (offre, options, pages en plus), hors abonnements. Exemple : une vitrine à 699 € avec 400 € d'options passe à 30 / 40 / 30.

## La règle, dans l'ordre

Une seule fonction partagée calcule l'échéancier par défaut d'un devis brouillon à partir de ses lignes :

1. **Abonnements** (mensuels, annuels) : toujours leur échéance propre, hors acompte. Annuel payable d'avance, mensuel chaque mois ; la maintenance d'un site démarre après les 30 jours de test. Ces règles du 11/11 existent déjà. Elles valent désormais aussi quand le devis ne contient qu'un abonnement : aujourd'hui, il retombe sur 30 / 70.
2. **Devis avec une offre de site** (familles WEB, ECOM, LANDING, MARIAGE, ligne de type offre) : la partie création suit la grille du montant (40 / 60 sous 1 000 €, 30 / 40 / 30 à partir de 1 000 €).
3. **Sinon, devis avec une prestation de développement** (familles ci-dessus et APP, DEVWP, y compris les prestations sur devis comme l'espace membre ou le module WordPress) : 30 / 40 / 30 à partir de 1 000 € ; sous 1 000 €, 100 % à la commande. *Lecture de Claude, à confirmer en validant la fiche : un développement de moins de 1 000 € se paie comme une ponctuelle.*
4. **Sinon, prestations ponctuelles du catalogue** : 100 % à la commande.
5. **Sinon** (ligne libre hors catalogue seule, ou cas non couvert) : **« Échéancier à définir »**. L'envoi est bloqué tant qu'un échéancier n'est pas choisi à la main.

## Quand la règle s'applique

- **À la création** de tout devis, par l'assistant ou autrement. Le 30 % codé en dur disparaît de l'assistant, du service des devis et des réglages.
- **Quand les lignes d'un brouillon changent** (ajout, retrait, quantité, prix), tant que l'échéancier vient de la règle. C'est le même principe que les clauses en F71a.
- **Jamais** si l'échéancier a été choisi à la main (facilité de paiement), ni sur un devis figé, envoyé ou accepté.
- **Les devis existants ne sont pas modifiés**, brouillons compris. Ils gardent leur échéancier.

## Ce qui change à l'écran

- **Assistant** : il affiche l'échéancier calculé et sa raison (par exemple « Site de 1 149 € : 30 / 40 / 30 »). « Un autre échéancier » reste possible à la main, sans valeur pré-remplie.
- **Préparation du devis** : « Échéancier à définir » apparaît comme un point bloquant de l'envoi, avec les mêmes contrôles que les autres points.
- **Réglages** : le champ « Acompte proposé (%) » disparaît.
- **Offres & Tarifs** : le champ « Acompte par défaut » d'une version n'est plus utilisé par la règle. Il est vide partout ; il reste affiché seulement s'il est renseigné (F71a).

## Tests et preuves prévus

- **Tests d'abord**, sur la fonction partagée : les 12 offres de site à leur prix (tableau ci-dessus) ; seuil exact 999,99 / 1 000 € ; site avec options qui franchit le seuil ; ponctuelle seule ; SEO Premium ; développement sur devis à 800 € et 1 500 € ; abonnement seul ; création et abonnement ensemble ; ligne libre seule (« à définir ») ; choix manuel jamais écrasé ; devis figé intact.
- **Tests existants qui changent avec la décision** (réécrits, et chaque réécriture listée dans le lot) :
  - le devis mixte DEV-2026-003 (Vitrine Business, 5 pages et maintenance : création 1 644 €) passe de 40 / 60 à 30 / 40 / 30 ;
  - le test « historique » qui attend 30 / 70 sans devis rapide.
- **Relevé F71 repassé** sur une copie jetable : 0 prestation à 30 % par défaut ; chaque prestation avec l'échéancier attendu.
- Suite complète, typecheck, recettes des devis.

## Hors lot

- Particuliers hors établissement (aucun paiement avant J+8, demande expresse de démarrage, rétractation en ligne) : consignés le 13/11, pas encore à coder.
- Le texte exact des échéances mensuelles (« le 5 ou le 15 » du lot 1) : l'actuel « Chaque mois, à partir du début du service » est gardé.
