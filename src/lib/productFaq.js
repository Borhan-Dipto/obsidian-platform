/*
 * Product page FAQ, built only from facts the store already publishes:
 * delivery estimates and charges (Settings), the 7-day exchange window
 * and conditions (Exchange & Return Policy), enabled payment methods
 * (Settings), the size guide, and owner-entered fabric facts.
 * A question is left out when its facts are missing — never guessed.
 */

import {
  DELIVERY_ESTIMATES,
  RETURN_WINDOW_DAYS,
  formatDeliveryRange,
} from "./storePolicies.js";

function toTaka(value) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

const PAYMENT_LABELS = {
  cashOnDelivery: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

export function buildProductFaq({
  settings = {},
  details = {},
  currencySymbol = "৳",
} = {}) {
  const items = [];

  const inside = toTaka(settings?.delivery?.insideDhaka);
  const outside = toTaka(settings?.delivery?.outsideDhaka);
  const withCharge = (range, charge) =>
    charge !== null ? `${range} (${currencySymbol}${charge})` : range;

  items.push({
    id: "delivery",
    question: "How long does delivery take?",
    answer: `Inside Dhaka: ${withCharge(
      formatDeliveryRange(DELIVERY_ESTIMATES.insideDhaka),
      inside
    )}. Outside Dhaka: ${withCharge(
      formatDeliveryRange(DELIVERY_ESTIMATES.outsideDhaka),
      outside
    )}. Every order is reviewed and confirmed after checkout before dispatch.`,
  });

  const payment = settings?.payment || {};
  const methods = Object.entries(PAYMENT_LABELS)
    .filter(([key]) => payment[key] === true)
    .map(([, label]) => label);

  if (methods.length > 0) {
    items.push({
      id: "payment",
      question: payment.cashOnDelivery
        ? "Can I pay cash on delivery?"
        : "How can I pay?",
      answer: payment.cashOnDelivery
        ? `Yes. You can pay in cash when your order arrives.${
            methods.length > 1
              ? ` Other options: ${methods
                  .filter((label) => label !== "Cash on Delivery")
                  .join(", ")}.`
              : ""
          }`
        : `Available payment methods: ${methods.join(", ")}.`,
    });
  }

  items.push({
    id: "exchange",
    question: "Can I exchange the size?",
    answer: `Yes. Contact us within ${RETURN_WINDOW_DAYS} days of delivery. Keep the piece unused, with its original tags and packaging. For a size exchange you request, return and re-delivery charges may apply and are confirmed before we process it. If we sent a wrong or faulty item, we arrange the remedy without an avoidable charge.`,
    link: {
      href: "/exchange-return-policy",
      label: "Exchange & Return Policy",
    },
  });

  const fit = String(details?.fit || "").trim();

  items.push({
    id: "size",
    question: "Which size should I choose?",
    answer: `${
      fit ? `This piece has a ${fit.toLowerCase()} fit. ` : ""
    }Measure your chest and match it to the “Fits body chest” range in the size guide below. The garment measurements show the finished piece, so you can compare them with a T-shirt you already own.`,
    link: { href: "/size-guide", label: "Size guide" },
  });

  const material = String(details?.material || "").trim();
  const gsm = Number(details?.gsm);
  const care = String(details?.care || "").trim();

  if (material || (Number.isInteger(gsm) && gsm > 0)) {
    const fabric = [
      material,
      Number.isInteger(gsm) && gsm > 0 ? `${gsm} GSM` : "",
    ]
      .filter(Boolean)
      .join(", ");

    items.push({
      id: "fabric",
      question: "What is the fabric, and how do I care for it?",
      answer: `${fabric}.${care ? ` Care: ${care}` : ""}`,
    });
  }

  return items;
}

export function buildFaqJsonLd(items, pageUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
