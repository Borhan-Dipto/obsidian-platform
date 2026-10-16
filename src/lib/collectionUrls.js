/*
 * Clean, permanent collection URLs: /collections/<slug>.
 * The slug is derived from the series name, so it always matches what
 * customers see (e.g. "Artifact Series" -> /collections/artifact-series).
 * Safe for server and client.
 */

export function createCollectionSlug(series) {
  return String(series ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function createCollectionPath(series) {
  const slug = createCollectionSlug(series);

  return slug ? `/collections/${slug}` : "/shop";
}

/* Finds the series whose slug matches, from a list of series names. */
export function findSeriesBySlug(seriesNames, slug) {
  const wanted = String(slug ?? "").toLocaleLowerCase("en");

  return (
    (seriesNames || []).find(
      (series) => createCollectionSlug(series) === wanted
    ) || ""
  );
}

/*
 * True when a /shop query only selects a series (no search, colour,
 * price, sort...). Those URLs permanently move to the collection page.
 */
export function isSeriesOnlyQuery(params = {}) {
  const keys = Object.keys(params || {}).filter((key) => {
    const value = params[key];

    return Array.isArray(value)
      ? value.some((item) => String(item ?? "").trim())
      : String(value ?? "").trim() !== "";
  });

  return keys.length === 1 && keys[0] === "series";
}
