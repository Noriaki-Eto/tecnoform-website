import {validateFAQ,searchFAQ,safeProject,queryContext} from './faq-core.mjs';
import {requestMemo} from './memo-bridge.mjs';
const root=document.getElementById('miraiFAQ');
const select=document.getElementById('miraiFAQCategory'),input=document.getElementById('miraiFAQSearch'),results=document.getElementById('miraiFAQResults'),detail=document.getElementById('miraiFAQAnswer'),status=document.getElementById('miraiFAQStatus');
const text=(tag,value,parent)=>{const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;};
let data,projects,route='new';
const urgentBox=document.createElement('section');urgentBox.className='mirai-urgent';urgentBox.hidden=true;root.prepend(urgentBox);
const pendingBox=document.createElement('section');pendingBox.hidden=true;pendingBox.className='mirai-pending';root.append(pendingBox);
function addMemo(value){
 const saved=requestMemo(value,request=>document.dispatchEvent(new CustomEvent('mirai-faq-note',{detail:request})));
 if(saved){pendingBox.hidden=true;status.textContent='相談メモに追加しました。まだ送信されていません。「相談内容を確認する」で見直せます。';}
 else{
  status.textContent='この質問は保存されていません。相談メモの上限は40件です。既存のメモは保持しています。';
  pendingBox.replaceChildren();text('p','未保存の質問です。コピーしてご自身で残すか、相談文へ手動で追記してください。',pendingBox);
  const area=document.createElement('textarea');area.readOnly=true;area.value=value;area.setAttribute('aria-label','未保存の質問');pendingBox.append(area);
  const b=text('button','未保存の質問をコピー',pendingBox);b.type='button';b.className='mirai-chip';b.onclick=async()=>{
   area.focus();area.select();status.textContent='未保存の質問を選択しました。自動コピーできない場合は、選択した文章を手動コピーしてください。';let timer;
   try{await Promise.race([navigator.clipboard.writeText(value),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),1500);})]);status.textContent='未保存の質問をコピーしました。相談メモには追加されていません。'}
   catch{status.textContent='未保存の質問を選択して手動コピーしてください。相談メモには追加されていません。'}finally{clearTimeout(timer);}
  };
  pendingBox.hidden=false;pendingBox.scrollIntoView({block:'nearest'});
 }
}
function openContact(kind){document.getElementById('miraiKind').value=kind;document.getElementById('miraiReview').click();}
function safetyNotice(active){
 urgentBox.replaceChildren();urgentBox.hidden=!active;if(!active)return;
 urgentBox.setAttribute('role','alert');text('h3','安全の確保を優先してください',urgentBox);
 text('p',data.items.find(x=>x.id==='F042').answer,urgentBox);
 text('p','現在の異常か、予防のためのご相談かはこの画面では判断できません。',urgentBox);
}
function show(item){
 detail.replaceChildren();text('h3',item.question,detail);text('p',item.answer,detail);
 if(item.handoffTo)text('p','確認先：'+item.handoffTo,detail).className='mirai-note';
 if(item.needsConfirmation.length){text('h4','担当者への個別確認が必要なこと',detail);const ul=document.createElement('ul');item.needsConfirmation.forEach(s=>text('li',s,ul));detail.append(ul);}
 text('p','出典：'+item.sourceRefs.join(' ／ '),detail).className='mirai-note';
 if(item.nextQuestion&&item.id!=='F042')text('p','相談するときのヒント：'+item.nextQuestion,detail);
 const cards=document.createElement('div');cards.className='mirai-faq-cards';
 (item.id==='F042'?[]:item.projectIds).map(id=>projects.find(p=>p.id===id)).filter(safeProject).slice(0,3).forEach(p=>{
  const a=document.createElement('a');a.href='/#works';const img=document.createElement('img');img.src=p.image;img.alt=p.title;img.loading='lazy';a.append(img);text('span',p.title,a);cards.append(a);
 });if(cards.children.length)text('p','写真は過去の掲載実績です。同条件の安全性や現在の制作可否を保証するものではありません。',detail).className='mirai-note';detail.append(cards);
 const b=text('button','この質問を相談メモに加える',detail);b.type='button';b.className='mirai-chip';b.onclick=()=>addMemo(item.question);
 const back=text('button','質問一覧へ戻る',detail);back.type='button';back.className='mirai-chip';back.onclick=()=>{render();root.scrollIntoView({block:'nearest'});};
 detail.hidden=false;detail.focus();
}
function render(){
 detail.hidden=true;detail.replaceChildren();results.replaceChildren();
 const context=queryContext(input.value),urgent=context.urgent||route==='emergency';safetyNotice(urgent);
 if(urgent)urgentBox.scrollIntoView({block:'nearest'});
 let matches=searchFAQ(data.items,input.value,select.value);
 if(!input.value.trim()&&route!=='new'){
  const ids={existing:['F064','F069','F070'],issue:['F071','F052','F028','F029'],emergency:['F042']}[route];
  if(ids)matches=ids.map(id=>data.items.find(x=>x.id===id));
 }
 status.textContent=matches.length ? matches.length+'件の候補です。質問を選ぶと回答と確認事項を表示します。':'該当する質問が見つかりません。別の言葉で探すか、相談内容へ追加できます。';
 for(const item of matches){const b=text('button',item.question,results);b.type='button';b.className='mirai-faq-question';b.onclick=()=>show(item);}
 if(!matches.length && input.value.trim()){
  const b=text('button','この質問を問い合わせ用に残す',results);b.type='button';b.className='mirai-chip';b.onclick=()=>addMemo(input.value.trim());
 }
 if(input.value.trim()&&matches.length){const b=text('button','検索した原文を相談メモに残す',results);b.type='button';b.className='mirai-chip';b.onclick=()=>addMemo(input.value.trim());}
 const contactRoute=context.route==='general'?route:context.route;
 const contact=text('button','担当者への相談文を作る（未送信）',results);contact.type='button';contact.className='mirai-chip';contact.onclick=()=>openContact(contactRoute==='issue'?'不具合・仕上がりの相談':contactRoute==='existing'?'依頼中・納品済みの件':'制作相談');
}
try {
 const [faqResponse,projectResponse]=await Promise.all([fetch('/mirai-faq-data.json'),fetch('/mirai-project-cards.json')]);
 if(!faqResponse.ok||!projectResponse.ok)throw Error('unavailable');
 projects=await projectResponse.json();if(!Array.isArray(projects))throw Error('invalid projects');
 data=validateFAQ(await faqResponse.json(),new Set(projects.map(p=>p.id)));
 document.querySelectorAll('[data-mirai-route]').forEach(b=>{b.disabled=false;b.onclick=()=>{route=b.dataset.miraiRoute;input.value='';select.value='';render();if(route==='existing'||route==='issue')status.textContent+=' 下の「担当者への相談文を作る」から、直接お問い合わせの準備もできます。';root.scrollIntoView({block:'nearest'});};});
 for(const category of new Set(data.items.map(item=>item.category))){const option=text('option',category,select);option.value=category;}
 select.disabled=false;input.disabled=false;input.addEventListener('input',render);select.addEventListener('change',render);
 globalThis.MiraiFAQ={
  search(query){input.value=query;select.value='';render();root.scrollIntoView({block:'nearest'});},
  safety(query){if(queryContext(query).urgent){safetyNotice(true);urgentBox.scrollIntoView({block:'nearest'});return true;}return false;}
 };
 render();
} catch {
 status.textContent='質問一覧を読み込めませんでした。「相談内容を確認する」からフォームをご利用ください。';
}
