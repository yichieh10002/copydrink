import type { Choice, OptionGroup } from "@/lib/types";

export function AdditionalChoices({
  group,
  choices,
  usedChoiceIds,
  selectedChoiceIds,
  onToggle,
  onChange,
}: {
  group: OptionGroup;
  choices: Choice[];
  usedChoiceIds: string[];
  selectedChoiceIds?: string[];
  onToggle?: (id: string, selected: boolean) => void;
  onChange: (choices: Choice[]) => void;
}) {
  const add = (hot = false) => {
    onChange([
      ...choices,
      {
        id: crypto.randomUUID(),
        label: hot ? "熱飲" : "",
        price: 0,
        ...(group.role === "temperature"
          ? { temperature: hot ? ("hot" as const) : ("cold" as const) }
          : {}),
      },
    ]);
  };
  const update = (id: string, patch: Partial<Choice>) =>
    onChange(
      choices.map((choice) =>
        choice.id === id ? { ...choice, ...patch } : choice,
      ),
    );
  return (
    <div className="grid gap-3 border-t border-slate-200 pt-4">
      <div>
        <strong className="text-sm">只加在這杯的選項</strong>
        <p className="text-sm text-slate-500 mt-1">
          店家預設不需要放少數飲料才有的選項；這裡加入後只影響目前這杯。
        </p>
      </div>
      {choices.map((choice) => (
        <div className="admin-row" key={choice.id}>
          {onToggle && (
            <label className="admin-row self-end min-h-11">
              <input
                type="checkbox"
                checked={selectedChoiceIds?.includes(choice.id) || false}
                onChange={(event) => onToggle(choice.id, event.target.checked)}
              />
              使用
            </label>
          )}
          <label className="admin-field grow min-w-40">
            <span className="admin-field-label">
              選項名稱 <span className="text-orange-600">＊</span>
            </span>
            <input
              className="admin-input"
              value={choice.label}
              maxLength={60}
              onChange={(event) =>
                update(choice.id, { label: event.target.value })
              }
              placeholder="例如：熱飲"
            />
          </label>
          {group.role === "temperature" && (
            <label className="admin-field min-w-32">
              <span className="admin-field-label">溫度類型</span>
              <select
                className="admin-input"
                value={choice.temperature || "cold"}
                onChange={(event) =>
                  update(choice.id, {
                    temperature: event.target.value as Choice["temperature"],
                  })
                }
              >
                <option value="cold">冷飲</option>
                <option value="warm">常溫／溫飲</option>
                <option value="hot">熱飲</option>
              </select>
            </label>
          )}
          <label className="admin-field w-28">
            <span className="admin-field-label">加價</span>
            <input
              className="admin-input"
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={choice.price ?? 0}
              onChange={(event) =>
                update(choice.id, {
                  price:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
          </label>
          <button
            className="admin-btn self-end"
            type="button"
            disabled={usedChoiceIds.includes(choice.id)}
            title={
              usedChoiceIds.includes(choice.id)
                ? "請先取消杯型的指定溫度條件"
                : undefined
            }
            onClick={() =>
              onChange(choices.filter((entry) => entry.id !== choice.id))
            }
          >
            移除
          </button>
        </div>
      ))}
      <div className="admin-row">
        <button
          className="admin-btn"
          type="button"
          disabled={choices.length >= 20}
          onClick={() => add()}
        >
          ＋ 新增單杯選項
        </button>
        {group.role === "temperature" &&
          ![...group.choices, ...choices].some(
            (choice) => choice.temperature === "hot" || /熱/.test(choice.label),
          ) && (
            <button
              className="admin-btn"
              type="button"
              disabled={choices.length >= 20}
              onClick={() => add(true)}
            >
              ＋ 這杯可做熱飲
            </button>
          )}
      </div>
    </div>
  );
}
