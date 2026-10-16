# EC03 — Implémentation locale du cycle contractuel

16 octobre 2026. Branche `codex/ec03-explicit-contract-lifecycle`, issue du plan `472cfc59` et du candidat visuel `f85fd498`. Plan approuvé explicitement par l’utilisateur ; développement et migrations autorisés uniquement sur fixtures. Aucun push, PR, CI hébergée, installation ou fusion autorisé par ce chantier.

## Cycle réalisé

1. **Brouillon** : consultation, aperçu et PDF sans adoption de CGV. Les textes sélectionnés et personnalisés restent conservés.
2. **Comparer** : proposition en lecture seule indiquant versions, textes, activation, ordre et rattachements. Annuler ne modifie rien. Appliquer exige confirmation et jeton calculé sur le devis, ses clauses, lignes et les versions proposées. Un jeton périmé est refusé. Les personnalisations sont préservées ; une absence de changement ne produit pas de journal de synchronisation.
3. **Préparer/finaliser** : garde les contrôles existants, dont la revue canonique 05C ; produit un artefact immuable avec texte, JSON complet et empreintes. Ne remplit pas encore le snapshot définitif transmis. Les versions de types contractuels sont sélectionnées explicitement, sans adoption à la lecture.
4. **Reprendre le brouillon** : exclusivement avant envoi, pour une préparation du nouveau protocole ; annule le repère actif de préparation, conserve l’artefact antérieur et oblige à préparer de nouveau. Aucun ancien devis finalisé n’est dégelé.
5. **Transférer vers Abby** : presse-papiers uniquement, protégé par UX-01 ; ne signifie ni envoi ni acceptation.
6. **Attester l’envoi réel** : confirmation, provenance, version et identifiant d’opération obligatoires. Une transaction unique vérifie l’intégrité et la fraîcheur, copie exactement l’artefact dans les snapshots définitifs, inscrit la transmission, le statut/date, l’étape Prospect et les événements. Les nouvelles CGV publiées n’entrent pas dans cet envoi. Même opération rejouée : aucun doublon ; opération ambiguë ou second envoi distinct : refus.
7. **Accepter** : contrat transmis uniquement, preuve rattachée à cette transmission, contrôle d’empreinte et gardes existantes de révision, conversion et provisionnement. Aucun nouvel assemblage à l’acceptation.
8. **Réviser** : copie les clauses et types du snapshot source, y compris les clauses personnalisées, l’ordre et les choix désactivés lorsqu’ils sont disponibles. La révision commerciale du même dossier garde ses gardes existantes. Une source historique inexploitable est refusée, pas reconstruite depuis les CGV actuelles. Aucune réouverture/avenant après acceptation n’est ajouté.

L’ancien point d’entrée `freezeQuote` ne peut plus geler un brouillon : il conserve uniquement la lecture de compatibilité des états déjà verrouillés. Aucun chemin IPC de consultation ne l’appelle pour écrire.

## Migration 71 — quote_contract_transmission_v1

Disponibilité vérifiée après fetch : 194 références locales/distantes, 116 versions distinctes de fichiers du registre ; aucun identifiant supérieur ou égal à 71. Contrôle complémentaire des modifications SQLite non commitées dans les 15 worktrees : seul ce chantier introduit 71. Aucune base utilisateur inspectée. Cette réservation est locale et devra être reconfirmée avant publication si d’autres travaux surviennent.

Migration additive unique :

- `quote_contract_preparations` : contenu, empreintes et horodatage immuables ;
- `quote_contract_transmissions` : version transmise, provenance, dates et identifiant d’opération unique ; une transmission initiale par devis ;
- `quotes.contract_preparation_id` et `contract_type_references_json` : préparation active et sélection des types ;
- `quote_document_links.transmission_id` : rattachement explicite des nouvelles preuves ; aucun backfill des anciennes ;
- `demo_context.contract_purge` : garde technique de la purge synthétique existante.

Les registres interdisent mises à jour et suppressions ordinaires. L’unique exception de suppression concerne des lignes déjà marquées DEMO, dans la purge explicite existante, après sauvegarde et vérification des références réelles, sous transaction. Un dossier non-DEMO reste protégé même si ce drapeau est positionné. Le générateur DEMO produit des attestations clairement simulées, jamais présentées comme envois ou signatures réels. Cette adaptation conserve les recettes et la purge existantes ; elle n’active aucune opération sur les données réelles.

Migrations 1–70 strictement inchangées. Migration testée en mémoire/TEMP, avec rollback des DDL après erreur injectée, rejeu neutre, intégrité et FK. Aucune migration persistante réelle exécutée.

## Matrice de compatibilité

| Devis existant | Conservation / comportement |
|---|---|
| Brouillon non figé | Aucune écriture à l’ouverture ; adoption volontaire des versions puis préparation nouveau protocole |
| Nouveau brouillon préparé | Lecture de l’artefact exact ; reprise explicite possible avant envoi ; ancienne préparation conservée |
| Ancien brouillon finalisé avec snapshot complet | Aucun dégel ; attestation d’envoi explicite possible sur ce snapshot exact, provenance historique signalée dans le registre |
| Ancien snapshot partiel ou manquant | Aucun remplissage ; les opérations ambiguës de reprise, transmission ou copie contractuelle sont refusées |
| Envoyé/vu avec snapshot historique | Lecture exacte ; aucune transmission fictive ajoutée par migration ; acceptation historique conserve les gardes existantes |
| Accepté historique | Snapshot, dates, preuves et rattachements conservés ; aucune adoption ni reconstruction |
| Historique sans paramètres structurés | Absence préservée, chemin de compatibilité existant sans invention de preuve ; jamais présenté comme nouveau protocole vérifié |
| Nouvelle transmission | Preuves nouvelles rattachées à son identifiant ; snapshot altéré ou référence périmée refusés avant acceptation |

Les tests couvrent ces populations synthétiques ; ce tableau n’est pas un inventaire ou une certification des bases réelles, non consultées.

## Atomicité, concurrence et horloges

Savepoints englobants pour préparation, reprise, adoption explicite, transmission et attestation d’acceptation ; acceptation et révision utilisent leurs transactions existantes. Erreurs injectées après capture, avant/après statut, étape Prospect et journal : annulation complète. Deux connexions SQLite partagent une seule transmission ; rejouer l’identifiant d’opération ne produit aucun double événement.

La recette Electron a révélé une avance de 1 ms de l’horloge Chromium sur main. L’attestation « maintenant » est donc datée dans main, après confirmation ; le rejeu conserve sa date initiale. Une date explicite future reste refusée, sans tolérance ni temporisation artificielle.

Le registre UX-01 reste unique. Comparaison/application et transitions de préparation/envoi refusent les dirty/pending concernés. Les protections locales d’acceptation, les brouillons intersections, les réponses tardives et les confirmations existantes sont conservés. Une autre fenêtre restée sur un ancien état reçoit un refus plutôt qu’une réécriture silencieuse.

## Validation et preuves reproductibles

Tests permanents ajoutés dans `src/main/commercial/QuoteTransmission.test.ts` : 27 scénarios, couvrant aussi les injections paramétrées. Les tests historiques n’ont pas été supprimés : ceux qui inspectent le contrat définitif attestent désormais l’envoi avant de l’inspecter ; les tests de finalisation vérifient toujours la préparation. Les attentes du registre ajoutent 71 tout en vérifiant les anciens identifiants/noms.

Banc réel React + preload + IPC + SQLite :

```powershell
$env:ATOUMWEB_EC03_ONLY='1'
node scripts/check-ux-v2-lot01a-real-ui.cjs
Remove-Item Env:ATOUMWEB_EC03_ONLY
```

Neuf parcours thème × densité : comparaison/annulation, refus du brouillon local, adoption, préparation/reprise, transfert Abby sans envoi, annulation de l’envoi, envoi attesté, véritable génération PDF sans mutation et acceptation. Les sorties `EC03_PATHS` donnent les identifiants et empreintes des versions réellement utilisées. Profil et SQLite TEMP sont nettoyés ; aucun lanceur utilisateur n’est ouvert.

Autres commandes : typecheck, suite Vitest complète à deux workers, banc Builder, Bibliothèque contractuelle avec `--output`, préparation contractuelle et UX-01 (base, `--lot-b`, `--lot-c`, `--abby`, `--review`, `--lot-accept`, séparément). Les modes ayant un arrêt anticipé sont lancés séparément pour ne pas annoncer des scénarios ignorés.

Les résultats de développement (135 tests ciblés, puis 47 après extension ; parcours natif 194 assertions) sont intermédiaires, pas la preuve d’un HEAD final. **La validation complète du commit final est obligatoire après commit**. Ses SHA, durées, compteurs, résultats et liens de journaux seront consignés dans le bilan local `outputs/ec03-final-20261016/RESULTATS.md` ; les logs antérieurs dans `outputs/ec03-plan-20261016` ne doivent pas être substitués à cette validation.

## Réserves et publication

- Abby reste manuel. Une attestation opérateur et un hash de fichier ne constituent pas une vérification automatique distante de signature ni de l’équivalence juridique du PDF Abby. Le texte réellement envoyé et la bonne révision doivent être vérifiés par l’opérateur ; aucune preuve d’une autre révision n’est copiée comme acceptation de la nouvelle.
- Les historiques incomplets ne sont ni réparés ni dégelés automatiquement.
- Une nouvelle réexpédition distincte du même devis n’est pas ajoutée ; le service refuse une seconde opération initiale. Les avenants après acceptation sont hors périmètre.
- Les logos hors SQLite, la sauvegarde complète du workspace et le Wi-Fi restent distincts.
- Cette branche dépend du socle visuel non encore fusionné (Client B et Prospect A). Elle ne constitue pas une PR indépendante à appliquer aveuglément sur main. Aucun fichier de composition graphique Prospect/Client n’a été redessiné ; l’appel d’envoi du panneau Prospect est adapté au protocole commun.
- Avant publication : reconfirmer le registre parallèle, contrôler les dépendances avec la base visuelle, puis autorisation distincte de publication/CI. Aucun merge, installation ou migration de base réelle autorisé par les tests locaux.
