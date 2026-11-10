export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u200bˊˇˋ˙]+/g, "");
}

export function matchesSearch(terms: Array<string | undefined>, query: string) {
  const normalized = normalizeSearch(query);
  return (
    !!normalized &&
    terms.some((term) => normalizeSearch(term || "").includes(normalized))
  );
}
