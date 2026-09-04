import type { CollectionStatus, DesignCategory, DesignImageKind, DesignStatus } from "@/lib/designs/schemas";

export function collectionStatusLabel(status: CollectionStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "archived":
      return "Archived";
  }
}

export function designStatusLabel(status: DesignStatus): string {
  switch (status) {
    case "concept":
      return "Concept";
    case "in_development":
      return "In development";
    case "approved":
      return "Approved";
    case "archived":
      return "Archived";
  }
}

export function designCategoryLabel(category: DesignCategory): string {
  switch (category) {
    case "jeans":
      return "Jeans";
    case "trousers":
      return "Trousers";
    case "shirts":
      return "Shirts";
    case "jackets":
      return "Jackets";
    case "other":
      return "Other";
  }
}

export function designImageKindLabel(kind: DesignImageKind): string {
  switch (kind) {
    case "sketch":
      return "Sketch";
    case "drape":
      return "Drape";
    case "mood":
      return "Mood";
  }
}

export function designImageSrc(imageId: string): string {
  return `/media/designs/${imageId}`;
}
