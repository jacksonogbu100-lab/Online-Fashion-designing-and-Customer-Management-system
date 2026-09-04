import { ClientForm } from "@/components/clients/client-form";
import { requireStaff } from "@/lib/auth/access";
import { listLinkablePortalUsers } from "@/lib/clients/queries";

export const metadata = {
  title: "Add client",
};

export default async function NewClientPage() {
  await requireStaff();
  const portalUsers = await listLinkablePortalUsers();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          House book
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Add a client
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A name is enough to start. Contact details and a portal login can wait.
        </p>
      </div>
      <ClientForm portalUsers={portalUsers} />
    </div>
  );
}
