"use client";
import { useState } from "react";
import type { AdminDocument, AdminItem } from "../types";
import type { OptionGroup } from "@/lib/types";
import { FormField, GrowingTextarea } from "./FormField";

export function ItemOptions({
  document,
  item,
  onChange,
  error,
}: {
  document: AdminDocument;
  item: AdminItem;
  onChange: (next: AdminItem) => void;
  error?: string;
}) {
  const defaults = document.brand.optionGroups?.length
    ? document.brand.optionGroups
    : ([
        {
          id: "sweetness",
          name: "甜度",
          role: "sweetness",
          kind: "single",
          required: true,
          choices: (document.brand.sugars || []).map((label, i) => ({
            id: `sweetness-${i}`,
            label,
            price: 0,
          })),
        },
        {
          id: "temperature",
          name: "冰量／溫熱",
          role: "temperature",
          kind: "single",
          required: true,
          choices: (document.brand.ices || []).map((label, i) => ({
            id: `temperature-${i}`,
            label,
            price: 0,
          })),
        },
        {
          id: "topping",
          name: "配料",
          role: "topping",
          kind: "multiple",
          required: false,
          choices: (document.brand.toppings || []).map((t, i) => ({
            id: `topping-${i}`,
            label: t.name,
            price: t.price,
          })),
        },
      ] as OptionGroup[]);
  const custom = (item.optionGroups || []).filter(
    (g) => g.inheritDefault === false && !defaults.some((d) => d.id === g.id),
  );
  const [choiceText, setChoiceText] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      custom.map((g) => [
        g.id,
        g.choices.map((c) => `${c.label},${c.price || 0}`).join("\n"),
      ]),
    ),
  );
  const overrides = item.optionOverrides || {};
  const setOverride = (id: string, change: Record<string, unknown>) =>
    onChange({
      ...item,
      optionOverrides: { ...overrides, [id]: { ...overrides[id], ...change } },
    });
  const updateGroup = (group: OptionGroup) =>
    onChange({
      ...item,
      optionGroups: [
        ...(item.optionGroups || []).filter((g) => g.id !== group.id),
        group,
      ],
    });
  const temperatureBase = defaults.find((g) => g.role === "temperature");
  const temperatureOwn = item.optionGroups?.find(
    (g) => g.id === temperatureBase?.id,
  );
  const setTemperature = (patch: Partial<OptionGroup>) => {
    if (!temperatureBase) return;
    updateGroup({
      ...temperatureBase,
      ...temperatureOwn,
      inheritDefault: temperatureOwn?.inheritDefault !== false,
      ...patch,
    });
  };
  const setChoices = (group: OptionGroup, raw: string) => {
    setChoiceText((old) => ({ ...old, [group.id]: raw }));
    const choices = raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line, i) => {
        const [label, amount] = line.split(/[,，]/);
        const previous = group.choices[i];
        return {
          id: previous?.id || crypto.randomUUID(),
          label: label.trim(),
          price:
            amount === undefined || amount.trim() === ""
              ? 0
              : Number(amount.trim()),
        };
      });
    updateGroup({ ...group, choices });
  };
  return (
    <section className="admin-card grid gap-5">
      <div>
        <h3 className="text-lg font-bold">單杯客製規則</h3>
        <p className="text-sm text-slate-500 mt-1">
          預設沿用店家選項；特殊飲品可隱藏、固定或限制可選項目。
        </p>
      </div>
      {defaults
        .filter((g) => g.choices.length)
        .map((group) => {
          const override = overrides[group.id] || {},
            mode = override.mode || "inherit";
          return (
            <div
              key={group.id}
              className="rounded-xl border border-slate-200 p-4 grid gap-3"
            >
              <div className="admin-grid">
                <strong>{group.name}</strong>
                <select
                  className="admin-input"
                  aria-label={`${group.name}設定方式`}
                  value={mode}
                  onChange={(e) =>
                    setOverride(group.id, {
                      mode: e.target.value,
                      choiceIds:
                        e.target.value === "fixed"
                          ? [group.choices[0].id]
                          : override.choiceIds,
                      fixedChoiceId: group.choices[0].id,
                    })
                  }
                >
                  <option value="inherit">沿用店家預設</option>
                  <option value="disabled">這杯不顯示</option>
                  <option value="fixed">固定選項</option>
                  <option value="custom">只提供指定選項</option>
                </select>
              </div>
              {mode === "fixed" && (
                <FormField label="固定為">
                  <select
                    className="admin-input"
                    value={override.fixedChoiceId || group.choices[0].id}
                    onChange={(e) =>
                      setOverride(group.id, {
                        fixedChoiceId: e.target.value,
                        choiceIds: [e.target.value],
                      })
                    }
                  >
                    {group.choices.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              {mode === "custom" && (
                <div className="admin-row">
                  {group.choices.map((choice) => (
                    <label className="admin-row" key={choice.id}>
                      <input
                        type="checkbox"
                        checked={(override.choiceIds || []).includes(choice.id)}
                        onChange={(e) =>
                          setOverride(group.id, {
                            choiceIds: e.target.checked
                              ? [...(override.choiceIds || []), choice.id]
                              : (override.choiceIds || []).filter(
                                  (id) => id !== choice.id,
                                ),
                          })
                        }
                      />
                      {choice.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      {temperatureBase && (
        <div className="rounded-xl border border-blue-200 p-4 grid gap-4">
          <h4 className="font-bold">這杯的熱飲規則</h4>
          <p className="text-sm text-slate-500">
            不勾選杯型表示沿用店家規則；加價僅在熱飲選項適用時使用。
          </p>
          <div className="admin-row">
            {document.brand.cupTypes?.map((type) => (
              <label className="admin-row" key={type.id}>
                <input
                  type="checkbox"
                  checked={
                    temperatureOwn?.hotCupSizes?.includes(type.size) || false
                  }
                  onChange={(e) =>
                    setTemperature({
                      hotCupSizes: e.target.checked
                        ? [...(temperatureOwn?.hotCupSizes || []), type.size]
                        : (temperatureOwn?.hotCupSizes || []).filter(
                            (size) => size !== type.size,
                          ),
                    })
                  }
                />
                {type.size}
              </label>
            ))}
          </div>
          <FormField label="熱飲加價">
            <input
              className="admin-input max-w-xs"
              type="number"
              min="0"
              step="1"
              value={temperatureOwn?.hotSurcharge ?? ""}
              onChange={(e) =>
                setTemperature({
                  hotSurcharge:
                    e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              placeholder="0"
            />
          </FormField>
        </div>
      )}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-bold mb-2">這杯專屬的其他客製</h4>
        {custom.map((group) => (
          <div
            key={group.id}
            className="rounded-xl border border-slate-200 p-4 grid gap-4 mb-3"
          >
            <div className="admin-grid">
              <FormField label="顯示名稱" required>
                <input
                  className="admin-input"
                  value={group.name}
                  onChange={(e) =>
                    updateGroup({ ...group, name: e.target.value })
                  }
                />
              </FormField>
              <FormField label="選擇方式">
                <select
                  className="admin-input"
                  value={group.kind}
                  onChange={(e) =>
                    updateGroup({
                      ...group,
                      kind: e.target.value as "single" | "multiple",
                    })
                  }
                >
                  <option value="single">單選</option>
                  <option value="multiple">多選</option>
                </select>
              </FormField>
            </div>
            <label className="admin-row">
              <input
                type="checkbox"
                checked={group.required}
                onChange={(e) =>
                  updateGroup({ ...group, required: e.target.checked })
                }
              />
              必填
            </label>
            <FormField
              label="選項及加價"
              hint="每行一筆，格式：名稱,加價；不加價可只填名稱。"
            >
              <GrowingTextarea
                value={choiceText[group.id] ?? ""}
                onChange={(raw) => setChoices(group, raw)}
              />
            </FormField>
            <button
              className="admin-btn admin-btn-danger w-fit"
              onClick={() =>
                onChange({
                  ...item,
                  optionGroups: (item.optionGroups || []).filter(
                    (g) => g.id !== group.id,
                  ),
                })
              }
              type="button"
            >
              移除此客製
            </button>
          </div>
        ))}
        <button
          className="admin-btn"
          type="button"
          onClick={() => {
            const group: OptionGroup = {
              id: `custom-${crypto.randomUUID()}`,
              name: "",
              kind: "single",
              role: "custom",
              required: false,
              inheritDefault: false,
              choices: [],
            };
            updateGroup(group);
          }}
        >
          ＋ 新增客製項目
        </button>
      </div>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </section>
  );
}
