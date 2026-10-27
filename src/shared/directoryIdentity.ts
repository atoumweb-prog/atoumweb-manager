import type { ContactInput, OrganizationInput } from './crm';
import { draftFingerprint } from './draftSection';

export type DirectoryIdentityType = 'organization' | 'contact';
export interface DirectoryWrite<T> { id?: string; expected?: T; operationId?: string }
export interface DirectoryVerification {
  verifiedAt: string | null;
  verifiedFingerprint: string | null;
  currentFingerprint: string;
  source: 'manual-manager' | null;
}

/** Compare editable identity fields only; projections/counts are never persisted. */
export function directoryIdentitySnapshot(type: DirectoryIdentityType, input: OrganizationInput | ContactInput, coordinates = false): Record<string, string> {
  const keys = type === 'organization'
    ? ['name', 'legalName', 'siret', 'website', 'addressLine1', 'addressLine2', 'postalCode', 'city', 'country', 'industry', 'notes']
    : ['organizationId', 'firstName', 'lastName', 'jobTitle', 'preferredChannel', 'notes', 'addressLine1', 'addressLine2', 'postalCode', 'city', 'country'];
  if (coordinates) keys.push('email', 'phone');
  const value = input as unknown as Record<string, unknown>;
  return Object.fromEntries(keys.map(key => [key, typeof value[key] === 'string' ? (value[key] as string).trim() : '']));
}
export function sameDirectoryIdentity(type: DirectoryIdentityType, a: OrganizationInput | ContactInput, b: OrganizationInput | ContactInput): boolean {
  return draftFingerprint(directoryIdentitySnapshot(type, a)) === draftFingerprint(directoryIdentitySnapshot(type, b));
}

export interface ExistingIdentityWrite {
  organization?:{id:string;input:OrganizationInput;expected:OrganizationInput};
  contact?:{id:string;input:ContactInput;expected:ContactInput};
}
