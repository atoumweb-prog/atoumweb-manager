import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {BRAND_ICON_SVG,BRAND_PRIMARY_SVG,brandWordmark} from './brandArtwork';
describe('Candidate brand resources (not human approval)',()=>{
 it('preserves the supplied originals byte for byte against their recorded provenance',()=>{
  const rows=JSON.parse(readFileSync('assets/brand/references/provenance.json','utf8')) as {file:string;sha256:string}[];
  expect(rows.length).toBe(3);for(const row of rows)expect(createHash('sha256').update(readFileSync('assets/brand/references/'+row.file)).digest('hex')).toBe(row.sha256);
 });
 it('keeps distributed vector candidates equal to the single preview source',()=>{
  expect(readFileSync('assets/brand/candidate/symbol.svg','utf8')).toBe(BRAND_ICON_SVG);
  expect(readFileSync('assets/brand/candidate/primary-dark.svg','utf8')).toBe(BRAND_PRIMARY_SVG);
  expect(readFileSync('assets/brand/candidate/horizontal-light.svg','utf8')).toBe(brandWordmark(false));
  expect(readFileSync('assets/brand/candidate/horizontal-dark.svg','utf8')).toBe(brandWordmark(true));
  for(const svg of [BRAND_ICON_SVG,brandWordmark(false),brandWordmark(true)])expect(svg).not.toMatch(/<script|foreignObject|href=|onload=/);
 });
 it('contains seven actual Windows icon PNG resolutions with valid offsets',()=>{
  const ico=readFileSync('assets/brand/candidate/atoum-manager.ico');
  expect(ico.readUInt16LE(0)).toBe(0);expect(ico.readUInt16LE(2)).toBe(1);expect(ico.readUInt16LE(4)).toBe(7);
  let previous=6+16*7;
  [16,24,32,48,64,128,256].forEach((size,index)=>{
   const at=6+index*16,length=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);
   expect(offset).toBe(previous);expect(offset+length).toBeLessThanOrEqual(ico.length);
   const png=ico.subarray(offset,offset+length);expect(png.readUInt32BE(0)).toBe(0x89504e47);
   expect(png.readUInt32BE(16)).toBe(size);expect(png.readUInt32BE(20)).toBe(size);expect(png[25]).toBe(6);
   previous=offset+length;
  });expect(previous).toBe(ico.length);
 });
});
