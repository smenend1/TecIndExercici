'use strict';

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const app = $('#app');
const LS = 'ti_exercicis_plus_historial_v11';
let currentPauId = null;
let pauRole = 'alumne';
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


const exerciseCards = [
  {key:'elevador', bloc:'Mecanismes i energia', desc:'Potència mecànica, potència elèctrica, voltes del cargol i relació de transmissió.'},
  {key:'calor', bloc:'Energia tèrmica', desc:'Escalfament d’aigua, rendiment, poder calorífic, massa de gas i autonomia.'},
  {key:'ohm', bloc:'Electricitat bàsica', desc:'Llei d’Ohm, intensitat i potència elèctrica.'},
  {key:'ca', bloc:'Corrent altern', desc:'Conversió entre valor eficaç i valor màxim en senyals sinusoidals.'},
  {key:'rl', bloc:'Corrent altern', desc:'Reactància inductiva, impedància i intensitat en un circuit RL sèrie.'},
  {key:'motor', bloc:'Màquines elèctriques', desc:'Velocitat angular, parell motor i rendiment.'},
  {key:'trifasica', bloc:'Sistemes trifàsics', desc:'Potència aparent, activa i reactiva en càrrega trifàsica equilibrada.'},
  {key:'pneumatica', bloc:'Pneumàtica', desc:'Força d’un cilindre, cabal, velocitat i temps de recorregut.'},
  {key:'logica', bloc:'Lògica digital', desc:'Taula de veritat, funció booleana i diagrama de portes per a una persiana domòtica.'}
];


const pauBank = [
  {id:'tec2025-s1-e1', any:2025, materia:'Tecnologia i enginyeria', serie:'Sèrie 1', exercici:'Exercici 1', bloc:'Test PAU', tipus:'test', nivell:'N1-N2', titol:'Qüestions curtes de Tecnologia i Enginyeria', resum:'Bloc de 8 qüestions tipus test: toleràncies, consum de motor, energia potencial, corrent altern, assaig de tracció, calor específica, ajustos i circuit RL.', apartats:['Respondre 5 de 8 qüestions.', 'Aplicar penalització de resposta incorrecta.', 'Justificar la resposta correcta.'], dades:['Diàmetre nominal i tolerància ±0,05 mm.', 'Motor de propà a 2 500 min⁻¹.', 'Resistència de 17 Ω amb Uef = 230 V.', 'Bloc de coure de 40 kg, ce = 0,385 kJ/(kg·°C).', 'Circuit RL amb L = 100 mH, f = 50 Hz, U = 230 V, I = 2 A.'], formules:['mínim = nominal − tolerància','E = m·g·h','Ief = Uef/R','Imax = Ief·√2','Q = m·ce·ΔT','XL = 2πfL','Z = U/I'], pistes:['Llegeix si demanen valor eficaç o valor màxim.', 'En energia potencial, sense pèrdues només importa el desnivell.', 'En un ajust, calcula el límit inferior del forat i el límit superior de l’eix.'], errors:['Respondre més qüestions de les permeses.', 'Confondre W·s amb J i W·h amb energia.', 'No convertir mH a H.'], resolucio:'Fitxa de test: l’app pot corregir i explicar qüestions representatives. Algunes qüestions amb figura s’han de treballar amb interpretació visual a classe.', enllac:'test'},
  {id:'tec2025-s1-e2', any:2025, materia:'Tecnologia i enginyeria', serie:'Sèrie 1', exercici:'Exercici 2', bloc:'Lògica digital', tipus:'resolució guiada', nivell:'N2-N3', titol:'Control domòtic d’una persiana', resum:'Disseny d’un sistema de control lògic amb variables de llum, mode nocturn, temperatura i presència.', apartats:['Definir variables.', 'Fer la taula de veritat.', 'Obtenir la funció lògica.', 'Representar portes lògiques.'], dades:['l: llum exterior.', 'n: mode nocturn.', 't: temperatura interior alta.', 'i: presència de persones.', 'p: persiana puja.'], formules:['p = l·¬t·¬n + i·t'], pistes:['“Excepte si el mode nocturn està activat” implica ¬n.', '“Temperatura no alta” implica ¬t.', '“A més també puja si...” implica OR entre dues condicions.'], errors:['Usar n en comptes de ¬n.', 'Oblidar el segon cas independent de llum i mode nocturn.', 'Fer AND entre condicions alternatives.'], resolucio:'Aquest exercici està implementat amb taula de veritat i diagrama de portes.', enllac:'logica'},
  {id:'tec2025-s1-e3', any:2025, materia:'Tecnologia i enginyeria', serie:'Sèrie 1', exercici:'Exercici 3', bloc:'Mecanismes i energia', tipus:'calculadora guiada', nivell:'N2-N3', titol:'Elevador de taller amb cargol-femella', resum:'Càlcul de potència mecànica, potència elèctrica, voltes del cargol i relació de transmissió.', apartats:['a) Potència mecànica necessària.', 'b) Potència elèctrica de cada motor.', 'c) Voltes del cargol.', 'd) Relació de transmissió del reductor.'], dades:['h = 1,8 m.', 'm = 1 900 kg per columna.', 'pas = 7 mm/volta.', 'η = 0,4.', 'n motor = 1 420 min⁻¹.', 't = 45 s.'], formules:['E = m·g·h','Pmec = E/t','Pelèc = Pmec/η','nvoltes = h/pas','i = nmotor/ncargol'], pistes:['El pas s’ha de passar de mm/volta a m/volta.', 'Si la massa és per columna, el càlcul és per motor.', 'Per obtenir n del cargol, passa voltes/segon a min⁻¹.'], errors:['Fer servir el temps en minuts dins P = E/t.', 'No aplicar el rendiment.', 'Invertir la relació de transmissió.'], resolucio:'Implementat com a resolutor amb dades modificables.', enllac:'elevador'},
  {id:'tec2025-s1-e4', any:2025, materia:'Tecnologia i enginyeria', serie:'Sèrie 1', exercici:'Exercici 4', bloc:'Energia tèrmica', tipus:'calculadora guiada', nivell:'N2-N3', titol:'Cuina de càmping amb cartutx de butà', resum:'Estudi de l’energia necessària per bullir aigua i del consum de gas en una cocció.', apartats:['a) Massa de gas per arribar a ebullició.', 'b) Temps fins a ebullició.', 'c) Percentatge de cartutx consumit en tot el procés.'], dades:['m cartutx = 230 g.', 'η = 0,2.', 'consum màxim = 155 g/h.', 'pc = 45,8 MJ/kg.', 'V aigua = 2 L.', 'T inicial = 15 °C.', 'ce aigua = 4,186 kJ/(kg·°C).', 'cocció: 18 min al 30 % del consum màxim.'], formules:['Q = m·ce·ΔT','Egas = Q/η','mgas = Egas/pc','t = mgas/consum','Δ = mgas_total/mcartutx·100'], pistes:['2 L d’aigua equivalen aproximadament a 2 kg.', 'Vigila kJ, MJ i kg/g.', 'A la cocció posterior el consum és el 30 % del màxim.'], errors:['No aplicar el rendiment.', 'No sumar el gas de bullir i el de coure.', 'Fer el percentatge amb kg i g barrejats.'], resolucio:'Implementat com a resolutor de calor, combustible i rendiment.', enllac:'calor'},
  {id:'elec2023-s1-e1', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 1', bloc:'Test Electrotècnia', tipus:'test', nivell:'N1-N2', titol:'Qüestions curtes d’electrotècnia', resum:'Test sobre funció lògica, transformador ideal, commutadors, motor CC i potència en càrrega capacitiva trifàsica.', apartats:['5 qüestions de resposta única.', 'Correcció amb penalització.'], dades:['Transformador monofàsic ideal.', 'Motor CC amb PN, UN, IN, nN i pèrdues.', 'Capacitat entre dues fases de xarxa trifàsica.'], formules:['P = U²/R','ω = 2πn/60','M = P/ω','Q = −U²/XC','S = U·I'], pistes:['En un transformador ideal amb rt = 1, primari i secundari tenen la mateixa tensió nominal.', 'Per calcular parell cal passar n a rad/s.', 'Una capacitat consumeix potència reactiva negativa.'], errors:['Usar potència absorbida en comptes de potència útil per al parell.', 'Assignar signe positiu a Q capacitiva.'], resolucio:'Fitxa classificadora amb pistes. Resolutors associats: motor, trifàsica i lògica.', enllac:'motor'},
  {id:'elec2023-s1-e2', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 2', bloc:'Circuits resistius', tipus:'fitxa per parts', nivell:'N3', titol:'Circuit amb dues fonts i resistències', resum:'Càlcul de potències aportades per fonts i dissipades en resistències per a dos casos: R3 = 0 Ω i R3 = ∞ Ω.', apartats:['a) PU1 i PU2 amb R3 = 0 Ω.', 'b) PR2 amb R3 = 0 Ω.', 'c) PU1 i PU2 amb R3 = ∞ Ω.', 'd) PR2 amb R3 = ∞ Ω.'], dades:['U1 = 24 V.', 'U2 = 48 V.', 'R1 = 6 Ω.', 'R2 = 10 Ω.', 'Cas R3 = curtcircuit.', 'Cas R3 = circuit obert.'], formules:['Llei de Kirchhoff de nusos','Llei d’Ohm','P = U·I','P = I²R'], pistes:['Dibuixa el circuit equivalent per a cada cas.', 'R3 = 0 Ω uneix dos nusos.', 'R3 = ∞ Ω obre la branca.'], errors:['No redibuixar el circuit per cada cas.', 'Confondre potència aportada per la font amb potència dissipada.'], resolucio:'Fitxa per parts. Requereix esquema; en v6 queda com a exercici guiat no automàtic.'},
  {id:'elec2023-s1-e3', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 3', bloc:'Sistemes trifàsics', tipus:'fitxa per parts', nivell:'N3', titol:'Càrrega trifàsica equilibrada en estrella', resum:'Càlcul de wattímetre, inductància, resistència i condensadors de compensació en una càrrega trifàsica.', apartats:['a) Mesura del wattímetre.', 'b) Valor de L.', 'c) Valor de R.', 'd) Capacitat per factor de potència unitari.'], dades:['U composta = 400 V.', 'f = 50 Hz.', 'I = 9 A.', 'Z = R + j5 Ω segons figura.'], formules:['Uf = U/√3','S = √3·U·I','P = 3·Uf·I·cosφ','XL = 2πfL','QC = 3·Uf²/XC'], pistes:['En estrella, la tensió de fase és U/√3.', 'El corrent de línia coincideix amb el de fase.', 'La compensació capacitiva ha d’anul·lar la Q inductiva.'], errors:['Fer servir U composta com si fos tensió de fase.', 'Oblidar el factor 3 en potències totals.'], resolucio:'Fitxa per parts. Calculadora associada: trifàsica i RL.', enllac:'trifasica'},
  {id:'elec2023-s1-e4', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 4', bloc:'Electrònica de potència', tipus:'fitxa visual', nivell:'N3-N4', titol:'Rectificador d’ona sencera amb díodes avariats', resum:'Anàlisi d’un rectificador amb dos díodes en circuit obert i lectura d’oscil·loscopi.', apartats:['a) Freqüència de la tensió d’alimentació.', 'b) Parella de díodes avariats.', 'c) Valor eficaç de la tensió d’alimentació.', 'd) Potència lliurada per la font.'], dades:['R1 = R2 = 25 Ω.', 'Sonda 1:1.', 'Escala temps = 5 ms/div.', 'Escala tensió = 10 V/div.', 'Díodes ideals.'], formules:['T = divisions·escala','f = 1/T','Uef = Umax/√2','P = Uef²/R'], pistes:['Cal llegir el període a la pantalla de l’oscil·loscopi.', 'Si només apareix una semionada, el pont no rectifica completament.', 'La tensió a R2 és només una part de la tensió de càrrega.'], errors:['Confondre freqüència de la sortida amb freqüència d’entrada.', 'No tenir en compte que R1 i R2 estan en sèrie.'], resolucio:'Fitxa visual. Requereix interpretar la figura del PDF a classe.'},
  {id:'elec2023-s1-e5', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 5', bloc:'Màquines elèctriques', tipus:'fitxa per parts', nivell:'N3', titol:'Motor d’inducció trifàsic', resum:'Càlcul de parell, rendiment, parells de pols, lliscament i velocitat amb corba parell-velocitat.', apartats:['a) Parell nominal.', 'b) Rendiment.', 'c) Nombre de parells de pols.', 'd) Lliscament.', 'e) Velocitat amb càrrega resistent.'], dades:['PN = 50 kW.', 'UN = 400/230 V.', 'IN = 90/156 A.', 'nN = 2 860 min⁻¹.', 'cosφ = 0,85.', 'f = 50 Hz.'], formules:['ω = 2πn/60','M = P/ω','Pabs = √3·U·I·cosφ','η = Pu/Pabs','ns = 60f/p','s = (ns−n)/ns'], pistes:['Amb 50 Hz i velocitat propera a 3000 min⁻¹, el motor és de 1 parell de pols.', 'Per rendiment usa potència absorbida trifàsica.', 'El parell nominal surt de P útil i velocitat angular.'], errors:['Usar n en min⁻¹ directament dins P = Mω.', 'Triar malament 400/230 i 90/156 segons connexió.'], resolucio:'Fitxa per parts. Calculadora associada: motor.', enllac:'motor'},
  {id:'elec2023-s1-e6', any:2023, materia:'Electrotècnia', serie:'Sèrie 1', exercici:'Exercici 6', bloc:'Ressonància i factor de potència', tipus:'fitxa per parts', nivell:'N3-N4', titol:'Circuit RL amb condensador i ressonància', resum:'Càlcul de corrent, inductància, capacitat de ressonància, corrent capacitiu i wattímetre.', apartats:['a) Corrent per R amb interruptor obert.', 'b) Inductància L.', 'c) Capacitat C per factor de potència unitari.', 'd) Corrent per C.', 'e) Mesura del wattímetre.'], dades:['R = 10 Ω.', 'f = 50 Hz.', 'U = 150 V.', 'W = 250 W amb interruptor obert.'], formules:['P = I²R','XL = 2πfL','Q = U²/XL','XC = U²/Q','C = 1/(2πfXC)'], pistes:['Amb interruptor obert només treballa la branca RL.', 'En ressonància, QL i QC es compensen.', 'El wattímetre mesura potència activa.'], errors:['Pensar que el condensador consumeix potència activa ideal.', 'No diferenciar P, Q i S.'], resolucio:'Fitxa per parts. Calculadora associada: RL.', enllac:'rl'},
  {id:'elec2023-s5-e1', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 1', bloc:'Test Electrotècnia', tipus:'test', nivell:'N1-N2', titol:'Test de transformadors, lògica, trifàsica i reactiva', resum:'Test sobre transformador alimentat amb contínua, funció lògica, càrrega trifàsica amb avaria, combinació d’inductàncies i potència reactiva segons freqüència.', apartats:['5 qüestions de resposta única.', 'Correcció amb penalització.'], dades:['Transformador amb U1 contínua.', 'Càrrega trifàsica simètrica amb dues fases desconnectades.', 'Bobines de 4 mH.', 'Impedàncies 12+j8 Ω i 12−j8 Ω.'], formules:['P3φ = 3·Pfase','Leq sèrie = ΣL','1/Leq paral·lel = Σ(1/L)','Q = I²X'], pistes:['Un transformador necessita variació de flux per induir tensió al secundari.', 'En càrrega simètrica, la potència total inicial és tres vegades la d’una fase.', 'Les reactàncies canvien amb la freqüència.'], errors:['Aplicar relació de transformació a tensió contínua estable.', 'Oblidar que XL i XC no evolucionen igual amb f.'], resolucio:'Fitxa test amb explicacions conceptuals.'},
  {id:'elec2023-s5-e2', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 2', bloc:'Circuits resistius', tipus:'fitxa per parts', nivell:'N2-N3', titol:'Circuit amb amperímetres i wattímetre', resum:'Càlcul de mesures en diferents branques d’un circuit resistiu amb una font.', apartats:['a) A1.', 'b) Potència subministrada per U1.', 'c) Wattímetre.', 'd) A2.', 'e) A3.'], dades:['Valors de resistències i font indicats a la figura del PDF.'], formules:['Req sèrie/paral·lel','I = U/R','P = U·I','P = I²R'], pistes:['Redueix el circuit per branques.', 'Identifica què mesura cada amperímetre.', 'El wattímetre mesura potència activa de la branca on està connectat.'], errors:['Sumar resistències en paral·lel com si fossin en sèrie.', 'No seguir la connexió real dels instruments.'], resolucio:'Fitxa visual per treballar amb l’esquema.'},
  {id:'elec2023-s5-e3', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 3', bloc:'Sistemes trifàsics', tipus:'fitxa per parts', nivell:'N3', titol:'Càrrega trifàsica amb branques R // Z', resum:'Anàlisi de corrents de branca, neutre i potències totals en una càrrega trifàsica equilibrada.', apartats:['a) Amperímetre del neutre.', 'b) A3.', 'c) A2.', 'd) P, Q i S totals.', 'e) A1.'], dades:['U composta = 400 V.', 'f = 50 Hz.', 'R i Z segons figura.'], formules:['Uf = U/√3','I = U/Z','S = 3·Uf·Ifase','P = 3·Uf·I·cosφ','Q = 3·Uf·I·sinφ'], pistes:['En una càrrega simètrica equilibrada, el corrent pel neutre és zero.', 'Cada fase té branques en paral·lel.', 'Suma corrents fasorialment, no només aritmèticament si hi ha reactància.'], errors:['Fer suma escalar de corrents amb desfasament.', 'Oblidar que la tensió de fase és U/√3.'], resolucio:'Fitxa per parts. Calculadora associada: trifàsica.', enllac:'trifasica'},
  {id:'elec2023-s5-e4', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 4', bloc:'Electricitat aplicada', tipus:'fitxa per parts', nivell:'N2-N3', titol:'Circuit d’intermitència de moto', resum:'Comparació entre làmpades d’incandescència i LED, potència mitjana, resistència equivalent i resistència de compensació.', apartats:['a) Potència mitjana subministrada per la bateria.', 'b) Resistència equivalent de cada làmpada.', 'c) Corrent en làmpades LED.', 'd) Potència mitjana amb LED.', 'e) Resistència en paral·lel per igualar potència.'], dades:['U = 12 V.', 'C10 = 12 Ah.', '2 làmpades per costat.', 'Incandescència: 12 V, 10 W.', 'Freqüència 1,2 Hz, cicle 50 %.', 'LED: 5 díodes de 1,2 V en sèrie + RNL = 240 Ω.'], formules:['Pmitjana = Pencesa·cicle','R = U²/P','I = (U−ΣUdíodes)/R','P = U·I','Rcomp = U²/Pcomp'], pistes:['Quan el cicle és del 50 %, la potència mitjana és la meitat de la potència mentre està encès.', 'Hi ha dues làmpades per costat.', 'La resistència de compensació va en paral·lel amb el conjunt LED.'], errors:['Oblidar multiplicar per dues làmpades.', 'No restar la caiguda de tensió dels díodes.', 'Fer servir potència instantània en lloc de mitjana.'], resolucio:'Fitxa per parts amb dades completes del text extret.'},
  {id:'elec2023-s5-e5', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 5', bloc:'Màquines elèctriques', tipus:'fitxa per parts', nivell:'N3-N4', titol:'Motor CC amb ventilador', resum:'Motor de corrent continu d’imants permanents connectat a un ventilador amb parell resistent proporcional a ω².', apartats:['a) Parell nominal.', 'b) Potència útil nominal.', 'c) Resistència d’induït.', 'd) Tensió per fer girar el ventilador a 1 200 min⁻¹.'], dades:['UN = 500 V.', 'IN = 69 A.', 'nN = 1 750 min⁻¹.', 'ΓL = 0,0048744·ω².', 'Pèrdues mecàniques i escombretes negligibles.'], formules:['ω = 2πn/60','Γ = k·ω²','P = Γ·ω','E = U−RiI','Relació de motor CC: E proporcional a ω'], pistes:['En règim estacionari, parell motor = parell resistent.', 'Primer calcula ω nominal.', 'Per canviar velocitat, cal relacionar força contraelectromotriu i velocitat.'], errors:['Usar n en min⁻¹ sense convertir.', 'Confondre tensió d’alimentació amb força contraelectromotriu.'], resolucio:'Fitxa per parts. Calculadora associada: motor.', enllac:'motor'},
  {id:'elec2023-s5-e6', any:2023, materia:'Electrotècnia', serie:'Sèrie 5', exercici:'Exercici 6', bloc:'RLC paral·lel', tipus:'fitxa per parts', nivell:'N3-N4', titol:'Circuit RLC paral·lel', resum:'Càlcul de corrent resistiu, wattímetre, freqüència, potència reactiva inductiva i potències totals.', apartats:['a) Corrent per R.', 'b) Mesura del wattímetre.', 'c) Freqüència de la font.', 'd) QL.', 'e) P, Q i S de la font.'], dades:['Valors indicats a la figura del PDF.'], formules:['IR = U/R','P = U·IR','XL = 2πfL','XC = 1/(2πfC)','Q = U²/X','S = √(P² + Q²)'], pistes:['En paral·lel, totes les branques tenen la mateixa tensió.', 'El wattímetre mesura potència activa.', 'La reactiva inductiva i capacitiva tenen signe oposat.'], errors:['Sumar corrents fasorials com si fossin escalarment iguals.', 'No aplicar signes de QL i QC.'], resolucio:'Fitxa per parts visual.'}
];


const pauEnunciats = {
  'tec2025-s1-e1': `L’exercici 1 és un bloc de qüestions curtes tipus test. Cal indicar la resposta correcta de cinc qüestions. Les qüestions treballen toleràncies dimensionals, consum de combustible en motors, energia potencial en un funicular, corrent altern en una resistència, interpretació d’un assaig de tracció, calor específica, ajustos mecànics i circuit RL sèrie.`,
  'tec2025-s1-e2': `Es vol dissenyar el circuit electrònic que controla les persianes d’una casa domòtica. La persiana puja si hi ha llum intensa a l’exterior i la temperatura interior no és alta, excepte si el mode nocturn està activat. A més, també puja si hi ha persones a l’habitació i la temperatura interior és alta, independentment de la llum exterior o el mode nocturn. En qualsevol altre cas, la persiana baixarà o romandrà immòbil. Cal elaborar la taula de veritat, determinar la funció lògica i representar el sistema amb portes lògiques.`,
  'tec2025-s1-e3': `La figura mostra un elevador de taller de dues columnes. Dins de cada columna hi ha una transmissió cargol-femella accionada per un motor i un reductor. L’alçada màxima d’elevació és h = 1,8 m, la massa suportada per cada columna és m = 1 900 kg, el pas de rosca és de 7 mm per volta, el rendiment del conjunt és η = 0,4, la velocitat del motor és n = 1 420 min⁻¹ i el temps d’elevació és t = 45 s. Cal determinar la potència mecànica, la potència elèctrica de cada motor, les voltes del cargol i la relació de transmissió del reductor.`,
  'tec2025-s1-e4': `Una cuina portàtil de càmping funciona amb cartutxos de gas butà de 230 g. El cremador té un rendiment η = 0,2, un consum màxim de 155 g/h i el butà té un poder calorífic de 45,8 MJ/kg. Es vol estudiar el consum de gas per cuinar arròs per a 5 persones amb 2 L d’aigua que inicialment es troben a 15 °C. La calor específica de l’aigua és 4,186 kJ/(kg·°C). Cal determinar la massa de gas necessària per començar a bullir, el temps i l’autonomia o consum del cartutx.`,
  'elec2023-s1-e1': `Bloc de qüestions tipus test d’Electrotècnia. Es plantegen preguntes sobre funcions lògiques a partir d’una taula de veritat, transformador monofàsic ideal, instal·lació d’enllumenat amb commutadors, parell nominal d’un motor de corrent continu i potència reactiva/aparent en una xarxa trifàsica.`,
  'elec2023-s1-e2': `El circuit mostra dues fonts de tensió U1 i U2 que alimenten diverses càrregues resistives. Algunes resistències tenen el mateix valor i apareixen amb el mateix nom. Cal determinar la potència aportada per cada font i la potència dissipada per cada R2 en dos casos: R3 = 0 Ω i R3 = ∞ Ω.`,
  'elec2023-s1-e3': `El circuit és alimentat per un sistema trifàsic simètric i equilibrat de tensió composta U i freqüència 50 Hz. La càrrega trifàsica està formada per tres impedàncies idèntiques connectades en estrella. L’amperímetre A1 mesura 9 A. Cal determinar la lectura del wattímetre, el valor de la inductància, el valor de la resistència i la capacitat necessària per obtenir factor de potència unitari.`,
  'elec2023-s1-e4': `Una font de tensió sinusoidal alimenta un rectificador d’ona sencera que no funciona correctament. Hi ha dos díodes espatllats en circuit obert. La càrrega està formada per dues resistències en sèrie i un oscil·loscopi mesura la tensió sobre una d’elles. A partir de l’escala temporal i de tensió de l’oscil·loscopi, cal determinar la freqüència, la parella de díodes avariats, el valor eficaç de la tensió d’alimentació i la potència lliurada.`,
  'elec2023-s1-e5': `Un motor d’inducció trifàsic presenta dades de placa: potència nominal, tensió, intensitat, velocitat nominal, cos φ i freqüència. També es dona la corba parell-velocitat del motor i la corba del parell resistent de la càrrega. Cal determinar el parell desenvolupat, el rendiment, el nombre de parells de pols, el lliscament i la velocitat de funcionament amb la càrrega indicada.`,
  'elec2023-s1-e6': `Un circuit alimentat amb tensió alterna conté una branca resistiva-inductiva i un condensador connectable amb interruptor. Amb l’interruptor obert es dona la lectura del wattímetre. Cal determinar el corrent per la resistència i la inductància. Amb l’interruptor tancat cal determinar la capacitat que fa que el conjunt tingui factor de potència unitari, el corrent pel condensador i la lectura final del wattímetre.`,
  'elec2023-s5-e1': `Bloc de qüestions tipus test d’Electrotècnia. Es treballen un transformador monofàsic alimentat amb tensió contínua, una funció lògica a partir d’una taula de veritat, una càrrega trifàsica amb avaria, combinacions d’inductàncies i potència reactiva en funció de la freqüència.`,
  'elec2023-s5-e2': `En un circuit resistiu amb una font de tensió, diversos amperímetres i un wattímetre, cal determinar les lectures dels instruments i la potència subministrada per la font. L’exercici obliga a identificar branques, resistències en sèrie o paral·lel i què mesura cada aparell.`,
  'elec2023-s5-e3': `El circuit és alimentat per un sistema trifàsic simètric i equilibrat. La càrrega trifàsica està formada per tres branques idèntiques en estrella; cada branca té una resistència en paral·lel amb una impedància inductiva. Cal determinar el corrent pel neutre, les lectures dels amperímetres i les potències activa, reactiva i aparent totals.`,
  'elec2023-s5-e4': `La figura mostra un circuit d’intermitència per a motos alimentat amb una bateria de 12 V i un relé tèrmic. Cada costat té dues làmpades en paral·lel. Inicialment són làmpades d’incandescència de 12 V i 10 W amb un cicle d’encesa del 50 %. Després se substitueixen per làmpades LED. Cal calcular potència mitjana, resistència equivalent, corrents, nova potència mitjana i resistència de compensació.`,
  'elec2023-s5-e5': `Un motor de corrent continu d’imants permanents alimenta un ventilador. Es donen tensió nominal, intensitat nominal, velocitat nominal i una expressió del parell resistent proporcional al quadrat de la velocitat angular. Cal determinar parell nominal, potència útil, resistència d’induït i tensió necessària per a una altra velocitat.`,
  'elec2023-s5-e6': `Un circuit RLC en paral·lel és alimentat amb tensió alterna. A partir de les dades de la figura, cal determinar el corrent per la resistència, la lectura del wattímetre, la freqüència de la font, la potència reactiva inductiva i les potències activa, reactiva i aparent totals subministrades per la font.`
};

pauBank.forEach(x => {
  x.enunciat = pauEnunciats[x.id] || x.resum || '';
});



// Banc PAU multiany afegit a la v9 a partir dels PDF 2021, 2022 i 2024 pujats pel docent.
const pauBankV9 = [
  {
    "id": "tec2024-s1-e1",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2024 S1",
    "resum": "Test sobre motor de benzina, tracció, calor, fotovoltaica i relació de compressió.",
    "enunciat": "Bloc de cinc qüestions tipus test: consum de combustible en un cicle, interpretació de corbes tensió-deformació, escalfament d’aigua, energia produïda per plaques solars i volum de cambra de combustió d’un motor.",
    "apartats": [
      "Respondre les qüestions tipus test.",
      "Justificar la fórmula o principi de cada resposta."
    ],
    "dades": [
      "Consum 10,2 L/h; n = 4 000 min⁻¹; ρ = 0,8 kg/L.",
      "Q = 3 000 J; V aigua = 50 mL; T inicial = 5 °C.",
      "A = 4,4 m²; irradiació = 13 kWh/m² dia; η = 0,3.",
      "Cursa 50,6 mm; diàmetre 56 mm; relació de compressió 7,3."
    ],
    "formules": [
      "massa = volum·densitat",
      "Q = m·ce·ΔT",
      "E = irradiació·A·η·dies",
      "Vcil = πd²cursa/4",
      "r = (Vcil + Vc)/Vc"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2024-s1-e2",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Accés a edifici amb tres sistemes",
    "resum": "Sistema d’accés amb clau, targeta, empremta i horari laboral/no laboral.",
    "enunciat": "L’accés a un edifici d’oficines està regulat per clau numèrica, targeta magnètica i empremta dactilar. En horari laboral n’hi ha prou amb validar un dels tres sistemes. Fora de l’horari laboral cal validar almenys dos dels tres. Cal fer taula de veritat, funció lògica i diagrama de portes.",
    "apartats": [
      "a) Taula de veritat.",
      "b) Funció lògica simplificada.",
      "c) Diagrama de portes."
    ],
    "dades": [
      "h = horari laboral.",
      "c = clau vàlida.",
      "t = targeta vàlida.",
      "e = empremta vàlida.",
      "a = accés permès."
    ],
    "formules": [
      "a = h·(c+t+e) + ¬h·(c·t + c·e + t·e)"
    ],
    "pistes": [
      "En horari laboral és una OR de tres controls.",
      "Fora d’horari calen combinacions de dos controls.",
      "Separa els casos h=1 i h=0."
    ],
    "errors": [
      "Oblidar el cas fora d’horari.",
      "Fer que en horari laboral calguin dos controls.",
      "No negar h en la segona part."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2024-s1-e3",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 3",
    "bloc": "Energia i mobilitat elèctrica",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Patinet elèctric en pujada",
    "resum": "Bateria, motor, pendent, energia consumida i parell del motor.",
    "enunciat": "Un patinet elèctric amb bateria ideal de 24 V i 250 Wh alimenta un motor de rendiment 0,85. La roda motriu té diàmetre 140 mm. El conjunt persona-patinet té massa 70 kg i recorre 2 km a 8 km/h en una pujada de 7°. Cal calcular potència elèctrica, velocitat de rotació, parell i percentatge de bateria consumida.",
    "apartats": [
      "a) Potència elèctrica consumida.",
      "b) Velocitat angular i parell del motor.",
      "c) Percentatge d’energia de la bateria consumida."
    ],
    "dades": [
      "U = 24 V.",
      "Ebat = 250 Wh.",
      "ηmot = 0,85.",
      "d roda = 140 mm.",
      "m = 70 kg.",
      "s = 2 km.",
      "v = 8 km/h.",
      "α = 7°"
    ],
    "formules": [
      "F = m·g·sinα",
      "Pmec = F·v",
      "Pelèc = Pmec/η",
      "ω = v/r",
      "Γ = Pmec/ω",
      "Δ = Econs/Ebat·100"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2024-s1-e4",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 4",
    "bloc": "Energia i combustibles",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Cotxe de combustió i emissions",
    "resum": "Acceleració d’un vehicle, energia cinètica, consum de benzina i emissions de CO2.",
    "enunciat": "Un cotxe de massa 1 250 kg parteix del repòs i arriba a 50 km/h en circuit horitzontal. El motor de combustió té rendiment 0,25. La benzina té poder calorífic 46 MJ/kg, densitat 0,72 g/cm³ i factor d’emissions 2,157 kg CO2/L. Es negligeixen resistències passives.",
    "apartats": [
      "Treball mecànic aportat.",
      "Energia química necessària.",
      "Volum de benzina consumit.",
      "Emissions de CO2."
    ],
    "dades": [
      "m = 1 250 kg.",
      "v = 50 km/h.",
      "η = 0,25.",
      "pc = 46 MJ/kg.",
      "ρ = 0,72 g/cm³.",
      "FE = 2,157 kg CO2/L."
    ],
    "formules": [
      "Ec = 1/2·m·v²",
      "Ecomb = Ec/η",
      "mcomb = Ecomb/pc",
      "V = m/ρ",
      "CO2 = V·FE"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2024-s1-e5",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 5",
    "bloc": "Estàtica i biomecànica",
    "tipus": "fitxa visual",
    "nivell": "N3",
    "titol": "Força del múscul tibial anterior",
    "resum": "Equilibri del peu amb moments respecte de l’articulació del turmell.",
    "enunciat": "Es vol estudiar la força necessària del múscul tibial anterior perquè la planta del peu es mantingui horitzontal quan està elevat. La figura representa el peu, el centre d’inèrcia i el punt d’inserció del múscul. Cal treballar equilibri de moments i forces.",
    "apartats": [
      "Diagrama de cos lliure.",
      "Moment del pes respecte O.",
      "Força del múscul.",
      "Reaccions a l’articulació si escau."
    ],
    "dades": [
      "m peu = 2,2 kg.",
      "Geometria indicada a la figura del PDF."
    ],
    "formules": [
      "ΣM_O = 0",
      "ΣFx = 0",
      "ΣFy = 0"
    ],
    "pistes": [
      "Pren moments al punt O per eliminar reaccions.",
      "El braç de palanca depèn de la figura.",
      "Indica sentit de cada força."
    ],
    "errors": [
      "No fer diagrama de cos lliure.",
      "Fer servir distàncies que no són perpendiculars."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2024-s1-e6",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 6",
    "bloc": "Corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N3",
    "titol": "Càrrega RL amb wattímetre",
    "resum": "Circuit de CA amb resistència i inductància, potència activa i condensador de compensació.",
    "enunciat": "Una font sinusoidal de 50 Hz alimenta una càrrega formada per R1 = 5 Ω en sèrie amb L1 = 7 mH. El wattímetre mesura W1 = 950 W. Cal calcular reactància inductiva, factor de potència i magnituds associades; l’exercici incorpora compensació amb capacitat segons la figura.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "f = 50 Hz.",
      "R1 = 5 Ω.",
      "L1 = 7 mH.",
      "W1 = 950 W."
    ],
    "formules": [
      "XL = 2πfL",
      "Z = √(R²+XL²)",
      "cosφ = R/Z",
      "P = U·I·cosφ",
      "QC = U²/XC"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "rl"
  },
  {
    "id": "tec2024-s5-e1",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2024 S5",
    "resum": "Test sobre electricitat domèstica, binari, energia, transmissió, resistivitat i calor.",
    "enunciat": "Bloc de qüestions tipus test de la sèrie 5 de 2024. Inclou intensitat d’una estufa, nombres binaris, energia i calor, transmissió mecànica i resistència elèctrica.",
    "apartats": [
      "Respondre qüestions tipus test.",
      "Justificar breument les opcions."
    ],
    "dades": [
      "Dades numèriques i condicions indicades a l’enunciat."
    ],
    "formules": [
      "Fórmules del bloc corresponent.",
      "Conversió d’unitats quan calgui."
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2024-s5-e2",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Llum encès per nombre 0 o senar",
    "resum": "Circuit combinacional de quatre entrades que encén un llum si el nombre binari és 0 o senar.",
    "enunciat": "Un sistema digital rep un número codificat en binari amb quatre entrades. El llum només ha d’estar encès si el nombre és 0 o un nombre senar. Cal fer taula de veritat, funció lògica simplificada i esquema de contactes equivalent.",
    "apartats": [
      "a) Taula de veritat.",
      "b) Funció lògica.",
      "c) Esquema de contactes."
    ],
    "dades": [
      "Entrades a,b,c,d.",
      "Sortida l = llum actiu."
    ],
    "formules": [
      "l = ¬a·¬b·¬c·¬d + d"
    ],
    "pistes": [
      "Un nombre senar en binari acaba amb 1.",
      "El nombre 0 és 0000.",
      "Simplifica amb el bit menys significatiu."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2024-s5-e3",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Mobilitat i impacte ambiental",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Comparativa cotxe elèctric/gasoil",
    "resum": "Comparació econòmica i ambiental entre vehicle elèctric i gasoil en trajectes anuals.",
    "enunciat": "Una persona fa trajectes diaris de 120 km per carretera i 10 km per ciutat durant 280 dies l’any. Es compara un cotxe elèctric i un de gasoil amb dades de compra, consum, preu de l’energia i factor d’emissions. Cal calcular emissions, costos i temps d’amortització o comparació.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "d extraurbà = 120 km/dia.",
      "d urbà = 10 km/dia.",
      "280 dies/any.",
      "Vehicle elèctric: preu, consum kWh/100 km, FE elèctric.",
      "Vehicle gasoil: preu, consums i FE."
    ],
    "formules": [
      "Consum anual = consum específic·distància/100",
      "Cost = energia·preu",
      "Emissions = consum·factor",
      "Sobrecost / estalvi anual"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2024-s5-e4",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Energia tèrmica",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Escalfador d’aigua i vitroceràmica",
    "resum": "Comparació entre escalfador submergible i vitroceràmica per escalfar aigua.",
    "enunciat": "Es vol escalfar 350 mL d’aigua de 20 °C a 95 °C. Es comparen un escalfador de 1 200 W que triga 125 s i una vitroceràmica que consumeix 0,11 kWh. La calor específica de l’aigua és 4,18 J/(g°C). Cal calcular energia teòrica, resistència, energia consumida i rendiments.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "V = 350 mL.",
      "T1 = 20 °C.",
      "T2 = 95 °C.",
      "Pescalf = 1 200 W.",
      "tescalf = 125 s.",
      "Evitro = 0,11 kWh.",
      "U = 230 V.",
      "ce = 4,18 J/(g°C)."
    ],
    "formules": [
      "Q = m·ce·ΔT",
      "R = U²/P",
      "E = P·t",
      "η = Q/Econs"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2024-s5-e5",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Estàtica",
    "tipus": "fitxa visual",
    "nivell": "N3",
    "titol": "Porta d’armari amb barres articulades",
    "resum": "Mecanisme per elevar una porta amb dues barres articulades i una força vertical.",
    "enunciat": "Un mecanisme eleva la porta d’un armari amb dues barres de longitud 2L i una força vertical aplicada al punt P. La porta és homogènia, de massa 3 kg, longitud 8L i gruix 2s. Cal fer diagrama de cos lliure, calcular la força aplicada i les forces a les barres quan φ = 30°.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "m = 3 kg.",
      "L = 50 mm.",
      "s = 30 mm.",
      "LAO = LBQ = 2L.",
      "φ = 30°."
    ],
    "formules": [
      "ΣM = 0",
      "ΣFx = 0",
      "ΣFy = 0"
    ],
    "pistes": [
      "Dibuixa totes les forces sobre la porta.",
      "Les barres de massa negligible transmeten força axial.",
      "Usa la geometria per obtenir braços de palanca."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2024-s5-e6",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Màquines elèctriques i mobilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motocicleta elèctrica amb motor a la roda",
    "resum": "Motor integrat a la roda, potència, parell, velocitat, autonomia i energia de bateria.",
    "enunciat": "Un prototip de motocicleta elèctrica integra el motor directament a la roda del darrere. A velocitat constant el motor subministra 15 kW i 150 N·m, amb autonomia de 200 km i pneumàtics de 630 mm de diàmetre. El rendiment del motor és 0,9. Cal calcular velocitat angular, velocitat d’avanç, temps màxim i energia de bateria.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "Pmot = 15 kW.",
      "Γ = 150 N·m.",
      "smàx = 200 km.",
      "d = 630 mm.",
      "ηmot = 0,9."
    ],
    "formules": [
      "ω = P/Γ",
      "v = ω·r",
      "t = s/v",
      "Esubm = P·t",
      "Ebat = Esubm/η"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2022-s2-e1",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2022 S2",
    "resum": "Test sobre Charpy, toleràncies, emissions, unitats de potència i engranatges.",
    "enunciat": "Bloc de cinc qüestions tipus test: energia absorbida en assaig de Charpy, tolerància d’una resistència normalitzada, petjada de carboni d’un automòbil, unitats de potència i relació de transmissió d’un tren d’engranatges.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "Pèndol de Charpy: L = 1 m, m = 22 kg, elevació 250 mm.",
      "Resistència 390 Ω entre 382,2 Ω i 397,8 Ω.",
      "Emissions 157,8 g CO2/km.",
      "Tren d’engranatges z1=14, z2=48, z3=16, z4=25."
    ],
    "formules": [
      "Eabs = mg(h1−h2)",
      "tolerància = ΔR/R",
      "distància = volum/consum",
      "i = producte dents conductores/conduïdes"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2022-s2-e2",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Control de sentit d’un ascensor",
    "resum": "Circuit digital per decidir si l’ascensor ha de pujar segons planta actual i planta seleccionada.",
    "enunciat": "El controlador d’un motor d’ascensor ha de generar z = 1 si l’ascensor ha de pujar. Les entrades a,b codifiquen la planta actual i c,d la planta seleccionada, totes en binari de 0 a 3. Cal elaborar taula de veritat, funció lògica i diagrama de portes.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "a,b = planta actual en binari.",
      "c,d = planta seleccionada.",
      "z = 1 si planta seleccionada > planta actual."
    ],
    "formules": [
      "z = 1 quan valor(c,d) > valor(a,b)"
    ],
    "pistes": [
      "Tradueix cada parell binari a decimal.",
      "Compara planta destí amb planta actual.",
      "La sortida val 0 si és igual o inferior."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2022-s2-e3",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 3",
    "bloc": "Energia i cost",
    "tipus": "fitxa per parts",
    "nivell": "N2",
    "titol": "Rentadora i discriminació horària",
    "resum": "Consum d’energia d’una rentadora i cost segons hores punta/vall.",
    "enunciat": "Un programa estàndard de rentadora dura 1,5 h. Els primers 30 min consumeix 2 000 W i la resta 250 W. Es fan 10 cicles al mes i hi ha tarifa amb hores vall, plana i punta. Cal calcular energia per cicle, percentatge en rentada, cost en punta/vall i estalvi anual.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "t total = 1,5 h.",
      "P1 = 2 000 W durant 30 min.",
      "P2 = 250 W la resta.",
      "U = 230 V.",
      "n = 10 cicles/mes.",
      "Preus punta/vall de la taula."
    ],
    "formules": [
      "E = P·t",
      "percentatge = Epart/Etotal·100",
      "cost = E·preu",
      "estalvi anual = diferència·n·12"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2022-s2-e4",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 4",
    "bloc": "Dinàmica rotacional",
    "tipus": "fitxa per parts",
    "nivell": "N3",
    "titol": "Volant d’inèrcia que s’atura",
    "resum": "Acceleració angular, voltes i energia dissipada en un volant d’inèrcia.",
    "enunciat": "Un volant amb moment d’inèrcia 0,9 kg·m² gira a 5 000 min⁻¹. Es desconnecta el motor i triga 1 min a aturar-se per un parell de fricció constant. Cal calcular acceleració angular, nombre de voltes i energia mecànica dissipada.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "I = 0,9 kg·m².",
      "n0 = 5 000 min⁻¹.",
      "t = 1 min.",
      "ωfinal = 0."
    ],
    "formules": [
      "ω = 2πn/60",
      "α = (ωf−ω0)/t",
      "θ = (ω0+ωf)t/2",
      "N = θ/(2π)",
      "E = 1/2·I·ω²"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2022-s2-e5",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 5",
    "bloc": "Estàtica i moments",
    "tipus": "fitxa visual",
    "nivell": "N3",
    "titol": "Barra manipulada amb tambor i cable",
    "resum": "Equilibri d’una barra homogènia accionada per motor i tambor.",
    "enunciat": "El sistema manipula una barra homogènia de longitud 2L i massa 50 kg mitjançant un cable enrotllat en un tambor de 450 mm. La barra està articulada a O i el sistema està en equilibri amb α = φ = 30°. Cal fer el diagrama de cos lliure, calcular tensió del cable, forces a O i parell del motor.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "m = 50 kg.",
      "L = 1 m.",
      "d tambor = 450 mm.",
      "α = φ = 30°."
    ],
    "formules": [
      "ΣM_O = 0",
      "ΣFx = 0",
      "ΣFy = 0",
      "Γ = T·r"
    ],
    "pistes": [
      "Pren moments respecte O.",
      "La tensió del cable genera el parell del tambor.",
      "Descompon forces segons geometria."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2022-s2-e6",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 6",
    "bloc": "Electricitat bàsica",
    "tipus": "fitxa per parts",
    "nivell": "N2",
    "titol": "Associació de resistències",
    "resum": "Circuit amb tres resistències en sèrie en paral·lel amb una quarta.",
    "enunciat": "Un circuit té R1=R2=R3=20 Ω en sèrie i R4=100 Ω en paral·lel amb el conjunt. S’alimenta amb tensió sinusoidal de 230 V. Cal dibuixar l’esquema, calcular resistència equivalent, intensitat i potència consumida.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "R1=R2=R3=20 Ω.",
      "R4=100 Ω.",
      "U = 230 V."
    ],
    "formules": [
      "Rs = R1+R2+R3",
      "1/Req = 1/Rs + 1/R4",
      "I = U/Req",
      "P = U·I = U²/Req"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "ohm"
  },
  {
    "id": "tec2022-s5-e1",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2022 S5",
    "resum": "Test sobre resistència a tracció, circuits, energia i unitats.",
    "enunciat": "Bloc de qüestions curtes de Tecnologia industrial 2022 sèrie 5, amb materials, circuits elèctrics, energia, emissions i mecanismes.",
    "apartats": [
      "Respondre qüestions tipus test.",
      "Justificar fórmules o unitats."
    ],
    "dades": [
      "Dades numèriques i condicions indicades a l’enunciat."
    ],
    "formules": [
      "Fórmules del bloc corresponent.",
      "Conversió d’unitats quan calgui."
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2022-s5-e2",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "LED encès si número 0 o múltiple de 4",
    "resum": "Circuit combinacional de quatre entrades que activa un LED segons el número binari.",
    "enunciat": "Un circuit combinacional rep números del 0 al 15 en binari. La sortida encén un LED quan el número és 0 o un múltiple de 4. Cal fer taula de veritat, funció lògica i esquema de contactes.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "Entrades a,b,c,d.",
      "Sortida l = LED actiu."
    ],
    "formules": [
      "múltiple de 4: els dos bits menys significatius són 0",
      "També inclou 0."
    ],
    "pistes": [
      "En binari, múltiples de 4 acaben en 00.",
      "El 0 també acaba en 00, per tant queda inclòs."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2022-s5-e3",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Mobilitat i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Comparació vehicle elèctric i gasoil",
    "resum": "Trajectes anuals, emissions, cost energètic i comparació econòmica.",
    "enunciat": "Una persona fa 120 km extraurbans i 10 km urbans cada dia durant 280 dies l’any i compara vehicle elèctric i vehicle de gasoil amb dades de compra, consum, preus i factors d’emissió. Cal calcular emissions diàries/anuals, cost d’ús i comparació global.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "Dades numèriques i condicions indicades a l’enunciat."
    ],
    "formules": [
      "Fórmules del bloc corresponent.",
      "Conversió d’unitats quan calgui."
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2022-s5-e4",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Energia tèrmica",
    "tipus": "fitxa per parts",
    "nivell": "N2",
    "titol": "Escalfar aigua amb dues alternatives",
    "resum": "Comparació entre escalfador submergible i vitroceràmica.",
    "enunciat": "Cal escalfar 350 mL d’aigua de 20 °C a 95 °C amb un escalfador de 1 200 W durant 125 s o amb una vitroceràmica que consumeix 0,11 kWh. Es demana energia teòrica, resistència de l’escalfador, energia consumida i rendiment de cada alternativa.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "V=350 mL.",
      "T1=20 °C, T2=95 °C.",
      "P=1 200 W, t=125 s.",
      "Evitro=0,11 kWh.",
      "U=230 V.",
      "ce=4,18 J/(g°C)."
    ],
    "formules": [
      "Q=m·ce·ΔT",
      "R=U²/P",
      "E=P·t",
      "η=Q/E"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2022-s5-e5",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Estàtica",
    "tipus": "fitxa visual",
    "nivell": "N3",
    "titol": "Porta elevada amb barres",
    "resum": "Diagrama de cos lliure i forces en barres d’un mecanisme de porta.",
    "enunciat": "Mecanisme de porta d’armari amb dues barres articulades, massa de porta, dimensions i angle de funcionament. Es demana diagrama de cos lliure, força aplicada i forces a les barres quan φ = 30°.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "m=3 kg.",
      "LAO=LBQ=2L.",
      "L=50 mm.",
      "s=30 mm.",
      "φ=30°."
    ],
    "formules": [
      "ΣM=0",
      "ΣFx=0",
      "ΣFy=0"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2022-s5-e6",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Motors i mobilitat elèctrica",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motocicleta elèctrica amb motor a la roda",
    "resum": "Motor integrat a la roda, velocitat angular, autonomia i energia de bateries.",
    "enunciat": "Un prototip de motocicleta elèctrica integra el motor a la roda del darrere. A velocitat constant el motor subministra 15 kW i 150 N·m, autonomia de 200 km, diàmetre de pneumàtic 630 mm i rendiment 0,9. Cal calcular velocitat angular, velocitat d’avanç, temps màxim, energia subministrada i energia de bateria.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "Pmot=15 kW.",
      "Γ=150 N·m.",
      "smàx=200 km.",
      "d=630 mm.",
      "η=0,9."
    ],
    "formules": [
      "ω=P/Γ",
      "v=ωr",
      "t=s/v",
      "E=P·t",
      "Ebat=E/η"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2021-s2-e1",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2021 S2",
    "resum": "Test sobre dilatació, cargol, emissions, politges i gas ideal.",
    "enunciat": "Bloc de qüestions tipus test: dilatació lineal d’una barra d’acer, velocitat de rotació d’un cargol, petjada de carboni d’un autobús, força en un sistema de politges i pressió d’una bombona de butà escalfada.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "L=800 mm; α=13·10⁻⁶ °C⁻¹; ΔT=400 °C.",
      "pas=2 mm; avanç=15 mm/s.",
      "FE=1155,52 g CO2/km.",
      "m=3 kg en politja.",
      "p1=303 kPa; T1=20 °C; T2=600 °C."
    ],
    "formules": [
      "Lf = L0(1+αΔT)",
      "n = v/p",
      "emissions = distància·FE",
      "F = mg/avantatge mecànic",
      "p1/T1 = p2/T2"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2021-s2-e2",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Seguretat en una estació de tall",
    "resum": "Sistema amb polsadors de mà i de peu per activar tallat.",
    "enunciat": "En una línia de producció, per fer una operació de tallat cal prémer alhora almenys un polsador de mà i un polsador de peu. Les variables són m1, m2, p1, p2 i la sortida t. Cal fer taula de veritat, funció simplificada i portes lògiques.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "m1,m2 = polsadors de mà.",
      "p1,p2 = polsadors de peu.",
      "t = operació en marxa."
    ],
    "formules": [
      "t = (m1 + m2)·(p1 + p2)"
    ],
    "pistes": [
      "Cal una mà i un peu.",
      "“Almenys un” implica OR.",
      "“A la vegada” implica AND."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2021-s2-e3",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 3",
    "bloc": "Mecanismes i transmissió",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Bombo de maceració amb corretja",
    "resum": "Motor reductor, politges, velocitats i parells.",
    "enunciat": "Un bombo de maceració gira amb una corretja accionada per motor reductor. El motor dona 0,55 kW a 1 415 min⁻¹. El reductor té rendiment 0,96 i relació τ = 68,9·10⁻³. Una politja de 63 mm arrossega una altra de 500 mm. Cal calcular parells i velocitats.",
    "apartats": [
      "a) Parell al motor.",
      "b) Parell a la sortida del reductor.",
      "c) Velocitat de la politja petita.",
      "d) Velocitat del bombo.",
      "e) Parell al bombo."
    ],
    "dades": [
      "Pmot=0,55 kW.",
      "nmot=1 415 min⁻¹.",
      "ηred=0,96.",
      "τ=ωred/ωmot=68,9·10⁻³.",
      "d=63 mm.",
      "D=500 mm."
    ],
    "formules": [
      "ω=2πn/60",
      "Γ=P/ω",
      "Psortida=η·Pentrada",
      "nD = nd·d/D",
      "Γ = P/ω"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2021-s2-e4",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 4",
    "bloc": "Fotovoltaica i emissions",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Pla municipal de plaques solars",
    "resum": "Càlcul d’energia anual, potència fotovoltaica, rendiment i emissions evitades.",
    "enunciat": "Un edifici municipal vol cobrir el 15% de la demanda elèctrica amb plaques fotovoltaiques. La potència instal·lada és 30 kW, consum mitjà 75% durant 12 h/dia, factor d’emissió 241 g CO2/kWh i placa de 1,45 m² que dona 194 W amb irradiació de 1000 W/m². Cal calcular energia consumida, potència fotovoltaica, rendiment i emissions evitades.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "r=15%.",
      "Pinst=30 kW.",
      "c=75%.",
      "t=12 h/dia.",
      "FE=241 g CO2/kWh.",
      "A=1,45 m².",
      "Pplaca=194 W."
    ],
    "formules": [
      "E=P·c·t·365",
      "Pfoto=r·Pdemanda",
      "η=Pplaca/(Irad·A)",
      "CO2=E·FE"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2021-s2-e5",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 5",
    "bloc": "Estàtica",
    "tipus": "fitxa visual",
    "nivell": "N3",
    "titol": "Estructura de barres per gimnàstica",
    "resum": "Equilibri d’una estructura amb persona penjada.",
    "enunciat": "Una persona de 80 kg utilitza una estructura de barres articulada a la paret. La barra QS està unida a OP i la persona es penja del punt P. Cal dibuixar el diagrama de cos lliure, calcular força a la barra QS i reaccions horitzontal i vertical a O.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "m=80 kg.",
      "Geometria segons figura del PDF."
    ],
    "formules": [
      "ΣM=0",
      "ΣFx=0",
      "ΣFy=0"
    ],
    "pistes": [
      "Treballa primer la barra OP.",
      "La barra QS és un element de dues forces.",
      "Indica si està a tracció o compressió."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2021-s2-e6",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 6",
    "bloc": "Energia i generadors",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Generador dièsel i alternador",
    "resum": "Rendiment d’alternador, consum de gasoil, rendiment del motor i potència dissipada.",
    "enunciat": "Un petit generador dièsel subministra electricitat amb motor a 3 000 min⁻¹ i alternador monofàsic. El gasoil té pc=44,8 MJ/kg i densitat 0,85 kg/L. El motor dona 7,457 kW i l’alternador 5,5 kW. Dipòsit de 14 L amb autonomia de 13 h. Cal calcular rendiments, consum i potència dissipada.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "n=3 000 min⁻¹.",
      "pc=44,8 MJ/kg.",
      "ρ=0,85 kg/L.",
      "Pmot=7,457 kW.",
      "Pelèctr=5,5 kW.",
      "V=14 L.",
      "t=13 h."
    ],
    "formules": [
      "ηalt=Pelèctr/Pmot",
      "consum=ρV/t",
      "Pcomb=ṁ·pc",
      "ηmot=Pmot/Pcomb",
      "Pdiss=Pcomb−Pelèctr"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2021-s5-e1",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes 2021 S5",
    "resum": "Test sobre assaig de tracció, circuits, energia i màquines.",
    "enunciat": "Bloc de qüestions tipus test de la sèrie 5 de 2021: materials, circuits elèctrics, energia i mecanismes. Inclou una proveta de níquel amb secció circular i dades de mòdul elàstic, límit elàstic i resistència al trencament.",
    "apartats": [
      "Respondre qüestions tipus test.",
      "Justificar la resposta amb càlcul o concepte."
    ],
    "dades": [
      "Dades numèriques i condicions indicades a l’enunciat."
    ],
    "formules": [
      "Fórmules del bloc corresponent.",
      "Conversió d’unitats quan calgui."
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2021-s5-e2",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Portes d’emergència automàtiques",
    "resum": "Sistema amb fum, temperatura i tensió de xarxa.",
    "enunciat": "El sistema d’obertura de portes d’emergència té detectors de fum, temperatura i tensió. La porta s’obre si hi ha fum i augment brusc de temperatura, o si la tensió d’alimentació és nul·la. Cal taula de veritat, funció i simplificació.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "f = fum.",
      "t = augment brusc de temperatura.",
      "v = tensió no nul·la.",
      "p = porta oberta."
    ],
    "formules": [
      "p = f·t + ¬v"
    ],
    "pistes": [
      "Tensió nul·la és ¬v.",
      "La condició de fum i temperatura és un AND.",
      "Les dues condicions alternatives s’uneixen amb OR."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet."
  },
  {
    "id": "tec2021-s5-e3",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Energia i combustibles",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Central de carbó i comparació amb querosè",
    "resum": "Energia diària, massa de combustible i rendiment de central tèrmica.",
    "enunciat": "Una central de carbó té 3 turbines de 362 MW i utilitza lignit de poder calorífic 28 400 kJ/kg i densitat 1 050 kg/m³. Funciona 24 h/dia i té rendiment 0,236. Es compara amb querosè de poder calorífic 43 400 kJ/kg i massa diària coneguda. Cal calcular energia, massa i nou rendiment.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "n=3 turbines.",
      "Pturb=362 MW.",
      "pc carbó=28 400 kJ/kg.",
      "ρ=1 050 kg/m³.",
      "ηc=0,236.",
      "pc querosè=43 400 kJ/kg."
    ],
    "formules": [
      "Eútil=P·t",
      "Eentrada=Eútil/η",
      "m=Eentrada/pc",
      "η=Eútil/Eentrada"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2021-s5-e4",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Mobilitat elèctrica",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Moto elèctrica en pendent i regeneració",
    "resum": "Energia potencial, consum de bateria i recuperació amb fre motor.",
    "enunciat": "Una moto elèctrica recorre 12 km en una carretera de pendent 5% a velocitat constant, amb bateria de 1,53 kWh, massa total 130 kg i rendiment global 0,9. Es negligeixen rodolament i aerodinàmica. Després baixa pel mateix tram amb regeneració. Cal calcular desnivell, energia potencial, energia consumida i recuperada.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "s=12 km.",
      "pendent=5%.",
      "Ebat=1,53 kWh.",
      "m=130 kg.",
      "ηglob=0,9."
    ],
    "formules": [
      "Δh = pendent·s",
      "ΔEp=m·g·Δh",
      "Econs=ΔEp/η",
      "Erec=ΔEp·ηreg"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "calor"
  },
  {
    "id": "tec2021-s5-e5",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Drons i motors",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Dron amb quatre motors en paral·lel",
    "resum": "Energia de bateria, potència de motors, autonomia parcial i parell.",
    "enunciat": "Un dron utilitza bateria de 11,1 V i capacitat 5 200 mAh. Quatre motors en paral·lel tenen rendiment 0,89 i giren a 10 000 min⁻¹; cada motor subministra 30 W. Cal calcular energia de bateria, potència consumida, energia i temps per descarregar el 5% i parell de cada motor.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "U=11,1 V.",
      "c=5 200 mAh.",
      "4 motors.",
      "η=0,89.",
      "n=10 000 min⁻¹.",
      "Psubm=30 W."
    ],
    "formules": [
      "Ebat=c·U",
      "Pcons=Psubm/η",
      "E5%=0,05·Ebat",
      "t=E/Ptotal",
      "Γ=P/ω",
      "ω=2πn/60"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "motor"
  },
  {
    "id": "tec2021-s5-e6",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Electricitat i resistivitat",
    "tipus": "fitxa per parts",
    "nivell": "N2",
    "titol": "Assecador amb fil resistiu",
    "resum": "Longitud del fil, potència, energia, corrent i canvi de tensió.",
    "enunciat": "La resistència d’un assecador és R=30 Ω i està feta d’un fil de resistivitat 0,22 μΩ·m i diàmetre 0,4 mm. S’endolla a 230 V. Cal calcular longitud del fil, potència consumida, energia en 10 min, corrent i potència si s’alimenta a 110 V.",
    "apartats": [
      "Llegir l’enunciat i separar els apartats.",
      "Identificar dades i magnituds.",
      "Aplicar el model o fórmula corresponent.",
      "Interpretar el resultat amb unitats."
    ],
    "dades": [
      "R=30 Ω.",
      "ρ=0,22 μΩ·m.",
      "d=0,4 mm.",
      "U=230 V.",
      "t=10 min.",
      "U’=110 V."
    ],
    "formules": [
      "R=ρL/A",
      "A=πd²/4",
      "P=U²/R",
      "E=P·t",
      "I=U/R"
    ],
    "pistes": [
      "Classifica primer el problema per tema.",
      "No comencis a calcular sense escriure dades i unitats.",
      "Comprova l’ordre de magnitud del resultat."
    ],
    "errors": [
      "No indicar unitats.",
      "Barrejar unitats incompatibles.",
      "No justificar el procediment."
    ],
    "resolucio": "Fitxa PAU multiany: resolució guiada per passos. Alguns exercicis amb figures queden com a fitxa orientativa i no com a resolutor automàtic complet.",
    "enllac": "ohm"
  }
];
pauBank.push(...pauBankV9);


// Buidatge total v10: tots els exercicis detectats als PDF únics pujats (2021, 2022, 2023, 2024 i 2025).
const pauBankV10Full = [
  {
    "id": "full-tec2025-s1-e1",
    "any": 2025,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "Indiqueu la resposta correcta de CINC de les vuit qüestions. Si responeu a més de cinc,\n    només es valoraran les cinc primeres. Responeu en la taula de la pàgina 3. En el cas que no\n    indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n    [2,5 punts: 0,5 punts per cada qüestió. En cada qüestió només es pot triar UNA resposta. Per cada resposta errònia es des-\n    comptaran 0,16 punts. Per les qüestions no contestades no hi haurà cap descompte.]\n\n    Qüestió 1\n        En una fàbrica de peces metàŀliques, produeixen cargols amb un diàmetre nominal de\n    10 mm i una tolerància de ±0,05 mm. Quin és el diàmetre mínim acceptable per a aquests\n    cargols?\n        a) 9,90 mm         b) 9,95 mm          c) 10,05 mm     d) 10,10 mm\n\n    Qüestió 2\n        Un motor de propà líquid consumeix 7,5 kg/h quan funciona a 2 500 min–1. Si el motor és\n    de quatre temps, quina massa de propà es consumeix en 100 cicles termodinàmics del motor?\n        a) 20 g             b) 10 g            c) 100 g         d) 200 g\n\n    Qüestió 3\n         Es proposen dues opcions de funicular per a anar entre dos punts d’una muntanya a velo-\n    citat constant. L’opció A és el recorregut més curt possible, però amb el pendent més acusat.\n    L’opció B recorre més distància per tal de rebaixar el pendent de la via. En totes dues opcions,\n    els funiculars van a la mateixa velocitat i transporten la mateixa quantitat de persones. Es\n    pot afirmar que l’energia total necessària per a completar el recorregut, sense considerar les\n    pèrdues energètiques,\n         a) és la mateixa.\n         b) és més gran en l’opció A.\n         c) és més gran en l’opció B.\n         d) depèn de l’acceleració màxima del funicular.\n\n    Qüestió 4\n        Alimentem una resistència de valor R = 17 Ω amb una font de tensió alterna sinusoidal\n    de valor eficaç U = 230 V i de freqüència f = 50 Hz. Quin és el valor màxim de corrent que hi\n    circula?\n        a) 13,52 A           b) 19,13 A            c) 23,42 A       d) 27,13 A\n\nQüestió 5\n    En un assaig de tracció s’obtenen les corbes tensió-deformació\nque mostra la figura. Quin dels dos acers té un límit elàstic més alt?\n    a) L’acer A.\n    b) L’acer B.\n    c) Ambdós tenen el mateix límit elàstic.\n    d) No es pot determinar amb la informació donada.\n\nQüestió 6\n    Volem refredar un bloc de coure de 40 kg des de 250 °C fins a 25 °C en una hora. La calor\nespecífica del coure és ce = 0,385 kJ/(kg °C). Quanta energia cal extreure del sistema?\n    a) 346,5 W s          b) 962,5 J            c) 346,5 W h    d) 3 465 kJ\n\nQüestió 7\n     En l’ajust 200 H8/f6, la tolerància del forat és        i la de l’eix és            . Quin és\nel joc mínim d’aquest ajust?\n     a) 50 μm            b) 79 μm              c) 122 μm        d) 151 μm\n\nQüestió 8\n     Una càrrega elèctrica està formada per una resistència de valor R i una inductància de\nvalor L = 100 mH connectades en sèrie. Quan la càrrega està connectada a una font de tensió\nalterna sinusoidal de valor U = 230 V de freqüència f = 50 Hz, es mesura que hi circula un\ncorrent de valor I = 2 A. Quin és el valor de la resistència R?\n     a) 84 Ω              b) 111 Ω             c) 130 Ω         d) 230 Ω\n\nTaula de respostes:\n\n    Espai de resposta per a l’estudiant                               Espai per a la correcció\n\nQüestió 1    a        b      c       d                           Puntuació de la qüestió 1\n\nQüestió 2    a        b      c       d                           Puntuació de la qüestió 2\n\nQüestió 3    a        b      c       d                           Puntuació de la qüestió 3\n\nQüestió 4    a        b      c       d                           Puntuació de la qüestió 4\n\nQüestió 5    a        b      c       d                           Puntuació de la qüestió 5\n\nQüestió 6    a        b      c       d                           Puntuació de la qüestió 6\n\nQüestió 7    a        b      c       d                           Puntuació de la qüestió 7\n\nQüestió 8    a        b      c       d                           Puntuació de la qüestió 8\n                                                                 Total de l’exercici 1",
    "apartats": [
      "a) 9,90 mm b) 9,95 mm c) 10,05 mm d) 10,10 mm",
      "a) 20 g b) 10 g c) 100 g d) 200 g",
      "a) és la mateixa.",
      "b) és més gran en l’opció A.",
      "c) és més gran en l’opció B.",
      "d) depèn de l’acceleració màxima del funicular.",
      "a) 13,52 A b) 19,13 A c) 23,42 A d) 27,13 A",
      "a) L’acer A.",
      "b) L’acer B.",
      "c) Ambdós tenen el mateix límit elàstic.",
      "d) No es pot determinar amb la informació donada.",
      "a) 346,5 W s b) 962,5 J c) 346,5 W h d) 3 465 kJ",
      "a) 50 μm b) 79 μm c) 122 μm d) 151 μm",
      "a) 84 Ω b) 111 Ω c) 130 Ω d) 230 Ω"
    ],
    "dades": [
      "Indiqueu la resposta correcta de CINC de les vuit qüestions. Si responeu a més de cinc,",
      "[2,5 punts: 0,5 punts per cada qüestió. En cada qüestió només es pot triar UNA resposta. Per cada resposta errònia es des-",
      "En una fàbrica de peces metàŀliques, produeixen cargols amb un diàmetre nominal de",
      "10 mm i una tolerància de ±0,05 mm. Quin és el diàmetre mínim acceptable per a aquests",
      "Un motor de propà líquid consumeix 7,5 kg/h quan funciona a 2 500 min–1. Si el motor és",
      "de quatre temps, quina massa de propà es consumeix en 100 cicles termodinàmics del motor?",
      "Es proposen dues opcions de funicular per a anar entre dos punts d’una muntanya a velo-",
      "citat constant. L’opció A és el recorregut més curt possible, però amb el pendent més acusat.",
      "L’opció B recorre més distància per tal de rebaixar el pendent de la via. En totes dues opcions,",
      "els funiculars van a la mateixa velocitat i transporten la mateixa quantitat de persones. Es",
      "Alimentem una resistència de valor R = 17 Ω amb una font de tensió alterna sinusoidal",
      "de valor eficaç U = 230 V i de freqüència f = 50 Hz. Quin és el valor màxim de corrent que hi"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "rl"
  },
  {
    "id": "full-tec2025-s1-e2",
    "any": 2025,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Control domòtic de persianes",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts]\n         Es vol dissenyar el circuit electrònic que controla les persianes d’una casa domòtica. La\n    persiana puja si hi ha llum intensa a l’exterior i la temperatura interior no és alta, excepte si el\n    mode nocturn està activat. A més, també puja si hi ha persones a l’habitació i la temperatura\n    interior és alta, independentment de la llum exterior o el mode nocturn. En qualsevol altre\n    cas, la persiana baixarà o romandrà immòbil.\n         Es defineixen les variables d’estat següents:\n\n                          {\n    llum exterior: l = 1: hi ha llum exterior\n                       0: no hi ha llum exterior\n                                                 ; mode nocturn: n =    {\n                                                                     1: activat\n                                                                     0: desactivat\n                                                                                   ;\n\n                                  {                                                           {\n    temperatura interior: t = 1: alta, igual o superior a 21 °C ; presència d’individus: i = 1: sí ;\n                              0: baixa, inferior a 21 °C                                     0: no\n\n    moviment de la persiana: p = 1: puja  {\n                                 0: baixa o roman immòbil\n                                                          .\n\n        Dissenyeu un sistema de control que permeti controlar el moviment de la persiana. Com\n    a resultat, proporcioneu un diagrama de portes lògiques que representi visualment el fun-\n    cionament del sistema. Per a fer-ho, és recomanable elaborar la taula de veritat del sistema,\n    determinar la funció lògica entre aquestes variables (i, si escau, simplificar-la) i, finalment,\n    dibuixar el diagrama de portes lògiques.\n\n                  l   n       t       i       p\n\n Espai per a la correcció",
    "apartats": [
      "Llegir l’enunciat complet.",
      "Identificar què es demana.",
      "Resoldre i justificar el resultat amb unitats."
    ],
    "dades": [
      "Es vol dissenyar el circuit electrònic que controla les persianes d’una casa domòtica. La",
      "mode nocturn està activat. A més, també puja si hi ha persones a l’habitació i la temperatura",
      "interior és alta, independentment de la llum exterior o el mode nocturn. En qualsevol altre",
      "cas, la persiana baixarà o romandrà immòbil.",
      "llum exterior: l = 1: hi ha llum exterior",
      "; mode nocturn: n = {",
      "temperatura interior: t = 1: alta, igual o superior a 21 °C ; presència d’individus: i = 1: sí ;",
      "0: baixa, inferior a 21 °C 0: no",
      "moviment de la persiana: p = 1: puja {",
      "0: baixa o roman immòbil",
      "Dissenyeu un sistema de control que permeti controlar el moviment de la persiana. Com",
      "determinar la funció lògica entre aquestes variables (i, si escau, simplificar-la) i, finalment,"
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2025-s1-e3",
    "any": 2025,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 3",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Elevador de taller amb cargol-femella",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n\n        La figura mostra un esquema d’un elevador de taller de dues columnes. Les dues colum-\n    nes són iguals, i dins de cadascuna d’elles hi ha una transmissió cargol-femella. La femella\n    és solidària als braços que sostenen el vehicle. A la part superior de la columna se situa un\n    motor que per mitjà d’un reductor d’engranatges fa girar el cargol situat a l’interior de la\n    columna, que fa pujar o baixar la femella. El moviment dels dos motors està sincronitzat\n    perquè els braços tinguin el mateix moviment.\n        L’alçada màxima d’elevació des de la posició més baixa dels braços és h = 1,8 m; la massa\n    que suporta cada columna és m = 1 900 kg; el cargol té un pas de rosca de 7 mm per volta (el\n    cotxe s’eleva 7 mm per cada volta del cargol), i el conjunt del sistema té un rendiment η = 0,4.\n        Volem determinar la potència elèctrica d’un motor i dissenyar el reductor perquè quan el\n    motor giri a n = 1 420 min–1 el temps d’elevació per a arribar a l’alçada màxima sigui t = 45 s.\n    Per a això, determineu:\n        a) La potència mecànica necessària per a elevar el cotxe, Pmec.\n              [0,5 punts]\n\nb) La potència elèctrica que consumirà cada motor, Pelèc.\n   [0,5 punts]\n\nc) Les voltes que ha de fer el cargol perquè el cotxe arribi a l’alçada màxima, nvoltes.\n   [0,5 punts]\n\nd) La relació de transmissió que cal que tingui el reductor,           .\n   [1 punt]\n\n                                                                      Espai per a la correcció\n                                                                               a\n                                                                               b",
    "apartats": [
      "a) La potència mecànica necessària per a elevar el cotxe, Pmec.",
      "b) La potència elèctrica que consumirà cada motor, Pelèc.",
      "c) Les voltes que ha de fer el cargol perquè el cotxe arribi a l’alçada màxima, nvoltes.",
      "d) La relació de transmissió que cal que tingui el reductor, ."
    ],
    "dades": [
      "La figura mostra un esquema d’un elevador de taller de dues columnes. Les dues colum-",
      "nes són iguals, i dins de cadascuna d’elles hi ha una transmissió cargol-femella. La femella",
      "és solidària als braços que sostenen el vehicle. A la part superior de la columna se situa un",
      "motor que per mitjà d’un reductor d’engranatges fa girar el cargol situat a l’interior de la",
      "columna, que fa pujar o baixar la femella. El moviment dels dos motors està sincronitzat",
      "perquè els braços tinguin el mateix moviment.",
      "L’alçada màxima d’elevació des de la posició més baixa dels braços és h = 1,8 m; la massa",
      "que suporta cada columna és m = 1 900 kg; el cargol té un pas de rosca de 7 mm per volta (el",
      "cotxe s’eleva 7 mm per cada volta del cargol), i el conjunt del sistema té un rendiment η = 0,4.",
      "Volem determinar la potència elèctrica d’un motor i dissenyar el reductor perquè quan el",
      "motor giri a n = 1 420 min–1 el temps d’elevació per a arribar a l’alçada màxima sigui t = 45 s.",
      "Per a això, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "elevador"
  },
  {
    "id": "full-tec2025-s1-e4",
    "any": 2025,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 4",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Cuina de càmping amb butà",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         Una cuina portàtil per a càmping funciona amb cartutxos de mcartutx = 230 g de gas butà.\n    El cremador té un rendiment η = 0,2 i el seu consum màxim és c = 155 g/h de butà, de poder\n    calorífic pc = 45,8 MJ/kg. Volem estudiar quina quantitat de gas es consumeix per cuinar arròs\n    per a 5 persones si s’utilitzen V = 2 L d’aigua que inicialment es troben a T1 = 15 °C. Sabent\n    que la calor específica de l’aigua és ce = 4,186 kJ/(kg °C), determineu:\n         a) La quantitat de gas necessària perquè l’aigua comenci a bullir, mgas1.\n              [1 punt]\n\n         b) El temps necessari per a arribar a l’ebullició, t1, si el cremador funciona al màxim de\n            consum.\n              [0,5 punts]\n\n    Un cop l’aigua ha arribat a ebullició, s’afegeix l’arròs i es deixa coure durant t2 = 18 minuts\nreduint el cabal de gas a un 30 % del seu consum màxim. Determineu:\n    c) El percentatge de gas consumit del cartutx durant tot el procés (bullir l’aigua i cuinar\n       l’arròs), Δ.\n        [1 punt]\n\n                                                                            Espai per a la correcció\n                                                                                     a\n                                                                                     b",
    "apartats": [
      "a) La quantitat de gas necessària perquè l’aigua comenci a bullir, mgas1.",
      "b) El temps necessari per a arribar a l’ebullició, t1, si el cremador funciona al màxim de",
      "c) El percentatge de gas consumit del cartutx durant tot el procés (bullir l’aigua i cuinar"
    ],
    "dades": [
      "Una cuina portàtil per a càmping funciona amb cartutxos de mcartutx = 230 g de gas butà.",
      "El cremador té un rendiment η = 0,2 i el seu consum màxim és c = 155 g/h de butà, de poder",
      "calorífic pc = 45,8 MJ/kg. Volem estudiar quina quantitat de gas es consumeix per cuinar arròs",
      "per a 5 persones si s’utilitzen V = 2 L d’aigua que inicialment es troben a T1 = 15 °C. Sabent",
      "que la calor específica de l’aigua és ce = 4,186 kJ/(kg °C), determineu:",
      "Un cop l’aigua ha arribat a ebullició, s’afegeix l’arròs i es deixa coure durant t2 = 18 minuts",
      "reduint el cabal de gas a un 30 % del seu consum màxim. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "calor"
  },
  {
    "id": "full-elec2023-s1-e1",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n    que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n    [2,5 punts]\n    [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n    qüestió no contestada: 0 punts.]\n\n    Qüestió 1\n       Quina és la funció lògica O de la taula de veritat de la dreta?                               a     b     c     O\n                                                                                                     0     0     0     1\n         a)\n                                                                                                     0     0     1     0\n         b)                                                                                          0     1     0     1\n         c)                                                                                          0     1     1     1\n                                                                                                     1     0     0     0\n         d)                                                                                          1     0     1     0\n                                                                                                     1     1     0     1\n                                                                                                     1     1     1     0\n\n    Qüestió 2\n         Un transformador monofàsic de potència nominal S = 100 VA que podem considerar\n    ideal té la tensió nominal del primari de 100 V i la relació de transformació és rt = 1. El secun-\n    dari alimenta una resistència de valor R = 100 Ω. Si la potència consumida de la xarxa d’ali-\n    mentació (pel primari del transformador) és de 40,96 W, quina és la tensió en el secundari\n    del transformador?\n         a) 50 V.\n         b) 64 V.\n         c) 100 V.\n         d) Amb les dades proporcionades no es pot saber.\n\n    Qüestió 3\n        Es dissenya una instaŀlació de l’enllumenat d’un passadís d’un habitatge de manera que hi\n    hagi dos punts des d’on es pugui encendre o apagar el llum (un a cada extrem del passadís).\n    Per a poder fer aquesta instaŀlació, necessitem\n        a) dos interruptors.\n        b) un interruptor i un commutador.\n        c) dos commutadors.\n        d) dos interruptors i dos commutadors.\n\nQüestió 4\n     La placa de característiques d’un motor de corrent continu d’imants permanents indica\nels valors següents: PN = 350 W, UN = 180 V, IN = 2,3 A i nN = 550 min–1. Les pèrdues totals del\nmotor quan treballa en condicions nominals són de 64 W. Quin és, aproximadament, el parell\nnominal del motor (el parell útil a l’eix del motor en condicions nominals)?\n     a) 2,5 N m\n     b) 3,1 N m\n     c) 5 N m\n     d) 6,1 N m\n\nQüestió 5\n    Entre la fase a i la fase b d’una xarxa trifàsica simètrica i equilibrada de 400 V de tensió hi\nha connectada una capacitat que, a la freqüència de la xarxa, presenta una reactància capaciti-\nva de 50 Ω. Quins són, respectivament, els valors de la potència reactiva i la potència aparent\nconsumides de la xarxa?\n    a) –3,2 kvar i 3,2 kVA\n    b) –3,2 kvar i –3,2 kVA\n    c) –3,2 kvar i 0 kVA\n    d) –3,2 kvar i –6,4 kVA\n\nTaula de respostes:\n\n    Espai de resposta per a l’alumne/a                                  Espai per al corrector/a\n\nQüestió 1     a       b      c       d                             Puntuació de la qüestió 1\n\nQüestió 2     a       b      c       d                             Puntuació de la qüestió 2\n\nQüestió 3     a       b      c       d                             Puntuació de la qüestió 3\n\nQüestió 4     a       b      c       d                             Puntuació de la qüestió 4\n\nQüestió 5     a       b      c       d                             Puntuació de la qüestió 5\n                                                                   Total de l’exercici 1",
    "apartats": [
      "a) 0 0 1 0",
      "b) 0 1 0 1",
      "c) 0 1 1 1 1 0 0 0",
      "d) 1 0 1 0 1 1 0 1",
      "a) 50 V.",
      "b) 64 V.",
      "c) 100 V.",
      "d) Amb les dades proporcionades no es pot saber.",
      "a) dos interruptors.",
      "b) un interruptor i un commutador.",
      "c) dos commutadors.",
      "d) dos interruptors i dos commutadors.",
      "a) 2,5 N m",
      "b) 3,1 N m",
      "c) 5 N m",
      "d) 6,1 N m",
      "a) –3,2 kvar i 3,2 kVA",
      "b) –3,2 kvar i –3,2 kVA",
      "c) –3,2 kvar i 0 kVA",
      "d) –3,2 kvar i –6,4 kVA"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Un transformador monofàsic de potència nominal S = 100 VA que podem considerar",
      "ideal té la tensió nominal del primari de 100 V i la relació de transformació és rt = 1. El secun-",
      "dari alimenta una resistència de valor R = 100 Ω. Si la potència consumida de la xarxa d’ali-",
      "mentació (pel primari del transformador) és de 40,96 W, quina és la tensió en el secundari",
      "Es dissenya una instaŀlació de l’enllumenat d’un passadís d’un habitatge de manera que hi",
      "La placa de característiques d’un motor de corrent continu d’imants permanents indica",
      "els valors següents: PN = 350 W, UN = 180 V, IN = 2,3 A i nN = 550 min–1. Les pèrdues totals del",
      "motor quan treballa en condicions nominals són de 64 W. Quin és, aproximadament, el parell",
      "nominal del motor (el parell útil a l’eix del motor en condicions nominals)?",
      "Entre la fase a i la fase b d’una xarxa trifàsica simètrica i equilibrada de 400 V de tensió hi",
      "va de 50 Ω. Quins són, respectivament, els valors de la potència reactiva i la potència aparent"
    ],
    "formules": [
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-elec2023-s1-e2",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 2",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "El circuit de la figura mostra dues fonts de tensió U1 i U2 que alimenten diverses càrregues…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "El circuit de la figura mostra dues fonts de tensió U1 i U2 que alimenten diverses càrregues\n    (resistències). Les resistències que tenen el mateix valor òhmic hi apareixen amb el mateix\n    nom. Determineu:\n         a) La potència aportada al circuit per cadascuna de les fonts de tensió PU1 i PU2 en el cas\n             que R3 = 0 Ω.\n           [1 punt]\n\nb) La potència PR2 dissipada per cadascuna de les R2 en el cas que R3 = 0 Ω.\n   [0,5 punts]\n\nc) La potència aportada al circuit per cadascuna de les fonts de tensió PU1 i PU2 en el cas\n   que R3 = ∞ Ω.\n   [0,5 punts]\n\nd) La potència PR2 dissipada per cadascuna de les R2 en el cas que R3 = ∞ Ω.\n   [0,5 punts]",
    "apartats": [
      "a) La potència aportada al circuit per cadascuna de les fonts de tensió PU1 i PU2 en el cas",
      "b) La potència PR2 dissipada per cadascuna de les R2 en el cas que R3 = 0 Ω.",
      "c) La potència aportada al circuit per cadascuna de les fonts de tensió PU1 i PU2 en el cas",
      "d) La potència PR2 dissipada per cadascuna de les R2 en el cas que R3 = ∞ Ω."
    ],
    "dades": [
      "El circuit de la figura mostra dues fonts de tensió U1 i U2 que alimenten diverses càrregues",
      "(resistències). Les resistències que tenen el mateix valor òhmic hi apareixen amb el mateix",
      "nom. Determineu:",
      "que R3 = 0 Ω.",
      "que R3 = ∞ Ω."
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-elec2023-s1-e3",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 3",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Sistema trifàsic equilibrat",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "El circuit de la figura és alimentat per un sistema trifàsic simètric i equilibrat de tensió\n    (composta) U i 50 Hz de freqüència. La càrrega trifàsica està formada per tres impedàncies\n    idèntiques connectades en estrella. L’amperímetre A1 mesura un corrent de valor I = 9 A.\n    Determineu:\n        a) La mesura del wattímetre W3.\n           [1 punt]\n\n        b) El valor L de la part inductiva de la impedància Z.\n           [0,5 punts]\n\nc) El valor R de la part resistiva de la impedància Z.\n   [0,5 punts]\n\nd) El valor C de cadascuna de les capacitats que cal connectar en estrella per tal de tenir\n   un factor de potència unitari del conjunt de la instaŀlació.\n   [0,5 punts]",
    "apartats": [
      "a) La mesura del wattímetre W3.",
      "b) El valor L de la part inductiva de la impedància Z.",
      "c) El valor R de la part resistiva de la impedància Z.",
      "d) El valor C de cadascuna de les capacitats que cal connectar en estrella per tal de tenir"
    ],
    "dades": [
      "(composta) U i 50 Hz de freqüència. La càrrega trifàsica està formada per tres impedàncies",
      "idèntiques connectades en estrella. L’amperímetre A1 mesura un corrent de valor I = 9 A.",
      "Determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-elec2023-s1-e4",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 4",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Rectificador d’ona sencera",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "La figura mostra una font de tensió sinusoidal que alimenta un rectificador d’ona sen-\n    cera que no funciona correctament. A partir de les diferents proves realitzades, s’ha arribat a\n    la conclusió que hi ha dos díodes espatllats i que, concretament, han quedat en circuit obert\n    (el corrent no hi pot circular en cap dels dos sentits). A la sortida del rectificador hi ha la\n    càrrega, que són dues resistències connectades en sèrie. Sabem que el valor de la càrrega és\n    R1 = R2= 25 Ω i que als borns de la resistència R2 hi ha connectat un osciŀloscopi, la pantalla\n    del qual també s’ha representat en la figura. La sonda de l’osciŀloscopi té relació 1:1, l’escala\n    de temps de l’osciŀloscopi és de 5 ms/div. i l’escala de tensió de l’osciŀloscopi és de 10 V/div.\n    Els díodes del circuit que funcionen es poden considerar ideals. Determineu:\n         a) El valor de la freqüència f de la tensió d’alimentació.\n           [0,5 punts]\n\n        b) La parella de díodes que estan espatllats. Escolliu una opció entre les següents: D1 i D2;\n           D3 i D4; D1 i D3; D2 i D4; D1 i D4.\n           [0,5 punts]\n\nc) El valor eficaç de la tensió d’alimentació U.\n   [0,5 punts]\n\nd) El valor de la potència P que la font d’alimentació lliura al circuit.\n   [1 punt]",
    "apartats": [
      "a) El valor de la freqüència f de la tensió d’alimentació.",
      "b) La parella de díodes que estan espatllats. Escolliu una opció entre les següents: D1 i D2;",
      "c) El valor eficaç de la tensió d’alimentació U.",
      "d) El valor de la potència P que la font d’alimentació lliura al circuit."
    ],
    "dades": [
      "La figura mostra una font de tensió sinusoidal que alimenta un rectificador d’ona sen-",
      "cera que no funciona correctament. A partir de les diferents proves realitzades, s’ha arribat a",
      "(el corrent no hi pot circular en cap dels dos sentits). A la sortida del rectificador hi ha la",
      "R1 = R2= 25 Ω i que als borns de la resistència R2 hi ha connectat un osciŀloscopi, la pantalla",
      "del qual també s’ha representat en la figura. La sonda de l’osciŀloscopi té relació 1:1, l’escala",
      "de temps de l’osciŀloscopi és de 5 ms/div. i l’escala de tensió de l’osciŀloscopi és de 10 V/div.",
      "Els díodes del circuit que funcionen es poden considerar ideals. Determineu:"
    ],
    "formules": [
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "ohm"
  },
  {
    "id": "full-elec2023-s1-e5",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 5",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motor d’inducció trifàsic",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "Un motor d’inducció trifàsic té les dades següents en la placa de característiques:\n                          PN = 50 kW     UN = 400/230 V   IN = 90/156 A   nN = 2 860 min–1\n                                 cos φN = 0,85                      f = 50 Hz\n          A més, el fabricant proporciona la corba característica parell-velocitat (Γm-ω) que es mos-\n     tra a la figura següent. A la mateixa figura s’ha representat la corba del parell resistent de la\n     càrrega (Γc), que és constant en tot el rang de funcionament.\n\n         En condicions nominals, determineu:\n         a) El parell Γ desenvolupat.\n            [0,5 punts]\n\n         b) El rendiment η expressat en tant per cent.\n            [0,5 punts]\n\nc) El nombre de parells de pols p.\n   [0,5 punts]\n\nd) El lliscament s expressat en tant per cent.\n   [0,5 punts]\n\nSi el motor funciona en règim estacionari (Γm = Γc) amb la càrrega descrita, determineu:\ne) La velocitat de gir del motor expressada en min–1.\n   [0,5 punts]",
    "apartats": [
      "a) El parell Γ desenvolupat.",
      "b) El rendiment η expressat en tant per cent.",
      "c) El nombre de parells de pols p.",
      "d) El lliscament s expressat en tant per cent.",
      "e) La velocitat de gir del motor expressada en min–1."
    ],
    "dades": [
      "Un motor d’inducció trifàsic té les dades següents en la placa de característiques:",
      "PN = 50 kW UN = 400/230 V IN = 90/156 A nN = 2 860 min–1",
      "cos φN = 0,85 f = 50 Hz",
      "A més, el fabricant proporciona la corba característica parell-velocitat (Γm-ω) que es mos-",
      "tra a la figura següent. A la mateixa figura s’ha representat la corba del parell resistent de la",
      "En condicions nominals, determineu:",
      "Si el motor funciona en règim estacionari (Γm = Γc) amb la càrrega descrita, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "trifasica"
  },
  {
    "id": "full-elec2023-s1-e6",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 1",
    "exercici": "Exercici 6",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "El circuit de la figura és alimentat amb una tensió U de freqüència f.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "El circuit de la figura és alimentat amb una tensió U de freqüència f. La mesura del\n     wattímetre indicada en el requadre es dona amb l’interruptor obert.\n         Amb l’interruptor obert, determineu:\n         a) El valor del corrent que circula per la resistència R.\n            [0,5 punts]\n\n         b) El valor de la inductància L.\n            [0,5 punts]\n\nAmb l’interruptor tancat, determineu:\nc) El valor de la capacitat C que fa que el circuit estigui en ressonància; és a dir, que el\n   conjunt es comporti amb factor de potència unitari.\n   [0,5 punts]\n\nd) El valor del corrent que circula per la capacitat C.\n   [0,5 punts]\n\ne) La mesura del wattímetre W.\n   [0,5 punts]",
    "apartats": [
      "a) El valor del corrent que circula per la resistència R.",
      "b) El valor de la inductància L.",
      "c) El valor de la capacitat C que fa que el circuit estigui en ressonància; és a dir, que el",
      "d) El valor del corrent que circula per la capacitat C.",
      "e) La mesura del wattímetre W."
    ],
    "dades": [
      "El circuit de la figura és alimentat amb una tensió U de freqüència f. La mesura del",
      "Amb l’interruptor obert, determineu:",
      "Amb l’interruptor tancat, determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "rl"
  },
  {
    "id": "full-elec2023-s5-e1",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n    que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n    [2,5 punts]\n    [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n    qüestió no contestada: 0 punts.]\n\n    Qüestió 1\n        Un transformador monofàsic de relació de transformació rt = 2 s’alimenta pel primari a\n    una tensió contínua constant de valor U1 = 50 V. El corrent continu constant que circula pel\n    primari és I1 = 1 A. Al secundari hi ha connectat un voltímetre. Podem afirmar que\n        a) el voltímetre mesura U2 = 25 V.\n        b) el corrent que circula pel secundari és I2 = 2 A.\n        c) el voltímetre mesura U2 = 100 V.\n        d) s’estableix flux en el material ferromagnètic.\n\n    Qüestió 2\n       Quina és la funció lògica O de la taula de veritat de la dreta?                               a     b     c     O\n                                                                                                     0     0     0     0\n         a)                                                                                          0     0     1     0\n         b)                                                                                          0     1     0     1\n                                                                                                     0     1     1     1\n         c)\n                                                                                                     1     0     0     0\n         d)                                                                                          1     0     1     0\n                                                                                                     1     1     0     1\n                                                                                                     1     1     1     0\n\n    Qüestió 3\n        Una línia trifàsica de quatre conductors (tres conductors de fase i el neutre) de U = 400 V\n    de tensió (composta) alimenta una càrrega simètrica connectada en estrella. En un moment\n    donat, un desperfecte fa que dues fases de la càrrega es desconnectin i, per tant, la càrrega\n    queda alimentada entre una fase i el neutre. En aquestes condicions, sabem el corrent que\n    circula pel neutre (IN = 5 A) i la potència activa consumida (Puna fase = 900 W). Respecte a la\n    potència activa consumida abans del desperfecte, podem afirmar que\n        a) amb les dades proporcionades no es pot saber.\n        b) era Pcàrrega trifàsica = 2 700 W.\n        c) era Pcàrrega trifàsica = 1 800 W.\n        d) era Pcàrrega trifàsica = 900 W.\n\nQüestió 4\n    Una enginyera disposa de diverses bobines de 4 mH al laboratori on treballa. Ha disse-\nnyat un circuit que li agradaria provar al més ràpidament possible i, per això, necessita una\nbobina de 2,7 mH. Quina de les opcions següents li permetrà assolir aquest objectiu?\n    a) Connectar dues inductàncies en sèrie.\n    b) Connectar dues inductàncies en paraŀlel.\n    c) Connectar dues inductàncies en sèrie i, aquest conjunt, en paraŀlel amb una tercera\n       inductància.\n    d) Connectar tres inductàncies en sèrie i, aquest conjunt, en paraŀlel amb una quarta\n       inductància.\n\nQüestió 5\n     Una xarxa monofàsica de tensió U = 240 V a una freqüència f = 50 Hz alimenta una\ncàrrega resistiva-inductiva de valor Z = 12 + j 8 Ω i una càrrega resistiva-capacitiva de valor\nZ = 12 – j 8 Ω connectades en sèrie. Quina és la potència reactiva consumida de la xarxa en\naquestes condicions (Qf 50) i quina seria la potència reactiva consumida de la xarxa si aquesta\nfos de 100 Hz (Qf 100)?\n     a) Qf 50 = 0 kvar i Qf 100 = 0,96 kvar\n     b) Qf 50 = 0 kvar i Qf 100 = –0,96 kvar\n     c) Qf 50 = 2,4 kvar i Qf 100 = 0,96 kvar\n     d) Qf 50 = 2,4 kvar i Qf 100 = –0,96 kvar\n\nTaula de respostes:\n\n    Espai de resposta per a l’alumne/a                               Espai per al corrector/a\n\nQüestió 1    a        b      c      d                           Puntuació de la qüestió 1\n\nQüestió 2    a        b      c      d                           Puntuació de la qüestió 2\n\nQüestió 3    a        b      c      d                           Puntuació de la qüestió 3\n\nQüestió 4    a        b      c      d                           Puntuació de la qüestió 4\n\nQüestió 5    a        b      c      d                           Puntuació de la qüestió 5\n                                                                Total de l’exercici 1",
    "apartats": [
      "a) el voltímetre mesura U2 = 25 V.",
      "b) el corrent que circula pel secundari és I2 = 2 A.",
      "c) el voltímetre mesura U2 = 100 V.",
      "d) s’estableix flux en el material ferromagnètic.",
      "a) 0 0 1 0",
      "b) 0 1 0 1 0 1 1 1",
      "c) 1 0 0 0",
      "d) 1 0 1 0 1 1 0 1",
      "a) amb les dades proporcionades no es pot saber.",
      "b) era Pcàrrega trifàsica = 2 700 W.",
      "c) era Pcàrrega trifàsica = 1 800 W.",
      "d) era Pcàrrega trifàsica = 900 W.",
      "a) Connectar dues inductàncies en sèrie.",
      "b) Connectar dues inductàncies en paraŀlel.",
      "c) Connectar dues inductàncies en sèrie i, aquest conjunt, en paraŀlel amb una tercera inductància.",
      "d) Connectar tres inductàncies en sèrie i, aquest conjunt, en paraŀlel amb una quarta inductància.",
      "a) Qf 50 = 0 kvar i Qf 100 = 0,96 kvar",
      "b) Qf 50 = 0 kvar i Qf 100 = –0,96 kvar",
      "c) Qf 50 = 2,4 kvar i Qf 100 = 0,96 kvar",
      "d) Qf 50 = 2,4 kvar i Qf 100 = –0,96 kvar"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Un transformador monofàsic de relació de transformació rt = 2 s’alimenta pel primari a",
      "una tensió contínua constant de valor U1 = 50 V. El corrent continu constant que circula pel",
      "primari és I1 = 1 A. Al secundari hi ha connectat un voltímetre. Podem afirmar que",
      "Una línia trifàsica de quatre conductors (tres conductors de fase i el neutre) de U = 400 V",
      "de tensió (composta) alimenta una càrrega simètrica connectada en estrella. En un moment",
      "circula pel neutre (IN = 5 A) i la potència activa consumida (Puna fase = 900 W). Respecte a la",
      "Una enginyera disposa de diverses bobines de 4 mH al laboratori on treballa. Ha disse-",
      "nyat un circuit que li agradaria provar al més ràpidament possible i, per això, necessita una",
      "bobina de 2,7 mH. Quina de les opcions següents li permetrà assolir aquest objectiu?",
      "Una xarxa monofàsica de tensió U = 240 V a una freqüència f = 50 Hz alimenta una",
      "càrrega resistiva-inductiva de valor Z = 12 + j 8 Ω i una càrrega resistiva-capacitiva de valor"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-elec2023-s5-e2",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Per al circuit de la figura, determineu: a) La mesura de l’amperímetre A1.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "Per al circuit de la figura, determineu:\n        a) La mesura de l’amperímetre A1.\n           [0,5 punts]\n\n        b) La potència PU1 subministrada al circuit per la font de tensió U1.\n           [0,5 punts]\n\n        c) La mesura del wattímetre W.\n           [0,5 punts]\n\nd) La mesura de l’amperímetre A2.\n   [0,5 punts]\n\ne) La mesura de l’amperímetre A3.\n   [0,5 punts]",
    "apartats": [
      "a) La mesura de l’amperímetre A1.",
      "b) La potència PU1 subministrada al circuit per la font de tensió U1.",
      "c) La mesura del wattímetre W.",
      "d) La mesura de l’amperímetre A2.",
      "e) La mesura de l’amperímetre A3."
    ],
    "dades": [
      "Per al circuit de la figura, determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-elec2023-s5-e3",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Sistema trifàsic equilibrat",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "El circuit de la figura és alimentat per un sistema trifàsic simètric i equilibrat de\n    tensió U (composta) i 50 Hz de freqüència. La càrrega trifàsica (simètrica) està formada per\n    tres branques idèntiques connectades en estrella. Cadascuna de les branques està formada\n    per una resistència R en paraŀlel amb una inductància Z. Determineu:\n         a) La mesura de l’amperímetre An.\n           [0,5 punts]\n\n        b) La mesura de l’amperímetre A3.\n           [0,5 punts]\n\nc) La mesura de l’amperímetre A2.\n   [0,5 punts]\n\nd) Les potències activa P, reactiva Q i aparent S totals consumides per la càrrega.\n   [0,5 punts]\n\ne) La mesura de l’amperímetre A1.\n   [0,5 punts]",
    "apartats": [
      "a) La mesura de l’amperímetre An.",
      "b) La mesura de l’amperímetre A3.",
      "c) La mesura de l’amperímetre A2.",
      "d) Les potències activa P, reactiva Q i aparent S totals consumides per la càrrega.",
      "e) La mesura de l’amperímetre A1."
    ],
    "dades": [
      "tensió U (composta) i 50 Hz de freqüència. La càrrega trifàsica (simètrica) està formada per",
      "per una resistència R en paraŀlel amb una inductància Z. Determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "rl"
  },
  {
    "id": "full-elec2023-s5-e4",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Circuit d’intermitència de moto",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "La figura mostra un esquema simplificat d’un circuit d’intermitència per a motos. La\n    tensió U = 12 V representa la bateria, que té una capacitat C10 de 12 A h. El relé tèrmic d’in-\n    termitència és, bàsicament, un interruptor que obre i tanca el circuit de manera automàtica,\n    i crea d’aquesta manera la intermitència desitjada. El fabricant d’aquest relé, basat en un\n    dispositiu bimetàŀlic, alerta del fet que la freqüència de l’intermitent depèn de la potència\n    consumida per les làmpades. En la figura també es mostra el commutador de tres posicions\n    (C3P), que serveix per a connectar el circuit de l’esquerra, el de la dreta o per a tenir el siste-\n    ma apagat. Cada circuit té dues làmpades (una davantera i l’altra posterior) connectades en\n    paraŀlel. Quan totes les làmpades són d’incandescència, de 12 V de tensió nominal i 10 W de\n    potència nominal, la freqüència d’encesa dels intermitents és d’1,2 Hz i el 50 % del període\n    estan encesos (connectats) i el 50 % del període estan apagats. Determineu:\n         a) La potència mitjana P subministrada per la bateria quan l’intermitent del costat\n            esquerre està en funcionament.\n            [0,5 punts]\n\n        b) El valor de la resistència equivalent R de cadascuna de les làmpades.\n            [0,5 punts]\n\n    Es canvien totes les làmpades d’incandescència per unes altres làmpades basades en\ndíodes emissors de llum (leds). Cadascuna de les noves làmpades està formada per 5 díodes\nconnectats en sèrie amb una caiguda de tensió ànode-càtode Ua-c = 1,2 V cadascun, que\npodem considerar constant. En sèrie amb els díodes, també tenen una resistència de valor\nRNL = 240 Ω. Determineu:\n    c) El corrent que circularia per les noves làmpades si estiguessin connectades a 12 V.\n       [0,5 punts]\n\n    d) La potència mitjana consumida pel circuit dret quan l’intermitent està en funciona-\n       ment, si observem que el 50 % del període les làmpades estan enceses (connectades) i\n       el 50 % del període estan apagades.\n       [0,5 punts]\n\n    En aquestes circumstàncies, la freqüència de funcionament no és admissible (no com-\npleix la normativa), ja que és massa elevada. Volem que el sistema funcioni a la mateixa fre-\nqüència que amb les làmpades d’incandescència i, per tant, cadascun dels circuits hauria de\nconsumir la mateixa potència amb les noves làmpades. Decidim, doncs, posar una resistència\na cadascun dels circuits, en paraŀlel amb les noves làmpades basades en leds. Determineu:\n    e) La potència mitjana que ha de dissipar la resistència i el seu valor.\n       [0,5 punts]",
    "apartats": [
      "a) La potència mitjana P subministrada per la bateria quan l’intermitent del costat esquerre està en funcionament.",
      "b) El valor de la resistència equivalent R de cadascuna de les làmpades.",
      "c) El corrent que circularia per les noves làmpades si estiguessin connectades a 12 V.",
      "d) La potència mitjana consumida pel circuit dret quan l’intermitent està en funciona- ment, si observem que el 50 % del període les làmpades estan enceses (connectades) i",
      "e) La potència mitjana que ha de dissipar la resistència i el seu valor."
    ],
    "dades": [
      "La figura mostra un esquema simplificat d’un circuit d’intermitència per a motos. La",
      "tensió U = 12 V representa la bateria, que té una capacitat C10 de 12 A h. El relé tèrmic d’in-",
      "termitència és, bàsicament, un interruptor que obre i tanca el circuit de manera automàtica,",
      "i crea d’aquesta manera la intermitència desitjada. El fabricant d’aquest relé, basat en un",
      "consumida per les làmpades. En la figura també es mostra el commutador de tres posicions",
      "paraŀlel. Quan totes les làmpades són d’incandescència, de 12 V de tensió nominal i 10 W de",
      "potència nominal, la freqüència d’encesa dels intermitents és d’1,2 Hz i el 50 % del període",
      "estan encesos (connectats) i el 50 % del període estan apagats. Determineu:",
      "connectats en sèrie amb una caiguda de tensió ànode-càtode Ua-c = 1,2 V cadascun, que",
      "RNL = 240 Ω. Determineu:",
      "pleix la normativa), ja que és massa elevada. Volem que el sistema funcioni a la mateixa fre-",
      "consumir la mateixa potència amb les noves làmpades. Decidim, doncs, posar una resistència"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "ohm"
  },
  {
    "id": "full-elec2023-s5-e5",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motor CC amb ventilador",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Connectem l’eix d’un motor de corrent continu d’excitació amb imants permanents\n     directament a l’eix d’un ventilador. El motor de corrent continu té la placa de característiques\n     següent:\n                                UN = 500 V         IN = 69 A     nN = 1 750 min–1\n         Considerem negligibles les pèrdues mecàniques i en les escombretes del motor de corrent\n     continu.\n         El ventilador és una càrrega que presenta un parell proporcional a la velocitat de gir ele-\n     vada al quadrat:\n                                               ΓL = 0,0048744 · ω2,\n\n         en què ΓL està expressat en N m quan la ω està en            .\n\n         Amb el motor de corrent continu treballant en condicions nominals i en règim estacio-\n     nari (és a dir, a velocitat constant i, per tant, quan el parell motor és igual al parell resistent),\n     determineu:\n         a) El parell ΓN desenvolupat pel motor de corrent continu.\n             [0,5 punts]\n\n         b) La potència PN útil a l’eix que hauria de sortir en la placa de característiques del motor.\n             [0,5 punts]\n\nc) El valor de la resistència de l’induït Ri del motor.\n   [0,5 punts]\n\nd) El valor de la tensió a la qual s’ha d’alimentar el motor si volem que el ventilador giri\n   a una velocitat de nv = 1 200 min–1 en règim estacionari.\n   [1 punt]",
    "apartats": [
      "a) El parell ΓN desenvolupat pel motor de corrent continu.",
      "b) La potència PN útil a l’eix que hauria de sortir en la placa de característiques del motor.",
      "c) El valor de la resistència de l’induït Ri del motor.",
      "d) El valor de la tensió a la qual s’ha d’alimentar el motor si volem que el ventilador giri"
    ],
    "dades": [
      "Connectem l’eix d’un motor de corrent continu d’excitació amb imants permanents",
      "directament a l’eix d’un ventilador. El motor de corrent continu té la placa de característiques",
      "UN = 500 V IN = 69 A nN = 1 750 min–1",
      "Considerem negligibles les pèrdues mecàniques i en les escombretes del motor de corrent",
      "ΓL = 0,0048744 · ω2,",
      "en què ΓL està expressat en N m quan la ω està en .",
      "Amb el motor de corrent continu treballant en condicions nominals i en règim estacio-",
      "nari (és a dir, a velocitat constant i, per tant, quan el parell motor és igual al parell resistent),",
      "determineu:",
      "a una velocitat de nv = 1 200 min–1 en règim estacionari."
    ],
    "formules": [
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-elec2023-s5-e6",
    "any": 2023,
    "materia": "Electrotècnia",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "La figura mostra un circuit RLC paraŀlel.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "La figura mostra un circuit RLC paraŀlel. En aquestes condicions, determineu:\n         a) El valor del corrent que circula per la resistència R.\n            [0,5 punts]\n\n         b) El valor de la mesura del wattímetre W.\n            [0,5 punts]\n\n         c) El valor de la freqüència f de la font de tensió U.\n            [0,5 punts]\n\nd) El valor de la potència reactiva QL consumida per la inductància.\n   [0,5 punts]\n\ne) El valor de les potències activa P, reactiva Q i aparent S subministrades per la font de\n   tensió.\n   [0,5 punts]",
    "apartats": [
      "a) El valor del corrent que circula per la resistència R.",
      "b) El valor de la mesura del wattímetre W.",
      "c) El valor de la freqüència f de la font de tensió U.",
      "d) El valor de la potència reactiva QL consumida per la inductància.",
      "e) El valor de les potències activa P, reactiva Q i aparent S subministrades per la font de"
    ],
    "dades": [
      "La figura mostra un circuit RLC paraŀlel. En aquestes condicions, determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "rl"
  },
  {
    "id": "full-tec2024-s1-e1",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n      que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n      [2,5 punts]\n      [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n      qüestió no contestada: 0 punts.]\n\n      Qüestió 1\n         Un motor de benzina de quatre temps consumeix 10,2 L/h quan gira a 4 000 min–1. El\n      poder calorífic de la benzina és 42 000 kJ/kg i la seva densitat, 0,8 kg/L. Quina és la massa de\n      combustible consumida en un cicle del motor?\n         a) 30 mg\n         b) 34 mg\n         c) 68 mg\n         d) 136 mg\n\n      Qüestió 2\n          La figura mostra les corbes tensió-deformació obtingudes en\n      assajos de tracció utilitzant dos acers diferents. A partir de l’obser-\n      vació d’aquesta figura, es pot afirmar que\n          a) el mòdul d’elasticitat dels dos acers no es pot determinar\n              en aquest assaig.\n          b) el mòdul d’elasticitat dels dos acers és el mateix.\n          c) el mòdul d’elasticitat de l’acer 1 és més gran que el de\n              l’acer 2.\n          d) el mòdul d’elasticitat de l’acer 2 és més gran que el de\n              l’acer 1.\n\n      Qüestió 3\n          Una resistència elèctrica proporciona 3 000 J a 50 ml d’aigua que es troben a 5 °C. Sabent\n      que la calor específica de l’aigua és ce = 4,18 kJ/(kg K), la temperatura final de l’aigua serà\n          a) 1,435 °C.\n          b) 6,435 °C.\n          c) 14,35 °C.\n          d) 19,35 °C.\n\nQüestió 4\n    Un habitatge disposa de vuit plaques solars. L’àrea total de les plaques és de 4,4 m2, i les\nseves condicions de localització fan que es disposi, el mes de setembre, d’una irradiació diària\nmitjana de 13 kW h/m2. Si les plaques tenen un rendiment del 0,3, l’energia produïda durant\nel mes de setembre serà de\n    a) 514,8 kW h.\n    b) 1 853 J.\n    c) 58,52 J.\n    d) 52,19 kW h.\n\nQüestió 5\n     El motor d’una motocicleta de quatre temps té una cursa de 50,6 mm i un diàmetre de\ncilindre de 56 mm. Si la relació de compressió és 7,3, quin és el volum de la cambra de com-\nbustió?\n     a) 124,6 cm3\n     b) 112,6 cm3\n     c) 39,56 cm3\n     d) 19,78 cm3\n\nTaula de respostes:\n\n    Espai de resposta per a l’estudiant                              Espai per a la correcció\n\nQüestió 1    a        b      c       d                           Puntuació de la qüestió 1\n\nQüestió 2    a        b      c       d                           Puntuació de la qüestió 2\n\nQüestió 3    a        b      c       d                           Puntuació de la qüestió 3\n\nQüestió 4    a        b      c       d                           Puntuació de la qüestió 4\n\nQüestió 5    a        b      c       d                           Puntuació de la qüestió 5\n                                                                 Total de l’exercici 1",
    "apartats": [
      "a) 30 mg",
      "b) 34 mg",
      "c) 68 mg",
      "d) 136 mg",
      "a) el mòdul d’elasticitat dels dos acers no es pot determinar en aquest assaig.",
      "b) el mòdul d’elasticitat dels dos acers és el mateix.",
      "c) el mòdul d’elasticitat de l’acer 1 és més gran que el de l’acer 2.",
      "d) el mòdul d’elasticitat de l’acer 2 és més gran que el de l’acer 1.",
      "a) 1,435 °C.",
      "b) 6,435 °C.",
      "c) 14,35 °C.",
      "d) 19,35 °C.",
      "a) 514,8 kW h.",
      "b) 1 853 J.",
      "c) 58,52 J.",
      "d) 52,19 kW h.",
      "a) 124,6 cm3",
      "b) 112,6 cm3",
      "c) 39,56 cm3",
      "d) 19,78 cm3"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Un motor de benzina de quatre temps consumeix 10,2 L/h quan gira a 4 000 min–1. El",
      "poder calorífic de la benzina és 42 000 kJ/kg i la seva densitat, 0,8 kg/L. Quina és la massa de",
      "combustible consumida en un cicle del motor?",
      "La figura mostra les corbes tensió-deformació obtingudes en",
      "assajos de tracció utilitzant dos acers diferents. A partir de l’obser-",
      "Una resistència elèctrica proporciona 3 000 J a 50 ml d’aigua que es troben a 5 °C. Sabent",
      "que la calor específica de l’aigua és ce = 4,18 kJ/(kg K), la temperatura final de l’aigua serà",
      "Un habitatge disposa de vuit plaques solars. L’àrea total de les plaques és de 4,4 m2, i les",
      "seves condicions de localització fan que es disposi, el mes de setembre, d’una irradiació diària",
      "mitjana de 13 kW h/m2. Si les plaques tenen un rendiment del 0,3, l’energia produïda durant",
      "el mes de setembre serà de"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2024-s1-e2",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Control d’accés amb tres sistemes",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           L’accés a un edifici d’oficines està regulat per tres sistemes de control: una clau numèrica,\n      una targeta magnètica i l’empremta dactilar. Es permet l’accés a l’edifici, en horari laboral,\n      validant qualsevol dels tres sistemes de control. Fora de l’horari laboral, cal validar almenys\n      dos dels tres sistemes.\n           Responeu a les qüestions que hi ha a continuació utilitzant les variables d’estat següents:\n\n                    {\n      horari: h = 1: laboral\n                  0: no laboral\n                                ; clau: c =  {\n                                            1: vàlida\n                                            0: no vàlida\n                                                         ; targeta: t ={1: vàlida\n                                                                        0: no vàlida\n                                                                                     ;\n\n      empremta: e = 1: vàlida{\n                    0: no vàlida\n                                 ; accés: a =    {\n                                              1: permès\n                                              0: denegat\n                                                         .\n\n           a) Elaboreu la taula de veritat del sistema.\n                [1 punt]\n\n                    h        c   t   e   a\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu el diagrama de portes lògiques equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Elaboreu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu el diagrama de portes lògiques equivalent."
    ],
    "dades": [
      "L’accés a un edifici d’oficines està regulat per tres sistemes de control: una clau numèrica,",
      "una targeta magnètica i l’empremta dactilar. Es permet l’accés a l’edifici, en horari laboral,",
      "horari: h = 1: laboral",
      "; clau: c = {",
      "; targeta: t ={1: vàlida",
      "empremta: e = 1: vàlida{",
      "; accés: a = {"
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s1-e3",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 3",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Patinet elèctric en pujada",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Una persona té un patinet elèctric que utilitza una bateria ideal de tensió U = 24 V i\n      energia Ebat = 250 W h per a alimentar un motor de rendiment ηmot = 0,85. La roda motriu del\n      patinet, de diàmetre droda = 140 mm, està connectada directament a l’eix de sortida del motor.\n           En les condicions d’estudi, la persona i el patinet tenen una massa conjunta m = 70 kg\n      i recorren s = 2 km a velocitat constant v = 8 km/h per una pujada en què l’angle que forma\n      el perfil del carrer amb l’horitzontal és α = 7°. A l’inici del trajecte, la bateria està totalment\n      carregada. Si totes les pèrdues diferents a les associades al rendiment del motor es poden\n      negligir, determineu:\n           a) La potència elèctrica consumida, Pelèc.\n                [1 punt]\n\n           b) La velocitat de rotació de l’eix del motor, ωmot, i el parell que subministra el motor, Γ.\n                [1 punt]\n\nc) El percentatge d’energia consumida de la bateria, Δ.\n   [0,5 punts]",
    "apartats": [
      "a) La potència elèctrica consumida, Pelèc.",
      "b) La velocitat de rotació de l’eix del motor, ωmot, i el parell que subministra el motor, Γ.",
      "c) El percentatge d’energia consumida de la bateria, Δ."
    ],
    "dades": [
      "Una persona té un patinet elèctric que utilitza una bateria ideal de tensió U = 24 V i",
      "energia Ebat = 250 W h per a alimentar un motor de rendiment ηmot = 0,85. La roda motriu del",
      "patinet, de diàmetre droda = 140 mm, està connectada directament a l’eix de sortida del motor.",
      "En les condicions d’estudi, la persona i el patinet tenen una massa conjunta m = 70 kg",
      "i recorren s = 2 km a velocitat constant v = 8 km/h per una pujada en què l’angle que forma",
      "el perfil del carrer amb l’horitzontal és α = 7°. A l’inici del trajecte, la bateria està totalment",
      "carregada. Si totes les pèrdues diferents a les associades al rendiment del motor es poden",
      "negligir, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2024-s1-e4",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 4",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Un cotxe de massa m = 1 250 kg parteix del repòs i arriba a una velocitat final v = 50 km/h…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n          Un cotxe de massa m = 1 250 kg parteix del repòs i arriba a una velocitat final v = 50 km/h\n      circulant per un circuit horitzontal. El cotxe és propulsat per un motor de combustió interna\n      de rendiment η = 0,25.\n          La benzina té un poder calorífic pc = 46 MJ/kg i una densitat ρ = 0,72 g/cm3. El factor\n      d’emissions de la benzina és FE = 2,157 kg de CO2 per litre de combustible.\n          Si es poden negligir totes les resistències passives, determineu:\n          a) El treball mecànic aportat pel motor, W.\n                [1 punt]\n\n           b) La quantitat de benzina utilitzada, mbenz.\n                [1 punt]\n\nc) La petjada de CO2 emesa a l’atmosfera, mCO .\n\n   [0,5 punts]",
    "apartats": [
      "a) El treball mecànic aportat pel motor, W.",
      "b) La quantitat de benzina utilitzada, mbenz.",
      "c) La petjada de CO2 emesa a l’atmosfera, mCO ."
    ],
    "dades": [
      "Un cotxe de massa m = 1 250 kg parteix del repòs i arriba a una velocitat final v = 50 km/h",
      "circulant per un circuit horitzontal. El cotxe és propulsat per un motor de combustió interna",
      "de rendiment η = 0,25.",
      "La benzina té un poder calorífic pc = 46 MJ/kg i una densitat ρ = 0,72 g/cm3. El factor",
      "d’emissions de la benzina és FE = 2,157 kg de CO2 per litre de combustible.",
      "Si es poden negligir totes les resistències passives, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2024-s1-e5",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 5",
    "bloc": "Estàtica i estructures",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Es vol estudiar la força necessària que ha de fer el múscul tibial anterior per tal de garan…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n              Es vol estudiar la força necessària que ha de fer el múscul tibial anterior per tal de garantir\n         que la planta del peu es trobi en posició horitzontal quan es manté elevat sense tocar a terra.\n         La figura mostra un esquema del peu en aquesta posició.\n              El centre de l’articulació del turmell és el punt O, que es considera fix. El peu, que s’ha\n         representat amb el triangle OPT, té el centre d’inèrcia al punt G i una massa m = 2,2 kg. El\n         múscul tibial anterior s’insereix al punt Q i fa una força Fm. El seu braç de moment respecte\n         a O (distància entre la línia d’acció de la força i el punt O) és a = 30 mm i la seva línia d’acció\n         forma un angle φ = 9° respecte a la vertical.\n\n              Per a aquesta posició estàtica:\n              a) Dibuixeu el diagrama de cos lliure del peu.\n                   [1 punt]\n\nb) Determineu la força que fa el múscul, Fm.\n   [0,5 punts]\n\nc) Determineu les forces a l’articulació O.\n   [1 punt]",
    "apartats": [
      "a) Dibuixeu el diagrama de cos lliure del peu.",
      "b) Determineu la força que fa el múscul, Fm.",
      "c) Determineu les forces a l’articulació O."
    ],
    "dades": [
      "Es vol estudiar la força necessària que ha de fer el múscul tibial anterior per tal de garantir",
      "que la planta del peu es trobi en posició horitzontal quan es manté elevat sense tocar a terra.",
      "La figura mostra un esquema del peu en aquesta posició.",
      "representat amb el triangle OPT, té el centre d’inèrcia al punt G i una massa m = 2,2 kg. El",
      "múscul tibial anterior s’insereix al punt Q i fa una força Fm. El seu braç de moment respecte",
      "a O (distància entre la línia d’acció de la força i el punt O) és a = 30 mm i la seva línia d’acció",
      "forma un angle φ = 9° respecte a la vertical."
    ],
    "formules": [
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s1-e6",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 1",
    "exercici": "Exercici 6",
    "bloc": "Electrotècnia i corrent altern",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "El circuit de la figura mostra una font de tensió alterna sinusoidal de freqüència f = 50 Hz…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n\n              El circuit de la figura mostra una font de tensió alterna sinusoidal de freqüència f = 50 Hz\n         que alimenta una càrrega formada per una resistència R1 = 5 Ω en sèrie amb una inductància\n         L1 = 7 mH. El wattímetre està connectat de manera que mesura la potència activa total consu-\n         mida per la càrrega W1 = 950 W. Determineu:\n              a) El valor òhmic de la reactància inductiva, XL , que presenta la inductància L1.\n\n                   [0,5 punts]\n\n              b) El factor de potència, cos φ, de la càrrega.\n                   [0,5 punts]\n\nc) El valor de la impedància equivalent de tot el circuit, Z.\n   [0,5 punts]\n\nd) El valor de la mesura de l’amperímetre, A1.\n   [0,5 punts]\n\ne) El valor eficaç de la tensió d’alimentació, U1.\n   [0,5 punts]",
    "apartats": [
      "a) El valor òhmic de la reactància inductiva, XL , que presenta la inductància L1.",
      "b) El factor de potència, cos φ, de la càrrega.",
      "c) El valor de la impedància equivalent de tot el circuit, Z.",
      "d) El valor de la mesura de l’amperímetre, A1.",
      "e) El valor eficaç de la tensió d’alimentació, U1."
    ],
    "dades": [
      "El circuit de la figura mostra una font de tensió alterna sinusoidal de freqüència f = 50 Hz",
      "que alimenta una càrrega formada per una resistència R1 = 5 Ω en sèrie amb una inductància",
      "L1 = 7 mH. El wattímetre està connectat de manera que mesura la potència activa total consu-",
      "mida per la càrrega W1 = 950 W. Determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "rl"
  },
  {
    "id": "full-tec2024-s5-e1",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n      que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n      [2,5 punts]\n      [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n      qüestió no contestada: 0 punts.]\n\n      Qüestió 1\n          La intensitat del circuit elèctric d’una estufa de quars és de 8 A. L’estufa està connecta-\n      da a la xarxa elèctrica a U = 230 V durant 4 h i té un rendiment del 98 %. L’energia elèctrica\n      consumida és\n          a) 25,97 MJ.\n          b) 26,50 MJ.\n          c) 27,04 MJ.\n          d) 43,28 MJ.\n\n      Qüestió 2\n          El cabal d’aigua calenta d’una dutxa és de 12 L/min i la temperatura de sortida de l’aigua\n      és de 38 °C. Inicialment l’aigua es troba a 15 °C (ce = 4,18 J/(g °C)). En una dutxa de 5 minuts\n      de durada, l’energia utilitzada per a escalfar l’aigua és\n          a) 1,602 kW h.\n          b) 5,768 kW h.\n          c) 1,602 kJ.\n          d) 5 768 J.\n\n      Qüestió 3\n           Es disposa de dues resistències de valor R. En un primer experiment, es connecten en\n      sèrie i s’alimenten a una tensió U, i, com a conseqüència, la potència total dissipada per les\n      resistències és P. En un segon experiment, les dues resistències es connecten en paraŀlel i\n      s’alimenten a la mateixa tensió U. Quina serà, en aquest cas, la potència total dissipada per\n      les resistències?\n           a) P\n           b) 2P\n           c) 3P\n           d) 4P\n\nQüestió 4\n     Un bloc de massa m = 2 kg està unit mitjançant un cable al centre d’una\npolitja de radi R1 = 300 mm. Una corda ideal s’uneix al centre de la politja\nde la qual penja el bloc, passa per una altra politja de radi R2 = 150 mm\narticulada al sostre i, finalment, passa per la politja de radi R1. Quina força\nF cal fer per a mantenir el bloc en repòs?\n     a) 6,538 N\n     b) 58,84 N\n     c) 19,61 N\n     d) 9,807 N\n\nQüestió 5\n    El rail d’una via de tren està fet d’acer d’un coeficient de dilatació αac = 10,8 × 10–6 °C–1 i té\nuna longitud de 25 m a T = 20 °C. En les condicions de treball, la temperatura ambient osciŀla\nentre –10 °C i 45 °C. La variació de longitud que experimenta el rail és de\n    a) 6,750 mm.\n    b) 8,100 mm.\n    c) 9,450 mm.\n    d) 14,85 mm.\n\nTaula de respostes:\n\n     Espai de resposta per a l’estudiant                                  Espai per a la correcció\n\nQüestió 1     a       b       c       d                              Puntuació de la qüestió 1\n\nQüestió 2     a       b       c       d                              Puntuació de la qüestió 2\n\nQüestió 3     a       b       c       d                              Puntuació de la qüestió 3\n\nQüestió 4     a       b       c       d                              Puntuació de la qüestió 4\n\nQüestió 5     a       b       c       d                              Puntuació de la qüestió 5\n                                                                     Total de l’exercici 1",
    "apartats": [
      "a) 25,97 MJ.",
      "b) 26,50 MJ.",
      "c) 27,04 MJ.",
      "d) 43,28 MJ.",
      "a) 1,602 kW h.",
      "b) 5,768 kW h.",
      "c) 1,602 kJ.",
      "d) 5 768 J.",
      "a) P",
      "b) 2P",
      "c) 3P",
      "d) 4P",
      "a) 6,538 N",
      "b) 58,84 N",
      "c) 19,61 N",
      "d) 9,807 N",
      "a) 6,750 mm.",
      "b) 8,100 mm.",
      "c) 9,450 mm.",
      "d) 14,85 mm."
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "La intensitat del circuit elèctric d’una estufa de quars és de 8 A. L’estufa està connecta-",
      "da a la xarxa elèctrica a U = 230 V durant 4 h i té un rendiment del 98 %. L’energia elèctrica",
      "El cabal d’aigua calenta d’una dutxa és de 12 L/min i la temperatura de sortida de l’aigua",
      "és de 38 °C. Inicialment l’aigua es troba a 15 °C (ce = 4,18 J/(g °C)). En una dutxa de 5 minuts",
      "s’alimenten a la mateixa tensió U. Quina serà, en aquest cas, la potència total dissipada per",
      "Un bloc de massa m = 2 kg està unit mitjançant un cable al centre d’una",
      "politja de radi R1 = 300 mm. Una corda ideal s’uneix al centre de la politja",
      "de la qual penja el bloc, passa per una altra politja de radi R2 = 150 mm",
      "F cal fer per a mantenir el bloc en repòs?",
      "El rail d’una via de tren està fet d’acer d’un coeficient de dilatació αac = 10,8 × 10–6 °C–1 i té",
      "una longitud de 25 m a T = 20 °C. En les condicions de treball, la temperatura ambient osciŀla"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s5-e2",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Un sistema digital controla l’encesa d’un llum.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n          Un sistema digital controla l’encesa d’un llum. El sistema rep com a entrades un número\n      codificat en binari (quatre entrades d’un bit). El llum únicament ha d’estar encès si el nom-\n      bre és 0 o un nombre senar. Responeu a les qüestions que hi ha a continuació utilitzant les\n      variables d’estat següents:\n\n                                                   {\n      primer dígit (el de més a l’esquerra): a = 1 ; segon dígit: b = 1 ;\n                                                                      0  {\n                        0    {               {\n      tercer dígit: c = 1 ; quart dígit: d = 1 ;\n                                             0                 {\n                                                       llum: l = 1: encès .\n                                                                 0: apagat\n           a) Elaboreu la taula de veritat del sistema.\n                [1 punt]\n\n                    a        b   c   d   l\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu l’esquema de contactes equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Elaboreu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu l’esquema de contactes equivalent."
    ],
    "dades": [
      "primer dígit (el de més a l’esquerra): a = 1 ; segon dígit: b = 1 ;",
      "tercer dígit: c = 1 ; quart dígit: d = 1 ;",
      "llum: l = 1: encès ."
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s5-e3",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Una caseta aïllada de muntanya consta d’una sola habitació d’àrea A = 55 m2 que es vol calef…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Una caseta aïllada de muntanya consta d’una sola habitació d’àrea A = 55 m2 que es vol\n      calefactar amb una estufa de pèŀlets. L’estufa, de rendiment η = 0,89, té un dipòsit per a 15 kg\n      de pèŀlets i en consumeix qpèl = 1,483 kg/h.\n           S’utilitza un sac de pèŀlets de massa m = 15 kg, que té un preu p = 6 €. El fabricant de pèl-\n      lets especifica que el poder calorífic del combustible és pc = 5,23 kW h/kg i que el residu en\n      cendres és rcendra = 0,7 % de la seva massa abans de la combustió.\n           Si es parteix del dipòsit de l’estufa ple i se’n consumeix tot el contingut, determineu:\n           a) L’energia que proporciona un sac de pèŀlets, Econs.\n                [0,5 punts]\n\n           b) L’energia que l’estufa cedirà a l’habitatge, Eútil, i el seu cost per kW h, ce.\n                [1 punt]\n\nc) Les hores, t, que l’estufa pot estar en funcionament.\n   [0,5 punts]\n\nd) La quantitat de cendra generada, mcendra.\n   [0,5 punts]",
    "apartats": [
      "a) L’energia que proporciona un sac de pèŀlets, Econs.",
      "b) L’energia que l’estufa cedirà a l’habitatge, Eútil, i el seu cost per kW h, ce.",
      "c) Les hores, t, que l’estufa pot estar en funcionament.",
      "d) La quantitat de cendra generada, mcendra."
    ],
    "dades": [
      "Una caseta aïllada de muntanya consta d’una sola habitació d’àrea A = 55 m2 que es vol",
      "calefactar amb una estufa de pèŀlets. L’estufa, de rendiment η = 0,89, té un dipòsit per a 15 kg",
      "de pèŀlets i en consumeix qpèl = 1,483 kg/h.",
      "S’utilitza un sac de pèŀlets de massa m = 15 kg, que té un preu p = 6 €. El fabricant de pèl-",
      "lets especifica que el poder calorífic del combustible és pc = 5,23 kW h/kg i que el residu en",
      "cendres és rcendra = 0,7 % de la seva massa abans de la combustió.",
      "Si es parteix del dipòsit de l’estufa ple i se’n consumeix tot el contingut, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s5-e4",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "La figura mostra l’esquema d’un prototip de cadena de transmissió d’una motocicleta de compe…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n           La figura mostra l’esquema d’un prototip de cadena de\n      transmissió d’una motocicleta de competició amb una marxa\n      engranada. Disposa de 6 rodes dentades de z1 = 23, z2 = 57,\n      z3 = 16, z4 = 33, z5 = 18 i z6 = 38 dents.\n           El motor té una cilindrada C = 250 cm3, el rendiment de\n      la transmissió és η = 0,9 i el diàmetre de la roda motriu de la\n      moto és d = 0,6 m. S’estudia el comportament de la motocicle-\n      ta quan el motor gira a nmot = 4 000 min–1 i proporciona una\n      potència Pmot = 15 kW. Determineu:\n\n           a) La relació de transmissió entre motor i roda, τ = ωroda/ωmot.\n                [1 punt]\n\n           b) La velocitat d’avanç, v.\n                [0,5 punts]\n\nc) El parell a l’eix de la roda, Γ.\n   [1 punt]",
    "apartats": [
      "a) La relació de transmissió entre motor i roda, τ = ωroda/ωmot.",
      "b) La velocitat d’avanç, v.",
      "c) El parell a l’eix de la roda, Γ."
    ],
    "dades": [
      "La figura mostra l’esquema d’un prototip de cadena de",
      "transmissió d’una motocicleta de competició amb una marxa",
      "engranada. Disposa de 6 rodes dentades de z1 = 23, z2 = 57,",
      "z3 = 16, z4 = 33, z5 = 18 i z6 = 38 dents.",
      "El motor té una cilindrada C = 250 cm3, el rendiment de",
      "la transmissió és η = 0,9 i el diàmetre de la roda motriu de la",
      "moto és d = 0,6 m. S’estudia el comportament de la motocicle-",
      "ta quan el motor gira a nmot = 4 000 min–1 i proporciona una",
      "potència Pmot = 15 kW. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2024-s5-e5",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "S’utilitza una placa elèctrica portàtil per a cuinar fora de casa.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n              S’utilitza una placa elèctrica portàtil per a cuinar fora de casa. La seva resistència és d’un\n         aliatge de nicrom de resistivitat ρ = 1,28 × 10–6 Ω m. El diàmetre del fil és d = 0,8 mm i té una\n         longitud L = 5,54 m. El rendiment de la placa és η = 0,9. Es connecta a la xarxa a U = 230 V i\n         està en funcionament durant t = 30 min.\n              Determineu:\n              a) La resistència de la placa, R.\n                   [0,5 punts]\n\n              b) La potència útil de la placa, Pútil.\n                   [1 punt]\n\nc) La intensitat que hi circula, I.\n   [0,5 punts]\n\nd) L’energia consumida durant el temps que està en funcionament, Econs.\n   [0,5 punts]",
    "apartats": [
      "a) La resistència de la placa, R.",
      "b) La potència útil de la placa, Pútil.",
      "c) La intensitat que hi circula, I.",
      "d) L’energia consumida durant el temps que està en funcionament, Econs."
    ],
    "dades": [
      "S’utilitza una placa elèctrica portàtil per a cuinar fora de casa. La seva resistència és d’un",
      "aliatge de nicrom de resistivitat ρ = 1,28 × 10–6 Ω m. El diàmetre del fil és d = 0,8 mm i té una",
      "longitud L = 5,54 m. El rendiment de la placa és η = 0,9. Es connecta a la xarxa a U = 230 V i",
      "està en funcionament durant t = 30 min.",
      "Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2024-s5-e6",
    "any": 2024,
    "materia": "Tecnologia i enginyeria",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Un escalfador d’aigua de rendiment η = 0,87 funciona amb gas butà de poder calorífic pcbutà…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n              Un escalfador d’aigua de rendiment η = 0,87 funciona amb gas butà de poder calorífic\n         pcbutà = 47,7 MJ/kg i s’utilitza per a incrementar ΔT = 20 °C la temperatura de l’aigua calenta\n         sanitària. S’estima que en cada dutxa es consumeixen V = 75 L d’aigua. Les bombones de\n         butà contenen m = 12,5 kg de combustible i tenen un preu pbutà = 17,66 €. El preu de l’aigua\n         és paigua = 0,93 €/m3 i la seva calor específica és ce = 4,18 kJ/(kg K).\n              Determineu:\n              a) L’energia que consumeix l’escalfador per a subministrar l’aigua per a una dutxa, Econs.\n                   [1 punt]\n\n              b) El nombre de dutxes, n, que es poden fer amb una sola bombona de butà.\n                   [1 punt]\n\nc) El cost econòmic d’una dutxa, pdutxa.\n   [0,5 punts]",
    "apartats": [
      "a) L’energia que consumeix l’escalfador per a subministrar l’aigua per a una dutxa, Econs.",
      "b) El nombre de dutxes, n, que es poden fer amb una sola bombona de butà.",
      "c) El cost econòmic d’una dutxa, pdutxa."
    ],
    "dades": [
      "Un escalfador d’aigua de rendiment η = 0,87 funciona amb gas butà de poder calorífic",
      "pcbutà = 47,7 MJ/kg i s’utilitza per a incrementar ΔT = 20 °C la temperatura de l’aigua calenta",
      "sanitària. S’estima que en cada dutxa es consumeixen V = 75 L d’aigua. Les bombones de",
      "butà contenen m = 12,5 kg de combustible i tenen un preu pbutà = 17,66 €. El preu de l’aigua",
      "és paigua = 0,93 €/m3 i la seva calor específica és ce = 4,18 kJ/(kg K).",
      "Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "calor"
  },
  {
    "id": "full-tec2022-s2-e1",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n      que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n      [2,5 punts]\n      [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n      qüestió no contestada: 0 punts.]\n\n      Qüestió 1\n           Per a realitzar un assaig de Charpy s’utilitza un pèndol d’1 m de longitud que a l’extrem\n      té una massa de 22 kg. S’usa una proveta amb una entalla en forma de U i una secció de\n      80 mm2. A l’instant inicial, el pèndol està en posició horitzontal (la barra del pèndol és paraŀ-\n      lela al terra), i després de xocar contra la proveta al punt més baix de la seva trajectòria, el seu\n      extrem s’eleva 250 mm. Quanta energia s’ha absorbit en el xoc?\n           a) 202,3 J\n           b) 215,7 J\n           c) 53,94 J\n           d) 161,8 J\n\n      Qüestió 2\n          Una resistència elèctrica normalitzada de 390 Ω el valor de la qual pot estar comprès\n      entre 382,2 Ω i 397,8 Ω té una tolerància del\n          a) ±1 %.\n          b) ±2 %.\n          c) ±5 %.\n          d) ±10 %.\n\n      Qüestió 3\n          Un automòbil emet 157,8 g de CO2 per cada kilòmetre recorregut en vies interurbanes.\n      Setmanalment gasta un dipòsit de 60 L de gasoil en aquests recorreguts i té un consum mitjà\n      de 5,6 L/(100 km). Quina és la petjada de carboni que deixarà a l’atmosfera en una setmana?\n          a) 169,1 kg de CO2\n          b) 169,1 tones de CO2\n          c) 1,691 kg de CO2\n          d) 16,91 kg de CO2\n\nQüestió 4\n   Amb quines unitats es pot expressar la potència elèctrica consumida en un instant deter-\nminat en una llar?\n   a) kW/h\n   b) kW · h\n   c) kW\n   d) kJ · s\n\nQüestió 5\n    Un tren d’engranatges es connecta entre els eixos d’un      roda\nmotor elèctric i d’una roda. Disposa de 4 rodes dentades                              z1\nde z1 = 14, z2 = 48, z3 = 16 i z4 = 25 dents com es veu en la                z4\n                                                                                              motor\nfigura. Determineu la relació de transmissió ωroda/ωmotor.\n    a) 0,186 7\n    b) 5,357\n    c) 0,291 7\n    d) 0,411 0                                                               z3\n\n                                                                                      z2\n\nTaula de respostes:\n\n    Espai de resposta per a l’alumne/a                                 Espai per al corrector/a\n\nQüestió 1     a       b      c      d                            Puntuació de la qüestió 1\n\nQüestió 2     a       b      c      d                            Puntuació de la qüestió 2\n\nQüestió 3     a       b      c      d                            Puntuació de la qüestió 3\n\nQüestió 4     a       b      c      d                            Puntuació de la qüestió 4\n\nQüestió 5     a       b      c      d                            Puntuació de la qüestió 5\n                                                                 Total de l’exercici 1",
    "apartats": [
      "a) 202,3 J",
      "b) 215,7 J",
      "c) 53,94 J",
      "d) 161,8 J",
      "a) ±1 %.",
      "b) ±2 %.",
      "c) ±5 %.",
      "d) ±10 %.",
      "a) 169,1 kg de CO2",
      "b) 169,1 tones de CO2",
      "c) 1,691 kg de CO2",
      "d) 16,91 kg de CO2",
      "a) kW/h",
      "b) kW · h",
      "c) kW",
      "d) kJ · s",
      "a) 0,186 7",
      "b) 5,357",
      "c) 0,291 7",
      "d) 0,411 0 z3"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Per a realitzar un assaig de Charpy s’utilitza un pèndol d’1 m de longitud que a l’extrem",
      "té una massa de 22 kg. S’usa una proveta amb una entalla en forma de U i una secció de",
      "80 mm2. A l’instant inicial, el pèndol està en posició horitzontal (la barra del pèndol és paraŀ-",
      "lela al terra), i després de xocar contra la proveta al punt més baix de la seva trajectòria, el seu",
      "extrem s’eleva 250 mm. Quanta energia s’ha absorbit en el xoc?",
      "Una resistència elèctrica normalitzada de 390 Ω el valor de la qual pot estar comprès",
      "entre 382,2 Ω i 397,8 Ω té una tolerància del",
      "Un automòbil emet 157,8 g de CO2 per cada kilòmetre recorregut en vies interurbanes.",
      "Setmanalment gasta un dipòsit de 60 L de gasoil en aquests recorreguts i té un consum mitjà",
      "de 5,6 L/(100 km). Quina és la petjada de carboni que deixarà a l’atmosfera en una setmana?",
      "Amb quines unitats es pot expressar la potència elèctrica consumida en un instant deter-"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s2-e2",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Sistema digital de sentit d’un ascensor",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           El controlador d’un motor d’ascensor necessita un senyal que determini en quin sentit ha\n      de posar-se en marxa l’ascensor (per a pujar o baixar). Per a aconseguir això, es dissenya un\n      sistema digital on la sortida z pren valor 1 si l’ascensor ha de pujar i 0 en cas contrari.\n           El sistema té com a entrades 4 variables digitals (a, b, c, d) per a codificar la planta on\n      es troba l’ascensor i la planta on vol anar l’usuari de les quatre possibles: planta 0, planta 1,\n      planta 2 i planta 3. Les dues primeres entrades codifiquen, en numeració binària, la planta en\n      què es troba l’ascensor (per exemple, si es troba a la planta 3 els valors seran a = 1 i b = 1); les\n      altres dues entrades (c, d) codifiquen, de la mateixa manera, el número de la planta que l’usuari\n      selecciona.\n           Utilitzant les variables d’estat descrites, dissenyeu el sistema digital que permeti determi-\n      nar quan l’ascensor ha de moure’s en sentit ascendent. Per fer-ho:\n           a) Elaboreu la taula de veritat del sistema.\n                [1 punt]\n\n                    a        b   c   d   z\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu el diagrama de portes lògiques equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Elaboreu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu el diagrama de portes lògiques equivalent."
    ],
    "dades": [
      "El controlador d’un motor d’ascensor necessita un senyal que determini en quin sentit ha",
      "de posar-se en marxa l’ascensor (per a pujar o baixar). Per a aconseguir això, es dissenya un",
      "planta 2 i planta 3. Les dues primeres entrades codifiquen, en numeració binària, la planta en",
      "què es troba l’ascensor (per exemple, si es troba a la planta 3 els valors seran a = 1 i b = 1); les",
      "altres dues entrades (c, d) codifiquen, de la mateixa manera, el número de la planta que l’usuari",
      "nar quan l’ascensor ha de moure’s en sentit ascendent. Per fer-ho:"
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s2-e3",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 3",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Cicle energètic d’una rentadora",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           El cicle de funcionament d’una rentadora es pot dividir bàsicament en tres fases: renta-\n      da, esbandida i centrifugació. La primera fase concentra el percentatge de consum energètic\n      més elevat perquè escalfa l’aigua mitjançant una resistència. En un programa estàndard de\n      t = 1,5 h de durada, en els primers 30 min (fase de rentada) la potència mitjana consumida\n      és P1 = 2 000 W, mentre que les fases d’esbandida i centrifugació consumeixen, de mitjana,\n      P2 = 250 W. La rentadora es connecta a la xarxa a una tensió U = 230 V.\n           S’ha contractat una tarifa amb discriminació horària que determina el preu del kW · h\n      segons la franja horària en què es consumeix l’electricitat, tal com es mostra en la taula\n      següent:\n               Període        De dilluns a divendres     Caps de setmana i festius   Preu [€/(kW · h)]\n             Hores Vall               0h a 8h                    24 hores               0,216 951\n             Hores Plana       8 h a 10 h, 14 a 18 h,                                   0,292 728\n                                     22 h a 0 h\n             Hores Punta      10 h a 14 h, 18 h a 22 h                                  0,342 930\n           Es considera que s’utilitza el programa estàndard n = 10 vegades al mes.\n           Determineu:\n           a) L’energia consumida en un cicle de funcionament Econs.\n                [0,5 punts]\n\n           b) El percentatge d’energia consumida en la fase de rentada cr.\n                [0,5 punts]\n\nc) El cost de posar una rentadora en hores punta cpunta i en hores vall cvall.\n   [1 punt]\n\nd) L’estalvi anual ea que s’obtindrà si la rentadora sempre es posa en hores vall respecte\n   al cost de posar-la sempre en hores punta.\n   [0,5 punts]",
    "apartats": [
      "a) L’energia consumida en un cicle de funcionament Econs.",
      "b) El percentatge d’energia consumida en la fase de rentada cr.",
      "c) El cost de posar una rentadora en hores punta cpunta i en hores vall cvall.",
      "d) L’estalvi anual ea que s’obtindrà si la rentadora sempre es posa en hores vall respecte"
    ],
    "dades": [
      "da, esbandida i centrifugació. La primera fase concentra el percentatge de consum energètic",
      "més elevat perquè escalfa l’aigua mitjançant una resistència. En un programa estàndard de",
      "t = 1,5 h de durada, en els primers 30 min (fase de rentada) la potència mitjana consumida",
      "és P1 = 2 000 W, mentre que les fases d’esbandida i centrifugació consumeixen, de mitjana,",
      "P2 = 250 W. La rentadora es connecta a la xarxa a una tensió U = 230 V.",
      "S’ha contractat una tarifa amb discriminació horària que determina el preu del kW · h",
      "segons la franja horària en què es consumeix l’electricitat, tal com es mostra en la taula",
      "Període De dilluns a divendres Caps de setmana i festius Preu [€/(kW · h)]",
      "Hores Vall 0h a 8h 24 hores 0,216 951",
      "Es considera que s’utilitza el programa estàndard n = 10 vegades al mes.",
      "Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s2-e4",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 4",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Volant d’inèrcia",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Un volant amb un moment d’inèrcia al voltant del seu eix I = 0,9 kg · m2 gira a\n      n0 = 5 000 min–1 gràcies a l’acció d’un motor. Es desconnecta el motor i s’observa que el volant\n      triga t = 1 min a quedar-se en repòs a causa d’un parell de fricció que se suposa constant.\n      Determineu:\n           a) L’acceleració angular del volant α.\n                [0,5 punts]\n\n           b) El nombre de voltes n que farà el volant abans d’aturar-se.\n                [1 punt]\n\nc) L’energia mecànica dissipada en aquest procés Ediss.\n   [1 punt]",
    "apartats": [
      "a) L’acceleració angular del volant α.",
      "b) El nombre de voltes n que farà el volant abans d’aturar-se.",
      "c) L’energia mecànica dissipada en aquest procés Ediss."
    ],
    "dades": [
      "Un volant amb un moment d’inèrcia al voltant del seu eix I = 0,9 kg · m2 gira a",
      "n0 = 5 000 min–1 gràcies a l’acció d’un motor. Es desconnecta el motor i s’observa que el volant",
      "triga t = 1 min a quedar-se en repòs a causa d’un parell de fricció que se suposa constant.",
      "Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2022-s2-e5",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 5",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "m = 50 kg L=1m d = 450 mm α tambor g A L L ϕ O d El sistema de la figura permet manipular un…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n\n                                 m = 50 kg\n                                 L=1m\n                                 d = 450 mm\n\n                                                  α                 tambor\n                                 g      A     L\n\n                                                          L\n                                                      ϕ\n                                                              O                 d\n\n              El sistema de la figura permet manipular una barra de longitud 2L mitjançant un motor\n         que s’uneix a un tambor de diàmetre d = 450 mm on s’enrotlla el cable. La barra, que és\n         homogènia i té una massa m = 50 kg, es troba articulada al punt O, el qual està fixat a terra.\n         La resta d’elements són de massa negligible. En la posició mostrada en la figura, el sistema\n         està en equilibri estàtic i α = φ = 30°.\n              a) Dibuixeu el diagrama de cos lliure de la barra OA.\n                   [0,5 punts]\n\n              Determineu:\n              b) La força T a la qual està sotmès el cable.\n                   [0,5 punts]\n\nc) Les forces vertical FV i horitzontal FH a l’articulació O.\n   [1 punt]\n\nd) El parell Γ que subministra el motor.\n   [0,5 punts]",
    "apartats": [
      "a) Dibuixeu el diagrama de cos lliure de la barra OA.",
      "b) La força T a la qual està sotmès el cable.",
      "c) Les forces vertical FV i horitzontal FH a l’articulació O.",
      "d) El parell Γ que subministra el motor."
    ],
    "dades": [
      "m = 50 kg",
      "L=1m",
      "d = 450 mm",
      "g A L",
      "El sistema de la figura permet manipular una barra de longitud 2L mitjançant un motor",
      "que s’uneix a un tambor de diàmetre d = 450 mm on s’enrotlla el cable. La barra, que és",
      "homogènia i té una massa m = 50 kg, es troba articulada al punt O, el qual està fixat a terra.",
      "La resta d’elements són de massa negligible. En la posició mostrada en la figura, el sistema",
      "està en equilibri estàtic i α = φ = 30°.",
      "Determineu:"
    ],
    "formules": [
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2022-s2-e6",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 6",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Circuit elèctric amb resistències",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n             Un circuit elèctric està format per quatre resistències. Les tres primeres, de valor\n         R1 = R2 = R3 = 20 Ω, estan connectades en sèrie, i la quarta, de valor R4 = 100 Ω, es connecta en\n         paraŀlel al conjunt anterior. El circuit s’alimenta entre els extrems de R4 a una tensió sinusoi-\n         dal U = 230 V.\n             a) Dibuixeu l’esquema elèctric del circuit.\n                   [0,5 punts]\n\n              Determineu:\n              b) El valor de la resistència equivalent total Req.\n                   [1 punt]\n\nc) Els valors de la intensitat I i la potència P consumides pel circuit elèctric.\n   [1 punt]",
    "apartats": [
      "a) Dibuixeu l’esquema elèctric del circuit.",
      "b) El valor de la resistència equivalent total Req.",
      "c) Els valors de la intensitat I i la potència P consumides pel circuit elèctric."
    ],
    "dades": [
      "Un circuit elèctric està format per quatre resistències. Les tres primeres, de valor",
      "R1 = R2 = R3 = 20 Ω, estan connectades en sèrie, i la quarta, de valor R4 = 100 Ω, es connecta en",
      "dal U = 230 V.",
      "Determineu:"
    ],
    "formules": [
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "ohm"
  },
  {
    "id": "full-tec2022-s5-e1",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n      que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n      [2,5 punts]\n      [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n      qüestió no contestada: 0 punts.]\n\n      Qüestió 1\n           La resistència a la tracció d’un aliatge de titani és de 325 MPa. Si es vol utilitzar una barra\n      cilíndrica d’aquest material per a aguantar una força de tracció de 20 kN, quin diàmetre\n      mínim ha de tenir la barra perquè no es trenqui?\n           a) 6,154 mm\n           b) 14,38 mm\n           c) 8,852 mm\n           d) 6,259 mm\n\n      Qüestió 2\n         Si es té un ajust 90 H7/k6, la tolerància H7 del forat és de                                   i la tolerància k6\n\n      de l’eix és de               , es pot afirmar que\n\n           a) el joc màxim és de 35 μm.\n           b) el joc màxim és de 32 μm.\n           c) el serratge màxim és de 3 μm.\n           d) el serratge màxim és de 32 μm.\n\n      Qüestió 3\n           Un complex poliesportiu té un consum tèrmic de 382,8 MW h anuals, que es cobreixen\n      inicialment amb una caldera que utilitza gas natural (de poder calorífic 11,79 kW h/m3). El\n      factor d’emissió del gas natural és de 2,15 kg CO2/m3. Es decideix fer una instaŀlació d’energia\n      solar tèrmica per a l’obtenció d’aigua calenta sanitària i per a la climatització de la piscina\n      coberta que representa una producció de 79 MW h/any. Quin és l’estalvi d’emissions anuals\n      que generarà el complex poliesportiu?\n           a) 14,41 tones de CO2\n           b) 69,81 tones de CO2\n           c) 55,40 tones de CO2\n           d) 20,03 tones de CO2\n\nQüestió 4                                                                                            g\n    Un sòlid de massa m = 5 kg està unit mitjançant un cable al centre d’una R1\npolitja mòbil de radi R2 = 50 mm. Una corda ideal passa per una politja de\nradi R1 = 100 mm articulada al sostre i després per la politja mòbil fins que\ns’uneix al centre de la politja fixa. A l’extrem d’aquesta corda s’aplica una                   R2\nforça F. Quina ha de ser aquesta força F per a mantenir el conjunt en repòs? F\n    a) 49,04 N                                                                              m\n    b) 12,25 N\n    c) 6,129 N\n    d) 24,52 N\n\nQüestió 5\n    S’utilitzen 500 g de carbó de poder calorífic 23,6 MJ/kg per a escalfar 100 L d’aigua. Quin\nincrement de temperatura es produirà? La calor específica de l’aigua és ce = 4,18 J/(g °C).\n    a) 28,23 °C\n    b) 2,823 °C\n    c) 282,3 °C\n    d) 49,32 °C\n\nTaula de respostes:\n\n    Espai de resposta per a l’alumne/a                               Espai per al corrector/a\n\nQüestió 1    a        b      c      d                           Puntuació de la qüestió 1\n\nQüestió 2    a        b      c      d                           Puntuació de la qüestió 2\n\nQüestió 3    a        b      c      d                           Puntuació de la qüestió 3\n\nQüestió 4    a        b      c      d                           Puntuació de la qüestió 4\n\nQüestió 5    a        b      c      d                           Puntuació de la qüestió 5\n                                                                Total de l’exercici 1",
    "apartats": [
      "a) 6,154 mm",
      "b) 14,38 mm",
      "c) 8,852 mm",
      "d) 6,259 mm",
      "a) el joc màxim és de 35 μm.",
      "b) el joc màxim és de 32 μm.",
      "c) el serratge màxim és de 3 μm.",
      "d) el serratge màxim és de 32 μm.",
      "a) 14,41 tones de CO2",
      "b) 69,81 tones de CO2",
      "c) 55,40 tones de CO2",
      "d) 20,03 tones de CO2",
      "a) 49,04 N m",
      "b) 12,25 N",
      "c) 6,129 N",
      "d) 24,52 N",
      "a) 28,23 °C",
      "b) 2,823 °C",
      "c) 282,3 °C",
      "d) 49,32 °C"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "La resistència a la tracció d’un aliatge de titani és de 325 MPa. Si es vol utilitzar una barra",
      "cilíndrica d’aquest material per a aguantar una força de tracció de 20 kN, quin diàmetre",
      "mínim ha de tenir la barra perquè no es trenqui?",
      "Un complex poliesportiu té un consum tèrmic de 382,8 MW h anuals, que es cobreixen",
      "inicialment amb una caldera que utilitza gas natural (de poder calorífic 11,79 kW h/m3). El",
      "factor d’emissió del gas natural és de 2,15 kg CO2/m3. Es decideix fer una instaŀlació d’energia",
      "coberta que representa una producció de 79 MW h/any. Quin és l’estalvi d’emissions anuals",
      "Un sòlid de massa m = 5 kg està unit mitjançant un cable al centre d’una R1",
      "politja mòbil de radi R2 = 50 mm. Una corda ideal passa per una politja de",
      "radi R1 = 100 mm articulada al sostre i després per la politja mòbil fins que",
      "s’uneix al centre de la politja fixa. A l’extrem d’aquesta corda s’aplica una R2"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s5-e2",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Un circuit combinacional de quatre entrades rep números del 0 al 15 expressats en base 2 (en…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Un circuit combinacional de quatre entrades rep números del 0 al 15 expressats en base 2\n      (en sistema binari). La sortida encén un led quan el número és 0 o un múltiple de 4. Responeu\n      a les qüestions que hi ha a continuació utilitzant les variables d’estat següents:\n\n                                                 {\n      primer dígit (el de més a l’esquerra): a = 1 ;\n\n                       0     {               {                  {\n      segon dígit: b = 1 ; tercer dígit: c = 1 ; quart dígit: d = 1 ;\n                                             0                    0\n\n               {\n      led: l = 1: actiu .\n               0: no actiu\n           a) Escriviu la taula de veritat del sistema.\n                [1 punt]\n\n                    a        b   c   d   l\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu l’esquema de contactes equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Escriviu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu l’esquema de contactes equivalent."
    ],
    "dades": [
      "(en sistema binari). La sortida encén un led quan el número és 0 o un múltiple de 4. Responeu",
      "primer dígit (el de més a l’esquerra): a = 1 ;",
      "segon dígit: b = 1 ; tercer dígit: c = 1 ; quart dígit: d = 1 ;",
      "led: l = 1: actiu ."
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s5-e3",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Una persona, per motius de feina, fa un trajecte diari per carretera dextraurbà = 120 km i p…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Una persona, per motius de feina, fa un trajecte diari per carretera dextraurbà = 120 km i\n      per vies urbanes durbà = 10 km. El recorregut el fa 280 dies l’any. Aquesta persona es planteja\n      l’opció d’adquirir un cotxe elèctric o un de gasoil. Les característiques dels possibles vehicles\n      es resumeixen en la taula següent:\n                                                  Vehicle elèctric                              Vehicle de gasoil\n      Adquisició del vehicle   cv_elèctr = 25 700 €                         cv_gas = 18 000 €\n      Factor d’emissions       FEelèctr = 241 g CO2/(kW h) (mix elèctric)   FEgas = 2,87 kg CO2/L\n      Preu energia             pelèctr = 0,14 €/(kW h)                      pgas = 1,209 €/L\n                                                                            cgas_urbà = 4,4 L/(100 km) (en vies urbanes)\n      Consum                   celèctr = 13,3 kW h/(100 km)                 cgas_extraurbà = 3,6 L/(100 km) (en vies extraurbanes)\n\n           Determineu:\n           a) Les emissions diàries equivalents de CO2 que es produirien amb cada vehicle melèctr i\n              mgas.\n                [1 punt]\n\nb) El cost diari associat al consum d’energia de cada vehicle cdelèctr i cdgas.\n   [0,5 punts]\n\nc) Si la persona decideix adquirir el vehicle elèctric, i considerant que el cost anual de\n   manteniment dels dos vehicles és el mateix, quants anys t tardarà a recuperar el sobre-\n   cost d’adquisició?\n   [1 punt]",
    "apartats": [
      "a) Les emissions diàries equivalents de CO2 que es produirien amb cada vehicle melèctr i mgas.",
      "b) El cost diari associat al consum d’energia de cada vehicle cdelèctr i cdgas.",
      "c) Si la persona decideix adquirir el vehicle elèctric, i considerant que el cost anual de"
    ],
    "dades": [
      "Una persona, per motius de feina, fa un trajecte diari per carretera dextraurbà = 120 km i",
      "per vies urbanes durbà = 10 km. El recorregut el fa 280 dies l’any. Aquesta persona es planteja",
      "l’opció d’adquirir un cotxe elèctric o un de gasoil. Les característiques dels possibles vehicles",
      "Vehicle elèctric Vehicle de gasoil",
      "Adquisició del vehicle cv_elèctr = 25 700 € cv_gas = 18 000 €",
      "Factor d’emissions FEelèctr = 241 g CO2/(kW h) (mix elèctric) FEgas = 2,87 kg CO2/L",
      "Preu energia pelèctr = 0,14 €/(kW h) pgas = 1,209 €/L",
      "cgas_urbà = 4,4 L/(100 km) (en vies urbanes)",
      "Consum celèctr = 13,3 kW h/(100 km) cgas_extraurbà = 3,6 L/(100 km) (en vies extraurbanes)",
      "Determineu:",
      "manteniment dels dos vehicles és el mateix, quants anys t tardarà a recuperar el sobre-"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s5-e4",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Es vol escalfar un volum V = 350 mL d’aigua des d’una temperatura inicial T1 = 20 °C fins a…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           Es vol escalfar un volum V = 350 mL d’aigua des d’una temperatura inicial T1 = 20 °C fins\n      a una de final T2 = 95 °C. Es proposen dues alternatives:\n           — \u0007Utilitzar un escalfador d’aigua per a infusions que consumeix Pescalf = 1 200 W i que\n               triga tescalf = 125 s. Aquest sistema utilitza una resistència submergible.\n           — \u0007Fer servir un fogó d’una vitroceràmica que consumeix Evitro = 0,11 kW h.\n           Ambdós sistemes estan connectats a la xarxa elèctrica amb U = 230 V. La calor específica\n      de l’aigua és ce = 4,18 J/(g °C). Determineu:\n           a) L’energia teòrica necessària per a escalfar l’aigua Eaigua.\n                [0,5 punts]\n\n           b) La resistència R que l’escalfador d’aigua té al seu interior.\n                [0,5 punts]\n\nc) L’energia consumida per l’escalfador Econs.\n   [0,5 punts]\n\nd) El rendiment de l’escalfador ηescalf i el de la vitroceràmica ηvitro. Quina alternativa esco-\n   lliríeu?\n   [1 punt]",
    "apartats": [
      "a) L’energia teòrica necessària per a escalfar l’aigua Eaigua.",
      "b) La resistència R que l’escalfador d’aigua té al seu interior.",
      "c) L’energia consumida per l’escalfador Econs.",
      "d) El rendiment de l’escalfador ηescalf i el de la vitroceràmica ηvitro. Quina alternativa esco-"
    ],
    "dades": [
      "Es vol escalfar un volum V = 350 mL d’aigua des d’una temperatura inicial T1 = 20 °C fins",
      "a una de final T2 = 95 °C. Es proposen dues alternatives:",
      "— \u0007Utilitzar un escalfador d’aigua per a infusions que consumeix Pescalf = 1 200 W i que",
      "triga tescalf = 125 s. Aquest sistema utilitza una resistència submergible.",
      "— \u0007Fer servir un fogó d’una vitroceràmica que consumeix Evitro = 0,11 kW h.",
      "Ambdós sistemes estan connectats a la xarxa elèctrica amb U = 230 V. La calor específica",
      "de l’aigua és ce = 4,18 J/(g °C). Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s5-e5",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "2s [2,5 punts en total] El mecanisme de la figura s’utilitza per a elevar g m = 3 kg la port…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "2s\n         [2,5 punts en total]\n              El mecanisme de la figura s’utilitza per a elevar       g                     m = 3 kg\n         la porta d’un armari. Les dues barres de longitud                                  LAO = 2L\n         LAO = LBQ = 2L són de massa negligible i estan articulades                         LBQ = 2L\n         a la paret i a la porta. La porta és homogènia i de massa                          L = 50 mm\n         m = 3 kg. Té una longitud de 8L i un gruix de 2s. Les                              s = 30 mm\n         barres varien l’angle respecte de la vertical entre φ = 5°       8L\n         (porta tancada) i φ = 175° (porta oberta). Per elevar la\n         porta, una persona fa una força vertical F al punt P. Es                                 O\n         negligeixen les resistències passives.\n                                                                                                        L\n              a) Dibuixeu el diagrama de cos lliure de la porta per                     A         Q\n                 a un angle φ qualsevol dins del rang de funciona-\n                 ment.                                                         P        B     ϕ\n                   [0,5 punts]\n                                                                               F\n\nConsiderant que la porta està en repòs, determineu:\nb) El valor de la força F aplicada.\n   [1 punt]\n\nc) El valor de les forces TAO i TBQ que les barres fan sobre la porta quan φ = 30°.\n   [1 punt]",
    "apartats": [
      "a) Dibuixeu el diagrama de cos lliure de la porta per A Q a un angle φ qualsevol dins del rang de funciona-",
      "b) El valor de la força F aplicada.",
      "c) El valor de les forces TAO i TBQ que les barres fan sobre la porta quan φ = 30°."
    ],
    "dades": [
      "El mecanisme de la figura s’utilitza per a elevar g m = 3 kg",
      "la porta d’un armari. Les dues barres de longitud LAO = 2L",
      "LAO = LBQ = 2L són de massa negligible i estan articulades LBQ = 2L",
      "a la paret i a la porta. La porta és homogènia i de massa L = 50 mm",
      "m = 3 kg. Té una longitud de 8L i un gruix de 2s. Les s = 30 mm",
      "barres varien l’angle respecte de la vertical entre φ = 5° 8L",
      "(porta tancada) i φ = 175° (porta oberta). Per elevar la",
      "Considerant que la porta està en repòs, determineu:"
    ],
    "formules": [
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2022-s5-e6",
    "any": 2022,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motocicleta elèctrica",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n             Un prototip de motocicleta elèctrica integra el motor directament a la roda del darrere.\n         En les condicions d’estudi, circulant per un terreny horitzontal i a una velocitat constant, el\n         fabricant assegura que el motor subministra Pmot = 15 kW i un parell Γ = 150 N m, i té una\n         autonomia màxima smàx = 200 km. El diàmetre dels pneumàtics és d = 630 mm, i s’estima que\n         el motor té un rendiment ηmot = 0,9. La motocicleta utilitza bateries ideals.\n             En aquestes condicions, determineu:\n             a) La velocitat angular de la roda motriu ωroda i la velocitat d’avanç v de la motocicleta.\n                   [1 punt]\n\nb) El temps màxim de funcionament tmàx i l’energia subministrada pel motor Esubm.\n   [1 punt]\n\nc) L’energia que caldria tenir emmagatzemada a les bateries Ebat.\n   [0,5 punts]",
    "apartats": [
      "a) La velocitat angular de la roda motriu ωroda i la velocitat d’avanç v de la motocicleta.",
      "b) El temps màxim de funcionament tmàx i l’energia subministrada pel motor Esubm.",
      "c) L’energia que caldria tenir emmagatzemada a les bateries Ebat."
    ],
    "dades": [
      "Un prototip de motocicleta elèctrica integra el motor directament a la roda del darrere.",
      "fabricant assegura que el motor subministra Pmot = 15 kW i un parell Γ = 150 N m, i té una",
      "autonomia màxima smàx = 200 km. El diàmetre dels pneumàtics és d = 630 mm, i s’estima que",
      "el motor té un rendiment ηmot = 0,9. La motocicleta utilitza bateries ideals.",
      "En aquestes condicions, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s2-e1",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n    que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n    [2,5 punts]\n    [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n    qüestió no contestada: 0 punts.]\n\n    Qüestió 1\n        Es disposa d’una barra d’acer amb una longitud inicial L = 800 mm a 20 °C. El coeficient\n    de dilatació lineal de l’acer és α = 13 × 10–6 °C–1. Quina serà la longitud final quan la tempera-\n    tura hagi incrementat 400 °C?\n        a) 804,16 mm\n        b) 803,95 mm\n        c) 800,01 mm\n        d) 800,30 mm\n\n    Qüestió 2\n        Quina és la velocitat de rotació d’un cargol de pas (avanç per volta) p = 2 mm que té una\n    velocitat d’avanç de 15 mm/s?\n        a) 480 min–1\n        b) 7,5 min–1\n        c) 450 min–1\n        d) 8 min–1\n\n    Qüestió 3\n         Un trajecte interurbà circular d’autobús té una longitud de 12 km i un total de 6 para-\n    des. La freqüència de pas de l’autobús és de 15 minuts durant 12 hores al dia, 270 dies l’any.\n    L’Oficina Catalana del Canvi Climàtic estima un factor d’emissió FE = 1 155,52 g de CO2/km\n    per a aquest tipus d’autobús. Quina petjada de carboni deixa l’autobús al cap de l’any?\n         a) 11,23 tones de CO2\n         b) 179,71 tones de CO2\n         c) 6,739 tones de CO2\n         d) 242,94 tones de CO2\n\nQüestió 4\n    Un bloc de massa m = 3 kg està unit mitjançant un cable al centre\nd’una politja de radi R1 = 300 mm. Una corda ideal subjectada al sostre\npassa per la politja de la qual penja el bloc, i per una altra politja de radi\nR2 = 150 mm articulada al sostre pel seu punt mitjà. Quina força F cal fer\nper a mantenir el bloc en repòs?\n    a) 14,71 N\n    b) 29,42 N\n    c) 7,355 N\n    d) 3,678 N\n\nQüestió 5\n     Una bombona de gas butà conté 12,5 kg d’aquest gas en estat líquid a una pressió de\n303 kPa quan es troba a 20 °C. Aquestes bombones estan dissenyades perquè, si la pressió\narriba a 2 634 kPa, salti la vàlvula de seguretat i surti el gas de l’interior. La bombona s’escalfa\nfins a 600 °C. Considerant el butà un gas ideal, es pot afirmar que\n     a) la bombona explotarà.\n     b) es dispararà la vàlvula de seguretat.\n     c) la pressió augmentarà fins a 902,8 kPa.\n     d) la pressió a l’interior de la bombona no canviarà.\n\nTaula de respostes:\n\n     Espai de resposta per a l’alumne/a                                  Espai per al corrector/a\n\nQüestió 1     a       b       c      d                              Puntuació de la qüestió 1\n\nQüestió 2     a       b       c      d                              Puntuació de la qüestió 2\n\nQüestió 3     a       b       c      d                              Puntuació de la qüestió 3\n\nQüestió 4     a       b       c      d                              Puntuació de la qüestió 4\n\nQüestió 5     a       b       c      d                              Puntuació de la qüestió 5\n                                                                    Total de l’exercici 1",
    "apartats": [
      "a) 804,16 mm",
      "b) 803,95 mm",
      "c) 800,01 mm",
      "d) 800,30 mm",
      "a) 480 min–1",
      "b) 7,5 min–1",
      "c) 450 min–1",
      "d) 8 min–1",
      "a) 11,23 tones de CO2",
      "b) 179,71 tones de CO2",
      "c) 6,739 tones de CO2",
      "d) 242,94 tones de CO2",
      "a) 14,71 N",
      "b) 29,42 N",
      "c) 7,355 N",
      "d) 3,678 N",
      "a) la bombona explotarà.",
      "b) es dispararà la vàlvula de seguretat.",
      "c) la pressió augmentarà fins a 902,8 kPa.",
      "d) la pressió a l’interior de la bombona no canviarà."
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Es disposa d’una barra d’acer amb una longitud inicial L = 800 mm a 20 °C. El coeficient",
      "de dilatació lineal de l’acer és α = 13 × 10–6 °C–1. Quina serà la longitud final quan la tempera-",
      "tura hagi incrementat 400 °C?",
      "Quina és la velocitat de rotació d’un cargol de pas (avanç per volta) p = 2 mm que té una",
      "velocitat d’avanç de 15 mm/s?",
      "des. La freqüència de pas de l’autobús és de 15 minuts durant 12 hores al dia, 270 dies l’any.",
      "L’Oficina Catalana del Canvi Climàtic estima un factor d’emissió FE = 1 155,52 g de CO2/km",
      "Un bloc de massa m = 3 kg està unit mitjançant un cable al centre",
      "d’una politja de radi R1 = 300 mm. Una corda ideal subjectada al sostre",
      "R2 = 150 mm articulada al sostre pel seu punt mitjà. Quina força F cal fer",
      "per a mantenir el bloc en repòs?"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s2-e2",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "En una línia de producció hi ha una estació de treball on es realitzen operacions de tallat.",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         En una línia de producció hi ha una estació de treball on es realitzen operacions de tallat.\n    El sistema de seguretat vol evitar que l’operari es trobi prop de l’eina de tall; amb aquesta\n    finalitat, s’han instaŀlat quatre polsadors: dos de situats a mitja altura (que s’accionen amb\n    les mans) i dos de situats al terra (que s’accionen amb els peus). Per a realitzar l’operació de\n    tallat, cal que l’operari premi a la vegada almenys un polsador de mitja altura amb la mà i un\n    del terra amb el peu. Responeu a les qüestions que hi ha a continuació utilitzant les variables\n    d’estat següents:\n\n                                              {\n    polsadors a mitja altura (de mà): m1 = 1: activat\n                                           0: no activat\n                                                         ; m2 =   {\n                                                                1: activat\n                                                                0: no activat\n                                                                              ;\n\n                                          {\n    polsadors al terra (de peu): p1 = 1: activat\n                                      0: no activat      {\n                                                    ; p2 =\n                                                           1: activat\n                                                           0: no activat\n                                                                         ;\n\n                                {\n    operació de tallat: t = 1: en marxa .\n                            0: aturada\n         a) Escriviu la taula de veritat del sistema.\n              [1 punt]\n\n                 m1        m2   p1   p2   t\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu l’esquema de portes lògiques equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Escriviu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu l’esquema de portes lògiques equivalent."
    ],
    "dades": [
      "finalitat, s’han instaŀlat quatre polsadors: dos de situats a mitja altura (que s’accionen amb",
      "les mans) i dos de situats al terra (que s’accionen amb els peus). Per a realitzar l’operació de",
      "tallat, cal que l’operari premi a la vegada almenys un polsador de mitja altura amb la mà i un",
      "polsadors a mitja altura (de mà): m1 = 1: activat",
      "; m2 = {",
      "polsadors al terra (de peu): p1 = 1: activat",
      "; p2 =",
      "operació de tallat: t = 1: en marxa .",
      "m1 m2 p1 p2 t"
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s2-e3",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 3",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Bombo de maceració amb reductor i corretja",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         Un bombo de maceració serveix per a barrejar la carn\n    amb els productes que la conserven. Per a fer-lo funcionar, es\n    fa girar el bombo (1) al voltant d’un eix horitzontal per mitjà\n    d’una corretja (2) accionada per un motor reductor (3).\n         El motor subministra una potència Pmot = 0,55 kW i gira\n    a nmot = 1 415 min–1. El reductor té un rendiment ηred = 0,96 i\n    una relació de transmissió τ = ωred/ωmot = 68,9 × 10–3. L’eix del\n    reductor fa girar la politja de diàmetre d = 63 mm, la qual,\n    mitjançant una corretja ideal que no llisca, fa girar la segona\n    politja de diàmetre D = 500 mm. L’eix d’aquesta última politja es connecta directament al\n    bombo de maceració. Determineu:\n         a) El parell a l’eix del motor Γmot.\n              [0,5 punts]\n\n         b) El parell a l’eix de sortida del reductor Γred.\n              [0,5 punts]\n\nc) La velocitat de gir de la politja petita nd en min–1.\n   [0,5 punts]\n\nd) La velocitat de gir del bombo nbombo en min–1.\n   [0,5 punts]\n\ne) El parell a l’eix del bombo Γbombo.\n   [0,5 punts]",
    "apartats": [
      "a) El parell a l’eix del motor Γmot.",
      "b) El parell a l’eix de sortida del reductor Γred.",
      "c) La velocitat de gir de la politja petita nd en min–1.",
      "d) La velocitat de gir del bombo nbombo en min–1.",
      "e) El parell a l’eix del bombo Γbombo."
    ],
    "dades": [
      "Un bombo de maceració serveix per a barrejar la carn",
      "fa girar el bombo (1) al voltant d’un eix horitzontal per mitjà",
      "d’una corretja (2) accionada per un motor reductor (3).",
      "El motor subministra una potència Pmot = 0,55 kW i gira",
      "a nmot = 1 415 min–1. El reductor té un rendiment ηred = 0,96 i",
      "una relació de transmissió τ = ωred/ωmot = 68,9 × 10–3. L’eix del",
      "reductor fa girar la politja de diàmetre d = 63 mm, la qual,",
      "politja de diàmetre D = 500 mm. L’eix d’aquesta última politja es connecta directament al",
      "bombo de maceració. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s2-e4",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 4",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Plaques solars i estalvi d’emissions",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         L’Ajuntament d’un poble ha aprovat un pla de millora energètica i ambiental que\n    inclou la instaŀlació de conjunts de plaques solars fotovoltaiques en un dels edificis muni-\n    cipals amb la finalitat de cobrir un r = 15 % de la demanda d’electricitat. La potència total\n    instaŀlada en aquest edifici és Pinst = 30 kW i s’estima un consum mitjà c = 75 % durant\n    t = 12 h/dia. El factor d’emissió de la comercialitzadora elèctrica és FE = 241 g CO2/(kW h).\n    L’Ajuntament ha escollit una placa que té una àrea efectiva A = 1,45 m2 i que, en condicions\n    normals (és a dir, a 20 °C i amb una intensitat de radiació solar Irad = 1 000 W/m2) submi-\n    nistra una potència Pplaca = 194 W. Determineu:\n         a) L’energia total consumida Econs en un any a l’edifici municipal.\n              [0,5 punts]\n\n         b) La potència Pfoto que ha de subministrar la instaŀlació fotovoltaica.\n              [0,5 punts]\n\nc) El rendiment de la placa ηplaca.\n   [0,5 punts]\n\nd) El nombre mínim de plaques fotovoltaiques np necessari suposant condicions nor-\n   mals.\n   [0,5 punts]\n\ne) Les emissions de gasos amb efecte d’hivernacle (CO2) que s’evitaria emetre a l’atmos-\n   fera durant un any Δm.\n   [0,5 punts]",
    "apartats": [
      "a) L’energia total consumida Econs en un any a l’edifici municipal.",
      "b) La potència Pfoto que ha de subministrar la instaŀlació fotovoltaica.",
      "c) El rendiment de la placa ηplaca.",
      "d) El nombre mínim de plaques fotovoltaiques np necessari suposant condicions nor- mals.",
      "e) Les emissions de gasos amb efecte d’hivernacle (CO2) que s’evitaria emetre a l’atmos- fera durant un any Δm."
    ],
    "dades": [
      "L’Ajuntament d’un poble ha aprovat un pla de millora energètica i ambiental que",
      "inclou la instaŀlació de conjunts de plaques solars fotovoltaiques en un dels edificis muni-",
      "cipals amb la finalitat de cobrir un r = 15 % de la demanda d’electricitat. La potència total",
      "instaŀlada en aquest edifici és Pinst = 30 kW i s’estima un consum mitjà c = 75 % durant",
      "t = 12 h/dia. El factor d’emissió de la comercialitzadora elèctrica és FE = 241 g CO2/(kW h).",
      "L’Ajuntament ha escollit una placa que té una àrea efectiva A = 1,45 m2 i que, en condicions",
      "normals (és a dir, a 20 °C i amb una intensitat de radiació solar Irad = 1 000 W/m2) submi-",
      "nistra una potència Pplaca = 194 W. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s2-e5",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 5",
    "bloc": "Estàtica i estructures",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Una persona de massa m = 80 kg utilitza l’estructura de barres de la figura per a fer exerci…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Inclou figura o esquema al PDF original.",
    "enunciat": "[2,5 punts en total]\n         Una persona de massa m = 80 kg utilitza l’estructura de\n     barres de la figura per a fer exercicis de gimnàstica a casa.\n     L’estructura té articulacions a la paret pels punts O i S. La\n     barra QS està unida a la barra OP mitjançant una articulació.\n     En la situació d’estudi, la persona es penja del punt P (sense\n     que els peus toquin a terra) i s’hi manté en repòs.\n         a) Dibuixeu el diagrama de cos lliure de la barra OP.\n               [0,5 punts]\n\n          Determineu:\n          b) La força FQS a la qual està sotmesa la barra QS. A quin tipus d’esforç està sotmesa\n             aquesta barra?\n               [1 punt]\n\nc) Les forces horitzontal FH i vertical FV a l’articulació O.\n   [1 punt]",
    "apartats": [
      "a) Dibuixeu el diagrama de cos lliure de la barra OP.",
      "b) La força FQS a la qual està sotmesa la barra QS. A quin tipus d’esforç està sotmesa aquesta barra?",
      "c) Les forces horitzontal FH i vertical FV a l’articulació O."
    ],
    "dades": [
      "Una persona de massa m = 80 kg utilitza l’estructura de",
      "barres de la figura per a fer exercicis de gimnàstica a casa.",
      "L’estructura té articulacions a la paret pels punts O i S. La",
      "barra QS està unida a la barra OP mitjançant una articulació.",
      "que els peus toquin a terra) i s’hi manté en repòs.",
      "Determineu:",
      "aquesta barra?"
    ],
    "formules": [
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s2-e6",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 2",
    "exercici": "Exercici 6",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "S’utilitza un petit generador elèctric dièsel per a subministrar electricitat a llocs on no…",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n           S’utilitza un petit generador elèctric dièsel per a subministrar electricitat a llocs on no\n     arriba el corrent elèctric. El sistema es compon d’un motor dièsel (amb una velocitat de gir\n     del motor n = 3 000 min–1) i un alternador monofàsic units directament per un eix comú. El\n     gasoil utilitzat té un poder calorífic pc = 44,8 MJ/kg i una densitat ρgasoil = 0,85 kg/L. La potèn-\n     cia subministrada pel motor dièsel és Pmot = 7,457 kW, i la subministrada per l’alternador\n     Pelèctr = 5,5 kW. El sistema disposa d’un dipòsit de combustible de volum V = 14 L que garan-\n     teix t = 13 h d’autonomia en les condicions descrites. Determineu:\n           a) El rendiment de l’alternador ηalt.\n               [0,5 punts]\n\n          b) El consum del motor dièsel cgasoil en g/h.\n               [0,5 punts]\n\nc) El rendiment del motor ηmot.\n   [1 punt]\n\nd) La potència total dissipada Pdiss pel conjunt.\n   [0,5 punts]",
    "apartats": [
      "a) El rendiment de l’alternador ηalt.",
      "b) El consum del motor dièsel cgasoil en g/h.",
      "c) El rendiment del motor ηmot.",
      "d) La potència total dissipada Pdiss pel conjunt."
    ],
    "dades": [
      "S’utilitza un petit generador elèctric dièsel per a subministrar electricitat a llocs on no",
      "arriba el corrent elèctric. El sistema es compon d’un motor dièsel (amb una velocitat de gir",
      "del motor n = 3 000 min–1) i un alternador monofàsic units directament per un eix comú. El",
      "gasoil utilitzat té un poder calorífic pc = 44,8 MJ/kg i una densitat ρgasoil = 0,85 kg/L. La potèn-",
      "cia subministrada pel motor dièsel és Pmot = 7,457 kW, i la subministrada per l’alternador",
      "Pelèctr = 5,5 kW. El sistema disposa d’un dipòsit de combustible de volum V = 14 L que garan-",
      "teix t = 13 h d’autonomia en les condicions descrites. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s5-e1",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 1",
    "bloc": "Test PAU",
    "tipus": "test",
    "nivell": "N1-N2",
    "titol": "Qüestions curtes tipus test",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "Indiqueu la resposta correcta de cada qüestió. Responeu en la taula de la pàgina 3. En el cas\n    que no indiqueu les respostes a la taula, les qüestions es consideraran no contestades.\n    [2,5 punts]\n    [En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;\n    qüestió no contestada: 0 punts.]\n\n    Qüestió 1\n         Una proveta de níquel té una secció circular de 10 mm de diàmetre i una longitud de\n    120 mm. El mòdul elàstic del níquel és de 207 × 103 MPa, el seu límit elàstic és de 138 MPa i\n    la seva resistència al trencament és de 483 MPa. Es duu a terme un assaig de tracció aplicant\n    una força de 35 kN a la proveta. Un cop es deixi d’aplicar-hi la càrrega, es pot afirmar que la\n    proveta\n         a) s’haurà trencat.\n         b) s’haurà deformat plàsticament.\n         c) tornarà a la seva longitud inicial.\n         d) haurà augmentat de diàmetre.\n\n    Qüestió 2\n         En un circuit elèctric, es connecten en sèrie dues resistències de 12 Ω cadascuna i toleràn-\n    cies de ± 0,25 % i ± 1 %, respectivament. Tenint en compte aquesta informació, es pot afirmar\n    que la resistència equivalent\n         a) té un valor màxim de 24,24 Ω.\n         b) té un valor mínim de 23,85 Ω.\n         c) té un valor màxim de 24,3 Ω.\n         d) té un valor mínim de 23,82 Ω.\n\n    Qüestió 3\n        El conductor d’un cotxe pot decidir si utilitza com a combustible gasolina o gas liquat\n    del petroli (GLP). Quan fa servir gasolina consumeix 6,3 L/100 km i emet 149 g de CO2 per\n    kilòmetre recorregut, i quan fa servir GLP consumeix 7,0 L/100 km i emet 114 g de CO2\n    per kilòmetre recorregut. Segons el combustible utilitzat, quina és la diferència en la petjada\n    de carboni, expressada en grams de CO2 per litre de combustible?\n        a) 736,5 g/L\n        b) 2 365 g/L\n        c) 1 629 g/L\n        d) 3 994 g/L\n\nQüestió 4\n    El motor d’una motocicleta desenvolupa una potència efectiva màxima de 7,8 kW a\n7 750 min–1. Quin parell subministra en aquest moment?\n    a) 9,611 N m\n    b) 1,997 N m\n    c) 16,02 N m\n    d) 60,39 N m\n\nQüestió 5\n     Els aliatges crom-cobalt són molt utilitzats en les pròtesis dentals. En un aliatge amb un\n63 % de cobalt (Co), un 30 % de crom (Cr), un 5 % de molibdè (Mo) i la resta del percentatge\nd’altres components (Si, Mn, C), quina quantitat de Co es necessita si s’usen 17 g de Cr?\n     a) 56,6 g\n     b) 3,97 g\n     c) 35,7 g\n     d) 17,0 g\n\nTaula de respostes:\n\n    Espai de resposta per a l’alumne/a                               Espai per al corrector/a\n\nQüestió 1    a        b      c      d                           Puntuació de la qüestió 1\n\nQüestió 2    a        b      c      d                           Puntuació de la qüestió 2\n\nQüestió 3    a        b      c      d                           Puntuació de la qüestió 3\n\nQüestió 4    a        b      c      d                           Puntuació de la qüestió 4\n\nQüestió 5    a        b      c      d                           Puntuació de la qüestió 5\n                                                                Total de l’exercici 1",
    "apartats": [
      "a) s’haurà trencat.",
      "b) s’haurà deformat plàsticament.",
      "c) tornarà a la seva longitud inicial.",
      "d) haurà augmentat de diàmetre.",
      "a) té un valor màxim de 24,24 Ω.",
      "b) té un valor mínim de 23,85 Ω.",
      "c) té un valor màxim de 24,3 Ω.",
      "d) té un valor mínim de 23,82 Ω.",
      "a) 736,5 g/L",
      "b) 2 365 g/L",
      "c) 1 629 g/L",
      "d) 3 994 g/L",
      "a) 9,611 N m",
      "b) 1,997 N m",
      "c) 16,02 N m",
      "d) 60,39 N m",
      "a) 56,6 g",
      "b) 3,97 g",
      "c) 35,7 g",
      "d) 17,0 g"
    ],
    "dades": [
      "[En cada qüestió només es pot triar UNA resposta. Qüestió ben contestada: 0,5 punts; qüestió mal contestada: –0,16 punts;",
      "Una proveta de níquel té una secció circular de 10 mm de diàmetre i una longitud de",
      "120 mm. El mòdul elàstic del níquel és de 207 × 103 MPa, el seu límit elàstic és de 138 MPa i",
      "En un circuit elèctric, es connecten en sèrie dues resistències de 12 Ω cadascuna i toleràn-",
      "del petroli (GLP). Quan fa servir gasolina consumeix 6,3 L/100 km i emet 149 g de CO2 per",
      "kilòmetre recorregut, i quan fa servir GLP consumeix 7,0 L/100 km i emet 114 g de CO2",
      "de carboni, expressada en grams de CO2 per litre de combustible?",
      "El motor d’una motocicleta desenvolupa una potència efectiva màxima de 7,8 kW a",
      "7 750 min–1. Quin parell subministra en aquest moment?",
      "Els aliatges crom-cobalt són molt utilitzats en les pròtesis dentals. En un aliatge amb un",
      "63 % de cobalt (Co), un 30 % de crom (Cr), un 5 % de molibdè (Mo) i la resta del percentatge"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic",
      "ΔL = α·L0·ΔT",
      "Tolerància = límit superior − límit inferior",
      "Energia absorbida = energia inicial − energia final"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s5-e2",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 2",
    "bloc": "Lògica digital i control",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Portes d’emergència amb detectors",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n        El sistema d’obertura automàtica de portes d’emergència està format per tres detectors:\n    un detector de fum, un de temperatura i un de tensió elèctrica de la xarxa. La porta s’obre si\n    es detecta fum i un augment brusc de la temperatura, o si la tensió d’alimentació passa a ser\n    nuŀla. Responeu a les qüestions que hi ha a continuació utilitzant les variables d’estat següents:\n\n                               {\n    detector de fum: f = 1: detecció de fum\n                         0: no detecció de fum\n                                               ;\n\n                                           {\n    detector de temperatura: t = 1: augment brusc de temperatura\n                                 0: sense augment brusc de temperatura\n                                                                       ;\n\n                                               {\n    detector de tensió elèctrica: v = 1: tensió d’alimentació no nuŀla ;\n                                      0: tensió d’alimentació nuŀla\n\n                                   {\n    obertura de la porta: p = 1: porta oberta .\n                              0: porta tancada\n         a) Elaboreu la taula de veritat del sistema.\n              [1 punt]\n\n                  f        t   v       p\n\nb) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.\n   [1 punt]\n\nc) Dibuixeu l’esquema de contactes equivalent.\n   [0,5 punts]",
    "apartats": [
      "a) Elaboreu la taula de veritat del sistema.",
      "b) Determineu la funció lògica entre aquestes variables i, si escau, simplifiqueu-la.",
      "c) Dibuixeu l’esquema de contactes equivalent."
    ],
    "dades": [
      "un detector de fum, un de temperatura i un de tensió elèctrica de la xarxa. La porta s’obre si",
      "detector de fum: f = 1: detecció de fum",
      "detector de temperatura: t = 1: augment brusc de temperatura",
      "detector de tensió elèctrica: v = 1: tensió d’alimentació no nuŀla ;",
      "obertura de la porta: p = 1: porta oberta ."
    ],
    "formules": [
      "Taula de veritat",
      "Suma de productes",
      "Simplificació booleana",
      "Portes AND, OR i NOT",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s5-e3",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 3",
    "bloc": "Energia, rendiment i sostenibilitat",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Central de carbó i emissions",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         Una central de carbó té n = 3 grups de turbines de vapor amb una potència Pturb = 362 MW\n    cada un i utilitza carbó del tipus lignit amb un poder calorífic pc_c = 28 400 kJ/kg i una den-\n    sitat ρ = 1 050 kg/m3. La central està en funcionament les 24 hores del dia i té un rendiment\n    ηc = 0,236. Determineu:\n         a) L’energia diària consumida Econs que cal aportar a la central.\n              [1 punt]\n\n         b) La massa de carbó mc diària necessària perquè funcioni.\n              [0,5 punts]\n\n    S’estima que si la central treballés amb querosè (de poder calorífic pc_q = 43 400 kJ/kg)\nn’utilitzaria mq = 6 177 × 103 kg diaris i mantindria constant la potència subministrada per\ncada turbina. Determineu, en aquest cas:\n    c) El nou rendiment de la central ηq.\n       [1 punt]",
    "apartats": [
      "a) L’energia diària consumida Econs que cal aportar a la central.",
      "b) La massa de carbó mc diària necessària perquè funcioni.",
      "c) El nou rendiment de la central ηq."
    ],
    "dades": [
      "Una central de carbó té n = 3 grups de turbines de vapor amb una potència Pturb = 362 MW",
      "cada un i utilitza carbó del tipus lignit amb un poder calorífic pc_c = 28 400 kJ/kg i una den-",
      "sitat ρ = 1 050 kg/m3. La central està en funcionament les 24 hores del dia i té un rendiment",
      "ηc = 0,236. Determineu:",
      "S’estima que si la central treballés amb querosè (de poder calorífic pc_q = 43 400 kJ/kg)",
      "n’utilitzaria mq = 6 177 × 103 kg diaris i mantindria constant la potència subministrada per",
      "cada turbina. Determineu, en aquest cas:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  },
  {
    "id": "full-tec2021-s5-e4",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 4",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Motocicleta elèctrica",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n         Un motorista utilitza una moto elèctrica per a recórrer una distància s = 12 km per una\n    carretera de pendent ascendent i constant del 5 %. El recorregut es fa a velocitat constant i la\n    moto disposa d’una bateria d’energia Ebat = 1,53 kW h (la bateria té un comportament ideal).\n    La massa del conjunt format per la moto i el motorista és m = 130 kg. En aquesta situació, el\n    sistema té un rendiment ηglob = 0,9. Si les pèrdues causades pel rodolament i per l’aerodinàmi-\n    ca es poden negligir, determineu:\n         a) El desnivell de la carretera Δh.\n              [0,5 punts]\n\n         b) L’increment d’energia potencial ΔEp.\n              [0,5 punts]\n\n         c) L’energia de la bateria consumida Econs.\n              [0,5 punts]\n\n    Després de fer aquest recorregut, el motorista baixa per la mateixa carretera fent servir\núnicament el fre motor i així torna a carregar la bateria. En aquest cas, el procés de regene-\nració té un rendiment ηreg = 0,65. Si abans d’iniciar el recorregut de pujada la bateria estava al\n100 % de la seva capacitat, determineu:\n    d) El percentatge d’energia E% que queda a la bateria respecte de l’energia inicial després\n        de recórrer els 24 km.\n        [1 punt]",
    "apartats": [
      "a) El desnivell de la carretera Δh.",
      "b) L’increment d’energia potencial ΔEp.",
      "c) L’energia de la bateria consumida Econs.",
      "d) El percentatge d’energia E% que queda a la bateria respecte de l’energia inicial després"
    ],
    "dades": [
      "Un motorista utilitza una moto elèctrica per a recórrer una distància s = 12 km per una",
      "moto disposa d’una bateria d’energia Ebat = 1,53 kW h (la bateria té un comportament ideal).",
      "La massa del conjunt format per la moto i el motorista és m = 130 kg. En aquesta situació, el",
      "sistema té un rendiment ηglob = 0,9. Si les pèrdues causades pel rodolament i per l’aerodinàmi-",
      "ca es poden negligir, determineu:",
      "Després de fer aquest recorregut, el motorista baixa per la mateixa carretera fent servir",
      "únicament el fre motor i així torna a carregar la bateria. En aquest cas, el procés de regene-",
      "ració té un rendiment ηreg = 0,65. Si abans d’iniciar el recorregut de pujada la bateria estava al",
      "100 % de la seva capacitat, determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ",
      "ΣF = 0",
      "ΣM = 0",
      "Treball = força · desplaçament",
      "Avantatge mecànic"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s5-e5",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 5",
    "bloc": "Màquines, motors i mecanismes",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Dron amb motors i bateria",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n          Un dron utilitza una bateria de tensió U = 11,1 V amb una capacitat de càrrega de\n     c = 5 200 mA h. Es connecten a la bateria 4 motors en paraŀlel que tenen un rendiment indi-\n     vidual ηmotor = 0,89. Inicialment la bateria està totalment carregada. En unes determinades\n     condicions de vol els motors giren a n = 10 000 min–1 (dos en sentit horari i dos en sentit\n     antihorari) i cada motor subministra una potència Psubm = 30 W. L’energia acumulada en una\n     bateria ve donada per l’expressió Ebat = c · U. Determineu:\n          a) L’energia acumulada a la bateria Ebat.\n               [0,5 punts]\n\n          b) La potència consumida per cada motor Pcons.\n               [0,5 punts]\n\nc) L’energia consumida Econs i el temps t que el dron haurà estat en funcionament quan\n   la bateria s’hagi descarregat un 5 %.\n   [1 punt]\n\nd) El parell Γ a l’eix de cada motor.\n   [0,5 punts]",
    "apartats": [
      "a) L’energia acumulada a la bateria Ebat.",
      "b) La potència consumida per cada motor Pcons.",
      "c) L’energia consumida Econs i el temps t que el dron haurà estat en funcionament quan la bateria s’hagi descarregat un 5 %.",
      "d) El parell Γ a l’eix de cada motor."
    ],
    "dades": [
      "Un dron utilitza una bateria de tensió U = 11,1 V amb una capacitat de càrrega de",
      "c = 5 200 mA h. Es connecten a la bateria 4 motors en paraŀlel que tenen un rendiment indi-",
      "vidual ηmotor = 0,89. Inicialment la bateria està totalment carregada. En unes determinades",
      "condicions de vol els motors giren a n = 10 000 min–1 (dos en sentit horari i dos en sentit",
      "antihorari) i cada motor subministra una potència Psubm = 30 W. L’energia acumulada en una",
      "bateria ve donada per l’expressió Ebat = c · U. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "ω = 2πn/60",
      "P = Γ·ω",
      "η = Pu/Pa",
      "i = nentrada/nsortida",
      "v = ω·r",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades.",
    "enllac": "motor"
  },
  {
    "id": "full-tec2021-s5-e6",
    "any": 2021,
    "materia": "Tecnologia industrial",
    "serie": "Sèrie 5",
    "exercici": "Exercici 6",
    "bloc": "Electricitat i circuits",
    "tipus": "fitxa per parts",
    "nivell": "N2-N3",
    "titol": "Resistència d’un assecador de cabells",
    "resum": "Buidatge total v10: enunciat complet incorporat. Sense figura essencial detectada al text.",
    "enunciat": "[2,5 punts en total]\n          La resistència elèctrica d’un assecador de cabells R = 30 Ω és feta d’un fil conductor de\n     resistivitat ρ = 0,22 μΩ m i diàmetre d = 0,4 mm. L’assecador s’endolla a la xarxa de tensió\n     U = 230 V. Determineu:\n          a) La longitud L del fil conductor.\n               [0,5 punts]\n\n          b) La potència elèctrica Pelèctr que consumeix l’assecador.\n               [0,5 punts]\n\nc) L’energia elèctrica consumida Econs durant 10 minuts de funcionament.\n   [0,5 punts]\n\nd) El corrent I que circula per l’assecador.\n   [0,5 punts]\n\ne) La potència elèctrica P′elèctr si l’assecador s’alimentés a una tensió U′ = 110 V.\n   [0,5 punts]",
    "apartats": [
      "a) La longitud L del fil conductor.",
      "b) La potència elèctrica Pelèctr que consumeix l’assecador.",
      "c) L’energia elèctrica consumida Econs durant 10 minuts de funcionament.",
      "d) El corrent I que circula per l’assecador.",
      "e) La potència elèctrica P′elèctr si l’assecador s’alimentés a una tensió U′ = 110 V."
    ],
    "dades": [
      "La resistència elèctrica d’un assecador de cabells R = 30 Ω és feta d’un fil conductor de",
      "resistivitat ρ = 0,22 μΩ m i diàmetre d = 0,4 mm. L’assecador s’endolla a la xarxa de tensió",
      "U = 230 V. Determineu:"
    ],
    "formules": [
      "E = P·t",
      "Q = m·ce·ΔT",
      "η = Eu/Es",
      "Ecomb = m·pc",
      "Emissions = energia o distància · factor",
      "U = I·R",
      "P = U·I",
      "XL = 2πfL",
      "XC = 1/(2πfC)",
      "Z = R + jX",
      "P3φ = √3·U·I·cosφ"
    ],
    "pistes": [
      "Comença separant dades, unitats i magnituds demanades.",
      "No substitueixis valors fins que hagis triat la fórmula adequada.",
      "Revisa unitats i ordre de magnitud abans de donar el resultat."
    ],
    "errors": [
      "Copiar dades sense unitats.",
      "Barrejar segons, hores, minuts o mil·límetres sense convertir.",
      "Donar només el número final sense justificació tècnica."
    ],
    "resolucio": "Buidatge complet v10: enunciat i apartats incorporats. La resolució és orientativa per passos; els exercicis amb figura necessiten treball visual amb el PDF original o una futura versió amb imatges integrades."
  }
];
pauBank.push(...pauBankV10Full);

// v11: mapa de pàgines originals renderitzades com a imatge per a cada fitxa PAU.
// S'usen per integrar figures, esquemes, taules i gràfics que no queden ben capturats en el text.
const pauFiguresMap = {"full-tec2025-s1-e1": ["./assets/pau_pages/full-tec2025-s1-e1_p02.webp", "./assets/pau_pages/full-tec2025-s1-e1_p03.webp"], "tec2025-s1-e1": ["./assets/pau_pages/full-tec2025-s1-e1_p02.webp", "./assets/pau_pages/full-tec2025-s1-e1_p03.webp"], "full-tec2025-s1-e2": ["./assets/pau_pages/full-tec2025-s1-e2_p04.webp", "./assets/pau_pages/full-tec2025-s1-e2_p05.webp"], "tec2025-s1-e2": ["./assets/pau_pages/full-tec2025-s1-e2_p04.webp", "./assets/pau_pages/full-tec2025-s1-e2_p05.webp"], "full-tec2025-s1-e3": ["./assets/pau_pages/full-tec2025-s1-e3_p06.webp", "./assets/pau_pages/full-tec2025-s1-e3_p07.webp"], "tec2025-s1-e3": ["./assets/pau_pages/full-tec2025-s1-e3_p06.webp", "./assets/pau_pages/full-tec2025-s1-e3_p07.webp"], "full-tec2025-s1-e4": ["./assets/pau_pages/full-tec2025-s1-e4_p08.webp", "./assets/pau_pages/full-tec2025-s1-e4_p09.webp"], "tec2025-s1-e4": ["./assets/pau_pages/full-tec2025-s1-e4_p08.webp", "./assets/pau_pages/full-tec2025-s1-e4_p09.webp"], "full-elec2023-s1-e1": ["./assets/pau_pages/full-elec2023-s1-e1_p02.webp", "./assets/pau_pages/full-elec2023-s1-e1_p03.webp"], "elec2023-s1-e1": ["./assets/pau_pages/full-elec2023-s1-e1_p02.webp", "./assets/pau_pages/full-elec2023-s1-e1_p03.webp"], "full-elec2023-s1-e2": ["./assets/pau_pages/full-elec2023-s1-e2_p04.webp", "./assets/pau_pages/full-elec2023-s1-e2_p05.webp"], "elec2023-s1-e2": ["./assets/pau_pages/full-elec2023-s1-e2_p04.webp", "./assets/pau_pages/full-elec2023-s1-e2_p05.webp"], "full-elec2023-s1-e3": ["./assets/pau_pages/full-elec2023-s1-e3_p06.webp", "./assets/pau_pages/full-elec2023-s1-e3_p07.webp"], "elec2023-s1-e3": ["./assets/pau_pages/full-elec2023-s1-e3_p06.webp", "./assets/pau_pages/full-elec2023-s1-e3_p07.webp"], "full-elec2023-s1-e4": ["./assets/pau_pages/full-elec2023-s1-e4_p08.webp", "./assets/pau_pages/full-elec2023-s1-e4_p09.webp"], "elec2023-s1-e4": ["./assets/pau_pages/full-elec2023-s1-e4_p08.webp", "./assets/pau_pages/full-elec2023-s1-e4_p09.webp"], "full-elec2023-s1-e5": ["./assets/pau_pages/full-elec2023-s1-e5_p10.webp", "./assets/pau_pages/full-elec2023-s1-e5_p11.webp"], "elec2023-s1-e5": ["./assets/pau_pages/full-elec2023-s1-e5_p10.webp", "./assets/pau_pages/full-elec2023-s1-e5_p11.webp"], "full-elec2023-s1-e6": ["./assets/pau_pages/full-elec2023-s1-e6_p12.webp", "./assets/pau_pages/full-elec2023-s1-e6_p13.webp"], "elec2023-s1-e6": ["./assets/pau_pages/full-elec2023-s1-e6_p12.webp", "./assets/pau_pages/full-elec2023-s1-e6_p13.webp"], "full-elec2023-s5-e1": ["./assets/pau_pages/full-elec2023-s5-e1_p18.webp", "./assets/pau_pages/full-elec2023-s5-e1_p19.webp"], "elec2023-s5-e1": ["./assets/pau_pages/full-elec2023-s5-e1_p18.webp", "./assets/pau_pages/full-elec2023-s5-e1_p19.webp"], "full-elec2023-s5-e2": ["./assets/pau_pages/full-elec2023-s5-e2_p20.webp", "./assets/pau_pages/full-elec2023-s5-e2_p21.webp"], "elec2023-s5-e2": ["./assets/pau_pages/full-elec2023-s5-e2_p20.webp", "./assets/pau_pages/full-elec2023-s5-e2_p21.webp"], "full-elec2023-s5-e3": ["./assets/pau_pages/full-elec2023-s5-e3_p22.webp", "./assets/pau_pages/full-elec2023-s5-e3_p23.webp"], "elec2023-s5-e3": ["./assets/pau_pages/full-elec2023-s5-e3_p22.webp", "./assets/pau_pages/full-elec2023-s5-e3_p23.webp"], "full-elec2023-s5-e4": ["./assets/pau_pages/full-elec2023-s5-e4_p24.webp", "./assets/pau_pages/full-elec2023-s5-e4_p25.webp"], "elec2023-s5-e4": ["./assets/pau_pages/full-elec2023-s5-e4_p24.webp", "./assets/pau_pages/full-elec2023-s5-e4_p25.webp"], "full-elec2023-s5-e5": ["./assets/pau_pages/full-elec2023-s5-e5_p26.webp", "./assets/pau_pages/full-elec2023-s5-e5_p27.webp"], "elec2023-s5-e5": ["./assets/pau_pages/full-elec2023-s5-e5_p26.webp", "./assets/pau_pages/full-elec2023-s5-e5_p27.webp"], "full-elec2023-s5-e6": ["./assets/pau_pages/full-elec2023-s5-e6_p28.webp", "./assets/pau_pages/full-elec2023-s5-e6_p29.webp"], "elec2023-s5-e6": ["./assets/pau_pages/full-elec2023-s5-e6_p28.webp", "./assets/pau_pages/full-elec2023-s5-e6_p29.webp"], "full-tec2024-s1-e1": ["./assets/pau_pages/full-tec2024-s1-e1_p02.webp", "./assets/pau_pages/full-tec2024-s1-e1_p03.webp"], "tec2024-s1-e1": ["./assets/pau_pages/full-tec2024-s1-e1_p02.webp", "./assets/pau_pages/full-tec2024-s1-e1_p03.webp"], "full-tec2024-s1-e2": ["./assets/pau_pages/full-tec2024-s1-e2_p04.webp", "./assets/pau_pages/full-tec2024-s1-e2_p05.webp"], "tec2024-s1-e2": ["./assets/pau_pages/full-tec2024-s1-e2_p04.webp", "./assets/pau_pages/full-tec2024-s1-e2_p05.webp"], "full-tec2024-s1-e3": ["./assets/pau_pages/full-tec2024-s1-e3_p06.webp", "./assets/pau_pages/full-tec2024-s1-e3_p07.webp"], "tec2024-s1-e3": ["./assets/pau_pages/full-tec2024-s1-e3_p06.webp", "./assets/pau_pages/full-tec2024-s1-e3_p07.webp"], "full-tec2024-s1-e4": ["./assets/pau_pages/full-tec2024-s1-e4_p08.webp", "./assets/pau_pages/full-tec2024-s1-e4_p09.webp"], "tec2024-s1-e4": ["./assets/pau_pages/full-tec2024-s1-e4_p08.webp", "./assets/pau_pages/full-tec2024-s1-e4_p09.webp"], "full-tec2024-s1-e5": ["./assets/pau_pages/full-tec2024-s1-e5_p10.webp", "./assets/pau_pages/full-tec2024-s1-e5_p11.webp"], "tec2024-s1-e5": ["./assets/pau_pages/full-tec2024-s1-e5_p10.webp", "./assets/pau_pages/full-tec2024-s1-e5_p11.webp"], "full-tec2024-s1-e6": ["./assets/pau_pages/full-tec2024-s1-e6_p12.webp", "./assets/pau_pages/full-tec2024-s1-e6_p13.webp"], "tec2024-s1-e6": ["./assets/pau_pages/full-tec2024-s1-e6_p12.webp", "./assets/pau_pages/full-tec2024-s1-e6_p13.webp"], "full-tec2024-s5-e1": ["./assets/pau_pages/full-tec2024-s5-e1_p18.webp", "./assets/pau_pages/full-tec2024-s5-e1_p19.webp"], "tec2024-s5-e1": ["./assets/pau_pages/full-tec2024-s5-e1_p18.webp", "./assets/pau_pages/full-tec2024-s5-e1_p19.webp"], "full-tec2024-s5-e2": ["./assets/pau_pages/full-tec2024-s5-e2_p20.webp", "./assets/pau_pages/full-tec2024-s5-e2_p21.webp"], "tec2024-s5-e2": ["./assets/pau_pages/full-tec2024-s5-e2_p20.webp", "./assets/pau_pages/full-tec2024-s5-e2_p21.webp"], "full-tec2024-s5-e3": ["./assets/pau_pages/full-tec2024-s5-e3_p22.webp", "./assets/pau_pages/full-tec2024-s5-e3_p23.webp"], "tec2024-s5-e3": ["./assets/pau_pages/full-tec2024-s5-e3_p22.webp", "./assets/pau_pages/full-tec2024-s5-e3_p23.webp"], "full-tec2024-s5-e4": ["./assets/pau_pages/full-tec2024-s5-e4_p24.webp", "./assets/pau_pages/full-tec2024-s5-e4_p25.webp"], "tec2024-s5-e4": ["./assets/pau_pages/full-tec2024-s5-e4_p24.webp", "./assets/pau_pages/full-tec2024-s5-e4_p25.webp"], "full-tec2024-s5-e5": ["./assets/pau_pages/full-tec2024-s5-e5_p26.webp", "./assets/pau_pages/full-tec2024-s5-e5_p27.webp"], "tec2024-s5-e5": ["./assets/pau_pages/full-tec2024-s5-e5_p26.webp", "./assets/pau_pages/full-tec2024-s5-e5_p27.webp"], "full-tec2024-s5-e6": ["./assets/pau_pages/full-tec2024-s5-e6_p28.webp", "./assets/pau_pages/full-tec2024-s5-e6_p29.webp"], "tec2024-s5-e6": ["./assets/pau_pages/full-tec2024-s5-e6_p28.webp", "./assets/pau_pages/full-tec2024-s5-e6_p29.webp"], "full-tec2022-s2-e1": ["./assets/pau_pages/full-tec2022-s2-e1_p02.webp", "./assets/pau_pages/full-tec2022-s2-e1_p03.webp"], "tec2022-s2-e1": ["./assets/pau_pages/full-tec2022-s2-e1_p02.webp", "./assets/pau_pages/full-tec2022-s2-e1_p03.webp"], "full-tec2022-s2-e2": ["./assets/pau_pages/full-tec2022-s2-e2_p04.webp", "./assets/pau_pages/full-tec2022-s2-e2_p05.webp"], "tec2022-s2-e2": ["./assets/pau_pages/full-tec2022-s2-e2_p04.webp", "./assets/pau_pages/full-tec2022-s2-e2_p05.webp"], "full-tec2022-s2-e3": ["./assets/pau_pages/full-tec2022-s2-e3_p06.webp", "./assets/pau_pages/full-tec2022-s2-e3_p07.webp"], "tec2022-s2-e3": ["./assets/pau_pages/full-tec2022-s2-e3_p06.webp", "./assets/pau_pages/full-tec2022-s2-e3_p07.webp"], "full-tec2022-s2-e4": ["./assets/pau_pages/full-tec2022-s2-e4_p08.webp", "./assets/pau_pages/full-tec2022-s2-e4_p09.webp"], "tec2022-s2-e4": ["./assets/pau_pages/full-tec2022-s2-e4_p08.webp", "./assets/pau_pages/full-tec2022-s2-e4_p09.webp"], "full-tec2022-s2-e5": ["./assets/pau_pages/full-tec2022-s2-e5_p10.webp", "./assets/pau_pages/full-tec2022-s2-e5_p11.webp"], "tec2022-s2-e5": ["./assets/pau_pages/full-tec2022-s2-e5_p10.webp", "./assets/pau_pages/full-tec2022-s2-e5_p11.webp"], "full-tec2022-s2-e6": ["./assets/pau_pages/full-tec2022-s2-e6_p12.webp", "./assets/pau_pages/full-tec2022-s2-e6_p13.webp"], "tec2022-s2-e6": ["./assets/pau_pages/full-tec2022-s2-e6_p12.webp", "./assets/pau_pages/full-tec2022-s2-e6_p13.webp"], "full-tec2022-s5-e1": ["./assets/pau_pages/full-tec2022-s5-e1_p18.webp", "./assets/pau_pages/full-tec2022-s5-e1_p19.webp"], "tec2022-s5-e1": ["./assets/pau_pages/full-tec2022-s5-e1_p18.webp", "./assets/pau_pages/full-tec2022-s5-e1_p19.webp"], "full-tec2022-s5-e2": ["./assets/pau_pages/full-tec2022-s5-e2_p20.webp", "./assets/pau_pages/full-tec2022-s5-e2_p21.webp"], "tec2022-s5-e2": ["./assets/pau_pages/full-tec2022-s5-e2_p20.webp", "./assets/pau_pages/full-tec2022-s5-e2_p21.webp"], "full-tec2022-s5-e3": ["./assets/pau_pages/full-tec2022-s5-e3_p22.webp", "./assets/pau_pages/full-tec2022-s5-e3_p23.webp"], "tec2022-s5-e3": ["./assets/pau_pages/full-tec2022-s5-e3_p22.webp", "./assets/pau_pages/full-tec2022-s5-e3_p23.webp"], "full-tec2022-s5-e4": ["./assets/pau_pages/full-tec2022-s5-e4_p24.webp", "./assets/pau_pages/full-tec2022-s5-e4_p25.webp"], "tec2022-s5-e4": ["./assets/pau_pages/full-tec2022-s5-e4_p24.webp", "./assets/pau_pages/full-tec2022-s5-e4_p25.webp"], "full-tec2022-s5-e5": ["./assets/pau_pages/full-tec2022-s5-e5_p26.webp", "./assets/pau_pages/full-tec2022-s5-e5_p27.webp"], "tec2022-s5-e5": ["./assets/pau_pages/full-tec2022-s5-e5_p26.webp", "./assets/pau_pages/full-tec2022-s5-e5_p27.webp"], "full-tec2022-s5-e6": ["./assets/pau_pages/full-tec2022-s5-e6_p28.webp", "./assets/pau_pages/full-tec2022-s5-e6_p29.webp"], "tec2022-s5-e6": ["./assets/pau_pages/full-tec2022-s5-e6_p28.webp", "./assets/pau_pages/full-tec2022-s5-e6_p29.webp"], "full-tec2021-s2-e1": ["./assets/pau_pages/full-tec2021-s2-e1_p02.webp", "./assets/pau_pages/full-tec2021-s2-e1_p03.webp"], "tec2021-s2-e1": ["./assets/pau_pages/full-tec2021-s2-e1_p02.webp", "./assets/pau_pages/full-tec2021-s2-e1_p03.webp"], "full-tec2021-s2-e2": ["./assets/pau_pages/full-tec2021-s2-e2_p04.webp", "./assets/pau_pages/full-tec2021-s2-e2_p05.webp"], "tec2021-s2-e2": ["./assets/pau_pages/full-tec2021-s2-e2_p04.webp", "./assets/pau_pages/full-tec2021-s2-e2_p05.webp"], "full-tec2021-s2-e3": ["./assets/pau_pages/full-tec2021-s2-e3_p06.webp", "./assets/pau_pages/full-tec2021-s2-e3_p07.webp"], "tec2021-s2-e3": ["./assets/pau_pages/full-tec2021-s2-e3_p06.webp", "./assets/pau_pages/full-tec2021-s2-e3_p07.webp"], "full-tec2021-s2-e4": ["./assets/pau_pages/full-tec2021-s2-e4_p08.webp", "./assets/pau_pages/full-tec2021-s2-e4_p09.webp"], "tec2021-s2-e4": ["./assets/pau_pages/full-tec2021-s2-e4_p08.webp", "./assets/pau_pages/full-tec2021-s2-e4_p09.webp"], "full-tec2021-s2-e5": ["./assets/pau_pages/full-tec2021-s2-e5_p10.webp", "./assets/pau_pages/full-tec2021-s2-e5_p11.webp"], "tec2021-s2-e5": ["./assets/pau_pages/full-tec2021-s2-e5_p10.webp", "./assets/pau_pages/full-tec2021-s2-e5_p11.webp"], "full-tec2021-s2-e6": ["./assets/pau_pages/full-tec2021-s2-e6_p12.webp", "./assets/pau_pages/full-tec2021-s2-e6_p13.webp"], "tec2021-s2-e6": ["./assets/pau_pages/full-tec2021-s2-e6_p12.webp", "./assets/pau_pages/full-tec2021-s2-e6_p13.webp"], "full-tec2021-s5-e1": ["./assets/pau_pages/full-tec2021-s5-e1_p18.webp", "./assets/pau_pages/full-tec2021-s5-e1_p19.webp"], "tec2021-s5-e1": ["./assets/pau_pages/full-tec2021-s5-e1_p18.webp", "./assets/pau_pages/full-tec2021-s5-e1_p19.webp"], "full-tec2021-s5-e2": ["./assets/pau_pages/full-tec2021-s5-e2_p20.webp", "./assets/pau_pages/full-tec2021-s5-e2_p21.webp"], "tec2021-s5-e2": ["./assets/pau_pages/full-tec2021-s5-e2_p20.webp", "./assets/pau_pages/full-tec2021-s5-e2_p21.webp"], "full-tec2021-s5-e3": ["./assets/pau_pages/full-tec2021-s5-e3_p22.webp", "./assets/pau_pages/full-tec2021-s5-e3_p23.webp"], "tec2021-s5-e3": ["./assets/pau_pages/full-tec2021-s5-e3_p22.webp", "./assets/pau_pages/full-tec2021-s5-e3_p23.webp"], "full-tec2021-s5-e4": ["./assets/pau_pages/full-tec2021-s5-e4_p24.webp", "./assets/pau_pages/full-tec2021-s5-e4_p25.webp"], "tec2021-s5-e4": ["./assets/pau_pages/full-tec2021-s5-e4_p24.webp", "./assets/pau_pages/full-tec2021-s5-e4_p25.webp"], "full-tec2021-s5-e5": ["./assets/pau_pages/full-tec2021-s5-e5_p26.webp", "./assets/pau_pages/full-tec2021-s5-e5_p27.webp"], "tec2021-s5-e5": ["./assets/pau_pages/full-tec2021-s5-e5_p26.webp", "./assets/pau_pages/full-tec2021-s5-e5_p27.webp"], "full-tec2021-s5-e6": ["./assets/pau_pages/full-tec2021-s5-e6_p28.webp", "./assets/pau_pages/full-tec2021-s5-e6_p29.webp"], "tec2021-s5-e6": ["./assets/pau_pages/full-tec2021-s5-e6_p28.webp", "./assets/pau_pages/full-tec2021-s5-e6_p29.webp"]};

function attachPauFigures(){
  pauBank.forEach(x => {
    const imgs = pauFiguresMap[x.id] || pauFiguresMap[String(x.id||'').replace(/^full-/, '')];
    if(imgs) x.figures = imgs;
  });
}
attachPauFigures();

function renderPauFigures(x){
  const imgs = x.figures || pauFiguresMap[x.id] || pauFiguresMap[String(x.id||'').replace(/^full-/, '')] || [];
  if(!imgs.length) return '';
  return `<details class="enunciat-box figures-box" open><summary>Pàgines originals del PDF amb figures, esquemes o taules</summary><p class="small">Imatges renderitzades de la prova original. Serveixen per veure figures, circuits, gràfics i taules que el buidatge textual no pot reproduir amb fiabilitat.</p><div class="pdf-pages">${imgs.map((src,i)=>`<figure class="pdf-page-card"><a href="${esc(src)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(src)}" alt="Pàgina original ${i+1} de ${esc(x.exercici)}"></a><figcaption>Pàgina original ${i+1}. Toca la imatge per obrir-la gran.</figcaption></figure>`).join('')}</div></details>`;
}


function pauData(){
  const full = pauBank.filter(x => String(x.id).startsWith('full-'));
  return full.length ? full : pauBank;
}


function openExercise(key){
  setView('exercicis');
  setTimeout(() => {
    const sel = $('#exerciseSelect');
    if(sel){ sel.value = key; renderExerciseForm(); document.getElementById('exerciseForm')?.scrollIntoView({behavior:'smooth', block:'start'}); }
  }, 0);
}

function renderExerciseCards(containerId='exerciseCards', filter=''){
  const el = document.getElementById(containerId);
  if(!el) return;
  const q = String(filter || '').trim().toLowerCase();
  const data = exerciseCards.filter(c => {
    const e = exercises[c.key];
    return !q || `${e.title} ${c.bloc} ${c.desc}`.toLowerCase().includes(q);
  });
  el.innerHTML = data.map(c => {
    const e = exercises[c.key];
    return `<article class="card exercise-card"><p class="pill">${esc(c.bloc)}</p><h3>${esc(e.title)}</h3><p>${esc(c.desc)}</p><div class="btnrow"><button class="primary" onclick="openExercise('${c.key}')">Obrir exercici</button><button class="secondary" onclick="openExercise('${c.key}'); setTimeout(solveSelected,150)">Veure resolució model</button></div></article>`;
  }).join('') || '<div class="notice">No s’ha trobat cap exercici amb aquest filtre.</div>';
}

function setView(view){
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  const views = {inici, pau, exercicis: exercicisView, calculadores, practica, formulari, historial};
  views[view]?.();
}

$$('.tab').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

function inici(){
  app.innerHTML = `<section class="card hero"><h2>Entrenador d’exercicis de Tecnologia Industrial i PAU</h2><p>Aquesta PWA ajuda a resoldre exercicis tipus pas a pas: dades, fórmula, substitució, càlcul, resultat, unitats, interpretació i errors habituals.</p><div class="btnrow no-print"><button class="primary" onclick="setView('exercicis')">Triar exercici</button><button class="secondary" onclick="setView('pau')">Banc PAU</button><button class="secondary" onclick="setView('formulari')">Formulari</button></div></section>
  <section class="card"><h2>Tria ràpida d’exercicis</h2><p class="small">Ara sí: cada targeta obre directament l’exercici amb els camps de dades i el botó de resolució pas a pas.</p><div class="field"><label>Cercar per bloc o paraula clau</label><input id="homeSearch" placeholder="Ex.: motor, calor, lògica, trifàsica..." oninput="renderExerciseCards('homeExerciseCards', this.value)"></div><div id="homeExerciseCards" class="grid"></div></section>`;
  renderExerciseCards('homeExerciseCards');
}

function pau(){
  app.innerHTML = `<section class="card"><h2>Banc PAU complet · buidatge total i figures</h2><p>La v11 integra també les pàgines originals del PDF amb figures. La v10 va fer el buidatge complet dels PDF únics pujats: tots els exercicis detectats de 2021, 2022, 2023, 2024 i 2025 apareixen com a fitxes classificades per any, sèrie, matèria, bloc i tipus. Pots usar <b>Mode alumne</b> amb pistes i comprovació per passos, o <b>Mode docent</b> amb solucions, criteris i fitxa imprimible.</p><div class="btnrow no-print"><button id="roleAlumne" class="${pauRole==='alumne'?'primary':'secondary'}" onclick="setPauRole('alumne')">Mode alumne</button><button id="roleDocent" class="${pauRole==='docent'?'primary':'secondary'}" onclick="setPauRole('docent')">Mode docent</button></div><div class="grid"><div class="field"><label>Matèria</label><select id="bankMateria" onchange="renderPauBank()"><option value="">Totes</option><option>Tecnologia i enginyeria</option><option>Tecnologia industrial</option><option>Electrotècnia</option></select></div><div class="field"><label>Any</label><select id="bankYear" onchange="renderPauBank()"><option value="">Tots</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option></select></div><div class="field"><label>Sèrie</label><select id="bankSerie" onchange="renderPauBank()"><option value="">Totes</option><option>Sèrie 1</option><option>Sèrie 2</option><option>Sèrie 5</option></select></div><div class="field"><label>Bloc o paraula clau</label><input id="bankSearch" placeholder="Ex.: motor, energia, lògica, estàtica..." oninput="renderPauBank()"></div><div class="field"><label>Mode</label><select id="bankMode" onchange="renderPauBank()"><option value="">Tots</option><option value="test">Test</option><option value="calculadora">Amb calculadora</option><option value="fitxa">Fitxa per parts</option></select></div></div><div class="btnrow no-print"><button class="secondary" onclick="renderTest()">Obrir test autocorregible</button><button class="secondary" onclick="setView('exercicis')">Exercicis resolubles</button><button class="secondary" onclick="setView('calculadores')">Calculadores</button></div><div id="pauArea"></div></section><section class="card"><h2>Fitxes del banc</h2><div id="pauBankStats" class="small"></div><div id="pauBankCards" class="grid"></div></section>`;
  renderPauBank();
}


function renderPauBank(){
  const materia = document.getElementById('bankMateria')?.value || '';
  const year = document.getElementById('bankYear')?.value || '';
  const serie = document.getElementById('bankSerie')?.value || '';
  const q = (document.getElementById('bankSearch')?.value || '').toLowerCase().trim();
  const mode = document.getElementById('bankMode')?.value || '';
  const data = pauData();
  let items = data.filter(x => (!materia || x.materia === materia) && (!year || String(x.any) === year) && (!serie || x.serie === serie));
  if(mode){
    items = items.filter(x => mode === 'calculadora' ? !!x.enllac : (mode === 'fitxa' ? !x.enllac && x.tipus !== 'test' : x.tipus.includes(mode)));
  }
  if(q){
    items = items.filter(x => `${x.any} ${x.materia} ${x.serie} ${x.exercici} ${x.bloc} ${x.titol} ${x.resum} ${x.tipus}`.toLowerCase().includes(q));
  }
  const stats = document.getElementById('pauBankStats');
  if(stats) stats.innerHTML = `<p><b>${items.length}</b> fitxes mostrades de <b>${data.length}</b>. Tecnologia i enginyeria: ${data.filter(x=>x.materia==='Tecnologia i enginyeria').length}. Tecnologia industrial: ${data.filter(x=>x.materia==='Tecnologia industrial').length}. Electrotècnia: ${data.filter(x=>x.materia==='Electrotècnia').length}.</p>`;
  const el = document.getElementById('pauBankCards');
  if(!el) return;
  el.innerHTML = items.map(x => `<article class="card"><p><span class="pill">${esc(x.any)}</span> <span class="pill">${esc(x.materia)}</span> <span class="pill">${esc(x.serie)}</span></p><h3>${esc(x.exercici)} · ${esc(x.titol)}</h3><p><b>${esc(x.bloc)}</b> · ${esc(x.tipus)} · ${esc(x.nivell)}</p><p>${esc(x.resum)}</p><div class="btnrow"><button class="primary" onclick="openPauItem('${x.id}')">Treballar per parts</button>${x.enllac?`<button class="secondary" onclick="openExercise('${x.enllac}')">Obrir calculadora associada</button>`:''}</div></article>`).join('') || '<div class="notice">No hi ha fitxes amb aquest filtre.</div>';
}

function openPauItem(id){
  const x = pauData().find(p => p.id === id) || pauBank.find(p => p.id === id);
  if(!x) return;
  currentPauId = id;
  const html = renderPauDetail(x);
  const area = document.getElementById('pauArea');
  if(area){ area.innerHTML = html; area.scrollIntoView({behavior:'smooth', block:'start'}); }
}

function setPauRole(role){
  pauRole = role;
  document.getElementById('roleAlumne')?.classList.toggle('primary', role==='alumne');
  document.getElementById('roleAlumne')?.classList.toggle('secondary', role!=='alumne');
  document.getElementById('roleDocent')?.classList.toggle('primary', role==='docent');
  document.getElementById('roleDocent')?.classList.toggle('secondary', role!=='docent');
  if(currentPauId) openPauItem(currentPauId);
}

function makePauSteps(x){
  const clean = arr => (arr||[]).filter(Boolean);
  return [
    {title:'1. Llegir i entendre l’enunciat', prompt:'Llegeix l’enunciat i escriu amb les teves paraules què et demana aquest exercici.', hint:'Busca verbs com calcula, determina, descriu, identifica o justifica. Separa cada apartat.', solution:`Enunciat: ${x.enunciat || x.resum}\n\nCal treballar: ${clean(x.apartats).join(' · ') || x.resum}`, keywords:['calcula','determina','descriu','identifica','apartat','exercici']},
    {title:'2. Identificar dades', prompt:'Anota les dades numèriques i conceptuals importants, amb unitats.', hint:'No copiïs tot l’enunciat. Tria només magnituds, unitats, condicions i casos.', solution:clean(x.dades).join('\n') || 'No hi ha dades numèriques explícites; cal interpretar la situació o l’esquema.', keywords:clean(x.dades).join(' ').toLowerCase().split(/[^a-zà-ú0-9]+/).filter(w=>w.length>2).slice(0,10)},
    {title:'3. Preparar unitats i esquema', prompt:'Indica quines conversions o esquemes previs cal fer abans de calcular.', hint:'Revisa mm↔m, g↔kg, kJ↔MJ, min⁻¹↔rad/s, tensió de fase/composta i valor eficaç/màxim.', solution:'Conversions típiques: passar totes les magnituds a unitats coherents; redibuixar circuits equivalents; separar fase/línia en trifàsica; distingir valor eficaç i màxim en corrent altern.', keywords:['unitats','conversió','m','kg','s','fase','eficaç','equivalent']},
    {title:'4. Escollir fórmules o idees clau', prompt:'Escriu la fórmula o el principi que faries servir en cada apartat.', hint:'Relaciona cada apartat amb una família: energia, potència, lògica, circuits, motors, pneumàtica o trifàsica.', solution:clean(x.formules).join('\n') || 'Cal justificar amb vocabulari tècnic i relació causa-efecte.', keywords:clean(x.formules).join(' ').toLowerCase().split(/[^a-zà-ú0-9ηωφ√]+/).filter(w=>w.length>1).slice(0,12)},
    {title:'5. Desenvolupar el càlcul o la resposta', prompt:'Fes la substitució numèrica o escriu la resposta tècnica de l’apartat.', hint:'Escriu primer la fórmula, després substitueix, després calcula. Si és teòric, fes frases curtes amb vocabulari tècnic.', solution:x.enllac ? `Aquest exercici té resolutor associat. Pots obrir-lo per veure la substitució numèrica i el càlcul: ${exercises[x.enllac]?.title || x.enllac}.` : x.resolucio, keywords:['substitució','resultat','fórmula','per tant','unitat','càlcul']},
    {title:'6. Interpretar i revisar errors', prompt:'Explica si el resultat és coherent i quin error habitual cal evitar.', hint:'Pregunta’t si la unitat final té sentit, si l’ordre de magnitud és raonable i si has aplicat totes les condicions.', solution:`Errors habituals:\n${clean(x.errors).join('\n') || 'No justificar la resposta o no indicar unitats.'}`, keywords:clean(x.errors).join(' ').toLowerCase().split(/[^a-zà-ú0-9]+/).filter(w=>w.length>3).slice(0,10)}
  ];
}

function renderPauDetail(x){
  return pauRole === 'docent' ? renderPauDocent(x) : renderPauAlumne(x);
}

function renderPauHeader(x){
  return `<h2>${esc(x.exercici)} · ${esc(x.titol)}</h2><p><span class="pill">${esc(x.any)}</span> <span class="pill">${esc(x.materia)}</span> <span class="pill">${esc(x.serie)}</span> <span class="pill">${esc(x.bloc)}</span> <span class="pill">${esc(x.nivell)}</span></p><p>${esc(x.resum)}</p><details class="enunciat-box" open><summary>Enunciat de treball</summary><p>${esc(x.enunciat || x.resum)}</p></details>${renderPauFigures(x)}`;
}

function renderPauAlumne(x){
  const steps = makePauSteps(x);
  return `<section class="card pau-work"><div class="mode-banner"><b>Mode alumne:</b> treball per passos. La solució no surt tota de cop; pots demanar pistes o comprovar cada pas.</div>${renderPauHeader(x)}<div class="progressbar"><div id="pauProgress" style="width:0%"></div></div>${steps.map((st,i)=>`<article class="step-card" id="stepCard${i}"><h3>${esc(st.title)}</h3><p>${esc(st.prompt)}</p><textarea id="pauAnswer${i}" placeholder="Escriu aquí la teva resposta del pas ${i+1}..."></textarea><div class="btnrow no-print"><button class="secondary" onclick="showPauHint(${i})">Pista</button><button class="secondary" onclick="checkPauStep(${i})">Comprovar aquest pas</button><button class="secondary" onclick="showPauSolution(${i})">Mostra solució del pas</button></div><div id="pauFeedback${i}" class="step-feedback"></div></article>`).join('')}<div class="btnrow no-print"><button class="primary" onclick="finishPauActivity()">Finalitzar i veure resum</button>${x.enllac?`<button class="secondary" onclick="openExercise('${x.enllac}')">Obrir resolutor associat</button>`:''}<button class="secondary" onclick="printClassSheet('${x.id}', false)">Fitxa imprimible alumne</button><button class="secondary" onclick="saveCurrent('${esc(x.exercici+' · '+x.titol)}', document.getElementById('pauArea').innerText)">Guardar</button></div><div id="pauSummary"></div></section>`;
}

function renderPauDocent(x){
  const list = arr => `<ul>${(arr||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;
  return `<section class="card pau-work"><div class="mode-banner teacher"><b>Mode docent:</b> mostra solucions orientatives, criteris de correcció i fitxes imprimibles.</div>${renderPauHeader(x)}<details class="explain" open><summary>1. Apartats que cal resoldre</summary>${list(x.apartats)}</details><details class="explain" open><summary>2. Dades principals</summary>${list(x.dades)}</details><details class="explain" open><summary>3. Fórmules i idees clau</summary>${list(x.formules)}</details><details class="explain" open><summary>4. Pistes graduades</summary>${list(x.pistes)}</details><details class="explain" open><summary>5. Resolució orientativa</summary><p>${esc(x.resolucio)}</p>${x.enllac?`<p><button class="primary" onclick="openExercise('${x.enllac}')">Obrir resolutor amb dades modificables</button></p>`:'<p class="notice">Aquesta fitxa depèn de figura o esquema. És millor treballar-la com a lectura guiada i correcció per criteris.</p>'}</details><details class="explain" open><summary>6. Errors habituals</summary>${list(x.errors)}</details><details class="explain" open><summary>7. Criteris orientatius de correcció</summary>${teacherCriteria(x)}</details><div class="btnrow no-print"><button class="secondary" onclick="printClassSheet('${x.id}', false)">Imprimir fitxa alumne</button><button class="secondary" onclick="printClassSheet('${x.id}', true)">Imprimir amb solucions</button><button class="secondary" onclick="navigator.clipboard.writeText(document.getElementById('pauArea').innerText)">Copiar fitxa</button><button class="secondary" onclick="saveCurrent('${esc(x.exercici+' · '+x.titol)}', document.getElementById('pauArea').innerText)">Guardar a l’historial</button></div></section>`;
}

function teacherCriteria(x){
  return `<ul><li><b>Comprensió de l’enunciat:</b> identifica correctament què demana cada apartat.</li><li><b>Dades i unitats:</b> selecciona dades rellevants i fa conversions adequades.</li><li><b>Modelització:</b> tria fórmules o principis coherents amb el bloc ${esc(x.bloc)}.</li><li><b>Procediment:</b> substitueix ordenadament i manté unitats.</li><li><b>Resultat:</b> dona magnitud, unitat i interpretació tècnica.</li><li><b>Revisió:</b> evita errors habituals: ${(x.errors||[]).slice(0,2).map(esc).join('; ')}.</li></ul>`;
}

function showPauHint(i){
  const x = pauBank.find(p => p.id === currentPauId); if(!x) return;
  const st = makePauSteps(x)[i];
  document.getElementById(`pauFeedback${i}`).innerHTML = `<div class="notice"><b>Pista:</b> ${esc(st.hint)}</div>`;
}

function showPauSolution(i){
  const x = pauBank.find(p => p.id === currentPauId); if(!x) return;
  const st = makePauSteps(x)[i];
  document.getElementById(`pauFeedback${i}`).innerHTML = `<div class="ok"><b>Solució orientativa del pas:</b><pre>${esc(st.solution)}</pre></div>`;
}

function checkPauStep(i){
  const x = pauBank.find(p => p.id === currentPauId); if(!x) return;
  const st = makePauSteps(x)[i];
  const ans = (document.getElementById(`pauAnswer${i}`)?.value || '').toLowerCase();
  const words = (st.keywords||[]).filter(w => String(w).length>1);
  const hits = words.filter(w => ans.includes(String(w).toLowerCase())).length;
  const min = Math.min(3, Math.max(1, Math.ceil(words.length/4)));
  const ok = ans.trim().length > 15 && (words.length===0 || hits >= min);
  document.getElementById(`pauFeedback${i}`).innerHTML = `<div class="${ok?'ok':'notice'}"><b>${ok?'Bon camí.':'Resposta parcial.'}</b> ${ok?'Has inclòs idees clau del pas.':'Revisa la pista o amplia la resposta amb dades, fórmula, unitats o justificació.'}<br><span class="small">Paraules clau detectades: ${hits}/${words.length || '—'}.</span></div>`;
  updatePauProgress();
}

function updatePauProgress(){
  const boxes = $$('[id^="pauFeedback"]');
  const done = boxes.filter(b => b.textContent.trim().length>0).length;
  const pct = boxes.length ? Math.round(done/boxes.length*100) : 0;
  const bar = document.getElementById('pauProgress'); if(bar) bar.style.width = pct + '%';
}

function finishPauActivity(){
  updatePauProgress();
  const answers = $$('[id^="pauAnswer"]').map((t,i)=>`Pas ${i+1}: ${t.value.trim() || '(sense resposta)'}`).join('\n\n');
  document.getElementById('pauSummary').innerHTML = `<div class="result"><h3>Resum de l’activitat</h3><p>Has completat una resolució per passos. Revisa especialment unitats, justificació i coherència del resultat.</p><pre>${esc(answers)}</pre><div class="btnrow no-print"><button class="secondary" onclick="navigator.clipboard.writeText(document.getElementById('pauSummary').innerText)">Copiar resum</button><button class="secondary" onclick="saveCurrent('Activitat PAU per passos', document.getElementById('pauArea').innerText)">Guardar a l’historial</button></div></div>`;
}

function printClassSheet(id, withSolutions=false){
  const x = pauData().find(p => p.id === id) || pauBank.find(p => p.id === id); if(!x) return;
  const steps = makePauSteps(x);
  const blanks = `<div class="blank-lines"></div>`;
  const sheet = `<section class="card print-sheet"><h2>${withSolutions ? 'Fitxa PAU amb solucions' : 'Fitxa de treball PAU'}</h2>${renderPauHeader(x)}<p><b>Temps recomanat:</b> 20-35 min segons dificultat.</p>${steps.map((st,i)=>`<article class="sheet-step"><h3>${esc(st.title)}</h3><p>${esc(st.prompt)}</p>${withSolutions?`<div class="ok"><b>Solució orientativa:</b><pre>${esc(st.solution)}</pre></div>`:blanks}</article>`).join('')}<div class="no-print btnrow"><button class="secondary" onclick="openPauItem('${id}')">Tornar a l’activitat</button><button class="primary" onclick="window.print()">Imprimir ara</button></div></section>`;
  // Important: substituim temporalment tota la vista pel full d'impressio.
  // Aixi no s'imprimeixen les altres targetes del banc que comparteixen la pagina.
  app.innerHTML = sheet;
  window.scrollTo(0, 0);
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
  app.innerHTML = `<section class="card"><h2>Exercicis guiats</h2><p>Selecciona un exercici del desplegable o obre’l des de les targetes. Cada exercici té dades modificables i resolució pas a pas.</p><div class="grid"><div class="field"><label>Tipus d’exercici</label><select id="exerciseSelect" onchange="renderExerciseForm()">${options}</select></div><div class="field"><label>Filtrar targetes</label><input id="exerciseFilter" placeholder="Ex.: energia, motor, pneumàtica..." oninput="renderExerciseCards('exerciseCards', this.value)"></div></div><div id="exerciseForm"></div></section><section class="card"><h2>Tots els exercicis disponibles</h2><div id="exerciseCards" class="grid"></div></section>`;
  renderExerciseForm();
  renderExerciseCards('exerciseCards');
}

function renderExerciseForm(){
  const key = $('#exerciseSelect').value; const ex = exercises[key];
  const fields = ex.fields.map(f=>`<div class="field"><label for="${f[0]}">${f[1]} <span class="small">(${f[2]})</span></label><input id="${f[0]}" value="${f[3]}" inputmode="decimal"></div>`).join('');
  $('#exerciseForm').innerHTML = `<div class="card selected-exercise"><h3>${ex.title}</h3><p class="small"><b>Com es fa servir:</b> revisa o canvia les dades, prem <b>Resoldre pas a pas</b> i guarda la resolució a l’historial si la vols recuperar després.</p>${fields || '<p>Aquest exercici genera automàticament la taula de veritat i el diagrama.</p>'}<div class="btnrow"><button class="primary" onclick="solveSelected()">Resoldre pas a pas</button><button class="secondary" onclick="window.print()">Imprimir</button><button class="secondary" onclick="copyResult()">Copiar</button><button class="secondary" onclick="saveCurrentFromResult()">Guardar</button></div><div id="result"></div></div>`;
}

function solveSelected(){
  const key = $('#exerciseSelect').value; const ex = exercises[key];
  $('#result').innerHTML = ex.solve();
}

function checklistHtml(items){
  return `<ul class="checklist">${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
}
function detailBlock(title, body){
  return `<details class="explain" open><summary>${title}</summary>${body}</details>`;
}
function similarBlock(text){
  return `<section class="similar"><h3>Exercici similar proposat</h3><p>${text}</p></section>`;
}

function solveElevador(){
  const m=val('m'), h=val('h'), t=val('temps'), eta=val('eta'), pasmm=val('pas'), nm=val('nmotor');
  if([m,h,t,eta,pasmm,nm].some(x=>!Number.isFinite(x)||x<=0)) return err('Cal introduir valors positius i coherents. Revisa especialment el rendiment, el temps i el pas de rosca.');
  const g=9.81, pas=pasmm/1000, E=m*g*h, Pm=E/t, Pe=Pm/eta, nvoltes=h/pas, ncargol=(nvoltes/t)*60, i=nm/ncargol;
  return res('Elevador amb cargol-femella', `
    ${detailBlock('1. Lectura de l’enunciat', `<p>L’exercici descriu un sistema d’elevació. El cargol converteix el moviment circular en moviment vertical. Per això hem de calcular energia, potència i transmissió.</p><p>Com que la massa indicada és la que suporta cada columna, el càlcul correspon a <b>un motor/una columna</b>.</p>`)}
    ${detailBlock('2. Dades i unitats', checklistHtml([
      `m = ${fmt(m)} kg`,
      `h = ${fmt(h)} m`,
      `t = ${fmt(t)} s`,
      `η = ${fmt(eta)} en tant per u`,
      `pas = ${fmt(pasmm)} mm/volta = ${fmt(pas,4)} m/volta`,
      `n motor = ${fmt(nm)} min⁻¹`
    ]))}
    ${detailBlock('3. Estratègia de resolució', `<p>Primer calculem l’energia útil necessària per elevar la càrrega. Després la dividim pel temps per obtenir la potència mecànica. Com que el sistema té pèrdues, la potència elèctrica serà més gran que la mecànica. Finalment, usem el pas de rosca per saber quantes voltes ha de fer el cargol i quina reducció cal.</p>`)}
    ${detailBlock('4. Fórmules', `<div class="formula">E = m · g · h<br>P<sub>mec</sub> = E / t<br>P<sub>elèc</sub> = P<sub>mec</sub> / η<br>n<sub>voltes</sub> = h / pas<br>i = n<sub>motor</sub> / n<sub>cargol</sub></div>`)}
    ${detailBlock('5. Substitució i càlcul pas a pas', `<ol><li>Energia útil: E = ${fmt(m)} · 9,81 · ${fmt(h)} = <b>${fmt(E)} J</b></li><li>Potència mecànica: P<sub>mec</sub> = ${fmt(E)} / ${fmt(t)} = <b>${fmt(Pm)} W</b></li><li>Potència elèctrica: P<sub>elèc</sub> = ${fmt(Pm)} / ${fmt(eta)} = <b>${fmt(Pe)} W</b></li><li>Voltes del cargol: n = ${fmt(h)} / ${fmt(pas,4)} = <b>${fmt(nvoltes)} voltes</b></li><li>Velocitat del cargol: n<sub>cargol</sub> = (${fmt(nvoltes)} / ${fmt(t)}) · 60 = <b>${fmt(ncargol)} min⁻¹</b></li><li>Relació de transmissió: i = ${fmt(nm)} / ${fmt(ncargol)} = <b>${fmt(i)}</b></li></ol>`)}
    ${detailBlock('6. Interpretació tècnica', `<p>El motor gira molt més ràpid que el cargol. El reductor ha de disminuir la velocitat i augmentar el parell disponible. Si la relació és alta, el moviment serà més lent però més adequat per elevar càrregues grans.</p>`)}
    ${detailBlock('7. Errors habituals', checklistHtml(['No convertir el pas de rosca de mm/volta a m/volta.','Fer servir minuts en comptes de segons en la potència.','Oblidar el rendiment i donar com a potència elèctrica la potència mecànica.','No distingir entre velocitat del motor i velocitat del cargol.']))}
    ${similarBlock(`Un elevador suporta ${fmt(m*1.1)} kg per columna, puja ${fmt(h)} m en ${fmt(t+10)} s, amb pas de ${fmt(pasmm)} mm/volta i rendiment ${fmt(eta)}. Calcula Pmec, Pelèc i la relació de transmissió.`)}
  `);
}
function solveCalor(){
  const V=val('v'), T1=val('t1'), T2=val('t2'), ce=val('ce'), eta=val('eta'), pc=val('pc'), consum=val('consum'), cart=val('cartutx');
  if([V,T1,T2,ce,eta,pc,consum,cart].some(x=>!Number.isFinite(x))||eta<=0||pc<=0||consum<=0) return err('Revisa dades: rendiment, poder calorífic i consum han de ser positius.');
  const ma=V, dT=T2-T1, Q=ma*ce*dT, Ecomb=Q/eta, mgas=(Ecomb/1000)/pc*1000, temps=mgas/consum, auto=cart/consum;
  return res('Calor, combustible i rendiment', `
    ${detailBlock('1. Lectura de l’enunciat', `<p>Volem escalfar aigua. L’aigua rep una energia útil, però el cremador no aprofita tota l’energia del combustible. Per això cal separar <b>energia útil</b> i <b>energia subministrada pel gas</b>.</p>`)}
    ${detailBlock('2. Dades i unitats', checklistHtml([`V = ${fmt(V)} L ≈ ${fmt(ma)} kg d’aigua`,`T inicial = ${fmt(T1)} °C`,`T final = ${fmt(T2)} °C`,`ΔT = ${fmt(dT)} °C`,`ce = ${fmt(ce)} kJ/(kg·°C)`,`η = ${fmt(eta)}`,`pc = ${fmt(pc)} MJ/kg`,`consum = ${fmt(consum)} g/h`,`cartutx = ${fmt(cart)} g`]))}
    ${detailBlock('3. Estratègia de resolució', `<p>Primer calculem la calor útil que necessita l’aigua. Després dividim pel rendiment per saber quanta energia ha d’aportar el gas. Finalment, amb el poder calorífic obtenim la massa de gas consumida.</p>`)}
    ${detailBlock('4. Fórmules', `<div class="formula">Q = m · ce · ΔT<br>E<sub>combustible</sub> = Q / η<br>m<sub>gas</sub> = E<sub>combustible</sub> / pc<br>temps = m<sub>gas</sub> / consum</div>`)}
    ${detailBlock('5. Substitució i càlcul pas a pas', `<ol><li>Q = ${fmt(ma)} · ${fmt(ce)} · ${fmt(dT)} = <b>${fmt(Q)} kJ</b></li><li>Energia del combustible: E = ${fmt(Q)} / ${fmt(eta)} = <b>${fmt(Ecomb)} kJ</b></li><li>Convertim a MJ: ${fmt(Ecomb)} kJ = ${fmt(Ecomb/1000)} MJ</li><li>Massa de gas: m = ${fmt(Ecomb/1000)} / ${fmt(pc)} = <b>${fmt(mgas)} g</b></li><li>Temps de funcionament: ${fmt(mgas)} / ${fmt(consum)} = <b>${fmt(temps*60)} min</b></li><li>Autonomia màxima del cartutx: ${fmt(cart)} / ${fmt(consum)} = <b>${fmt(auto)} h</b></li></ol>`)}
    ${detailBlock('6. Interpretació tècnica', `<p>Com que el rendiment és ${fmt(eta)}, només s’aprofita aproximadament el ${fmt(eta*100)} % de l’energia del gas. La resta es perd en forma de calor que no arriba a l’aigua.</p>`)}
    ${detailBlock('7. Errors habituals', checklistHtml(['Confondre kJ i MJ.','No aplicar el rendiment.','Oblidar que 1 L d’aigua és aproximadament 1 kg.','Fer servir el consum en g/h sense convertir bé el temps.']))}
    ${similarBlock(`Escalfa ${fmt(V+1)} L d’aigua de ${fmt(T1)} °C a ${fmt(T2)} °C amb el mateix cremador. Calcula la massa de gas necessària.`)}
  `);
}
function solveOhm(){
  const U=val('u'),R=val('r'); if(U<=0||R<=0) return err('La tensió i la resistència han de ser positives.'); const I=U/R,P=U*I;
  return res('Llei d’Ohm i potència', `
    ${detailBlock('1. Què demana l’exercici?', `<p>Amb una tensió aplicada a una resistència, podem obtenir la intensitat que hi circula i la potència que es dissipa en forma de calor.</p>`)}
    ${detailBlock('2. Dades', checklistHtml([`U = ${fmt(U)} V`,`R = ${fmt(R)} Ω`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">I = U / R<br>P = U · I</div>`)}
    ${detailBlock('4. Càlcul pas a pas', `<ol><li>I = ${fmt(U)} / ${fmt(R)} = <b>${fmt(I)} A</b></li><li>P = ${fmt(U)} · ${fmt(I)} = <b>${fmt(P)} W</b></li></ol>`)}
    ${detailBlock('5. Interpretació', `<p>La resistència transforma energia elèctrica en calor. Si la resistència disminueix i la tensió es manté, la intensitat augmenta.</p>`)}
    ${detailBlock('6. Errors habituals', checklistHtml(['Fer P = U/R en comptes de P = U·I.','No comprovar que la resistència sigui en ohms.','Confondre intensitat A amb potència W.']))}
    ${similarBlock(`Una resistència de ${fmt(R*2)} Ω s’alimenta amb ${fmt(U)} V. Calcula I i P.`)}
  `);
}
function solveCA(){
  const U=val('uef'),I=val('ief'); if(U<=0||I<=0) return err('Els valors eficaços han de ser positius.'); const Um=U*Math.SQRT2, Im=I*Math.SQRT2;
  return res('Valor eficaç i valor màxim', `
    ${detailBlock('1. Idea clau', `<p>En corrent altern sinusoidal, el valor eficaç és el valor equivalent que produiria el mateix efecte tèrmic que un corrent continu. El valor màxim és el pic de la sinusoide.</p>`)}
    ${detailBlock('2. Dades', checklistHtml([`Uef = ${fmt(U)} V`,`Ief = ${fmt(I)} A`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">Umax = Uef · √2<br>Imax = Ief · √2</div>`)}
    ${detailBlock('4. Càlcul', `<ol><li>Umax = ${fmt(U)} · √2 = <b>${fmt(Um)} V</b></li><li>Imax = ${fmt(I)} · √2 = <b>${fmt(Im)} A</b></li></ol>`)}
    ${detailBlock('5. Interpretació i errors habituals', `<p>Una tensió domèstica de 230 V no té un pic de 230 V, sinó d’uns 325 V. En PAU és habitual que demanin explícitament valor màxim o valor eficaç.</p>${checklistHtml(['No multiplicar per √2 quan demanen el màxim.','Multiplicar per 2 en comptes de per √2.','Fer servir valors màxims en fórmules pensades per a valors eficaços.'])}`)}
    ${similarBlock(`Si Uef = ${fmt(U+20)} V i Ief = ${fmt(I)} A, calcula els valors màxims.`)}
  `);
}
function solveRL(){
  const U=val('u'),f=val('f'),LmH=val('l'),R=val('r'); if([U,f,LmH,R].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const L=LmH/1000, XL=2*Math.PI*f*L, Z=Math.sqrt(R*R+XL*XL), I=U/Z;
  return res('Circuit RL sèrie', `
    ${detailBlock('1. Lectura de l’exercici', `<p>En un circuit RL sèrie hi ha una resistència i una bobina. La bobina no es comporta com una resistència pura: presenta una reactància inductiva que depèn de la freqüència.</p>`)}
    ${detailBlock('2. Dades i conversions', checklistHtml([`U = ${fmt(U)} V`, `f = ${fmt(f)} Hz`, `L = ${fmt(LmH)} mH = ${fmt(L)} H`, `R = ${fmt(R)} Ω`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">X<sub>L</sub> = 2πfL<br>Z = √(R² + X<sub>L</sub>²)<br>I = U / Z</div>`)}
    ${detailBlock('4. Càlcul pas a pas', `<ol><li>X<sub>L</sub> = 2π · ${fmt(f)} · ${fmt(L)} = <b>${fmt(XL)} Ω</b></li><li>Z = √(${fmt(R)}² + ${fmt(XL)}²) = <b>${fmt(Z)} Ω</b></li><li>I = ${fmt(U)} / ${fmt(Z)} = <b>${fmt(I)} A</b></li></ol>`)}
    ${detailBlock('5. Interpretació', `<p>La impedància és més gran que la resistència perquè la bobina també s’oposa al corrent altern. Si augmenta la freqüència, augmenta X<sub>L</sub> i disminueix la intensitat.</p>`)}
    ${detailBlock('6. Errors habituals', checklistHtml(['No convertir mH a H.','Sumar R + XL directament sense fer el triangle d’impedàncies.','Confondre reactància inductiva amb resistència real.']))}
    ${similarBlock(`Amb la mateixa tensió i resistència, calcula I si L passa a ${fmt(LmH*1.5)} mH.`)}
  `);
}
function solveMotor(){
  const P=val('pu'),n=val('n'),Pa=val('pa'); if([P,n,Pa].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const w=2*Math.PI*n/60, M=P/w, eta=P/Pa*100;
  return res('Motor: parell i rendiment', `
    ${detailBlock('1. Lectura de l’exercici', `<p>El parell indica la capacitat de gir del motor. Per calcular-lo, primer cal passar la velocitat de min⁻¹ a rad/s.</p>`)}
    ${detailBlock('2. Dades', checklistHtml([`Pu = ${fmt(P)} W`,`n = ${fmt(n)} min⁻¹`,`Pa = ${fmt(Pa)} W`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">ω = 2πn / 60<br>M = P / ω<br>η = Pu / Pa</div>`)}
    ${detailBlock('4. Càlcul pas a pas', `<ol><li>ω = 2π · ${fmt(n)} / 60 = <b>${fmt(w)} rad/s</b></li><li>M = ${fmt(P)} / ${fmt(w)} = <b>${fmt(M)} N·m</b></li><li>η = ${fmt(P)} / ${fmt(Pa)} · 100 = <b>${fmt(eta)} %</b></li></ol>`)}
    ${detailBlock('5. Interpretació', `<p>Per a una mateixa potència, si el motor gira més lentament, el parell disponible és més gran. El rendiment indica quina part de la potència absorbida es converteix en potència útil a l’eix.</p>`)}
    ${detailBlock('6. Errors habituals', checklistHtml(['Fer servir n directament sense convertir a rad/s.','Confondre potència útil i potència absorbida.','Expressar el rendiment com 0,85 quan demanen percentatge, o al revés.']))}
    ${similarBlock(`Un motor de ${fmt(P)} W gira a ${fmt(n+200)} min⁻¹. Calcula el nou parell.`)}
  `);
}
function solveTrifasica(){
  const U=val('u'),I=val('i'),c=val('cos'); if(U<=0||I<=0||c<0||c>1) return err('Revisa U, I i cos φ. El cos φ ha d’estar entre 0 i 1.'); const S=Math.sqrt(3)*U*I, P=S*c, sin=Math.sqrt(1-c*c), Q=S*sin;
  return res('Trifàsica bàsica', `
    ${detailBlock('1. Lectura de l’exercici', `<p>En un sistema trifàsic equilibrat es treballa amb tensió composta, intensitat de línia i factor de potència. Les potències activa, reactiva i aparent formen el triangle de potències.</p>`)}
    ${detailBlock('2. Dades', checklistHtml([`U = ${fmt(U)} V`, `I = ${fmt(I)} A`, `cos φ = ${fmt(c)}`, `sin φ = ${fmt(sin)}`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">S = √3 · U · I<br>P = S · cosφ<br>Q = S · sinφ</div>`)}
    ${detailBlock('4. Càlcul pas a pas', `<ol><li>S = √3 · ${fmt(U)} · ${fmt(I)} = <b>${fmt(S)} VA</b></li><li>P = ${fmt(S)} · ${fmt(c)} = <b>${fmt(P)} W</b></li><li>Q = ${fmt(S)} · ${fmt(sin)} = <b>${fmt(Q)} var</b></li></ol>`)}
    ${detailBlock('5. Interpretació', `<p>La potència activa és la que es transforma en treball útil o calor. La reactiva està associada als camps magnètics o elèctrics i no es consumeix com energia útil, però carrega la instal·lació.</p>`)}
    ${detailBlock('6. Errors habituals', checklistHtml(['Oblidar el factor √3.','Fer servir tensió simple quan la dada és tensió composta.','Confondre VA, W i var.']))}
    ${similarBlock(`Una càrrega trifàsica de ${fmt(U)} V i ${fmt(I+2)} A té cosφ = ${fmt(c)}. Calcula S, P i Q.`)}
  `);
}
function solvePneumatica(){
  const pbar=val('p'),dmm=val('d'),cmm=val('cursa'),qL=val('q'); if([pbar,dmm,cmm,qL].some(x=>x<=0)) return err('Tots els valors han de ser positius.'); const p=pbar*1e5, d=dmm/1000, A=Math.PI*d*d/4, F=p*A, Q=qL/1000/60, v=Q/A, t=(cmm/1000)/v;
  return res('Força d’un cilindre pneumàtic', `
    ${detailBlock('1. Lectura de l’exercici', `<p>La pressió aplicada sobre la superfície del pistó genera una força. Si també coneixem el cabal, podem estimar la velocitat del pistó i el temps de recorregut.</p>`)}
    ${detailBlock('2. Dades i conversions', checklistHtml([`p = ${fmt(pbar)} bar = ${fmt(p)} Pa`,`d = ${fmt(dmm)} mm = ${fmt(d)} m`,`cursa = ${fmt(cmm)} mm = ${fmt(cmm/1000)} m`,`Q = ${fmt(qL)} L/min = ${fmt(Q,6)} m³/s`]))}
    ${detailBlock('3. Fórmules', `<div class="formula">A = πd²/4<br>F = p · A<br>v = Q / A<br>t = cursa / v</div>`)}
    ${detailBlock('4. Càlcul pas a pas', `<ol><li>A = π · ${fmt(d)}² / 4 = <b>${fmt(A,6)} m²</b></li><li>F = ${fmt(p)} · ${fmt(A,6)} = <b>${fmt(F)} N</b></li><li>v = ${fmt(Q,6)} / ${fmt(A,6)} = <b>${fmt(v)} m/s</b></li><li>t = ${fmt(cmm/1000)} / ${fmt(v)} = <b>${fmt(t)} s</b></li></ol>`)}
    ${detailBlock('5. Interpretació', `<p>Augmentar la pressió augmenta la força. Augmentar el diàmetre també augmenta la força, perquè creix l’àrea del pistó. El cabal determina la rapidesa del moviment.</p>`)}
    ${detailBlock('6. Errors habituals', checklistHtml(['No convertir bar a Pa.','No convertir mm a m.','No convertir L/min a m³/s.','Fer servir el diàmetre directament com si fos l’àrea.']))}
    ${similarBlock(`Amb el mateix cilindre, calcula la força si la pressió puja a ${fmt(pbar+1)} bar.`)}
  `);
}
function solveLogica(){
  let rows=''; for(let l=0;l<=1;l++)for(let n=0;n<=1;n++)for(let t=0;t<=1;t++)for(let i=0;i<=1;i++){const p=(l&&!t&&!n)||(i&&t)?1:0; rows+=`<tr><td>${l}</td><td>${n}</td><td>${t}</td><td>${i}</td><td><b>${p}</b></td></tr>`}
  return res('Lògica digital: persiana domòtica', `
    ${detailBlock('1. Lectura de l’enunciat', `<p>L’exercici dona condicions de funcionament d’una persiana. Cal traduir frases a variables lògiques i després construir la funció.</p>`)}
    ${detailBlock('2. Variables', checklistHtml(['l = 1 si hi ha llum exterior','n = 1 si el mode nocturn està activat','t = 1 si la temperatura és alta','i = 1 si hi ha presència','p = 1 si la persiana puja']))}
    ${detailBlock('3. Traducció de condicions', `<p>Primera condició: puja si hi ha llum, la temperatura no és alta i no és mode nocturn: <b>l · ¬t · ¬n</b>.</p><p>Segona condició: també puja si hi ha persones i la temperatura és alta: <b>i · t</b>.</p><p>Com que qualsevol de les dues condicions fa pujar la persiana, unim els dos termes amb OR.</p>`)}
    ${detailBlock('4. Funció lògica', `<div class="formula">p = l · ¬t · ¬n + i · t</div>`)}
    ${detailBlock('5. Taula de veritat', `<div class="tablewrap"><table><thead><tr><th>l</th><th>n</th><th>t</th><th>i</th><th>p</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    ${detailBlock('6. Diagrama de portes', `<svg class="gate-svg" viewBox="0 0 720 250" role="img" aria-label="Diagrama lògic"><text x="20" y="40">l</text><text x="20" y="80">¬t</text><text x="20" y="120">¬n</text><rect x="90" y="25" width="110" height="110" rx="18" fill="#e6f1ec" stroke="#1f6f5b"/><text x="115" y="88">AND</text><text x="250" y="65">i</text><text x="250" y="105">t</text><rect x="310" y="50" width="100" height="75" rx="18" fill="#e6f1ec" stroke="#1f6f5b"/><text x="335" y="95">AND</text><rect x="500" y="60" width="100" height="90" rx="18" fill="#dbeafe" stroke="#2563eb"/><text x="535" y="112">OR</text><text x="650" y="112">p</text><line x1="45" y1="36" x2="90" y2="50" stroke="#333"/><line x1="50" y1="76" x2="90" y2="80" stroke="#333"/><line x1="52" y1="116" x2="90" y2="110" stroke="#333"/><line x1="200" y1="80" x2="500" y2="85" stroke="#333"/><line x1="410" y1="90" x2="500" y2="125" stroke="#333"/><line x1="600" y1="105" x2="645" y2="105" stroke="#333"/></svg>`)}
    ${detailBlock('7. Interpretació i errors habituals', `<p>El terme <b>i · t</b> fa que la persiana pugi encara que sigui de nit o no hi hagi llum exterior, perquè l’enunciat diu “independentment de la llum exterior o el mode nocturn”.</p>${checklistHtml(['Posar n en comptes de ¬n en la primera condició.','Oblidar que “no és alta” significa ¬t.','Unir condicions alternatives amb AND en comptes d’OR.'])}`)}
    ${similarBlock('Dissenya un sistema que encengui un ventilador si la temperatura és alta i hi ha presència, o bé si la humitat és alta i el mode automàtic està activat.')}
  `);
}

function res(title, inner){ return `<section class="result" id="printableResult"><h2>Resolució guiada d’exercici</h2><p><b>Tipus:</b> ${title}</p><p class="small"><b>Mode explicació ampliada:</b> la resolució separa lectura, dades, fórmula, càlcul, interpretació i errors habituals.</p><div class="steps">${inner}</div></section>`; }
function err(msg){ return `<div class="bad"><b>Error didàctic:</b> ${msg}</div>`; }
function copyResult(){ const t=$('#result')?.innerText||''; navigator.clipboard?.writeText(t); alert('Resolució copiada.'); }
function saveCurrentFromResult(){ const title=$('#exerciseSelect')?.selectedOptions?.[0]?.textContent || 'Exercici'; const content=$('#result')?.innerText || ''; saveCurrent(title, content); }
function saveCurrent(title, content){ if(!content.trim()){alert('Primer cal generar una resolució.'); return;} const h=JSON.parse(localStorage.getItem(LS)||'[]'); h.unshift({title, content, date:new Date().toLocaleString('ca-ES')}); localStorage.setItem(LS, JSON.stringify(h.slice(0,80))); alert('Guardat a l’historial.'); }
function historial(){ const h=JSON.parse(localStorage.getItem(LS)||'[]'); app.innerHTML=`<section class="card"><h2>Historial</h2><div class="btnrow no-print"><button class="secondary" onclick="localStorage.removeItem(LS);historial()">Esborrar tot</button></div>${h.length? h.map((x,i)=>`<article class="card"><h3>${esc(x.title)}</h3><p class="small">${esc(x.date)}</p><pre style="white-space:pre-wrap;font-family:inherit">${esc(x.content)}</pre><div class="btnrow no-print"><button class="secondary" onclick="navigator.clipboard.writeText(${JSON.stringify(x.content)})">Copiar</button><button class="secondary" onclick="deleteHist(${i})">Esborrar</button></div></article>`).join(''):'<p>No hi ha exercicis guardats.</p>'}</section>`; }
function deleteHist(i){ const h=JSON.parse(localStorage.getItem(LS)||'[]'); h.splice(i,1); localStorage.setItem(LS, JSON.stringify(h)); historial(); }

const calculatorInfo = [
  {key:'ohm', title:'Llei d’Ohm i potència', bloc:'Electricitat', desc:'Calcula intensitat i potència a partir de tensió i resistència.'},
  {key:'ca', title:'Valor eficaç i valor màxim', bloc:'Corrent altern', desc:'Passa de valors eficaços a valors màxims sinusoidals.'},
  {key:'rl', title:'Circuit RL sèrie', bloc:'Corrent altern', desc:'Calcula reactància inductiva, impedància i intensitat.'},
  {key:'trifasica', title:'Trifàsica bàsica', bloc:'Sistemes trifàsics', desc:'Calcula potència aparent, activa i reactiva.'},
  {key:'motor', title:'Motor: parell i rendiment', bloc:'Màquines elèctriques', desc:'Calcula velocitat angular, parell i rendiment.'},
  {key:'elevador', title:'Elevador i transmissió', bloc:'Mecanismes', desc:'Calcula potències, voltes de cargol i relació de transmissió.'},
  {key:'calor', title:'Calor i combustible', bloc:'Energia tèrmica', desc:'Calcula calor útil, massa de gas, temps i autonomia.'},
  {key:'pneumatica', title:'Cilindre pneumàtic', bloc:'Pneumàtica', desc:'Calcula força, velocitat i temps de recorregut.'},
  {key:'logica', title:'Taula de veritat i portes', bloc:'Lògica digital', desc:'Genera funció lògica, taula de veritat i diagrama.'}
];

function calculadores(){
  app.innerHTML = `<section class="card"><h2>Calculadores tècniques</h2><p class="small">Aquest apartat és independent dels exercicis PAU. Serveix per fer càlculs ràpids, però manté explicació de fórmula, unitats i errors habituals.</p><div class="field"><label>Cercar calculadora</label><input id="calcSearch" placeholder="Ex.: ohm, motor, trifàsica, pneumàtica..." oninput="renderCalculatorCards(this.value)"></div><div id="calculatorCards" class="grid"></div><div id="calculatorPanel"></div></section>`;
  renderCalculatorCards();
}

function renderCalculatorCards(filter=''){
  const el = document.getElementById('calculatorCards');
  if(!el) return;
  const q = String(filter || '').trim().toLowerCase();
  const cards = calculatorInfo.filter(c => !q || `${c.title} ${c.bloc} ${c.desc}`.toLowerCase().includes(q));
  el.innerHTML = cards.map(c => `<article class="card exercise-card"><p class="pill">${esc(c.bloc)}</p><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><button class="primary" onclick="renderCalculator('${c.key}')">Obrir calculadora</button></article>`).join('') || '<div class="notice">No s’ha trobat cap calculadora amb aquest filtre.</div>';
}

function renderCalculator(key){
  const ex = exercises[key];
  const panel = document.getElementById('calculatorPanel');
  if(!ex || !panel) return;
  panel.innerHTML = `<section class="card" id="calculatorForm"><h2>${esc(ex.title)}</h2><p class="small"><b>Mode calculadora:</b> pots modificar les dades i obtenir el càlcul amb procediment. No cal triar cap exercici PAU.</p>${ex.fields.length ? ex.fields.map(f=>`<div class="field"><label>${f[1]} <span class="muted">(${f[2]})</span></label><input id="${f[0]}" inputmode="decimal" value="${f[3]}"></div>`).join('') : '<p>Aquesta calculadora no necessita dades inicials: genera directament la taula de veritat i el diagrama.</p>'}<div class="btnrow no-print"><button class="primary" onclick="solveCalculator('${key}')">Calcular amb explicació</button><button class="secondary" onclick="document.getElementById('calcResult').innerHTML=''">Netejar resultat</button><button class="secondary" onclick="window.print()">Imprimir</button></div><div id="calcResult"></div></section>`;
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function solveCalculator(key){
  const ex = exercises[key];
  if(!ex) return;
  const html = ex.solve();
  const r = document.getElementById('calcResult');
  if(r) r.innerHTML = html + `<div class="btnrow no-print"><button class="secondary" onclick="navigator.clipboard.writeText(document.getElementById('calcResult').innerText)">Copiar càlcul</button><button class="secondary" onclick="saveCurrent('${esc(ex.title)}', document.getElementById('calcResult').innerText)">Guardar a l’historial</button></div>`;
}
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


// Exposa funcions per als botons generats dinamicament i evita problemes amb handlers inline en alguns navegadors.
Object.assign(window, {
  setView, openExercise, renderExerciseCards, renderExerciseForm, solveSelected,
  renderPauBank, openPauItem, renderPauDetail, setPauRole, showPauHint, showPauSolution, checkPauStep, finishPauActivity, printClassSheet, renderTest, checkTest, copyResult, saveCurrent, saveCurrentFromResult, renderCalculatorCards, renderCalculator, solveCalculator,
  historial, deleteHist, generatePractice, checkPractice
});
