// Only the keywords used by the four checked-in V1 schemas are supported here.
interface Schema {
  $ref?: string; $defs?: Record<string, Schema>;
  type?: string | string[]; const?: unknown; enum?: unknown[];
  required?: string[]; properties?: Record<string, Schema | undefined>;
  additionalProperties?: boolean | Schema; propertyNames?: Schema;
  items?: Schema; uniqueItems?: boolean; minLength?: number; pattern?: string;
  minimum?: number; exclusiveMinimum?: number; format?: string;
  allOf?: Schema[]; anyOf?: Schema[]; oneOf?: Schema[]; if?: Schema; then?: Schema;
}
export function validateContractSchemaV1(value: unknown, schema: Schema): string[] {
  const visit = (value: unknown, rule: Schema, path: string): string[] => {
    const errors: string[] = [];
    const fail = (reason: string) => errors.push(path + ': ' + reason);
    if (rule.$ref) {
      const target = schema.$defs?.[rule.$ref.replace('#/$defs/', '')];
      if (!target) throw new Error('Référence V1 inconnue : ' + rule.$ref);
      return visit(value, target, path);
    }
    if (rule.type) {
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      const matches = types.some(type => type === 'null' ? value === null
        : type === 'array' ? Array.isArray(value)
        : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
        : type === 'integer' ? Number.isInteger(value)
        : type === 'number' ? typeof value === 'number' && Number.isFinite(value)
        : typeof value === type);
      if (!matches) return [path + ': type invalide.'];
    }
    if ('const' in rule && value !== rule.const) fail('valeur constante invalide.');
    if (rule.enum && !rule.enum.includes(value)) fail('valeur non autorisée.');
    for (const part of rule.allOf ?? []) errors.push(...visit(value, part, path));
    if (rule.anyOf && !rule.anyOf.some(part => visit(value, part, path).length === 0)) fail('aucune forme V1 valide.');
    if (rule.oneOf && rule.oneOf.filter(part => visit(value, part, path).length === 0).length !== 1) fail('binding V1 invalide ou incomplet.');
    if (rule.if && rule.then && visit(value, rule.if, path).length === 0) errors.push(...visit(value, rule.then, path));
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && [...value].length < rule.minLength) fail('chaîne trop courte.');
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail('format invalide.');
      if (rule.format === 'date-time' && !validDateTime(value)) fail('date-time invalide.');
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('nombre non fini.');
      if (rule.minimum !== undefined && value < rule.minimum) fail('valeur trop petite.');
      if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) fail('valeur trop petite.');
    }
    if (Array.isArray(value)) {
      if (rule.uniqueItems && new Set(value).size !== value.length) fail('doublons interdits.');
      if (rule.items) value.forEach((item, index) => errors.push(...visit(item, rule.items!, path + '[' + index + ']')));
    } else if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      for (const key of rule.required ?? []) {
        if (!Object.prototype.hasOwnProperty.call(record, key)) errors.push(path + '.' + key + ': propriété obligatoire.');
      }
      for (const [key, item] of Object.entries(record)) {
        if (rule.propertyNames) errors.push(...visit(key, rule.propertyNames, path + '.' + key));
        if (rule.properties && Object.prototype.hasOwnProperty.call(rule.properties, key)) errors.push(...visit(item, rule.properties[key]!, path + '.' + key));
        else if (rule.additionalProperties === false) errors.push(path + '.' + key + ': propriété inconnue.');
        else if (typeof rule.additionalProperties === 'object') errors.push(...visit(item, rule.additionalProperties, path + '.' + key));
      }
    }
    return errors;
  };
  return visit(value, schema, '$');
}
function validDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  const days = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1]
    && Number(hour) < 24 && Number(minute) < 60 && Number(second) < 60
    && (offsetHour === undefined || (Number(offsetHour) < 24 && Number(offsetMinute) < 60));
}
