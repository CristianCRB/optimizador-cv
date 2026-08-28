"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() =>
    typeof document === "undefined"
      ? true
      : !(localStorage.getItem("theme") === "light")
  )

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.documentElement.style.colorScheme = next ? "dark" : "light"
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", next ? "#070B14" : "#F8FAFC")
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed top-4 right-4 size-8 flex items-center justify-center rounded-lg border bg-card hover:bg-secondary transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {dark ? (
        <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </button>
  )
}
