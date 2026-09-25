export interface BridgeReusableValidationInput {
  generalized: boolean;
  remoteAssetUrls: readonly string[];
  javascript?: string | null;
  dependencies?: readonly unknown[] | null;
}

export interface BridgeReusableValidationAssessment {
  automaticChecksPassed: boolean;
  blockers: string[];
  warnings: string[];
}

export function assessBridgeReusableValidation(input: BridgeReusableValidationInput): BridgeReusableValidationAssessment {
  const remoteAssetUrls = [...new Set(input.remoteAssetUrls.filter((url) => typeof url === 'string' && url.trim()))];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.generalized) {
    blockers.push('La généralisation automatique n’est pas complète.');
  }
  if (remoteAssetUrls.length > 0) {
    blockers.push(`${remoteAssetUrls.length} ressource(s) distante(s) doivent être localisées avant validation.`);
  }
  if (input.javascript?.trim()) {
    warnings.push('JavaScript présent : vérifier son comportement dans le Workbench avant validation.');
  }
  if ((input.dependencies?.length ?? 0) > 0) {
    warnings.push(`${input.dependencies!.length} dépendance(s) déclarée(s) : vérifier leur disponibilité sur la cible.`);
  }

  return {
    automaticChecksPassed: blockers.length === 0,
    blockers,
    warnings,
  };
}
