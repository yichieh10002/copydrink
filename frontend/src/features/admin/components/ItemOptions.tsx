"use client";
import { useState } from "react";
import type { AdminDocument, AdminItem } from "../types";
import type { OptionGroup } from "@/lib/types";
import {
  changeOptionMode,
  optionEditorState,
  setFixedDescription,
  setOnlyHot,
} from "../model";
import { FormField, GrowingTextarea } from "./FormField";
import { AdditionalChoices } from "./AdditionalChoices";

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
          const {
              legacy,
              override,
              mode,
              choices,
              fixedChoice,
              unmatchedFixedLabel,
            } = optionEditorState(item, group),
            availableChoices = [
              ...choices,
              ...(override.additionalChoices || []),
            ];
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
                    onChange(changeOptionMode(item, group, e.target.value))
                  }
                >
                  {legacy && mode !== "fixed-text" && (
                    <option
                      value={
                        fixedChoice || unmatchedFixedLabel
                          ? "legacy-fixed"
                          : "legacy"
                      }
                    >
                      {unmatchedFixedLabel
                        ? "沿用舊版固定說明"
                        : fixedChoice
                          ? "沿用舊版固定選項"
                          : "沿用舊版單杯限制"}
                    </option>
                  )}
                  <option value="inherit">沿用店家預設</option>
                  <option value="disabled">這杯不顯示</option>
                  <option value="fixed" disabled={!choices.length}>
                    固定為店家選項
                  </option>
                  {(group.role === "sweetness" ||
                    group.role === "temperature") && (
                    <option value="fixed-text">固定說明（自訂文字）</option>
                  )}
                  <option value="custom" disabled={!choices.length}>
                    只提供指定選項
                  </option>
                </select>
              </div>
              {mode === "legacy" && (
                <p className="text-sm text-blue-800">
                  舊版設定目前只提供：
                  {choices.map((choice) => choice.label).join("、") ||
                    "無可選項"}
                  。 改選「沿用店家預設」才會移除這杯的舊限制。
                </p>
              )}
              {(mode === "legacy-fixed" || mode === "fixed-text") && (
                <FormField
                  label={
                    group.role === "sweetness"
                      ? "固定甜度文字"
                      : "固定冰量／溫度文字"
                  }
                  required
                  hint="會直接顯示在原本的甜度或冰量欄，也會寫進複製文字；顧客無需再選。"
                  error={
                    error === "請填寫固定顯示文字" &&
                    !(
                      group.role === "sweetness"
                        ? item.fixedSugar
                        : item.fixedIce
                    )?.trim()
                      ? error
                      : undefined
                  }
                >
                  <input
                    className="admin-input"
                    aria-invalid={
                      error === "請填寫固定顯示文字" &&
                      !(
                        group.role === "sweetness"
                          ? item.fixedSugar
                          : item.fixedIce
                      )?.trim()
                    }
                    value={
                      group.role === "sweetness"
                        ? item.fixedSugar || ""
                        : item.fixedIce || ""
                    }
                    maxLength={60}
                    onChange={(event) =>
                      onChange(
                        setFixedDescription(item, group, event.target.value),
                      )
                    }
                    placeholder={
                      group.role === "sweetness"
                        ? "例如：甜度固定"
                        : "例如：固定少冰"
                    }
                  />
                </FormField>
              )}
              {group.role === "temperature" && !!item.variants?.length && (
                <p className="text-sm text-amber-800">
                  既有杯型溫度限制仍會生效：
                  {item.variants
                    .map((variant) => `${variant.size} ${variant.temp}`)
                    .join("、")}
                  。修改上方選項不會移除這些限制。
                </p>
              )}
              {mode === "fixed" && (
                <FormField label="固定為">
                  <select
                    className="admin-input"
                    value={override.fixedChoiceId || choices[0].id}
                    onChange={(e) =>
                      setOverride(group.id, {
                        fixedChoiceId: e.target.value,
                        choiceIds: [e.target.value],
                      })
                    }
                  >
                    {availableChoices.map((choice) => (
                      <option key={choice.id} value={choice.id}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              {group.role === "temperature" && (
                <div className="admin-row">
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() => {
                      if (
                        (item.variants?.length ||
                          item.cups.some(
                            (cup) =>
                              cup.showWhenChoiceIds?.length ||
                              cup.optionChoiceIds?.[group.id]?.length,
                          )) &&
                        !window.confirm(
                          "只做熱飲會取代這杯原有的杯型溫度限制；杯型和價格會保留。確定套用？",
                        )
                      )
                        return;
                      onChange(setOnlyHot(item, group));
                    }}
                  >
                    只做熱飲
                  </button>
                  <span className="text-sm text-slate-500">
                    只保留熱飲選項；店家沒設定熱飲時，會為這杯加入熱飲。
                  </span>
                </div>
              )}
              {mode === "custom" && (
                <div className="admin-row">
                  {availableChoices.map((choice) => (
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
              {mode !== "legacy" &&
                mode !== "legacy-fixed" &&
                mode !== "fixed-text" &&
                (group.role === "sweetness" ||
                  group.role === "temperature") && (
                  <AdditionalChoices
                    group={group}
                    choices={override.additionalChoices || []}
                    usedChoiceIds={item.cups.flatMap((cup) => [
                      ...(cup.showWhenChoiceIds || []),
                      ...Object.values(cup.optionChoiceIds || {}).flat(),
                    ])}
                    onChange={(choices) => {
                      const valid = new Set(choices.map((choice) => choice.id));
                      const previous = override.additionalChoices || [];
                      const removed = new Set(
                        previous
                          .filter((choice) => !valid.has(choice.id))
                          .map((choice) => choice.id),
                      );
                      const added = choices
                        .filter(
                          (choice) =>
                            !previous.some((old) => old.id === choice.id),
                        )
                        .map((choice) => choice.id);
                      setOverride(group.id, {
                        additionalChoices: choices,
                        choiceIds:
                          mode === "custom"
                            ? [
                                ...(override.choiceIds || []).filter(
                                  (id) => !removed.has(id),
                                ),
                                ...added,
                              ]
                            : override.choiceIds?.filter(
                                (id) => !removed.has(id),
                              ),
                        fixedChoiceId: removed.has(override.fixedChoiceId || "")
                          ? choices[0].id
                          : override.fixedChoiceId,
                      });
                    }}
                  />
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
