import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlaceholderPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  phase: number;
};

export function PlaceholderPanel({
  eyebrow = "Coming later",
  title,
  description,
  phase,
}: PlaceholderPanelProps) {
  return (
    <Card className="max-w-2xl border-none bg-card/80 shadow-none ring-foreground/8">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <Badge variant="outline">Phase {phase}</Badge>
        </div>
        <CardTitle className="font-heading text-3xl font-medium tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="max-w-prose text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This screen is a placeholder so the house map is visible now. Feature
          work waits until its phase so earlier foundations stay intact.
        </p>
      </CardContent>
    </Card>
  );
}
