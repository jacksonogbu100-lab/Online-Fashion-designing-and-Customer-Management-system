import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientNoteForm } from "@/components/clients/note-form";
import { ClientRecordTitle, ClientSubnav } from "@/components/clients/client-subnav";
import { MeasurementChart } from "@/components/measurements/measurement-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import {
  archiveClientAction,
  restoreClientAction,
} from "@/lib/clients/actions";
import { formatHouseDate, formatHouseDateTime } from "@/lib/clients/format";
import { getClientForStaff } from "@/lib/clients/queries";
import { getCurrentMeasurementProfileForStaff } from "@/lib/measurements/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Client profile",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const client = await getClientForStaff(id);
  const currentFit = await getCurrentMeasurementProfileForStaff(client.id);
  const archive = archiveClientAction.bind(null, client.id);
  const restore = restoreClientAction.bind(null, client.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ClientRecordTitle client={client} />
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/calendar/new?clientId=${client.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Book sitting
          </Link>
          <Link
            href={`/app/orders/new?clientId=${client.id}`}
            className={cn(buttonVariants())}
          >
            New order
          </Link>
          <Link
            href={`/app/clients/${client.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
          {client.status === "archived" ? (
            <form action={restore}>
              <Button type="submit" variant="outline">
                Restore
              </Button>
            </form>
          ) : (
            <form action={archive}>
              <Button type="submit" variant="destructive">
                Archive
              </Button>
            </form>
          )}
        </div>
      </div>

      <ClientSubnav clientId={client.id} active="overview" />

      <p className="text-muted-foreground">
        Last contacted {formatHouseDate(client.lastContactedAt)} · Updated{" "}
        {formatHouseDate(client.updatedAt)}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>{client.email ?? "No email on file"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>{client.phone ?? "No phone on file"}</p>
            <p>
              {client.portalUser
                ? `Portal: ${client.portalUser.name} · ${client.portalUser.email}`
                : "No portal login linked"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>
              {client.addressLine1 || client.city || client.country
                ? [client.addressLine1, client.city, client.region, client.postalCode, client.country]
                    .filter(Boolean)
                    .join(", ")
                : "No address on file"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Style notes</CardTitle>
          <CardDescription>
            {client.styleNotes || "No style notes yet. Add them when you edit the profile."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Current fit</CardTitle>
              <CardDescription>
                {currentFit
                  ? `${currentFit.label} · ${formatHouseDate(currentFit.recordedAt)}`
                  : "No current measurement profile yet."}
              </CardDescription>
            </div>
            <Link
              href={`/app/clients/${client.id}/measurements`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {currentFit ? "Open measurements" : "Add measurements"}
            </Link>
          </div>
        </CardHeader>
        {currentFit ? (
          <CardContent>
            <MeasurementChart values={currentFit.values} notes={currentFit.notes} />
          </CardContent>
        ) : null}
      </Card>

      <p>
        <Link
          href={`/app/clients/${client.id}/orders`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Open orders for this client →
        </Link>
        <span className="text-muted-foreground"> · </span>
        <Link
          href={`/app/clients/${client.id}/appointments`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Open appointments →
        </Link>
      </p>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-medium">Notes</h2>
        <ClientNoteForm clientId={client.id} />
        {client.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet. The first conversation belongs here.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {client.notes.map((note) => (
              <li key={note.id}>
                <Card className="border-none shadow-none ring-foreground/8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {note.author.name}
                    </CardTitle>
                    <CardDescription>
                      {formatHouseDateTime(note.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {note.body}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
