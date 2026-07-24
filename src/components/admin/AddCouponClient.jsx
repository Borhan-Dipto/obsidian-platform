"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

  return Math.max(0, Math.floor(amount));
}

function normalizeCouponCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
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

export default function AddCouponClient() {
  const router = useRouter();

  const [formData, setFormData] =
    useState(INITIAL_FORM_DATA);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setErrorMessage("");

    setFormData((currentData) => {
      const nextValue =
        type === "checkbox"
          ? checked
          : value;

      const nextData = {
        ...currentData,
        [name]: nextValue,
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
    const nextType = event.target.value;

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

    if (!formData.name.trim()) {
      return "Please enter a coupon name.";
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

    if (
      formData.displayOrder !== "" &&
      Number(formData.displayOrder) < 0
    ) {
      return "Display order cannot be negative.";
    }

    if (
      formData.isPublic &&
      formData.publicTitle.trim().length > 120
    ) {
      return "Public title cannot exceed 120 characters.";
    }

    if (
      formData.isPublic &&
      formData.publicDescription.trim().length >
        500
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
      setErrorMessage(validationError);
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

      minimumOrder: normalizeMoney(
        formData.minimumOrder
      ),

      maximumDiscount:
        formData.type ===
        "percentage"
          ? normalizeMoney(
              formData.maximumDiscount
            )
          : 0,

      startsAt: convertDateTimeToIso(
        formData.startsAt
      ),

      expiresAt:
        convertDateTimeToIso(
          formData.expiresAt
        ),

      usageLimit: normalizeInteger(
        formData.usageLimit
      ),

      usageCount: 0,

      active: formData.active,

      status: formData.active
        ? "active"
        : "inactive",

      isPublic: formData.isPublic,

      promoted:
        formData.isPublic &&
        formData.promoted,

      publicTitle:
        formData.publicTitle.trim(),

      publicDescription:
        formData.publicDescription.trim(),

      displayOrder: normalizeInteger(
        formData.displayOrder
      ),
    };

    try {
      const response = await fetch(
        "/api/coupons",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            couponData
          ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setErrorMessage(
          data.message ||
            "Coupon could not be created."
        );

        setIsSubmitting(false);
        return;
      }

      router.push(
        "/admin/coupons"
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again."
      );

      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-[#f1ece4] lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.45em] text-neutral-500">
              Admin / Coupons / New
            </p>

            <h1 className="font-heading text-5xl font-light md:text-7xl">
              Add Coupon
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500">
              Create discount rules and
              choose whether customers can
              discover the coupon publicly.
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
          <div className="mb-8 border border-red-500/40 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
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
                  autoComplete="off"
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 uppercase tracking-[0.15em] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-600 focus:border-white/30"
                />
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
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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
                  placeholder="Internal campaign note..."
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-y border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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
                  className="w-full border border-white/10 bg-[#111111] px-5 py-4 outline-none transition focus:border-white/30"
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
                      {
                        discountValueLabel
                      }
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
                      min="0.01"
                      max={
                        formData.type ===
                        "percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      required
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30"
                    />
                  </div>
                ) : (
                  <div className="border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-neutral-400">
                    Free shipping removes
                    the applicable delivery
                    charge.
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
                      onChange={
                        handleChange
                      }
                      placeholder="0 means no maximum"
                      min="0"
                      step="0.01"
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                    />
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
                  placeholder="0 means no minimum"
                  min="0"
                  step="0.01"
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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
                Public coupons may be shown
                to customers on the storefront
                and during checkout.
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
                  className="mt-1 h-4 w-4 accent-[#f1ece4]"
                />

                <span>
                  <span className="block text-sm text-[#f1ece4]">
                    Show this coupon to customers
                  </span>

                  <span className="mt-2 block text-xs leading-6 text-neutral-500">
                    The coupon remains usable
                    even when this option is
                    disabled, but customers will
                    not see it publicly.
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
                      className="mt-1 h-4 w-4 accent-[#f1ece4]"
                    />

                    <span>
                      <span className="block text-sm text-[#f1ece4]">
                        Feature this coupon
                      </span>

                      <span className="mt-2 block text-xs leading-6 text-neutral-500">
                        Featured coupons appear
                        before other public
                        coupons.
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
                      maxLength={120}
                      placeholder="Leave blank to use the internal name"
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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
                      maxLength={500}
                      rows={4}
                      placeholder="Example: Save 20% on orders over ৳2,000."
                      className="w-full resize-y border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
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
                      step="1"
                      className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30"
                    />

                    <p className="mt-2 text-xs leading-6 text-neutral-600">
                      Lower numbers appear
                      first.
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
                    onChange={
                      handleChange
                    }
                    className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30 [color-scheme:dark]"
                  />
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
                    onChange={
                      handleChange
                    }
                    className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition focus:border-white/30 [color-scheme:dark]"
                  />
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
                  placeholder="0 means unlimited"
                  min="0"
                  step="1"
                  className="w-full border border-white/10 bg-white/5 px-5 py-4 outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-4 border border-white/10 bg-white/[0.03] p-5">
                <input
                  type="checkbox"
                  name="active"
                  checked={
                    formData.active
                  }
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-[#f1ece4]"
                />

                <span>
                  <span className="block text-sm text-[#f1ece4]">
                    Activate coupon immediately
                  </span>

                  <span className="mt-2 block text-xs leading-6 text-neutral-500">
                    Start and expiry dates are
                    still respected.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-end">
            <Link
              href="/admin/coupons"
              className="border border-white/15 px-8 py-4 text-center text-xs uppercase tracking-[0.3em] text-neutral-300 transition hover:bg-white/10"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#f1ece4] px-8 py-4 text-xs uppercase tracking-[0.35em] text-[#0b0b0b] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating Coupon..."
                : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}