"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import {
  buildInitiateCheckoutParams,
  createPurchaseEventId,
  trackMetaEvent,
  trackMetaPurchase,
} from "../../lib/metaPixel";
import {
  buildGa4ItemEventParams,
  trackGa4Event,
  trackGa4Purchase,
} from "../../lib/googleAnalytics";

const CHECKOUT_TOKEN_KEY =
  "obsidian-checkout-token";

const DEFAULT_SETTINGS = {
  store: {
    name: "OBSIDIAN",
    currency: "BDT",
  },

  delivery: {
    insideDhaka: 80,
    outsideDhaka: 130,
  },

  payment: {
    cashOnDelivery: true,
    bkash: false,
    nagad: false,
    rocket: false,
  },
};

const PAYMENT_METHODS = [
  {
    value: "cash_on_delivery",
    settingsKey: "cashOnDelivery",
    label: "Cash on Delivery",
  },
  {
    value: "bkash",
    settingsKey: "bkash",
    label: "bKash",
  },
  {
    value: "nagad",
    settingsKey: "nagad",
    label: "Nagad",
  },
  {
    value: "rocket",
    settingsKey: "rocket",
    label: "Rocket",
  },
];

function createCheckoutToken() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `checkout-${crypto.randomUUID()}`;
  }

  return `checkout-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getCartPayload(cartItems) {
  return cartItems.map((item) => ({
    id: item.id,
    size: item.size || "",
    quantity: Number(item.quantity) || 1,
  }));
}

const INVENTORY_CORRECTION_CODES =
  new Set([
    "INSUFFICIENT_STOCK",
    "STOCK_CHANGED",
    "PRODUCT_UNAVAILABLE",
    "INVALID_SIZE",
    "SIZE_REQUIRED",
    "INVALID_SIZE_STOCK_CONFIGURATION",
  ]);

function isInventoryCorrectionCode(
  value
) {
  return (
    INVENTORY_CORRECTION_CODES.has(
      String(value || "")
        .trim()
        .toUpperCase()
    )
  );
}

function normalizeCheckoutSize(
  value
) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en");
}

function createCheckoutLineKey(
  item
) {
  return `${String(
    item?.id || ""
  )
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase(
      "en"
    )}\u0000${normalizeCheckoutSize(
    item?.size
  )}`;
}

function normalizeCheckoutStock(
  value
) {
  const stock =
    Number(value);

  return Number.isFinite(stock)
    ? Math.max(
        0,
        Math.floor(stock)
      )
    : 0;
}

function normalizeCheckoutQuantity(
  value
) {
  const quantity =
    Number(value);

  return Number.isFinite(
    quantity
  )
    ? Math.max(
        0,
        Math.floor(quantity)
      )
    : 0;
}

function trustedItemsChangeCart(
  cartItems,
  trustedItems
) {
  if (
    !Array.isArray(
      trustedItems
    )
  ) {
    return false;
  }

  if (
    cartItems.length !==
    trustedItems.length
  ) {
    return true;
  }

  const trustedByLine =
    new Map(
      trustedItems.map(
        (item) => [
          createCheckoutLineKey(
            item
          ),
          item,
        ]
      )
    );

  return cartItems.some(
    (cartItem) => {
      const trustedItem =
        trustedByLine.get(
          createCheckoutLineKey(
            cartItem
          )
        );

      if (
        !trustedItem ||
        trustedItem.isAvailable ===
          false
      ) {
        return true;
      }

      const cartQuantity =
        normalizeCheckoutQuantity(
          cartItem.quantity
        );

      const trustedQuantity =
        normalizeCheckoutQuantity(
          trustedItem.quantity
        );

      const cartStock =
        normalizeCheckoutStock(
          cartItem.stock
        );

      const trustedStock =
        normalizeCheckoutStock(
          trustedItem.availableStock
        );

      const cartPrice =
        Number(
          cartItem.price
        ) || 0;

      const trustedPrice =
        Number(
          trustedItem.price
        ) || 0;

      return (
        cartQuantity !==
          trustedQuantity ||
        cartStock !==
          trustedStock ||
        cartPrice !==
          trustedPrice
      );
    }
  );
}

function getCurrencySymbol(currency) {
  return currency === "BDT"
    ? "৳"
    : currency || "৳";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function normalizePublicCoupons(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((coupon) => ({
      code: String(coupon?.code || "")
        .trim()
        .toUpperCase(),

      title: String(
        coupon?.title ||
          coupon?.publicTitle ||
          coupon?.name ||
          coupon?.code ||
          ""
      ).trim(),

      description: String(
        coupon?.description ||
          coupon?.publicDescription ||
          ""
      ).trim(),

      type: String(
        coupon?.type || ""
      ).trim(),

      value: Number(coupon?.value) || 0,

      minimumOrder:
        Number(coupon?.minimumOrder) || 0,

      maximumDiscount:
        Number(coupon?.maximumDiscount) || 0,

      startsAt: coupon?.startsAt || null,
      expiresAt: coupon?.expiresAt || null,

      promoted: coupon?.promoted === true,

      displayOrder:
        Number(coupon?.displayOrder) || 0,
    }))
    .filter((coupon) => coupon.code);
}

function getCouponOfferLabel(
  coupon,
  currencySymbol
) {
  if (coupon.type === "percentage") {
    return `${formatMoney(
      coupon.value
    )}% OFF`;
  }

  if (coupon.type === "fixed") {
    return `${currencySymbol}${formatMoney(
      coupon.value
    )} OFF`;
  }

  if (coupon.type === "free_shipping") {
    return "FREE DELIVERY";
  }

  return "SPECIAL OFFER";
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cartItems,
    clearCart,
    refreshCart,
    isStorageReady,
    isCartRefreshing,
  } = useCart();

  const quoteRequestRef = useRef(0);

  const initiateCheckoutTrackedRef =
    useRef(false);

  const [settings, setSettings] = useState(
    DEFAULT_SETTINGS
  );

  const [settingsLoaded, setSettingsLoaded] =
    useState(false);

  const [checkoutToken, setCheckoutToken] =
    useState("");

  const [deliveryArea, setDeliveryArea] =
    useState("inside_dhaka");

  const [paymentMethod, setPaymentMethod] =
    useState("cash_on_delivery");

  const [quote, setQuote] = useState(null);

  const [quoteError, setQuoteError] =
    useState("");

  const [isQuoteLoading, setIsQuoteLoading] =
    useState(false);

  const [couponInput, setCouponInput] =
    useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [
    couponMessageType,
    setCouponMessageType,
  ] = useState("");

  const [
    isApplyingCoupon,
    setIsApplyingCoupon,
  ] = useState(false);

  const [publicCoupons, setPublicCoupons] =
    useState([]);

  const [
    publicCouponsLoaded,
    setPublicCouponsLoaded,
  ] = useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [
    acceptedPolicies,
    setAcceptedPolicies,
  ] = useState(false);

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const enabledPaymentMethods = useMemo(
    () =>
      PAYMENT_METHODS.filter(
        (method) =>
          settings.payment?.[
            method.settingsKey
          ] === true
      ),
    [settings.payment]
  );

  const selectedPaymentMethod =
    enabledPaymentMethods.some(
      (method) =>
        method.value === paymentMethod
    )
      ? paymentMethod
      : enabledPaymentMethods[0]
          ?.value || "";

  const quoteIsAvailable =
    settingsLoaded &&
    isStorageReady &&
    !isCartRefreshing &&
    cartItems.length > 0 &&
    Boolean(selectedPaymentMethod);

  const activeQuote =
    quoteIsAvailable ? quote : null;

  const currency =
    activeQuote?.pricing?.currency ||
    settings.store?.currency ||
    "BDT";

  const currencySymbol =
    getCurrencySymbol(currency);

  const displayItems =
    activeQuote?.items?.length > 0
      ? activeQuote.items
      : cartItems;

  const pricing =
    activeQuote?.pricing || {
    subtotal: cartItems.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    ),

    originalDeliveryCharge: 0,
    productDiscount: 0,
    deliveryDiscount: 0,
    totalDiscount: 0,
    payableDeliveryCharge: 0,
    total: 0,
  };

  const totalItems = displayItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  useEffect(() => {
    if (
      initiateCheckoutTrackedRef.current ||
      !isStorageReady ||
      cartItems.length === 0
    ) {
      return;
    }

    const params =
      buildInitiateCheckoutParams(
        cartItems
      );

    if (!params) {
      return;
    }

    initiateCheckoutTrackedRef.current =
      true;

    trackMetaEvent(
      "InitiateCheckout",
      params
    );

    trackGa4Event(
      "begin_checkout",
      buildGa4ItemEventParams(
        cartItems
      )
    );
  }, [isStorageReady, cartItems]);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        const existingToken =
          window.sessionStorage.getItem(
            CHECKOUT_TOKEN_KEY
          );

        const token =
          existingToken ||
          createCheckoutToken();

        window.sessionStorage.setItem(
          CHECKOUT_TOKEN_KEY,
          token
        );

        setCheckoutToken(token);
      });

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/settings",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          active &&
          response.ok &&
          data.success &&
          data.settings
        ) {
          setSettings(data.settings);
        }
      } catch {
        // Default settings remain available.
      } finally {
        if (active) {
          setSettingsLoaded(true);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPublicCoupons() {
      try {
        const response = await fetch(
          "/api/coupons?public=1",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (
          active &&
          response.ok &&
          data?.success
        ) {
          setPublicCoupons(
            normalizePublicCoupons(
              data.coupons
            )
          );
        }
      } catch {
        if (active) {
          setPublicCoupons([]);
        }
      } finally {
        if (active) {
          setPublicCouponsLoaded(true);
        }
      }
    }

    loadPublicCoupons();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!quoteIsAvailable) {
      return;
    }

    const requestId =
      quoteRequestRef.current + 1;

    quoteRequestRef.current = requestId;

    const controller =
      new AbortController();

    async function loadQuote() {
      setIsQuoteLoading(true);
      setQuoteError("");

      try {
        const response = await fetch(
          "/api/orders/quote",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            signal: controller.signal,

            body: JSON.stringify({
              items: getCartPayload(cartItems),
              deliveryArea,
              paymentMethod:
                selectedPaymentMethod,

              couponCode:
                appliedCoupon?.code || "",
            }),
          }
        );

        const data = await response.json();

        if (
          requestId !==
          quoteRequestRef.current
        ) {
          return;
        }

        if (
          !response.ok ||
          !data.success ||
          !data.quote
        ) {
          if (
            appliedCoupon &&
            String(data.code || "").startsWith(
              "COUPON_"
            )
          ) {
            setAppliedCoupon(null);

            setCouponMessage(
              data.message ||
                "Coupon is no longer available."
            );

            setCouponMessageType("error");
            return;
          }

          const quoteMessage =
            data.message ||
            "Order total could not be calculated.";

          setQuote(null);

          if (
            isInventoryCorrectionCode(
              data.code
            )
          ) {
            const refreshResult =
              await refreshCart({
                force: true,
              });

            if (
              requestId !==
              quoteRequestRef.current
            ) {
              return;
            }

            setQuoteError(
              refreshResult?.success &&
                refreshResult?.message
                ? `${quoteMessage} ${refreshResult.message}`
                : quoteMessage
            );

            return;
          }

          setQuoteError(
            quoteMessage
          );

          return;
        }

        if (
          trustedItemsChangeCart(
            cartItems,
            data.quote.items
          )
        ) {
          const refreshResult =
            await refreshCart({
              force: true,
            });

          if (
            requestId !==
              quoteRequestRef.current
          ) {
            return;
          }

          if (
            refreshResult?.reason ===
            "corrected"
          ) {
            setQuote(null);

            setQuoteError(
              refreshResult.message ||
                "Your cart was updated using current stock and prices."
            );

            return;
          }
        }

        setQuote(data.quote);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        if (
          requestId ===
          quoteRequestRef.current
        ) {
          setQuoteError(
            "Order total could not be calculated. Please try again."
          );
        }
      } finally {
        if (
          requestId ===
          quoteRequestRef.current
        ) {
          setIsQuoteLoading(false);
        }
      }
    }

    loadQuote();

    return () => {
      controller.abort();
    };
  }, [
    settingsLoaded,
    cartItems,
    deliveryArea,
    selectedPaymentMethod,
    appliedCoupon,
    quoteIsAvailable,
    refreshCart,
  ]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setSubmitError("");
  }

  function validateForm() {
    const errors = {};

    const fullName =
      formData.fullName.trim();

    const phone = formData.phone.replace(
      /\D/g,
      ""
    );

    const email = formData.email
      .trim()
      .toLowerCase();

    const address =
      formData.address.trim();

    if (fullName.length < 2) {
      errors.fullName =
        "Please enter your full name.";
    }

    if (
      phone.length < 10 ||
      phone.length > 14
    ) {
      errors.phone =
        "Please enter a valid phone number.";
    }

    if (email && !isValidEmail(email)) {
      errors.email =
        "Please enter a valid email address.";
    }

    if (address.length < 8) {
      errors.address =
        "Please enter your full delivery address.";
    }

    setFieldErrors(errors);

    const firstErrorField =
      Object.keys(errors)[0];

    if (firstErrorField) {
      document
        .querySelector(
          `[name="${firstErrorField}"]`
        )
        ?.focus();

      return null;
    }

    return {
      fullName,
      phone,
      email,
      address,
      note: formData.note.trim(),
    };
  }

  async function handleApplyCoupon(
    requestedCode = ""
  ) {
    const couponCode = String(
      requestedCode || couponInput
    )
      .trim()
      .toUpperCase();

    if (!couponCode) {
      setCouponMessage(
        "Please enter a coupon code."
      );

      setCouponMessageType("error");
      return;
    }

    if (cartItems.length === 0) {
      setCouponMessage(
        "Your cart is empty."
      );

      setCouponMessageType("error");
      return;
    }

    setCouponInput(couponCode);
    setIsApplyingCoupon(true);
    setCouponMessage("");
    setCouponMessageType("");

    try {
      const response = await fetch(
        "/api/coupons/validate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            couponCode,

            items:
              getCartPayload(cartItems),

            deliveryArea,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.coupon
      ) {
        setAppliedCoupon(null);

        setCouponMessage(
          data.message ||
            "Coupon could not be applied."
        );

        setCouponMessageType("error");
        return;
      }

      setCouponInput(data.coupon.code);
      setAppliedCoupon(data.coupon);

      setQuote({
        items: data.items || [],
        deliveryArea,
        paymentMethod: null,
        coupon: data.coupon,
        pricing: data.pricing,
      });

      setCouponMessage(
        data.message ||
          "Coupon applied successfully."
      );

      setCouponMessageType("success");
    } catch {
      setAppliedCoupon(null);

      setCouponMessage(
        "Coupon could not be validated. Please try again."
      );

      setCouponMessageType("error");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");

    setCouponMessage(
      "Coupon removed."
    );

    setCouponMessageType("info");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError("");

    if (cartItems.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    if (!checkoutToken) {
      setSubmitError(
        "Checkout session is still loading. Please try again."
      );

      return;
    }

    if (
      enabledPaymentMethods.length === 0
    ) {
      setSubmitError(
        "No payment method is currently available."
      );

      return;
    }

    if (!activeQuote || quoteError) {
      setSubmitError(
        quoteError ||
          "Please wait for the order total to update."
      );

      return;
    }

    if (!acceptedPolicies) {
      setSubmitError(
        "Please agree to the order and privacy policies before placing your order."
      );

      document
        .querySelector(
          "#acceptedPolicies"
        )
        ?.focus();

      return;
    }

    const customer = validateForm();

    if (!customer) {
      return;
    }

    if (
      !isStorageReady ||
      isCartRefreshing
    ) {
      setSubmitError(
        "Cart stock is still being checked. Please wait a moment."
      );

      return;
    }

    const refreshResult =
      await refreshCart({
        force: true,
      });

    if (
      !refreshResult?.success
    ) {
      setSubmitError(
        refreshResult?.message ||
          "Your cart could not be verified. Please try again."
      );

      return;
    }

    if (
      trustedItemsChangeCart(
        cartItems,
        refreshResult.items
      )
    ) {
      setQuote(null);

      setSubmitError(
        refreshResult.message ||
          "Your cart was updated using current stock and prices. Please review it before placing the order."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            checkoutToken,

            acceptedPolicies:
              true,

            customer: {
              ...customer,
              deliveryArea,
            },

            deliveryArea,
            paymentMethod:
              selectedPaymentMethod,

            couponCode:
              appliedCoupon?.code || "",

            items:
              getCartPayload(cartItems),
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        const orderMessage =
          data.message ||
          "Order could not be placed.";

        if (
          isInventoryCorrectionCode(
            data.code
          )
        ) {
          const refreshResult =
            await refreshCart({
              force: true,
            });

          setQuote(null);

          setSubmitError(
            refreshResult?.success &&
              refreshResult?.message
              ? `${orderMessage} ${refreshResult.message}`
              : orderMessage
          );

          return;
        }

        setSubmitError(
          orderMessage
        );

        return;
      }

      sessionStorage.setItem(
        "obsidian-last-order",

        JSON.stringify({
          order: data.order,

          pricing:
            data.pricing ||
            data.order.pricing,

          createdAt:
            new Date().toISOString(),
        })
      );

      /*
       * Meta Purchase: sent only for a newly created order, using
       * the server's trusted total. A duplicate response means
       * this order was already counted.
       */
      if (!data.duplicate) {
        const purchase = {
          order: data.order,

          pricing:
            data.pricing ||
            data.order.pricing,
        };

        trackMetaPurchase(purchase);

        /*
         * GA4 uses the same one-way hashed ID as Meta for
         * transaction_id, never the raw order ID.
         */
        createPurchaseEventId(
          data.order.id
        )
          .then((transactionId) =>
            trackGa4Purchase({
              ...purchase,
              transactionId,
            })
          )
          .catch(() => {});
      }

      sessionStorage.removeItem(
        CHECKOUT_TOKEN_KEY
      );

      clearCart();

      router.push(
        `/success?orderId=${encodeURIComponent(
          data.order.id
        )}`
      );
    } catch {
      setSubmitError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1ece4] text-[#0b0b0b]">
      <Navbar />

      <section className="px-5 pb-20 pt-32 sm:px-6 lg:px-10 lg:pb-28 lg:pt-40">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-5 text-xs uppercase tracking-[0.42em] text-neutral-500">
            Checkout
          </p>

          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:mb-12 md:flex-row md:items-end">
            <h1 className="font-heading text-5xl font-light leading-none sm:text-6xl md:text-8xl">
              Complete Order
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {totalItems}{" "}
              {totalItems === 1
                ? "Item"
                : "Items"}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="border border-black/10 bg-[#eee7dd] p-8 sm:p-10 md:p-14">
              <h2 className="font-heading text-4xl font-light">
                Your cart is empty.
              </h2>

              <p className="mt-4 max-w-xl leading-8 text-neutral-600">
                Add an OBSIDIAN piece before
                proceeding to checkout.
              </p>

              <Link
                href="/shop"
                className="mt-9 inline-flex border border-black px-7 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-black hover:text-[#f1ece4]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-7"
              >
                <section className="border border-black/10 bg-[#eee7dd] p-6 sm:p-8 md:p-9">
                  <p className="mb-7 text-xs uppercase tracking-[0.38em] text-neutral-500">
                    Customer Details
                  </p>

                  <div className="grid gap-6">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                      >
                        Full Name
                      </label>

                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        maxLength={120}
                        value={formData.fullName}
                        onChange={handleChange}
                        aria-invalid={Boolean(
                          fieldErrors.fullName
                        )}
                        className="w-full border-b border-black/20 bg-transparent py-3 outline-none transition focus:border-black"
                      />

                      {fieldErrors.fullName ? (
                        <p className="mt-2 text-xs text-red-700">
                          {
                            fieldErrors.fullName
                          }
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                      >
                        Phone Number
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={24}
                        value={formData.phone}
                        onChange={handleChange}
                        aria-invalid={Boolean(
                          fieldErrors.phone
                        )}
                        className="w-full border-b border-black/20 bg-transparent py-3 outline-none transition focus:border-black"
                      />

                      {fieldErrors.phone ? (
                        <p className="mt-2 text-xs text-red-700">
                          {fieldErrors.phone}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                      >
                        Email Optional
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(
                          fieldErrors.email
                        )}
                        className="w-full border-b border-black/20 bg-transparent py-3 outline-none transition focus:border-black"
                      />

                      {fieldErrors.email ? (
                        <p className="mt-2 text-xs text-red-700">
                          {fieldErrors.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="border border-black/10 bg-[#eee7dd] p-6 sm:p-8 md:p-9">
                  <p className="mb-7 text-xs uppercase tracking-[0.38em] text-neutral-500">
                    Delivery
                  </p>

                  <div className="mb-7 grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        value:
                          "inside_dhaka",

                        label:
                          "Inside Dhaka",

                        price:
                          settings.delivery
                            ?.insideDhaka,
                      },

                      {
                        value:
                          "outside_dhaka",

                        label:
                          "Outside Dhaka",

                        price:
                          settings.delivery
                            ?.outsideDhaka,
                      },
                    ].map((area) => (
                      <button
                        key={area.value}
                        type="button"
                        onClick={() =>
                          setDeliveryArea(
                            area.value
                          )
                        }
                        className={`border px-5 py-4 text-left text-xs uppercase tracking-[0.22em] transition ${
                          deliveryArea ===
                          area.value
                            ? "border-black bg-black text-[#f1ece4]"
                            : "border-black/20 hover:border-black"
                        }`}
                      >
                        {area.label} /{" "}
                        {currencySymbol}{" "}
                        {formatMoney(
                          area.price
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <label
                        htmlFor="address"
                        className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                      >
                        Full Delivery Address
                      </label>

                      <textarea
                        id="address"
                        name="address"
                        rows={4}
                        maxLength={1000}
                        autoComplete="street-address"
                        value={formData.address}
                        onChange={handleChange}
                        aria-invalid={Boolean(
                          fieldErrors.address
                        )}
                        className="w-full resize-none border-b border-black/20 bg-transparent py-3 outline-none transition focus:border-black"
                      />

                      {fieldErrors.address ? (
                        <p className="mt-2 text-xs text-red-700">
                          {
                            fieldErrors.address
                          }
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="note"
                        className="mb-2 block text-xs uppercase tracking-[0.25em] text-neutral-500"
                      >
                        Order Note Optional
                      </label>

                      <textarea
                        id="note"
                        name="note"
                        rows={3}
                        maxLength={1000}
                        value={formData.note}
                        onChange={handleChange}
                        className="w-full resize-none border-b border-black/20 bg-transparent py-3 outline-none transition focus:border-black"
                      />
                    </div>
                  </div>
                </section>

                <section className="border border-black/10 bg-[#eee7dd] p-6 sm:p-8 md:p-9">
                  <p className="mb-7 text-xs uppercase tracking-[0.38em] text-neutral-500">
                    Payment
                  </p>

                  {enabledPaymentMethods.length >
                  0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {enabledPaymentMethods.map(
                        (method) => (
                          <label
                            key={method.value}
                            className={`flex cursor-pointer items-center gap-3 border px-5 py-4 text-xs uppercase tracking-[0.2em] transition ${
                              selectedPaymentMethod ===
                              method.value
                                ? "border-black bg-black text-[#f1ece4]"
                                : "border-black/20 hover:border-black"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={
                                method.value
                              }
                              checked={
                                selectedPaymentMethod ===
                                method.value
                              }
                              onChange={() =>
                                setPaymentMethod(
                                  method.value
                                )
                              }
                              className="accent-current"
                            />

                            {method.label}
                          </label>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-700">
                      No payment method is
                      currently available.
                    </p>
                  )}

                  <label className="mt-7 flex cursor-pointer items-start gap-4 border border-black/15 p-5 text-xs leading-6 text-neutral-600">
                    <input
                      id="acceptedPolicies"
                      name="acceptedPolicies"
                      type="checkbox"
                      checked={
                        acceptedPolicies
                      }
                      onChange={(
                        event
                      ) => {
                        setAcceptedPolicies(
                          event.target
                            .checked
                        );

                        if (
                          submitError
                        ) {
                          setSubmitError(
                            ""
                          );
                        }
                      }}
                      className="mt-1 h-4 w-4 shrink-0 accent-black"
                    />

                    <span>
                      I agree to the{" "}
                      <Link
                        href="/terms-of-sale"
                        className="border-b border-black/30 text-black"
                      >
                        Terms of Sale
                      </Link>
                      ,{" "}
                      <Link
                        href="/delivery-policy"
                        className="border-b border-black/30 text-black"
                      >
                        Delivery Policy
                      </Link>
                      ,{" "}
                      <Link
                        href="/exchange-return-policy"
                        className="border-b border-black/30 text-black"
                      >
                        Exchange &amp; Return Policy
                      </Link>
                      ,{" "}
                      <Link
                        href="/refund-policy"
                        className="border-b border-black/30 text-black"
                      >
                        Refund Policy
                      </Link>
                      , and{" "}
                      <Link
                        href="/privacy"
                        className="border-b border-black/30 text-black"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {submitError ? (
                    <div
                      role="alert"
                      className="mt-6 border border-red-700/30 bg-red-50/50 px-5 py-4 text-sm leading-6 text-red-800"
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isQuoteLoading ||
                      isApplyingCoupon ||
                      isCartRefreshing ||
                      !isStorageReady ||
                      !activeQuote ||
                      enabledPaymentMethods.length ===
                        0
                    }
                    className="mt-7 w-full bg-black px-8 py-5 text-xs uppercase tracking-[0.32em] text-[#f1ece4] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isSubmitting
                      ? "Placing Order..."
                      : isCartRefreshing
                        ? "Checking Stock..."
                        : isQuoteLoading
                          ? "Updating Total..."
                          : "Place Order"}
                  </button>

                  <p className="mt-4 text-center text-xs leading-6 text-neutral-500">
                    Your order will be reviewed
                    before confirmation.
                  </p>
                </section>
              </form>

              <aside className="h-fit border border-black/10 bg-[#eee7dd] p-6 sm:p-7 lg:sticky lg:top-28">
                <p className="mb-5 text-xs uppercase tracking-[0.38em] text-neutral-500">
                  Summary
                </p>

                <h2 className="font-heading text-4xl font-light">
                  Order Summary
                </h2>

                {quoteError ? (
                  <div
                    role="alert"
                    className="mt-6 border border-red-700/30 bg-red-50/50 p-4 text-sm leading-6 text-red-800"
                  >
                    {quoteError}
                  </div>
                ) : null}

                <div className="mt-7 space-y-6 border-y border-black/10 py-6">
                  {displayItems.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex gap-4"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={160}
                          height={192}
                          sizes="80px"
                          className="h-24 w-20 shrink-0 object-cover"
                        />
                      ) : (
                        <div className="h-24 w-20 shrink-0 bg-black/5" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                          {item.series}
                        </p>

                        <h3 className="mt-2 font-heading text-2xl font-light">
                          {item.name}
                        </h3>

                        {item.color ? (
                          <p className="mt-2 text-sm text-neutral-600">
                            {item.color}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm text-neutral-600">
                          {item.size
                            ? `Size ${item.size} / `
                            : ""}
                          Qty {item.quantity}
                        </p>

                        {Number.isFinite(
                          Number(
                            item.availableStock
                          )
                        ) ? (
                          <p className="mt-1 text-xs text-neutral-500">
                            {normalizeCheckoutStock(
                              item.availableStock
                            )}{" "}
                            currently available
                            {item.size
                              ? ` in size ${item.size}`
                              : ""}
                          </p>
                        ) : null}
                      </div>

                      <p className="shrink-0 text-sm">
                        {currencySymbol}{" "}
                        {formatMoney(
                          item.lineTotal ??
                            Number(
                              item.price
                            ) *
                              Number(
                                item.quantity
                              )
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 border-b border-black/10 pb-7">
                  <p className="mb-4 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Coupon
                  </p>

                  {appliedCoupon ? (
                    <div className="border border-black bg-black p-5 text-[#f1ece4]">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-400">
                            Applied Code
                          </p>

                          <p className="mt-2 uppercase tracking-[0.18em]">
                            {appliedCoupon.code}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleRemoveCoupon
                          }
                          className="text-[10px] uppercase tracking-[0.24em] text-neutral-400 underline underline-offset-4 transition hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex">
                      <input
                        type="text"
                        value={couponInput}
                        maxLength={50}
                        autoComplete="off"
                        placeholder="ENTER CODE"
                        onChange={(event) => {
                          setCouponInput(
                            event.target.value.toUpperCase()
                          );

                          setCouponMessage("");
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter"
                          ) {
                            event.preventDefault();

                            handleApplyCoupon();
                          }
                        }}
                        className="min-w-0 flex-1 border border-black/20 bg-transparent px-4 py-4 text-xs uppercase tracking-[0.18em] outline-none focus:border-black"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleApplyCoupon()
                        }
                        disabled={
                          isApplyingCoupon
                        }
                        className="border border-l-0 border-black bg-black px-5 text-[10px] uppercase tracking-[0.22em] text-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isApplyingCoupon
                          ? "Checking"
                          : "Apply"}
                      </button>
                    </div>
                  )}

                  {couponMessage ? (
                    <p
                      role="status"
                      className={`mt-3 text-xs leading-5 ${
                        couponMessageType ===
                        "error"
                          ? "text-red-700"
                          : couponMessageType ===
                              "success"
                            ? "text-green-800"
                            : "text-neutral-500"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  ) : null}

                  {!publicCouponsLoaded ? (
                    <div className="mt-6 border border-black/10 p-5">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-neutral-500">
                        Loading Available Offers
                      </p>
                    </div>
                  ) : null}

                  {publicCouponsLoaded &&
                  publicCoupons.length > 0 ? (
                    <div className="mt-7">
                      <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                            Available Offers
                          </p>

                          <p className="mt-2 text-xs leading-5 text-neutral-500">
                            Select an offer to apply
                            its code.
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {publicCoupons.length}{" "}
                          {publicCoupons.length === 1
                            ? "Offer"
                            : "Offers"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {publicCoupons.map(
                          (coupon) => {
                            const isApplied =
                              appliedCoupon?.code ===
                              coupon.code;

                            const expiryDate =
                              formatDate(
                                coupon.expiresAt
                              );

                            return (
                              <article
                                key={coupon.code}
                                className={`relative overflow-hidden border p-5 ${
                                  coupon.promoted
                                    ? "border-black bg-[#f1ece4]"
                                    : "border-black/10 bg-black/[0.025]"
                                }`}
                              >
                                {coupon.promoted ? (
                                  <div className="absolute right-0 top-0 bg-black px-3 py-2 text-[8px] uppercase tracking-[0.24em] text-[#f1ece4]">
                                    Featured
                                  </div>
                                ) : null}

                                <div className="pr-14">
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
                                    {getCouponOfferLabel(
                                      coupon,
                                      currencySymbol
                                    )}
                                  </p>

                                  <h3 className="mt-3 font-heading text-2xl font-light leading-tight">
                                    {coupon.title ||
                                      coupon.code}
                                  </h3>

                                  {coupon.description ? (
                                    <p className="mt-3 text-xs leading-6 text-neutral-600">
                                      {
                                        coupon.description
                                      }
                                    </p>
                                  ) : null}
                                </div>

                                <div className="mt-5 space-y-2 border-t border-black/10 pt-4">
                                  {coupon.minimumOrder >
                                  0 ? (
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                                      Minimum order{" "}
                                      {currencySymbol}
                                      {formatMoney(
                                        coupon.minimumOrder
                                      )}
                                    </p>
                                  ) : null}

                                  {coupon.type ===
                                    "percentage" &&
                                  coupon.maximumDiscount >
                                    0 ? (
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                                      Maximum discount{" "}
                                      {currencySymbol}
                                      {formatMoney(
                                        coupon.maximumDiscount
                                      )}
                                    </p>
                                  ) : null}

                                  {expiryDate ? (
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                                      Valid until{" "}
                                      {expiryDate}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleApplyCoupon(
                                        coupon.code
                                      )
                                    }
                                    disabled={
                                      isApplyingCoupon ||
                                      isApplied
                                    }
                                    className="border border-black bg-black px-4 py-3 text-[9px] uppercase tracking-[0.22em] text-[#f1ece4] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isApplied
                                      ? "Applied"
                                      : isApplyingCoupon
                                        ? "Checking"
                                        : "Apply Code"}
                                  </button>

                                  <code className="select-all text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    {coupon.code}
                                  </code>
                                </div>
                              </article>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-7 space-y-4 text-sm">
                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">
                      Subtotal
                    </span>

                    <span>
                      {currencySymbol}{" "}
                      {formatMoney(
                        pricing.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">
                      Delivery
                    </span>

                    <span>
                      {currencySymbol}{" "}
                      {formatMoney(
                        pricing
                          .originalDeliveryCharge
                      )}
                    </span>
                  </div>

                  {Number(
                    pricing.productDiscount
                  ) > 0 ? (
                    <div className="flex justify-between gap-6">
                      <span className="text-neutral-500">
                        Product Discount
                      </span>

                      <span>
                        -{currencySymbol}{" "}
                        {formatMoney(
                          pricing.productDiscount
                        )}
                      </span>
                    </div>
                  ) : null}

                  {Number(
                    pricing.deliveryDiscount
                  ) > 0 ? (
                    <div className="flex justify-between gap-6">
                      <span className="text-neutral-500">
                        Delivery Discount
                      </span>

                      <span>
                        -{currencySymbol}{" "}
                        {formatMoney(
                          pricing.deliveryDiscount
                        )}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex justify-between gap-6">
                    <span className="text-neutral-500">
                      Delivery Payable
                    </span>

                    <span>
                      {currencySymbol}{" "}
                      {formatMoney(
                        pricing
                          .payableDeliveryCharge
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-7 border-t border-black/10 pt-7">
                  <div className="flex justify-between gap-6">
                    <span className="font-heading text-3xl font-light">
                      Total
                    </span>

                    <span className="font-heading text-3xl font-light">
                      {currencySymbol}{" "}
                      {formatMoney(
                        pricing.total
                      )}
                    </span>
                  </div>

                  {isQuoteLoading ? (
                    <p className="mt-3 text-right text-xs text-neutral-500">
                      Updating secure total…
                    </p>
                  ) : null}
                </div>

                <Link
                  href="/cart"
                  className="mt-7 flex w-full justify-center border border-black px-7 py-4 text-xs uppercase tracking-[0.28em] transition hover:bg-black hover:text-[#f1ece4]"
                >
                  Back To Cart
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}