import { Archive, ArrowRight, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtKm, useArchive } from "@/lib/queries";
import { useState } from "react";

export default function ArchiveDialog() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useArchive(open);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" data-testid="archive-modal-trigger" className="gap-1.5" />}>
        <Archive className="size-4" /> <span className="hidden sm:inline">Archiv</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold">Abgeschlossene Touren</DialogTitle>
          <DialogDescription>Alle Routen, deren Ziel du erreicht hast.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-auto" data-testid="archive-list">
          {isLoading && <p className="text-sm text-muted-foreground">Lädt…</p>}
          {isError && <p className="text-sm text-destructive">Archiv konnte nicht geladen werden.</p>}
          {data?.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="archive-empty">
              Noch keine Tour abgeschlossen. Dein erstes Ziel wartet!
            </p>
          )}
          {data?.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border p-3" data-testid={`archive-item-${r.id}`}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-semibold">
                  {r.start.name.split(",")[0]} <ArrowRight className="size-3" /> {r.end.name.split(",")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.first_date && r.last_date ? `${fmtDate(r.first_date)} – ${fmtDate(r.last_date)} · ` : ""}
                  {r.entry_count} Fahrten
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-700">{fmtKm(r.ridden_km)} km</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
