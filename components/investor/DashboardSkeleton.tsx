import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Espelha a geometria do dashboard do investidor (app/investidor/page.tsx): boas-vindas,
// 3 cards de totais, gráfico + coluna de projetos. Mesmos grids e alturas do conteúdo real.
export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando painel" className="flex flex-col gap-8 md:gap-10">
      {/* Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-44" />
          <Skeleton className="h-11 w-44" />
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-brand-bg/60">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-9 w-48 mb-3" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>

      {/* Suas unidades */}
      <div>
        <Skeleton className="h-3 w-32 ml-2 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="bg-brand-bg/60 p-4">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-12" />
            </Card>
          ))}
        </div>
      </div>

      {/* Gráfico + projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-brand-surface/20">
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="p-6">
            <Skeleton className="h-[320px] w-full" />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-40 ml-2" />
          <Card className="p-5">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-1 w-full mb-2" />
            <Skeleton className="h-3 w-full mb-4" />
            <div className="flex items-center gap-3 pt-4 border-t border-brand-border/50">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
