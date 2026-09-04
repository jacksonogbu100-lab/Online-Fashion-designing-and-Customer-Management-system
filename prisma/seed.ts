import { readFile } from "node:fs/promises";
import path from "node:path";

import bcrypt from "bcryptjs";

import { prisma } from "../lib/db";
import type { Role } from "../lib/auth/roles";
import { removeDesignImageFile, saveDesignImageFile } from "../lib/designs/storage";
import { snapshotFromProfile } from "../lib/orders/snapshot";
import { studioDate } from "../lib/appointments/datetime";

const seedPassword = "sunnex-dev";

const seedUsers: {
  email: string;
  name: string;
  role: Role;
}[] = [
  { email: "admin@sunnex.local", name: "Kavita Mehta", role: "admin" },
  { email: "designer@sunnex.local", name: "Rohan Desai", role: "designer" },
  { email: "staff@sunnex.local", name: "Priya Iyer", role: "staff" },
  { email: "client@sunnex.local", name: "Aryan Shah", role: "client" },
];

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  for (const person of seedUsers) {
    await prisma.user.upsert({
      where: { email: person.email },
      update: {
        name: person.name,
        role: person.role,
        status: "active",
        passwordHash,
      },
      create: {
        email: person.email,
        name: person.name,
        role: person.role,
        status: "active",
        passwordHash,
      },
    });
  }

  const aryanUser = await prisma.user.findUniqueOrThrow({
    where: { email: "client@sunnex.local" },
  });
  const rohan = await prisma.user.findUniqueOrThrow({
    where: { email: "designer@sunnex.local" },
  });
  const priya = await prisma.user.findUniqueOrThrow({
    where: { email: "staff@sunnex.local" },
  });

  const aryan = await prisma.client.upsert({
    where: { email: "client@sunnex.local" },
    update: {
      displayName: "Aryan Shah",
      phone: "+91 22 4221 2555",
      city: "Mumbai",
      country: "India",
      styleNotes:
        "Prefers mid-rise slim denim, deep indigo and black, clean pockets, a little stretch.",
      status: "active",
      portalUserId: aryanUser.id,
    },
    create: {
      displayName: "Aryan Shah",
      email: "client@sunnex.local",
      phone: "+91 22 4221 2555",
      city: "Mumbai",
      country: "India",
      styleNotes:
        "Prefers mid-rise slim denim, deep indigo and black, clean pockets, a little stretch.",
      status: "active",
      portalUserId: aryanUser.id,
    },
  });

  await prisma.clientNote.deleteMany({ where: { clientId: aryan.id } });
  await prisma.clientNote.create({
    data: {
      clientId: aryan.id,
      authorId: rohan.id,
      body: "Sunnex Clothing fit session for a slim indigo jean. Wants a cleaner thigh and no whiskering on the next pair.",
    },
  });
  await prisma.client.update({
    where: { id: aryan.id },
    data: { lastContactedAt: new Date() },
  });

  await prisma.client.deleteMany({
    where: {
      email: { in: ["idris.banerjee@example.com", "nora.ellison@example.com"] },
    },
  });

  const neha = await prisma.client.upsert({
    where: { email: "neha.kapoor@example.com" },
    update: {
      displayName: "Neha Kapoor",
      status: "lead",
      city: "Pune",
      country: "India",
      styleNotes: "Inquiry about a custom high-rise straight jean; no measurements yet.",
    },
    create: {
      displayName: "Neha Kapoor",
      email: "neha.kapoor@example.com",
      phone: "+91 20 4850 1122",
      city: "Pune",
      country: "India",
      styleNotes: "Inquiry about a custom high-rise straight jean; no measurements yet.",
      status: "lead",
    },
  });

  await prisma.client.upsert({
    where: { email: "vikram.reddy@example.com" },
    update: {
      displayName: "Vikram Reddy",
      status: "archived",
    },
    create: {
      displayName: "Vikram Reddy",
      email: "vikram.reddy@example.com",
      city: "Hyderabad",
      country: "India",
      styleNotes: "Completed a denim trucker in 2024. Archived after the last drop.",
      status: "archived",
    },
  });

  await prisma.measurementProfile.deleteMany({
    where: {
      clientId: aryan.id,
      label: { in: ["Winter 2024 coat", "Autumn 2026 evening coat"] },
    },
  });

  await seedMeasurementProfile(aryan.id, {
    label: "2024 regular jean",
    recordedAt: new Date("2024-11-12T12:00:00.000Z"),
    isCurrent: false,
    notes: "Taken for a regular-fit Sunnex jean. Slightly high right hip.",
    values: {
      height: 178,
      bust: 96,
      waist: 81,
      hips: 98,
      shoulder: 44,
      napeToWaist: 44,
      sleeve: 62,
      inseam: 81,
    },
  });

  const currentFit = await seedMeasurementProfile(aryan.id, {
    label: "2026 slim indigo jean",
    recordedAt: new Date("2026-09-02T12:00:00.000Z"),
    isCurrent: true,
    notes: "Slim-fit session. Wants ease through the thigh, 32-inch inseam.",
    values: {
      height: 178,
      neck: 40,
      bust: 96,
      waist: 80,
      hips: 97,
      shoulder: 44,
      napeToWaist: 44,
      sleeve: 62,
      bicep: 33,
      frontRise: 27,
      backRise: 36,
      thigh: 61,
      inseam: 81,
      outseam: 106,
      hem: 32,
    },
  });

  await prisma.measurementProfile.updateMany({
    where: { clientId: aryan.id, label: { not: "2026 slim indigo jean" } },
    data: { isCurrent: false },
  });
  await prisma.measurementProfile.updateMany({
    where: { clientId: aryan.id, label: "2026 slim indigo jean" },
    data: { isCurrent: true },
  });

  const indigo = await seedCollection({
    name: "Indigo Edit 2026",
    season: "Monsoon 2026",
    status: "active",
    notes: "Denim and casual pieces for Sunnex Clothing this monsoon.",
  });

  const slimJean = await seedDesign({
    title: "Slim indigo jean",
    description:
      "Commissioned slim jean for Aryan Shah. Clean pockets, mid-rise, a little stretch.",
    category: "jeans",
    status: "in_development",
    colorNotes: "Deep indigo. No whiskering on the next pair.",
    fabricNotes: "11 oz stretch denim.",
    constructionNotes: "Clean coin pocket, tonal stitch, 32-inch inseam.",
    collectionId: indigo.id,
    clientId: aryan.id,
    sharedWithClient: true,
    createdById: rohan.id,
  });

  const trucker = await seedDesign({
    title: "Denim trucker",
    description: "House trucker for the monsoon drop. Not commissioned.",
    category: "jackets",
    status: "concept",
    colorNotes: "Stone-wash indigo.",
    fabricNotes: "12 oz rigid denim.",
    constructionNotes: "Classic two-pocket trucker, copper hardware.",
    collectionId: indigo.id,
    clientId: null,
    sharedWithClient: false,
    createdById: rohan.id,
  });

  const highRise = await seedDesign({
    title: "High-rise straight jean",
    description: "House straight jean with a higher rise for the monsoon drop.",
    category: "jeans",
    status: "in_development",
    colorNotes: "Medium indigo rinse.",
    fabricNotes: "12 oz rigid denim, no stretch.",
    constructionNotes: "High rise, straight leg, clean hem.",
    collectionId: indigo.id,
    clientId: null,
    sharedWithClient: false,
    createdById: rohan.id,
  });

  await seedDesignImages(slimJean.id, [
    { file: "slim-jean-mood.jpg", kind: "mood" },
    { file: "slim-jean-sketch.jpg", kind: "sketch" },
    { file: "slim-jean-drape.jpg", kind: "drape" },
  ]);
  await seedDesignImages(trucker.id, [
    { file: "trucker-mood.jpg", kind: "mood" },
    { file: "trucker-sketch.jpg", kind: "sketch" },
    { file: "trucker-drape.jpg", kind: "drape" },
  ]);
  await seedDesignImages(highRise.id, [
    { file: "highrise-mood.jpg", kind: "mood" },
    { file: "highrise-sketch.jpg", kind: "sketch" },
    { file: "highrise-drape.jpg", kind: "drape" },
  ]);

  const slimOrder = await seedOrder({
    reference: "SNX-2026-0001",
    title: "Slim indigo jean",
    notes: "Keep the thigh ease. No whiskering on this pair.",
    status: "in_sew",
    priority: "normal",
    dueAt: new Date("2026-09-20T12:00:00.000Z"),
    priceEstimateInr: 18500,
    clientId: aryan.id,
    designId: slimJean.id,
    measurementProfileId: currentFit.id,
    fitSnapshot: snapshotFromProfile(currentFit),
    createdById: rohan.id,
    events: [
      {
        kind: "created",
        toStatus: "inquiry",
        body: "Order opened.",
        createdAt: new Date("2026-08-10T09:00:00.000Z"),
      },
      {
        kind: "status_changed",
        fromStatus: "inquiry",
        toStatus: "quoted",
        createdAt: new Date("2026-08-12T11:00:00.000Z"),
      },
      {
        kind: "status_changed",
        fromStatus: "quoted",
        toStatus: "confirmed",
        createdAt: new Date("2026-08-14T10:00:00.000Z"),
      },
      {
        kind: "status_changed",
        fromStatus: "confirmed",
        toStatus: "in_cut",
        createdAt: new Date("2026-08-22T08:30:00.000Z"),
      },
      {
        kind: "status_changed",
        fromStatus: "in_cut",
        toStatus: "in_sew",
        body: "Cut complete. Sewing the slim jean.",
        createdAt: new Date("2026-08-28T14:00:00.000Z"),
      },
    ],
  });

  const nehaOrder = await seedOrder({
    reference: "SNX-2026-0002",
    title: "High-rise straight jean",
    notes: "Lead inquiry. No tape yet.",
    status: "inquiry",
    priority: "normal",
    dueAt: new Date("2026-10-15T12:00:00.000Z"),
    priceEstimateInr: 22000,
    clientId: neha.id,
    designId: highRise.id,
    measurementProfileId: null,
    fitSnapshot: null,
    createdById: rohan.id,
    events: [
      {
        kind: "created",
        toStatus: "inquiry",
        body: "Order opened.",
        createdAt: new Date("2026-09-01T10:00:00.000Z"),
      },
    ],
  });

  await prisma.appointment.deleteMany({
    where: { clientId: { in: [aryan.id, neha.id] } },
  });

  await prisma.appointment.create({
    data: {
      type: "measurement",
      status: "completed",
      startsAt: studioDate(2026, 9, 2, 11, 0),
      endsAt: studioDate(2026, 9, 2, 11, 45),
      location: "Studio",
      notes: "Taken the 2026 slim indigo jean tape.",
      clientId: aryan.id,
      orderId: slimOrder.id,
      staffId: priya.id,
      createdById: priya.id,
    },
  });

  await prisma.appointment.create({
    data: {
      type: "fitting",
      status: "scheduled",
      startsAt: studioDate(2026, 9, 4, 11, 0),
      endsAt: studioDate(2026, 9, 4, 11, 45),
      location: "Studio",
      notes: "First fitting on the slim jean.",
      clientId: aryan.id,
      orderId: slimOrder.id,
      staffId: priya.id,
      createdById: priya.id,
    },
  });

  await prisma.appointment.create({
    data: {
      type: "consultation",
      status: "scheduled",
      startsAt: studioDate(2026, 9, 5, 12, 0),
      endsAt: studioDate(2026, 9, 5, 12, 30),
      location: "Studio",
      notes: "High-rise inquiry. No tape yet.",
      clientId: neha.id,
      orderId: nehaOrder.id,
      staffId: rohan.id,
      createdById: rohan.id,
    },
  });

  const stretchDenim = await seedMaterial({
    name: "11 oz stretch denim",
    kind: "fabric",
    color: "Deep indigo",
    quantity: "42",
    unit: "metres",
    supplier: "Arvind Mills",
    lowStockAt: "15",
    notes: "House stretch for slim jeans. 2% elastane.",
  });
  const rigidDenim = await seedMaterial({
    name: "12 oz rigid denim",
    kind: "fabric",
    color: "Stone-wash indigo",
    quantity: "8",
    unit: "metres",
    supplier: "Arvind Mills",
    lowStockAt: "12",
    notes: "Below the cut point until the next mill drop.",
  });
  const copperHardware = await seedMaterial({
    name: "Copper hardware",
    kind: "trim",
    color: "Copper",
    quantity: "40",
    unit: "pieces",
    supplier: "YKK India",
    lowStockAt: "10",
    notes: "Buttons and rivets for the Indigo Edit.",
  });
  const pocketing = await seedMaterial({
    name: "Pocketing",
    kind: "lining",
    color: "Ecru",
    quantity: "25",
    unit: "metres",
    supplier: "Arvind Mills",
    lowStockAt: "8",
    notes: "Pocket bags for jeans and the trucker.",
  });

  await seedDesignBom(slimJean.id, [
    { materialId: stretchDenim.id, quantity: "1.8", notes: "Leg and yoke." },
    { materialId: pocketing.id, quantity: "0.4", notes: "Coin and rear pockets." },
    { materialId: copperHardware.id, quantity: "5", notes: "Button and rivets." },
  ]);
  await seedDesignBom(trucker.id, [
    { materialId: rigidDenim.id, quantity: "2.4", notes: "Body and sleeves." },
    { materialId: pocketing.id, quantity: "0.5", notes: "Chest pockets." },
    { materialId: copperHardware.id, quantity: "8", notes: "Buttons." },
  ]);
  await seedDesignBom(highRise.id, [
    { materialId: rigidDenim.id, quantity: "1.9", notes: "Leg." },
    { materialId: pocketing.id, quantity: "0.4", notes: "Pockets." },
  ]);

  await seedOrderMaterials(slimOrder.id, [
    { materialId: stretchDenim.id, quantityNeeded: "1.8", quantityAllocated: "0" },
    { materialId: pocketing.id, quantityNeeded: "0.4", quantityAllocated: "0" },
    { materialId: copperHardware.id, quantityNeeded: "5", quantityAllocated: "0" },
  ]);
  await seedOrderMaterials(nehaOrder.id, [
    { materialId: rigidDenim.id, quantityNeeded: "1.9", quantityAllocated: "0" },
    { materialId: pocketing.id, quantityNeeded: "0.4", quantityAllocated: "0" },
  ]);

  await seedBillingDocuments(slimOrder.id, rohan.id);
  await seedNotifications({
    aryanUserId: aryanUser.id,
    priyaId: priya.id,
    rohanId: rohan.id,
    aryanClientId: aryan.id,
    nehaClientId: neha.id,
    orderId: slimOrder.id,
  });

  console.log("Seeded Sunnex Clothing users (password: sunnex-dev)");
  for (const person of seedUsers) {
    console.log(`  ${person.role.padEnd(9)} ${person.email}`);
  }
  console.log("Seeded clients: Aryan (active, portal), Neha (lead), Vikram (archived)");
  console.log("Seeded fit profiles for Aryan: 2024 regular jean (historic), 2026 slim indigo jean (current)");
  console.log("Seeded collection Indigo Edit 2026 with jean and trucker designs, each with sketch, drape, and mood images");
  console.log("Seeded orders: SNX-2026-0001 Aryan slim jean (in sew), SNX-2026-0002 Neha high-rise inquiry");
  console.log("Seeded sittings: Aryan measurement (done) and fitting Fri 4 Sep; Neha consultation Sat 5 Sep");
  console.log("Seeded materials: 11 oz stretch, 12 oz rigid (low stock), copper hardware, pocketing");
  console.log("Seeded billing: SNX-Q-2026-0001 sent quote and SNX-INV-2026-0001 sent invoice (₹10,000 paid of ₹18,500) on Aryan’s slim jean");
  console.log("Seeded notifications: Aryan invoice + sitting reminder; Priya’s fitting; Rohan’s Neha consultation");
}

async function seedMeasurementProfile(
  clientId: string,
  data: {
    label: string;
    recordedAt: Date;
    isCurrent: boolean;
    notes: string;
    values: Record<string, number>;
  },
) {
  const existing = await prisma.measurementProfile.findFirst({
    where: { clientId, label: data.label },
    select: { id: true },
  });

  if (existing) {
    return prisma.measurementProfile.update({
      where: { id: existing.id },
      data: {
        recordedAt: data.recordedAt,
        isCurrent: data.isCurrent,
        notes: data.notes,
        values: data.values,
      },
    });
  }

  return prisma.measurementProfile.create({
    data: {
      clientId,
      label: data.label,
      recordedAt: data.recordedAt,
      isCurrent: data.isCurrent,
      notes: data.notes,
      values: data.values,
    },
  });
}

async function seedCollection(data: {
  name: string;
  season: string;
  status: "draft" | "active" | "archived";
  notes: string;
}) {
  const existing = await prisma.collection.findFirst({
    where: { name: data.name },
    select: { id: true },
  });

  if (existing) {
    return prisma.collection.update({
      where: { id: existing.id },
      data: {
        season: data.season,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  return prisma.collection.create({ data });
}

async function seedDesign(data: {
  title: string;
  description: string;
  category: "jeans" | "trousers" | "shirts" | "jackets" | "other";
  status: "concept" | "in_development" | "approved" | "archived";
  colorNotes: string;
  fabricNotes: string;
  constructionNotes: string;
  collectionId: string;
  clientId: string | null;
  sharedWithClient: boolean;
  createdById: string;
}) {
  const existing = await prisma.design.findFirst({
    where: { title: data.title },
    select: { id: true },
  });

  if (existing) {
    return prisma.design.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.design.create({ data });
}

async function seedDesignImages(
  designId: string,
  items: { file: string; kind: "sketch" | "drape" | "mood" }[],
) {
  const existing = await prisma.designImage.findMany({
    where: { designId },
    select: { storedName: true },
  });
  for (const image of existing) {
    await removeDesignImageFile(designId, image.storedName);
  }
  await prisma.designImage.deleteMany({ where: { designId } });

  for (const [index, item] of items.entries()) {
    const assetPath = path.join(process.cwd(), "prisma/seed-assets/designs", item.file);
    const bytes = await readFile(assetPath);
    const file = new File([bytes], item.file, { type: "image/jpeg" });
    const image = await prisma.designImage.create({
      data: {
        designId,
        storedName: "pending",
        originalName: item.file,
        mimeType: "application/octet-stream",
        kind: item.kind,
        sortOrder: index,
      },
      select: { id: true },
    });
    const saved = await saveDesignImageFile({
      designId,
      imageId: image.id,
      file,
    });
    if ("error" in saved) {
      await prisma.designImage.delete({ where: { id: image.id } });
      throw new Error(`${item.file}: ${saved.error}`);
    }
    await prisma.designImage.update({
      where: { id: image.id },
      data: {
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        originalName: item.file,
      },
    });
  }
}

async function seedOrder(data: {
  reference: string;
  title: string;
  notes: string | null;
  status:
    | "inquiry"
    | "quoted"
    | "confirmed"
    | "in_cut"
    | "in_sew"
    | "fitting"
    | "ready"
    | "delivered"
    | "cancelled";
  priority: "low" | "normal" | "high" | "rush";
  dueAt: Date | null;
  priceEstimateInr: number | null;
  clientId: string;
  designId: string | null;
  measurementProfileId: string | null;
  fitSnapshot: ReturnType<typeof snapshotFromProfile> | null;
  createdById: string;
  events: {
    kind: "created" | "status_changed" | "note";
    fromStatus?:
      | "inquiry"
      | "quoted"
      | "confirmed"
      | "in_cut"
      | "in_sew"
      | "fitting"
      | "ready"
      | "delivered"
      | "cancelled";
    toStatus?:
      | "inquiry"
      | "quoted"
      | "confirmed"
      | "in_cut"
      | "in_sew"
      | "fitting"
      | "ready"
      | "delivered"
      | "cancelled";
    body?: string;
    createdAt: Date;
  }[];
}) {
  const existing = await prisma.order.findUnique({
    where: { reference: data.reference },
    select: { id: true },
  });
  if (existing) {
    await prisma.order.delete({ where: { id: existing.id } });
  }

  return prisma.order.create({
    data: {
      reference: data.reference,
      title: data.title,
      notes: data.notes,
      status: data.status,
      priority: data.priority,
      dueAt: data.dueAt,
      priceEstimateInr: data.priceEstimateInr,
      clientId: data.clientId,
      designId: data.designId,
      measurementProfileId: data.measurementProfileId,
      fitSnapshot: data.fitSnapshot ?? undefined,
      createdById: data.createdById,
      events: {
        create: data.events.map((event) => ({
          actorId: data.createdById,
          kind: event.kind,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          body: event.body,
          createdAt: event.createdAt,
        })),
      },
    },
  });
}

async function seedMaterial(data: {
  name: string;
  kind: "fabric" | "trim" | "lining";
  color: string;
  quantity: string;
  unit: "metres" | "pieces" | "rolls";
  supplier: string;
  lowStockAt: string;
  notes: string;
}) {
  const existing = await prisma.material.findFirst({
    where: { name: data.name },
    select: { id: true },
  });
  if (existing) {
    return prisma.material.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.material.create({ data });
}

async function seedDesignBom(
  designId: string,
  lines: { materialId: string; quantity: string; notes: string }[],
) {
  await prisma.designMaterial.deleteMany({ where: { designId } });
  for (const line of lines) {
    await prisma.designMaterial.create({
      data: {
        designId,
        materialId: line.materialId,
        quantity: line.quantity,
        notes: line.notes,
      },
    });
  }
}

async function seedOrderMaterials(
  orderId: string,
  lines: { materialId: string; quantityNeeded: string; quantityAllocated: string }[],
) {
  await prisma.orderMaterial.deleteMany({ where: { orderId } });
  for (const line of lines) {
    await prisma.orderMaterial.create({
      data: {
        orderId,
        materialId: line.materialId,
        quantityNeeded: line.quantityNeeded,
        quantityAllocated: line.quantityAllocated,
      },
    });
  }
}

async function seedBillingDocuments(orderId: string, issuedById: string) {
  await prisma.document.deleteMany({
    where: { reference: { in: ["SNX-Q-2026-0001", "SNX-INV-2026-0001"] } },
  });

  const lines = [
    {
      kind: "labour" as const,
      description: "Labour for slim jean",
      quantity: "1",
      unitAmountInr: 12000,
      sortOrder: 0,
    },
    {
      kind: "material" as const,
      description: "11 oz stretch denim",
      quantity: "1",
      unitAmountInr: 4500,
      sortOrder: 1,
    },
    {
      kind: "extra" as const,
      description: "Copper hardware",
      quantity: "1",
      unitAmountInr: 2000,
      sortOrder: 2,
    },
  ];

  const quote = await prisma.document.create({
    data: {
      kind: "quote",
      status: "sent",
      reference: "SNX-Q-2026-0001",
      title: "Quote · Slim indigo jean",
      taxRateBps: 0,
      taxInclusive: true,
      sentAt: new Date("2026-08-12T11:00:00.000Z"),
      orderId,
      issuedById,
      lines: { create: lines },
    },
    select: { id: true },
  });

  await prisma.document.create({
    data: {
      kind: "invoice",
      status: "sent",
      reference: "SNX-INV-2026-0001",
      title: "Invoice · Slim indigo jean",
      taxRateBps: 0,
      taxInclusive: true,
      sentAt: new Date("2026-08-14T10:00:00.000Z"),
      sourceQuoteId: quote.id,
      orderId,
      issuedById,
      lines: { create: lines },
      payments: {
        create: {
          amountInr: 10000,
          method: "cash",
          receivedAt: new Date("2026-08-16T12:00:00.000Z"),
          notes: "Studio till",
          recordedById: issuedById,
        },
      },
    },
  });
}

async function seedNotifications(input: {
  aryanUserId: string;
  priyaId: string;
  rohanId: string;
  aryanClientId: string;
  nehaClientId: string;
  orderId: string;
}) {
  await prisma.notification.deleteMany({
    where: { userId: { in: [input.aryanUserId, input.priyaId, input.rohanId] } },
  });

  const invoice = await prisma.document.findUnique({
    where: { reference: "SNX-INV-2026-0001" },
    select: { id: true },
  });
  const fitting = await prisma.appointment.findFirst({
    where: { clientId: input.aryanClientId, type: "fitting", status: "scheduled" },
    select: { id: true },
  });
  const consultation = await prisma.appointment.findFirst({
    where: { clientId: input.nehaClientId, type: "consultation", status: "scheduled" },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: input.aryanUserId,
        kind: "invoice_sent" as const,
        title: "Invoice SNX-INV-2026-0001 is ready",
        body: "Slim indigo jean",
        href: invoice ? `/portal/billing/${invoice.id}` : "/portal/billing",
        createdAt: new Date("2026-08-14T10:05:00.000Z"),
      },
      {
        userId: input.aryanUserId,
        kind: "order_status" as const,
        title: "Your order is now Sewing",
        body: "SNX-2026-0001 · Slim indigo jean",
        href: `/portal/orders/${input.orderId}`,
        readAt: new Date("2026-08-29T09:00:00.000Z"),
        createdAt: new Date("2026-08-28T14:05:00.000Z"),
      },
      ...(fitting
        ? [
            {
              userId: input.aryanUserId,
              kind: "appointment_reminder" as const,
              title: "Reminder: fitting at Sunnex Clothing",
              body: "4 Sept 2026 · 11:00–11:45 · Studio",
              href: `/portal/appointments/${fitting.id}`,
              createdAt: new Date("2026-09-03T09:00:00.000Z"),
            },
            {
              userId: input.priyaId,
              kind: "appointment_reminder" as const,
              title: "Fitting with Aryan Shah",
              body: "4 Sept 2026 · 11:00–11:45 · Studio",
              href: `/app/calendar/${fitting.id}`,
              createdAt: new Date("2026-08-28T10:00:00.000Z"),
            },
          ]
        : []),
      ...(consultation
        ? [
            {
              userId: input.rohanId,
              kind: "appointment_reminder" as const,
              title: "Consultation with Neha Kapoor",
              body: "5 Sept 2026 · 12:00–12:30 · Studio",
              href: `/app/calendar/${consultation.id}`,
              createdAt: new Date("2026-09-01T10:30:00.000Z"),
            },
          ]
        : []),
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
