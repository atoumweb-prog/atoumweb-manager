import {describe,it,expect} from 'vitest';
import {parseEuroCents} from './moneyInput';
describe('French monetary input',()=>{it.each([['6100',610000],['6 100',610000],['6\u00a0100,50 €',610050],['6\u202f100.50',610050],['0',0],['',null]])('accepts %s',(raw,expected)=>expect(parseEuroCents(String(raw))).toBe(expected));it.each(['-10','NaN','1e3','6 10','1,234','1.2.3','Infinity'])('rejects %s',raw=>expect(parseEuroCents(raw)).toBeUndefined());});
