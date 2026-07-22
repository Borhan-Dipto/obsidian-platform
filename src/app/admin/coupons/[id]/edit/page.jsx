"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const INITIAL_FORM_DATA = {
  code: "",
  name: "",
  description: "",
  type: "percentage",
  value: "",
  minimumOrder: "",
  maximumDiscount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  usageCount: 0,
  active: true,

  isPublic: false,
  promoted: false,
  publicTitle: "",
  publicDescription: "",
  displayOrder: "0",
};

function normalizeMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(amount * 100) / 100
  );
}

function normalizeInteger(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(amount)
  );
}

function normalizeCouponCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizeCouponType(value) {
  const type = String(value || "")
    .trim()
    .toLowerCase();

  if (
    type === "percentage" ||
    type === "percent"
  ) {
    return "percentage";
  }

  if (
    type === "fixed" ||
    type === "fixed_amount" ||
    type === "fixed-amount" ||
    type === "amount"
  ) {
    return "fixed";
  }

  if (
    type === "free_shipping" ||
    type === "free-shipping" ||
    type === "free_delivery" ||
    type === "shipping"
  ) {
    return "free_shipping";
  }

  return "percentage";
}

function getCouponActiveState(coupon) {
  if (coupon?.active === false) {
    return false;
  }

  if (coupon?.isActive === false) {
    return false;
  }

  if (
    String(coupon?.status || "")
      .trim()
      .toLowerCase() === "inactive"
  ) {
    return false;
  }

  return true;
}

function convertDateTimeToIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function convertDateToLocalInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

function getErrorMessage(data, fallback) {
  if (
    data &&
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  return fallback;
}

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();

  const couponId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [formData, setFormData] =
    useState(INITIAL_FORM_DATA);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [couponNotFound, setCouponNotFound] =
    useState(false);

  const discountValueLabel = useMemo(() => {
    if (formData.type === "percentage") {
      return "Discount Percentage";
    }

    if (formData.type === "fixed") {
      return "Fixed Discount Amount";
    }

    return "No Discount Value Required";
  }, [formData.type]);

  const showDiscountValue =
    formData.type !== "free_shipping";

  const showMaximumDiscount =
    formData.type === "percentage";

  useEffect(() => {
    if (!couponId) {
      setCouponNotFound(true);
      setErrorMessage(
        "Coupon identifier could not be found."
      );
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchCoupon() {
      setIsLoading(true);
      setErrorMessage("");
      setCouponNotFound(false);

      try {
        const response = await fetch(
          `/api/coupons/${encodeURIComponent(
            couponId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (isCancelled) {
          return;
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          if (response.status === 404) {
            setCouponNotFound(true);
          }

          setErrorMessage(
            getErrorMessage(
              data,
              "Coupon could not be loaded."
            )
          );

          setIsLoading(false);
          return;
        }

        const coupon = data.coupon;

        const type =
          normalizeCouponType(
            coupon.type ??
              coupon.discountType
          );

        const isPublic =
          coupon.isPublic === true;

        setFormData({
          code: normalizeCouponCode(
            coupon.code
          ),

          name: String(
            coupon.name || ""
          ),

          description: String(
            coupon.description || ""
          ),

          type,

          value:
            type === "free_shipping"
              ? ""
              : String(
                  coupon.value ??
                    coupon.discountValue ??
                    coupon.amount ??
                    ""
                ),

          minimumOrder: String(
            coupon.minimumOrder ??
              coupon.minimumSpend ??
              coupon.minOrderAmount ??
              ""
          ),

          maximumDiscount:
            type === "percentage"
              ? String(
                  coupon.maximumDiscount ??
                    coupon.maxDiscount ??
                    ""
                )
              : "",

          startsAt:
            convertDateToLocalInput(
              coupon.startsAt ??
                coupon.startDate
            ),

          expiresAt:
            convertDateToLocalInput(
              coupon.expiresAt ??
                coupon.expiryDate
            ),

          usageLimit: String(
            coupon.usageLimit ??
              coupon.maxUses ??
              ""
          ),

          usageCount:
            normalizeInteger(
              coupon.usageCount ??
                coupon.usedCount
            ),

          active:
            getCouponActiveState(
              coupon
            ),

          isPublic,

          promoted:
            isPublic &&
            coupon.promoted === true,

          publicTitle: String(
            coupon.publicTitle || ""
          ),

          publicDescription: String(
            coupon.publicDescription || ""
          ),

          displayOrder: String(
            coupon.displayOrder ?? 0
          ),
        });

        setIsLoading(false);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(
          "Coupon fetch error:",
          error
        );

        setErrorMessage(
          "Something went wrong while loading the coupon."
        );

        setIsLoading(false);
      }
    }

    fetchCoupon();

    return () => {
      isCancelled = true;
    };
  }, [couponId]);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setErrorMessage("");

    setFormData((currentData) => {
      const nextData = {
        ...currentData,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      };

      if (
        name === "isPublic" &&
        checked === false
      ) {
        nextData.promoted = false;
      }

      return nextData;
    });
  }

  function handleCodeChange(event) {
    setErrorMessage("");

    setFormData((currentData) => ({
      ...currentData,

      code: normalizeCouponCode(
        event.target.value
      ),
    }));
  }

  function handleTypeChange(event) {
    const nextType =
      event.target.value;

    setErrorMessage("");

    setFormData((currentData) => ({
      ...currentData,

      type: nextType,

      value:
        nextType === "free_shipping"
          ? ""
          : currentData.value,

      maximumDiscount:
        nextType === "percentage"
          ? currentData.maximumDiscount
          : "",
    }));
  }

  function validateForm() {
    const code = normalizeCouponCode(
      formData.code
    );

    if (!code) {
      return "Please enter a coupon code.";
    }

    if (code.length < 3) {
      return "Coupon code must contain at least 3 characters.";
    }

    if (code.length > 50) {
      return "Coupon code cannot exceed 50 characters.";
    }

    if (!formData.name.trim()) {
      return "Please enter a coupon name.";
    }

    if (
      formData.name.trim().length > 120
    ) {
      return "Coupon name cannot exceed 120 characters.";
    }

    if (
      formData.description.trim().length >
      1000
    ) {
      return "Internal description cannot exceed 1000 characters.";
    }

    if (
      ![
        "percentage",
        "fixed",
        "free_shipping",
      ].includes(formData.type)
    ) {
      return "Please select a valid coupon type.";
    }

    if (showDiscountValue) {
      const discountValue = Number(
        formData.value
      );

      if (
        !Number.isFinite(discountValue) ||
        discountValue <= 0
      ) {
        return "Please enter a valid discount value.";
      }

      if (
        formData.type === "percentage" &&
        discountValue > 100
      ) {
        return "Percentage discount cannot exceed 100%.";
      }
    }

    if (
      formData.minimumOrder !== "" &&
      Number(formData.minimumOrder) < 0
    ) {
      return "Minimum order cannot be negative.";
    }

    if (
      formData.maximumDiscount !== "" &&
      Number(formData.maximumDiscount) < 0
    ) {
      return "Maximum discount cannot be negative.";
    }

    if (
      formData.usageLimit !== "" &&
      Number(formData.usageLimit) < 0
    ) {
      return "Usage limit cannot be negative.";
    }

    const usageLimit =
      normalizeInteger(
        formData.usageLimit
      );

    if (
      usageLimit > 0 &&
      formData.usageCount > usageLimit
    ) {
      return `Usage limit cannot be lower than the existing usage count of ${formData.usageCount}.`;
    }

    if (
      formData.displayOrder !== "" &&
      (
        !Number.isInteger(
          Number(formData.displayOrder)
        ) ||
        Number(formData.displayOrder) < 0
      )
    ) {
      return "Display order must be a non-negative whole number.";
    }

    if (
      formData.publicTitle.trim().length >
      120
    ) {
      return "Public title cannot exceed 120 characters.";
    }

    if (
      formData.publicDescription
        .trim()
        .length > 500
    ) {
      return "Public description cannot exceed 500 characters.";
    }

    if (
      formData.startsAt &&
      formData.expiresAt
    ) {
      const startDate = new Date(
        formData.startsAt
      );

      const expiryDate = new Date(
        formData.expiresAt
      );

      if (
        !Number.isNaN(
          startDate.getTime()
        ) &&
        !Number.isNaN(
          expiryDate.getTime()
        ) &&
        expiryDate <= startDate
      ) {
        return "Expiry date must be later than the start date.";
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(
        validationError
      );
      return;
    }

    if (!couponId) {
      setErrorMessage(
        "Coupon identifier could not be found."
      );
      return;
    }

    setIsSubmitting(true);

    const normalizedCode =
      normalizeCouponCode(
        formData.code
      );

    const couponData = {
      code: normalizedCode,
      normalizedCode,

      name: formData.name.trim(),

      description:
        formData.description.trim(),

      type: formData.type,

      value:
        formData.type ===
        "free_shipping"
          ? 0
          : normalizeMoney(
              formData.value
            ),

      minimumOrder:
        normalizeMoney(
          formData.minimumOrder
        ),

      maximumDiscount:
        formData.type ===
        "percentage"
          ? normalizeMoney(
              formData.maximumDiscount
            )
          : 0,

      startsAt:
        convertDateTimeToIso(
          formData.startsAt
        ),

      expiresAt:
        convertDateTimeToIso(
          formData.expiresAt
        ),

      usageLimit:
        normalizeInteger(
          formData.usageLimit
        ),

      usageCount:
        formData.usageCount,

      active: formData.active,
      isActive: formData.active,

      status: formData.active
        ? "active"
        : "inactive",

      isPublic:
        formData.isPublic,

      promoted:
        formData.isPublic &&
        formData.promoted,

      publicTitle:
        formData.publicTitle.trim(),

      publicDescription:
        formData.publicDescription.trim(),

      displayOrder:
        normalizeInteger(
          formData.displayOrder
        ),
    };

    try {
      const response = await fetch(
        `/api/coupons/${encodeURIComponent(
          couponId
        )}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            couponData
          ),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !data?.success
      ) {
        setErrorMessage(
          getErrorMessage(
            data,
            "Coupon could not be updated."
          )
        );

        setIsSubmitting(false);
        return;
      }

      router.push(
        "/admin/coupons"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Coupon update error:",
        error
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-6 text-[#f1ece4]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#f1ece4]" />

          <p className="mt-6 text-xs uppercase tracking-[0.35em] text-neutral-500">
            Loading Coupon
          </p>
        </div>
      </main>
    );
  }

  if (couponNotFound) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="border border-white/10 bg-white/[0.02] p-8 text-center md:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Admin / Coupons / Edit
            </p>

            <h1 className="mt-5 font-heading text-5xl font-light md:text-6xl">
              Coupon Not Found
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-500">
              {errorMessage ||
                "The requested coupon does not exist or may have been deleted."}
            </p>

            <Link
              href="/admin/coupons"
              className="mt-8 inline-flex border border-white/20 px-7 py-4 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
            >
              Back to Coupons
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Coupons / Edit
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Edit Coupon
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500">
              Update discount rules, public
              promotion settings, validity dates
              and usage limits.
            </p>
          </div>

          <Link
            href="/admin/coupons"
            className="w-fit border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#f1ece4] hover:text-[#0b0b0b]"
          >
            Back
          </Link>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-8 border border-red-500/40 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <section className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                01 / Identity
              </p>

              <h2 className="mt-3 font-heading text-3xl font-light">
                Coupon Details
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Coupon Code
                </label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={
                    handleCodeChange
                  }
                  placeholder="Example: OBSIDIAN20"
                  required
                  maxLength={50}
                  autoComplete="off"
                  disabled={isSubmitting}
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 uppercase tracking-[0.15em] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  Spaces are removed automatically
                  and the code is saved in uppercase.
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Internal Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Example: Summer Launch Offer"
                  required
                  maxLength={120}
                  disabled={isSubmitting}
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Internal Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  placeholder="Add an internal campaign note..."
                  rows={4}
                  maxLength={1000}
                  disabled={isSubmitting}
                  className="w-full resize-y border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                02 / Discount
              </p>

              <h2 className="mt-3 font-heading text-3xl font-light">
                Discount Rules
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="type"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Coupon Type
                </label>

                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={
                    handleTypeChange
                  }
                  disabled={isSubmitting}
                  className="w-full border border-white/10 bg-[#111111] px-5 py-4 outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="percentage">
                    Percentage Discount
                  </option>

                  <option value="fixed">
                    Fixed Amount Discount
                  </option>

                  <option value="free_shipping">
                    Free Shipping
                  </option>
                </select>
              </div>

              <div
                className={`grid gap-6 ${
                  showMaximumDiscount
                    ? "md:grid-cols-2"
                    : ""
                }`}
              >
                {showDiscountValue ? (
                  <div>
                    <label
                      htmlFor="value"
                      className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                    >
                      {discountValueLabel}
                    </label>

                    <input
                      id="value"
                      name="value"
                      type="number"
                      value={
                        formData.value
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={
                        formData.type ===
                        "percentage"
                          ? "Example: 20"
                          : "Example: 500"
                      }
                      min="0.01"
                      max={
                        formData.type ===
                        "percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      required
                      disabled={isSubmitting}
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <div className="border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-neutral-400">
                    Free shipping coupons remove
                    the applicable delivery charge.
                    No discount value is required.
                  </div>
                )}

                {showMaximumDiscount ? (
                  <div>
                    <label
                      htmlFor="maximumDiscount"
                      className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                    >
                      Maximum Discount
                    </label>

                    <input
                      id="maximumDiscount"
                      name="maximumDiscount"
                      type="number"
                      value={
                        formData.maximumDiscount
                      }
                      onChange={handleChange}
                      placeholder="0 means no maximum"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p className="mt-2 text-xs leading-6 text-neutral-600">
                      Optional cap for
                      percentage-based discounts.
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="minimumOrder"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Minimum Order Amount
                </label>

                <input
                  id="minimumOrder"
                  name="minimumOrder"
                  type="number"
                  value={
                    formData.minimumOrder
                  }
                  onChange={handleChange}
                  placeholder="0 means no minimum order"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                03 / Public Visibility
              </p>

              <h2 className="mt-3 font-heading text-3xl font-light">
                Customer Promotion
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-500">
                Choose whether customers can
                discover this coupon publicly on
                the storefront and checkout.
              </p>
            </div>

            <div className="space-y-6">
              <label className="flex cursor-pointer items-start gap-4 border border-white/10 bg-white/[0.03] p-5">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={
                    formData.isPublic
                  }
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 h-4 w-4 accent-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <span>
                  <span className="block text-sm text-[#f1ece4]">
                    Show this coupon to customers
                  </span>

                  <span className="mt-2 block text-xs leading-6 text-neutral-500">
                    The coupon can remain usable
                    without being displayed
                    publicly.
                  </span>
                </span>
              </label>

              {formData.isPublic ? (
                <>
                  <label className="flex cursor-pointer items-start gap-4 border border-white/10 bg-white/[0.03] p-5">
                    <input
                      type="checkbox"
                      name="promoted"
                      checked={
                        formData.promoted
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSubmitting
                      }
                      className="mt-1 h-4 w-4 accent-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <span>
                      <span className="block text-sm text-[#f1ece4]">
                        Feature this coupon
                      </span>

                      <span className="mt-2 block text-xs leading-6 text-neutral-500">
                        Featured coupons appear
                        before other public
                        promotions.
                      </span>
                    </span>
                  </label>

                  <div>
                    <label
                      htmlFor="publicTitle"
                      className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                    >
                      Public Title
                    </label>

                    <input
                      id="publicTitle"
                      name="publicTitle"
                      type="text"
                      value={
                        formData.publicTitle
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Leave blank to use the internal name"
                      maxLength={120}
                      disabled={
                        isSubmitting
                      }
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="publicDescription"
                      className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                    >
                      Public Description
                    </label>

                    <textarea
                      id="publicDescription"
                      name="publicDescription"
                      value={
                        formData.publicDescription
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Save 20% on orders over ৳2,000."
                      rows={4}
                      maxLength={500}
                      disabled={
                        isSubmitting
                      }
                      className="w-full resize-y border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="displayOrder"
                      className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                    >
                      Display Order
                    </label>

                    <input
                      id="displayOrder"
                      name="displayOrder"
                      type="number"
                      value={
                        formData.displayOrder
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      max="10000"
                      step="1"
                      disabled={
                        isSubmitting
                      }
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p className="mt-2 text-xs leading-6 text-neutral-600">
                      Lower numbers appear first.
                      Featured coupons still receive
                      priority.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                04 / Availability
              </p>

              <h2 className="mt-3 font-heading text-3xl font-light">
                Validity & Usage
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="startsAt"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                  >
                    Start Date
                  </label>

                  <input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    value={
                      formData.startsAt
                    }
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                  />

                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    Leave blank to make it
                    available immediately.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="expiresAt"
                    className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                  >
                    Expiry Date
                  </label>

                  <input
                    id="expiresAt"
                    name="expiresAt"
                    type="datetime-local"
                    value={
                      formData.expiresAt
                    }
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                  />

                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    Leave blank if the coupon
                    should not expire.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="usageLimit"
                  className="mb-3 block text-xs uppercase tracking-[0.25em] text-neutral-400"
                >
                  Total Usage Limit
                </label>

                <input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  value={
                    formData.usageLimit
                  }
                  onChange={handleChange}
                  placeholder="0 means unlimited usage"
                  min={formData.usageCount}
                  step="1"
                  disabled={isSubmitting}
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  This coupon has already been
                  used {formData.usageCount}{" "}
                  {formData.usageCount === 1
                    ? "time"
                    : "times"}
                  . The limit cannot be lower
                  than the current usage count.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-4 border border-white/10 bg-white/[0.03] p-5">
                <input
                  type="checkbox"
                  name="active"
                  checked={
                    formData.active
                  }
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="mt-1 h-4 w-4 accent-[#f1ece4] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <span>
                  <span className="block text-sm text-[#f1ece4]">
                    Coupon is active
                  </span>

                  <span className="mt-2 block text-xs leading-6 text-neutral-500">
                    Inactive coupons remain saved
                    but cannot be applied during
                    checkout.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-end">
            <Link
              href="/admin/coupons"
              className={`border border-white/15 px-8 py-4 text-center text-xs uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-white/10 ${
                isSubmitting
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}