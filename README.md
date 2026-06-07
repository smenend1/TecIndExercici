# Tecnologia Industrial Exercicis Plus v11.1 · figures integrades en PNG

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v11.1

La v11.1 manté el buidatge textual total de la v10.1 i afegeix una capa visual: cada fitxa PAU incorpora les **pàgines originals del PDF renderitzades com a imatge PNG**. Això permet veure figures, esquemes, circuits, taules, gràfics i pantalles d'oscil·loscopi que no es poden reproduir bé només amb text.

## Contingut

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciat textual complet quan el PDF ho permet.
- Pàgines originals del PDF associades a cada exercici.
- Mode alumne amb passos, pistes i comprovació.
- Mode docent amb solució orientativa i criteris.
- Fitxa imprimible amb enunciat i pàgines originals.
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
3. Activa GitHub Pages des de la branca corresponent.
4. Després d'actualitzar des d'una versió anterior, esborra dades del lloc o força actualització perquè el Service Worker antic no quedi en memòria cau.

## Notes sobre les figures

Les imatges de `assets/pau_pages/` són pàgines originals renderitzades dels PDF pujats. S'han inclòs a baixa resolució suficient per consulta i impressió bàsica, per mantenir el ZIP raonable.

Aquesta versió no redibuixa encara els circuits en SVG ni resol automàticament tots els exercicis amb figura. Els mostra dins la fitxa perquè es puguin treballar a classe. Una futura v12 podria convertir alguns circuits i esquemes en activitats visuals interactives.

## Versions recents

- v7: mode aula i correcció per passos.
- v8: enunciats visibles a les fitxes PAU.
- v9: banc PAU multiany.
- v9.1: correcció d'impressió de fitxes.
- v10: buidatge textual total dels PDF únics.
- v10.1: sanejament de README, manifest i Service Worker.
- v11: integració de pàgines originals del PDF amb figures.
- v11.1: conversió de totes les figures de WEBP a PNG per compatibilitat amb GitHub Pages.
