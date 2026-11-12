import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import type { ReportStatus } from "../../../shared/report.ts";

export type Tone = "blue" | "mint" | "lavender";

/**
 * Glass-style icon: white glass tile, light gradient blob, frosted pane, glyph.
 * Size "s" drops the decorative layers (used inside buttons and chips).
 */
export function GlassIcon({
  icon: Icon,
  tone = "blue",
  size = "m",
  dot = false,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "s" | "m" | "l";
  dot?: boolean;
}) {
  return (
    <span className={`gi gi--${size} gi--${tone}`} aria-hidden="true">
      <Icon strokeWidth={2.1} />
      {dot && <span className="gi__dot" />}
    </span>
  );
}

/** Large translucent overlapping circles behind the whole app (purely decorative). */
export function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <span className="bg__c bg__c--lavender" />
      <span className="bg__c bg__c--sky" />
      <span className="bg__c bg__c--mint" />
      <span className="bg__c bg__c--blue" />
      <span className="bg__c bg__c--mint2" />
    </div>
  );
}

export function Header({ onHome }: { onHome: () => void }) {
  return (
    <header className="topbar glass-bar">
      <button className="brand" onClick={onHome} aria-label="На главную">
        <GlassIcon icon={Sparkles} tone="blue" size="m" />
        <span className="brand__text">
          <span className="brand__name">Ассистент руководителя</span>
          <span className="brand__sub">Photoprint</span>
        </span>
      </button>
      <span className="chip chip--glass topbar__tag">
        <span className="topbar__dot" aria-hidden="true" /> ИИ-ассистент
      </span>
    </header>
  );
}

const STATUS: Record<ReportStatus, { label: string; cls: string }> = {
  pending_review: { label: "Ожидает проверки", cls: "badge--pending" },
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
