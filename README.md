# Tecnologia Industrial Exercicis Plus v16 · Mode docent i gestió d’aula

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v16

La v16 incorpora una mirada explícitament docent. L’aplicació ja no està pensada només com a entrenament individual de l’alumnat, sinó també com a eina per preparar, conduir i corregir classes.

La pestanya nova **Docent** permet:

- preparar una sessió de 45, 60 o 90 minuts;
- filtrar fitxes PAU per matèria, any, tema i estat de verificació;
- seleccionar les fitxes que es volen treballar;
- generar un pla de classe imprimible;
- crear un dossier d’alumne sense solucions;
- crear un solucionari docent amb criteris de correcció;
- guardar localment les sessions preparades;
- enganxar exportacions JSON de progrés dels alumnes i obtenir una lectura global del grup.

Tot continua funcionant sense servidor. Les dades docents i de progrés es guarden localment al navegador amb `localStorage`.

## Flux docent recomanat

### Abans de classe

1. Obre la pestanya **Docent**.
2. Tria durada, grup, matèria, any i tema.
3. Selecciona les fitxes PAU que vols treballar.
4. Genera el **pla de classe**.
5. Imprimeix el dossier d’alumne o el solucionari docent.

### Durant la classe

1. Projecta l’enunciat o la figura de la fitxa.
2. Treballa en **mode alumne** perquè no aparegui tota la solució de cop.
3. Demana a l’alumnat que resolgui per passos: dades, unitats, fórmula, substitució, càlcul i interpretació.
4. Canvia a **mode docent** per comentar la resposta model i els criteris.

### Després de classe

1. L’alumnat pot exportar el seu progrés des de la pestanya **Progrés**.
2. El docent pot enganxar aquests JSON a la pestanya **Docent**.
3. La PWA mostra una lectura global de temes forts i temes a reforçar.

## Contingut conservat de versions anteriors

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciats textuals i pàgines originals PNG integrades.
- Resolucions per passos.
- Mode alumne i mode docent.
- Estat de verificació de cada fitxa.
- Solucions formatades de la v14.1.
- Mode examen PAU i dossiers imprimibles.
- Correcció orientativa i seguiment local de la v15.
- Calculadores, exercicis guiats, formulari i historial.
- Funcionament offline amb Service Worker.

## Pestanyes principals

- **Inici**: presentació i accessos ràpids.
- **PAU**: banc complet de fitxes PAU.
- **Examen**: generació de proves i dossiers.
- **Docent**: planificació de classe, dossiers, solucionaris i seguiment de grup.
- **Progrés**: seguiment local de l’alumne.
- **Exercicis**: exercicis resolubles amb dades modificables.
- **Calculadores**: eines tècniques ràpides.
- **Pràctica**: entrenament autocorregible.
- **Formulari**: fórmules agrupades.
- **Historial**: resolucions guardades.

## Fitxers

```text
index.html
styles.css
app.js
manifest.json
sw.js
README.md
pau_v10_entries.json
pau_figures_map.json
assets/
  icon-192.png
  icon-512.png
  pau_pages/*.png
```

## Desplegament a GitHub Pages

1. Descomprimeix el ZIP.
2. Puja tots els fitxers i carpetes al repositori.
3. Activa GitHub Pages des de `Settings > Pages`.
4. Si el navegador mostra una versió antiga, esborra les dades del lloc o força l’actualització del Service Worker.

## Limitació honesta

La pestanya **Docent** ajuda a planificar i corregir, però no substitueix el criteri professional del professorat. La correcció automàtica continua sent orientativa, especialment en exercicis amb figures, circuits, gràfics o lectures visuals.
