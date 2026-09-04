import { Button } from "@/components/ui/button";
import { deleteDesignImageAction } from "@/lib/designs/actions";

export function DeleteDesignImageButton({
  designId,
  imageId,
}: {
  designId: string;
  imageId: string;
}) {
  const action = deleteDesignImageAction.bind(null, designId, imageId);

  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm">
        Remove
      </Button>
    </form>
  );
}
