/*
 * Store-wide delivery and return facts, kept in one place so the
 * product page, policy pages and structured data always say the same
 * thing. These match the published Delivery Policy and Exchange &
 * Return Policy.
 */

export const DELIVERY_ESTIMATES = {
  insideDhaka: { minDays: 1, maxDays: 3 },
  outsideDhaka: { minDays: 3, maxDays: 5 },
};

/* Exchange & Return Policy: request within 7 calendar days of delivery. */
export const RETURN_WINDOW_DAYS = 7;

function toTaka(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

export function formatDeliveryRange({ minDays, maxDays }) {
  return `${minDays}–${maxDays} business days`;
}

/*
 * Delivery lines for the product page. Charges come from admin
 * Settings; a charge is omitted (never guessed) when it is not set.
 */
export function buildDeliveryLines(settings, currencySymbol = "৳") {
  const delivery = settings?.delivery || {};
  const inside = toTaka(delivery.insideDhaka);
  const outside = toTaka(delivery.outsideDhaka);

  return [
    {
      key: "inside",
      label: "Inside Dhaka",
      value: [
        formatDeliveryRange(DELIVERY_ESTIMATES.insideDhaka),
        inside !== null ? `${currencySymbol}${inside}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      key: "outside",
      label: "Outside Dhaka",
      value: [
        formatDeliveryRange(DELIVERY_ESTIMATES.outsideDhaka),
        outside !== null ? `${currencySymbol}${outside}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      key: "exchange",
      label: "Exchange",
      value: `Within ${RETURN_WINDOW_DAYS} days of delivery`,
    },
  ];
}

/*
 * Organization-level return policy (Google recommends one global
 * policy on Organization markup). Only facts stated in the published
 * Exchange & Return Policy are included.
 */
export function buildMerchantReturnPolicy(siteUrl) {
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");

  return {
    "@type": "MerchantReturnPolicy",
    "@id": `${baseUrl}/#return-policy`,
    applicableCountry: "BD",
    returnPolicyCountry: "BD",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: RETURN_WINDOW_DAYS,
    /* Change-of-mind / size exchanges: customer pays return delivery. */
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: `${baseUrl}/exchange-return-policy`,
  };
}
