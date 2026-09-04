import Link from "next/link";

import { DesignForm } from "@/components/designs/design-form";
import { requireCreative } from "@/lib/auth/access";
import { listClientsForDesignLink, listCollectionsForSelect } from "@/lib/designs/queries";

export const metadata = {
  title: "New design",
};

export default async function NewDesignPage() {
  await requireCreative();
  const [collections, clients] = await Promise.all([
    listCollectionsForSelect(),
    listClientsForDesignLink(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/app/designs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Designs
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          New design
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Capture the idea first. Sketches and sharing wait on the workspace.
        </p>
      </div>
      <DesignForm collections={collections} clients={clients} />
    </div>
  );
}
