# Optimizador ATS de CV

Aplicación web que permite cargar un CV en PDF, pegar la descripción de una vacante y recibir en segundos un análisis de compatibilidad con sistemas de seguimiento de candidatos (ATS), junto con recomendaciones accionables de mejora.

El producto usa la IA de Google Gemini para extraer datos del CV, compararlos contra la descripción del puesto y generar una evaluación cuantitativa y cualitativa.

## Características

- Subida de CV en PDF (hasta 10MB) con validación de tipo y tamaño.
- Análisis con IA (Gemini) que puntúa el CV por dimensiones (habilidades, experiencia, educación, estructura).
- **Desglose por apartados**: el CV se divide en secciones (encabezado, resumen, habilidades, experiencia, educación, certificaciones, formato) y cada una indica su estado (`ok` / `improve` / `critical`) con instrucciones concretas de dónde corregir y qué colocar.
- **Extracción Markdown**: el PDF se convierte a Markdown estructurado (encabezados por sección) en el servidor antes de enviarlo a Gemini, para un input más limpio y de menor consumo.
- **Medición de consumo de Gemini**: por cada consulta se miden los tokens usados, se valida el tamaño del prompt antes de enviar y se persiste un historial para comparar qué CVs consumen más/menos.
- Progreso en tiempo real vía Server-Sent Events (SSE).
- Tema claro/oscuro persistente.
- Hasta 3 claves API de Gemini con rotación automática y reintento ante límite de cuota.

> Nota de producto: la herramienta **no** genera ni descarga un CV optimizado. Su valor está en guiar al usuario sobre qué apartado del documento corregir y cómo redactarlo, todo en función de los filtros ATS.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, componentes propios + shadcn/ui
- **Estilos**: Tailwind CSS v4, `tw-animate-css`, CVA
- **Extracción PDF**: `pdf-parse` (server-only)
- **IA**: Google Gemini (`@google/generative-ai`, endpoints REST v1beta)
- **Deploy**: Railway (Nixpacks)

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env.local` y completa las claves:

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Clave principal de Gemini |
| `GEMINI_API_KEY_2` | Clave secundaria (fallback) |
| `GEMINI_API_KEY_3` | Clave terciaria (fallback) |
| `GEMINI_MODEL` | Modelo a usar (default: `gemini-3.1-flash-lite`) |

Las claves viven solo en el servidor; el PDF se procesa en memoria y no se persiste.

## Scripts

```bash
pnpm dev       # servidor de desarrollo
pnpm build     # build de producción
pnpm start     # servidor de producción
pnpm lint      # ESLint
```

## Documentación

El plan de producto y la arquitectura detallada están en [PRD.md](./PRD.md).
