'use strict';
// Lot 4 du référentiel interne : méthode de travail (déroulé d'un dossier, paiements, réalisation, maintenance, RGPD, sorties,
// particuliers, médiation, assurance), fiches réflexes, FAQ et points ouverts.
// Sources : Manuel métier 1.0, référentiel V1.5, accord RGPD retenu, décisions de Carlos du 11/11/2026.
//   node scripts/referentiel/model-lot4.cjs --out <modele-lot4.json>
const fs = require('node:fs');
const arg = k => { const i = process.argv.indexOf(k); return i < 0 ? null : process.argv[i + 1]; };
const B = a => a.map(x => '• ' + x).join('\n');

const blocks = [];
const push = (...b) => blocks.push(...b);

push({t: 'cover', tagline: 'Création de sites web à Dijon', title: 'Référentiel interne V1', subtitle: 'Lot 4 : méthode de travail et FAQ', date: '12 novembre 2026',
  stats: [{n: 8, label: 'situations réflexes'}, {n: '__FAQ__', label: 'questions fréquentes'}, {n: '__OPEN__', label: 'points ouverts connus'}],
  note: 'Comment mener un dossier, du premier contact à la sortie du client : paiements, livraison, maintenance, données personnelles, particuliers, médiation et assurance.'});
push({t: 'toc', title: 'Sommaire'});

// ---------------------------------------------------------------- 1
push({t: 'h1', text: 'Le déroulé d’un dossier'});
push({t: 'lead', text: 'Sept moments, chacun avec ce que fait AtoumWeb et ce qu’on garde comme preuve.'});
push({t: 'table', cols: [{h: 'Moment', w: 14}, {h: 'Action AtoumWeb', w: 50}, {h: 'Pièces et preuves', w: 36}], rows: [
  ['Prospection', 'Source licite, besoin, consentements et oppositions, suivi dans le CRM.', 'Fiche prospect datée, origine du contact.'],
  ['Qualification', 'Périmètre, publics, accès, contenus, responsabilités et délais. Particulier ou professionnel ?', 'Compte rendu, besoins, risques.'],
  ['Devis', 'Choix des offres et des clauses. Coûts de départ et coûts récurrents séparés.', 'Devis versionné, prix, exclusions, dates.'],
  ['Acceptation', 'Signature ou écrit explicite. Rétractation et droits applicables si le client est un particulier.', 'Preuve d’accord, documents remis, acompte.'],
  ['Production', 'Planning, maquette, bon à tirer si besoin, validations, tests.', 'Versions, dates, demandes de corrections.'],
  ['Livraison', 'Réception officielle, formation, garantie corrective de 30 jours.', 'Fiche de livraison et e-mail ou signature.'],
  ['Exploitation', 'Interventions, bilans et échéances prévues au contrat.', 'Journal d’intervention, relances.'],
  ['Sortie', 'Export, retrait des accès, fin du service, conservation et purge.', 'Preuve de sortie ; deux documents en cas de passage à la Lune.'],
]});
push({t: 'h2', text: 'Les acceptations ne sont jamais implicites'});
push({t: 'bullets', items: [
  'Le silence du client ne vaut jamais réception, accord sur un devis, acceptation d’une maquette ni validation d’un bon à tirer.',
  'Le devis est valable 30 jours calendaires. Son créneau de production dépend des conditions de réservation convenues.',
  'La livraison officielle se constate par signature ou par e-mail explicite. Sa date déclenche la garantie corrective.',
  'Toute modification hors périmètre est chiffrée et acceptée par écrit avant d’être réalisée.']});

// ---------------------------------------------------------------- 2
push({t: 'h1', text: 'Paiements et facturation'});
push({t: 'table', cols: [{h: 'Type de prestation', w: 28}, {h: 'Règle de paiement', w: 72}], rows: [
  ['Site vitrine', '40 % à la commande, 60 % avant la mise en ligne.'],
  ['Boutique WooCommerce', '30 % à la commande, 40 % à la validation du design, 30 % avant la mise en ligne.'],
  ['Prestation ponctuelle de 300 € ou moins', '100 % à la commande, sauf exception prévue.'],
  ['Prestation ponctuelle de plus de 300 €', '40 % puis 60 % par défaut, hors échéancier propre à l’offre.'],
  ['SEO à 199, 299 ou 499 €', '100 % à la commande.'],
  ['SEO Premium à 899 €', '449,50 € à la commande, 449,50 € à la remise du rapport.'],
  ['Abonnement mensuel', 'Prélèvement SEPA ou virement permanent. Échéance le 5 ou le 15 du mois, au choix du client, avec prorata pour le premier mois.'],
  ['Abonnement annuel', 'Payable d’avance, au début de chaque période : onze mois payés pour douze. Reconduction selon chaque offre, sans confondre accord exprès et reconduction automatique.'],
  ['Devis qui mêle création et abonnement', 'L’échéancier ne porte que sur la création. Chaque abonnement a sa propre échéance. L’acompte exclut les abonnements.'],
]});
push({t: 'bullets', items: [
  'Chèques acceptés pour les prestations ponctuelles et les abonnements annuels. Aucune majoration ni remise selon le moyen de paiement.',
  'Abby reste l’outil des factures réglementaires. Le Manager trace devis, documents et paiements confirmés, sans facture officielle autonome.']});
push({t: 'h2', text: 'Retards de paiement : deux calendriers distincts'});
push({t: 'table', cols: [{h: 'Étape', w: 18}, {h: 'Prestation ponctuelle', w: 41}, {h: 'Abonnement', w: 41}], rows: [
  ['J+7', 'Relance amiable écrite.', 'Relance écrite.'],
  ['J+15', 'Mise en demeure, huit jours pour payer.', 'Mise en demeure.'],
  ['Suspension', 'Possible à partir du 23e jour, proportionnée, après notification, sur les seules tâches non réalisées.', 'Possible à J+30, sur les seules prestations concernées.'],
  ['Résiliation', 'Selon les droits et stipulations applicables.', 'Éventuellement à J+60, après notification écrite.'],
]});
push({t: 'cards', items: [{title: 'Jamais automatique', text: 'Pas de suppression immédiate de données, de blocage disproportionné, de pénalité ni de suspension de prestations non concernées sans examen de la situation et du contrat. Le domaine et les accès du client ne sont jamais retenus abusivement. Les litiges sont documentés. Pour un client professionnel, des pénalités de retard courent de plein droit, au taux légal prévu au contrat.'}]});
push({t: 'h2', text: 'Évolution des prix et des périodicités'});
push({t: 'bullets', items: [
  'Un prix annuel reste stable pendant la période engagée ; une nouvelle année à un autre prix demande l’accord écrit du client.',
  'Hausse d’un abonnement mensuel : préavis d’au moins 30 jours et possibilité réelle de résilier avant son application.',
  'Mensuel vers annuel : accord écrit, à la prochaine échéance mensuelle. Annuel vers mensuel : à la fin de la période annuelle, sans double facturation.',
  'Aucune pause automatique : seulement après un accord écrit qui fixe les modalités.']});

// ---------------------------------------------------------------- 3
push({t: 'h1', text: 'Réalisation, livraison et garantie'});
push({t: 'bullets', items: [
  'Avant de démarrer : contrôler les contenus, les droits, les accès, les exigences, la date prévisionnelle, les jalons et l’échéancier.',
  'Site vitrine : cinq pages par défaut (Accueil, Services, À propos, Réalisations, Contact). Une autre page standard peut être substituée tout en restant à cinq.',
  'Boutique : paiements et livraisons standards testés ; 10 produits simples en Essentiel, 25 au total en Business et Visibilité.',
  'Un cycle de corrections après la maquette et un cycle avant la livraison, pour les vitrines et les boutiques.',
  'Retour de maquette demandé sous 10 jours ouvrés, à titre indicatif. Relance vers J+7. Pas de validation tacite.',
  'Livraison officielle documentée, avec la formation et la remise des accès, dans des éléments distincts.']});
push({t: 'cards', items: [
  {title: 'Garantie corrective', text: '30 jours à compter de la livraison officielle documentée. Les défauts imputables à AtoumWeb sont corrigés sans facturation. Elle ne se confond pas avec la maintenance payante : la maintenance commence à l’issue de ces 30 jours, qui sont aussi la période de test.'},
  {title: 'Quand le client ne répond plus', text: 'Première demande écrite. Au bout de 60 jours d’inactivité imputable au client, dernière relance avec 15 jours calendaires supplémentaires. Ensuite, bilan du travail et des dépenses justifiées, sans pénalité automatique. Un blocage imputable à AtoumWeb n’entre pas dans ce délai.'}]});
push({t: 'bullets', items: [
  'Documents légaux : intégration et accompagnement standard. Le contenu et les droits spécifiques demandent une validation adaptée.',
  'Domaine : au nom du client, avec des comptes administrateurs du client distincts de ceux d’AtoumWeb.',
  'Références commerciales (nom, logo, captures du client) : seulement avec une autorisation distincte, facultative et révocable pour l’avenir (clause 119). Elle se propose à la livraison, jamais précochée.',
  'Droits sur les créations sur mesure : paramètres de cession précisés au contrat ; composants génériques réutilisables conservés par AtoumWeb.']});

// ---------------------------------------------------------------- 4
push({t: 'h1', text: 'Maintenance, hébergement et packs d’heures'});
push({t: 'table', cols: [{h: 'Périmètre', w: 30}, {h: 'WordPress', w: 35}, {h: 'WooCommerce', w: 35}], rows: [
  ['Tarif mensuel', '49 € par mois', '99 € par mois'],
  ['Tarif annuel', '539 € par an', '1 089 € par an'],
  ['Interventions mineures', '2 de 30 minutes par mois', '4 de 30 minutes par mois'],
  ['Sauvegardes o2switch', 'Hebdomadaires, conservées 30 jours', 'Quotidiennes, conservées 30 jours'],
  ['Mises à jour', 'Hebdomadaires, sécurité prioritaire', 'Hebdomadaires, sécurité prioritaire'],
  ['Crédit non utilisé', 'Non reportable, non cumulable', 'Non reportable, non cumulable'],
]});
push({t: 'bullets', items: [
  'Horaires de référence : du lundi au vendredi, de 9 h à 17 h, hors fermetures annoncées. Première réponse humaine visée dans la journée ouvrée, sans délai garanti. Pas d’astreinte.',
  'L’intégration WordPress et les trois images peuvent compter comme l’une des petites interventions mensuelles, jamais en plus. Le Manager ne calcule pas encore cette règle : à surveiller à la main pour ne pas facturer deux fois.']});
push({t: 'cards', items: [
  {title: 'Maintenance ou hébergement Lune ?', text: 'La Lune dédiée est un hébergement isolé : elle comprend l’hébergement, pas les mises à jour de WordPress ni les interventions de maintenance. La restauration manuelle est sur devis, sauf faute imputable à AtoumWeb. Le domaine reste distinct.'},
  {title: 'Le client arrête la maintenance mais garde le site chez AtoumWeb', text: 'Un premier document confirme la fin de la maintenance. Un second porte le nouvel engagement Lune, à 149 € par an. Aucune période n’est facturée deux fois et le transfert interne est gratuit. Si le client revient à une maintenance avant la fin d’une année Lune payée, la période restante est régularisée au prorata.'}]});
push({t: 'h2', text: 'Packs d’heures et assistance'});
push({t: 'table', cols: [{h: 'Option', w: 30}, {h: 'Prix', w: 20}, {h: 'Modalité', w: 50}], rows: [
  ['Pack 3 heures', '189 €', 'Décompte par tranches de 15 minutes, après accord.'],
  ['Pack 5 heures', '299 €', 'Même règle.'],
  ['Pack 10 heures', '549 €', 'Même règle.'],
  ['Dépannage ponctuel', '69 €', 'Une heure minimum. Contrôler le statut tarifaire et le devis.'],
]});
push({t: 'bullets', items: [
  'Un pack est valable 24 mois, plus 3 mois de prolongation automatique et gratuite, avec rappels à J-60 et J-30 avant la fin. Il couvre le temps de prestation seulement.',
  'Déplacements gratuits dans Dijon Métropole, au-delà sur devis.']});

// ---------------------------------------------------------------- 5
push({t: 'h1', text: 'Référencement, Google, statistiques et newsletters'});
push({t: 'h2', text: 'SEO : aucun résultat garanti'});
push({t: 'table', cols: [{h: 'Prestation', w: 22}, {h: 'Portée', w: 40}, {h: 'Livrable', w: 38}], rows: [
  ['Audit, 199 €', 'Contrôles globaux et jusqu’à 10 URL examinées à la main.', 'Rapport et recommandations, sans correction.'],
  ['Essentiel, 299 €', 'Jusqu’à 5 pages.', 'Rapport synthétique de 3 à 5 pages.'],
  ['Avancé, 499 €', 'Jusqu’à 10 URL et 2 concurrents.', 'Rapport de 6 à 8 pages.'],
  ['Premium, 899 €', 'Jusqu’à 20 URL et une concurrence détaillée.', 'Rapport de 10 à 15 pages et restitution de 30 minutes.'],
]});
push({t: 'bullets', items: [
  'Les URL et les concurrents sont proposés, puis validés par écrit avant l’analyse détaillée.',
  'Un cycle regroupé de clarifications est possible dans les 15 jours calendaires après la remise du rapport. Les erreurs d’AtoumWeb sont corrigées gratuitement.']});
push({t: 'h2', text: 'Google Business Profile et statistiques'});
push({t: 'bullets', items: [
  'GBP Essentiel : 2 publications, 5 réponses aux avis, 2 photos fournies par mois, synthèse trimestrielle. Premium : 4 publications, 10 réponses, 4 photos et un rapport mensuel.',
  'Un avis négatif ou sensible ne reçoit de réponse qu’après la validation écrite du client.',
  'Publications impossibles faute d’éléments malgré une relance : pas de report automatique. Retard d’AtoumWeb : reprogrammation sans supplément.',
  'Statistiques Essentiel : synthèse trimestrielle et 1 à 2 recommandations. Premium : rapport mensuel et jusqu’à 3 recommandations au bilan trimestriel.',
  'Les comptes Google (fiche, Analytics, Search Console) restent sous le contrôle du client. Le service commence à la prise en charge effective, avec des accès fonctionnels.',
  'Données indisponibles : bilan partiel avec l’anomalie signalée. Erreur d’AtoumWeb corrigée sans frais ; incident dû au client ou à un tiers : devis.']});
push({t: 'h2', text: 'Newsletters : les jalons de validation'});
push({t: 'table', cols: [{h: 'Étape', w: 32}, {h: 'Délai ou décision', w: 68}], rows: [
  ['Contenus fournis', 'Normalement au moins 10 jours ouvrés avant l’envoi.'],
  ['Bon à tirer AtoumWeb', 'Environ 3 jours ouvrés avant l’envoi.'],
  ['Validation écrite du client', 'Au plus tard 2 jours ouvrés avant l’envoi.'],
  ['Silence du client', 'Ne pas envoyer. Report ou non-report selon la clause et la responsabilité.'],
  ['Après l’envoi', 'Bilan simplifié de 10 à 15 minutes, selon les données disponibles.'],
]});
push({t: 'cards', items: [{title: 'Contacts et outils', text: 'Le client garantit l’origine licite de ses contacts. AtoumWeb contrôle les éléments essentiels et bloque l’envoi en cas de risque sérieux. Brevo, les frais de plateforme et les crédits d’envoi sont au nom du client, sauf devis contraire.'}]});

// ---------------------------------------------------------------- 6
push({t: 'h1', text: 'Données personnelles et accès'});
push({t: 'h2', text: 'Les réflexes'});
push({t: 'bullets', items: [
  'Identifier le responsable du traitement et le rôle réel d’AtoumWeb pour chaque site et chaque opération.',
  'Signer l’accord de protection des données avant toute opération de sous-traitance qui l’exige. Les blocages doivent être ciblés, pas généraux.',
  'Comptes tiers au nom et sous le contrôle du client. Accès AtoumWeb individualisés et révocables.',
  'Ne pas collecter de données sensibles dans les RSVP de mariage ni dans les formulaires non prévus.',
  'Fichiers temporaires de création : référence de 90 jours, sauf règle plus précise. Copies de travail des newsletters : supprimées sous 30 jours à la fin du service.',
  'Ne jamais promettre une sauvegarde indépendante d’AtoumWeb : seuls les outils o2switch existent à ce jour.']});
push({t: 'h2', text: 'L’accord de protection des données en bref'});
push({t: 'lead', text: 'Un accord distinct du devis, propre à chaque site, qui ne crée ni abonnement ni prestation payante.'});
push({t: 'cards', items: [
  {title: 'Quand et comment', text: 'Il couvre la maintenance, l’hébergement et les interventions techniques qui touchent des données personnelles. Le modèle est joint au PDF du devis, en annexe « pour information », et la case « remis au client » est cochée avant l’envoi. L’accord se signe avant la première opération concernée. Sans signature, les opérations qui le nécessitent ne commencent pas. Deux fiches s’y ajoutent : la fiche A (site, opérations, personnes et données concernées, instruction de sortie) et la fiche B (accès, sauvegardes, prestataires, transferts).'},
  {title: 'Ce qu’AtoumWeb s’engage à faire et à ne pas faire', text: B(['Agir seulement selon les instructions écrites du client.', 'Ne jamais utiliser les données des visiteurs ou clients pour sa prospection, pour d’autres clients ni pour entraîner des outils d’intelligence artificielle.', 'Ne pas transmettre ces données à un assistant d’IA externe sans instructions écrites et garanties adaptées.', 'Signaler une instruction qui paraît contraire à la réglementation et ne pas la suivre si elle est illicite.', 'Ne décider seul d’aucun transfert hors de l’Espace économique européen.'])},
  {title: 'Sauvegardes et prestataires', text: 'Hébergement et sauvegardes chez o2switch Cloud, sans système indépendant d’AtoumWeb. Formules de maintenance : sauvegardes au moins hebdomadaires (WordPress) ou quotidiennes (WooCommerce), conservées au moins 30 jours. Un changement de sous-traitant est annoncé avant, avec possibilité d’objection.'},
  {title: 'Incidents et fin du contrat', text: 'Une violation de données susceptible de concerner le site est signalée au client dans les meilleurs délais, avec les faits connus puis les compléments. Ce n’est pas une permanence 24 h sur 24. Le client décide des notifications légales qui lui incombent. À la fin de l’hébergement, avis environ 30 jours avant l’échéance, puis restitution ou suppression selon l’instruction de la fiche A. Les sauvegardes techniques d’o2switch s’effacent selon leur cycle, actuellement annoncé à 45 jours.'}]});
push({t: 'h2', text: 'Gestion des incidents'});
push({t: 'table', cols: [{h: 'Priorité', w: 18}, {h: 'Exemples', w: 44}, {h: 'Consigne', w: 38}], rows: [
  ['P1, critique', 'Indisponibilité majeure, paiement bloqué, compromission.', 'Prioriser, tracer, prévenir, mesures conservatoires proportionnées.'],
  ['P2, importante', 'Fonction essentielle partiellement dégradée.', 'Diagnostic et réponse selon le contrat.'],
  ['P3, courante', 'Ajustement, formation, demande non urgente.', 'Planification, et accord si c’est hors contrat.'],
]});
push({t: 'p', text: 'Pas de promesse de résolution immédiate. En cas de violation de données dans le périmètre d’AtoumWeb : alerter le client sans délai injustifié, documenter, sécuriser et l’assister.'});
push({t: 'h2', text: 'Sortie de prestation et suppression'});
push({t: 'bullets', items: [
  'Remettre les éléments de sortie déjà inclus au contrat. Migration vers l’extérieur, rapport supplémentaire ou assistance complexe : devis distinct.',
  'Retirer l’accès d’AtoumWeb sans supprimer les comptes ni les contenus du client.',
  'Organiser la restitution ou l’export et la conservation technique de sortie (pour l’hébergement : période convenue, jusqu’à 30 jours).',
  'Tracer les sauvegardes résiduelles et leur purge. Ne pas promettre une suppression instantanée qu’on ne peut pas vérifier.',
  'Newsletters : ne jamais supprimer les contacts ni les campagnes du compte du client.']});

// ---------------------------------------------------------------- 7
push({t: 'h1', text: 'Clients particuliers, médiation et assurance'});
push({t: 'cards', items: [
  {title: 'Avant tout devis : particulier ou professionnel ?', text: 'Qualifier le type de client et le mode de conclusion. Pour un particulier, les clauses consommateur s’ajoutent au socle : information précontractuelle, rétractation, début anticipé, médiation.'},
  {title: 'Rétractation', text: 'Délai de 14 jours pour un contrat conclu à distance ou hors établissement, sauf exceptions légales. Un devis accepté par e-mail relève de ces règles. Pour démarrer les travaux dans ce délai, recueillir la demande expresse du client et archiver les confirmations prévues par la loi avant de commencer. Vérifier l’information, le formulaire et la demande expresse de début anticipé.'},
  {title: 'Médiation : une condition avant de vendre à un particulier', text: 'Le médiateur choisi est le CM2C. La convention d’adhésion n’est pas encore conclue : elle doit l’être avant tout devis destiné à un particulier. Tant qu’elle ne l’est pas, ne pas émettre de devis à un consommateur. Les clients professionnels ne sont pas concernés.'},
  {title: 'Reconductions pour un particulier', text: 'Informer individuellement le client dans le délai légal applicable. Archiver la preuve d’envoi, la date limite de refus et, s’il existe, le mécanisme de résiliation en ligne.'},
  {title: 'Assurance : ne jamais écrire qu’AtoumWeb est assuré', text: 'Aucune assurance de responsabilité civile professionnelle n’est souscrite à ce jour. La cible est une souscription avant le début de la première prestation. Tant qu’elle n’est pas faite, aucun devis, aucune clause ni aucun message ne doit affirmer une couverture.'},
  {title: 'Réclamations', text: 'Enregistrer la réclamation dans le Manager et conserver les preuves. Première réponse visée sous 2 jours ouvrés, sans garantie de délai : ce n’est ni un délai de résolution ni une astreinte. Le recours à la médiation suppose une réclamation écrite préalable non résolue.'}]});

// ---------------------------------------------------------------- 8
push({t: 'h1', text: 'Huit situations réflexes'});
push({t: 'cards', items: [
  {title: 'Le client signe un devis', text: '1. Vérifier l’offre et son statut.\n2. Joindre les clauses et les annexes applicables.\n3. Vérifier le public et la rétractation.\n4. Recevoir la signature ou un écrit explicite.\n5. Archiver la version, la date, l’échéancier et le paiement.'},
  {title: 'Le client cesse sa maintenance mais garde le site chez AtoumWeb', text: '1. Confirmer la fin de la période payée.\n2. Documenter la fin de la maintenance.\n3. Proposer le contrat Lune à 149 € par an, dans un document distinct.\n4. Vérifier le domaine et l’accord annuel.\n5. Programmer le transfert interne gratuit.'},
  {title: 'Le client demande une tâche de plus', text: '1. Vérifier si elle est déjà incluse.\n2. Identifier une éventuelle correction imputable à AtoumWeb.\n3. Sinon, proposer un devis ou un pack d’heures.\n4. Recueillir l’accord écrit.\n5. Tracer le temps et le livrable.'},
  {title: 'Le site WooCommerce ne prend plus de paiements', text: '1. Qualifier en P1.\n2. Alerter dans les horaires.\n3. Conserver les preuves et les sauvegardes utiles.\n4. Prendre les mesures urgentes autorisées.\n5. Identifier la cause.\n6. Rapport écrit et suite proposée.'},
  {title: 'Une newsletter n’est pas validée à temps', text: '1. Vérifier les contenus à J-10 et le bon à tirer à J-3.\n2. Relance raisonnable.\n3. Sans bon à tirer écrit, aucun envoi.\n4. Appliquer le report ou le non-report selon la responsabilité et le contrat.\n5. Tracer.'},
  {title: 'Le client ne paie pas', text: '1. Qualifier : ponctuel ou abonnement.\n2. Relance à J+7, mise en demeure à J+15.\n3. Analyser la contestation et la proportion.\n4. Suspension possible à J+23 (ponctuel) ou J+30 (abonnement).\n5. Ne pas effacer les données.'},
  {title: 'Une fiche Google est suspendue', text: '1. Vérifier l’origine et le statut.\n2. Le premier accompagnement au recours est inclus.\n3. Si l’erreur vient d’AtoumWeb, corriger gratuitement.\n4. Si c’est durablement impossible, ajuster la prestation prévue au contrat.\n5. Travaux spéciaux sur devis.'},
  {title: 'Un client exerce ses droits RGPD', text: '1. Enregistrer la demande et sa date.\n2. Confirmer le responsable du traitement.\n3. Aider selon le mandat.\n4. Ne pas supprimer sans vérification.\n5. Documenter l’issue et la sécurité.'}]});

// ---------------------------------------------------------------- 9
push({t: 'h1', text: 'Documents à préparer et preuves à conserver'});
push({t: 'table', cols: [{h: 'Situation', w: 28}, {h: 'Documents et traces à prévoir', w: 72}], rows: [
  ['Nouveau site vitrine ou boutique', 'Devis et échéancier, annexes pertinentes, droits sur les contenus, calendrier, validations de maquette, fiche de livraison, preuve de réception.'],
  ['Boutique WooCommerce', 'En plus : tests de paiement et de livraison, formation, paramètres commerciaux déclarés par le commerçant, périmètre des produits.'],
  ['Maintenance WordPress ou WooCommerce', 'Contrat et prix, hébergement compatible, date de départ, quotas, sauvegardes o2switch, compte rendu des interventions.'],
  ['Passage de la maintenance à la Lune', 'Confirmation distincte de fin de maintenance, puis contrat Lune à 149 € par an. Domaine traité séparément.'],
  ['Google Business Profile et statistiques', 'Accès délégués, date de prise en charge, calendrier, bilans, accord de publication si nécessaire.'],
  ['Newsletter', 'Conditions sur les contacts et la plateforme, planning, contenus, bon à tirer écrit, preuve d’envoi, bilan, clôture éventuelle.'],
  ['Client particulier', 'Information précontractuelle adaptée, parcours de rétractation, notifications de reconduction éventuelles, coordonnées du médiateur effectivement conventionné.'],
  ['Données personnelles sous-traitées', 'Accord applicable et signé, liste des prestataires, accès nominatifs, restitution ou suppression, preuves.'],
]});
push({t: 'h2', text: 'Preuves à garder dans le dossier du client'});
push({t: 'bullets', items: [
  'La version figée du devis, des annexes et des clauses acceptées.',
  'La date de signature ou de l’accord écrit explicite, et les éventuelles demandes de démarrage anticipé.',
  'Les validations de maquette, de bon à tirer et de livraison, sans jamais présumer l’accord du silence.',
  'Les comptes rendus d’incidents et d’interventions, et les décisions d’imputabilité.',
  'Les relances d’impayés et de reconduction, avec date, destinataire, texte et résultat.',
  'La remise des accès ou de l’export, et les opérations de retrait ou de purge à la clôture.']});

// ---------------------------------------------------------------- 10 FAQ
push({t: 'h1', text: 'Questions fréquentes'});
push({t: 'lead', text: 'Les réponses courtes aux questions qui reviennent. La dernière colonne dit où trouver le détail.'});
let faqCount = 0;
const faq = (title, rows) => { faqCount += rows.length; push({t: 'h2', text: title}); push({t: 'table', cols: [{h: 'Question', w: 28}, {h: 'Réponse', w: 50}, {h: 'Voir', w: 22}], rows}); };
faq('Devis et paiement', [
  ['Quel acompte pour un site vitrine ?', '40 % à la commande, 60 % avant la mise en ligne.', 'Paiements'],
  ['Et pour une boutique ?', '30 % à la commande, 40 % à la validation du design, 30 % avant la mise en ligne.', 'Paiements'],
  ['Le devis mêle un site et une maintenance. L’acompte porte sur quoi ?', 'Sur la création seulement. Chaque abonnement a sa propre échéance et n’entre pas dans l’acompte.', 'Paiements'],
  ['Le client veut payer en plusieurs fois une petite prestation.', 'Une prestation de 300 € ou moins se paie en totalité à la commande, sauf exception prévue.', 'Paiements'],
  ['Combien de temps un devis est-il valable ?', '30 jours calendaires. Un devis expiré ne réserve ni prix ni créneau.', 'BASE-ACCEPTATION'],
  ['Le client demande de reporter un paiement ou de mettre le contrat en pause.', 'Aucune pause automatique. Seulement un accord écrit qui fixe dates, éléments suspendus, prix et reprise.', 'Paiements'],
  ['Le prix peut-il augmenter ?', 'Un prix annuel reste fixe pendant la période. Une hausse mensuelle est annoncée 30 jours avant, avec possibilité de résilier. Une nouvelle année à un autre prix demande l’accord écrit.', 'Paiements'],
]);
faq('Livraison, garantie et maintenance', [
  ['Quand commence la garantie de 30 jours ?', 'À la livraison officielle, constatée par signature ou par e-mail explicite. Jamais avant.', 'Réalisation'],
  ['Quand commence la maintenance ?', 'À l’issue des 30 jours de garantie et de test. La garantie et la maintenance ne se confondent pas.', 'MAINT-PERIMETRE'],
  ['Le client réclame une page de plus. Est-elle incluse ?', 'Relire les inclusions de la formule. Business comprend 3 pages rédigées : cinq pages de rédaction en plus font 8 pages au total. Hors périmètre : devis.', 'Fiches de vente'],
  ['Peut-on facturer l’intégration WordPress en plus de la maintenance ?', 'Non en plus : elle compte comme l’une des petites interventions mensuelles. Le Manager ne le calcule pas encore, à surveiller à la main.', 'Maintenance'],
  ['Le client n’utilise pas ses interventions du mois.', 'Elles ne se reportent pas et ne se cumulent pas.', 'MAINT-INTERVENTIONS'],
  ['Promet-on un délai d’intervention en cas de panne ?', 'Non. Priorité en semaine de 9 h à 17 h, sans délai garanti et sans astreinte.', 'MAINT-URGENCE'],
  ['Quelle sauvegarde annoncer ?', 'Seulement celle d’o2switch : hebdomadaire (WordPress) ou quotidienne (WooCommerce), conservée au moins 30 jours. Jamais une sauvegarde indépendante d’AtoumWeb.', 'MAINT-SAUVEGARDE'],
  ['Le client veut un rush ou une livraison accélérée.', 'Il n’existe plus d’option « délai accéléré » : un rush se chiffre sur devis, sans date garantie avant confirmation écrite.', 'Décision du 11/11'],
]);
faq('Renouvellement, hébergement et domaine', [
  ['La maintenance annuelle se renouvelle-t-elle toute seule ?', 'Non. Il faut l’accord exprès du client, sans reconduction tacite. On propose le renouvellement 30 jours avant l’échéance.', 'MAINT-RENOUVELLEMENT'],
  ['Quels services peuvent se reconduire automatiquement ?', 'Le suivi statistique, les newsletters annuelles, l’hébergement isolé et les sites de mariage, avec information du client et possibilité de s’y opposer avant l’échéance.', 'Règles clés'],
  ['Le client arrête la maintenance mais veut garder son site.', 'Deux documents : fin de maintenance, puis engagement Lune à 149 € par an. Aucune période n’est facturée deux fois.', 'Maintenance'],
  ['Qui est titulaire du nom de domaine ?', 'Le client. Gestion à 29 € par an plus les frais du bureau d’enregistrement, renouvellement seulement sur accord exprès. Pour un site de mariage, le domaine standard est déjà compris.', 'WEB-HEBERGEMENT'],
  ['Combien coûte l’hébergement après la première année ?', 'La première année est comprise dans la création. Ensuite : la maintenance (qui comprend l’hébergement) ou la Lune dédiée à 149 € par an.', 'Règles clés'],
]);
faq('Packs, contenus et prestations', [
  ['Combien de temps un pack d’heures est-il valable ?', '24 mois, plus 3 mois de prolongation automatique et gratuite. Rappels à J-60 et J-30. Ensuite le solde expire, sans remboursement.', 'SERVICE-PACK-HEURES'],
  ['Le client veut garantir son classement Google.', 'Impossible. Aucune promesse de classement, de trafic ni de ventes : obligation de moyens seulement.', 'SEO-MOYENS'],
  ['Une newsletter n’est pas validée à temps.', 'Sans bon à tirer écrit, aucun envoi. Pas de report automatique si le retard vient du client.', 'WEB-NEWSLETTER-ENVOI'],
  ['Peut-on réutiliser le logo d’un client dans notre portfolio ?', 'Seulement avec son autorisation distincte, facultative et révocable (clause 119), proposée à la livraison.', 'BASE-REFERENCES-AGENCE'],
  ['Les photos d’une séance : quels fichiers livre-t-on ?', 'Les photos sélectionnées et finalisées en JPEG haute résolution et en version web. Ni fichiers bruts ni rejets.', 'PHOTO-LIVRABLES'],
  ['À quel délai peut-on reporter une séance photo sans frais ?', 'Un premier report est gratuit s’il est demandé au moins 48 h avant, sous réserve de disponibilité.', 'PHOTO-REPORT'],
  ['Un RSVP de mariage peut-il demander les allergies ?', 'Non par défaut : aucune donnée sensible. Les invités les communiquent directement au traiteur.', 'MARIAGE-RSVP'],
]);
faq('Clients, données et assurance', [
  ['Peut-on faire un devis à un particulier ?', 'Pas tant que la convention d’adhésion au médiateur (CM2C) n’est pas conclue. Pour un professionnel, oui.', 'Particuliers'],
  ['AtoumWeb est-elle assurée ?', 'Non, pas à ce jour. Ne jamais l’écrire ni le laisser entendre.', 'Assurance'],
  ['En combien de temps répond-on à une réclamation ?', 'Première réponse visée sous 2 jours ouvrés, sans garantie de délai. Ce n’est ni un délai de résolution ni une astreinte.', 'Réclamations'],
  ['Le client ne répond plus depuis des semaines.', 'Après 60 jours de blocage imputable au client, dernière relance avec 15 jours de plus, puis bilan écrit. Aucune pénalité automatique.', 'BASE-BLOCAGE-PROJET'],
  ['Quand signer l’accord de protection des données ?', 'Avant la première opération sur des données personnelles. Le modèle est joint au PDF du devis. Sans signature, ces opérations ne commencent pas.', 'Données'],
  ['Le client demande la suppression de ses données à la fin.', 'Suivre l’instruction de la fiche A : restitution ou suppression, avec avis environ 30 jours avant. Les sauvegardes d’o2switch s’effacent selon leur cycle.', 'Données'],
  ['Qui émet les factures ?', 'Abby. Le Manager ne produit pas de facture officielle autonome.', 'Paiements'],
]);

// ---------------------------------------------------------------- 11
push({t: 'h1', text: 'Points ouverts connus'});
push({t: 'lead', text: 'Ce qui n’est pas encore fait ou pas encore vérifié, d’après les notes du 11/11/2026.'});
const openRows = [
  ['Convention CM2C', 'Non conclue. À faire avant tout devis à un particulier.'],
  ['Assurance de responsabilité civile professionnelle', 'Non souscrite. Cible : avant la première prestation. Ne jamais l’affirmer d’ici là.'],
  ['Relecture juridique', 'Aucun juriste n’a relu les clauses ni les accords. Les textes des deux clauses ajoutées le 11/11 (définitions, envoi des newsletters) sont de rédaction interne.'],
  ['Clause 119 (références commerciales)', 'Validée mais hors socle. Pour un site vitrine, la tâche « Formation & livraison » du projet propose maintenant l’autorisation (demandée, accordée ou refusée, éléments autorisés, preuve), avec un conseil de rappel. Les autres types de projet n’ont pas encore de modèle de projet dans le Manager : la demande s’y fait à la main, à la livraison.'],
  ['Accord de protection des données au devis', 'En place dans le Manager reconstruit le 12/11 : pour les devis qui touchent des données, ligne fixe dans l’annexe, modèle joint en fin de PDF, bouton « Éditer le modèle d’accord RGPD » et case « remis au client » à cocher avant « C’est envoyé ». L’accord réel reste préparé et signé pour chaque site.'],
  ['Règle intégration WordPress et trois images', 'Un avertissement dans les points d’attention du devis est en place dans le Manager reconstruit le 12/11. Il n’y a pas de remise automatique : c’est à toi de ne pas facturer en plus si le quota du mois est disponible.'],
  ['Temps de référence', 'Repères internes, à ajuster avec le chronomètre du Manager au fil des ventes. Les prix retenus sur délégation (47) n’ont pas été validés un par un.'],
];
const openCount = openRows.length;
push({t: 'table', cols: [{h: 'Sujet', w: 30}, {h: 'Où on en est', w: 70}], rows: openRows});

blocks[0].stats[1].n = faqCount;
blocks[0].stats[2].n = openCount;
const model = {header: 'AtoumWeb  ·  Référentiel interne V1  ·  Méthode et FAQ', footer: 'Document interne : ne pas diffuser', blocks};
fs.writeFileSync(arg('--out'), JSON.stringify(model, null, 1));
console.log(JSON.stringify({blocs: blocks.length}));
