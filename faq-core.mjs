import {queryContext} from './faq-search-rules.mjs';
import {legacyAliases} from './faq-legacy-aliases.mjs';
export {queryContext};
export function validateFAQ(data, projectIds) {
  if (!data || typeof data.version !== 'string' || typeof data.source_note !== 'string' || !Array.isArray(data.items) || !data.items.length) throw Error('FAQ data unavailable');
  const ids=new Set();
  for (const item of data.items) {
    for(const key of ['id','category','question','answer','nextQuestion']) if(typeof item[key]!=='string') throw Error('Invalid FAQ '+key);
    if(!item.id || !item.category || !item.question || !item.answer || ids.has(item.id)) throw Error('Invalid FAQ identity');
    ids.add(item.id);
    for(const key of ['variants','sourceRefs','needsConfirmation','projectIds']) if(!Array.isArray(item[key]) || item[key].some(x=>typeof x!=='string')) throw Error('Invalid FAQ '+key);
    if(!item.sourceRefs.length || item.projectIds.some(id=>!projectIds.has(id))) throw Error('Invalid FAQ reference');
    if(item.responseType!==undefined && !['answer','confirm','safety','clarify','handoff'].includes(item.responseType)) throw Error('Invalid FAQ responseType');
    if(item.handoffTo!==undefined && typeof item.handoffTo!=='string') throw Error('Invalid FAQ handoffTo');
  }
  return data;
}
export function normalize(text) {return text.normalize('NFKC').toLowerCase().replace(/[\s、。？！?!・「」『』（）()]/g,'');}
export function searchFAQ(items, query, category='') {
  const terms=query.trim().split(/\s+/).map(normalize).filter(Boolean);
  const context=queryContext(query),exact=normalize(query);
  const ranked=items.map((item,index)=>{
    const emergency=context.urgent&&item.id==='F042';
    if(category && item.category!==category && !emergency)return null;
    const aliases=legacyAliases[item.id]||[];
    const direct=exact&&[item.question,...item.variants,...aliases].some(t=>normalize(t)===exact);
    const literal=terms.every(term=>normalize([item.question,...item.variants,...aliases,item.category,item.answer].join(' ')).includes(term));
    const intent=context.ids.indexOf(item.id);
    return (direct||literal||intent>=0||emergency)?{item,score:emergency?10000:direct?5000:intent>=0?1000-intent:100,index}:null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index);
  return ranked.map(x=>x.item);
}
export function safeProject(p) {
  return p && typeof p.id==='string' && typeof p.title==='string' && typeof p.image==='string' && /^images\/[A-Za-z0-9_./-]+\.(jpg|jpeg|png|webp)$/.test(p.image) && !p.image.includes('..');
}
