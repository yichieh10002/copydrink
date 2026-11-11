import type { Store } from "./types";
import { availableCups, effectiveGroups } from "./menu";

export function buildQuickStores(published: Store[]) {
  return published.map((s) => {
    const groups = s.document.brand.optionGroups || [];
    const labels = (role: string) =>
      groups.find((g) => g.role === role)?.choices.map((c) => c.label) || [];
    return {
      name: s.document.brand.name,
      slug: s.slug,
      items: s.items.map((i) => {
        const cups = availableCups(i, s.regions[0]?.id || "");
        const groups = cups[0] ? effectiveGroups(s.document, i, cups[0]) : [];
        const labels = (role: string) =>
          groups.find((g) => g.role === role)?.choices.map((c) => c.label) ||
          [];
        const customGroups = Array.from(
          cups
            .flatMap((cup) => effectiveGroups(s.document, i, cup))
            .filter((group) => group.role === "custom")
            .reduce((all, group) => {
              const prior = all.get(group.id);
              if (!prior) {
                all.set(group.id, { ...group, choices: [...group.choices] });
              } else {
                for (const choice of group.choices)
                  if (!prior.choices.some((item) => item.id === choice.id))
                    prior.choices.push(choice);
              }
              return all;
            }, new Map<string, ReturnType<typeof effectiveGroups>[number]>()),
        ).map(([, group]) => group);
        return {
          id: i.id,
          name: i.name,
          sizes: [...new Set(i.cups.map((c) => c.size))],
          sugars: labels("sweetness"),
          ices: labels("temperature"),
          toppings: labels("topping"),
          customGroups,
        };
      }),
      sugars: labels("sweetness"),
      ices: labels("temperature"),
      toppings: labels("topping"),
    };
  });
}
