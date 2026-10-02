/* MIRAI CONCIERGE v2 — site-grounded guidance; no external AI/API calls. */
(function(){
var L=document.getElementById('miraiLauncher'),P=document.getElementById('miraiPanel'),C=document.getElementById('miraiClose'),S=document.getElementById('miraiStream'),F=document.getElementById('miraiCompose'),I=document.getElementById('miraiInput'),Lead=document.getElementById('miraiLead');
if(!L||!P||!S||!F||!I||!Lead)return;
function open(v){P.classList.toggle('open',v);P.setAttribute('aria-hidden',String(!v));L.setAttribute('aria-expanded',String(v));if(v)setTimeout(function(){I.focus()},80)}
L.onclick=function(){open(!P.classList.contains('open'))};C.onclick=function(){open(false)};
function strip(s){var d=document.createElement('div');d.innerHTML=s||'';return(d.textContent||'').replace(/\s+/g,' ').trim()}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function msg(t,w,h){var d=document.createElement('div');d.className='mirai-msg '+w;h?d.innerHTML=t:d.textContent=t;S.insertBefore(d,Lead);S.scrollTop=S.scrollHeight}
function lead(seed){Lead.classList.add('active');var d=document.getElementById('miraiDetail');if(seed&&!d.value)d.value=seed;S.scrollTop=S.scrollHeight}
function norm(s){return String(s||'').toLowerCase().replace(/　/g,' ').trim()}
var syn={
 'ホテル':['hotel','ホテル','リッツ','hilton','ヒルトン','keihan','京阪','renaissance','ルネッサンス','リーガ'],
 '和紙':['和紙','washi','杉原紙','紙','ランプ','照明'],
 'ガラス':['ガラス','glass','ミラー','鏡','crystal','クリスタル'],
 '医療':['medical','医療','病院','クリニック','産婦人科'],
 '店舗':['retail','restaurant','店舗','商業','レストラン','大丸'],
 '住宅':['residence','住宅','邸宅','マンション','住戸'],
 'エントランス':['entrance','エントランス','ロビー','lobby'],
 '3d':['3d','grasshopper','rhino','パラメトリック','造形','プリント']
};
function terms(q){var n=norm(q),o=n.split(/[\s、。・,/]+/).filter(function(x){return x.length>1});Object.keys(syn).forEach(function(k){if(n.indexOf(k)>=0)o=o.concat(syn[k])});return Array.from(new Set(o))}
function projects(q){
 if(typeof PROJECTS==='undefined'||!Array.isArray(PROJECTS))return[];
 var ts=terms(q);if(!ts.length)return[];
 return PROJECTS.map(function(p){var h=norm(strip((p.title||'')+' '+(p.meta||'')+' '+(p.desc||''))),s=0;ts.forEach(function(t){if(h.indexOf(norm(t))>=0)s++});return{p:p,s:s}})
 .filter(function(x){return x.s>0&&String(x.p.num||'').charAt(0)!=='X'}).sort(function(a,b){return b.s-a.s}).slice(0,3).map(function(x){return x.p})
}
function list(ps){var h='<strong>サイト掲載実績から近い事例です。</strong>';ps.forEach(function(p){h+='<br><br>・'+esc(strip(p.title))+'<br><span style="color:var(--paper-mute)">'+esc(strip(p.meta||''))+'</span>'});return h+'<br><br><a href="#works">Works一覧を見る →</a><br>場所や用途が決まっていれば、続けて教えてください。'}
function answer(q){
 var n=norm(q),ps;
 if(/相談|問い合わせ|見積|依頼|発注|お願いしたい|検討して/.test(n)){lead(q);return'承ります。相談フォームを開きました。場所・用途・時期など、分かる範囲だけで構いません。'}
 if(/ai|人工知能|自動化|業務ログ|承認ログ|テンプレート|デジタル活用|journal|ジャーナル/.test(n))return'AI・自動化・業務ログなどの実務情報は、TECNOFORM JOURNALにまとめています。無料の実務記事と、必要な方にはAI承認・業務ログテンプレートの案内があります。<br><br><a href="journal.html">TECNOFORM JOURNALを見る →</a>';
 if(/価格|費用|予算|値段|いくら/.test(n)){lead(q);return'作品は空間・寸法・素材・数量・施工条件によって個別設計するため、固定価格は掲載していません。用途と規模を伺い、見積相談として整理します。'}
 if(/納期|期間|いつでき|何日|何ヶ月/.test(n)){lead(q);return'制作期間は設計内容、試作、素材、施工条件によって変わります。ミライから確定納期は約束せず、ご希望時期を伺って実制作側へ確認します。'}
 if(/何ができ|できること|業務|サービス|仕事内容/.test(n))return'atelier TECNOFORMは、ガラスアート、立体手漉き和紙、光のオブジェ、3D造形・パラメトリックデザインなどを、空間に合わせて構想・設計・制作・設置まで扱っています。ホテル、商業空間、邸宅、医療施設などの実績があります。';
 if(/和紙|washi/.test(n))return'立体手漉き和紙、和紙照明、壁面パネルなどを制作しています。3D造形した骨格へ和紙を漉き重ね、光を透過させる表現も扱います。'+(projects(q).length?'<br><br>'+list(projects(q)):'');
 if(/ガラス|glass/.test(n))return'クラフトガラス、強化複層アートガラス、ミラーや波紋ガラスの象嵌など、空間と光に合わせたガラス表現を設計・制作しています。'+(projects(q).length?'<br><br>'+list(projects(q)):'');
 if(/3d|grasshopper|rhino|パラメトリック/.test(n))return'Rhino / Grasshopperによるパラメトリック設計と3D造形を、和紙・光・ガラスの実制作へつなげています。形状検討だけでなく、空間内での見え方を3D/VRで確認してから制作へ進める工程があります。';
 ps=projects(q);if(ps.length)return list(ps);
 return'サイト掲載内容の範囲でご案内します。「ホテル」「エントランス」「和紙」「ガラス」「3D」「医療施設」など、用途や素材を一言入れていただくと近い実績を探せます。具体的な制作相談なら「相談したい」と入力してください。'
}
function ask(q){q=(q||'').trim();if(!q)return;msg(q,'user');var a=answer(q);msg(a,'bot',a.indexOf('<')>=0)}
F.addEventListener('submit',function(e){e.preventDefault();ask(I.value);I.value=''});
document.querySelectorAll('.mirai-chip').forEach(function(b){b.onclick=function(){ask(b.getAttribute('data-q'))}});
Lead.addEventListener('submit',function(e){
 e.preventDefault();function v(id){return(document.getElementById(id).value||'').trim()}
 var subject='【ミライ受付】'+v('miraiKind');
 var body=['atelier TECNOFORM ご担当者様','','Webサイトのミライ相談窓口からの問い合わせです。','','【ご相談の種類】',v('miraiKind'),'','【ご相談内容】',v('miraiDetail'),'','【場所・施設名】',v('miraiPlace')||'未記入','','【ご希望時期】',v('miraiTiming')||'未記入','','【ご予算感】',v('miraiBudget')||'未記入','','【会社名・お名前】',v('miraiName'),'','【返信先】',v('miraiContact')].join('\n');
 location.href='mailto:info@atelier-tecnoform.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)
});
})();