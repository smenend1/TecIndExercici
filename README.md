# Tecnologia Industrial Exercicis Plus v15 · Correcció intel·ligent i seguiment local

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v15

La v15 converteix l'aplicació en un entrenador més personalitzat:

- pestanya nova **Progrés**;
- seguiment local dels passos comprovats per l'alumne;
- puntuació orientativa per pas;
- detecció bàsica de paraules clau, valors numèrics compatibles i possibles problemes d'unitats;
- recomanacions automàtiques de repàs segons els errors registrats;
- proposta de fitxes PAU per reforçar els temes febles;
- generador d'exercicis similars relacionats amb els temes a millorar;
- exportació del progrés local en JSON.

Tot el seguiment es guarda amb `localStorage` al navegador de l'usuari. No hi ha servidor i no s'envien dades fora del dispositiu.

## Contingut conservat de versions anteriors

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciats textuals i pàgines originals PNG integrades.
- Resolucions per passos.
- Mode alumne i mode docent.
- Estat de verificació de cada fitxa.
- Solucions formatades de la v14.1.
- Mode examen PAU i dossiers imprimibles de la v14.
- Calculadores, exercicis guiats, formulari i historial.
- Funcionament offline amb Service Worker.

## Com usar la pestanya Progrés

1. Obre una fitxa PAU en **mode alumne**.
2. Escriu una resposta en algun pas.
3. Prem **Comprovar aquest pas**.
4. La PWA donarà una valoració orientativa i desarà l'intent localment.
5. Entra a **Progrés** per veure:
   - mitjana local;
   - temes treballats;
   - temes que cal reforçar;
   - recomanacions;
   - exercicis PAU per repassar;
   - exercicis similars generats.

## Mode examen i dossiers

La pestanya **Examen** permet generar proves PAU filtrades per matèria, any, sèrie, tema o estat de verificació. Es poden imprimir en versió alumne o docent amb solucionari.

Els dossiers permeten crear reculls per tema o any, útils per preparar classes, deures o repàs final.

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
4. Si el navegador mostra una versió antiga, esborra les dades del lloc o força l'actualització del Service Worker.

## Limitació honesta

La correcció de la v15 és orientativa. Ajuda a detectar si l'alumne inclou idees, valors i unitats raonables, però no substitueix una revisió docent completa, sobretot en exercicis amb figures, circuits, gràfics o lectures visuals.

## Control de qualitat recomanat

Abans d'usar l'app com a solucionari oficial, revisa manualment les fitxes marcades com a **guiat amb figura** o **revisió docent pendent**.
