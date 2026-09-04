export type MeasurementGroupId = "body" | "arm" | "leg";

export type MeasurementField = {
  key: string;
  label: string;
  hint: string;
  group: MeasurementGroupId;
};

export const MEASUREMENT_GROUPS = [
  { id: "body", label: "Body" },
  { id: "arm", label: "Arm" },
  { id: "leg", label: "Leg" },
] as const satisfies readonly { id: MeasurementGroupId; label: string }[];

export const MEASUREMENT_FIELDS = [
  { key: "height", label: "Height", hint: "Crown to floor", group: "body" },
  { key: "neck", label: "Neck", hint: "Base of neck", group: "body" },
  { key: "bust", label: "Bust / chest", hint: "Fullest point", group: "body" },
  { key: "waist", label: "Waist", hint: "Natural waist", group: "body" },
  { key: "hips", label: "Hips", hint: "Fullest point", group: "body" },
  { key: "shoulder", label: "Shoulder", hint: "Shoulder point to shoulder point", group: "body" },
  { key: "napeToWaist", label: "Nape to waist", hint: "Back neck to waist", group: "body" },
  { key: "sleeve", label: "Sleeve", hint: "Shoulder to wrist", group: "arm" },
  { key: "bicep", label: "Bicep", hint: "Fullest point, arm relaxed", group: "arm" },
  { key: "frontRise", label: "Front rise", hint: "Crotch to waist, front", group: "leg" },
  { key: "backRise", label: "Back rise", hint: "Crotch to waist, back", group: "leg" },
  { key: "thigh", label: "Thigh", hint: "Fullest point", group: "leg" },
  { key: "inseam", label: "Inseam", hint: "Crotch to ankle", group: "leg" },
  { key: "outseam", label: "Outseam", hint: "Waist to ankle, outer", group: "leg" },
  { key: "hem", label: "Hem", hint: "Leg opening", group: "leg" },
] as const satisfies readonly MeasurementField[];

export type MeasurementFieldKey = (typeof MEASUREMENT_FIELDS)[number]["key"];

export const MEASUREMENT_UNIT = "cm";

export const measurementFieldKeys = MEASUREMENT_FIELDS.map((field) => field.key);

export function isMeasurementFieldKey(value: string): value is MeasurementFieldKey {
  return measurementFieldKeys.includes(value as MeasurementFieldKey);
}

export function fieldsInGroup(group: MeasurementGroupId) {
  return MEASUREMENT_FIELDS.filter((field) => field.group === group);
}
