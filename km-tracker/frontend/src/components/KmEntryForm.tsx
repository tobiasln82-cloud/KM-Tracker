import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorDetail, fmtKm, useAddEntry } from "@/lib/queries";
import type { RouteState } from "@/lib/types";

const QUICK = [5, 10, 25, 50];

export default function KmEntryForm({
  routeId,
  today,
  onCompleted,
}: {
  routeId: string;
  today: string;
  onCompleted: (s: RouteState) => void;
}) {
  const [date, setDate] = useState(today);
  const [km, setKm] = useState("");
  const [note, setNote] = useState("");
  const add = useAddEntry(routeId);
  const kmNum = parseFloat(km.replace(",", "."));
  const valid = Number.isFinite(kmNum) && kmNum > 0 && !!date;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    add.mutate(
      { date, km: kmNum, note: note.trim() || null },
      {
        onSuccess: (s) => {
          setKm("");
          setNote("");
          if (s.route?.status === "completed") onCompleted(s);
          else toast.success(`+${fmtKm(kmNum)} km eingetragen`);
        },
        onError: (err) => toast.error(errorDetail(err, "Eintrag konnte nicht gespeichert werden")),
      },
    );
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm" data-testid="km-entry-form">
      <h2 className="font-heading text-xl font-extrabold tracking-tight">Kilometer eintragen</h2>
      <div className="mt-4 grid grid-cols-[1fr_1.1fr] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="km-date">Datum</Label>
          <Input id="km-date" data-testid="km-date-input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="km-value">Kilometer</Label>
          <Input
            id="km-value"
            data-testid="km-entry-input"
            inputMode="decimal"
            placeholder="z.B. 24,5"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="h-11 font-mono text-base"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            data-testid={`quick-km-${q}`}
            onClick={() => setKm(String(q))}
            className="rounded-full border px-3 py-1 font-mono text-xs font-semibold text-slate-600 transition-[background-color,border-color,color] hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {q} km
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="km-note">Notiz (optional)</Label>
        <Textarea
          id="km-note"
          data-testid="km-note-input"
          placeholder="z.B. Abends auf dem Smart-Trainer"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>
      <Button
        type="submit"
        data-testid="save-km-entry-btn"
        disabled={!valid || add.isPending}
        className="mt-4 h-11 w-full gap-2 font-semibold transition-transform active:scale-[0.98]"
      >
        {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Eintrag speichern
      </Button>
    </form>
  );
}
