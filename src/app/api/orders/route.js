import clientPromise from "../../../lib/mongodb";

function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);

  return `OBS-${timestamp}${random}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCouponCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeRequestedItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: normalizeText(item.id),
      size: normalizeText(item.size),
      quantity: Math.max(
        1,
        Math.floor(Number(item.quantity) || 1)
      ),
    }))
    .filter((item) => item.id);
}

function getProductPrice(product) {
  const price = Number(product?.price);

  if (!Number.isFinite(price) || price < 0) {
    return 0;
  }

  return price;
}

function getProductStock(product, size) {
  if (
    product?.sizeStock &&
    typeof product.sizeStock === "object" &&
    size
  ) {
    const sizeStock = Number(product.sizeStock[size]);

    if (Number.isFinite(sizeStock)) {
      return Math.max(0, sizeStock);
    }
  }

  const stock = Number(product?.stock);

  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(0, stock);
}

function getDeliveryCharge(settings, deliveryArea) {
  const deliverySettings = settings?.delivery || {};

  if (deliveryArea === "outside_dhaka") {
    return Math.max(
      0,
      Number(deliverySettings.outsideDhaka) || 0
    );
  }

  return Math.max(
    0,
    Number(deliverySettings.insideDhaka) || 0
  );
}

function isCouponCurrentlyValid(coupon, now) {
  if (!coupon || coupon.active === false) {
    return false;
  }

  if (coupon.startsAt) {
    const startsAt = new Date(coupon.startsAt);

    if (
      !Number.isNaN(startsAt.getTime()) &&
      now < startsAt
    ) {
      return false;
    }
  }

  if (coupon.endsAt) {
    const endsAt = new Date(coupon.endsAt);

    if (
      !Number.isNaN(endsAt.getTime()) &&
      now > endsAt
    ) {
      return false;
    }
  }

  return true;
}

function calculateCouponDiscount({
  coupon,
  subtotal,
  deliveryCharge,
}) {
  const type = normalizeText(coupon.type).toLowerCase();
  const value = Math.max(0, Number(coupon.value) || 0);
  const maximumDiscount = Math.max(
    0,
    Number(coupon.maximumDiscount) || 0
  );

  let productDiscount = 0;
  let deliveryDiscount = 0;

  if (type === "percentage") {
    productDiscount = subtotal * (value / 100);

    if (maximumDiscount > 0) {
      productDiscount = Math.min(
        productDiscount,
        maximumDiscount
      );
    }
  } else if (type === "fixed") {
    productDiscount = Math.min(value, subtotal);
  } else if (type === "free_shipping") {
    deliveryDiscount = deliveryCharge;
  }

  productDiscount = Math.min(
    subtotal,
    Math.max(0, productDiscount)
  );

  deliveryDiscount = Math.min(
    deliveryCharge,
    Math.max(0, deliveryDiscount)
  );

  const totalDiscount =
    productDiscount + deliveryDiscount;

  return {
    productDiscount: Math.round(productDiscount),
    deliveryDiscount: Math.round(deliveryDiscount),
    totalDiscount: Math.round(totalDiscount),
  };
}

async function validateCoupon({
  db,
  couponCode,
  subtotal,
  deliveryCharge,
  now,
}) {
  if (!couponCode) {
    return {
      coupon: null,
      discount: {
        productDiscount: 0,
        deliveryDiscount: 0,
        totalDiscount: 0,
      },
    };
  }

  const coupon = await db.collection("coupons").findOne({
    code: couponCode,
  });

  if (!coupon) {
    return {
      error: "Coupon code was not found.",
    };
  }

  if (!isCouponCurrentlyValid(coupon, now)) {
    return {
      error:
        "This coupon is inactive or is not currently available.",
    };
  }

  const minimumOrder = Math.max(
    0,
    Number(coupon.minimumOrder) || 0
  );

  if (subtotal < minimumOrder) {
    return {
      error: `This coupon requires a minimum order of ৳${minimumOrder}.`,
    };
  }

  const usageLimit = Math.max(
    0,
    Number(coupon.usageLimit) || 0
  );

  const usedCount = Math.max(
    0,
    Number(coupon.usedCount) || 0
  );

  if (usageLimit > 0 && usedCount >= usageLimit) {
    return {
      error: "This coupon has reached its usage limit.",
    };
  }

  const discount = calculateCouponDiscount({
    coupon,
    subtotal,
    deliveryCharge,
  });

  if (discount.totalDiscount <= 0) {
    return {
      error: "This coupon cannot be applied to this order.",
    };
  }

  return {
    coupon,
    discount,
  };
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET Orders Error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch orders.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const orderData = await request.json();

    const customer = orderData.customer || {};
    const requestedItems = normalizeRequestedItems(
      orderData.items
    );

    const fullName = normalizeText(customer.fullName);
    const phone = String(customer.phone || "").replace(
      /\D/g,
      ""
    );
    const email = normalizeText(
      customer.email
    ).toLowerCase();
    const address = normalizeText(customer.address);
    const note = normalizeText(customer.note);

    const deliveryArea =
      customer.deliveryArea === "outside_dhaka"
        ? "outside_dhaka"
        : "inside_dhaka";

    const couponCode = normalizeCouponCode(
      orderData.couponCode
    );

    if (
      !fullName ||
      !phone ||
      !address ||
      requestedItems.length === 0
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide valid customer and order details.",
        },
        { status: 400 }
      );
    }

    if (phone.length < 10 || phone.length > 14) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide a valid phone number.",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.MONGODB_DB || "obsidian"
    );

    const settings =
      (await db
        .collection("settings")
        .findOne({ key: "store_settings" })) ||
      (await db.collection("settings").findOne({})) ||
      {};

    const trustedItems = [];

    for (const requestedItem of requestedItems) {
      const product = await db
        .collection("products")
        .findOne({
          id: requestedItem.id,
        });

      if (!product) {
        return Response.json(
          {
            success: false,
            message:
              "One of the selected products was not found.",
          },
          { status: 404 }
        );
      }

      const availableStock = getProductStock(
        product,
        requestedItem.size
      );

      if (availableStock < requestedItem.quantity) {
        return Response.json(
          {
            success: false,
            message: `${product.name || "This product"} does not have enough stock.`,
          },
          { status: 400 }
        );
      }

      const price = getProductPrice(product);

      trustedItems.push({
        id: product.id,
        name: normalizeText(product.name),
        series: normalizeText(product.series),
        color: normalizeText(product.color),
        size: requestedItem.size,
        quantity: requestedItem.quantity,
        price,
        image:
          product.image ||
          product.images?.[0] ||
          "",
      });
    }

    const subtotal = trustedItems.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          Number(item.quantity),
      0
    );

    const deliveryCharge = getDeliveryCharge(
      settings,
      deliveryArea
    );

    const now = new Date();

    const couponResult = await validateCoupon({
      db,
      couponCode,
      subtotal,
      deliveryCharge,
      now,
    });

    if (couponResult.error) {
      return Response.json(
        {
          success: false,
          message: couponResult.error,
        },
        { status: 400 }
      );
    }

    const discount =
      couponResult.discount || {
        productDiscount: 0,
        deliveryDiscount: 0,
        totalDiscount: 0,
      };

    const payableDeliveryCharge = Math.max(
      0,
      deliveryCharge -
        discount.deliveryDiscount
    );

    const total = Math.max(
      0,
      subtotal +
        deliveryCharge -
        discount.totalDiscount
    );

    const appliedCoupon = couponResult.coupon
      ? {
          code: normalizeCouponCode(
            couponResult.coupon.code
          ),
          type: normalizeText(
            couponResult.coupon.type
          ).toLowerCase(),
          value: Math.max(
            0,
            Number(couponResult.coupon.value) || 0
          ),
          productDiscount:
            discount.productDiscount,
          deliveryDiscount:
            discount.deliveryDiscount,
          totalDiscount: discount.totalDiscount,
        }
      : null;

    const order = {
      orderId: generateOrderId(),
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: "cash_on_delivery",

      customer: {
        fullName,
        phone,
        email,
        address,
        deliveryArea,
        note,
      },

      items: trustedItems,

      pricing: {
        subtotal: Math.round(subtotal),
        deliveryCharge: Math.round(
          deliveryCharge
        ),
        deliveryPayable: Math.round(
          payableDeliveryCharge
        ),
        discount: Math.round(
          discount.totalDiscount
        ),
        total: Math.round(total),
      },

      subtotal: Math.round(subtotal),
      deliveryCharge: Math.round(
        payableDeliveryCharge
      ),
      originalDeliveryCharge: Math.round(
        deliveryCharge
      ),
      discount: Math.round(
        discount.totalDiscount
      ),
      total: Math.round(total),

      coupon: appliedCoupon,

      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("orders")
      .insertOne(order);

    for (const item of trustedItems) {
      const product = await db
        .collection("products")
        .findOne({ id: item.id });

      const hasSizeStock =
        product?.sizeStock &&
        typeof product.sizeStock === "object" &&
        item.size &&
        Object.prototype.hasOwnProperty.call(
          product.sizeStock,
          item.size
        );

      if (hasSizeStock) {
        await db.collection("products").updateOne(
          {
            id: item.id,
            [`sizeStock.${item.size}`]: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              [`sizeStock.${item.size}`]:
                -item.quantity,
              stock: -item.quantity,
            },
            $set: {
              updatedAt: new Date(),
            },
          }
        );
      } else {
        await db.collection("products").updateOne(
          {
            id: item.id,
            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
            $set: {
              updatedAt: new Date(),
            },
          }
        );
      }
    }

    if (couponResult.coupon) {
      await db.collection("coupons").updateOne(
        {
          _id: couponResult.coupon._id,
        },
        {
          $inc: {
            usedCount: 1,
          },
          $set: {
            updatedAt: new Date(),
          },
        }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Order saved successfully.",
        order: {
          ...order,
          _id: result.insertedId,
          id: order.orderId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Order Error:", error);

    return Response.json(
      {
        success: false,
        message:
          "Something went wrong while creating order.",
      },
      { status: 500 }
    );
  }
}