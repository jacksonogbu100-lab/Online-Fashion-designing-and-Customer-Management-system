import {
  MEASUREMENT_FIELDS,
  MEASUREMENT_GROUPS,
  MEASUREMENT_UNIT,
  fieldsInGroup,
} from "@/lib/measurements/fields";
import { formatCentimetres } from "@/lib/measurements/format";
import type { MeasurementValues } from "@/lib/measurements/parse";

export function MeasurementChart({
  values,
  notes,
  variant = "summary",
}: {
  values: MeasurementValues;
  notes?: string | null;
  variant?: "summary" | "workroom";
}) {
  const filled = MEASUREMENT_FIELDS.filter((field) => typeof values[field.key] === "number");
  const showAll = variant === "workroom";

  return (
    <div className="flex flex-col gap-8">
      {!showAll && filled.length === 0 ? (
        <p className="text-sm text-muted-foreground">No numbers on this profile.</p>
      ) : (
        MEASUREMENT_GROUPS.map((group) => {
          const fields = showAll
            ? fieldsInGroup(group.id)
            : fieldsInGroup(group.id).filter((field) => typeof values[field.key] === "number");
          if (fields.length === 0) {
            return null;
          }

          return (
            <section key={group.id} className="flex flex-col gap-2">
              <h3 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                {group.label}
              </h3>
              <dl className="grid gap-1 sm:grid-cols-2">
                {fields.map((field) => {
                  const value = values[field.key];
                  const hasValue = typeof value === "number";
                  return (
                    <div
                      key={field.key}
                      className="flex min-h-10 items-baseline justify-between gap-3 border-b border-border/70 py-2"
                    >
                      <dt className="text-sm text-muted-foreground">{field.label}</dt>
                      <dd className="font-medium tabular-nums">
                        {hasValue ? formatCentimetres(value) : "—"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          );
        })
      )}
      <p className="text-xs text-muted-foreground">All figures are in {MEASUREMENT_UNIT}.</p>
      {notes ? (
        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{notes}</p>
        </div>
      ) : null}
    </div>
  );
}
