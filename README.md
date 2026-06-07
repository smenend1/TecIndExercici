# Tecnologia Industrial Exercicis Plus v12.1 · PAU resolt pas a pas ampliat

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v12.1

La v12.1 continua la v12 i amplia la resolució pas a pas del banc PAU als exercicis de **2023, 2022 i 2021**.

Ara el botó **PAU** ofereix, per a totes les fitxes del banc, una estructura de treball amb:

- què demana l’exercici;
- dades i unitats;
- fórmules o principis;
- desenvolupament per apartats;
- interpretació tècnica;
- errors habituals i criteris de correcció.

## Estat de les resolucions

- **v12 resolt pas a pas**: resolució numèrica o lògica detallada incorporada a 2025 i 2024.
- **v12.1 resolt pas a pas**: resolució docent incorporada als exercicis de 2023, 2022 i 2021.
- **v12.1 resolt/guiat amb figura**: exercici amb figura, circuit, gràfic, estructura o oscil·loscopi. La fitxa dona el procediment complet, però indica quan cal llegir una dada directament a la imatge original integrada.

## Contingut

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

La v12.1 no converteix tots els circuits, gràfics o esquemes en calculadores automàtiques. Els exercicis amb figura tenen el procediment pas a pas i la pàgina original integrada, però alguns resultats exigeixen llegir una cota, una escala o una dada visual del PDF. La fase següent podria convertir alguns d’aquests casos en activitats interactives específiques.
