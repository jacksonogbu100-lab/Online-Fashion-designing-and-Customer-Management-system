import { notFound } from "next/navigation";

import { ClientForm } from "@/components/clients/client-form";
import { requireStaff } from "@/lib/auth/access";
import { getClientForStaff, listLinkablePortalUsers } from "@/lib/clients/queries";

export const metadata = {
  title: "Edit client",
};

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const [client, portalUsers] = await Promise.all([
    getClientForStaff(id),
    listLinkablePortalUsers(id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          House book
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Edit {client.displayName}
        </h1>
      </div>
      <ClientForm
        portalUsers={portalUsers}
        client={{
          id: client.id,
          displayName: client.displayName,
          email: client.email ?? "",
          phone: client.phone ?? "",
          addressLine1: client.addressLine1 ?? "",
          city: client.city ?? "",
          region: client.region ?? "",
          postalCode: client.postalCode ?? "",
          country: client.country ?? "",
          styleNotes: client.styleNotes ?? "",
          status: client.status,
          portalUserId: client.portalUserId ?? "",
        }}
      />
    </div>
  );
}
