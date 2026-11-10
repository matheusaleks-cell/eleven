import { cn } from "@/lib/utils";

// Bloco de carregamento. Dê a ele a mesma largura/altura do conteúdo final (via className)
// para a página não "pular" quando os dados chegarem.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton", className)} />;
}
