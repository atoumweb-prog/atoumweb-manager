/** Presentation schema only; never contains prospect IDs, queries or drafts. */
export const PROSPECT_DIRECTORY_COLUMNS = [
  {id:'identity',required:true},{id:'next_action'},{id:'due'},{id:'industry'},{id:'city'},{id:'contact'},
  {id:'status'},{id:'open',required:true},
] as const;
export const PROSPECT_DIRECTORY_VIEW = 'prospects-directory';
