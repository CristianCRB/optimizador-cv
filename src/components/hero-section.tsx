import { FileText, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <div className="text-center space-y-4 py-12">
      <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-2">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        ATS Resume Optimizer
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Optimiza tu CV para superar filtros ATS y aumentar tus posibilidades de
        conseguir entrevistas.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <FileText className="size-4" />
        <span>Sin registro · Sin almacenamiento · Resultados instantáneos</span>
      </div>
    </div>
  )
}
