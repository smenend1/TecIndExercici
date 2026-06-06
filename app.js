'use strict';

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const app = $('#app');
const LS = 'ti_exercicis_plus_historial_v1';
const fmt = (n, d=3) => Number.isFinite(n) ? Number(n).toLocaleString('ca-ES', {maximumFractionDigits:d}) : '—';
const val = id => parseFloat(document.getElementById(id)?.value?.replace(',', '.'));
const text = id => document.getElementById(id)?.value || '';
const esc = s => String(s ?? '').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));

const formulas = [
  ['Energia','E = P · t','Energia, potència i temps. Cal vigilar si el temps és en h o en s.'],
  ['Energia','Ep = m · g · h','Energia potencial gravitatòria.'],
  ['Energia','Q = m · ce · ΔT','Calor sensible per escalfar o refredar una substància.'],
  ['Energia','η = Eu / Es','Rendiment com a quocient entre energia útil i energia subministrada.'],
  ['Electricitat','U = I · R','Llei d’Ohm.'],
  ['Electricitat','P = U · I','Potència elèctrica en corrent continu o càrrega resistiva.'],
  ['Corrent altern','Umax = Uef · √2','Relació entre valor eficaç i valor màxim sinusoidal.'],
  ['Corrent altern','XL = 2πfL','Reactància inductiva.'],
  ['Corrent altern','XC = 1 / (2πfC)','Reactància capacitiva.'],
  ['Motors','ω = 2πn / 60','Conversió de min⁻¹ a rad/s.'],
  ['Motors','P = M · ω','Relació entre potència, parell i velocitat angular.'],
  ['Trifàsica','P = √3 · U · I · cosφ','Potència activa trifàsica equilibrada.'],
  ['Mecanismes','nvoltes = h / pas','Voltes necessàries en un cargol-femella.'],
  ['Pneumàtica','F = p · A','Força d’un cilindre.'],
  ['Pneumàtica','Q = A · v','Cabal, secció i velocitat.']
];

const testQuestions = [
  {q:'Un cargol té diàmetre nominal de 10 mm i tolerància ±0,05 mm. Quin és el diàmetre mínim acceptable?', opts:['9,90 mm','9,95 mm','10,05 mm','10,10 mm'], ok:1, exp:'El mínim és 10 - 0,05 = 9,95 mm.'},
  {q:'Sense pèrdues, dos funiculars que salven el mateix desnivell necessiten...', opts:['la mateixa energia','més energia si el pendent és gran','més energia si el recorregut és llarg','energia segons l’acceleració màxima'], ok:0, exp:'Sense pèrdues, l’energia potencial depèn de m·g·h, no del camí.'},
  {q:'Una resistència R = 17 Ω alimentada amb Uef = 230 V té Ief...', opts:['13,52 A','19,13 A','23,42 A','27,13 A'], ok:0, exp:'Ief = Uef/R = 230/17 = 13,52 A. El valor màxim seria Ief·√2.'},
  {q:'En un assaig de tracció, el límit elàstic més alt correspon a...', opts:['la corba que comença a plastificar a tensió més alta','la corba més llarga','el material de més deformació final','no es pot saber mai'], ok:0, exp:'El límit elàstic és la tensió a partir de la qual comença la deformació permanent.'},
  {q:'Per refredar un bloc, la calor extreta es calcula amb...', opts:['Q = m·ce·ΔT','Q = P/t','Q = U·I','Q = F·v'], ok:0, exp:'És calor sensible: massa per calor específica per variació de temperatura.'},
  {q:'En un circuit RL sèrie, la impedància és...', opts:['Z = R + XL','Z = √(R² + XL²)','Z = R - XL','Z = U·I'], ok:1, exp:'La resistència i la reactància inductiva són components perpendiculars en el triangle d’impedàncies.'}
];

const exercises = {
  elevador: {title:'Elevador amb cargol-femella', fields:[['m','Massa suportada per columna','kg',1900],['h','Alçada','m',1.8],['temps','Temps','s',45],['eta','Rendiment','tant per u',0.4],['pas','Pas de rosca','mm/volta',7],['nmotor','Velocitat del motor','min⁻¹',1420]], solve: solveElevador},
  calor: {title:'Calor, combustible i rendiment', fields:[['v','Volum d’aigua','L',2],['t1','Temperatura inicial','°C',15],['t2','Temperatura final','°C',100],['ce','Calor específica','kJ/(kg·°C)',4.186],['eta','Rendiment','tant per u',0.2],['pc','Poder calorífic','MJ/kg',45.8],['consum','Consum','g/h',155],['cartutx','Massa del cartutx','g',230]], solve: solveCalor},
  ohm: {title:'Llei d’Ohm i potència', fields:[['u','Tensió','V',230],['r','Resistència','Ω',17]], solve: solveOhm},
  ca: {title:'Valor eficaç i valor màxim', fields:[['uef','Tensió eficaç','V',230],['ief','Intensitat eficaç','A',2]], solve: solveCA},
  rl: {title:'Circuit RL sèrie', fields:[['u','Tensió eficaç','V',230],['f','Freqüència','Hz',50],['l','Inductància','mH',100],['r','Resistència','Ω',84]], solve: solveRL},
  motor: {title:'Motor: parell i rendiment', fields:[['pu','Potència útil','W',350],['n','Velocitat','min⁻¹',550],['pa','Potència absorbida','W',414]], solve: solveMotor},
  trifasica: {title:'Trifàsica bàsica', fields:[['u','Tensió composta','V',400],['i','Intensitat de línia','A',9],['cos','cos φ','',0.85]], solve: solveTrifasica},
  pneumatica: {title:'Força d’un cilindre', fields:[['p','Pressió','bar',6],['d','Diàmetre','mm',40],['cursa','Cursa','mm',200],['q','Cabal','L/min',60]], solve: solvePneumatica},
  logica: {title:'Lògica digital: persiana domòtica', fields:[], solve: solveLogica}
};

function setView(view){
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const views = {inici, pau, exercicisView, calculadores, practica, formulari, historial};
  views[view]?.();
}

$$('.tab').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

function inici(){
  app.innerHTML = `<section class="card"><h2>Entrenador d’exercicis de Tecnologia Industrial i PAU</h2><p>Aquesta PWA ajuda a resoldre exercicis tipus pas a pas: dades, fórmula, substitució, càlcul, resultat, unitats, interpretació i errors habituals.</p><div class="btnrow no-print"><button class="primary" onclick="setView('exercicis')">Resoldre exercici</button><button class="secondary" onclick="setView('pau')">Mode PAU</button><button class="secondary" onclick="setView('formulari')">Formulari</button></div></section>
  <section class="grid">
    ${['Tipus test PAU','Lògica digital','Elevador i transmissió','Calor i combustible','Electricitat','Corrent altern','Motors','Trifàsica','Pneumàtica'].map(x=>`<article class="card"><h3>${x}</h3><p>Exercicis guiats amb procediment i comprovació.</p></article>`).join('')}
  </section>`;
}

function pau(){
  app.innerHTML = `<section class="card"><h2>Mode PAU</h2><p>Treballa exercicis inspirats en proves PAU: test amb penalització, problemes per apartats i resolució guiada.</p><div class="grid"><div class="card"><h3>Test PAU</h3><p>Resposta múltiple amb correcció i explicació.</p><button class="primary" onclick="renderTest()">Començar test</button></div><div class="card"><h3>Problemes guiats</h3><p>Tria exercicis de mecanismes, energia, electricitat, motors o lògica.</p><button class="secondary" onclick="setView('exercicis')">Obrir exercicis</button></div></div><div id="pauArea"></div></section>`;
}

function renderTest(){
  $('#pauArea').innerHTML = `<section class="card"><h3>Test autocorregible</h3><p class="small">Puntuació: +0,5 resposta correcta, -0,16 resposta incorrecta, 0 si no es contesta.</p>${testQuestions.map((q,i)=>`<div class="card"><strong>Qüestió ${i+1}</strong><p>${q.q}</p>${q.opts.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> ${String.fromCharCode(97+j)}) ${o}</label><br>`).join('')}</div>`).join('')}<div class="btnrow"><button class="primary" onclick="checkTest()">Corregir</button><button class="secondary" onclick="saveCurrent('Test PAU', document.getElementById('testResult')?.innerText || 'Test corregit')">Guardar</button></div><div id="testResult" class="result"></div></section>`;
}

function checkTest(){
  let score=0, html='<h3>Correcció</h3>';
  testQuestions.forEach((q,i)=>{
    const ans = $(`input[name=q${i}]:checked`)?.value;
    if(ans === undefined){ html += `<p><b>Q${i+1}</b>: no contestada. ${q.exp}</p>`; return; }
    const ok = Number(ans) === q.ok; score += ok ? .5 : -.16;
    html += `<p><b>Q${i+1}</b>: ${ok?'Correcta':'Incorrecta'}. Resposta correcta: ${String.fromCharCode(97+q.ok)}. ${q.exp}</p>`;
  });
  $('#testResult').innerHTML = `<div class="${score>=2?'ok':'notice'}"><b>Puntuació:</b> ${fmt(score,2)} punts</div>${html}`;
}

function exercicisView(){
  const options = Object.entries(exercises).map(([k,e])=>`<option value="${k}">${e.title}</option>`).join('');
  app.innerHTML = `<section class="card"><h2>Exercicis guiats</h2><div class="field"><label>Tipus d’exercici</label><select id="exerciseSelect" onchange="renderExerciseForm()">${options}</select></div><div id="exerciseForm"></div></section>`;
  renderExerciseForm();
}

function renderExerciseForm(){
  const key = $('#exerciseSelect').value; const ex = exercises[key];
  const fields = ex.fields.map(f=>`<div class="field"><label for="${f[0]}">${f[1]} <span class="small">(${f[2]})</span></label><input id="${f[0]}" value="${f[3]}" inputmode="decimal"></div>`).join('');
  $('#exerciseForm').innerHTML = `<div class="card"><h3>${ex.title}</h3>${fields || '<p>Aquest exercici genera automàticament la taula de veritat i el diagrama.</p>'}<div class="btnrow"><button class="primary" onclick="solveSelected()">Resoldre pas a pas</button><button class="secondary" onclick="window.print()">Imprimir</button><button class="secondary" onclick="copyResult()">Copiar</button><button class="secondary" onclick="saveCurrentFromResult()">Guardar</button></div><div id="result"></div></div>`;
}

function solveSelected(){
  const key = $('#exerciseSelect').value; const ex = exercises[key];
  $('#result').innerHTML = ex.solve();
}

function solveElevador(){
  const m=val('m'), h=val('h'), t=val('temps'), eta=val('eta'), pasmm=val('pas'), nm=val('nmotor');
  if([m,h,t,eta,pasmm,nm].some(x=>!Number.isFinite(x)||x<=0)) return err('Cal introduir valors positius i coherents.');
  const g=9.81, E=m*g*h, Pm=E/t, Pe=Pm/eta, nvoltes=h/(pasmm/1000), ncargol=(nvoltes/t)*60, i=nm/ncargol;
  return res('Elevador amb cargol-femella', `
  <div class="formula">E = m · g · h &nbsp; | &nbsp; P<sub>mec</sub> = E / t &nbsp; | &nbsp; P<sub>elèc</sub> = P<sub>mec</sub> / η</div>
  <ol><li>Energia: E = ${fmt(m)} · 9,81 · ${fmt(h)} = <b>${fmt(E)} J</b></li><li>Potència mecànica: Pmec = ${fmt(E)} / ${fmt(t)} = <b>${fmt(Pm)} W</b></li><li>Potència elèctrica: Pelèc = ${fmt(Pm)} / ${fmt(eta)} = <b>${fmt(Pe)} W</b></li><li>Voltes del cargol: n = ${fmt(h)} / ${fmt(pasmm/1000)} = <b>${fmt(nvoltes)} voltes</b></li><li>Velocitat del cargol: ${fmt(ncargol)} min⁻¹</li><li>Relació de transmissió: i = ${fmt(nm)} / ${fmt(ncargol)} = <b>${fmt(i)}</b></li></ol><p><b>Interpretació:</b> el reductor ha d’abaixar la velocitat del motor perquè el cargol giri molt més lentament i elevi la càrrega amb seguretat.</p><p><b>Error habitual:</b> no convertir el pas de rosca de mm/volta a m/volta.</p>`);
}
function solveCalor(){
  const V=val('v'), T1=val('t1'), T2=val('t2'), ce=val('ce'), eta=val('eta'), pc=val('pc'), consum=val('consum'), cart=val('cartutx');
  if([V,T1,T2,ce,eta,pc,consum,cart].some(x=>!Number.isFinite(x))||eta<=0||pc<=0||consum<=0) return err('Revisa dades: rendiment, poder calorífic i consum han de ser positius.');
  const ma=V, dT=T2-T1, Q=ma*ce*dT, Ecomb=Q/eta, mgas=(Ecomb/1000)/pc*1000, temps=mgas/consum, auto=cart/consum;
  return res('Calor i combustible', `<div class="formula">Q = m · ce · ΔT &nbsp; | &nbsp; E<sub>comb</sub> = Q / η &nbsp; | &nbsp; m<sub>gas</sub> = E<sub>comb</sub> / pc</div><ol><li>Massa d’aigua aproximada: ${fmt(ma)} kg</li><li>ΔT = ${fmt(T2)} - ${fmt(T1)} = ${fmt(dT)} °C</li><li>Q = ${fmt(ma)} · ${fmt(ce)} · ${fmt(dT)} = <b>${fmt(Q)} kJ</b></li><li>Energia del combustible: ${fmt(Q)} / ${fmt(eta)} = <b>${fmt(Ecomb)} kJ</b></li><li>Massa de gas: ${fmt(mgas)} g</li><li>Temps de funcionament: ${fmt(temps*60)} min</li><li>Autonomia del cartutx: ${fmt(auto)} h</li></ol><p><b>Interpretació:</b> un rendiment baix obliga a consumir més combustible que l’energia útil que realment rep l’aigua.</p>`);
}
function solveOhm(){const U=val('u'),R=val('r'); if(U<=0||R<=0) return err('La tensió i la resistència han de ser positives.'); const I=U/R,P=U*I; return res('Llei d’Ohm i potència',`<div class="formula">I = U / R &nbsp; | &nbsp; P = U · I</div><ol><li>I = ${fmt(U)} / ${fmt(R)} = <b>${fmt(I)} A</b></li><li>P = ${fmt(U)} · ${fmt(I)} = <b>${fmt(P)} W</b></li></ol><p><b>Interpretació:</b> com més petita és la resistència, més gran és el corrent per a la mateixa tensió.</p>`)}
function solveCA(){const U=val('uef'),I=val('ief'); if(U<=0||I<=0) return err('Els valors eficaços han de ser positius.'); return res('Valor eficaç i màxim',`<div class="formula">Umax = Uef · √2 &nbsp; | &nbsp; Imax = Ief · √2</div><ol><li>Umax = ${fmt(U)} · √2 = <b>${fmt(U*Math.SQRT2)} V</b></li><li>Imax = ${fmt(I)} · √2 = <b>${fmt(I*Math.SQRT2)} A</b></li></ol><p><b>Error habitual:</b> confondre valor eficaç amb valor màxim.</p>`)}
function solveRL(){const U=val('u'),f=val('f'),LmH=val('l'),R=val('r'); if([U,f,LmH,R].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const L=LmH/1000, XL=2*Math.PI*f*L, Z=Math.sqrt(R*R+XL*XL), I=U/Z; return res('Circuit RL sèrie',`<div class="formula">XL = 2πfL &nbsp; | &nbsp; Z = √(R² + XL²) &nbsp; | &nbsp; I = U/Z</div><ol><li>XL = 2π · ${fmt(f)} · ${fmt(L)} = <b>${fmt(XL)} Ω</b></li><li>Z = √(${fmt(R)}² + ${fmt(XL)}²) = <b>${fmt(Z)} Ω</b></li><li>I = ${fmt(U)} / ${fmt(Z)} = <b>${fmt(I)} A</b></li></ol><p><b>Interpretació:</b> la bobina s’oposa més al corrent quan augmenta la freqüència o la inductància.</p>`)}
function solveMotor(){const P=val('pu'),n=val('n'),Pa=val('pa'); if([P,n,Pa].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const w=2*Math.PI*n/60, M=P/w, eta=P/Pa*100; return res('Motor: parell i rendiment',`<div class="formula">ω = 2πn/60 &nbsp; | &nbsp; M = P/ω &nbsp; | &nbsp; η = Pu/Pa</div><ol><li>ω = 2π · ${fmt(n)} / 60 = <b>${fmt(w)} rad/s</b></li><li>M = ${fmt(P)} / ${fmt(w)} = <b>${fmt(M)} N·m</b></li><li>η = ${fmt(P)} / ${fmt(Pa)} = <b>${fmt(eta)} %</b></li></ol>`)}
function solveTrifasica(){const U=val('u'),I=val('i'),c=val('cos'); if(U<=0||I<=0||c<0||c>1) return err('Revisa U, I i cos φ. El cos φ ha d’estar entre 0 i 1.'); const S=Math.sqrt(3)*U*I, P=S*c, Q=S*Math.sqrt(1-c*c); return res('Trifàsica bàsica',`<div class="formula">S = √3 · U · I &nbsp; | &nbsp; P = S · cosφ &nbsp; | &nbsp; Q = S · sinφ</div><ol><li>S = √3 · ${fmt(U)} · ${fmt(I)} = <b>${fmt(S)} VA</b></li><li>P = ${fmt(S)} · ${fmt(c)} = <b>${fmt(P)} W</b></li><li>Q = <b>${fmt(Q)} var</b></li></ol>`)}
function solvePneumatica(){const pbar=val('p'),dmm=val('d'),cmm=val('cursa'),qL=val('q'); if([pbar,dmm,cmm,qL].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const p=pbar*1e5, d=dmm/1000, A=Math.PI*d*d/4, F=p*A, Q=qL/1000/60, v=Q/A, t=(cmm/1000)/v; return res('Força d’un cilindre',`<div class="formula">A = πd²/4 &nbsp; | &nbsp; F = p · A &nbsp; | &nbsp; v = Q/A</div><ol><li>A = π · ${fmt(d)}² / 4 = <b>${fmt(A,6)} m²</b></li><li>F = ${fmt(p)} · ${fmt(A,6)} = <b>${fmt(F)} N</b></li><li>v = ${fmt(Q,6)} / ${fmt(A,6)} = <b>${fmt(v)} m/s</b></li><li>Temps de recorregut = <b>${fmt(t)} s</b></li></ol><p><b>Error habitual:</b> no convertir bar a Pa, mm a m o L/min a m³/s.</p>`)}
function solveLogica(){
  let rows=''; for(let l=0;l<=1;l++)for(let n=0;n<=1;n++)for(let t=0;t<=1;t++)for(let i=0;i<=1;i++){const p=(l&&!t&&!n)||(i&&t)?1:0; rows+=`<tr><td>${l}</td><td>${n}</td><td>${t}</td><td>${i}</td><td><b>${p}</b></td></tr>`}
  return res('Persiana domòtica',`<div class="formula">p = l · ¬t · ¬n + i · t</div><p>La persiana puja si hi ha llum exterior, no fa calor i no és mode nocturn, o si hi ha persones i la temperatura és alta.</p><div class="tablewrap"><table><thead><tr><th>l</th><th>n</th><th>t</th><th>i</th><th>p</th></tr></thead><tbody>${rows}</tbody></table></div><h3>Diagrama de portes</h3><svg class="gate-svg" viewBox="0 0 720 250" role="img" aria-label="Diagrama lògic"><text x="20" y="40">l</text><text x="20" y="80">¬t</text><text x="20" y="120">¬n</text><rect x="90" y="25" width="110" height="110" rx="18" fill="#e6f1ec" stroke="#1f6f5b"/><text x="115" y="88">AND</text><text x="250" y="65">i</text><text x="250" y="105">t</text><rect x="310" y="50" width="100" height="75" rx="18" fill="#e6f1ec" stroke="#1f6f5b"/><text x="335" y="95">AND</text><rect x="500" y="60" width="100" height="90" rx="18" fill="#dbeafe" stroke="#2563eb"/><text x="535" y="112">OR</text><text x="650" y="112">p</text><line x1="45" y1="36" x2="90" y2="50" stroke="#333"/><line x1="50" y1="76" x2="90" y2="80" stroke="#333"/><line x1="52" y1="116" x2="90" y2="110" stroke="#333"/><line x1="200" y1="80" x2="500" y2="85" stroke="#333"/><line x1="410" y1="90" x2="500" y2="125" stroke="#333"/><line x1="600" y1="105" x2="645" y2="105" stroke="#333"/></svg><p><b>Interpretació:</b> el segon terme té prioritat funcional perquè, si hi ha persones i fa calor, la persiana puja independentment de la llum o del mode nocturn.</p>`)
}

function res(title, inner){ return `<section class="result" id="printableResult"><h2>Resolució d’exercici</h2><p><b>Tipus:</b> ${title}</p><div class="steps">${inner}</div><h3>Exercici similar</h3><p>Canvia una dada de l’enunciat i repeteix el mateix esquema: dades, fórmula, substitució, càlcul i interpretació.</p></section>`; }
function err(msg){ return `<div class="bad"><b>Error didàctic:</b> ${msg}</div>`; }
function copyResult(){ const t=$('#result')?.innerText||''; navigator.clipboard?.writeText(t); alert('Resolució copiada.'); }
function saveCurrentFromResult(){ const title=$('#exerciseSelect')?.selectedOptions?.[0]?.textContent || 'Exercici'; const content=$('#result')?.innerText || ''; saveCurrent(title, content); }
function saveCurrent(title, content){ if(!content.trim()){alert('Primer cal generar una resolució.'); return;} const h=JSON.parse(localStorage.getItem(LS)||'[]'); h.unshift({title, content, date:new Date().toLocaleString('ca-ES')}); localStorage.setItem(LS, JSON.stringify(h.slice(0,80))); alert('Guardat a l’historial.'); }
function historial(){ const h=JSON.parse(localStorage.getItem(LS)||'[]'); app.innerHTML=`<section class="card"><h2>Historial</h2><div class="btnrow no-print"><button class="secondary" onclick="localStorage.removeItem(LS);historial()">Esborrar tot</button></div>${h.length? h.map((x,i)=>`<article class="card"><h3>${esc(x.title)}</h3><p class="small">${esc(x.date)}</p><pre style="white-space:pre-wrap;font-family:inherit">${esc(x.content)}</pre><div class="btnrow no-print"><button class="secondary" onclick="navigator.clipboard.writeText(${JSON.stringify(x.content)})">Copiar</button><button class="secondary" onclick="deleteHist(${i})">Esborrar</button></div></article>`).join(''):'<p>No hi ha exercicis guardats.</p>'}</section>`; }
function deleteHist(i){ const h=JSON.parse(localStorage.getItem(LS)||'[]'); h.splice(i,1); localStorage.setItem(LS, JSON.stringify(h)); historial(); }

function calculadores(){ exercicisView(); $('section.card h2').textContent='Calculadores tècniques'; }
function practica(){
  app.innerHTML=`<section class="card"><h2>Pràctica autocorregible</h2><div class="grid"><div class="field"><label>Bloc</label><select id="pracBloc"><option value="calor">Energia tèrmica</option><option value="ohm">Electricitat</option><option value="motor">Motors</option></select></div><div class="field"><label>Nivell</label><select id="pracNiv"><option>N1 · identificar</option><option>N2 · calcular</option><option>N3 · interpretar</option><option>N4 · justificar</option></select></div></div><button class="primary" onclick="generatePractice()">Generar exercici</button><div id="practiceArea"></div></section>`;
}
function generatePractice(){
  const bloc=$('#pracBloc').value; let en='', ans=0, unit='';
  if(bloc==='calor'){const V=1+Math.floor(Math.random()*4), T1=10+Math.floor(Math.random()*15), T2=80+Math.floor(Math.random()*21); ans=V*4.186*(T2-T1); unit='kJ'; en=`Escalfem ${V} L d’aigua de ${T1} °C a ${T2} °C. Calcula Q amb ce = 4,186 kJ/(kg·°C).`;}
  if(bloc==='ohm'){const U=[12,24,48,230][Math.floor(Math.random()*4)], R=[4,6,8,12,20][Math.floor(Math.random()*5)]; ans=U/R; unit='A'; en=`Una resistència de ${R} Ω està alimentada amb ${U} V. Calcula la intensitat.`;}
  if(bloc==='motor'){const P=[350,500,750,1100][Math.floor(Math.random()*4)], n=[550,960,1420][Math.floor(Math.random()*3)]; ans=P/(2*Math.PI*n/60); unit='N·m'; en=`Un motor dona ${P} W a ${n} min⁻¹. Calcula el parell útil.`;}
  $('#practiceArea').innerHTML=`<div class="card"><h3>Exercici generat</h3><p>${en}</p><div class="field"><label>Resposta (${unit})</label><input id="pracAns" inputmode="decimal"></div><button class="primary" onclick="checkPractice(${ans}, '${unit}')">Comprovar</button><div id="pracRes"></div></div>`;
}
function checkPractice(ans, unit){ const a=val('pracAns'); const ok=Math.abs(a-ans)<=Math.max(0.02*Math.abs(ans),0.05); $('#pracRes').innerHTML=`<div class="${ok?'ok':'bad'}"><b>${ok?'Correcte':'Cal revisar-ho'}</b>. Solució orientativa: ${fmt(ans)} ${unit}. Marge acceptat: 2 %.</div>`; }

function formulari(){
  const groups = {}; formulas.forEach(f => {groups[f[0]] ??=[]; groups[f[0]].push(f)});
  app.innerHTML=`<section class="card"><h2>Formulari</h2>${Object.entries(groups).map(([g,fs])=>`<details class="card" open><summary><b>${g}</b></summary>${fs.map(f=>`<div class="formula"><b>${f[1]}</b><br><span class="small">${f[2]}</span></div>`).join('')}</details>`).join('')}</section>`;
}

if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
setView('inici');
