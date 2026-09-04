import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/access";
import { roleLabel } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireRole("admin");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          House settings
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          People in the house
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Seeded accounts for local work. Invites and password reset wait until
          a later phase.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {users.map((person) => (
          <Card
            key={person.id}
            className="border-none shadow-none ring-foreground/8"
          >
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{person.name}</CardTitle>
                <Badge variant="outline">{roleLabel(person.role)}</Badge>
                <Badge variant={person.status === "active" ? "secondary" : "destructive"}>
                  {person.status}
                </Badge>
              </div>
              <CardDescription>{person.email}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
