import Link from "next/link";

import { CollectionForm } from "@/components/designs/collection-form";
import { requireCreative } from "@/lib/auth/access";

export const metadata = {
  title: "New collection",
};

export default async function NewCollectionPage() {
  await requireCreative();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/app/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Collections
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          New collection
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A name is enough. Season and notes can wait.
        </p>
      </div>
      <CollectionForm />
    </div>
  );
}
