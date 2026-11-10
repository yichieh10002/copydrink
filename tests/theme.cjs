const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('dist/theme.js','utf8');
function setup(saved,{blocked=false}={}){
 const events={},buttons={};
 for(const name of ['light','dark'])buttons['theme-'+name]={attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this[k]=fn;}};
 const root={attrs:{},style:{},setAttribute(k,v){this.attrs[k]=v;}};
 const ctx={document:{documentElement:root,getElementById:id=>buttons[id],addEventListener(k,fn){events[k]=fn;}},window:{addEventListener(k,fn){events[k]=fn;}},localStorage:{getItem(){if(blocked)throw Error('blocked');return saved;},setItem(k,v){if(blocked)throw Error('blocked');saved=v;}}};
 vm.runInNewContext(code,ctx);events.DOMContentLoaded();return {root,buttons,events,saved:()=>saved};
}
let app=setup('dark');assert.equal(app.root.attrs['data-theme'],'dark');assert.equal(app.buttons['theme-dark'].attrs['aria-pressed'],'true');
app.buttons['theme-light'].click();assert.equal(app.saved(),'light');assert.equal(app.root.style.colorScheme,'light');assert.equal(setup(app.saved()).root.attrs['data-theme'],'light');
app.events.storage({key:'copydrink-theme',newValue:'dark'});assert.equal(app.root.attrs['data-theme'],'dark');
app.events.storage({key:'unrelated',newValue:'light'});assert.equal(app.root.attrs['data-theme'],'dark');
assert.equal(setup('invalid').root.attrs['data-theme'],'light');app=setup(null,{blocked:true});app.buttons['theme-dark'].click();assert.equal(app.root.attrs['data-theme'],'dark');
console.log('PASS: theme preference persists, restores, syncs tabs and works with blocked storage');
