import { useState } from "react";
import { ArrowRight, Bike, Flag, Loader2, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import ArchiveDialog from "@/components/ArchiveDialog";
import CelebrationDialog from "@/components/CelebrationDialog";
import EntryHistory from "@/components/EntryHistory";
import KmEntryForm from "@/components/KmEntryForm";
import ProgressCard from "@/components/ProgressCard";
import RouteMap from "@/components/RouteMap";
import RoutePlanner from "@/components/RoutePlanner";
import StatsDialog from "@/components/StatsDialog";
import { useActiveRoute, useDeleteRoute } from "@/lib/queries";
import type { Route, RouteState } from "@/lib/types";

function AbortRouteDialog({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteRoute();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" data-testid="abort-route-trigger" className="gap-1.5 text-muted-foreground" />}>
        <Flag className="size-4" /> <span className="hidden sm:inline">Route abbrechen</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Route abbrechen?</DialogTitle>
          <DialogDescription>
            Die Route {route.start.name.split(",")[0]} → {route.end.name.split(",")[0]} und alle zugehörigen Einträge werden gelöscht. Danach kannst du eine neue Route anlegen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" data-testid="abort-route-cancel" />}>Behalten</DialogClose>
          <Button
            variant="destructive"
            data-testid="abort-route-confirm"
            disabled={del.isPending}
            onClick={() =>
              del.mutate(route.id, {
                onSuccess: () => {
                  toast.success("Route gelöscht");
                  setOpen(false);
                },
              })
            }
          >
            {del.isPending && <Loader2 className="size-4 animate-spin" />} Route löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { data, isLoading, isError } = useActiveRoute();
  const [celebrate, setCelebrate] = useState<RouteState | null>(null);
  const route = !isError ? data?.route : null;
  const progress = !isError ? data?.progress : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh">
      <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur-md sm:px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
          <Bike className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg font-extrabold leading-none tracking-tight" data-testid="app-title">VeloTrack</p>
          {route ? (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground" data-testid="header-route-label">
              {route.start.name.split(",")[0]} <ArrowRight className="size-3" /> {route.end.name.split(",")[0]}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Virtuelle Radtouren</p>
          )}
        </div>
        <nav className="ml-auto flex items-center gap-1">
          <StatsDialog />
          <ArchiveDialog />
          {route && <AbortRouteDialog route={route} />}
        </nav>
      </header>

      {route && progress ? (
        <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
          <div className="h-[58vh] shrink-0 lg:h-auto lg:flex-[1.5]">
            <RouteMap route={route} progress={progress} />
          </div>
          <aside className="space-y-4 p-4 sm:p-6 lg:w-[440px] lg:overflow-y-auto xl:w-[480px]">
            <ProgressCard route={route} progress={progress} />
            <KmEntryForm key={route.id} routeId={route.id} today={data!.today} onCompleted={setCelebrate} />
            <EntryHistory entries={data!.entries} />
          </aside>
        </main>
      ) : (
        <main className="relative flex flex-1 items-start overflow-hidden lg:items-center">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-48 left-1/4 size-[420px] rounded-full bg-amber-200/30 blur-3xl" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="space-y-5 lg:pt-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                {isLoading ? "Lädt…" : "Neue Tour"}
              </p>
              <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl" data-testid="empty-state-title">
                Wohin radelst du als Nächstes?
              </h1>
              <p className="max-w-md text-base leading-relaxed text-slate-600">
                Wähle Start und Ziel – wir berechnen eine echte Fahrradroute. Trag deine Trainer-Kilometer ein und sieh auf der Karte und in Street View, wo du gerade unterwegs bist.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><MapIcon className="size-4 text-emerald-600" /> Echte Fahrradroute über OpenStreetMap</li>
                <li className="flex items-center gap-2"><Flag className="size-4 text-emerald-600" /> Eine Tour zur Zeit – am Ziel geht's weiter</li>
              </ul>
            </div>
            <div className="rounded-3xl border bg-white/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
              {isError && (
                <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800" data-testid="backend-offline-note">
                  Server momentan nicht erreichbar – bitte später erneut versuchen.
                </p>
              )}
              <RoutePlanner />
            </div>
          </div>
        </main>
      )}

      <CelebrationDialog state={celebrate} onClose={() => setCelebrate(null)} />
      <Toaster richColors />
    </div>
  );
}
