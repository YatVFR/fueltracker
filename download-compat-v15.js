(function(){
  'use strict';
  if(window.FuelTrackerDownloadCompat)return;

  const nativeClick=HTMLAnchorElement.prototype.click;
  const nativeCreate=URL.createObjectURL.bind(URL);
  const nativeRevoke=URL.revokeObjectURL.bind(URL);
  const blobUrls=new Map();

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true || window.navigator.standalone===true;
  }

  function shareBlob(blob,name){
    if(!isStandalone() || typeof navigator.share!=='function')return false;
    try{
      const file=new File([blob],name||'FuelTrackerExport',{type:blob.type||'application/octet-stream',lastModified:Date.now()});
      if(typeof navigator.canShare==='function' && !navigator.canShare({files:[file]}))return false;
      navigator.share({files:[file],title:name||'Fuel Tracker Export'}).catch(err=>{
        if(err?.name!=='AbortError')console.warn('Fuel Tracker native share failed.',err);
      });
      return true;
    }catch(err){
      console.warn('Fuel Tracker native share unavailable.',err);
      return false;
    }
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
    try{a.click();}finally{
      setTimeout(()=>a.remove(),1800);
      setTimeout(()=>URL.revokeObjectURL(url),3000);
    }
  }

  async function exportFile(content,name,type){
    const blob=content instanceof Blob?content:new Blob([content],{type:type||'application/octet-stream'});
    if(shareBlob(blob,name))return {method:'share'};
    directDownload(blob,name,type);
    return {method:'download'};
  }

  URL.createObjectURL=function(object){
    const url=nativeCreate(object);
    if(object instanceof Blob)blobUrls.set(url,object);
    return url;
  };

  HTMLAnchorElement.prototype.click=function(){
    const href=String(this.href||'');
    const blobDownload=this.hasAttribute('download')&&href.startsWith('blob:');
    if(!blobDownload)return nativeClick.call(this);

    const blob=blobUrls.get(href);
    if(blob && shareBlob(blob,this.download||'FuelTrackerExport'))return;

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
    if(value.startsWith('blob:')){
      setTimeout(()=>{blobUrls.delete(value);nativeRevoke(url);},3500);
      return;
    }
    nativeRevoke(url);
  };

  window.FuelTrackerExportFile=exportFile;
  window.FuelTrackerDownloadCompat={revision:'v15.7-download-compat-3',isStandalone,exportFile,directDownload};
})();
