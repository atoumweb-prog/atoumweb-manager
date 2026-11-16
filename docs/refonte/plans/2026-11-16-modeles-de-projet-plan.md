# Modèles de projet du référentiel : plan d'implémentation

> **Pour l'exécution** : superpowers:executing-plans (exécution dans cette session, Carlos a dit « Oui, plan et simulation »). Étapes en cases à cocher.

**But** : créer, dans une copie jetable puis (sur accord) dans la préproduction, un modèle de projet par ensemble d'étapes du référentiel et relier chaque offre de nature A (base) ou B (complément) à son modèle.

**Architecture** : un module pur convertit les étapes du référentiel en lots et tâches ; un service planifie (lecture seule, empreinte du plan) puis applique (création par `ProjectService`, publication, liens) ; un script de préproduction, sur le modèle de `add-reference-consent-v2.cjs`, enchaîne aperçu, sauvegarde et application.

**Technique** : TypeScript (src/main), vitest sous Electron, SQLite (NodeSqliteAdapter), esbuild pour le script.

**Fiche** : `docs/refonte/plans/2026-11-16-modeles-de-projet-design.md` (validée le 16/11/2026).

## Contraintes globales

- Nature A = un modèle de base (`role='base'`, `site_mode='create'`) ; nature B = un modèle complément (`role='addon'`) ajouté au projet de base ; nature C = aucun modèle (maintenances, abonnements GBP et statistiques, newsletters récurrentes, hébergement Lune et domaine, renouvellement mariage, packs d'heures, maintenance applicative).
- Étapes d'avant-vente exclues : celles qui commencent par « Qualifier », « Chiffrer », « Faire accepter », « Ne jamais chiffrer ».
- Encaissements : une étape « Encaisser … » devient « Vérifier dans Abby l’encaissement : … » ; « … puis encaisser l’acompte de N % » devient « Vérifier dans Abby l’encaissement de l’acompte de N % ».
- Lots, dans cet ordre : Démarrage, Réalisation, Corrections et validation, Livraison ; l'ordre du référentiel est conservé (une étape ne revient jamais dans un lot antérieur).
- Description de chaque tâche : texte complet de l'étape, puis la provenance du référentiel (« Proposé, à valider » pour P).
- Durées vides (`estimated_minutes` NULL).
- Ne pas toucher : « AtoumWeb · Site vitrine » et son lien, les modèles « TEST — … », les devis acceptés, les projets existants.
- Offres sans code canonique (V39) : retrouvées par le nom du pack approuvé, signalées dans le rapport.
- Aucune écriture dans la préproduction sans `--apply <empreinte>` après accord explicite de Carlos ; sauvegarde avant écriture ; refus si le Manager est ouvert.
- Nom des modèles : « Référentiel · <famille> » ; rejouable sans doublon (un modèle déjà présent sous ce nom n'est pas recréé).

## Points de vigilance (non couverts par les tests ordinaires)

1. Une offre vendue avec une option (B) mais sans base dans le devis : l'aperçu doit refuser proprement (message du Manager), sans écriture.
2. Une offre publiée qui a déjà un lien (vitrine) : le plan la laisse telle quelle.
3. Une étape qui contient à la fois un encaissement et un autre travail (« Encaisser 40 % … puis premier cycle de corrections ») : reprise entière dans une tâche de contrôle Abby, texte complet en description.
4. Une deuxième application après succès : aucune écriture (plan vide).
5. Une empreinte de plan différente de celle relue : refus sans écriture.

---

### Tâche 1 : conversion des étapes en lots et tâches (module pur)

**Fichiers** : créer `src/main/projects/referentialTemplatePlan.ts` et `src/main/projects/referentialTemplatePlan.test.ts`.

**Produit** :
- `type OfferNature = 'base' | 'addon' | 'recurring'`
- `natureOf(code: string): OfferNature`
- `type PlannedTask = {lot: 'Démarrage' | 'Réalisation' | 'Corrections et validation' | 'Livraison'; name: string; description: string}`
- `tasksFromSteps(steps: string[], provenance: string): PlannedTask[]`
- `templateKey(steps: string[]): string` (empreinte du contenu, pour regrouper les offres aux étapes identiques)

- [ ] Tests d'abord : avant-vente exclue (les trois premières étapes VITRINE donnent une seule tâche « Vérifier dans Abby l’encaissement de l’acompte de 40 % ») ; « Encaisser le solde de 60 % … » devient une tâche de contrôle Abby ; ordre monotone des lots ; provenance en fin de description ; `natureOf('AW-MAINT-WP-M')==='recurring'`, `natureOf('AW-WEB-BLOG')==='addon'`, `natureOf('AW-LP-BASE')==='base'`, `natureOf('V39-NL-PONCT-SIMPLE')==='base'`, `natureOf('V39-NL-1-M')==='recurring'`.
- [ ] Les voir échouer, implémenter, les voir passer.

### Tâche 2 : service plan / application

**Fichiers** : créer `src/main/projects/ReferentialProjectTemplates.ts` et son test.

**Consomme** : tâche 1 ; `ProjectService.createTemplate`, `addTemplateNode`, `publishTemplateVersion`.
**Produit** :
- `type ReferentialOffer = {code: string; name: string; steps: string[]; provenance: string; family: string}`
- `planReferentialTemplates(db, offers: ReferentialOffer[]): {templates, links, skipped, unmatched, planSha256}` (lecture seule)
- `applyReferentialTemplates(db, offers, planSha256): {templatesCreated, linksCreated}` (refuse si l'empreinte diffère ; une seule transaction par modèle ; publication en v1)

- [ ] Tests d'abord, sur base en mémoire migrée et `projectCompositionFixture` : le plan n'écrit rien ; l'application crée les modèles publiés et les liens ; un devis avec une offre de base donne un aperçu de projet avec ses lots et tâches ; base + complément ajoute les tâches du complément ; complément seul est refusé sans écriture ; seconde application = plan vide ; empreinte différente refusée ; offre déjà liée laissée telle quelle.
- [ ] Les voir échouer, implémenter, les voir passer ; suite complète verte ; typecheck.

### Tâche 3 : script de préproduction et simulation

**Fichiers** : créer `scripts/preproduction/import-referential-templates.cjs`.

- [ ] Script : `--dest <préproduction>` (aperçu) ou `--apply <planSha256>` ; lit `scripts/referentiel/etapes.cjs` et `data/approved/2026-11-08/CATALOGUE_V394_130_EXTRAIT_WORD.json` ; garde-fous identiques à `add-reference-consent-v2.cjs`.
- [ ] Simulation : copie jetable de la préproduction dans TEMP, aperçu puis application sur la copie ; rapport lisible (modèles, tâches par lot, liens, offres non trouvées, nature C exclue) dans `C:\DEV\Livrables\Modeles-de-projet\rapport-simulation.md`.
- [ ] Contrôle sur la copie : aperçu de projet réussi pour chaque offre A, et pour chaque offre B ajoutée à une base de sa famille ; empreinte de la préproduction inchangée.
- [ ] PROJECT_STATUS, mémoire ; commit local après tests verts. Écriture dans la préproduction : **non**, en attente de l'accord de Carlos sur le rapport.
