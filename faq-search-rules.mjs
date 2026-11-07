// Candidate routing only. These rules never generate company answers or edit customer text.
export function queryContext(query){
 const q=query.normalize('NFKC');
 const current=q.replace(/焦げ臭(?:く|い|さ)(?:は)?(?:ありません|ない|なく)/g,'').replace(/煙が出て(?:いません|いない)/g,'').replace(/煙が出ないよう(?:に)?/g,'').replace(/ぐらつ(?:いていません|いていない|かない|きはありません)/g,'').replace(/落ちそう(?:にない|ではありません)/g,'').replace(/手を切(?:らない|っていない|っていません)/g,'').replace(/(?:落ちない|落下しない|けがをしない|怪我をしない)よう(?:に)?/g,'')
  .replace(/漏電(?:して(?:いません|いない)|しないよう(?:に)?|の予防|防止|の対策|を防ぎたい)/g,'')
  .replace(/燃えて(?:いません|いない)/g,'').replace(/燃えた(?:わけ|訳)では(?:ない|ありません)/g,'')
  .replace(/落ちた(?:わけ|訳)では(?:ない|ありません)/g,'').replace(/落下して(?:いません|いない)/g,'')
  .replace(/(?:けが|怪我)(?:を)?して(?:いません|いない)/g,'');
 const urgent=/焦げ臭|煙が|照明から煙|電気が熱い|異常な熱|割れて危険|発煙|発火|火花|火が出|落ち(?:そう|ました|た|てき)|落下(?:した|しました|している)|手を切|けがをし|怪我をし|(?:やけど|火傷)(?:を)?(?:しました|した|しています|している)|漏電|燃え(?:ています|ている|ました|た)|感電|ぐらつ/.test(current);
 const existing=/先月.*頼|頼んだ|注文|依頼中|納品済|いつ届|入金|納品予定/.test(q);
 const issue=/不具合|作り直|写真より|納得でき|請求.*違|仕上がり.*違/.test(q);
 const contact=/担当者.*連絡|今すぐ.*連絡|問い合わせ|返事がない/.test(q);
 const ids=[];
 const rules=[
  [/和紙/,['F008','F011']], [/ホテル|ロビー/,['F015']], [/ガラス/,['F009']],
  [/あかり|ライト|照明/,['F033','F032']], [/つるす|吊り下げ|吊る/,['F035','F025']],
  [/いくら|なんぼ|費用|料金|金額|予算/,['F043','F044']],
  [/見積だけ|無料|有料|お金.*発生|見積.*お金/,['F047']],
  [/屋外|浴室|水まわり/,['F038']], [/手入れ|掃除/,['F050','F051']],
  [/白く|写真.*色|写真より|点灯/,['F028','F029']],
  [/落ちないよう|落下防止|耐震/,['F036']],
  [/返事がない|届いて|届いた|送信|送れた/,['F069']], [/メール.*開|メール.*起動/,['F070']],
  [/機密|個人情報/,['F058']], [/秘密|他.*顧客/,['F066']],
  [/納期|いつまで|完成|間に合|急ぎ/,['F046','F076']], [/締切|見積.*期限/,['F072']],
 ];
 for(const [pattern,list] of rules)if(pattern.test(q))ids.push(...list);
 if(existing)ids.unshift('F064');if(issue)ids.unshift('F071','F052');if(contact)ids.unshift('F065');if(urgent)ids.unshift('F042');
 return {urgent,route:urgent?'emergency':issue?'issue':existing?'existing':contact?'contact':'general',ids:[...new Set(ids)]};
}
