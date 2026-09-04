(function(){
  'use strict';
  if(window.FuelTrackerDownloadCompat)return;

  const nativeClick=HTMLAnchorElement.prototype.click;
  const nativeRevoke=URL.revokeObjectURL.bind(URL);

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
    finally{
      if(!attached)setTimeout(()=>this.remove(),1800);
    }
  };

  URL.revokeObjectURL=function(url){
    const value=String(url||'');
    if(value.startsWith('blob:')){
      setTimeout(()=>nativeRevoke(url),2500);
      return;
    }
    nativeRevoke(url);
  };

  window.FuelTrackerDownloadCompat={revision:'v15.7-download-compat-1'};
})();
