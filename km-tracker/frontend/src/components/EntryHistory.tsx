import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fmtDate, fmtKm, useDeleteEntry } from "@/lib/queries";
import type { Entry } from "@/lib/types";

export default function EntryHistory({ entries }: { entries: Entry[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const del = useDeleteEntry();

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm" data-testid="entry-history-container">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-extrabold tracking-tight">Fahrtenbuch</h2>
        <span className="text-xs text-muted-foreground" data-testid="entry-count">
          {entries.length} {entries.length === 1 ? "Eintrag" : "Einträge"}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="entry-history-empty">
          Noch keine Fahrten. Trag deine ersten Kilometer ein und sieh, wie du auf der Karte vorankommst.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          <AnimatePresence initial={false}>
            {entries.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                className="flex items-start gap-3 py-3"
                data-testid={`entry-item-${e.id}`}
              >
                <div className="w-20 shrink-0 font-mono text-base font-bold text-emerald-700" data-testid="entry-km">
                  +{fmtKm(e.km)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800" data-testid="entry-date">{fmtDate(e.date)}</p>
                  {e.note && <p className="text-sm text-muted-foreground" data-testid="entry-note">{e.note}</p>}
                </div>
                {confirmId === e.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      data-testid="confirm-delete-km-entry-btn"
                      onClick={() =>
                        del.mutate(e.id, {
                          onSuccess: () => toast.success("Eintrag gelöscht"),
                          onSettled: () => setConfirmId(null),
                        })
                      }
                      className="rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Löschen
                    </button>
                    <button
                      type="button"
                      data-testid="cancel-delete-km-entry-btn"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Eintrag löschen"
                    data-testid="delete-km-entry-btn"
                    onClick={() => setConfirmId(e.id)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
