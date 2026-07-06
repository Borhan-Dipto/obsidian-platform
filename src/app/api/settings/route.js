import clientPromise from "../../../lib/mongodb";

const OLD_ARTIFACT_COLLECTION_HREF = `/collections/${"artifact"}`;

const DEFAULT_SETTINGS = {
  type: "store",

  store: {
    name: "OBSIDIAN",
    tagline: "Built under pressure. Finished with precision.",
    currency: "BDT",
  },

  contact: {
    whatsappNumber: "8801814455199",
    email: "hello@obsidianwear.com",
    location: "Dhaka, Bangladesh",
    phone: "",
  },

  social: {
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
  },

  delivery: {
    insideDhaka: 80,
    outsideDhaka: 130,
    freeShippingOver: 0,
  },

  seo: {
    title: "OBSIDIAN",
    description: "Built under pressure. Finished with precision.",
    keywords: "obsidian, fashion, menswear, t-shirt, Bangladesh",
    ogImage: "",
  },

  homepage: {
    heroEyebrow: "Built Under Pressure",
    heroTitle: "OBSIDIAN",
    heroSubtitle:
      "Engineered essentials shaped by pressure, precision, and quiet confidence.",
    primaryCtaText: "View Collection",
    primaryCtaHref: "/collections",
    secondaryCtaText: "Shop All",
    secondaryCtaHref: "/shop",
  },

  payment: {
    cashOnDelivery: true,
    bkash: false,
    nagad: false,
    rocket: false,
  },
};

function mergeSettings(existingSettings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...existingSettings,

    store: {
      ...DEFAULT_SETTINGS.store,
      ...(existingSettings.store || {}),
    },

    contact: {
      ...DEFAULT_SETTINGS.contact,
      ...(existingSettings.contact || {}),
    },

    social: {
      ...DEFAULT_SETTINGS.social,
      ...(existingSettings.social || {}),
    },

    delivery: {
      ...DEFAULT_SETTINGS.delivery,
      ...(existingSettings.delivery || {}),
    },

    seo: {
      ...DEFAULT_SETTINGS.seo,
      ...(existingSettings.seo || {}),
    },

    homepage: {
      ...DEFAULT_SETTINGS.homepage,
      ...(existingSettings.homepage || {}),
    },

    payment: {
      ...DEFAULT_SETTINGS.payment,
      ...(existingSettings.payment || {}),
    },
  };
}

function normalizeHomepage(homepage = {}) {
  const normalizedHomepage = {
    ...DEFAULT_SETTINGS.homepage,
    ...homepage,
  };

  if (normalizedHomepage.primaryCtaHref === OLD_ARTIFACT_COLLECTION_HREF) {
    normalizedHomepage.primaryCtaHref = "/collections";
  }

  return normalizedHomepage;
}

function normalizeSettings(data = {}) {
  return mergeSettings({
    type: "store",

    store: {
      name: data.store?.name || data.storeName || "OBSIDIAN",
      tagline:
        data.store?.tagline ||
        data.tagline ||
        "Built under pressure. Finished with precision.",
      currency: data.store?.currency || data.currency || "BDT",
    },

    contact: {
      whatsappNumber: String(
        data.contact?.whatsappNumber ||
          data.whatsappNumber ||
          "8801814455199"
      ).replace(/\D/g, ""),
      email: data.contact?.email || data.storeEmail || "",
      location: data.contact?.location || data.storeLocation || "",
      phone: data.contact?.phone || "",
    },

    social: {
      facebookUrl: data.social?.facebookUrl || data.facebookUrl || "",
      instagramUrl: data.social?.instagramUrl || data.instagramUrl || "",
      tiktokUrl: data.social?.tiktokUrl || "",
      youtubeUrl: data.social?.youtubeUrl || "",
    },

    delivery: {
      insideDhaka:
        Number(data.delivery?.insideDhaka ?? data.deliveryChargeInsideDhaka) ||
        0,
      outsideDhaka:
        Number(
          data.delivery?.outsideDhaka ?? data.deliveryChargeOutsideDhaka
        ) || 0,
      freeShippingOver: Number(data.delivery?.freeShippingOver) || 0,
    },

    seo: data.seo || DEFAULT_SETTINGS.seo,
    homepage: normalizeHomepage(data.homepage),
    payment: data.payment || DEFAULT_SETTINGS.payment,

    updatedAt: new Date(),
  });
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    let settings = await db.collection("settings").findOne({ type: "store" });

    if (!settings) {
      settings = {
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("settings").insertOne(settings);
    }

    const normalizedSettings = normalizeSettings(settings);

    return Response.json({
      success: true,
      settings: normalizedSettings,
    });
  } catch (error) {
    console.error("GET Settings Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to load settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "obsidian");

    const updatedSettings = normalizeSettings(data);

    const { type, _id, createdAt, ...settingsToSave } = updatedSettings;

    await db.collection("settings").updateOne(
      { type: "store" },
      {
        $set: {
          ...settingsToSave,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          type: "store",
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const settings = await db.collection("settings").findOne({ type: "store" });

    return Response.json({
      success: true,
      message: "Settings updated successfully.",
      settings: normalizeSettings(settings),
    });
  } catch (error) {
    console.error("PATCH Settings Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update settings.",
      },
      { status: 500 }
    );
  }
}