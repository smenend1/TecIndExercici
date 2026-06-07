# Tecnologia Industrial Exercicis Plus v17

PWA educativa en català per treballar exercicis de Tecnologia Industrial, Tecnologia i Enginyeria i Electrotècnia de PAU.

## Novetat principal de la v17

La v17 afegeix una capa d'**auditoria docent i verificació del banc PAU**. L'objectiu és ajudar el professorat a distingir entre fitxes que es poden usar directament, fitxes que depenen de figures, fitxes amb resolució orientativa i fitxes que requereixen revisió abans d'una prova o un dossier.

## Funcions destacades

- Banc PAU multiany amb enunciats, figures, passos i solucions orientatives.
- Exercicis resolubles amb calculadora i explicació pas a pas.
- Mode alumne i mode docent.
- Mode examen i generador de dossiers.
- Seguiment local del progrés de l'alumnat.
- Pestanya Docent per preparar sessions, dossiers i solucionaris.
- Pestanya Auditoria per revisar la qualitat del banc.

## Pestanya Auditoria

Permet:

- Veure el recompte de fitxes per estat.
- Filtrar per matèria, any, estat i paraula clau.
- Marcar una fitxa com a verificada pel docent.
- Afegir notes locals de revisió.
- Imprimir un informe d'auditoria.
- Exportar la revisió en JSON.

Els estats disponibles són:

- Verificat pel docent.
- Connectat a calculadora.
- Depèn de figura.
- Resolució orientativa.
- Revisió docent pendent.
- Cal millorar enunciat.
- Cal revisar resultat.

## Important

Les marques de verificació són locals del navegador i es guarden amb `localStorage`. No s'envien dades a cap servidor.

## Desplegament a GitHub Pages

Puja tots els fitxers i carpetes del ZIP al repositori. Després activa GitHub Pages des de la branca corresponent. Si el navegador mostra una versió anterior, elimina les dades del lloc o força la recàrrega perquè el Service Worker pot mantenir fitxers antics.

## Fitxers principals

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `sw.js`
- `pau_v10_entries.json`
- `pau_figures_map.json`
- `assets/`

## Limitació honesta

La v17 millora el control de qualitat, però no converteix automàticament totes les solucions orientatives en solucionaris numèrics verificats. Per a ús avaluatiu, el docent ha de revisar i marcar les fitxes com a verificades.
