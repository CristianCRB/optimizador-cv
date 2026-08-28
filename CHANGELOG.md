# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.
El formato sigue el de [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).

---

## [Unreleased]

### Añadido
- Desglose del CV por apartados (segmentos): cada sección (encabezado, resumen, habilidades, experiencia, educación, certificaciones, formato) reporta su estado (`ok` / `improve` / `critical`), qué se detectó, fortalezas, problemas e instrucciones concretas de dónde corregir y qué colocar, en base a filtros ATS.
- Extracción Markdown estructurado del PDF en el servidor: se detectan los encabezados de sección y se marcan con `##`, y se convierten viñetas en listas, antes de enviar a Gemini.
- Detección de PDFs escaneados (sin capa de texto seleccionable) con mensaje de error amigable.
- Medición del consumo de Gemini por consulta vía `usageMetadata`: tokens de entrada, salida, total y modelo.
- Validación del tamaño del prompt antes de enviar a Gemini: heurística local (~4 chars/token) + medición precisa con `countTokens` solo cuando el prompt es grande.
- Persistencia del historial de consumos en el navegador (`localStorage`) y panel que resume el consumo de cada consulta y de la sesión (CV más pesado y más óptimo en tokens, promedio, total).
- `countTokens` reutiliza la rotación de claves y falla de forma segura a la heurística.

### Corregido
- Error de ESLint `react-hooks/set-state-in-effect` en `theme-toggle.tsx`: la inicialización del tema ahora lee `localStorage` de forma perezosa en el `useState`.
- Bug de parseo SSE: los eventos podían llegar partidos entre chunks de red y romper el `JSON.parse`. Ahora se acumulan en un buffer y se procesan eventos completos delimitados por `\n\n`.
- Rotación de API keys reactivada (antes solo se usaba `keys[0]`), cumpliendo el fallback multi-key del PRD.
- Se eliminó un log de depuración que filtraba el prefijo de la API key.
- Se eliminó código muerto (`parseResumeText`, `extractSection`, `extractContactInfo`, tipo `ParsedResume`).
- `clampScore` ahora devuelve `0` ante `NaN`/valores no numéricos.

### Cambiado
- .env.example alineado al modelo default real (`gemini-3.1-flash-lite`) y theme-color unificado a los valores de `globals.css`.
- Pipeline de `route.ts`: el texto extraído ahora se pasa como Markdown estructurado y el evento `done` incluye metadata de consumo (usage, tokens contados, caracteres).
- `cv-evaluation.ts`: el prompt indica que el CV llega en Markdown y que use los encabezados `##` para ubicar los apartados; la función ahora devuelve también el `usage` y el `countedPromptTokens`.

### Documentación
- `README.md` reemplazado (era el boilerplate de create-next-app) por documentación real del proyecto.
- `PRD.md` actualizado con las funcionalidades F11/F12, modelo de datos y pila técnica.

### Eliminado
- Idea de producto de "descarga de CV optimizado": se descarta; el valor está en guiar al usuario sobre qué apartado corregir y cómo redactarlo (enfoque por segmentos), documentado en el PRD.

---

## [0.1.0] - 2026-08-27

- Implementación inicial del MVP del Optimizador ATS (afinado en iteraciones previas): subida de PDF, análisis con Gemini vía SSE, pantalla de resultados, tema claro/oscuro, marca y animaciones.
