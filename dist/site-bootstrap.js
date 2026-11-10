'use strict';
(async()=>{
 const result=await TeaPublished.load(TEA_CLOUD_CONFIG);
 window.TEA_PUBLISHED_STATUS=result;
 for(const src of ['ui.js','search-model.js','menu-view.js','app.js','store-view.js','order.js','home-tools.js']){
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=src+'?v=93';
   script.onload=resolve;
   script.onerror=reject;
   document.head.append(script);
  });
 }
})();
