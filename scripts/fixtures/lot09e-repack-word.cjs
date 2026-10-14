'use strict';
// Native test-only repack: simulate a human saving changed text in a DOCX,
// without requiring Microsoft Word or loading untrusted plugins.
const zlib=require('node:zlib');
const crcTable=Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
const crc32=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
module.exports=(zip,before,after)=>{
 let end=-1;for(let p=zip.length-22;p>=0;p--){if(zip.readUInt32LE(p)===0x06054b50){end=p;break;}}
 if(end<0)throw Error('Fixture DOCX ZIP ending missing');
 let p=zip.readUInt32LE(end+16);const count=zip.readUInt16LE(end+10);
 const data=[],center=[];let offset=0,modified=false;
 for(let i=0;i<count;i++){
  if(zip.readUInt32LE(p)!==0x02014b50)throw Error('Central ZIP missing');
  const nameLen=zip.readUInt16LE(p+28),extra=zip.readUInt16LE(p+30),comment=zip.readUInt16LE(p+32);
  const name=zip.subarray(p+46,p+46+nameLen).toString();
  const local=zip.readUInt32LE(p+42),compressed=zip.readUInt32LE(p+20),method=zip.readUInt16LE(p+10);
  const contentStart=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28);
  let value=method===8?zlib.inflateRawSync(zip.subarray(contentStart,contentStart+compressed))
    :Buffer.from(zip.subarray(contentStart,contentStart+compressed));
  if(name==='word/document.xml'){
   const previous=value.toString('utf8');
   if(!previous.includes(before))throw Error('Text to revise absent from real Word XML');
   value=Buffer.from(previous.replace(before,after));modified=true;
  }
  const key=Buffer.from(name);const crc=crc32(value);
  const lh=Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt16LE(0x800,6);
  lh.writeUInt16LE(0,8);lh.writeUInt32LE(crc,14);lh.writeUInt32LE(value.length,18);
  lh.writeUInt32LE(value.length,22);lh.writeUInt16LE(key.length,26);
  data.push(lh,key,value);
  const ch=Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);
  ch.writeUInt16LE(0x800,8);ch.writeUInt32LE(crc,16);
  ch.writeUInt32LE(value.length,20);ch.writeUInt32LE(value.length,24);
  ch.writeUInt16LE(key.length,28);ch.writeUInt32LE(offset,42);
  center.push(ch,key);offset+=lh.length+key.length+value.length;
  p+=46+nameLen+extra+comment;
 }
 if(!modified)throw Error('Real Word document.xml part missing');
 const directory=Buffer.concat(center),eocd=Buffer.alloc(22);
 eocd.writeUInt32LE(0x06054b50,0);eocd.writeUInt16LE(count,8);eocd.writeUInt16LE(count,10);
 eocd.writeUInt32LE(directory.length,12);eocd.writeUInt32LE(offset,16);
 return Buffer.concat([...data,directory,eocd]);
};