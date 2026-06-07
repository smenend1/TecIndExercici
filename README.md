# Tecnologia Industrial Exercicis Plus v14 · Mode examen i dossiers imprimibles

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v14

La v14 afegeix una capa d'ús d'aula i preparació d'examen sobre el banc PAU ja verificat a la v13:

- pestanya nova **Examen**;
- generador de proves PAU per filtres;
- temporitzador d'examen;
- impressió de prova d'alumne;
- impressió de solucionari docent;
- informe de revisió de la prova generada;
- generador de dossiers imprimibles per any, sèrie, matèria, tema o estat de verificació.

## Contingut conservat

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciats textuals i pàgines originals PNG integrades.
- Resolucions per passos.
- Mode alumne i mode docent.
- Estat de verificació de cada fitxa.
- Calculadores, exercicis guiats, formulari i historial.
- Funcionament offline amb Service Worker.

## Ús recomanat

### Mode examen

1. Obre la pestanya **Examen**.
2. Filtra per matèria, any, sèrie, tema o estat de verificació.
3. Tria el nombre d'exercicis i el temps recomanat.
4. Genera la prova.
5. Imprimeix la versió d'alumne o la versió amb solucions.

### Dossiers imprimibles

1. Escull un tema, any o sèrie.
2. Defineix el màxim de fitxes.
3. Crea un dossier d'alumne o docent.
4. Imprimeix-lo o guarda'n el resum a l'historial.

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

La v14 millora la preparació d'exàmens i dossiers, però les fitxes marcades com a **guiat amb figura** o **revisió docent pendent** encara poden requerir revisió manual abans d'usar-les com a solucionari oficial.
