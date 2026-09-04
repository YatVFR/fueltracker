(function(){
  'use strict';
  if(window.FuelTrackerDownloadCompat)return;

  const nativeClick=HTMLAnchorElement.prototype.click;
  const nativeRevoke=URL.revokeObjectURL.bind(URL);

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || window.navigator.standalone===true;
  }

  function directDownload(content,name,type){
    const blob=content instanceof Blob?content:new Blob([content],{type:type||'application/octet-stream'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=name||'FuelTrackerExport';
    a.style.position='fixed';
    a.style.left='-9999px';
    a.style.top='-9999px';
    a.style.width='1px';
    a.style.height='1px';
    a.style.opacity='0';
    document.body.appendChild(a);
    try{nativeClick.call(a);}finally{
      setTimeout(()=>a.remove(),1800);
      setTimeout(()=>nativeRevoke(url),3000);
    }
  }

  async function exportFile(content,name,type){
    const mime=type||'application/octet-stream';
    const file=new File([content],name||'FuelTrackerExport',{type:mime,lastModified:Date.now()});
    if(isStandalone() && typeof navigator.share==='function'){
      try{
        if(typeof navigator.canShare!=='function' || navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:name||'Fuel Tracker Export'});
          return {method:'share'};
        }
      }catch(err){
        if(err?.name==='AbortError')return {method:'share-cancelled'};
        console.warn('Fuel Tracker native share failed; falling back to download.',err);
      }
    }
    directDownload(content,name,mime);
    return {method:'download'};
  }

  HTMLAnchorElement.prototype.click=function(){
    const href=String(this.href||'');
    const blobDownload=this.hasAttribute('download')&&href.startsWith('blob:');
    if(!blobDownload)return nativeClick.call(this);

    const attached=this.isConnected;
    if(!attached){
      this.style.position='fixed';
      this.style.left='-9999px';
      this.style.top='-9999px';
      this.style.width='1px';
      this.style.height='1px';
      this.style.opacity='0';
      document.body.appendChild(this);
    }
    try{return nativeClick.call(this);}
    finally{if(!attached)setTimeout(()=>this.remove(),1800);}
  };

  URL.revokeObjectURL=function(url){
    const value=String(url||'');
    if(value.startsWith('blob:')){setTimeout(()=>nativeRevoke(url),3000);return;}
    nativeRevoke(url);
  };

  window.FuelTrackerExportFile=exportFile;
  window.FuelTrackerDownloadCompat={revision:'v15.7-download-compat-2',isStandalone,exportFile,directDownload};
})();
