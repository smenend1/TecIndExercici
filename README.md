# Tecnologia Industrial Exercicis Plus v12 · PAU resolt pas a pas

PWA educativa en català per treballar exercicis tipus PAU de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia.

## Novetat principal de la v12

La v12 manté el banc PAU multiany, el buidatge textual i les figures PNG de la v11.1, i afegeix una capa de **resolució docent pas a pas**. Aquesta primera fase de resolució completa se centra en:

- Tecnologia i Enginyeria 2025 · Sèrie 1.
- Tecnologia i Enginyeria 2024 · Sèries 1 i 5.

Els exercicis de 2023, 2022 i 2021 continuen inclosos amb enunciat, figures, pistes i mode per passos, però queden marcats com a pendents de resolució completa en una fase posterior.

## Contingut

- Banc PAU multiany: 2021, 2022, 2023, 2024 i 2025.
- 52 fitxes PAU de treball.
- Enunciat textual complet quan el PDF ho permet.
- Pàgines originals del PDF associades a cada exercici en PNG.
- Mode alumne amb passos, pistes, comprovació i solució del pas.
- Mode docent amb resolució pas a pas, criteris i fitxes imprimibles.
- Resolucions completes o guiades detallades per a 2025 i 2024.
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

## Estat de resolució

- **v12 resolt pas a pas**: fitxes amb solució docent incorporada per apartats.
- **pendent de resolució completa en fase següent**: fitxes ja buidades i amb figura, però encara sense solució numèrica completa verificada.

## Desplegament a GitHub Pages

1. Descomprimeix el ZIP.
2. Puja tots els fitxers i carpetes al repositori.
3. Activa GitHub Pages des de `Settings > Pages`.
4. Si el navegador mostra una versió antiga, esborra les dades del lloc o força l'actualització del Service Worker.

## Limitació honesta

La v12 no deixa resolts tots els exercicis de tots els anys. Comença el procés de resolució completa amb 2025 i 2024. Els exercicis amb figures complexes poden tenir procediment detallat però, quan una dada depèn de llegir una cota o gràfic de la imatge, la fitxa ho indica explícitament.
