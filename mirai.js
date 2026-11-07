/* MIRAI public FAQ: local in-memory notes only; no conversational API. */
(function(){
var L=document.getElementById('miraiLauncher'),P=document.getElementById('miraiPanel'),C=document.getElementById('miraiClose'),S=document.getElementById('miraiStream'),F=document.getElementById('miraiCompose'),I=document.getElementById('miraiInput'),Lead=document.getElementById('miraiLead');
if(!L||!P||!S||!F||!I||!Lead)return;
function open(v){P.classList.toggle('open',v);P.setAttribute('aria-hidden',String(!v));L.setAttribute('aria-expanded',String(v));if(v)setTimeout(function(){I.focus()},80)}
L.onclick=function(){open(!P.classList.contains('open'))};C.onclick=function(){open(false)};
var notes=[];
var status=document.getElementById('miraiStatus');
var lastGenerated='', syncedNotes=0;
var updateNote=document.createElement('p'),appendNotes=document.createElement('button');
updateNote.className='mirai-note';updateNote.setAttribute('role','status');
appendNotes.type='button';appendNotes.className='mirai-chip';appendNotes.textContent='編集内容を残して、新しい会話だけ追記';appendNotes.hidden=true;
Lead.insertBefore(updateNote,Lead.querySelector('button[type="submit"]'));
Lead.insertBefore(appendNotes,Lead.querySelector('button[type="submit"]'));
function msg(text,who){var d=document.createElement('div');d.className='mirai-msg '+who;d.textContent=text;S.insertBefore(d,Lead);while(S.querySelectorAll('.mirai-msg').length>60)S.querySelector('.mirai-msg').remove();S.scrollTop=S.scrollHeight}
function lead(){Lead.classList.add('active');S.scrollTop=S.scrollHeight}
function safetyFromMemo(q){if(globalThis.MiraiFAQ&&typeof globalThis.MiraiFAQ.safety==='function')globalThis.MiraiFAQ.safety(q)}
function remember(q){if(notes.length>=40){msg('相談内容が長くなりました。フォームで続きをお聞かせください。','bot');lead();safetyFromMemo(q);return false}notes.push(q);msg(q,'user');safetyFromMemo(q);return true}
document.addEventListener('mirai-faq-note',function(event){
 var request=event.detail;
 if(!request||typeof request.text!=='string')return;
 request.saved=false;
 if(request.text.trim()&&request.text.length<=1200)request.saved=remember(request.text.trim());
});
I.maxLength=1200;
function ask(q){
 q=(q||'').trim();if(!q)return;if(q.length>1200){msg('1200文字以内に分けてご入力ください。','bot');return}
 if(remember(q)){I.value='';status.textContent='相談メモへ追加しました。まだ送信されていません。「相談内容を確認する」で見直せます。';}
}
F.addEventListener('submit',function(e){e.preventDefault();ask(I.value)});
document.querySelectorAll('.mirai-quick .mirai-chip').forEach(function(b){b.onclick=function(){ask(b.getAttribute('data-q'))}});
document.getElementById('miraiReview').onclick=function(){
 var text=notes.map(function(text){return '・'+text}).join('\n');
 var field=document.getElementById('miraiDetail');
 if(!field.value||field.value===lastGenerated){
  field.value=text?'【お客様の相談メモ】\n'+text+'\n\n※見積・納期・仕様は担当者へ確認。':'';
  lastGenerated=field.value;syncedNotes=notes.length;appendNotes.hidden=true;updateNote.textContent='最新の会話を反映しました。変更・訂正の発言も含めてご確認ください。';
 }else{
  appendNotes.hidden=notes.length<=syncedNotes;
  updateNote.textContent=appendNotes.hidden?'手編集した内容を保持しています。新しい会話はありません。':'手編集した内容を保持しています。下のボタンで、新しい会話だけ末尾へ追記できます。追記後にご確認ください。';
 }
 lead();field.focus();
};
appendNotes.onclick=function(){
 var field=document.getElementById('miraiDetail'),extra=notes.slice(syncedNotes);
 if(extra.length)field.value+='\n\n【追加の会話（変更・訂正もご確認ください）】\n'+extra.map(function(t){return '・'+t}).join('\n');
 syncedNotes=notes.length;appendNotes.hidden=true;updateNote.textContent='編集内容を残して新しい会話を追記しました。送信前に内容をご確認ください。';
 lead();field.focus();
};
function v(id){return(document.getElementById(id).value||'').trim()}
function mailBody(){return ['atelier TECNOFORM ご担当者様','','Webサイトの相談メモから作成した問い合わせです。','','【ご相談の種類】',v('miraiKind'),'','【ご相談内容】',v('miraiDetail'),'','【場所・施設名】',v('miraiPlace')||'未記入','','【ご希望時期】',v('miraiTiming')||'未記入','','【ご予算感】',v('miraiBudget')||'未記入','','【会社名・お名前】',v('miraiName'),'','【返信先】',v('miraiContact')].join('\n')}
var copyButton=document.getElementById('miraiCopyMail'),copyArea=document.getElementById('miraiMailText'),mailStatus=document.getElementById('miraiMailStatus');
if(copyButton)copyButton.onclick=async function(){
 copyArea.value='宛先: info@atelier-tecnoform.com\n件名: 【制作相談】'+v('miraiKind')+'\n\n'+mailBody();copyArea.hidden=false;copyArea.focus();copyArea.select();
 mailStatus.textContent='相談文を表示・選択しました。自動コピーできない場合は手動でコピーできます。まだ送信されていません。';var copyTimer;
 try{await Promise.race([navigator.clipboard.writeText(copyArea.value),new Promise(function(_,reject){copyTimer=setTimeout(function(){reject(Error('timeout'))},1500)})]);mailStatus.textContent='相談文をコピーしました。まだ送信されていません。普段のメールへ貼り付け、宛先と内容をご確認のうえ、ご自身で送信してください。'}
 catch{mailStatus.textContent='自動コピーできませんでした。下の相談文を選択して手動でコピーできます。まだ送信されていません。'}
 finally{clearTimeout(copyTimer)}
};
Lead.addEventListener('submit',function(e){
 e.preventDefault();var subject='【制作相談】'+v('miraiKind'),body=mailBody();
 if(mailStatus)mailStatus.textContent='メールアプリを開く操作をしました。送信・受領は確認できません。開かない場合は「相談文をコピー」をご利用ください。';
 location.href='mailto:info@atelier-tecnoform.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)
});
})();
