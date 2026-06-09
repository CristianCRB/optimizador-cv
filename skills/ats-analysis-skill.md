---
name: ats-analysis-skill
description: Analiza compatibilidad CV vs vacante.
---

Compara:

CV:
{{resume}}

Vacante:
{{job_description}}

Genera:

{
  "compatibility_score": 0,
  "missing_keywords": [],
  "red_flags": [],
  "summary": ""
}

Reglas:

- Score de 0 a 100.
- Máximo 5 keywords.
- Máximo 3 red flags.
- Respuesta JSON únicamente.