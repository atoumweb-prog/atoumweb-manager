'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(process.argv[2] || '');
assert(fs.existsSync(path.join(root, 'LANCER-RECETTE-TEST.cmd')), 'Livraison de recette requise.');
const profile = path.join(root, 'Profil-RECETTE');
const workspace = path.join(root, 'Workspace-RECETTE');
const child = cp.spawn('cmd.exe', ['/c', path.join(root, 'LANCER-RECETTE-TEST.cmd')], { cwd: root, windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let sequence = 0;
const pending = new Map();

async function until(fn, label) {
  const start = Date.now();
  while (Date.now() - start < 30000) {
    if (await fn()) return;
    await sleep(100);
  }
  throw new Error(`Timeout : ${label}`);
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

(async () => {
  try {
    let port;
    await until(() => {
      try {
        const lines = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/);
        port = Number(lines[0]);
        return Number.isInteger(port) && port > 0 && lines[1]?.startsWith('/devtools/browser/');
      } catch (error) {
        if (['ENOENT', 'EBUSY'].includes(error.code)) return false;
        throw error;
      }
    }, 'demarrage du lanceur Windows');
    let page;
    await until(async () => {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = pages.find(candidate => candidate.type === 'page' && candidate.url.includes('functionalRecipe=1'));
      return Boolean(page);
    }, 'renderer RECETTE / TEST');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.onmessage = message => {
      const event = JSON.parse(message.data);
      if (!event.id) return;
      const task = pending.get(event.id);
      if (!task) return;
      pending.delete(event.id);
      event.error ? task.reject(new Error(JSON.stringify(event.error))) : task.resolve(event.result);
    };
    await send('Runtime.enable');
    await until(() => evaluate('Boolean(window.atoumweb && document.querySelector(".aw-manager-shell"))'), 'shell du Manager');
    const state = await evaluate(`({title:document.title,banner:document.querySelector('.functional-recipe-banner')?.textContent,workspace:null})`);
    const bootstrap = await evaluate('window.atoumweb.app.getBootstrap()');
    assert.match(state.title, /RECETTE \/ TEST/);
    assert.match(state.banner, /RECETTE \/ TEST/);
    assert.equal(path.resolve(bootstrap.workspacePath), path.resolve(workspace));
    await send('Page.close');
    console.log(JSON.stringify({ launcher: path.join(root, 'LANCER-RECETTE-TEST.cmd'), workspace: bootstrap.workspacePath, title: state.title, banner: state.banner, validated: true }, null, 2));
  } finally {
    socket?.close();
    child.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
