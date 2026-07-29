export const OBSIDIAN_SIZE_ORDER = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

export const OBSIDIAN_OVERSIZED_SIZE_GUIDE = [
  {
    id: "obsidian-size-s",
    size: "S",
    order: 1,
    isActive: true,
    bodyChest: "34.5–36",
    bodyChestCm: "87–92",
    chest: "42",
    chestCm: "107",
    length: "27",
    lengthCm: "69",
    shoulder: "20",
    shoulderCm: "51",
  },
  {
    id: "obsidian-size-m",
    size: "M",
    order: 2,
    isActive: true,
    bodyChest: "36.5–39",
    bodyChestCm: "93–100",
    chest: "46",
    chestCm: "117",
    length: "28",
    lengthCm: "71",
    shoulder: "21.5",
    shoulderCm: "55",
  },
  {
    id: "obsidian-size-l",
    size: "L",
    order: 3,
    isActive: true,
    bodyChest: "39.5–42.5",
    bodyChestCm: "101–108",
    chest: "50",
    chestCm: "127",
    length: "29",
    lengthCm: "74",
    shoulder: "23",
    shoulderCm: "58",
  },
  {
    id: "obsidian-size-xl",
    size: "XL",
    order: 4,
    isActive: true,
    bodyChest: "43–46.5",
    bodyChestCm: "109–118",
    chest: "54",
    chestCm: "137",
    length: "30",
    lengthCm: "76",
    shoulder: "24.5",
    shoulderCm: "62",
  },
  {
    id: "obsidian-size-xxl",
    size: "XXL",
    order: 5,
    isActive: true,
    bodyChest: "47–51",
    bodyChestCm: "119–130",
    chest: "58",
    chestCm: "147",
    length: "31",
    lengthCm: "79",
    shoulder: "26",
    shoulderCm: "66",
  },
  {
    id: "obsidian-size-xxxl",
    size: "XXXL",
    order: 6,
    isActive: true,
    bodyChest: "51.5–56",
    bodyChestCm: "131–142",
    chest: "62",
    chestCm: "158",
    length: "32",
    lengthCm: "81",
    shoulder: "27.5",
    shoulderCm: "70",
  },
];

const SIZE_GUIDE_MEASUREMENT_FIELDS = [
  "bodyChest",
  "bodyChestCm",
  "chest",
  "chestCm",
  "length",
  "lengthCm",
  "shoulder",
  "shoulderCm",
];

const LEGACY_DEFAULT_SIZE_GUIDE_ROWS = [
  {
    id: "size-medium",
    size: "M",
    chest: "40",
    length: "27",
    shoulder: "18",
  },
  {
    id: "size-large",
    size: "L",
    chest: "42",
    length: "28",
    shoulder: "19",
  },
  {
    id: "size-extra-large",
    size: "XL",
    chest: "44",
    length: "29",
    shoulder: "20",
  },
];

function isPlainRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function cleanText(
  value,
  fallback = "",
  maximumLength = 5000
) {
  const normalizedValue =
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maximumLength);

  return normalizedValue || fallback;
}

function normalizeSize(value) {
  const normalizedSize =
    cleanText(
      value,
      "",
      20
    ).toUpperCase();

  return OBSIDIAN_SIZE_ORDER.includes(
    normalizedSize
  )
    ? normalizedSize
    : "";
}

function getSourceRows(source) {
  if (Array.isArray(source)) {
    return source;
  }

  if (
    isPlainRecord(source) &&
    Array.isArray(source.sizes)
  ) {
    return source.sizes;
  }

  if (
    isPlainRecord(source?.content) &&
    Array.isArray(
      source.content.sizes
    )
  ) {
    return source.content.sizes;
  }

  return [];
}

function isLegacyDefaultSizeGuideRows(
  rows
) {
  if (
    !Array.isArray(rows) ||
    rows.length !==
      LEGACY_DEFAULT_SIZE_GUIDE_ROWS.length
  ) {
    return false;
  }

  const rowMap =
    new Map(
      rows
        .filter(isPlainRecord)
        .map((row) => [
          normalizeSize(row.size),
          row,
        ])
    );

  if (
    rowMap.size !==
    LEGACY_DEFAULT_SIZE_GUIDE_ROWS.length
  ) {
    return false;
  }

  return LEGACY_DEFAULT_SIZE_GUIDE_ROWS.every(
    (legacyRow) => {
      const storedRow =
        rowMap.get(
          legacyRow.size
        );

      return Boolean(
        storedRow &&
          cleanText(storedRow.id) ===
            legacyRow.id &&
          cleanText(storedRow.chest) ===
            legacyRow.chest &&
          cleanText(storedRow.length) ===
            legacyRow.length &&
          cleanText(storedRow.shoulder) ===
            legacyRow.shoulder
      );
    }
  );
}

export function getObsidianSizeGuideRows(
  source = null
) {
  const sourceRows =
    getSourceRows(source);

  /*
   * Earlier CMS documents were automatically
   * created with a temporary M–XL chart.
   * Replace only that exact untouched legacy
   * default while preserving genuinely edited
   * CMS measurements.
   */
  const storedRows =
    isLegacyDefaultSizeGuideRows(
      sourceRows
    )
      ? []
      : sourceRows;

  const storedRowMap =
    new Map();

  for (const storedRow of storedRows) {
    if (!isPlainRecord(storedRow)) {
      continue;
    }

    const size =
      normalizeSize(
        storedRow.size
      );

    if (
      size &&
      !storedRowMap.has(size)
    ) {
      storedRowMap.set(
        size,
        storedRow
      );
    }
  }

  return OBSIDIAN_OVERSIZED_SIZE_GUIDE.map(
    (fallbackRow, index) => {
      const storedRow =
        storedRowMap.get(
          fallbackRow.size
        ) || {};

      const normalizedRow = {
        ...fallbackRow,
        ...storedRow,

        id:
          cleanText(
            storedRow.id,
            fallbackRow.id,
            120
          ),

        size:
          fallbackRow.size,

        order:
          index + 1,

        isActive:
          storedRow.isActive !==
          false,
      };

      for (
        const field
        of SIZE_GUIDE_MEASUREMENT_FIELDS
      ) {
        normalizedRow[field] =
          cleanText(
            storedRow[field],
            fallbackRow[field],
            80
          );
      }

      return normalizedRow;
    }
  );
}

export function getActiveObsidianSizeGuideRows(
  source = null
) {
  return getObsidianSizeGuideRows(
    source
  ).filter(
    (row) =>
      row.isActive !== false
  );
}

export function getObsidianSizeLabels() {
  return [
    ...OBSIDIAN_SIZE_ORDER,
  ];
}

export function sanitizeSizeGuideCmsContent(
  document = {},
  {
    schemaVersion = 1,
  } = {}
) {
  const source =
    isPlainRecord(document)
      ? document
      : {};

  const seo =
    isPlainRecord(source.seo)
      ? source.seo
      : {};

  const content =
    isPlainRecord(source.content)
      ? source.content
      : {};

  return {
    ...source,

    key: "size-guide",

    schemaVersion:
      Number(
        schemaVersion ||
          source.schemaVersion ||
          1
      ) || 1,

    status:
      cleanText(
        source.status,
        "published",
        30
      ) === "draft"
        ? "draft"
        : "published",

    title:
      cleanText(
        source.title,
        "Size Guide",
        140
      ),

    slug:
      cleanText(
        source.slug,
        "size-guide",
        120
      ),

    seo: {
      ...seo,

      title:
        cleanText(
          seo.title,
          "Size Guide",
          140
        ),

      description:
        cleanText(
          seo.description,
          "Find your ideal OBSIDIAN fit with our size guide for oversized and relaxed silhouettes.",
          500
        ),

      keywords:
        cleanText(
          seo.keywords,
          "OBSIDIAN size guide, oversized t-shirt size chart, clothing size guide Bangladesh",
          500
        ),

      ogImage:
        cleanText(
          seo.ogImage,
          "/images/collection-artifact.jpeg",
          1000
        ),

      canonical:
        cleanText(
          seo.canonical,
          "/size-guide",
          300
        ),

      index:
        seo.index !== false,
    },

    content: {
      ...content,

      eyebrow:
        cleanText(
          content.eyebrow,
          "Size Guide",
          120
        ),

      title:
        cleanText(
          content.title,
          "Find Your Fit",
          200
        ),

      description:
        cleanText(
          content.description,
          "Our pieces are designed with a relaxed oversized fit. Use the guide below to choose your preferred silhouette.",
          1000
        ),

      inlineTitle:
        cleanText(
          content.inlineTitle,
          "Find Your OBSIDIAN Fit",
          200
        ),

      inlineDescription:
        cleanText(
          content.inlineDescription,
          "Compare body-fit and finished garment measurements before selecting your size. Measurements follow OBSIDIAN's relaxed oversized silhouette.",
          1000
        ),

      tableAriaLabel:
        cleanText(
          content.tableAriaLabel,
          "OBSIDIAN clothing size guide",
          240
        ),

      sizeColumnLabel:
        cleanText(
          content.sizeColumnLabel,
          "Size",
          80
        ),

      bodyChestColumnLabel:
        cleanText(
          content.bodyChestColumnLabel,
          "Fits Body Chest",
          120
        ),

      chestColumnLabel:
        cleanText(
          content.chestColumnLabel,
          "Garment Chest",
          120
        ),

      lengthColumnLabel:
        cleanText(
          content.lengthColumnLabel,
          "Length",
          80
        ),

      shoulderColumnLabel:
        cleanText(
          content.shoulderColumnLabel,
          "Shoulder",
          80
        ),

      measurementUnit:
        cleanText(
          content.measurementUnit,
          "in / cm",
          40
        ),

      sizes:
        getObsidianSizeGuideRows(
          content.sizes
        ),

      note:
        cleanText(
          content.note,
          "Garment measurements represent the finished product.",
          1000
        ),

      toleranceNote:
        cleanText(
          content.toleranceNote,
          "Allow approximately ±1.5 cm production tolerance.",
          1000
        ),

      emptyStateTitle:
        cleanText(
          content.emptyStateTitle,
          "No size information is available.",
          200
        ),

      emptyStateDescription:
        cleanText(
          content.emptyStateDescription,
          "Please contact OBSIDIAN support for assistance with choosing the right size.",
          1000
        ),
    },
  };
}

export function validateSizeGuideContentInput(
  document
) {
  const errors = [];

  if (!isPlainRecord(document)) {
    return {
      valid: false,

      errors: [
        {
          field: "root",

          message:
            "Size Guide content must be a valid object.",
        },
      ],
    };
  }

  if (
    !isPlainRecord(
      document.content
    )
  ) {
    errors.push({
      field: "content",

      message:
        "Size Guide page content is required.",
    });
  }

  const rows =
    document.content?.sizes;

  if (!Array.isArray(rows)) {
    errors.push({
      field: "content.sizes",

      message:
        "Size Guide rows must be provided as a list.",
    });
  } else {
    const seenSizes =
      new Set();

    for (
      const [
        index,
        row,
      ] of rows.entries()
    ) {
      if (!isPlainRecord(row)) {
        errors.push({
          field:
            `content.sizes.${index}`,

          message:
            "Each Size Guide row must be a valid object.",
        });

        continue;
      }

      const size =
        normalizeSize(row.size);

      if (!size) {
        errors.push({
          field:
            `content.sizes.${index}.size`,

          message:
            "Each Size Guide row must use S, M, L, XL, XXL, or XXXL.",
        });

        continue;
      }

      if (seenSizes.has(size)) {
        errors.push({
          field:
            `content.sizes.${index}.size`,

          message:
            `Size ${size} appears more than once.`,
        });
      }

      seenSizes.add(size);

      if (
        row.isActive !== false
      ) {
        for (
          const field
          of SIZE_GUIDE_MEASUREMENT_FIELDS
        ) {
          if (
            !cleanText(
              row[field],
              "",
              80
            )
          ) {
            errors.push({
              field:
                `content.sizes.${index}.${field}`,

              message:
                `Size ${size} requires every inch and centimetre measurement.`,
            });
          }
        }
      }
    }

    const activeRowCount =
      rows.filter(
        (row) =>
          isPlainRecord(row) &&
          row.isActive !== false
      ).length;

    if (activeRowCount === 0) {
      errors.push({
        field:
          "content.sizes",

        message:
          "At least one Size Guide row must remain active.",
      });
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}
