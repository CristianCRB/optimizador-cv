import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { spawn, execSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 3456
const BASE = `http://localhost:${PORT}`
const TEST_PDF = join(__dirname, "..", "public", "test-resume.pdf")
const OUTPUT_PDF = join(__dirname, "..", "public", "output-test.pdf")

const jobDescription = `Buscamos Ingeniero de Software Senior con experiencia en:
- React, TypeScript, Node.js
- Arquitectura cloud (AWS o GCP)
- Bases de datos relacionales (PostgreSQL)
- APIs RESTful y GraphQL
- Contenedores Docker y CI/CD
- Metodologías ágiles (Scrum)
- Inglés avanzado (deseable)
- Experiencia con sistemas de alta disponibilidad`

let server = null
let timedOut = false
const TIMEOUT_MS = 180_000

async function startServer() {
  return new Promise((resolve, reject) => {
    const nextCmd = join(__dirname, "..", "node_modules", ".bin", "next.cmd")
    server = spawn("cmd.exe", ["/c", nextCmd, "dev", "--port", String(PORT)], {
      cwd: join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "development" },
    })

    let started = false
    const timeout = setTimeout(() => {
      if (!started) {
        timedOut = true
        reject(new Error("Server start timeout"))
      }
    }, 60_000)

    server.stdout.on("data", (data) => {
      const text = data.toString()
      if (text.includes("http://localhost") && !started) {
        started = true
        clearTimeout(timeout)
        resolve()
      }
    })

    server.on("error", (err) => {
      clearTimeout(timeout)
      if (!started) reject(err)
    })
  })
}

async function stopServer() {
  if (server) {
    server.kill("SIGTERM")
    await new Promise((r) => setTimeout(r, 1000))
  }
}

function parseSSE(chunk) {
  const events = []
  const lines = chunk.split("\n")
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        events.push(JSON.parse(line.slice(6)))
      } catch {}
    }
  }
  return events
}

async function runTest() {
  console.log("=== E2E Test: ATS Resume Optimizer ===\n")

  // 1. Start server
  console.log("1. Starting dev server...")
  try {
    await startServer()
    console.log("   Server ready\n")
  } catch (err) {
    console.error("   Failed to start server:", err.message)
    process.exit(1)
  }

  // 2. Read test PDF
  console.log("2. Reading test PDF...")
  const pdfBuffer = readFileSync(TEST_PDF)
  console.log(`   PDF size: ${pdfBuffer.length} bytes\n`)

  // 3. Build form data and send
  console.log("3. Sending request to /api/optimize...")

  const formData = new FormData()
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" })
  formData.append("file", pdfBlob, "test-resume.pdf")
  formData.append("jobDescription", jobDescription)

  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE}/api/optimize`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    console.log(`   Status: ${response.status} ${response.statusText}\n`)

    // 4. Process SSE stream
    console.log("4. Processing SSE stream...\n")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let finalResult = null
    let pdfBase64 = null
    let stages = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = parseSSE(buffer)
      buffer = ""

      for (const event of events) {
        if (event.stage === "error") {
          console.error(`   ERROR: ${event.error}`)
          throw new Error(event.error)
        }

        if (event.stage === "done") {
          finalResult = event.result
          pdfBase64 = event.pdfBase64
          stages.push({ stage: "done", progress: 100, message: "Completado" })
        } else {
          stages.push({ stage: event.stage, progress: event.progress, message: event.message })
          console.log(`   [${String(event.progress).padStart(2, "0")}%] ${event.stage}: ${event.message}`)
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n   Completed in ${elapsed}s\n`)

    // 5. Validate results
    console.log("5. Validating results...")

    if (!finalResult) {
      throw new Error("No result received")
    }

    const initScore = finalResult.initial_analysis?.compatibility_score
    const finalScore = finalResult.final_analysis?.compatibility_score
    const improvements = finalResult.final_audit?.improvements?.length || 0

    console.log(`   Initial ATS score: ${initScore}%`)
    console.log(`   Final ATS score:   ${finalScore}%`)
    console.log(`   Improvement:       ${finalScore - initScore >= 0 ? "+" : ""}${finalScore - initScore} points`)
    console.log(`   Missing keywords:  ${finalResult.initial_analysis?.missing_keywords?.join(", ") || "none"}`)
    console.log(`   Red flags:         ${finalResult.initial_analysis?.red_flags?.join(", ") || "none"}`)
    console.log(`   Audit improvements: ${improvements}`)
    console.log(`   Optimized resume length: ${finalResult.optimized_resume?.length || 0} chars`)
    console.log(`   Final resume length:     ${finalResult.final_audit?.final_resume?.length || 0} chars`)

    // Check feedloop (score should not regress)
    if (finalScore < initScore) {
      console.log(`\n   ⚠ WARNING: Score regressed from ${initScore}% to ${finalScore}%`)
    } else if (finalScore === initScore) {
      console.log(`\n   ✓ Score maintained at ${initScore}%`)
    } else {
      console.log(`\n   ✓ Score improved from ${initScore}% to ${finalScore}%`)
    }

    // 6. Save PDF output
    if (pdfBase64) {
      const pdfBytes = Buffer.from(pdfBase64, "base64")
      writeFileSync(OUTPUT_PDF, pdfBytes)
      console.log(`\n6. Output PDF saved: ${OUTPUT_PDF} (${pdfBytes.length} bytes)`)
    } else {
      console.log("\n6. No PDF output received")
    }

    console.log("\n=== TEST COMPLETE ===")

  } catch (err) {
    console.error(`\n✗ Test failed: ${err.message}`)
    process.exitCode = 1
  } finally {
    await stopServer()
  }
}

runTest()
