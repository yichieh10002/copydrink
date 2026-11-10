'use strict';
// Search the already loaded publication data; no requests per keystroke.
(function(root){
 function findMatches({brands,drinks,types,q,limit=80}){
  const norm=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s\u200b]+/g,'');
  const needle=norm(q),rank=values=>Math.min(...values.map(value=>{const text=norm(value);return text===needle?0:text.startsWith(needle)?1:text.includes(needle)?2:99;}));
  if(!needle)return {items:brands.slice(0,limit).map(b=>({kind:'brand',brand:b.name,rank:0})),total:brands.length};
  const matches=[];
  for(const b of brands){const score=rank([b.name,...(b.aliases||[])]);if(score<99)matches.push({kind:'brand',brand:b.name,rank:score});}
  for(const d of drinks){
   const type=types.find(t=>t.id===d.type),nameRank=rank([d.name]),otherRank=rank([d.brand,d.menuCategory,d.note,type?.label,...(type?.aliases||[])]);
   if(nameRank<99||otherRank<99)matches.push({kind:'drink',brand:d.brand,id:d.id,name:d.name,category:d.menuCategory,rank:nameRank<99?nameRank:3});
  }
  matches.sort((a,b)=>a.rank-b.rank||(a.kind===b.kind?0:a.kind==='brand'?-1:1));
  return {items:matches.slice(0,limit),total:matches.length};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={findMatches};else root.TeaSearch={findMatches};
})(typeof window!=='undefined'?window:globalThis);
