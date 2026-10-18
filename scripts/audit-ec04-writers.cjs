// Source inventory only. Never imports services or opens a workspace.
'use strict';
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'outputs','ec04-msi');fs.mkdirSync(out,{recursive:true});
const files=[];function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())visit(f);else if(e.name.endsWith('.ts')&&!e.name.endsWith('.test.ts'))files.push(f);}}visit(path.join(repo,'src','main'));
const rows=[];const names=new Set(['writeFileSync','writeFile','appendFile','appendFileSync','mkdir','mkdirSync','copyFile','copyFileSync','rename','renameSync','unlink','unlinkSync','rm','rmSync','rmdir','rmdirSync','openSync','createWriteStream','linkSync','symlinkSync','truncate','truncateSync','chmodSync']);
for(const file of files){const text=fs.readFileSync(file,'utf8'),source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);const imports=new Map();for(const s of source.statements){if(!ts.isImportDeclaration(s)||!['node:fs','node:fs/promises'].includes(s.moduleSpecifier.text))continue;const bind=s.importClause?.namedBindings;if(bind&&ts.isNamedImports(bind))for(const item of bind.elements)imports.set(item.name.text,(item.propertyName||item.name).text);}
 const walk=node=>{if(ts.isCallExpression(node)){const e=node.expression,method=ts.isPropertyAccessExpression(e)?e.name.text:ts.isIdentifier(e)?e.text:'';let kind;
 if(ts.isIdentifier(e)&&names.has(imports.get(method)))kind='filesystem-candidate';
 else if(ts.isPropertyAccessExpression(e)&&names.has(method)&&/^(fs|fs\.promises|promises)\b/.test(e.expression.getText(source)))kind='filesystem-candidate';
 else if(ts.isPropertyAccessExpression(e)&&['run','exec','backupTo','close'].includes(method)&&/database|\bdb\b|\.prepare\(/i.test(e.expression.getText(source)))kind='sqlite-candidate';
 if(kind){let parent=node.parent;while(parent&&!ts.isFunctionLike(parent))parent=parent.parent;rows.push({file:path.relative(repo,file).replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,scope:parent?.name?.getText(source)||'(callback/module)',kind,call:e.getText(source),sourceSha256:crypto.createHash('sha256').update(text).digest('hex')});}}
 ts.forEachChild(node,walk);};walk(source);
}
const result={sourceOnly:true,coverageCertified:false,sourceFiles:files.length,candidates:rows.length,notes:'Heuristic AST inventory, not proof of complete runtime or multi-process coverage. openSync/close and migrations deliberately overincluded.',rows};fs.writeFileSync(path.join(out,'writers-inventory.json'),JSON.stringify(result,null,2));console.log('EC04_WRITER_INVENTORY '+JSON.stringify({sourceFiles:files.length,candidates:rows.length,filesWithCandidates:new Set(rows.map(x=>x.file)).size}));
