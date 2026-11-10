"use client";
import { createContext, useContext, useState } from "react";
import type { MenuItem } from "@/lib/types";

type StoreSelection = {
  selected: MenuItem | null;
  setSelected: (item: MenuItem | null) => void;
};

const SelectionContext = createContext<StoreSelection | null>(null);

export function StoreSelectionProvider({
  initialItem,
  children,
}: {
  initialItem: MenuItem | null;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<MenuItem | null>(initialItem);
  return (
    <SelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useStoreSelection() {
  const selection = useContext(SelectionContext);
  if (!selection) throw new Error("店家選擇狀態未初始化");
  return selection;
}
