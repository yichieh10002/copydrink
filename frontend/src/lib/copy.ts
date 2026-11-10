import type { Choice, MenuItem } from "./types";

export function copyDrinkText(input: {
  item: Pick<MenuItem, "name">;
  brand: string;
  size: string;
  selections: Array<{ role: string; name: string; choices: Choice[] }>;
  quantity: number;
  signature?: string;
  includeBrand?: boolean;
  note?: string;
  price?: number | null;
  includePrice?: boolean;
  order?: Array<"signature" | "brand" | "drink">;
  separator?: "｜" | " " | "•";
}) {
  const values = input.selections.flatMap((group) => {
    if (group.role === "topping")
      return group.choices.map((c) => "加" + c.label);
    if (group.role === "custom")
      return group.choices.map((c) => group.name + "：" + c.label);
    return group.choices.map((c) => c.label);
  });
  const parts = {
    signature: [input.signature?.trim()].filter(Boolean) as string[],
    brand: input.includeBrand ? [input.brand] : [],
    drink: [
      input.item.name,
      input.size,
      ...values,
      `${input.quantity} 杯`,
      ...(input.includePrice &&
      input.price !== null &&
      input.price !== undefined
        ? [`$${input.price}`]
        : []),
      ...(input.note?.trim() ? ["備註：" + input.note.trim()] : []),
    ],
  };
  const sep =
    input.separator === " " ? " " : input.separator === "•" ? " • " : "｜";
  return (input.order || ["signature", "brand", "drink"])
    .flatMap((key) => parts[key])
    .filter((value) => value.trim() !== "")
    .join(sep);
}
