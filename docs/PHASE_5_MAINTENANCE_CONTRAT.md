# Phase 5 — Maintenance AtoumWeb, contrat maître et règles métier

## 1. Objectif et règle d’architecture

La future Phase 5 doit intégrer la Maintenance AtoumWeb **sans créer de système parallèle**.

Le développement doit compléter l’architecture déjà construite :

- Client / Organisation / Contact ;
- Projet / site ;
- Catalogue tarifaire versionné ;
- Devis et snapshots ;
- Documents / Contrats / Avenants ;
- Interventions / Maintenance / Packs d’heures ;
- Facturation / éléments à facturer / rapprochement Abby ;
- Sauvegardes métier ;
- licences et services associés.

Le contrat Maintenance est un **modèle maître** avec blocs conditionnels selon la formule et le type de Client. Il ne constitue pas une seconde source de vérité métier : les valeurs viennent des entités existantes et sont snapshotées dans le document généré.

Document source fonctionnel attendu : **« Contrat Maintenance AtoumWeb V1 métier »**. Ce fichier Word devra être conservé comme référence fonctionnelle du moteur documentaire Phase 5 lorsqu’il est disponible dans les fichiers du projet.

## 2. Formules Maintenance

### Gestion WordPress — 49 €/mois

- abonnement mensuel sans engagement ;
- préavis de résiliation : 30 jours ;
- facturation mensuelle en début de période ;
- toute période commencée reste due ;
- hébergement compris ;
- nom de domaine suivi et facturé séparément ;
- hébergeur utilisé actuellement : o2switch ;
- jusqu’à **2 interventions mineures par mois** ;
- **30 minutes maximum par intervention** ;
- délai contractuel de **prise en charge sous 72 h ouvrées maximum** ;
- sauvegarde complète au minimum **1 fois par semaine** ;
- conservation glissante de **4 sauvegardes hebdomadaires**.

### Gestion WooCommerce — 99 €/mois

- abonnement mensuel sans engagement ;
- préavis de résiliation : 30 jours ;
- facturation mensuelle en début de période ;
- toute période commencée reste due ;
- hébergement compris ;
- nom de domaine suivi et facturé séparément ;
- hébergeur utilisé actuellement : o2switch ;
- jusqu’à **4 interventions mineures par mois** ;
- **30 minutes maximum par intervention** ;
- délai contractuel de **prise en charge sous 48 h ouvrées maximum** ;
- sauvegarde complète au minimum **1 fois par jour** ;
- conservation glissante de **7 sauvegardes quotidiennes** ;
- suivi renforcé des composants WooCommerce sensibles.

## 3. Interventions mensuelles

Les interventions non utilisées :

- ne se cumulent pas ;
- ne sont pas reportées automatiquement ;
- ne créent pas de crédit d’heures ;
- ne sont pas remboursées ;
- peuvent exceptionnellement être reportées ou offertes par AtoumWeb ;
- toute exception doit être tracée avec motif.

Les opérations techniques récurrentes prévues par l’abonnement sont **hors quota** :

- mises à jour WordPress ;
- mises à jour Divi 5 ;
- mises à jour des extensions ;
- mises à jour WooCommerce pour la formule concernée ;
- sauvegardes ;
- sécurité ;
- SSL ;
- surveillance technique courante ;
- contrôles après mise à jour.

## 4. Définition d’une intervention mineure

Une intervention mineure est une demande simple et ciblée, réalisable en **30 minutes maximum**, par exemple :

- modification de texte ;
- image ;
- tarif ;
- horaires ;
- document ;
- lien ;
- information ;
- petite correction d’affichage ;
- petite correction de mise en page ;
- ajustement d’un formulaire existant ;
- réglage WordPress simple ;
- réglage WooCommerce simple ;
- incident courant sans développement important.

Ne relève pas d’une intervention mineure :

- nouvelle page ;
- refonte complète ;
- nouvelle fonctionnalité ;
- développement spécifique ;
- gros système ;
- migration ;
- grosse remise en état ;
- piratage important ;
- reconstruction ;
- réparation lourde après intervention d’un tiers ;
- rédaction conséquente ;
- SEO avancé ;
- gros import de données ;
- évolution WooCommerce complexe.

Dans ces cas, le Manager doit permettre d’orienter la demande vers :

- un forfait d’heures ;
- une prestation du Catalogue ;
- un devis complémentaire.

## 5. Suivi des demandes Maintenance

Le suivi doit s’appuyer sur les entités Demande / Intervention / Maintenance existantes et les enrichir si nécessaire.

Données minimales :

- identifiant de la demande ;
- Client ;
- site ou Projet ;
- formule de maintenance ;
- date et heure de réception ;
- canal ;
- description ;
- niveau de priorité ;
- urgence critique oui/non ;
- statut ;
- délai contractuel de prise en charge ;
- date limite calculée ;
- date réelle de prise en charge ;
- date de clôture ;
- durée réelle ;
- intervention décomptée oui/non ;
- motif si non décomptée ;
- dépassement des 30 minutes ;
- forfait d’heures utilisé ;
- montant complémentaire éventuel ;
- attente Client ;
- attente Tiers ;
- commentaires ;
- justificatifs.

Statuts à prévoir dans le flux Maintenance :

- Nouvelle ;
- À qualifier ;
- À traiter ;
- En cours ;
- En attente Client ;
- En attente Tiers ;
- Résolue ;
- Clôturée ;
- Hors forfait ;
- Devis nécessaire.

Le mapping devra respecter les statuts existants de Phase 4 et les enrichir plutôt que créer une deuxième table de demandes concurrente.

## 6. Urgence critique

Peut être qualifiée d’urgence critique :

- site totalement inaccessible ;
- commande WooCommerce impossible ;
- paiement bloqué ;
- formulaire principal hors service ;
- erreur majeure empêchant l’utilisation normale ;
- incident de sécurité important ;
- SSL bloquant l’accès.

Une urgence critique est priorisée, mais le délai contractuel de 72 h / 48 h reste un **délai de prise en charge**, pas une garantie de résolution.

## 7. Sauvegardes Maintenance

Le module doit compléter les sauvegardes métier de Phase 6, pas créer une seconde source.

À suivre :

- fréquence liée à la formule ;
- date de chaque sauvegarde ;
- type automatique ou manuelle ;
- raison éventuelle d’une sauvegarde manuelle ;
- emplacement ;
- statut ;
- date d’expiration prévue ;
- sauvegarde avant opération sensible oui/non ;
- restauration déclenchée oui/non ;
- historique des restaurations.

Règles de conservation :

- formule 49 € : au minimum 1 sauvegarde complète/semaine, conservation glissante de 4 sauvegardes hebdomadaires ;
- formule 99 € : au minimum 1 sauvegarde complète/jour, conservation glissante de 7 sauvegardes quotidiennes ;
- sauvegarde supplémentaire avant mise à jour importante ou intervention sensible ;
- les sauvegardes ne constituent pas un archivage permanent.

## 8. Restaurations

La restauration doit être traçable et liée au Client / Projet / sauvegarde / demande / intervention.

Règles :

- comprise si elle résulte d’une intervention AtoumWeb ;
- comprise pour un incident courant couvert ;
- peut consommer une intervention si le Client ou un tiers a provoqué le problème et que la restauration reste simple ;
- forfait d’heures ou devis si remise en état complexe.

La V1 peut proposer une action « Lancer / préparer une restauration » uniquement si le mécanisme technique associé est explicitement configuré et sûr. À défaut, le Manager trace la demande, la sauvegarde utilisée, l’action effectuée et son résultat.

## 9. Sécurité et suivi technique

Données à suivre :

- dernière vérification ;
- SSL ;
- composants obsolètes ;
- alertes connues ;
- recommandations ;
- niveau de suivi : standard ou WooCommerce renforcé ;
- historique des incidents.

Les contrôles récurrents de sécurité/SSL/surveillance sont hors quota d’interventions.

## 10. Reprise d’un site extérieur

Le Projet/Site doit comporter un champ : **site créé par AtoumWeb : oui/non**.

Si non :

- audit de reprise obligatoire : **149 €** ;
- audit payé même si le site est finalement refusé ;
- la maintenance ne commence qu’après validation de l’état du site.

Audit à conserver :

- diagnostic synthétique ;
- WordPress ;
- thème ;
- extensions ;
- versions ;
- sauvegardes ;
- sécurité ;
- hébergement ;
- SSL ;
- erreurs visibles ;
- développements spécifiques ;
- compatibilité AtoumWeb ;
- corrections nécessaires ;
- site accepté en maintenance oui/non ;
- motif de refus ;
- proposition éventuelle de remise en état ;
- forfait d’heures ;
- migration ;
- refonte.

## 11. Forfaits d’heures

Réutiliser le système de Packs d’heures construit en Phase 4 et l’enrichir si nécessaire.

Règles métier :

- rattachés au Client ;
- utilisables sur plusieurs sites ;
- utilisables sur plusieurs applications ;
- utilisables sur plusieurs outils métier ;
- valables 12 mois ;
- prolongation gratuite possible au cas par cas et tracée ;
- heures achetées ;
- heures offertes ;
- heures consommées ;
- heures restantes ;
- date d’achat ;
- date d’expiration ;
- historique détaillé.

Tarifs Catalogue à vérifier/intégrer :

- forfait 10 h : **690 €** ;
- forfait 20 h : **1 290 €** ;
- forfait 30 h : **1 890 €**.

## 12. Garantie corrective

- durée : **30 jours après livraison d’un site AtoumWeb** ;
- peut se chevaucher avec la maintenance ;
- anomalie de livraison = garantie corrective ;
- ne consomme pas une intervention mensuelle ;
- évolution demandée par le Client = maintenance ou prestation complémentaire.

Le Manager doit permettre de qualifier la nature de la demande et de tracer pourquoi elle est ou non décomptée.

## 13. Facturation Abby

Abby reste la source de la facture réglementaire.

À suivre dans AtoumWeb Manager :

- abonnement mensuel ;
- numéro de facture Abby ;
- date d’émission ;
- échéance ;
- montant ;
- payé ;
- paiement partiel ;
- reste dû ;
- retard ;
- rappels ;
- statut.

## 14. Impayés

Flux à prévoir :

- premier rappel ;
- second rappel ;
- suspension possible des nouvelles interventions ;
- suspension possible de la maintenance active ;
- hébergement non coupé immédiatement ;
- possibilité de suspension de l’hébergement après 30 jours d’impayé avec information préalable ;
- pénalités B2B ;
- indemnité légale de 40 € pour Client professionnel lorsqu’elle s’applique ;
- jamais cette indemnité pour un particulier.

Le type de Client professionnel / particulier doit piloter les blocs contractuels et règles de facturation/rappel correspondants.

## 15. Résiliation

Données à suivre :

- date de demande ;
- date de réception ;
- préavis : 30 jours ;
- date de fin calculée ;
- dernière période facturée ;
- dernière facture ;
- paiement restant ;
- statut du contrat ;
- motif facultatif.

## 16. Sortie de maintenance

Checklist de sortie :

- sauvegarde de sortie ;
- remise des accès ;
- statut du domaine ;
- date de fin d’hébergement ;
- licences AtoumWeb ;
- licences tierces ;
- transfert demandé ;
- migration demandée ;
- date limite de conservation de la sauvegarde.

Conserver si possible une dernière sauvegarde de sortie pendant **30 jours** après la fin du contrat. Après ces 30 jours, AtoumWeb peut supprimer cette sauvegarde.

## 17. Licences AtoumWeb

Données à prévoir :

- extension ;
- Client ;
- site / Projet / application ;
- clé de licence ;
- date d’activation ;
- statut : Active / Expirée / Révoquée / Détachée ;
- date de révocation ;
- historique ;
- droit aux mises à jour ;
- droit au support ;
- services associés.

En cas de départ du Client :

- possibilité de révoquer la licence ;
- extension déjà installée conservée si techniquement possible ;
- fonctionnement existant préservé ;
- plus de mises à jour AtoumWeb ;
- plus de support lié à la licence ;
- possibilité d’arrêt des services réservés à une licence active.

## 18. Catalogue tarifaire Maintenance

À intégrer ou vérifier dans le **Catalogue existant** :

- Maintenance WordPress : **49 €/mois** ;
- Maintenance WooCommerce : **99 €/mois** ;
- Audit / reprise d’un site tiers : **149 €** ;
- forfait 10 h : **690 €** ;
- forfait 20 h : **1 290 €** ;
- forfait 30 h : **1 890 €** ;
- migration : tarif ou devis selon complexité ;
- remise en état : forfait d’heures ou devis.

Le Catalogue doit toujours conserver :

- prix catalogue ;
- prix réellement appliqué ;
- remise en € ;
- remise en % ;
- prestation offerte ;
- motif du geste commercial ;
- date de validité du tarif ;
- actif / inactif ;
- historique des changements.

## 19. Contrat Maintenance maître

Le moteur documentaire Phase 5 doit fournir un **modèle Maintenance maître** avec blocs conditionnels :

- bloc WordPress 49 € ;
- bloc WooCommerce 99 € ;
- bloc Client professionnel ;
- bloc Client particulier ;
- variables automatiques ;
- snapshot des données au moment de la génération ;
- PDF versionné ;
- document signé verrouillé ;
- avenants ;
- changement de formule traçable ;
- historique complet.

Flux recommandé :

`Catalogue versionné → Devis/abonnement → Contrat Maintenance brouillon → blocs conditionnels → snapshot → PDF versionné → signature → document verrouillé → avenants/changement de formule`

Modifier le modèle maître ne doit jamais modifier un contrat déjà généré/finalisé.

## 20. Hébergement et domaine

- hébergement inclus dans les formules 49 € et 99 € ;
- hébergeur actuellement utilisé : **o2switch** ;
- nom de domaine suivi séparément ;
- nom de domaine facturé séparément ;
- fin d’hébergement suivie dans le flux de sortie ;
- transfert/migration possible selon la demande du Client.

## 21. Alerte AtoumWeb.fr — délai 49 €

Anomalie à conserver comme tâche ultérieure :

- le site AtoumWeb.fr affiche encore actuellement **48 h** de prise en charge pour la maintenance à 49 € ;
- la règle validée est désormais :
  - **49 € → 72 h ouvrées maximum** ;
  - **99 € → 48 h ouvrées maximum**.

Le site devra être corrigé ultérieurement. Cette correction ne doit pas être mélangée au développement Phase 5 du Manager.

## 22. Compatibilité avec les Phases existantes

- Phase 1 : Client/Organisation/Contact restent la source d’identité ;
- Phase 2 : Catalogue/Devis restent la source commerciale et tarifaire ;
- Phase 3 : Projet/Site porte le contexte technique et l’origine AtoumWeb/tiers ;
- Phase 4 : Demandes/Interventions/Maintenance/Packs d’heures restent la source opérationnelle ;
- Phase 5 : Documents/Contrats/Facturation/Abby/Résiliation/Licences complètent ces sources ;
- Phase 6 : sauvegardes métier et alertes doivent être réutilisées pour les exigences de fréquence, conservation, pré-intervention, sortie et restauration.

Aucun module Phase 5 ne doit dupliquer les tables opérationnelles Phase 4 ou les sauvegardes métier Phase 6.

## 23. Critères d’acceptation

La tranche Maintenance Phase 5 est considérée valide si :

- les formules 49 € et 99 € viennent du Catalogue versionné ;
- 72 h / 48 h sont stockés comme règles de formule et snapshotés ;
- le quota 2 / 4 est suivi sans cumul automatique ;
- les opérations récurrentes sont clairement hors quota ;
- une demande peut être qualifiée mineure / hors forfait / garantie corrective / prestation complémentaire ;
- le dépassement de 30 minutes peut être tracé ;
- un forfait d’heures ou un devis complémentaire peut prendre le relais ;
- la fréquence/rétention de sauvegarde est pilotée par la formule ;
- une restauration est liée à la sauvegarde utilisée et à sa cause ;
- un site tiers ne peut entrer en maintenance sans audit de reprise validé ;
- le forfait d’heures reste transversal au Client et pas limité à un seul site ;
- la garantie corrective de 30 jours ne consomme pas le quota maintenance ;
- le suivi Abby distingue émis, payé, partiel, reste dû, retard et rappels ;
- les règles d’impayé varient selon Client professionnel / particulier ;
- la résiliation calcule le préavis et la dernière période ;
- la sortie de maintenance suit sauvegarde, accès, domaine, hébergement et licences ;
- une licence révoquée peut laisser l’extension en place mais coupe mises à jour/support selon règles ;
- le contrat maître sélectionne les bons blocs et verrouille le snapshot signé ;
- aucune évolution du Catalogue ou du modèle de contrat ne réécrit l’historique ;
- aucun système parallèle Client/Projet/Devis/Documents/Facturation/Catalogue n’est créé.
