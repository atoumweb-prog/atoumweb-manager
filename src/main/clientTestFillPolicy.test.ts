import {describe,it,expect} from 'vitest';
import {clientTestFillAllowed} from './clientTestFillPolicy';

describe('Client TEST fill context',()=>{
  it('allows only the established unpackaged development workspace',()=>{
    expect(clientTestFillAllowed(false,'C:\\DEV\\Validation-MSI')).toBe(true);
    expect(clientTestFillAllowed(false,'C:/DEV/Validation-MSI/')).toBe(true);
  });
  it('denies packaged builds even on that workspace',()=>{
    expect(clientTestFillAllowed(true,'C:/DEV/Validation-MSI')).toBe(false);
  });
  it('denies ordinary user workspaces even in an unpackaged build',()=>{
    expect(clientTestFillAllowed(false,'C:/Users/Carlos/Documents/Manager')).toBe(false);
    expect(clientTestFillAllowed(true,'C:/Users/Carlos/Documents/Manager')).toBe(false);
  });
  it('does not trust TEST, recipe labels, substrings or an absent context',()=>{
    for(const root of ['','Workspace-TEST','C:/Validation-MSI-user','C:/Validation-MSI/subfolder']){
      expect(clientTestFillAllowed(false,root)).toBe(false);
    }
  });
});
