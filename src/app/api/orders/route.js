import crypto from "crypto";
import clientPromise from "../../../lib/mongodb";
import { isAdminAuthenticated } from "../../../lib/adminAuth";
import { getCurrentCustomer } from "../../../lib/customerAuth";
import { PRODUCTS_COLLECTION_NAME } from "../../../lib/catalog";
import {
  COUPONS_COLLECTION_NAME,
  ORDERS_COLLECTION_NAME,
  OrderPricingError,
  buildTrustedOrderQuote,
  createCouponUsageOperation,
  createPublicOrderQuote,
  createStockReservationOperation,
} from "../../../lib/orderPricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_SIZE = 250_000;
const MAX_ORDER_LIMIT = 500;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function normalizeText(
  value,
  maximumLength = 1000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function normalizePhone(value) {
  return String(value ?? "").replace(
    /\D/g,
    ""
  );
}

function normalizeEmail(value) {
  return normalizeText(
    value,
    254
  ).toLowerCase();
}

function normalizeCheckoutToken(value) {
  const token = normalizeText(
    value,
    120
  );

  if (!token) {
    return {
      token: `server-${crypto.randomUUID()}`,
      clientProvided: false,
    };
  }

  if (
    token.length < 16 ||
    !/^[A-Za-z0-9._:-]+$/.test(token)
  ) {
    throw new OrderPricingError(
      "Checkout session is invalid. Please refresh checkout and try again.",
      {
        status: 400,
        code: "INVALID_CHECKOUT_TOKEN",
      }
    );
  }

  return {
    token,
    clientProvided: true,
  };
}

function validateCustomer(customer) {
  if (!isPlainObject(customer)) {
    throw new OrderPricingError(
      "Please provide valid customer details.",
      {
        status: 400,
        code: "INVALID_CUSTOMER",
      }
    );
  }

  const fullName = normalizeText(
    customer.fullName,
    120
  );

  const phone = normalizePhone(
    customer.phone
  );

  const email = normalizeEmail(
    customer.email
  );

  const address = normalizeText(
    customer.address,
    1000
  );

  const note = normalizeText(
    customer.note,
    1000
  );

  if (fullName.length < 2) {
    throw new OrderPricingError(
      "Please enter your full name.",
      {
        status: 400,
        code: "INVALID_CUSTOMER_NAME",
      }
    );
  }

  if (
    phone.length < 10 ||
    phone.length > 14
  ) {
    throw new OrderPricingError(
      "Please provide a valid phone number.",
      {
        status: 400,
        code: "INVALID_PHONE",
      }
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    throw new OrderPricingError(
      "Please provide a valid email address.",
      {
        status: 400,
        code: "INVALID_EMAIL",
      }
    );
  }

  if (address.length < 8) {
    throw new OrderPricingError(
      "Please provide your full delivery address.",
      {
        status: 400,
        code: "INVALID_ADDRESS",
      }
    );
  }

  return {
    fullName,
    phone,
    email,
    address,
    note,
  };
}

function createCustomerAccountLink(
  customer
) {
  if (!customer) {
    return null;
  }

  const accountId = normalizeText(
    customer._id,
    120
  );

  const customerId =
    normalizeText(
      customer.customerId,
      120
    ) || accountId;

  if (!accountId && !customerId) {
    return null;
  }

  return {
    accountId,
    customerId,

    email: normalizeEmail(
      customer.email ||
        customer.emailNormalized
    ),

    phone: normalizePhone(
      customer.phone
    ),
  };
}

function generateOrderId() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `OBS-${timestamp}-${random}`;
}

function escapeRegex(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function getPublicPricing(pricing = {}) {
  return {
    ...pricing,

    discountAmount:
      Number(
        pricing.totalDiscount
      ) || 0,

    deliveryCharge:
      Number(
        pricing.payableDeliveryCharge
      ) || 0,
  };
}

function serializeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    ...order,
    id: order.orderId,

    pricing: getPublicPricing(
      order.pricing
    ),
  };
}

async function ensureOrderIndexes(
  database
) {
  const ordersCollection =
    database.collection(
      ORDERS_COLLECTION_NAME
    );

  try {
    await Promise.all([
      ordersCollection.createIndex(
        {
          orderId: 1,
        },
        {
          unique: true,
          name: "order_id_unique",
        }
      ),

      ordersCollection.createIndex(
        {
          checkoutToken: 1,
        },
        {
          unique: true,
          name:
            "checkout_token_unique",

          partialFilterExpression: {
            checkoutToken: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          createdAt: -1,
        },
        {
          name: "orders_created_at",
        }
      ),

      ordersCollection.createIndex(
        {
          status: 1,
          createdAt: -1,
        },
        {
          name:
            "orders_status_created_at",
        }
      ),

      ordersCollection.createIndex(
        {
          customerAccountId: 1,
          createdAt: -1,
        },
        {
          name:
            "orders_customer_account",

          partialFilterExpression: {
            customerAccountId: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          customerId: 1,
          createdAt: -1,
        },
        {
          name:
            "orders_customer_id",

          partialFilterExpression: {
            customerId: {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          "customer.customerId": 1,
          createdAt: -1,
        },
        {
          name:
            "orders_nested_customer_id",

          partialFilterExpression: {
            "customer.customerId": {
              $type: "string",
            },
          },
        }
      ),

      ordersCollection.createIndex(
        {
          "customer.email": 1,
          createdAt: -1,
        },
        {
          name:
            "orders_customer_email",
        }
      ),

      ordersCollection.createIndex(
        {
          "customer.phone": 1,
          createdAt: -1,
        },
        {
          name:
            "orders_customer_phone",
        }
      ),

      database
        .collection(
          COUPONS_COLLECTION_NAME
        )
        .createIndex(
          {
            normalizedCode: 1,
          },
          {
            unique: true,

            name:
              "coupon_normalized_code_unique",

            partialFilterExpression: {
              normalizedCode: {
                $type: "string",
              },
            },
          }
        ),
    ]);
  } catch (error) {
    console.warn(
      "Order index warning:",
      error?.message || error
    );
  }
}

async function readJsonBody(request) {
  const contentLength = Number(
    request.headers.get(
      "content-length"
    ) || 0
  );

  if (
    Number.isFinite(
      contentLength
    ) &&
    contentLength >
      MAX_REQUEST_SIZE
  ) {
    throw new OrderPricingError(
      "Request body is too large.",
      {
        status: 413,
        code: "REQUEST_TOO_LARGE",
      }
    );
  }

  const rawBody =
    await request.text();

  if (
    rawBody.length >
    MAX_REQUEST_SIZE
  ) {
    throw new OrderPricingError(
      "Request body is too large.",
      {
        status: 413,
        code: "REQUEST_TOO_LARGE",
      }
    );
  }

  let body;

  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new OrderPricingError(
      "Invalid request body.",
      {
        status: 400,
        code: "INVALID_JSON",
      }
    );
  }

  if (!isPlainObject(body)) {
    throw new OrderPricingError(
      "Invalid request body.",
      {
        status: 400,
        code:
          "INVALID_REQUEST_BODY",
      }
    );
  }

  return body;
}

export async function GET(request) {
  try {
    if (
      !(await isAdminAuthenticated())
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Admin authentication required.",
        },
        401
      );
    }

    const client =
      await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    await ensureOrderIndexes(
      database
    );

    const url = new URL(
      request.url
    );

    const page = Math.max(
      1,
      Math.floor(
        Number(
          url.searchParams.get(
            "page"
          )
        ) || 1
      )
    );

    const limit = Math.min(
      MAX_ORDER_LIMIT,

      Math.max(
        1,
        Math.floor(
          Number(
            url.searchParams.get(
              "limit"
            )
          ) || 100
        )
      )
    );

    const status = normalizeText(
      url.searchParams.get(
        "status"
      ),
      50
    ).toLowerCase();

    const search = normalizeText(
      url.searchParams.get(
        "search"
      ),
      100
    );

    const filter = {};

    if (
      status &&
      status !== "all"
    ) {
      filter.status = status;
    }

    if (search) {
      const safeSearch =
        escapeRegex(search);

      filter.$or = [
        {
          orderId: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          customerId: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          "customer.fullName": {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          "customer.phone": {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          "customer.email": {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const ordersCollection =
      database.collection(
        ORDERS_COLLECTION_NAME
      );

    const [orders, total] =
      await Promise.all([
        ordersCollection
          .find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) * limit
          )
          .limit(limit)
          .toArray(),

        ordersCollection.countDocuments(
          filter
        ),
      ]);

    return jsonResponse({
      success: true,

      orders:
        orders.map(
          serializeOrder
        ),

      pagination: {
        page,
        limit,
        total,

        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET Orders Error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Failed to fetch orders.",
      },
      500
    );
  }
}

export async function POST(request) {
  let checkoutTokenData = null;

  try {
    const body =
      await readJsonBody(request);

    checkoutTokenData =
      normalizeCheckoutToken(
        body.checkoutToken ||
          body.idempotencyKey
      );

    const customer =
      validateCustomer(
        body.customer
      );

    const authenticatedCustomer =
      await getCurrentCustomer();

    const customerAccountLink =
      createCustomerAccountLink(
        authenticatedCustomer
      );

    const deliveryArea =
      body.deliveryArea ||
      body.customer?.deliveryArea;

    const paymentMethod =
      body.paymentMethod ||
      "cash_on_delivery";

    const couponCode =
      body.couponCode || "";

    const client =
      await clientPromise;

    const database = client.db(
      process.env.MONGODB_DB ||
        "obsidian"
    );

    await ensureOrderIndexes(
      database
    );

    const ordersCollection =
      database.collection(
        ORDERS_COLLECTION_NAME
      );

    if (
      checkoutTokenData.clientProvided
    ) {
      const existingOrder =
        await ordersCollection.findOne({
          checkoutToken:
            checkoutTokenData.token,
        });

      if (existingOrder) {
        return jsonResponse({
          success: true,
          duplicate: true,

          message:
            "This order was already created.",

          order:
            serializeOrder(
              existingOrder
            ),

          pricing:
            getPublicPricing(
              existingOrder.pricing
            ),
        });
      }
    }

    const session =
      client.startSession();

    let savedOrder = null;
    let duplicateOrder = null;

    try {
      await session.withTransaction(
        async () => {
          const existingOrder =
            await ordersCollection.findOne(
              {
                checkoutToken:
                  checkoutTokenData.token,
              },
              {
                session,
              }
            );

          if (existingOrder) {
            duplicateOrder =
              existingOrder;

            return;
          }

          const now = new Date();

          const quote =
            await buildTrustedOrderQuote(
              {
                database,
                items: body.items,
                deliveryArea,
                couponCode,
                paymentMethod,
                validatePayment: true,
                now,
                session,
              }
            );

          const stockOperations =
            quote.items.map((item) =>
              createStockReservationOperation(
                item,
                now
              )
            );

          const stockResult =
            await database
              .collection(
                PRODUCTS_COLLECTION_NAME
              )
              .bulkWrite(
                stockOperations,
                {
                  ordered: true,
                  session,
                }
              );

          if (
            stockResult.modifiedCount !==
            stockOperations.length
          ) {
            throw new OrderPricingError(
              "One or more products no longer have enough stock. Please refresh your cart.",
              {
                status: 409,
                code:
                  "STOCK_CHANGED",
              }
            );
          }

          if (quote.couponRecord) {
            const couponOperation =
              createCouponUsageOperation(
                quote.couponRecord,
                now
              );

            const couponResult =
              await database
                .collection(
                  COUPONS_COLLECTION_NAME
                )
                .updateOne(
                  couponOperation.filter,
                  couponOperation.update,
                  {
                    session,
                  }
                );

            if (
              couponResult.modifiedCount !==
              1
            ) {
              throw new OrderPricingError(
                "This coupon is no longer available.",
                {
                  status: 409,
                  code:
                    "COUPON_CHANGED",
                }
              );
            }
          }

          const publicQuote =
            createPublicOrderQuote(
              quote
            );

          const linkedCustomer = {
            ...customer,

            ...(customerAccountLink
              ? {
                  accountId:
                    customerAccountLink.accountId,

                  customerId:
                    customerAccountLink.customerId,

                  accountEmail:
                    customerAccountLink.email,

                  accountPhone:
                    customerAccountLink.phone,
                }
              : {}),

            deliveryArea:
              publicQuote.deliveryArea,
          };

          const order = {
            orderId:
              generateOrderId(),

            checkoutToken:
              checkoutTokenData.token,

            source: "website",

            status: "pending",
            paymentStatus: "unpaid",

            paymentMethod:
              publicQuote.paymentMethod
                .value,

            paymentMethodLabel:
              publicQuote.paymentMethod
                .label,

            customerId:
              customerAccountLink
                ?.customerId || null,

            customerAccountId:
              customerAccountLink
                ?.accountId || null,

            customerLinkedAt:
              customerAccountLink
                ? now
                : null,

            customerLinkSource:
              customerAccountLink
                ? "authenticated_checkout"
                : null,

            customer:
              linkedCustomer,

            deliveryArea:
              publicQuote.deliveryArea,

            items:
              publicQuote.items,

            pricing:
              publicQuote.pricing,

            subtotal:
              publicQuote.pricing
                .subtotal,

            originalDeliveryCharge:
              publicQuote.pricing
                .originalDeliveryCharge,

            deliveryCharge:
              publicQuote.pricing
                .payableDeliveryCharge,

            discount:
              publicQuote.pricing
                .totalDiscount,

            total:
              publicQuote.pricing
                .total,

            coupon:
              publicQuote.coupon,

            createdAt: now,
            updatedAt: now,
          };

          const result =
            await ordersCollection.insertOne(
              order,
              {
                session,
              }
            );

          savedOrder = {
            ...order,
            _id:
              result.insertedId,
          };
        },
        {
          readConcern: {
            level: "snapshot",
          },

          writeConcern: {
            w: "majority",
          },

          readPreference:
            "primary",
        }
      );
    } finally {
      await session.endSession();
    }

    if (duplicateOrder) {
      return jsonResponse({
        success: true,
        duplicate: true,

        message:
          "This order was already created.",

        order:
          serializeOrder(
            duplicateOrder
          ),

        pricing:
          getPublicPricing(
            duplicateOrder.pricing
          ),
      });
    }

    if (!savedOrder) {
      throw new Error(
        "Order transaction completed without creating an order."
      );
    }

    return jsonResponse(
      {
        success: true,
        duplicate: false,

        message:
          "Order placed successfully.",

        order:
          serializeOrder(
            savedOrder
          ),

        pricing:
          getPublicPricing(
            savedOrder.pricing
          ),
      },
      201
    );
  } catch (error) {
    if (
      error instanceof
      OrderPricingError
    ) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,

          details:
            error.details ||
            undefined,
        },
        error.status
      );
    }

    if (
      error?.code === 11000 &&
      checkoutTokenData?.token
    ) {
      try {
        const client =
          await clientPromise;

        const database = client.db(
          process.env.MONGODB_DB ||
            "obsidian"
        );

        const existingOrder =
          await database
            .collection(
              ORDERS_COLLECTION_NAME
            )
            .findOne({
              checkoutToken:
                checkoutTokenData.token,
            });

        if (existingOrder) {
          return jsonResponse({
            success: true,
            duplicate: true,

            message:
              "This order was already created.",

            order:
              serializeOrder(
                existingOrder
              ),

            pricing:
              getPublicPricing(
                existingOrder.pricing
              ),
          });
        }
      } catch (lookupError) {
        console.error(
          "Duplicate Order Lookup Error:",
          lookupError
        );
      }
    }

    console.error(
      "POST Order Error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        message:
          "Something went wrong while creating the order.",
      },
      500
    );
  }
}