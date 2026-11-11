'use strict';
// « Étapes à faire » de chaque offre. Deux provenances, toujours indiquées dans le document :
//   M  = procédure décrite dans le Manuel métier 1.0 et le référentiel V1.5 ;
//   MP = base issue du Manuel, complétée d'étapes de réalisation proposées ;
//   P  = aucune procédure dans le référentiel : étapes proposées, à valider par Carlos.
const SRC = {
  M: 'Source : Manuel métier 1.0 et référentiel V1.5.',
  MP: 'Base : Manuel métier 1.0 et référentiel V1.5. Les étapes de réalisation sont proposées, à valider.',
  P: 'Proposé, à valider : le référentiel ne décrit pas de procédure pour cette prestation.',
};

// ---------- ensembles d'étapes
const VITRINE = [
  'Qualifier le besoin : activité, objectif du site, pages utiles, textes et photos déjà disponibles, date souhaitée.',
  'Chiffrer au devis la formule et les options, avec l’échéancier : 40 % à la commande, 60 % avant la mise en ligne.',
  'Faire accepter le devis par signature ou écrit explicite, puis encaisser l’acompte de 40 %.',
  'Contrôler avant de démarrer : contenus, droits sur les images, accès au domaine et à l’hébergement, date prévisionnelle et jalons.',
  'Livrer la maquette et demander un retour sous 10 jours ouvrés (à titre indicatif). Relancer vers J+7. Jamais de validation tacite.',
  'Premier cycle de corrections après la maquette.',
  'Réaliser le site, tester sur ordinateur et sur mobile, intégrer les mentions légales standard.',
  'Second cycle de corrections avant la livraison.',
  'Encaisser le solde de 60 % avant la mise en ligne.',
  'Livraison officielle constatée par écrit (signature ou e-mail explicite), avec la formation et la remise des accès. Cette date lance la garantie corrective de 30 jours.',
  'À la livraison : proposer la maintenance et recueillir, si le client le souhaite, l’autorisation facultative de référence commerciale (clause 119).',
];
const BOUTIQUE = [
  'Qualifier le besoin : produits, paiements et livraisons souhaités, volumes, qui gère les commandes, contenus disponibles.',
  'Chiffrer au devis la formule et les options, avec l’échéancier : 30 % à la commande, 40 % à la validation du design, 30 % avant la mise en ligne.',
  'Faire accepter le devis par signature ou écrit explicite, puis encaisser l’acompte de 30 %.',
  'Contrôler avant de démarrer : fichier produits, droits sur les images, accès, paramètres commerciaux déclarés par le commerçant, date prévisionnelle.',
  'Livrer la maquette et demander un retour sous 10 jours ouvrés. Relancer vers J+7. Jamais de validation tacite.',
  'Encaisser 40 % à la validation du design, puis premier cycle de corrections.',
  'Réaliser la boutique : produits de la formule, deux moyens de paiement standards, livraison standard (jusqu’à deux zones et trois modes simples).',
  'Tester les paiements et les livraisons, puis second cycle de corrections avant la livraison.',
  'Encaisser le solde de 30 % avant la mise en ligne.',
  'Livraison officielle constatée par écrit, formation de 2 h, remise des accès. Cette date lance la garantie corrective de 30 jours.',
  'Rappeler que la gestion quotidienne (commandes, stocks, remboursements) revient au commerçant, et proposer la maintenance WooCommerce.',
];
const OPTION_SITE = [
  'Vérifier que l’option n’est pas déjà comprise dans la formule vendue : ne jamais facturer deux fois.',
  'Si elle est hors périmètre, proposer un devis ou un pack d’heures et obtenir l’accord écrit avant de réaliser.',
  'Recueillir les contenus, accès et informations nécessaires.',
  'Réaliser dans le style du site, puis tester sur ordinateur et sur mobile.',
  'Faire valider le résultat par le client, par écrit.',
  'Tracer le temps passé et le livrable dans le dossier.',
];
const MAINT_COMMUN = [
  'Vérifier que l’hébergement est compatible et que les sauvegardes o2switch sont disponibles.',
  'Faire signer le contrat et le prix. La maintenance démarre à l’issue des 30 jours de garantie et de test, jamais avant.',
  'Chaque semaine : mises à jour de WordPress, des thèmes et des extensions, avec priorité à la sécurité.',
  'Chaque mois : petites interventions de 30 minutes dans le quota du forfait. Elles ne se reportent pas et ne se cumulent pas.',
  'Après chaque intervention : consigner un compte rendu dans le journal d’intervention.',
  'En cas d’incident : le qualifier (P1 critique, P2 importante, P3 courante), répondre en semaine de 9 h à 17 h sans délai garanti, tracer, puis rapport écrit.',
];
const NEWSLETTER = [
  'Vérifier l’origine licite des contacts et la plateforme d’envoi. Le compte Brevo ou équivalent est au nom du client.',
  'Fixer le planning avec le client : contenus attendus au moins 10 jours ouvrés avant l’envoi.',
  'Préparer le bon à tirer (BAT) et le transmettre environ 3 jours ouvrés avant l’envoi.',
  'Obtenir la validation écrite du client au plus tard 2 jours ouvrés avant. Silence du client : ne pas envoyer, reporter selon la clause.',
  'Envoyer uniquement sur BAT écrit, puis contrôler le statut de l’envoi.',
  'Remettre le bilan simplifié (10 à 15 minutes) : destinataires, clics, désinscriptions, selon les données disponibles.',
  'À la fin du service : restituer, retirer les accès AtoumWeb, supprimer les copies de travail sous 30 jours. Ne jamais supprimer les contacts ni les campagnes du compte du client.',
];
const SEO_PACK = [
  'Qualifier : site concerné, objectif, concurrents connus.',
  'Chiffrer au devis. Paiement : 100 % à la commande ; pour le Premium, 449,50 € à la commande et 449,50 € à la remise du rapport.',
  'Demander uniquement les droits nécessaires (WordPress, Search Console, hébergement si utile).',
  'Proposer les URL et, selon l’offre, les concurrents à analyser, puis obtenir la validation écrite du client avant l’analyse détaillée.',
  'Réaliser l’analyse et rédiger le rapport. Aucune correction n’est comprise.',
  'Remettre le rapport officiellement : cette date ouvre 15 jours calendaires pour un cycle regroupé de clarifications.',
  'Rappeler au client qu’aucun classement, trafic ni vente n’est garanti.',
];
const GBP_ABO = [
  'Obtenir les accès délégués au compte Google du client. La fiche et le compte restent au nom du client.',
  'Confirmer par écrit la prise en charge effective : c’est la date de départ qui fixe les échéances.',
  'Valider la ligne éditoriale et le calendrier de publications avec le client. Les publications font 80 à 150 mots.',
  'Chaque mois : publier selon le quota de l’offre, répondre aux avis. Les avis négatifs ou sensibles demandent la validation écrite du client.',
  'Remettre le bilan prévu : synthèse trimestrielle (Essentiel) ou rapport mensuel (Premium).',
  'Si le client ne fournit pas de contenus malgré une relance : pas de report automatique au mois suivant.',
  'Fiche suspendue : diagnostic et premier accompagnement au recours inclus, cas complexes sur devis.',
  'À la clôture : remettre le dernier bilan prévu et retirer les accès AtoumWeb.',
];
const STAT_ABO = [
  'Obtenir les accès délégués à Google Analytics et à la Search Console, au nom du client.',
  'Confirmer par écrit la prise en charge effective : la date de départ fixe les échéances.',
  'Vérifier que la collecte des données fonctionne. Sinon, la création ou la configuration des comptes se chiffre à part.',
  'Remettre le bilan prévu : synthèse trimestrielle avec 1 à 2 recommandations (Essentiel) ou rapport mensuel avec jusqu’à 3 recommandations au bilan trimestriel (Premium).',
  'Données indisponibles : bilan partiel avec l’anomalie signalée. Erreur d’AtoumWeb corrigée gratuitement, cause client ou tiers sur devis.',
  'À la clôture : remettre le dernier bilan prévu et retirer les accès AtoumWeb.',
];
const PACK_HEURES = [
  'Vendre le pack et encaisser. Il couvre le temps de prestation seulement, sur les sites du même client.',
  'Ouvrir le compteur d’heures dans le dossier du client.',
  'Avant chaque intervention : annoncer le diagnostic, puis obtenir l’accord du client. Le décompte se fait par tranches de 15 minutes.',
  'Après chaque intervention : consigner le temps et le livrable, et mettre à jour le solde.',
  'Le pack est valable 24 mois, plus 3 mois de prolongation automatique gratuite. Envoyer les rappels à J-60 et J-30 avant la fin.',
  'Déplacements gratuits dans Dijon Métropole, au-delà sur devis.',
];
const TECH_GENERIQUE = [
  'Demander une sauvegarde récente et les accès nécessaires avant toute intervention.',
  'Faire le diagnostic et l’annoncer au client avant de chiffrer la suite.',
  'Si la demande dépasse la prestation, proposer un devis ou un pack d’heures et obtenir l’accord écrit.',
  'Intervenir, puis tester le résultat.',
  'Remettre un compte rendu écrit et tracer le temps passé.',
];
const CONTENU = [
  'Cadrer le besoin : cible, objectif, ton, éléments source fournis par le client.',
  'Confirmer le volume et le format prévus par l’offre.',
  'Rédiger ou corriger, puis soumettre au client.',
  'Un cycle de corrections, regroupé.',
  'Obtenir la validation écrite avant toute publication.',
  'Intégrer dans WordPress si l’offre le prévoit. Ne jamais facturer deux fois une intégration déjà incluse.',
];
const IDENTITE = [
  'Faire le brief : activité, valeurs, public, exemples qui plaisent, usages prévus (site, réseaux, impression).',
  'Vérifier ce qui existe déjà (logo, couleurs, polices) et ce que le client doit fournir.',
  'Présenter la proposition prévue par l’offre et faire valider la direction avant de décliner.',
  'Appliquer les cycles de corrections de l’offre. Une nouvelle direction est une nouvelle prestation.',
  'Livrer les fichiers prévus. Fichiers natifs éditables et charte complète exclus sauf mention contraire.',
  'Les droits d’exploitation sont accordés après paiement intégral, selon les usages précisés au devis.',
];
const PHOTO_SHOOT = [
  'Faire le brief : usage des photos, lieu, personnes ou produits, style.',
  'Vérifier le lieu : hors Dijon Métropole, devis.',
  'Fixer la date, puis réaliser la séance dans la durée prévue par l’offre.',
  'Sélectionner et retoucher les photos prévues (retouches essentielles).',
  'Livrer les photos finalisées en JPEG haute résolution et en versions web. Ni fichiers bruts ni rejets.',
  'Préciser par écrit les droits d’utilisation.',
];
const PHOTO_RETOUCHE = [
  'Recevoir les fichiers d’origine, en bonne qualité. La qualité du résultat en dépend.',
  'Demander un échantillon avant de chiffrer un gros lot.',
  'Retoucher selon le niveau de l’offre (essentielle, avancée, détourage ou pack homogène).',
  'Livrer en JPEG ou PNG, sans fichiers de travail éditables.',
  'Un cycle de corrections mineures, à demander sous 7 jours calendaires. Défauts imputables à AtoumWeb corrigés gratuitement.',
];
const LANDING = [
  'Définir l’action attendue du visiteur : appeler, remplir un formulaire, réserver.',
  'Recueillir les contenus et les visuels. La rédaction complète est à part.',
  'Réaliser la page (jusqu’à 6 sections), puis tester sur ordinateur et sur mobile.',
  'Un cycle de corrections, puis validation écrite.',
  'Préciser l’hébergement et le domaine si la page est un site autonome.',
  'Mettre en ligne et vérifier le formulaire ou le bouton d’action.',
];
const DEV_SUR_DEVIS = [
  'Ne jamais chiffrer sur une description orale : commencer par le cadrage.',
  'Rédiger le périmètre et le chiffrer au devis, avec l’échéancier.',
  'Faire accepter le devis, puis encaisser l’acompte.',
  'Développer sur un environnement de test, en distinguant le premier outil (MVP) des évolutions.',
  'Tester avec le client et recueillir sa validation écrite.',
  'Livrer officiellement par écrit : cette date lance la garantie corrective.',
  'Proposer la maintenance. Pour une maintenance applicative, tout renouvellement annuel demande l’accord exprès du client.',
];
const MARIAGE = [
  'Recueillir les informations : date, lieu, horaires, programme, photos, textes.',
  'Chiffrer au devis. Le domaine standard est au nom des mariés et compris pendant la période incluse.',
  'Réaliser le site selon la formule, avec un RSVP simple. Ne collecter aucune donnée sensible (régime, allergie, religion, santé).',
  'Appliquer les cycles de corrections de la formule, puis faire valider par écrit.',
  'Mettre en ligne et remettre les accès.',
  'Après le mariage (formule Histoire) : galerie protégée par mot de passe, validation des photos et autorisations par les mariés, export proposé avant fermeture.',
  'À la fin de la période incluse : informer le client du renouvellement à 59 € par an (domaine standard compris). Il peut s’y opposer jusqu’à la veille de l’échéance, sans frais.',
];

// ---------- cas particuliers par code
const SPECIFIC = {
  'AW-WEB-VITRINE': {steps: VITRINE, source: 'M'},
  'V39-WEB-BUSINESS': {steps: [...VITRINE.slice(0, 6), 'Réaliser le site avec la rédaction de 3 pages sur brief, les avis Google standards, GA4 et la Search Console selon le consentement.', ...VITRINE.slice(7)], source: 'MP'},
  'V39-WEB-VISIBILITE': {steps: [...VITRINE.slice(0, 6), 'Réaliser le site comme Business, avec en plus le blog technique et un article SEO publié.', ...VITRINE.slice(7)], source: 'MP'},
  'AW-ECOM-BASE': {steps: BOUTIQUE, source: 'M'},
  'V39-ECOM-BUSINESS': {steps: [...BOUTIQUE.slice(0, 6), 'Réaliser la boutique avec 25 produits simples au total, l’intégration newsletter standard (déjà comprise, ne pas refacturer), GA4, la Search Console et les avis Google.', ...BOUTIQUE.slice(7)], source: 'MP'},
  'V39-ECOM-VISIBILITE': {steps: [...BOUTIQUE.slice(0, 6), 'Réaliser la boutique comme Business, avec en plus le blog technique, un article SEO publié et l’optimisation initiale des performances.', ...BOUTIQUE.slice(7)], source: 'MP'},
  'AW-WEB-PAGE-SUP': {steps: ['Vérifier le nombre de pages comprises dans la formule : Business en comprend 3 rédigées, 5 pages de rédaction en supplément font 8 pages au total.', ...OPTION_SITE.slice(1)], source: 'MP'},
  'AW-WEB-AVIS-GOOGLE': {steps: ['Vérifier que l’affichage des avis Google n’est pas déjà compris (Business, Visibilité, WooCommerce Business et Visibilité).', 'Obtenir l’accès à la fiche Google du client.', ...OPTION_SITE.slice(3)], source: 'MP'},
  'AW-WEB-NEWSLETTER': {steps: ['Vérifier que l’intégration n’est pas déjà comprise (WooCommerce Business et Visibilité).', 'Obtenir l’accès à l’outil d’envoi du client (Brevo, Mailchimp ou équivalent).', 'Intégrer le formulaire d’inscription et le consentement, puis tester.', 'Expliquer brièvement l’utilisation au client.', 'Tracer le temps passé.'], source: 'MP'},
  'AW-WEB-LANG-SUP': {steps: ['Rappeler que les traductions sont fournies par le client.', ...OPTION_SITE.slice(2)], source: 'MP'},
  'AW-WEB-BILINGUE': {steps: ['Rappeler que les traductions sont fournies par le client et que l’offre porte sur 5 pages commerciales au maximum.', ...OPTION_SITE.slice(2)], source: 'MP'},
  'AW-WEB-PAIEMENT-SIMPLE': {steps: ['Vérifier que le client a son propre compte de paiement. Ni panier ni boutique : c’est un bouton ou un lien externe.', ...OPTION_SITE.slice(2)], source: 'MP'},
  'AW-MAINT-WP-M': {steps: [...MAINT_COMMUN.slice(0, 2), 'Mensuel : le client choisit l’échéance du 5 ou du 15. Prélèvement SEPA ou virement permanent, premier mois au prorata.', ...MAINT_COMMUN.slice(2)], source: 'M'},
  'AW-MAINT-WP-A': {steps: [...MAINT_COMMUN.slice(0, 2), 'Annuel : paiement d’avance au début de chaque période (11 mois payés pour 12).', ...MAINT_COMMUN.slice(2), '30 jours avant l’échéance, proposer le renouvellement. Aucune nouvelle période sans l’accord exprès du client.'], source: 'M'},
  'AW-MAINT-WC-M': {steps: [...MAINT_COMMUN.slice(0, 2), 'Mensuel : le client choisit l’échéance du 5 ou du 15. Prélèvement SEPA ou virement permanent, premier mois au prorata.', ...MAINT_COMMUN.slice(2), 'WooCommerce : sauvegardes quotidiennes et 4 petites interventions par mois. Un site qui ne prend plus de paiements est un incident P1.'], source: 'M'},
  'AW-MAINT-WC-A': {steps: [...MAINT_COMMUN.slice(0, 2), 'Annuel : paiement d’avance au début de chaque période (11 mois payés pour 12).', ...MAINT_COMMUN.slice(2), 'WooCommerce : sauvegardes quotidiennes et 4 petites interventions par mois. Un site qui ne prend plus de paiements est un incident P1.', '30 jours avant l’échéance, proposer le renouvellement. Aucune nouvelle période sans l’accord exprès du client.'], source: 'M'},
  'V39-HOST-LUNE': {steps: ['Faire signer le contrat Lune dédiée à 149 € par an (99 € d’hébergement et 50 € de Lune dédiée).', 'Si le client quitte la maintenance mais garde son site : un document confirme la fin de maintenance, un second porte le nouvel engagement Lune. Jamais deux fois la même période.', 'Traiter le domaine à part : titularité, accord annuel.', 'Programmer le transfert interne, gratuit.', 'Rappeler le périmètre : hébergement, relation o2switch, incidents serveur. Ni mises à jour WordPress ni interventions de maintenance.', 'Restauration manuelle sur devis, sauf faute imputable à AtoumWeb.', 'À chaque échéance annuelle : informer le client dans le délai légal, qui peut s’opposer jusqu’à la veille.'], source: 'M'},
  'V39-HOST-DOMAINE': {steps: ['Vérifier que le domaine est au nom du client et que les comptes administrateurs du client sont distincts de ceux d’AtoumWeb.', 'Facturer 29 € par an de gestion, plus les frais du bureau d’enregistrement. Pour un site de mariage, le domaine standard est déjà compris : ne pas ajouter ce forfait.', 'Envoyer un rappel avant chaque échéance, si possible.', 'Ne renouveler qu’après l’accord exprès du client. Ne jamais facturer deux fois la même période.'], source: 'M'},
  'AW-TECH-DEPANNAGE': {steps: ['Contrôler le statut tarifaire et le devis (69 € l’heure, minimum 1 h).', 'Demander une sauvegarde récente et les accès avant d’intervenir.', 'Annoncer d’abord le diagnostic, puis chiffrer la suite avec l’accord du client.', 'Intervenir, tester, puis tracer le temps passé.', 'Proposer un pack d’heures ou la maintenance si les demandes sont régulières.'], source: 'M'},
  'AW-TECH-PACK-3H': {steps: PACK_HEURES, source: 'M'},
  'AW-TECH-PACK-5H': {steps: PACK_HEURES, source: 'M'},
  'AW-TECH-PACK-10H': {steps: PACK_HEURES, source: 'M'},
  'AW-TECH-MIGRATION-AW': {steps: ['Faire une sauvegarde complète du site source et vérifier les accès à l’hébergeur d’origine.', 'Vérifier les boîtes e-mail et les réglages DNS. Le transfert des boîtes et des anciens messages se chiffre à part.', 'Transférer les fichiers et la base, configurer, activer le SSL.', 'Vérifier le site sur le nouvel hébergement, puis basculer le DNS.', 'Contrôler après bascule, puis remettre un compte rendu.'], source: 'MP'},
  'AW-TECH-URGENT': {steps: ['Qualifier l’urgence (P1, P2 ou P3) et vérifier le périmètre.', 'Chiffrer sur devis et obtenir l’accord écrit avant d’intervenir.', 'Prendre les mesures conservatoires proportionnées, tracer, prévenir le client.', 'Rappeler qu’aucune garantie hors heures ouvrées ni 24 h/24 n’est donnée.', 'Remettre un rapport écrit et la suite proposée.'], source: 'MP'},
  'AW-SEO-LOCAL': {steps: ['Vérifier si le client a déjà une fiche Google Business Profile et qui en est propriétaire.', 'Obtenir l’accès délégué et les justificatifs de vérification. La décision de vérifier la fiche appartient à Google, sans garantie.', 'Créer ou optimiser la fiche : catégories, description, services, horaires, cohérence du nom, de l’adresse et du téléphone.', 'Optimiser une page locale du site, puis contrôler l’indexation.', 'Remettre un mini bilan.'], source: 'MP'},
  'AW-DATA-GA-SC': {steps: ['Obtenir les accès au site et vérifier si le client a déjà des comptes Google (propriétaire).', 'Installer Google Analytics 4 et la balise, créer la Search Console et le sitemap.', 'Vérifier que la collecte fonctionne, en tenant compte du consentement aux cookies.', 'Remettre les accès au client et une courte explication.', 'Proposer un suivi régulier si le client veut des bilans.'], source: 'MP'},
  'AW-APP-CADRAGE': {steps: ['Faire l’atelier besoin : utilisateurs, processus, fonctions, données, écrans, droits, intégrations, contraintes.', 'Séparer le premier outil (MVP) des évolutions.', 'Remettre le cadrage écrit et une première estimation.', 'Rappeler que le cadrage n’engage ni à réaliser l’application ni à un prix ou un calendrier.', 'Si le client poursuit, chiffrer le développement sur devis séparé.'], source: 'P'},
  'AW-APP-MAINT': {steps: ['Définir le périmètre selon la criticité, les utilisateurs, l’hébergement, les API et le niveau de service raisonnable.', 'Chiffrer sur devis et faire accepter.', 'Intervenir selon le périmètre et tracer les interventions.', 'À chaque échéance annuelle : proposer le renouvellement. Il demande l’accord exprès du client, son silence ne vaut pas acceptation.'], source: 'MP'},
  'AW-MARIAGE-RENOUV': {steps: ['Après la période incluse (1 an pour Essentiel et Grand Jour, 2 ans pour Histoire), informer le client du renouvellement à 59 € par an, domaine standard compris.', 'Rappeler qu’il peut résilier jusqu’à la veille de l’échéance, sans frais ni préavis.', 'Reconduction automatique seulement si elle a été convenue, avec les informations légales.', 'Renouveler le domaine standard dans le cadre du forfait. Ne jamais facturer deux fois le domaine.'], source: 'M'},
};

// ---------- règles par famille ou motif, appliquées si le code n'a pas de cas particulier
function stepsFor(o) {
  if (SPECIFIC[o.code]) return {steps: SPECIFIC[o.code].steps, source: SRC[SPECIFIC[o.code].source]};
  const c = o.code;
  const rule = (steps, k) => ({steps, source: SRC[k]});
  if (/^(AW-WEB-|V39-WEB-)/.test(c)) return rule(OPTION_SITE, 'MP');
  if (/^(AW-ECOM-|V39-ECOM-)/.test(c)) return rule(OPTION_SITE, 'MP');
  if (/^AW-LP-/.test(c)) return rule(LANDING, 'P');
  if (/^AW-TECH-/.test(c)) return rule(TECH_GENERIQUE, 'P');
  if (/^AW-CONT-/.test(c)) return rule(CONTENU, 'P');
  if (/^(AW-BRAND-|V39-BRAND-)/.test(c)) return rule(IDENTITE, 'P');
  if (/^AW-PHOTO-SHOOT/.test(c)) return rule(PHOTO_SHOOT, 'P');
  if (/^AW-PHOTO-/.test(c)) return rule(PHOTO_RETOUCHE, 'P');
  if (/^(AW-SEO-(ESSENTIEL|AVANCE|PREMIUM|AUDIT)|AW-SEO-LOCAL$)/.test(c)) return rule(SEO_PACK, 'M');
  if (/^(V39-GBP-ESS-|AW-SEO-GBP-)/.test(c)) return rule(GBP_ABO, 'M');
  if (/^AW-SEO-/.test(c)) return rule(['Obtenir les accès nécessaires et vérifier le périmètre au devis.', 'Réaliser la prestation décrite dans la fiche.', 'Remettre un compte rendu écrit.', 'Rappeler qu’aucun classement ni résultat n’est garanti.'], 'P');
  if (/^V39-STAT-|^AW-DATA-SUIVI-/.test(c)) return rule(STAT_ABO, 'M');
  if (/^AW-DATA-/.test(c)) return rule(['Obtenir les accès et vérifier les comptes existants.', 'Réaliser la prestation décrite dans la fiche, puis tester.', 'Remettre un compte rendu et les accès au client.', 'Rappeler que la mesure dépend du consentement aux cookies.'], 'P');
  if (/^V39-NL-/.test(c)) return rule(NEWSLETTER, 'M');
  if (/^(AW-DEVWP-|AW-APP-)/.test(c)) return rule(/AJUST|EVOL/.test(c) ? TECH_GENERIQUE : DEV_SUR_DEVIS, 'P');
  if (/^AW-MARIAGE-/.test(c)) return rule(MARIAGE, 'P');
  throw Error('Pas d’étapes pour ' + c);
}

module.exports = {stepsFor, SRC};
