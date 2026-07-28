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

export function getObsidianSizeGuideRows() {
  return OBSIDIAN_OVERSIZED_SIZE_GUIDE.map(
    (item) => ({
      ...item,
    })
  );
}

export function getObsidianSizeLabels() {
  return [...OBSIDIAN_SIZE_ORDER];
}
