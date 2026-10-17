const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function boot(copyFails=false) {
 const nodes=new Map();
 function el(id){if(!nodes.has(id))nodes.set(id,{value:'',hidden:true,textContent:'',classList:{toggle(){},contains(){return false},add(){}},setAttribute(){},focus(){this.focused=true},select(){this.selected=true},addEventListener(t,f){this[t]=f},insertBefore(){}});return nodes.get(id)}
 const location={href:''},copies=[];
 vm.runInNewContext(fs.readFileSync(path.join(root,'mirai.js'),'utf8'),{document:{getElementById:el,querySelectorAll(){return[]},createElement(){return{}}},location,navigator:{clipboard:{async writeText(t){if(copyFails)throw Error('denied');copies.push(t)}}},setTimeout(){}});
 for(const [k,v] of Object.entries({miraiKind:'空間制作',miraiDetail:'<script>危険</script> & 日本語\n二行目',miraiName:'検証用',miraiContact:'test@example.invalid'}))el(k).value=v;
 return {el,location,copies,submit(){el('miraiLead').submit({preventDefault(){}})}};
}
test('review has no navigation or external send; Japanese and HTML remain plain text',()=>{
 const b=boot();b.submit();assert.equal(b.location.href,'');assert.equal(b.el('miraiReview').hidden,false);assert.match(b.el('miraiPreview').value,/<script>危険<\/script> & 日本語/);assert.match(b.el('miraiMailStatus').textContent,/まだ送信されていません/);
});
test('mail handoff encodes the reviewed draft and never reports delivery',()=>{
 const b=boot();b.submit();b.el('miraiOpenMail').click();const u=new URL(b.location.href);assert.equal(u.pathname,'info@atelier-tecnoform.com');assert.match(u.searchParams.get('body'),/日本語\n二行目/);assert.match(b.el('miraiMailStatus').textContent,/送信・受信完了を確認できません/);
});
test('editing invalidates the reviewed draft, mail and copy cannot use stale data',async()=>{
 const b=boot();b.submit();b.el('miraiDetail').value='変更';b.el('miraiLead').input();b.el('miraiOpenMail').click();await b.el('miraiCopyMail').click();assert.equal(b.location.href,'');assert.equal(b.copies.length,0);assert.equal(b.el('miraiReview').hidden,true);assert.equal(b.el('miraiPreview').value,'');b.submit();assert.match(b.el('miraiPreview').value,/変更/);
});
test('copy is explicit and says not sent',async()=>{
 const b=boot();b.submit();await b.el('miraiCopyMail').click();assert.equal(b.copies[0],b.el('miraiPreview').value);assert.equal(b.location.href,'');assert.match(b.el('miraiMailStatus').textContent,/まだ送信されていません/);
});
test('clipboard denial leaves selectable manual fallback',async()=>{
 const b=boot(true);b.submit();await b.el('miraiCopyMail').click();assert.equal(b.el('miraiPreview').selected,true);assert.match(b.el('miraiMailStatus').textContent,/手動でコピー/);
});
test('all mail controls exist and product points to the existing listing',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const id of ['miraiReview','miraiPreview','miraiOpenMail','miraiCopyMail','miraiMailStatus'])assert.match(html,new RegExp('id="'+id+'"'));
 const journal=fs.readFileSync(path.join(root,'journal.html'),'utf8');assert.match(journal,/Excel 2019以降/);assert.match(journal,/items\/6a597e17d648d1085538e335/);assert.doesNotMatch(journal,/Universal Cart.*導入済み/);
});
