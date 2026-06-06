'use strict';

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const app = $('#app');
const LS = 'ti_exercicis_plus_historial_v6';
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
  app.innerHTML = `<section class="card"><h2>Banc PAU ampliat</h2><p>Opció B: tots els exercicis identificats dels PDF pujats s’han convertit en fitxes didàctiques. Alguns tenen calculadora automàtica; altres són fitxes per treballar per parts amb l’esquema del PDF.</p><div class="grid"><div class="field"><label>Matèria</label><select id="bankMateria" onchange="renderPauBank()"><option value="">Totes</option><option>Tecnologia i enginyeria</option><option>Electrotècnia</option></select></div><div class="field"><label>Bloc o paraula clau</label><input id="bankSearch" placeholder="Ex.: motor, trifàsica, rectificador..." oninput="renderPauBank()"></div><div class="field"><label>Mode</label><select id="bankMode" onchange="renderPauBank()"><option value="">Tots</option><option value="test">Test</option><option value="calculadora">Amb calculadora</option><option value="fitxa">Fitxa per parts</option></select></div></div><div class="btnrow no-print"><button class="secondary" onclick="renderTest()">Obrir test autocorregible</button><button class="secondary" onclick="setView('exercicis')">Exercicis resolubles</button><button class="secondary" onclick="setView('calculadores')">Calculadores</button></div><div id="pauArea"></div></section><section class="card"><h2>Fitxes del banc</h2><div id="pauBankStats" class="small"></div><div id="pauBankCards" class="grid"></div></section>`;
  renderPauBank();
}


function renderPauBank(){
  const materia = document.getElementById('bankMateria')?.value || '';
  const q = (document.getElementById('bankSearch')?.value || '').toLowerCase().trim();
  const mode = document.getElementById('bankMode')?.value || '';
  let items = pauBank.filter(x => !materia || x.materia === materia);
  if(mode){
    items = items.filter(x => mode === 'calculadora' ? !!x.enllac : (mode === 'fitxa' ? !x.enllac && x.tipus !== 'test' : x.tipus.includes(mode)));
  }
  if(q){
    items = items.filter(x => `${x.any} ${x.materia} ${x.serie} ${x.exercici} ${x.bloc} ${x.titol} ${x.resum} ${x.tipus}`.toLowerCase().includes(q));
  }
  const stats = document.getElementById('pauBankStats');
  if(stats) stats.innerHTML = `<p><b>${items.length}</b> fitxes mostrades de <b>${pauBank.length}</b>. Tecnologia i enginyeria: ${pauBank.filter(x=>x.materia==='Tecnologia i enginyeria').length}. Electrotècnia: ${pauBank.filter(x=>x.materia==='Electrotècnia').length}.</p>`;
  const el = document.getElementById('pauBankCards');
  if(!el) return;
  el.innerHTML = items.map(x => `<article class="card"><p><span class="pill">${esc(x.any)}</span> <span class="pill">${esc(x.materia)}</span> <span class="pill">${esc(x.serie)}</span></p><h3>${esc(x.exercici)} · ${esc(x.titol)}</h3><p><b>${esc(x.bloc)}</b> · ${esc(x.tipus)} · ${esc(x.nivell)}</p><p>${esc(x.resum)}</p><div class="btnrow"><button class="primary" onclick="openPauItem('${x.id}')">Treballar per parts</button>${x.enllac?`<button class="secondary" onclick="openExercise('${x.enllac}')">Obrir calculadora associada</button>`:''}</div></article>`).join('') || '<div class="notice">No hi ha fitxes amb aquest filtre.</div>';
}

function openPauItem(id){
  const x = pauBank.find(p => p.id === id);
  if(!x) return;
  const html = renderPauDetail(x);
  const area = document.getElementById('pauArea');
  if(area){ area.innerHTML = html; area.scrollIntoView({behavior:'smooth', block:'start'}); }
}

function renderPauDetail(x){
  const list = arr => `<ul>${(arr||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;
  return `<section class="card"><h2>${esc(x.exercici)} · ${esc(x.titol)}</h2><p><span class="pill">${esc(x.any)}</span> <span class="pill">${esc(x.materia)}</span> <span class="pill">${esc(x.serie)}</span> <span class="pill">${esc(x.bloc)}</span></p><p>${esc(x.resum)}</p><details class="explain" open><summary>1. Lectura de l’exercici</summary><p>Aquesta fitxa no copia el PDF: el transforma en un guió didàctic per treballar a classe. L’objectiu és entendre què demana, separar dades, triar fórmules i resoldre per apartats.</p></details><details class="explain" open><summary>2. Apartats que cal resoldre</summary>${list(x.apartats)}</details><details class="explain"><summary>3. Dades principals</summary>${list(x.dades)}</details><details class="explain"><summary>4. Fórmules i idees clau</summary>${list(x.formules)}</details><details class="explain"><summary>5. Pistes graduades</summary>${list(x.pistes)}</details><details class="explain"><summary>6. Resolució orientativa</summary><p>${esc(x.resolucio)}</p>${x.enllac?`<p><button class="primary" onclick="openExercise('${x.enllac}')">Obrir resolutor amb dades modificables</button></p>`:'<p class="notice">Aquesta fitxa depèn molt de l’esquema o de la figura del PDF. Per això queda com a guió per parts, no com a calculadora automàtica completa.</p>'}</details><details class="explain"><summary>7. Errors habituals</summary>${list(x.errors)}</details><div class="btnrow no-print"><button class="secondary" onclick="navigator.clipboard.writeText(document.getElementById('pauArea').innerText)">Copiar fitxa</button><button class="secondary" onclick="saveCurrent('${esc(x.exercici+' · '+x.titol)}', document.getElementById('pauArea').innerText)">Guardar a l’historial</button><button class="secondary" onclick="window.print()">Imprimir</button></div></section>`;
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
  renderPauBank, openPauItem, renderPauDetail, renderTest, checkTest, copyResult, saveCurrent, saveCurrentFromResult, renderCalculatorCards, renderCalculator, solveCalculator,
  historial, deleteHist, generatePractice, checkPractice
});
