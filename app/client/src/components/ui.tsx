import { Sparkles } from "lucide-react";
import type { ReportStatus } from "../../../shared/report.ts";

/** The assistant's mark: a solid electric-blue square with a sparkle. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand__mark" style={{ width: size, height: size }} aria-hidden="true">
      <Sparkles size={Math.round(size * 0.55)} strokeWidth={2.2} />
    </span>
  );
}

const STATUS: Record<ReportStatus, { label: string; cls: string }> = {
  pending_review: { label: "Не проверено", cls: "badge--pending" },
  failed: { label: "Ошибка анализа", cls: "badge--error" },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const s = STATUS[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge__dot" />
      {s.label}
    </span>
  );
}
