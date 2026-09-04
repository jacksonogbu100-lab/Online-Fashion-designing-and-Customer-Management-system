import Link from "next/link";
import { notFound } from "next/navigation";

import { DesignForm } from "@/components/designs/design-form";
import { requireCreative } from "@/lib/auth/access";
import {
  getDesignForStaff,
  listClientsForDesignLink,
  listCollectionsForSelect,
} from "@/lib/designs/queries";

export const metadata = {
  title: "Edit design",
};

export default async function EditDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCreative();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const design = await getDesignForStaff(id);
  const [collections, clients] = await Promise.all([
    listCollectionsForSelect(design.collectionId),
    listClientsForDesignLink(design.clientId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/designs/${design.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {design.title}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit {design.title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Status, collection, and construction notes live here. Images stay on
          the workspace.
        </p>
      </div>
      <DesignForm
        collections={collections}
        clients={clients}
        design={{
          id: design.id,
          title: design.title,
          description: design.description ?? "",
          category: design.category,
          status: design.status,
          colorNotes: design.colorNotes ?? "",
          fabricNotes: design.fabricNotes ?? "",
          constructionNotes: design.constructionNotes ?? "",
          collectionId: design.collectionId ?? "",
          clientId: design.clientId ?? "",
        }}
      />
    </div>
  );
}
