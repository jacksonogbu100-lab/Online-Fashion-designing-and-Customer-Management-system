import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import {
  designCategoryLabel,
  designImageKindLabel,
  designImageSrc,
} from "@/lib/designs/format";
import { getSharedDesignForPortal } from "@/lib/designs/queries";

export const metadata = {
  title: "Shared design",
};

export default async function PortalDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClient();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const design = await getSharedDesignForPortal(id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/portal/designs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Shared designs
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          {design.title}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {designCategoryLabel(design.category)}
          {design.collection
            ? ` · ${design.collection.name}${design.collection.season ? ` · ${design.collection.season}` : ""}`
            : ""}
        </p>
      </div>

      {design.description ? (
        <p className="leading-relaxed text-muted-foreground">{design.description}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <NoteCard title="Colour" body={design.colorNotes} />
        <NoteCard title="Fabric" body={design.fabricNotes} />
      </div>

      {design.images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images have been shared yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {design.images.map((image) => (
            <li key={image.id} className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={designImageSrc(image.id)}
                alt={image.originalName}
                className="aspect-[4/5] w-full rounded-lg object-cover ring-1 ring-foreground/10"
              />
              <p className="text-sm text-muted-foreground">
                {designImageKindLabel(image.kind)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteCard({ title, body }: { title: string; body: string | null }) {
  return (
    <Card className="border-none shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body || "None yet."}</CardDescription>
      </CardHeader>
    </Card>
  );
}
