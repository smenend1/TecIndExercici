# Tecnologia Industrial Exercicis Plus v10.1

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia. Aquesta versió parteix de la v10 i corregeix la documentació del projecte, que havia quedat amb el títol antic de la v7.

## Estat de la versió

- Versió: v10.1
- Línia de treball: Banc PAU multiany amb buidatge textual dels PDF pujats
- Funcionament: HTML, CSS i JavaScript vanilla
- Instal·lable com a PWA
- Preparada per GitHub Pages
- Funcionament offline després de la primera càrrega
- Sense React, Vue, jQuery ni dependències de servidor

## Fitxers inclosos

```text
/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
├── README.md
├── pau_v10_entries.json
└── assets/
    ├── icon-192.png
    └── icon-512.png
```

## Novetats acumulades fins a v10.1

### v7 · Mode aula

- Mode alumne i mode docent.
- Resolució per passos amb pistes, comprovació i solució gradual.
- Fitxa imprimible per a l'alumne amb espais de resposta.
- Fitxa imprimible del docent amb solucions orientatives.
- Criteris orientatius de correcció per a cada fitxa PAU.

### v8 · Enunciats visibles

- Enunciats de treball visibles en totes les fitxes PAU.
- Mode alumne i docent amb l'enunciat abans dels passos.
- Fitxes imprimibles amb enunciat, apartats, dades, pistes i solucions orientatives.

### v9 · Banc PAU multiany

- Selectors per matèria, any, sèrie, bloc o paraula clau i tipus.
- Incorporació de fitxes PAU classificades de diversos anys.
- Banc consultable per temes.

### v9.1 · Impressió corregida

- Correcció de la impressió de fitxes PAU.
- En imprimir, només surt la fitxa seleccionada i no la resta de targetes visibles de la pàgina.

### v10 · Buidatge total textual

- Buidatge textual dels exercicis detectats als PDF únics pujats.
- Banc amb fitxes de 2021, 2022, 2023, 2024 i 2025.
- Fitxes amb any, matèria, sèrie, exercici, bloc, tipus, enunciat textual, apartats, dades principals, fórmules o idees clau, pistes, errors habituals i mode alumne/docent.

### v10.1 · Sanejament de fitxers

- README actualitzat correctament a v10.1.
- `manifest.json` revisat i amb contingut vàlid.
- `sw.js` actualitzat amb memòria cau v10.1.
- Rutes relatives revisades per GitHub Pages.

## Manifest PWA

El fitxer `manifest.json` no ha d'estar buit. Ha de contenir les dades bàsiques de la PWA: nom, nom curt, descripció, `start_url`, mode de visualització, colors i icones.

Si a GitHub apareix amb 0 bytes, elimina'l del repositori i torna'l a pujar des d'aquest ZIP.

## Service Worker i memòria cau

El Service Worker usa una memòria cau pròpia de la versió v10.1. Si després de pujar la nova versió el mòbil continua mostrant una versió antiga:

1. Obre la configuració del navegador.
2. Esborra les dades del lloc web.
3. Torna a carregar la pàgina.
4. Si cal, desinstal·la la PWA i torna-la a instal·lar.

## Desplegament a GitHub Pages

1. Descomprimeix el ZIP.
2. Puja tots els fitxers i carpetes al repositori.
3. Comprova que `index.html`, `app.js`, `styles.css`, `manifest.json` i `sw.js` siguin a l'arrel.
4. Comprova que `assets/icon-192.png` i `assets/icon-512.png` existeixin.
5. Activa GitHub Pages des de la branca corresponent.

## Limitacions conegudes

- Els exercicis amb figures, esquemes, gràfics, circuits o oscil·loscopis estan buidats textualment, però les imatges originals encara no estan incrustades dins la PWA.
- Alguns exercicis són fitxes guiades i no resolutors automàtics complets.
- La fase següent recomanada és una v11 amb figures integrades i activitats visuals.
