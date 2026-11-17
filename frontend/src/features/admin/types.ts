import type { MenuDocument, MenuItem } from "@/lib/types";

export type AdminItem = MenuItem & {
  brand?: string;
  source?: string;
  internalNote?: string;
  recommended?: boolean;
  order?: number;
  createdAt?: string;
};
export type AdminDocument = Omit<MenuDocument, "items" | "activities"> & {
  items: AdminItem[];
  activities: Array<{ id: string; name: string; active: boolean }>;
};
export type Draft = {
  store_key: string;
  document: AdminDocument;
  revision: number;
  updated_at: string;
};
export type DraftHeader = {
  store_key: string;
  revision: number;
  updated_at: string;
  brand: { name: string };
};
export type Publication = {
  id: string;
  source_revision: number;
  published_at: string;
  is_current: boolean;
};

export type WarmNotice = {
  id: string;
  brand: string;
  note: string;
  enabled: boolean;
  order: number;
};
export type WarmDocument = {
  scope: "site-settings";
  schemaVersion: 1;
  kind: "warm-drink-notices";
  brand: { name: string };
  items: [];
  notices: WarmNotice[];
};
export type WarmDraft = {
  store_key: string;
  document: WarmDocument;
  revision: number;
  updated_at: string;
};

export const clone = <T>(value: T): T => structuredClone(value);
