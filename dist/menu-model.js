'use strict';
// Shared menu-document rules used by the editor and published-menu adapter.
(function(root){
 const clone=value=>JSON.parse(JSON.stringify(value));
 const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
 function categoriesFor(document){
  if(Array.isArray(document.brand.categories))return clone(document.brand.categories);
  const brand=document.brand;
  return [...new Set([...(brand.menus||[]),...(document.items||[]).map(item=>item.menuCategory)])].map((name,index)=>({
   id:'category-'+index,name,tags:clone(brand.categoryTags?.[name]||[]),
   ...(brand.categoryLabels?.[name]&&brand.categoryLabels[name]!==name?{label:brand.categoryLabels[name]}:{})
  }));
 }
 function validateCategories(categories){
  if(!Array.isArray(categories)||categories.length>200)throw Error('每家店最多 200 個分類');
  const ids=new Set(),names=new Set();
  for(const category of categories){
   if(!validId(category.id)||ids.has(category.id))throw Error('分類識別碼不可重複');
   if(typeof category.name!=='string'||!category.name.trim()||category.name.length>160)throw Error('分類名稱不可空白或超過 160 字');
   if(names.has(category.name.trim()))throw Error('分類名稱不可重複');
   if(category.label!==undefined&&(typeof category.label!=='string'||category.label.length>160))throw Error('分類顯示名稱格式不正確');
   if(!Array.isArray(category.tags)||category.tags.length>10||category.tags.some(tag=>typeof tag!=='string'||!tag.trim()||tag.length>24)||new Set(category.tags).size!==category.tags.length)throw Error('分類標籤格式不正確');
   ids.add(category.id);names.add(category.name.trim());
  }
 }
 function syncCategories(document){
  const categories=document.brand.categories;
  validateCategories(categories);
  for(const item of document.items){
   const category=categories.find(category=>item.categoryId?category.id===item.categoryId:category.name===item.menuCategory);
   if(!category)throw Error('「'+item.name+'」找不到所屬分類，請重新選擇分類');
   item.categoryId=category.id;item.menuCategory=category.name;
  }
  // Compatibility fields keep existing schema-v2 snapshots and database validation usable.
  document.brand.menus=categories.map(category=>category.name);
  document.brand.categoryLabels=Object.fromEntries(categories.filter(category=>category.label).map(category=>[category.name,category.label]));
  document.brand.categoryTags=Object.fromEntries(categories.filter(category=>category.tags.length).map(category=>[category.name,clone(category.tags)]));
  return document;
 }
 function normalizeCategories(input){
  const document=clone(input);document.brand.categories=categoriesFor(document);
  return syncCategories(document);
 }
 function updateCategories(input,categories){
  const document=normalizeCategories(input);
  document.brand.categories=clone(categories);
  return syncCategories(document);
 }
 function itemTags(item){return Array.isArray(item.tags)?item.tags:(item.recommended?['推薦']:[]);}
 function isRecommended(item){return itemTags(item).includes('推薦');}
 function isActive(document,item){return item.active&&(!item.activity||(document.activities||[]).some(activity=>activity.id===item.activity&&activity.active));}
 const api={categoriesFor,validateCategories,syncCategories,normalizeCategories,updateCategories,itemTags,isRecommended,isActive};
 root.TeaMenu=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
