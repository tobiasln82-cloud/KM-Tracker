import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import type { GeoResult, Place } from "@/lib/types";

interface Props {
  id: string;
  label: string;
  placeholder: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  testId: string;
}

export default function PlaceSearch({ id, label, placeholder, value, onChange, testId }: Props) {
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["geocode", debounced],
    queryFn: () => apiGet<GeoResult[]>(`/geocode?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2 && !value,
    staleTime: 5 * 60_000,
  });

  return (
    <div ref={boxRef} className="relative space-y-1.5">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      {value ? (
        <div
          data-testid={`${testId}-selected`}
          className="flex h-11 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-900"
        >
          <MapPin className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate font-medium">{value.name}</span>
          <button
            type="button"
            data-testid={`${testId}-clear`}
            aria-label="Auswahl entfernen"
            onClick={() => {
              onChange(null);
              setText("");
            }}
            className="ml-auto rounded p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={id}
            data-testid={testId}
            placeholder={placeholder}
            value={text}
            autoComplete="off"
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="h-11"
          />
          {isFetching && <Loader2 className="absolute right-3 top-3 size-5 animate-spin text-muted-foreground" />}
        </div>
      )}
      {open && !value && debounced.length >= 2 && (
        <ul
          data-testid={`${testId}-results`}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-xl"
        >
          {isError && <li className="px-3 py-2 text-sm text-destructive">Ortssuche nicht erreichbar.</li>}
          {data?.length === 0 && !isFetching && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Keine Orte gefunden.</li>
          )}
          {data?.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button
                type="button"
                data-testid={`${testId}-result-${i}`}
                onClick={() => {
                  onChange({ name: r.detail ? `${r.name}, ${r.detail.split(", ").pop()}` : r.name, lat: r.lat, lon: r.lon });
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span className="text-sm font-semibold">{r.name}</span>
                {r.detail && <span className="text-xs text-muted-foreground">{r.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
