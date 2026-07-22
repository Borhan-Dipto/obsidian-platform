"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const DEFAULT_FILTERS = {
  selectedSeries: "All",
  searchQuery: "",
  selectedColor: "All",
  selectedAvailability: "All",
  selectedSort: "newest",
  minimumPrice: "",
  maximumPrice: "",
};

const AVAILABILITY_OPTIONS = [
  {
    value: "All",
    label: "All",
  },
  {
    value: "in_stock",
    label: "In Stock",
  },
  {
    value: "out_of_stock",
    label: "Sold Out",
  },
];

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "price_low",
    label: "Price: Low To High",
  },
  {
    value: "price_high",
    label: "Price: High To Low",
  },
  {
    value: "name_az",
    label: "Name: A–Z",
  },
];

function cleanText(value, fallback = "") {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const normalizedValue = String(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedValue || fallback;
}

function normalizeOption(value, fallback = "All") {
  return cleanText(value, fallback);
}

function normalizePriceInput(value) {
  const rawValue = String(value ?? "")
    .replace(/[^\d.]/g, "");

  const decimalIndex =
    rawValue.indexOf(".");

  if (decimalIndex === -1) {
    return rawValue.slice(0, 10);
  }

  const integerPart = rawValue
    .slice(0, decimalIndex)
    .slice(0, 10);

  const decimalPart = rawValue
    .slice(decimalIndex + 1)
    .replace(/\./g, "")
    .slice(0, 2);

  return `${integerPart}.${decimalPart}`;
}

function parsePrice(value) {
  const normalizedValue =
    normalizePriceInput(value);

  if (!normalizedValue) {
    return null;
  }

  const price = Number(normalizedValue);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return null;
  }

  return price;
}

function formatPriceValue(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "";
  }

  return String(
    Math.round(price * 100) / 100
  );
}

function normalizeFiltersForNavigation(filters) {
  const normalizedFilters = {
    selectedSeries: normalizeOption(
      filters.selectedSeries,
      "All"
    ),

    searchQuery: cleanText(
      filters.searchQuery
    ),

    selectedColor: normalizeOption(
      filters.selectedColor,
      "All"
    ),

    selectedAvailability:
      normalizeOption(
        filters.selectedAvailability,
        "All"
      ),

    selectedSort: normalizeOption(
      filters.selectedSort,
      "newest"
    ),

    minimumPrice: normalizePriceInput(
      filters.minimumPrice
    ),

    maximumPrice: normalizePriceInput(
      filters.maximumPrice
    ),
  };

  const minimumPrice = parsePrice(
    normalizedFilters.minimumPrice
  );

  const maximumPrice = parsePrice(
    normalizedFilters.maximumPrice
  );

  if (
    minimumPrice !== null &&
    maximumPrice !== null &&
    minimumPrice > maximumPrice
  ) {
    normalizedFilters.minimumPrice =
      formatPriceValue(maximumPrice);

    normalizedFilters.maximumPrice =
      formatPriceValue(minimumPrice);
  }

  return normalizedFilters;
}

function createShopPath(
  pathname,
  filters
) {
  const normalizedFilters =
    normalizeFiltersForNavigation(
      filters
    );

  const searchParams =
    new URLSearchParams();

  if (
    normalizedFilters.selectedSeries &&
    normalizedFilters.selectedSeries !==
      "All"
  ) {
    searchParams.set(
      "series",
      normalizedFilters.selectedSeries
    );
  }

  if (normalizedFilters.searchQuery) {
    searchParams.set(
      "q",
      normalizedFilters.searchQuery
    );
  }

  if (
    normalizedFilters.selectedColor &&
    normalizedFilters.selectedColor !==
      "All"
  ) {
    searchParams.set(
      "color",
      normalizedFilters.selectedColor
    );
  }

  if (
    normalizedFilters.selectedAvailability &&
    normalizedFilters.selectedAvailability !==
      "All"
  ) {
    searchParams.set(
      "availability",
      normalizedFilters.selectedAvailability
    );
  }

  if (normalizedFilters.minimumPrice) {
    searchParams.set(
      "minPrice",
      normalizedFilters.minimumPrice
    );
  }

  if (normalizedFilters.maximumPrice) {
    searchParams.set(
      "maxPrice",
      normalizedFilters.maximumPrice
    );
  }

  if (
    normalizedFilters.selectedSort &&
    normalizedFilters.selectedSort !==
      "newest"
  ) {
    searchParams.set(
      "sort",
      normalizedFilters.selectedSort
    );
  }

  const query =
    searchParams.toString();

  return query
    ? `${pathname}?${query}`
    : pathname;
}

function normalizeInitialFilters(
  filters = {}
) {
  return normalizeFiltersForNavigation({
    selectedSeries:
      filters.selectedSeries ??
      DEFAULT_FILTERS.selectedSeries,

    searchQuery:
      filters.searchQuery ??
      DEFAULT_FILTERS.searchQuery,

    selectedColor:
      filters.selectedColor ??
      DEFAULT_FILTERS.selectedColor,

    selectedAvailability:
      filters.selectedAvailability ??
      DEFAULT_FILTERS.selectedAvailability,

    selectedSort:
      filters.selectedSort ??
      DEFAULT_FILTERS.selectedSort,

    minimumPrice:
      filters.minimumPrice ??
      DEFAULT_FILTERS.minimumPrice,

    maximumPrice:
      filters.maximumPrice ??
      DEFAULT_FILTERS.maximumPrice,
  });
}

function formatMoney(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "0";
  }

  return price.toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  );
}

function getSortLabel(value) {
  return (
    SORT_OPTIONS.find(
      (option) =>
        option.value === value
    )?.label || "Newest"
  );
}

function FilterChip({
  children,
  onRemove,
  removeLabel,
}) {
  return (
    <span className="inline-flex min-h-10 items-center border border-black/15 bg-[#eee7dd] text-[9px] uppercase tracking-[0.2em] text-neutral-700 sm:text-[10px]">
      <span className="px-3 py-2">
        {children}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex min-h-10 min-w-10 items-center justify-center border-l border-black/10 text-base leading-none transition hover:bg-black hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
      >
        ×
      </button>
    </span>
  );
}

export default function ShopFilters({
  initialFilters = DEFAULT_FILTERS,
  seriesOptions = [],
  colorOptions = [],
  resultCount = 0,
  totalProductCount = 0,
  priceBounds = {
    minimum: 0,
    maximum: 0,
  },
}) {
  const router = useRouter();
  const pathname =
    usePathname() || "/shop";

  const searchTimerRef = useRef(null);
  const priceTimerRef = useRef(null);

  const initialSeries =
    normalizeOption(
      initialFilters.selectedSeries,
      "All"
    );

  const initialSearchQuery =
    cleanText(
      initialFilters.searchQuery
    );

  const initialColor =
    normalizeOption(
      initialFilters.selectedColor,
      "All"
    );

  const initialAvailability =
    normalizeOption(
      initialFilters.selectedAvailability,
      "All"
    );

  const initialSort =
    normalizeOption(
      initialFilters.selectedSort,
      "newest"
    );

  const initialMinimumPrice =
    normalizePriceInput(
      initialFilters.minimumPrice
    );

  const initialMaximumPrice =
    normalizePriceInput(
      initialFilters.maximumPrice
    );

  const normalizedInitialFilters =
    normalizeInitialFilters({
      selectedSeries: initialSeries,
      searchQuery:
        initialSearchQuery,
      selectedColor: initialColor,
      selectedAvailability:
        initialAvailability,
      selectedSort: initialSort,
      minimumPrice:
        initialMinimumPrice,
      maximumPrice:
        initialMaximumPrice,
    });

  const [filters, setFilters] =
    useState(
      normalizedInitialFilters
    );

  const filtersRef = useRef(
    normalizedInitialFilters
  );

  const [isPending, startTransition] =
    useTransition();

  useEffect(() => {
    const nextFilters =
      normalizeInitialFilters({
        selectedSeries:
          initialSeries,

        searchQuery:
          initialSearchQuery,

        selectedColor:
          initialColor,

        selectedAvailability:
          initialAvailability,

        selectedSort:
          initialSort,

        minimumPrice:
          initialMinimumPrice,

        maximumPrice:
          initialMaximumPrice,
      });

    filtersRef.current =
      nextFilters;

    setFilters(nextFilters);
  }, [
    initialSeries,
    initialSearchQuery,
    initialColor,
    initialAvailability,
    initialSort,
    initialMinimumPrice,
    initialMaximumPrice,
  ]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(
          searchTimerRef.current
        );
      }

      if (priceTimerRef.current) {
        window.clearTimeout(
          priceTimerRef.current
        );
      }
    };
  }, []);

  const normalizedSeriesOptions =
    useMemo(() => {
      const values = new Map();

      values.set("all", "All");

      for (const option of seriesOptions) {
        const normalizedOption =
          cleanText(option);

        if (!normalizedOption) {
          continue;
        }

        values.set(
          normalizedOption.toLocaleLowerCase(
            "en"
          ),
          normalizedOption
        );
      }

      return Array.from(
        values.values()
      );
    }, [seriesOptions]);

  const normalizedColorOptions =
    useMemo(() => {
      const values = new Map();

      values.set("all", "All");

      for (const option of colorOptions) {
        const normalizedOption =
          cleanText(option);

        if (!normalizedOption) {
          continue;
        }

        values.set(
          normalizedOption.toLocaleLowerCase(
            "en"
          ),
          normalizedOption
        );
      }

      return Array.from(
        values.values()
      );
    }, [colorOptions]);

  const activeFilterCount =
    useMemo(() => {
      return [
        filters.selectedSeries !==
          "All",

        Boolean(
          filters.searchQuery
        ),

        filters.selectedColor !==
          "All",

        filters.selectedAvailability !==
          "All",

        filters.selectedSort !==
          "newest",

        Boolean(
          filters.minimumPrice
        ),

        Boolean(
          filters.maximumPrice
        ),
      ].filter(Boolean).length;
    }, [filters]);

  function clearSearchTimer() {
    if (!searchTimerRef.current) {
      return;
    }

    window.clearTimeout(
      searchTimerRef.current
    );

    searchTimerRef.current =
      null;
  }

  function clearPriceTimer() {
    if (!priceTimerRef.current) {
      return;
    }

    window.clearTimeout(
      priceTimerRef.current
    );

    priceTimerRef.current =
      null;
  }

  function clearPendingTimers() {
    clearSearchTimer();
    clearPriceTimer();
  }

  function updateLocalFilters(
    changes
  ) {
    const nextFilters = {
      ...filtersRef.current,
      ...changes,
    };

    filtersRef.current =
      nextFilters;

    setFilters(nextFilters);

    return nextFilters;
  }

  function navigate(
    nextFilters,
    mode = "push"
  ) {
    const normalizedFilters =
      normalizeFiltersForNavigation(
        nextFilters
      );

    filtersRef.current =
      normalizedFilters;

    setFilters(normalizedFilters);

    const nextPath =
      createShopPath(
        pathname,
        normalizedFilters
      );

    startTransition(() => {
      if (mode === "replace") {
        router.replace(nextPath, {
          scroll: false,
        });

        return;
      }

      router.push(nextPath, {
        scroll: false,
      });
    });
  }

  function updateDiscreteFilter(
    field,
    value
  ) {
    clearPendingTimers();

    const nextFilters =
      updateLocalFilters({
        [field]: value,
      });

    navigate(nextFilters, "push");
  }

  function handleSearchChange(
    event
  ) {
    const searchQuery =
      event.target.value;

    updateLocalFilters({
      searchQuery,
    });

    clearSearchTimer();

    searchTimerRef.current =
      window.setTimeout(() => {
        navigate(
          filtersRef.current,
          "replace"
        );

        searchTimerRef.current =
          null;
      }, 350);
  }

  function commitSearchImmediately() {
    clearSearchTimer();

    navigate(
      filtersRef.current,
      "replace"
    );
  }

  function handleSearchKeyDown(
    event
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    commitSearchImmediately();
  }

  function handlePriceChange(
    field,
    value
  ) {
    const normalizedValue =
      normalizePriceInput(value);

    updateLocalFilters({
      [field]: normalizedValue,
    });

    clearPriceTimer();

    priceTimerRef.current =
      window.setTimeout(() => {
        navigate(
          filtersRef.current,
          "replace"
        );

        priceTimerRef.current =
          null;
      }, 400);
  }

  function commitPriceImmediately() {
    clearPriceTimer();

    navigate(
      filtersRef.current,
      "replace"
    );
  }

  function removeFilter(field) {
    const resetValues = {
      selectedSeries: "All",
      searchQuery: "",
      selectedColor: "All",
      selectedAvailability: "All",
      selectedSort: "newest",
      minimumPrice: "",
      maximumPrice: "",
    };

    clearPendingTimers();

    const nextFilters =
      updateLocalFilters({
        [field]:
          resetValues[field],
      });

    navigate(nextFilters, "push");
  }

  function clearPriceRange() {
    clearPendingTimers();

    const nextFilters =
      updateLocalFilters({
        minimumPrice: "",
        maximumPrice: "",
      });

    navigate(nextFilters, "push");
  }

  function resetAllFilters() {
    clearPendingTimers();

    const nextFilters = {
      ...DEFAULT_FILTERS,
    };

    filtersRef.current =
      nextFilters;

    setFilters(nextFilters);

    startTransition(() => {
      router.push(pathname, {
        scroll: false,
      });
    });
  }

  const minimumCatalogPrice =
    Number(
      priceBounds.minimum || 0
    );

  const maximumCatalogPrice =
    Number(
      priceBounds.maximum || 0
    );

  return (
    <section
      aria-label="Shop filters"
      aria-busy={isPending}
      className="mt-12 border-y border-black/10 sm:mt-14"
    >
      <div className="py-6 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Instant Filters
            </p>

            <p
              className="mt-3 text-sm text-neutral-700"
              aria-live="polite"
              aria-atomic="true"
            >
              {isPending
                ? "Updating products..."
                : `${Number(
                    resultCount || 0
                  ).toLocaleString(
                    "en-US"
                  )} ${
                    Number(
                      resultCount || 0
                    ) === 1
                      ? "product"
                      : "products"
                  } shown`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wishlist"
              className="inline-flex min-h-11 items-center justify-center border border-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.23em] text-neutral-600 transition hover:bg-black hover:text-[#f1ece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1ece4] sm:text-xs sm:tracking-[0.25em]"
            >
              Wishlist
            </Link>

            <button
              type="button"
              onClick={resetAllFilters}
              disabled={
                activeFilterCount === 0 ||
                isPending
              }
              className="inline-flex min-h-11 items-center justify-center bg-[#0b0b0b] px-4 py-2 text-[10px] uppercase tracking-[0.23em] text-[#f1ece4] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-xs sm:tracking-[0.25em]"
            >
              Show All Products
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.35fr_0.85fr_0.85fr_0.95fr]">
          <label className="relative block">
            <span className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Search
            </span>

            <input
              type="search"
              value={
                filters.searchQuery
              }
              onChange={
                handleSearchChange
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Product, color, series..."
              autoComplete="off"
              className="min-h-13 w-full border border-black/15 bg-[#eee7dd] px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-neutral-500 focus:border-black focus-visible:ring-1 focus-visible:ring-black"
            />

            {filters.searchQuery ? (
              <button
                type="button"
                onClick={() =>
                  removeFilter(
                    "searchQuery"
                  )
                }
                aria-label="Clear product search"
                className="absolute bottom-0 right-0 flex h-[52px] w-11 items-center justify-center text-xl text-neutral-500 transition hover:text-black"
              >
                ×
              </button>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Series
            </span>

            <select
              value={
                filters.selectedSeries
              }
              onChange={(event) =>
                updateDiscreteFilter(
                  "selectedSeries",
                  event.target.value
                )
              }
              className="min-h-13 w-full border border-black/15 bg-[#eee7dd] px-4 py-3 text-xs uppercase tracking-[0.17em] outline-none transition focus:border-black focus-visible:ring-1 focus-visible:ring-black"
            >
              {normalizedSeriesOptions.map(
                (series) => (
                  <option
                    key={series}
                    value={series}
                  >
                    {series === "All"
                      ? "All Series"
                      : series}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Color
            </span>

            <select
              value={
                filters.selectedColor
              }
              onChange={(event) =>
                updateDiscreteFilter(
                  "selectedColor",
                  event.target.value
                )
              }
              className="min-h-13 w-full border border-black/15 bg-[#eee7dd] px-4 py-3 text-xs uppercase tracking-[0.17em] outline-none transition focus:border-black focus-visible:ring-1 focus-visible:ring-black"
            >
              {normalizedColorOptions.map(
                (color) => (
                  <option
                    key={color}
                    value={color}
                  >
                    {color === "All"
                      ? "All Colors"
                      : color}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Sort
            </span>

            <select
              value={
                filters.selectedSort
              }
              onChange={(event) =>
                updateDiscreteFilter(
                  "selectedSort",
                  event.target.value
                )
              }
              className="min-h-13 w-full border border-black/15 bg-[#eee7dd] px-4 py-3 text-xs uppercase tracking-[0.15em] outline-none transition focus:border-black focus-visible:ring-1 focus-visible:ring-black"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-5 border-t border-black/10 pt-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <fieldset>
            <legend className="text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Price Range
            </legend>

            <div className="mt-2 grid max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
              <label>
                <span className="sr-only">
                  Minimum price
                </span>

                <div className="flex min-h-13 items-center border border-black/15 bg-[#eee7dd] focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span
                    aria-hidden="true"
                    className="pl-4 text-sm text-neutral-500"
                  >
                    ৳
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      filters.minimumPrice
                    }
                    onChange={(event) =>
                      handlePriceChange(
                        "minimumPrice",
                        event.target.value
                      )
                    }
                    onBlur={
                      commitPriceImmediately
                    }
                    placeholder={formatMoney(
                      minimumCatalogPrice
                    )}
                    className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-neutral-500"
                  />
                </div>
              </label>

              <span
                aria-hidden="true"
                className="text-neutral-400"
              >
                —
              </span>

              <label>
                <span className="sr-only">
                  Maximum price
                </span>

                <div className="flex min-h-13 items-center border border-black/15 bg-[#eee7dd] focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span
                    aria-hidden="true"
                    className="pl-4 text-sm text-neutral-500"
                  >
                    ৳
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      filters.maximumPrice
                    }
                    onChange={(event) =>
                      handlePriceChange(
                        "maximumPrice",
                        event.target.value
                      )
                    }
                    onBlur={
                      commitPriceImmediately
                    }
                    placeholder={formatMoney(
                      maximumCatalogPrice
                    )}
                    className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-neutral-500"
                  />
                </div>
              </label>
            </div>

            <p className="mt-2 text-[10px] leading-5 text-neutral-500">
              Catalog range: ৳
              {formatMoney(
                minimumCatalogPrice
              )}{" "}
              — ৳
              {formatMoney(
                maximumCatalogPrice
              )}
            </p>
          </fieldset>

          <fieldset>
            <legend className="text-[9px] uppercase tracking-[0.22em] text-neutral-500">
              Availability
            </legend>

            <div className="mt-2 flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map(
                (option) => {
                  const isSelected =
                    filters.selectedAvailability ===
                    option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateDiscreteFilter(
                          "selectedAvailability",
                          option.value
                        )
                      }
                      aria-pressed={
                        isSelected
                      }
                      className={`min-h-11 border px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1ece4] sm:text-xs ${
                        isSelected
                          ? "border-black bg-black text-[#f1ece4]"
                          : "border-black/20 text-neutral-600 hover:bg-black hover:text-[#f1ece4]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>
        </div>

        {activeFilterCount > 0 ? (
          <div className="mt-6 border-t border-black/10 pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <p className="shrink-0 pt-3 text-[9px] uppercase tracking-[0.24em] text-neutral-500">
                Active Filters
              </p>

              <div className="flex flex-wrap gap-2">
                {filters.selectedSeries !==
                "All" ? (
                  <FilterChip
                    onRemove={() =>
                      removeFilter(
                        "selectedSeries"
                      )
                    }
                    removeLabel="Remove series filter"
                  >
                    Series:{" "}
                    {
                      filters.selectedSeries
                    }
                  </FilterChip>
                ) : null}

                {filters.searchQuery ? (
                  <FilterChip
                    onRemove={() =>
                      removeFilter(
                        "searchQuery"
                      )
                    }
                    removeLabel="Remove search filter"
                  >
                    Search:{" "}
                    {filters.searchQuery}
                  </FilterChip>
                ) : null}

                {filters.selectedColor !==
                "All" ? (
                  <FilterChip
                    onRemove={() =>
                      removeFilter(
                        "selectedColor"
                      )
                    }
                    removeLabel="Remove color filter"
                  >
                    Color:{" "}
                    {
                      filters.selectedColor
                    }
                  </FilterChip>
                ) : null}

                {filters.selectedAvailability !==
                "All" ? (
                  <FilterChip
                    onRemove={() =>
                      removeFilter(
                        "selectedAvailability"
                      )
                    }
                    removeLabel="Remove availability filter"
                  >
                    {filters.selectedAvailability ===
                    "in_stock"
                      ? "In Stock"
                      : "Sold Out"}
                  </FilterChip>
                ) : null}

                {filters.minimumPrice ||
                filters.maximumPrice ? (
                  <FilterChip
                    onRemove={
                      clearPriceRange
                    }
                    removeLabel="Remove price range filter"
                  >
                    Price:{" "}
                    {filters.minimumPrice
                      ? `৳${formatMoney(
                          filters.minimumPrice
                        )}`
                      : "Any"}{" "}
                    —{" "}
                    {filters.maximumPrice
                      ? `৳${formatMoney(
                          filters.maximumPrice
                        )}`
                      : "Any"}
                  </FilterChip>
                ) : null}

                {filters.selectedSort !==
                "newest" ? (
                  <FilterChip
                    onRemove={() =>
                      removeFilter(
                        "selectedSort"
                      )
                    }
                    removeLabel="Reset product sorting"
                  >
                    Sort:{" "}
                    {getSortLabel(
                      filters.selectedSort
                    )}
                  </FilterChip>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-6 border-t border-black/10 pt-5 text-[10px] uppercase tracking-[0.23em] text-neutral-500">
            Showing all{" "}
            {Number(
              totalProductCount || 0
            ).toLocaleString("en-US")}{" "}
            products
          </p>
        )}
      </div>
    </section>
  );
}