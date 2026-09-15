(function(){
  'use strict';
  if(window.FuelTrackerSmartCaptureV16)return;

  const REV='v16.4.0-smart-capture-1';
  const OCR_SRC='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  let ocrPromise=null,lastOcrText='';

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;}
  function field(id){return document.getElementById(id);}
  function records(){try{return typeof currentRecords==='function'?currentRecords():[];}catch(e){return [];}}
  function save(){try{saveState?.();}catch(e){}}

  function installStyles(){
    if(field('v164SmartCaptureStyles'))return;
    const s=document.createElement('style');s.id='v164SmartCaptureStyles';s.textContent=`
      .ft-details{margin:8px 0;border:1px solid #293641;border-radius:10px;background:#091017;overflow:hidden}.ft-details>summary{list-style:none;cursor:pointer;padding:10px 11px;font-size:9px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;display:flex;justify-content:space-between;gap:8px;align-items:center}.ft-details>summary::-webkit-details-marker{display:none}.ft-details>summary span{color:#7f8b96;font-size:7px;font-weight:700;letter-spacing:0;text-transform:none}.ft-details[open]>summary{border-bottom:1px solid #22303a}.ft-details-body{padding:10px}.ft-scan-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ft-scan-btn{display:flex;align-items:center;justify-content:center;min-height:42px;border:1px solid #315d86;border-radius:9px;background:#0d1b27;color:#dbe9f7;font-size:8px;font-weight:900;letter-spacing:.05em;text-align:center;cursor:pointer}.ft-scan-btn input{display:none}.ft-scan-status{margin-top:8px;padding:8px;border:1px dashed #2b3945;border-radius:8px;color:#8997a2;font-size:8px;line-height:1.45}.ft-scan-status strong{color:#dfe8ee}.ft-progress{height:4px;margin-top:6px;border-radius:999px;background:#18242d;overflow:hidden}.ft-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#0d62d9,#5aa2ff);transition:width .2s ease}.ft-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ft-price-grid .field{margin:0}.ft-calc{margin-top:8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.ft-calc>div{border:1px solid #27343f;border-radius:8px;background:#0a1117;padding:8px}.ft-calc small{display:block;color:#7f8b96;font-size:6.5px;text-transform:uppercase}.ft-calc strong{display:block;margin-top:3px;font-size:11px}.ft-history-toggle{margin-left:auto;border:1px solid #35434e;border-radius:7px;background:#0d151c;color:#a9b2b9;padding:6px 8px;font-size:7px;font-weight:900}.ft-history-collapsed .table-wrap{display:none}.ft-history-summary{display:none;color:#7f8b96;font-size:8px;margin-top:7px}.ft-history-collapsed .ft-history-summary{display:block}.ft-ocr-diagnostics{margin-top:7px}.ft-ocr-diagnostics pre{white-space:pre-wrap;max-height:150px;overflow:auto;font:7px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#87939e}.ft-privacy{margin-top:7px;color:#71808a;font-size:7px;line-height:1.4}@media(max-width:580px){.ft-scan-grid,.ft-price-grid{grid-template-columns:1fr}.ft-calc{grid-template-columns:1fr 1fr}.ft-calc>div:last-child{grid-column:1/-1}}
    `;document.head.appendChild(s);
  }

  function ensureUi(){
    installStyles();const form=field('fuelForm');if(!form||field('ftSmartCapture'))return;
    const anchor=field('editId');
    const scan=document.createElement('details');scan.id='ftSmartCapture';scan.className='ft-details';scan.open=true;
    scan.innerHTML=`<summary>📷 Scan & Prefill <span>Pump/receipt + odometer</span></summary><div class="ft-details-body"><div class="ft-scan-grid"><label class="ft-scan-btn">SCAN PUMP / RECEIPT<input id="ftPumpScanInput" type="file" accept="image/*"></label><label class="ft-scan-btn">SCAN ODOMETER<input id="ftOdoScanInput" type="file" accept="image/*"></label></div><div class="ft-scan-status" id="ftScanStatus"><strong>Ready.</strong> Photos are processed on this device and are not stored in the MasterDB.<div class="ft-progress"><i id="ftScanProgress"></i></div></div><details class="ft-ocr-diagnostics"><summary>Scan diagnostics</summary><pre id="ftOcrText">No scan yet.</pre></details><div class="ft-privacy">OCR loads only when you scan. The first scan needs internet access to load the recognition engine; extracted values stay in the browser.</div></div>`;
    anchor?.insertAdjacentElement('afterend',scan);

    const costGrid=field('cost')?.closest('.grid2');
    const pay=document.createElement('details');pay.id='ftDiscountDetails';pay.className='ft-details';
    pay.innerHTML=`<summary>Discount & Payment <span>Optional station/card discount</span></summary><div class="ft-details-body"><div class="ft-price-grid"><div class="field"><label for="ftPumpAmount">Pump / Receipt Amount</label><input id="ftPumpAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Gross amount"></div><div class="field"><label for="ftUnitPrice">Displayed Price / Litre</label><input id="ftUnitPrice" type="number" min="0" step="0.001" inputmode="decimal" placeholder="e.g. 4.150"></div></div><div class="ft-price-grid" style="margin-top:7px"><div class="field"><label for="ftDiscountType">Discount Type</label><select id="ftDiscountType"><option value="none">No discount</option><option value="fixed">Fixed amount</option><option value="perLitre">Sen / cents per litre</option><option value="percent">Percentage</option></select></div><div class="field"><label for="ftDiscountValue">Discount Value</label><input id="ftDiscountValue" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0"></div></div><div class="field" style="margin-top:7px"><label for="ftDiscountLabel">Discount / Membership</label><input id="ftDiscountLabel" placeholder="e.g. station promo, card, member"></div><div class="ft-calc"><div><small>Discount</small><strong id="ftDiscountAmount">—</strong></div><div><small>Final Paid</small><strong id="ftFinalPaid">—</strong></div><div><small>Effective / L</small><strong id="ftEffectivePrice">—</strong></div></div></div>`;
    costGrid?.insertAdjacentElement('afterend',pay);

    const originalCostLabel=field('cost')?.closest('.field')?.querySelector('label');if(originalCostLabel)originalCostLabel.textContent='Final Paid *';
    ['ftPumpAmount','ftUnitPrice','ftDiscountType','ftDiscountValue','volume','currency'].forEach(id=>field(id)?.addEventListener('input',recalcPayment));
    field('ftPumpScanInput')?.addEventListener('change',e=>scanImage(e.target.files?.[0],'pump'));
    field('ftOdoScanInput')?.addEventListener('change',e=>scanImage(e.target.files?.[0],'odo'));
    installHistoryCollapse();
  }

  function currencyPrefix(){return field('currency')?.value==='MYR'?'RM':'S$';}
  function recalcPayment(){
    const gross=num(field('ftPumpAmount')?.value),litres=num(field('volume')?.value),value=num(field('ftDiscountValue')?.value)||0,type=field('ftDiscountType')?.value||'none';
    let discount=0;if(gross!=null){if(type==='fixed')discount=value;else if(type==='perLitre'&&litres!=null)discount=litres*value/100;else if(type==='percent')discount=gross*value/100;discount=Math.min(Math.max(discount,0),gross);const final=Math.max(0,gross-discount);if(field('cost'))field('cost').value=final.toFixed(2);field('ftDiscountAmount').textContent=currencyPrefix()+discount.toFixed(2);field('ftFinalPaid').textContent=currencyPrefix()+final.toFixed(2);field('ftEffectivePrice').textContent=litres>0?currencyPrefix()+(final/litres).toFixed(3)+'/L':'—';}else{field('ftDiscountAmount').textContent='—';field('ftFinalPaid').textContent='—';field('ftEffectivePrice').textContent='—';}
  }

  function setStatus(title,detail='',pct=null){const box=field('ftScanStatus');if(box)box.innerHTML=`<strong>${esc(title)}</strong>${detail?' '+esc(detail):''}<div class="ft-progress"><i id="ftScanProgress"></i></div>`;const p=field('ftScanProgress');if(p&&pct!=null)p.style.width=Math.max(0,Math.min(100,pct))+'%';}
  async function loadOcr(){
    if(window.Tesseract)return window.Tesseract;if(ocrPromise)return ocrPromise;
    ocrPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=OCR_SRC;s.async=true;s.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(new Error('OCR unavailable'));s.onerror=()=>reject(new Error('Unable to load OCR engine'));document.head.appendChild(s);});return ocrPromise;
  }
  async function normalizedImage(file){
    let img,revoke=null;if(typeof createImageBitmap==='function')img=await createImageBitmap(file);else{const url=URL.createObjectURL(file);revoke=url;img=await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=reject;el.src=url;});}const max=1800,scale=Math.min(1,max/img.width),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);const d=x.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const y=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2];const v=Math.max(0,Math.min(255,(y-128)*1.35+128));d.data[i]=d.data[i+1]=d.data[i+2]=v;}x.putImageData(d,0,0);img.close?.();if(revoke)URL.revokeObjectURL(revoke);return c;
  }
  async function scanImage(file,kind){
    if(!file)return;try{setStatus('Preparing image…','',8);const T=await loadOcr();const image=await normalizedImage(file);setStatus('Reading image…','Keep this page open.',15);const res=await T.recognize(image,'eng',{logger:m=>{if(m?.status==='recognizing text')setStatus('Reading image…',Math.round((m.progress||0)*100)+'%',15+(m.progress||0)*75);}});lastOcrText=String(res?.data?.text||'');if(field('ftOcrText'))field('ftOcrText').textContent=lastOcrText||'No text detected.';if(kind==='pump')applyPump(parsePump(lastOcrText),res?.data?.confidence);else applyOdo(parseOdo(lastOcrText),res?.data?.confidence);}catch(e){setStatus('Scan failed.',e?.message||'Enter the values manually.',100);}
    finally{const input=kind==='pump'?field('ftPumpScanInput'):field('ftOdoScanInput');if(input)input.value='';}
  }

  function numericTokens(text){return (String(text).match(/\b\d{1,7}(?:[.,]\d{1,3})?\b/g)||[]).map((raw,i)=>({raw,value:num(raw),i})).filter(x=>x.value!=null);}
  function parsePump(text){
    const t=String(text).toUpperCase(),tok=numericTokens(t);let best=null;
    for(const a of tok)for(const l of tok)for(const p of tok){if(a===l||a===p||l===p)continue;if(!(a.value>=1&&a.value<=1000&&l.value>=0.5&&l.value<=150&&p.value>=50&&p.value<=1000))continue;const expected=l.value*p.value/100,err=Math.abs(expected-a.value)/Math.max(a.value,.01);if(!best||err<best.err)best={amount:a.value,litres:l.value,senPerLitre:p.value,err};}
    const station=/(PETRONAS|PETRON\b|SHELL|CALTEX|BHPETROL|BHP\b|ESSO|SPC\b|SINOPEC)/i.exec(t)?.[1]||null;
    let discount=null;const dm=/(?:DISCOUNT|REBATE|SAVING)[^\d]{0,12}(\d+(?:[.,]\d{1,2})?)/i.exec(t);if(dm)discount=num(dm[1]);
    return best&&best.err<=0.08?{...best,unitPrice:best.senPerLitre/100,station,discount,currency:/RINGGIT|\bRM\b|SEN\s*\/\s*LITRE/i.test(t)?'MYR':null}:null;
  }
  function parseOdo(text){
    const t=String(text).replace(/,/g,'.');let total=null,trip=null,consumption=null;
    const tm=/(?:TOTAL|ODO(?:METER)?)\D{0,12}(\d{4,7})/i.exec(t);if(tm)total=num(tm[1]);
    const tripm=/(?:TRIP(?:\s*CURRENT)?|CURRENT)\D{0,12}(\d{1,4}(?:\.\d)?)/i.exec(t);if(tripm)trip=num(tripm[1]);
    const cm=/(?:CONSUM(?:P\.?|PTION)?|KM\s*\/\s*L)\D{0,15}(\d{1,3}(?:\.\d)?)/i.exec(t);if(cm)consumption=num(cm[1]);
    const tok=numericTokens(t);if(total==null){const ints=tok.map(x=>x.value).filter(v=>Number.isInteger(v)&&v>=1000&&v<=9999999);if(ints.length)total=Math.max(...ints);}
    return total!=null?{total,trip,consumption}:null;
  }
  function stationOption(name){if(!name)return null;const map={PETRONAS:'Petronas (MY)',PETRON:'Petron (MY)',SHELL:'Shell (MY)',CALTEX:'Caltex (MY)',BHPETROL:'BHPetrol (MY)',BHP:'BHPetrol (MY)',ESSO:'Esso (SG)',SPC:'SPC (SG)',SINOPEC:'Sinopec (SG)'};return map[String(name).toUpperCase()]||null;}
  function applyPump(data,confidence){
    if(!data){setStatus('Values need review.','I could not confidently match amount × litres × unit price.',100);field('ftDiscountDetails').open=true;return;}
    field('ftPumpAmount').value=data.amount.toFixed(2);field('volume').value=data.litres.toFixed(3);field('ftUnitPrice').value=data.unitPrice.toFixed(3);if(data.currency){field('currency').value=data.currency;field('currency').dispatchEvent(new Event('change',{bubbles:true}));}const opt=stationOption(data.station);if(opt&&[...field('station').options].some(o=>o.value===opt))field('station').value=opt;if(data.discount!=null){field('ftDiscountType').value='fixed';field('ftDiscountValue').value=data.discount.toFixed(2);field('ftDiscountDetails').open=true;}recalcPayment();const pct=Math.round(Number(confidence)||0);setStatus('Pump values prefilling complete.',`${data.litres.toFixed(3)} L · ${currencyPrefix()}${data.amount.toFixed(2)} · ${data.senPerLitre.toFixed(1)} ${data.currency==='MYR'?'sen/L':'¢/L'} · OCR ${pct}%`,100);
  }
  function applyOdo(data,confidence){
    if(!data){setStatus('Odometer needs review.','No reliable total odometer was detected.',100);return;}
    field('mileage').value=Math.round(data.total);field('mileage').dataset.ftScanned='1';field('mileage').dataset.ftTrip=data.trip??'';field('mileage').dataset.ftConsumption=data.consumption??'';const extra=[data.trip!=null?`Trip ${data.trip} km`:null,data.consumption!=null?`Avg ${data.consumption} km/L`:null].filter(Boolean).join(' · ');setStatus('Odometer prefilling complete.',`${Math.round(data.total).toLocaleString()} km${extra?' · '+extra:''} · OCR ${Math.round(Number(confidence)||0)}%`,100);
  }

  function captureMeta(){
    const gross=num(field('ftPumpAmount')?.value),litres=num(field('volume')?.value),net=num(field('cost')?.value),dtype=field('ftDiscountType')?.value||'none',dval=num(field('ftDiscountValue')?.value)||0;let discount=0;if(gross!=null&&net!=null)discount=Math.max(0,gross-net);
    return {pumpAmount:gross,unitPrice:num(field('ftUnitPrice')?.value),discountType:dtype,discountValue:dval,discountAmount:discount,discountLabel:field('ftDiscountLabel')?.value.trim()||'',netPaid:net,effectiveUnitPrice:net!=null&&litres>0?net/litres:null,scanSource:lastOcrText?'image':null,scanTripMeter:num(field('mileage')?.dataset.ftTrip),scanOnboardConsumption:num(field('mileage')?.dataset.ftConsumption)};
  }
  function resetExtras(){lastOcrText='';['ftPumpAmount','ftUnitPrice','ftDiscountValue','ftDiscountLabel'].forEach(id=>{if(field(id))field(id).value='';});if(field('ftDiscountType'))field('ftDiscountType').value='none';if(field('ftOcrText'))field('ftOcrText').textContent='No scan yet.';field('mileage')?.removeAttribute('data-ft-scanned');if(field('mileage')){delete field('mileage').dataset.ftTrip;delete field('mileage').dataset.ftConsumption;}setStatus('Ready.','Photos are processed on this device and are not stored in the MasterDB.',0);recalcPayment();}
  function loadExtras(r){ensureUi();field('ftPumpAmount').value=r?.pumpAmount??r?.cost??'';field('ftUnitPrice').value=r?.unitPrice??'';field('ftDiscountType').value=r?.discountType||'none';field('ftDiscountValue').value=r?.discountValue??'';field('ftDiscountLabel').value=r?.discountLabel||'';if(field('mileage')){field('mileage').dataset.ftTrip=r?.scanTripMeter??'';field('mileage').dataset.ftConsumption=r?.scanOnboardConsumption??'';}if(r?.discountType&&r.discountType!=='none')field('ftDiscountDetails').open=true;recalcPayment();}

  function hookSaving(){
    const form=field('fuelForm');if(!form||form.dataset.ftSmartSaveHook)return;form.dataset.ftSmartSaveHook='1';
    const baseSave=window.saveRecord;if(typeof baseSave==='function'){form.removeEventListener('submit',baseSave);form.addEventListener('submit',function(e){const editId=field('editId')?.value||'',before=new Set(records().map(r=>r.id)),meta=captureMeta();baseSave(e);const after=records();const r=editId?after.find(x=>x.id===editId):after.find(x=>!before.has(x.id));if(r){Object.assign(r,meta);save();try{renderHistory?.();renderDashboard?.();}catch(err){}}});}
    const baseEdit=window.editRecord;if(typeof baseEdit==='function')window.editRecord=function(id){baseEdit(id);const r=records().find(x=>x.id===id);setTimeout(()=>loadExtras(r),0);};
    const baseReset=window.resetForm;if(typeof baseReset==='function')window.resetForm=function(){baseReset();resetExtras();};
  }

  function hookExport(){
    const btn=field('exportCsvBtn');if(!btn||btn.dataset.ftSmartExport)return;btn.dataset.ftSmartExport='1';btn.onclick=()=>{const rows=records();const cols=['dateTime','mileage','station','volume','cost','currency','fuelGrade','pumpAmount','unitPrice','discountType','discountValue','discountAmount','discountLabel','netPaid','effectiveUnitPrice','scanTripMeter','scanOnboardConsumption','notes'];const csv=[cols.join(',')].concat(rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))).join('\n');if(typeof downloadBlob==='function')downloadBlob(csv,(state.mode==='bike'?'Bike':'Car')+'Fuel.csv','text/csv');};
  }

  function installHistoryCollapse(){
    const body=field('historyBody'),card=body?.closest('.card');if(!card||card.dataset.ftGrouped)return;card.dataset.ftGrouped='1';const title=card.querySelector('h3');if(title){title.style.display='flex';title.style.alignItems='center';const b=document.createElement('button');b.type='button';b.className='ft-history-toggle';b.textContent='COLLAPSE';b.onclick=()=>{card.classList.toggle('ft-history-collapsed');b.textContent=card.classList.contains('ft-history-collapsed')?'EXPAND':'COLLAPSE';updateHistorySummary();};title.appendChild(b);}const s=document.createElement('div');s.className='ft-history-summary';card.appendChild(s);if(window.matchMedia?.('(max-width: 580px)').matches&&records().length>8){card.classList.add('ft-history-collapsed');const b=card.querySelector('.ft-history-toggle');if(b)b.textContent='EXPAND';}updateHistorySummary();
  }
  function updateHistorySummary(){const card=field('historyBody')?.closest('.card'),s=card?.querySelector('.ft-history-summary');if(s)s.textContent=`${records().length} refuel record${records().length===1?'':'s'} grouped here.`;}

  ensureUi();hookSaving();hookExport();document.addEventListener('fueltracker:datachange',()=>{ensureUi();updateHistorySummary();});window.FuelTrackerSmartCaptureV16={revision:REV,parsePump,parseOdo,recalcPayment};
})();
