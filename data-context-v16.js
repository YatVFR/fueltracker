(function(){
  'use strict';
  if(window.FuelTrackerDataContextV16)return;
  const REV='v16.3.7-data-context-1';

  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches===true||navigator.standalone===true;}
  function contextLabel(){return isStandalone()?'Web App Local Store':'Browser Local Store';}
  function toast(message,tone='info'){
    let el=document.getElementById('ftGlobalToast');
    if(!el){el=document.createElement('div');el.id='ftGlobalToast';el.style.cssText='position:fixed;left:50%;bottom:28px;z-index:2147483600;transform:translateX(-50%);max-width:min(420px,88vw);padding:10px 13px;border:1px solid #344550;border-radius:10px;background:#0b141b;color:#eef3f6;font:800 10px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 14px 38px rgba(0,0,0,.45);opacity:0;transition:opacity .2s ease;pointer-events:none;text-align:center';document.body.appendChild(el);}
    el.textContent=message;el.style.borderColor=tone==='ok'?'#2f6f45':tone==='warn'?'#7a5c20':'#344550';el.style.opacity='1';clearTimeout(toast.t);toast.t=setTimeout(()=>{el.style.opacity='0';},3200);
  }
  function ensureCard(){
    const settings=document.querySelector('#settingsBox .settings');if(!settings)return null;
    let card=document.getElementById('dataContextSetting');if(card)return card;
    card=document.createElement('div');card.className='setting';card.id='dataContextSetting';
    card.innerHTML=`<div class="label">Local Data Context</div><strong id="dataContextName"></strong><p>On iPhone, the Home Screen Web App and Safari keep separate local website data. Changes made in one do not automatically appear in the other.</p><div class="actions"><button type="button" class="secondary" id="dataContextExport">EXPORT GARAGE TO SYNC</button><button type="button" class="secondary" id="dataContextRestore">RESTORE GARAGE HERE</button></div>`;
    settings.appendChild(card);
    card.querySelector('#dataContextExport').onclick=()=>document.getElementById('garageBackupExport')?.click();
    card.querySelector('#dataContextRestore').onclick=()=>document.getElementById('garageBackupImport')?.click();
    return card;
  }
  function render(){const card=ensureCard();const name=card?.querySelector('#dataContextName');if(name)name.textContent=contextLabel();}
  render();setTimeout(render,350);setTimeout(render,1000);document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(render,60);});
  window.FuelTrackerToast=toast;
  window.FuelTrackerDataContextV16={revision:REV,isStandalone,contextLabel,render,toast};
})();