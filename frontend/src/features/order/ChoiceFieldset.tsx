import type { Choice, Cup, OptionGroup } from "@/lib/types";
import { temperature } from "@/lib/menu";
import { RequiredMark } from "@/components/RequiredMark";

export function CupChoices({
  cups,
  size,
  onChange,
}: {
  cups: Cup[];
  size: string;
  onChange: (size: string) => void;
}) {
  return (
    <fieldset className="choice-group">
      <legend>
        杯型
        <RequiredMark />
      </legend>
      <div className="choice-list">
        {cups.map((c) => (
          <label className="pill" key={c.size}>
            <input
              type="radio"
              name="cup"
              checked={size === c.size}
              onChange={() => onChange(c.size)}
            />
            {c.size}
            {c.capacity && <small>{c.capacity}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function ChoiceFieldset({
  group,
  selected,
  onChoose,
}: {
  group: OptionGroup;
  selected: string[];
  onChoose: (choice: Choice) => void;
}) {
  return (
    <fieldset className="choice-group">
      <legend>
        {group.name}{" "}
        {group.required ? (
          <>
            （必選）
            <RequiredMark />
          </>
        ) : (
          "（選填）"
        )}
      </legend>
      {group.mode === "fixed" ? (
        <p className="fixed-choice">
          {group.choices.find((c) => c.id === group.fixedChoiceId)?.label ||
            group.choices[0]?.label}
          （固定）
        </p>
      ) : (
        <div className="choice-list">
          {group.choices.map((choice) => (
            <label className="pill" key={choice.id}>
              <input
                type={group.kind === "multiple" ? "checkbox" : "radio"}
                name={group.id}
                checked={selected.includes(choice.id)}
                onChange={() => onChoose(choice)}
              />
              {choice.label}
              {choice.price ? ` +$${choice.price}` : ""}
              {group.role === "temperature" &&
              temperature(choice) === "hot" &&
              group.hotCupSizes?.length ? (
                <small>僅{group.hotCupSizes.join("、")}</small>
              ) : null}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
