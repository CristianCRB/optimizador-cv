# PRD — Optimizador ATS de CV

**Producto:** Optimizador ATS
**Versión:** 0.1.0
**Fecha:** 06-08-2026
**Estado:** En desarrollo activo
**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Google Gemini AI

---

## 1. Resumen ejecutivo

El Optimizador ATS es una aplicación web que permite a los candidatos cargar su CV en formato PDF, pegar la descripción de una vacante y recibir en segundos un análisis completo de compatibilidad con sistemas de seguimiento de candidatos (ATS, por sus siglas en inglés), junto con recomendaciones accionables de mejora.

El producto usa la IA de Google Gemini para extraer datos estructurados del CV, compararlos contra la descripción del puesto y generar una evaluación cuantitativa y cualitativa.

---

## 2. Problema

### 2.1 Contexto
- Los sistemas ATS filtran el 75% de los CV de forma automática antes de llegar a un reclutador humano.
- La mayoría de los candidatos desconoce cómo funciona un ATS ni cómo optimizar su CV para superarlo.
- Optimizar un CV manualmente para cada vacante es lento, repetitivo y propenso a errores.

### 2.2 Dolor del usuario

| Dolor | Impacto |
|---|---|
| No saber si el CV pasará el filtro ATS | Rechazo silencioso en la primera etapa |
| No conocer las palabras clave ("keywords") de la vacante | baja puntuación de relevancia |
| Dificultad para cuantificar logros | CV genérico sin impacto |
| No saber por qué fue descartado | Frustración sin feedback |

### 2.3 Propuesta de valor

> Convierte un CV genérico en un CV optimizado para cada vacante en menos de 1 minuto, brindando una puntuación real de compatibilidad ATS y sugerencias concretas de mejora respaldadas por IA.

---

## 3. Usuarios objetivo

### Usuario primario
- **Candidato job seeker** (principalmente LATAM, interfaz en español) que aplica a vacantes técnicas o corporativas y quiere maximizar sus probabilidades de pasar los filtros ATS.

### Usuario secundario
- **Consultores de carreras / orientadores laborales** que usan la herramienta para preparar a sus candidatos.

### No-objetivo (fase actual)
- Reclutadores y empresas.
- Optimización de CV para estándares no-ATS (maquetas de diseño).

---

## 4. Funcionalidades

### 4.1 Fase actual (MVP)

| ID | Funcionalidad | Descripción |
|---|---|---|
| F1 | Subir CV en PDF | Arrastrar y soltar o seleccionar un PDF de hasta 10MB. Validación de tipo y tamaño. |
| F2 | Ingresar descripción de vacante | Área de texto donde el usuario pega la oferta (con contador de caracteres). |
| F3 | Extracción de texto del PDF | Parseo del PDF en el servidor (`pdf-parse`) con limpieza del texto extraído. |
| F4 | Análisis con IA (Gemini) | Evaluación única del CV contra la vacante: puntuaciones, keywords, optimizaciones. |
| F5 | Progreso en tiempo real | Flujo de estados (`extracting` → `evaluating` → `done` / `error`) por SSE (Server-Sent Events). |
| F6 | Pantalla de resultados | 7 contenedores: info del archivo, puntaje general, puntajes por dimensión, datos personales, habilidades, experiencia, educación, sugerencias, optimizaciones ATS, alertas, keywords faltantes, radar de perfil y checklist. |
| F10 | Desglose por apartados (segmentos) | El CV se divide en secciones (encabezado, resumen, habilidades, experiencia, educación, certificaciones, formato). Cada apartado indica su estado (`ok` / `improve` / `critical`), qué se detectó, fortalezas, problemas e **instrucciones concretas de dónde corregir y qué colocar** en el documento — sin generar un archivo nuevo. |
| F11 | Extracción Markdown estructurado | El texto del PDF se convierte a Markdown en el servidor (encabezados `##` por sección y listas) antes de enviarse a Gemini, para un input más limpio y token-eficiente y mejor ubicación de apartados. Detección de PDFs escaneados (sin capa de texto). |
| F12 | Medición y análisis de consumo de Gemini | Por cada consulta se miden tokens de entrada (`usageMetadata`), se valida el tamaño del prompt antes de enviar (`countTokens` + heurística local de 4 chars/token) y se persiste el consumo. Se ofrece un panel que resume el consumo de la consulta actual y un historial de la sesión (CV más pesado y más óptimo en tokens). |
| F7 | Reiniciar / eliminar | Borrar resultado e iniciar un análisis de otro CV. |
| F8 | Tema claro/oscuro | Toggle de tema persistente. |
| F9 | Resiliencia de API | Hasta 3 claves Gemini con rotación automática y reintento exponencial ante límite de cuota (rate limit 429/503). |

### 4.2 Fuera de alcance (fase futura)

- La herramienta **no** genera ni descarga un CV optimizado: el valor está en dar instrucciones precisas al usuario sobre qué apartado corregir y qué redactar (enfoque basado en segmentos). Esta idea de "descarga de CV manipulado" está descartada por decisión de producto.
- Historial de análisis por usuario.
- Autenticación y cuentas.
- Soporte multi-idioma configurable.
- Análisis por lotes de varios CVs.
- Soporte de plantillas DOCX/DOC.

---

## 5. Flujo del usuario

```
[1] Iniciar
      │
      ▼
[2] Subir CV (PDF, ≤10MB)      ←── validación: extensión + tamaño
      │                         ←── arrastrar/soltar o selector de archivo
      ▼
[3] Pegar descripción del puesto  ←── texto libre, contador de caracteres
      │
      ▼
[4] Click "Optimizar CV para esta vacante"  ←── botón desactivado hasta cumplir requisitos
      │
      ▼
[5] Pantalla de procesamiento  ←── SSE: extracción (10-30%) → evaluación IA (40-90%)
      │
      ├── error → pantalla de error con mensaje + intentar de nuevo
      ▼
[6] Pantalla de resultados
      │   1) Info del archivo + fecha
      │   2) Puntaje general (ScoreRing)
      │   3) Puntajes por dimensión (skills, experiencia, educación, estructura)
      │   4) Datos personales + Habilidades detectadas
      │   5) Experiencia laboral + Educación
      │   6) Sugerencias de mejora + Optimizaciones ATS (antes/después) + alertas + keywords
      │   7) Radar de perfil + Checklist
      ▼
[7] "Eliminar" o "Analizar otro CV" → vuelve al paso [1]
```

---

## 6. Requerimientos técnicos

### 6.1 Arquitectura

```
Cliente (React/Next.js App Router)
   │  FormData (file + jobDescription)
   ▼
POST /api/optimize  (ruta server, runtime Node.js, maxDuration=180s)
   │
   ├─► Step 1: Extraer texto del PDF (pdf-parse)
   ├─► Step 2: Llamada a Gemini (cv-evaluation) — un solo prompt
   └─► Stream: respuestas SSE (data: {...})
```

### 6.2 Pila tecnológica

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| UI | React 19.2.7, componentes propios + shadcn/ui (button, card, badge, progress, textarea) |
| Estilos | Tailwind CSS v4, `tw-animate-css`, CVA |
| Iconos | lucide-react |
| Extracción PDF | `pdf-parse` 2.4.5 (server-only) con normalizador a Markdown estructurado (encabezados por sección, detección de escaneo) |
| IA | Google Gemini (`@google/generative-ai`), endpoints REST v1beta, modelo configurable vía `GEMINI_MODEL`. Medición de consumo vía `usageMetadata` y validación previa con `countTokens`. |
| Estado | Local (React hooks: `useState`/`useCallback`) |
| Deploy | Railway (Nixpacks, `next build` / `next start`) |

### 6.3 Variables de entorno

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Clave principal de Gemini |
| `GEMINI_API_KEY_2` | Clave secundaria (fallback) |
| `GEMINI_API_KEY_3` | Clave terciaria (fallback) |
| `GEMINI_MODEL` | Modelo a usar (default: `gemini-3.1-flash-lite`) |

### 6.4 Modelo de datos (respuesta de evaluación)

`CVEvaluation` (JSON tipado en `src/lib/types.ts`):

```ts
interface CVEvaluation {
  overall_score: number                     // 0-100
  dimension_scores: {
    skills: number; experience: number;
    education: number; structure: number
  }
  personal_info: { full_name, email, phone, location, linkedin, other }
  skills: string[]
  work_experience: { company, position, duration, description, achievements[] }[]
  education: { institution, degree, field, year }[]
  suggestions: string[]                     // en español
  professional_summary: string             // en español
  ats_analysis: {
    compatibility_score: number;            // 0-100
    missing_keywords: string[];            // máx 5
    red_flags: string[];                   // máx 3
    summary: string                        // en español
  }
  ats_optimizations: {
    section, original, suggestion, explanation  // explicación en español
  }[]
  sections: {                               // desglose por apartados
    id, title, status, score, detected,     // status: ok | improve | critical
    strengths[], issues[], instructions[]   // instructions: qué colocar y dónde
  }[]
}
```

El evento `done` (SSE) además incluye metadata de consumo:
```ts
usage: { promptTokenCount, candidatesTokenCount, totalTokenCount, modelVersion }
countedPromptTokens: number          // tokens de entrada estimados/medidos
charCount: number                    // caracteres del texto extraído del PDF
```

### 6.5 Requerimientos no funcionales

| Requerimiento | Especificación |
|---|---|
| Rendimiento | Análisis completo con IA < 180s (máx. permitido por Vercel/Railway). |
| Tamaño de archivo | Límite de 10MB por PDF. |
| Formato de entrada | Solo PDF. |
| Seguridad | Las claves de API viven solo en el servidor; el PDF se procesa en memoria y no se persiste. |
| Idioma de salida | Los textos generados por IA se solicitan en español (latino). Los nombres propios se preservan como aparecen en el CV. |
| Consistencia de puntuación | Scores son enteros 0-100, con clamping en el cliente. |
| Disponibilidad | Máximo 5 reintentos con backoff exponencial ante rate-limit de la API de Gemini. |

---

## 7. Métricas de éxito

| Métrica | Meta (fase MVP) |
|---|---|
| % de análisis completados sin error | > 90% |
| Latencia media de análisis | < 5s |
| % de usuarios que corrigen al menos un apartado siguiendo las instrucciones | > 30% |
| Tiempo para generar el primer resultado | < 10s de uso percibido |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Respuesta de Gemini no válida (JSON mal formado) | Validación estricta en `cv-evaluation.ts` con clamping de scores y fallback a arrays vacíos. |
| Compatibilidad restringida en rate limit de Gemini | Multi-key con fallback + backoff exponencial. |
| PDFs complejos con poco texto (escaneados) | Limitar extracción de texto plano; documentar límites de OCR. |
| Registro de claves sensibles en logs | Las claves se truncan en logs; no se persisten. |

---

## 9. Roadmap (propuesto)

### Fase 2 — Profundizar el desglose por apartados
- Mostrar, por cada sección del CV, el texto detectado y el texto sugerido (antes/después) directamente en el apartado.
- Priorizar las secciones a corregir según su impacto en el puntaje ATS.
- Exportar el análisis (instrucciones de corrección) a texto.

### Fase 3 — Personalización
- Historial de análisis por navegador/sesión.
- Configuración de idioma (EN/ES).

### Fase 4 — Colaboración
- Autenticación.
- Compartir análisis por link.

---

## 10. Anexos

- Scripts: `dev`, `build`, `start`, `lint` (ver `package.json`).
- Nota: la funcionalidad está descrita para la implementación actual; los cambios de alcance se aprueban por actualización de este documento.