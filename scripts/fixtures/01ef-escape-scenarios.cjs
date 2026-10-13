// Permanent native regressions, called only by the owned TEMP 01F harness.
module.exports = async function checkEscapeOwnership({win, js, get, wait, input, click, assert, dialogs, replies, preferences}) {
  const form = id => `article[data-editor-id=${id}]`;
  const note = id => `${form(id)} input`;
  const value = selector => get(`document.querySelector(${JSON.stringify(selector)})?.value`);
  const instance = () => get('document.querySelector("[data-editor-instance]")?.dataset.editorInstance??null');
  const snapshot = await preferences();
  const tableToken = await instance();
  await js('window.__escapeNodes={a:document.querySelector("article[data-editor-id=a]"),b:document.querySelector("article[data-editor-id=b]"),table:document.querySelector("[data-editor-instance]")};');
  const mounted = async () => assert(await get('window.__escapeNodes.a===document.querySelector("article[data-editor-id=a]")&&window.__escapeNodes.b===document.querySelector("article[data-editor-id=b]")&&window.__escapeNodes.table===document.querySelector("[data-editor-instance]")'),'Escape/hidden tabs preserve exact mounted DOM identities');
  async function escape(selector) {
    win.focus(); win.webContents.focus(); await wait('document.hasFocus()');
    await js(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    const before = dialogs.length;
    win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
    win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
    await new Promise(resolve => setTimeout(resolve,80));
    return dialogs.slice(before);
  }
  function only(confirmations, label, pending = false) {
    assert(confirmations.length===1, 'Exactly one confirmation for the active '+label);
    assert(confirmations[0].detail===label, 'Confirmation belongs only to '+label);
    assert(confirmations[0].defaultId===0, 'Stay is the default');
    assert(confirmations[0].buttons.join('|')===(pending?'Rester':'Rester|Quitter sans enregistrer'), 'Pending/dirty choices stay unchanged');
  }
  await input('#table-record-note','TABLE ESC TEST');
  await click('Formulaires et états');
  await input(note('a'),'FORM A ESC'); await input(note('b'),'FORM B ESC');
  only(await escape(note('a')), 'Brouillon du Dossier fictif A');
  assert(await value(note('a'))==='FORM A ESC'&&await value(note('b'))==='FORM B ESC'&&await value('#table-record-note')==='TABLE ESC TEST','Stay preserves all three drafts without a hidden-table prompt');
  assert(await instance()===tableToken,'Dirty hidden table keeps its selected instance'); await mounted();

  // Second originally failing reproduction: clean hidden table must not close.
  await input('#table-record-note','');
  only(await escape(note('a')), 'Brouillon du Dossier fictif A');
  assert(await instance()===tableToken&&await value(note('a'))==='FORM A ESC','Stay preserves the clean hidden selected record and active form draft'); await mounted();

  // Escape outside either workshop never owns a record/form close.
  assert((await escape('#foundation-theme')).length===0,'Appearance command Escape triggers no editor confirmation'); await mounted();
  const beforeHidden = dialogs.length;
  await js('document.querySelector("#table-record-note").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));');
  assert(dialogs.length===beforeHidden&&await instance()===tableToken,'Inactive table ignores even a dispatched hidden Escape');
  await input('#table-record-note','TABLE ESC TEST');

  for(let i=0;i<3;i++) { await click('Tableau et fiche'); await click('Formulaires et états'); }
  assert(dialogs.length===beforeHidden,'Changing presentation tabs asks no discard'); await mounted();
  assert(await value(note('a'))==='FORM A ESC'&&await value(note('b'))==='FORM B ESC'&&await value('#table-record-note')==='TABLE ESC TEST','Tab changes preserve independent draft texts');
  await click('Tableau et fiche');
  only(await escape('#table-record-note'), 'Note du dossier fictif');
  assert(await value(note('a'))==='FORM A ESC'&&await value(note('b'))==='FORM B ESC'&&await value('#table-record-note')==='TABLE ESC TEST','Reverse Escape Stay touches only the table guard'); await mounted();
  const beforeHiddenForm = dialogs.length;
  await js('document.querySelector("article[data-editor-id=a] input").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));');
  assert(dialogs.length===beforeHiddenForm&&await value(note('a'))==='FORM A ESC','Inactive form ignores dispatched Escape');
  await js('const e=new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true});e.preventDefault();document.querySelector("#table-record-note").dispatchEvent(e);');
  assert(dialogs.length===beforeHiddenForm&&await instance()===tableToken,'Consumed Escape never closes the active table');
  await js('document.querySelector("#table-record-note").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",isComposing:true,bubbles:true,cancelable:true}));');
  assert(dialogs.length===beforeHiddenForm&&await instance()===tableToken,'IME composition Escape never closes the table');

  // A real nested help layer has priority over its table editor.
  await js('document.querySelector("#table-record-note").closest(".aw-ui-field").querySelector(".field-help").click()');
  await wait('document.querySelector(".field-help-detail")');
  assert((await escape('.field-help-detail-close')).length===0,'Nested help Escape never triggers table or form discard');
  assert(await get('!document.querySelector(".field-help-detail")&&document.activeElement.classList.contains("field-help")'),'Help closes only its own layer and returns focus'); await mounted();
  only(await escape('#table-record-note'), 'Note du dossier fictif');
  await click('Formulaires et états');
  const beforeHandled = dialogs.length;
  await js('const e=new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true});e.preventDefault();document.querySelector("article[data-editor-id=a] input").dispatchEvent(e);');
  assert(dialogs.length===beforeHandled,'Already-consumed Escape is not handled twice');
  await js('document.querySelector("article[data-editor-id=a] input").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",isComposing:true,bubbles:true,cancelable:true}));');
  assert(dialogs.length===beforeHandled,'IME composition Escape never abandons a form');

  // Pending keeps its existing Stay-only guard, including while tabs change.
  await js('document.querySelector("article[data-editor-id=a] button").click()');
  await wait('document.querySelector("article[data-editor-id=a] [data-form-feedback]").dataset.formFeedback==="pending"');
  only(await escape(note('a')), 'Brouillon du Dossier fictif A', true);
  assert(await value(note('a'))==='FORM A ESC'&&await instance()===tableToken,'Pending Escape preserves active save and hidden table');
  await input(note('a'),'NEWER A ESC'); await click('Tableau et fiche');
  only(await escape('#table-record-note'), 'Note du dossier fictif');
  await wait('document.querySelector("article[data-editor-id=a] [data-form-feedback]").dataset.formFeedback==="dirty"');
  assert(await value(note('a'))==='NEWER A ESC'&&await value('#table-record-note')==='TABLE ESC TEST','Late save response preserves newer hidden draft and table draft'); await mounted();

  // Explicit abandonment must close only its target. No hidden editor remount.
  await click('Formulaires et états'); replies.push(1);
  only(await escape(note('a')), 'Brouillon du Dossier fictif A');
  assert(await get('!document.querySelector("article[data-editor-id=a]")&&window.__escapeNodes.b===document.querySelector("article[data-editor-id=b]")'),'Quit form A closes A only, keeps B mounted');
  assert(await value(note('b'))==='FORM B ESC'&&await value('#table-record-note')==='TABLE ESC TEST'&&await instance()===tableToken,'Quit form A never abandons table or B');
  await click('Ouvrir A'); await input(note('a'),'REOPENED A ESC');
  await js('window.__escapeNodes.a=document.querySelector("article[data-editor-id=a]")');
  await click('Tableau et fiche'); replies.push(1);
  only(await escape('#table-record-note'), 'Note du dossier fictif');
  assert(await instance()===null&&await get('window.__escapeNodes.a===document.querySelector("article[data-editor-id=a]")&&window.__escapeNodes.b===document.querySelector("article[data-editor-id=b]")'),'Quit table closes only its selected record, not hidden forms');
  assert(await value(note('a'))==='REOPENED A ESC'&&await value(note('b'))==='FORM B ESC','Quit table preserves both hidden form texts');
  await input(note('a'),''); await input(note('b'),'');
  assert(await preferences()===snapshot,'Escape/guards/tab changes write no visual preference');
  console.log('01EF_ESCAPE_REGRESSIONS passed, exact confirmation counts and mounted identities verified');
};
