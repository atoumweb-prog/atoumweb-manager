/** Fail closed: the Client TEST helper is restricted to the established development workspace. */
export function clientTestFillAllowed(packaged:boolean,workspaceRoot:string):boolean {
  return !packaged && /(?:^|[\\/])Validation-MSI[\\/]?$/i.test(workspaceRoot);
}
