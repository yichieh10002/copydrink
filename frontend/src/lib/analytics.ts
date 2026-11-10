// The app has no analytics provider yet. Integrations subscribe here in one place.
// Only fixed event names and non-personal identifiers are allowed.
export type Event =
  | { type: "search_select"; kind: "store" | "drink" }
  | { type: "region_change"; store: string; region: string }
  | { type: "drink_open"; store: string; drink: string }
  | { type: "drink_copy"; store: string; drink: string };
export function track(event: Event) {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("copydrink:analytics", { detail: event }),
    );
}
