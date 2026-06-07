# Tecnologia Industrial Exercicis Plus v13 · Verificació i qualitat docent

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v13

La v13 no afegeix més volum de PDFs. Millora la qualitat docent del banc existent:

- estat de verificació a cada fitxa PAU;
- filtre per estat de verificació;
- panell de control de qualitat del banc;
- solucionari docent ampliat;
- criteris de correcció per fitxa;
- resposta mínima acceptable i resposta excel·lent;
- comprovació millorada de respostes de l’alumne amb paraules clau, valors numèrics i unitats;
- fitxa imprimible alumne/docent amb estat de verificació i criteris.

## Estats de verificació

- **Automatitzable amb calculadora**: té resolutor associat amb dades modificables.
- **Guiat amb figura**: depèn de figura, circuit, gràfic, oscil·loscopi o cotes visuals.
- **Resolt textualment**: té resolució pas a pas textual i és adequat per treball guiat.
- **Revisió docent pendent**: cal revisar o completar abans d’avaluació formal.

## Contingut conservat de versions anteriors

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciats textuals i pàgines originals PNG integrades.
- Mode alumne amb passos, pistes, comprovació i solució del pas.
- Mode docent amb criteris i fitxes imprimibles.
- Calculadores i resolutors guiats.
- Formulari tècnic.
- Historial amb localStorage.
- Funcionament offline amb Service Worker.

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

La v13 millora el control de qualitat i la correcció docent, però no garanteix que totes les respostes numèriques hagin estat verificades manualment contra un solucionari oficial. Les fitxes marcades com a **guiat amb figura** o **revisió docent pendent** s’han de revisar abans d’utilitzar-les com a solucionari definitiu.
