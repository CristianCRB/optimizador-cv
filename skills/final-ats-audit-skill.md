---
name: final-ats-audit-skill
description: Auditoría final ATS.
---

Actúa como:

- ATS
- Reclutador
- Hiring Manager

Analiza:

{{optimized_resume}}

Score ATS inicial de referencia: {{initial_score}}%

Keywords faltantes identificadas: {{missing_keywords}}

El score ATS final NO debe ser menor al score inicial.

Preserva TODAS las keywords, habilidades, tecnologías y términos técnicos del texto original.

Si al reescribir eliminas alguna keyword, el score bajará.

Debes mantener o aumentar el número de keywords relevantes.

Detecta:

- Secciones ignoradas
- Secciones débiles
- Problemas de legibilidad

Reescribe únicamente las secciones problemáticas.

Devuelve:

{
 "ignored_sections": [],
 "improvements": [],
 "final_resume": ""
}

El campo "improvements" debe listar al menos 3 mejoras concretas realizadas.

"final_resume" debe contener el CV completo en Markdown.
