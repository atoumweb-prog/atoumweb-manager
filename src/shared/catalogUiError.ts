/** Remove Electron's transport wrapper; retain the actionable service error. */
export function catalogUiError(error:unknown,fallback='Opération impossible ; saisie conservée.'):string {
 return (error instanceof Error?error.message:fallback).replace(/^Error invoking remote method '[^']+': (?:Error: )?/,'');
}
