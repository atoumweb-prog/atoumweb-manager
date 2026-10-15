// Actual renderer: hit testing catches menus painted underneath the global header.
module.exports = async ({win, db, evalUI:js, get, wait, navigate, select, test, sleep, saveScreenshot}) => {
  const snapshot = () => JSON.stringify(db.database.all("SELECT name FROM sqlite_master WHERE type='table' AND name<>'settings' ORDER BY name").map(({name})=>[name,db.database.all('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid')]));
  const before=snapshot(), originalSize=win.getSize(), originalZoom=win.webContents.getZoomFactor();
  await js('window.__railTimer=document.querySelector(".global-timer")');
  const click=async selector=>{await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(70);};
  const visible=selector=>get(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`);
  async function inspect(label){
    await wait('!!document.querySelector(".aw-rail-flyout")','open group');
    test(await get('document.activeElement===document.querySelector(".aw-rail-flyout .aw-rail-destination")'),'Opening group focuses first destination '+label);
    test(await visible('.aw-rail-flyout h2'),'Flyout title painted and unobscured '+label);
    test(await visible('.aw-rail-flyout [aria-label="Fermer le groupe"]'),'Close painted and clickable '+label);
    test(await visible('.aw-rail-flyout .aw-rail-destination'),'First destination painted and clickable '+label);
    test(await get('(()=>{const r=document.querySelector(".aw-rail-flyout").getBoundingClientRect(),h=document.querySelector(".aw-workspace-header").getBoundingClientRect();return r.top>=h.bottom&&r.bottom<=innerHeight&&r.right<=innerWidth;})()'),'Menu inside viewport below header '+label);
    await js('document.querySelector(".aw-rail-flyout .aw-rail-row:last-child .aw-rail-destination").scrollIntoView({block:"nearest"})');
    test(await visible('.aw-rail-flyout .aw-rail-row:last-child .aw-rail-destination'),'Last destination accessible by scrolling '+label);
    test(await visible('.aw-rail-flyout [aria-label="Fermer le groupe"]'),'Sticky close remains accessible '+label);
    await js('document.querySelector(".aw-rail-flyout .aw-rail-destination").focus()');
    win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
    win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
    await wait('!document.querySelector(".aw-rail-flyout")','Escape closes group');
    test(await get('document.activeElement.matches("[data-nav-group]")'),'Escape restores group focus '+label);
  }
  try {
    win.show();win.focus();win.webContents.focus();
    for(const [theme,name] of [['atoumweb','AtoumWeb'],['noir','Noir'],['blanc','Blanc']]){
      for(const [density,label,font,height] of [['compact','Compact',14,36],['comfort','Confort',16,42],['comfort_plus','Confort +',18,48]]){
        await select(theme,name,density,label,font,height);
        await click('.aw-rail-toggle');
        const groups=await get('[...document.querySelectorAll("[data-nav-group]")].map(e=>e.dataset.navGroup)');
        for(const group of groups){
          await click('[data-nav-group='+JSON.stringify(group)+']');
          if(group===groups[0])await saveScreenshot?.(theme,density,'Réglages','rail-reduit');
          await inspect(theme+'/'+density+'/'+group);
        }
      }
    }
    for(const [width,height,zoom] of [[850,750,1],[500,700,1],[1100,800,1.5]]){
      win.setSize(width,height);win.webContents.setZoomFactor(zoom);await sleep(150);
      if(await get('document.querySelector(".aw-navigation-rail").dataset.railCollapsed!=="true"'))await click('.aw-rail-toggle');
      await click('[data-nav-group]');await inspect(width+'/'+height+'/'+zoom);
      await click('#header-mode');await click('[data-nav-group]');await inspect('compact '+width+'/'+zoom);
      await click('[data-nav-group]');win.setSize(width+50,height-50);await sleep(150);await inspect('resize while open '+width);
    }
    test(await get('window.__railTimer===document.querySelector(".global-timer")&&document.querySelectorAll(".global-timer").length===1'),'Exact unique real timer remains mounted');
    win.webContents.setZoomFactor(1);win.setSize(...originalSize);await sleep(150);
    await click('[data-nav-group]');
    const closePoint=await get('(()=>{const r=document.querySelector(".aw-rail-flyout header button").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()');
    win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...closePoint});
    win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...closePoint});
    await wait('!document.querySelector(".aw-rail-flyout")','Native pointer closes group');
    test(await get('document.activeElement.matches("[data-nav-group]")'),'Native close returns focus to group');
    test(snapshot()===before,'No domain mutation from rail presentation');
    test(db.database.get('PRAGMA integrity_check').integrity_check==='ok','Rail fixture SQLite integrity');
    test(db.database.all('PRAGMA foreign_key_check').length===0,'Rail fixture foreign keys');
  } finally {
    win.webContents.setZoomFactor(originalZoom);win.setSize(...originalSize);
    if(await get('!!document.querySelector(".aw-workspace-header")')){
      if(await get('document.querySelector(".aw-workspace-header").dataset.headerCompact==="true"'))await click('#header-mode');
      await select('atoumweb','AtoumWeb','comfort','Confort',16,42);
      await navigate('Réglages');
    }
  }
};
