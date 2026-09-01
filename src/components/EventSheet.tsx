import { CalendarDays, Tag } from "lucide-react";
import { createPortal } from "react-dom";
import type { CalendarEvent } from "../types";
import { categoryMeta, displayEventTitle, eventColor } from "../lib/calendar";
import { formatRange } from "../lib/dates";

type EventSheetProps = {
  event: CalendarEvent | null;
  onClose: () => void;
};

export function EventSheet({ event, onClose }: EventSheetProps) {
  if (!event || typeof document === "undefined") return null;
  const meta = categoryMeta[event.category];
  const title = displayEventTitle(event);
  const color = eventColor(event);

  return createPortal(
    <div className="event-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheet-scrim" type="button" aria-label="关闭事件详情" onClick={onClose} />
      <section className="sheet-panel">
        <div className={`sheet-ribbon ${meta.className}`} style={{ backgroundColor: color }} />
        <button className="sheet-close" type="button" onClick={onClose}>
          关闭
        </button>
        <p className="sheet-category">{meta.label}</p>
        <h2>{title}</h2>
        <div className="sheet-meta">
          <span>
            <CalendarDays size={16} />
            {formatRange(event.date, event.endDate)}
          </span>
          {event.audience ? (
            <span>
              <Tag size={16} />
              {event.audience}
            </span>
          ) : null}
        </div>
        {event.note ? <p className="sheet-note">{event.note}</p> : null}
      </section>
    </div>,
    document.body
  );
}
