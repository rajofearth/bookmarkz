import { Separator } from "@/components/ui/separator";

interface SectionHeaderProps {
  title: string;
  description: string;
  /** When true (e.g. mobile drill-down), hide title/description to avoid duplicate nav title */
  compact?: boolean;
}

export function SectionHeader({
  title,
  description,
  compact = false,
}: SectionHeaderProps) {
  if (compact) return null;
  return (
    <div className="space-y-1 mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}
