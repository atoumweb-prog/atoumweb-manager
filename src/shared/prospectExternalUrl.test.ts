import {describe,it,expect} from 'vitest';
import {prospectExternalUrl} from './prospectExternalUrl';
describe('destinations utilisateur du prospect',()=>{
 it('ouvre uniquement web ou composition email',()=>{expect(prospectExternalUrl('https://example.test/a?q=b')).toBe('https://example.test/a?q=b');expect(prospectExternalUrl('mailto:demo@example.test')).toBe('mailto:demo@example.test');});
 it('refuse fichiers, commandes, protocoles et identité dans URL',()=>{for(const url of ['file:///C:/test','javascript:alert(1)','cmd:run','https://user:pass@example.test','mailto:demo@example.test?body=hello','mailto:demo@example.test%0A','https://example.test/\n',null])expect(()=>prospectExternalUrl(url)).toThrow();});
});
