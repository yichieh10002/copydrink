export type Choice = {
  id: string;
  label: string;
  price?: number | null;
  temperature?: "cold" | "warm" | "hot";
};
export type OptionGroup = {
  id: string;
  name: string;
  kind: "single" | "multiple";
  role: "sweetness" | "temperature" | "topping" | "custom";
  required: boolean;
  choices: Choice[];
  inheritDefault?: boolean;
  maxChoices?: number | null;
  hotCupSizes?: string[];
  hotSurcharge?: number;
  mode?: string;
  fixedChoiceId?: string;
};
export type Cup = {
  size: string;
  capacity?: string;
  prices: Record<string, { price: number | null; available: boolean }>;
  optionChoiceIds?: Record<string, string[]>;
  showWhenChoiceIds?: string[];
};
export type MenuItem = {
  id: string;
  name: string;
  menuCategory: string;
  categoryId?: string;
  note?: string;
  reminder?: string;
  tags?: string[];
  active: boolean;
  activity?: string;
  cups: Cup[];
  optionGroups?: OptionGroup[];
  optionOverrides?: Record<
    string,
    {
      mode?: string;
      choiceIds?: string[];
      fixedChoiceId?: string;
      hotCupSizes?: string[];
      hotSurcharge?: number;
    }
  >;
  fixedSugar?: string | null;
  fixedIce?: string | null;
  allowedToppings?: string[] | null;
  variants?: Array<{ size: string; temp: string }>;
};
export type MenuDocument = {
  schemaVersion: number;
  scope: string;
  brand: {
    name: string;
    logoUrl?: string;
    website?: string;
    menuUrl?: string;
    storesUrl?: string;
    nutritionUrl?: string;
    introduction?:
      string | { title?: string; content?: string; expanded?: boolean };
    reminder?: string;
    tags?: string[];
    aliases?: string[];
    searchAliases?: string[];
    zhuyinAliases?: string[];
    menus?: string[];
    categories?: Array<{
      id: string;
      name: string;
      label?: string;
      tags?: string[];
    }>;
    sugars?: string[];
    ices?: string[];
    toppings?: Array<{ name: string; price: number }>;
    cupTypes?: Array<{ id: string; size: string; capacity?: string }>;
    optionGroups?: OptionGroup[];
    topPicks?: {
      enabled?: boolean;
      title?: string;
      description?: string;
      itemIds?: string[];
      notes?: Record<string, string>;
    };
  };
  activities?: Array<{ id: string; active: boolean }>;
  regions: Array<{ id: string; name: string; enabled: boolean }>;
  items: MenuItem[];
};
export type Store = {
  key: string;
  slug: string;
  publishedAt: string;
  document: MenuDocument;
  items: MenuItem[];
  regions: MenuDocument["regions"];
};
export type StoreSummary = {
  key: string;
  slug: string;
  name: string;
  logoUrl?: string;
  regionCount: number;
  drinkCount: number;
  aliases?: string[];
  searchAliases?: string[];
  zhuyinAliases?: string[];
};
