/* Interactive Map of Iran — Hamid Yarali (حمید یارعلی) — MIT */
(()=>{
const G=window.GEO,I=window.INFO,NS='http://www.w3.org/2000/svg',svg=document.getElementById('map'),$=i=>document.getElementById(i);
const nf=(n,l,d=0)=>Number(Number(n).toFixed(d)).toLocaleString(l==='fa'?'fa-IR':'en-US');
const pj=(o,a)=>[(o-G.LON0)*Math.PI/180*G.S,(G.M0-Math.log(Math.tan(Math.PI/4+a*Math.PI/360)))*G.S];
const el=(p,t,a={},tx)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(tx)e.textContent=tx;p.appendChild(e);return e};
const rows=s=>s.trim().split('\n').map(r=>r.split('|'));
const L={};['sea','land','gr','prov','lake','riv','isl','pk','cl','lab','sl','tl'].forEach(k=>L[k]=el(svg,'g',{class:k}));
const P={};rows(I.prov).forEach(([n,fa,en,cf,ce,pop])=>P['IR-'+n]={id:'IR-'+n,type:'prov',fa,en,cf,ce,pop:+pop});
G.provinces.forEach(p=>Object.assign(P[p.id],p));const TOT=G.provinces.reduce((s,p)=>s+p.area,0);
const T={prov:['استان','Province'],sea:['پهنهٔ آبی','Water body'],isl:['جزیره','Island'],riv:['رود','River'],desert:['کویر / بیابان','Desert'],mtn:['رشته‌کوه','Mountain range'],pk:['قله','Peak']};
let lang='fa',moved=0,vb={x:0,y:0,w:G.W,h:G.H};const labs=[],dots=[],tip=$('tip');
const bind=(n,e)=>{n.addEventListener('mousemove',v=>{tip.style.display='block';tip.innerHTML=e.fa+' — '+e.en;tip.style.left=v.clientX+14+'px';tip.style.top=v.clientY+14+'px'});
 n.addEventListener('mouseleave',()=>tip.style.display='none');n.addEventListener('click',()=>{if(moved<5)open(e)})};
const LD=G.countries.join('')+G.provinces.map(p=>p.d).join('');
svg.insertAdjacentHTML('afterbegin',`<defs><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".8" fill="#b98a3e" opacity=".6"/><circle cx="4.5" cy="4.5" r=".7" fill="#d9ad5e" opacity=".7"/></pattern>
<filter id="bl"><feGaussianBlur stdDeviation="5"/></filter><filter id="gl"><feGaussianBlur stdDeviation="3"/></filter><clipPath id="lc"><path d="${LD}"/></clipPath></defs>`);
svg.insertAdjacentHTML('afterbegin',`<image href="data/relief.jpg" x="0" y="0" width="1000" height="${G.H}" preserveAspectRatio="none"/>`);el(L.land,'path',{d:G.countries.join(''),class:'dim'});el(L.land,'path',{d:LD,class:'ctry'});
const S={};rows(I.seas).forEach(([id,fa,en,lo,la,nfa,nen])=>{S[id]={id,type:'sea',fa,en,nfa,nen,lo,la};
 const d=G.seas[id]||G.lakes[id];if(d)bind(el(L[G.seas[id]?'sea':'lake'],'path',{d}),S[id]);
 if(lo){const[x,y]=pj(+lo,+la);labs.push([el(L.sl,'text',{x,y},fa),S[id],0,'sl'])}});
const hz=el(L.sea,'path',{d:'M'+I.hormuz.map(c=>pj(...c).join(',')).join('L')+'Z',class:'hz'});bind(hz,S.hormuz);
G.provinces.forEach(p=>{const e=P[p.id];bind(el(L.prov,'path',{d:p.d,fill:`hsl(${parseInt(p.id.slice(3))*47%360} 55% 60% / .10)`}),e);
 labs.push([el(L.lab,'text',{x:p.c[0],y:p.c[1]},e.fa),e,p.area,'lab'])});
const R={};rows(I.riv).forEach(([id,fa,en,nfa,nen])=>R[id]={id,type:'riv',fa,en,nfa,nen});
const river=(id,d)=>{const g=el(L.riv,'g');el(g,'path',{d,class:'v'});bind(el(g,'path',{d,class:'h'}),R[id])};
G.rivers.forEach(r=>R[r.id]&&river(r.id,r.d));
for(const k in I.lines)river(k,'M'+I.lines[k].map(c=>pj(...c).join(',')).join('L'));
const usedI=new Set();rows(I.isl).forEach(([id,fa,en,lo,la,ar,pf,pe,nfa,nen])=>{const e={id,type:'isl',fa,en,lo:+lo,la:+la,ar:+ar,pf,pe,nfa,nen};const[x,y]=pj(e.lo,e.la);
 const q=G.isl.map(o=>[o,Math.hypot(...pj(o.lo,o.la).map((v,i)=>v-[x,y][i]))]).sort((u,v)=>u[1]-v[1])[0];
 if(q&&q[1]<9&&!usedI.has(q[0])){usedI.add(q[0]);bind(el(L.isl,'path',{d:q[0].d,class:'ip'}),e)}
 const c=el(L.isl,'circle',{cx:x,cy:y,r:5});dots.push(c);bind(c,e)});
const fit=()=>{svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);const k=vb.w/G.W;dots.forEach(c=>c.setAttribute('r',5.5*k));
 L.lab.setAttribute('font-size',10.5*k);L.gr.setAttribute('font-size',8*k);L.cl.setAttribute('font-size',13*k);$('sb').style.width=200*.517*svg.getScreenCTM().a+'px';L.tl.setAttribute('font-size',12*k);pks.forEach(([n,x,y])=>n.setAttribute('transform',`translate(${x},${y}) scale(${k})`));L.sl.setAttribute('font-size',15*k);
 labs.forEach(([t,e,a,g])=>{t.textContent=e[lang];t.style.display=g!=='lab'||a>14000*k*k?'':'none'})};
const zoom=(f,cx=.5,cy=.5)=>{const w=Math.min(G.W,Math.max(110,vb.w*f)),r=w/vb.w;vb.x+=vb.w*cx*(1-r);vb.y+=vb.h*cy*(1-r);vb.w=w;vb.h=w*G.H/G.W;
 vb.x=Math.max(0,Math.min(G.W-vb.w,vb.x));vb.y=Math.max(0,Math.min(G.H-vb.h,vb.y));fit()};
svg.addEventListener('wheel',v=>{v.preventDefault();const q=svg.createSVGPoint();q.x=v.clientX;q.y=v.clientY;const u=q.matrixTransform(svg.getScreenCTM().inverse());
 zoom(v.deltaY>0?1.2:1/1.2,(u.x-vb.x)/vb.w,(u.y-vb.y)/vb.h)},{passive:false});
let dr=null;svg.addEventListener('pointerdown',v=>{dr={x:v.clientX,y:v.clientY};moved=0});
addEventListener('pointermove',v=>{if(!dr)return;const s=1/svg.getScreenCTM().a,dx=v.clientX-dr.x,dy=v.clientY-dr.y;moved+=Math.abs(dx)+Math.abs(dy);
 vb.x=Math.max(0,Math.min(G.W-vb.w,vb.x-dx*s));vb.y=Math.max(0,Math.min(G.H-vb.h,vb.y-dy*s));dr={x:v.clientX,y:v.clientY};fit()});
addEventListener('pointerup',()=>dr=null);
$('zi').onclick=()=>zoom(1/1.5);$('zo').onclick=()=>zoom(1.5);$('zr').onclick=()=>{vb={x:0,y:0,w:G.W,h:G.H};fit()};$('lb').onclick=()=>{lang=lang==='fa'?'en':'fa';fit()};
function info(e){const f=e.type==='prov';if(f){const nb=e.nb.map(i=>P[i]);return[
 ['مرکز استان','Capital',e.cf,e.ce],['جمعیت (سرشماری ۱۳۹۵)','Population (2016 census)',nf(e.pop,'fa'),nf(e.pop,'en')],
 ['مساحت (تقریبی)','Area (approx.)',nf(e.area,'fa')+' کیلومتر مربع',nf(e.area,'en')+' km²'],
 ['سهم از مساحت کشور','Share of national area',nf(e.area/TOT*100,'fa',1)+'٪',nf(e.area/TOT*100,'en',1)+'%'],
 ['تراکم جمعیت','Population density',nf(e.pop/e.area,'fa')+' نفر در کیلومتر مربع',nf(e.pop/e.area,'en')+' per km²'],
 ['استان‌های همسایه','Neighbouring provinces',nb.map(x=>x.fa).join('، '),nb.map(x=>x.en).join(', ')],['کد ISO 3166-2','ISO 3166-2',e.id,e.id]]}
 if(e.type==='pk')return[['ارتفاع','Elevation',nf(e.m,'fa')+' متر',nf(e.m,'en')+' m'],['مختصات','Coordinates',nf(e.la,'fa',2)+'° شمالی، '+nf(e.lo,'fa',2)+'° شرقی',e.la+'° N, '+e.lo+'° E']];
 const r=[['توضیحات','Description',e.nfa,e.nen]];
 if(e.type==='isl')r.unshift(['استان','Province',e.pf,e.pe],['مساحت (تقریبی)','Area (approx.)',e.ar?nf(e.ar,'fa')+' کیلومتر مربع':'—',e.ar?nf(e.ar,'en')+' km²':'—'],
  ['مختصات','Coordinates',nf(e.la,'fa',2)+'° شمالی، '+nf(e.lo,'fa',2)+'° شرقی',e.la+'° N, '+e.lo+'° E']);
 return r}
function open(e){const R=info(e),q=e.type==='prov'?['استان '+e.fa,e.en+' Province']:[e.fa,e.en];
 const col=(l,i,d)=>`<section lang="${l}" dir="${d}"><h2>${e[l]}</h2><span class="badge">${T[e.type][i]}</span><dl>${R.map(r=>`<dt>${r[i]}</dt><dd>${r[i+2]}</dd>`).join('')}</dl>
 <a target="_blank" rel="noopener" href="https://${l}.wikipedia.org/w/index.php?search=${encodeURIComponent(q[i])}">${i?'Read more on Wikipedia ↗':'مطالعهٔ بیشتر در ویکی‌پدیا ↗'}</a></section>`;
 $('mb').innerHTML=`<div class="cols">${col('fa',0,'rtl')}${col('en',1,'ltr')}</div>`;$('modal').hidden=false}
const close=()=>$('modal').hidden=true;$('x').onclick=close;$('modal').onclick=v=>{if(v.target.id==='modal')close()};addEventListener('keydown',v=>v.key==='Escape'&&close());
const TE={};rows(I.ter).forEach(([id,fa,en,nfa,nen])=>TE[id]={id,fa,en,nfa,nen});
G.terrain.forEach(t=>{const e=Object.assign(TE[t.id]||{fa:t.id,en:t.id,nfa:'',nen:''},{type:t.k}),n=el(L.tl,'text',{x:t.c[0],y:t.c[1],class:t.k},e.fa);labs.push([n,e,0,'tl']);bind(n,e)});
rows(I.salt).forEach(([id,fa,en,lo,la,rx,ry,nfa,nen])=>{const[x,y]=pj(+lo,+la),k=Math.PI/180*G.S;
 bind(el(L.lake,'ellipse',{cx:x,cy:y,rx:rx*k,ry:ry*k/Math.cos(la*Math.PI/180)}),{id,type:'sea',fa,en,nfa,nen})});
const pks=[];G.peaks.forEach(p=>{const e={id:p.n,type:'pk',fa:p.fa||p.n,en:p.n,m:p.m,lo:p.lo,la:p.la},[x,y]=pj(p.lo,p.la),n=el(L.pk,'path',{d:'M0,-6L5,3.5L-5,3.5Z'});pks.push([n,x,y]);bind(n,e)});
for(let la=26;la<=40;la+=2){const y=pj(0,la)[1];el(L.gr,'path',{d:`M0,${y}H1000`});el(L.gr,'text',{x:6,y:y-3},la+'°N')}
for(let lo=44;lo<=64;lo+=2){const x=pj(lo,0)[0];el(L.gr,'path',{d:`M${x},0V${G.H}`});el(L.gr,'text',{x:x+3,y:G.H-6},lo+'°E')}
rows(I.ctry).forEach(([fa,en,lo,la])=>{const[x,y]=pj(+lo,+la);labs.push([el(L.cl,'text',{x,y},fa),{fa,en},0,'cl'])});
fit();
})();
