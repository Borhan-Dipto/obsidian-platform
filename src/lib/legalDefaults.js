const LEGAL_POLICY_VERSION =
  "2026-07-26.1";

const LEGAL_POLICY_EFFECTIVE_DATE =
  "2026-07-26";

function createSection({
  id,
  title,
  order,
  paragraphs = [],
  bullets = [],
}) {
  return {
    id,
    title,
    order,
    isActive: true,
    paragraphs,
    bullets,
  };
}

function createRelatedPolicy({
  id,
  label,
  href,
  order,
}) {
  return {
    id,
    label,
    href,
    order,
    isActive: true,
  };
}

function createLegalPage({
  schemaVersion,
  key,
  title,
  description,
  keywords,
  summary,
  sections,
  relatedPolicies = [],
}) {
  return {
    key,
    schemaVersion,
    status: "published",

    title,
    slug: key,

    version:
      LEGAL_POLICY_VERSION,

    effectiveDate:
      LEGAL_POLICY_EFFECTIVE_DATE,

    lastReviewedAt:
      LEGAL_POLICY_EFFECTIVE_DATE,

    seo: {
      title,
      description,
      keywords,

      ogImage:
        "/images/collection-artifact.jpeg",

      canonical: `/${key}`,
      index: true,
    },

    content: {
      eyebrow: "Legal",
      title,
      summary,
      sections,
      relatedPolicies,

      contactTitle:
        "Questions or requests",

      contactDescription:
        "Contact {{storeName}} at {{contactEmail}}. You may also use {{contactPhone}} where available.",
    },
  };
}

export function createLegalCmsDefaults(
  schemaVersion
) {
  return {
    privacy: createLegalPage({
      schemaVersion,
      key: "privacy",
      title: "Privacy Policy",

      description:
        "Learn how OBSIDIAN collects, uses, protects, and retains customer and visitor information.",

      keywords:
        "OBSIDIAN privacy policy, customer data Bangladesh, ecommerce privacy",

      summary:
        "This policy explains how {{storeName}} handles information when you browse the website, create an account, place an order, contact support, or subscribe to updates.",

      sections: [
        createSection({
          id: "privacy-scope",
          title: "1. Scope",
          order: 1,

          paragraphs: [
            "This policy applies to information handled through the {{storeName}} website, customer account, checkout, order support, newsletter, and related digital services.",
          ],
        }),

        createSection({
          id:
            "privacy-information",

          title:
            "2. Information we collect",

          order: 2,

          paragraphs: [
            "We collect information you provide and limited technical information required to operate and protect the service.",
          ],

          bullets: [
            "Identity and contact details, including name, email address, phone number, and delivery address.",

            "Account credentials and activity. Passwords are stored as secure hashes rather than readable text.",

            "Order, product, size, payment-method, delivery, exchange, return, refund, and support information.",

            "Newsletter preference and consent records.",

            "Technical and security information such as IP-derived security identifiers, browser details, request logs, and fraud-prevention events.",
          ],
        }),

        createSection({
          id: "privacy-use",

          title:
            "3. How we use information",

          order: 3,

          bullets: [
            "Create and manage customer accounts.",

            "Validate, confirm, fulfil, deliver, track, exchange, return, refund, and support orders.",

            "Send essential service, security, and order communications.",

            "Prevent abuse, fraud, unauthorized access, inventory manipulation, and other security incidents.",

            "Maintain accounting, operational, audit, dispute, and legal records.",

            "Send marketing updates only where the customer has chosen to receive them.",

            "Improve products, accessibility, reliability, website performance, and customer experience.",
          ],
        }),

        createSection({
          id:
            "privacy-sharing",

          title:
            "4. When information is shared",

          order: 4,

          paragraphs: [
            "We do not sell customer information. We may share only the information reasonably required with providers that support hosting, databases, media storage, email, messaging, analytics, payment, delivery, fraud prevention, professional advice, and customer support.",

            "Information may also be disclosed where required by applicable law, a valid authority request, dispute resolution, or protection of customers, the business, or the public.",
          ],
        }),

        createSection({
          id:
            "privacy-retention",

          title: "5. Retention",
          order: 5,

          paragraphs: [
            "We retain information only for as long as reasonably needed for the purpose collected, order fulfilment, support, security, accounting, dispute handling, and applicable record-keeping obligations.",

            "When information is no longer required, we may delete, anonymize, or securely archive it subject to technical and legal constraints.",
          ],
        }),

        createSection({
          id: "privacy-security",
          title: "6. Security",
          order: 6,

          paragraphs: [
            "We use administrative and technical safeguards designed to reduce unauthorized access, alteration, disclosure, or loss. No online system can guarantee absolute security, so customers should use a unique password and protect account and order-verification details.",
          ],
        }),

        createSection({
          id: "privacy-choices",

          title:
            "7. Your choices and requests",

          order: 7,

          paragraphs: [
            "Subject to applicable requirements and legitimate retention needs, you may ask us to provide, correct, update, or delete personal information associated with you. We may need to verify identity first.",

            "Marketing messages can be stopped through the unsubscribe option provided with the message or by contacting us. Essential account, security, and order communications may still be sent where necessary.",
          ],
        }),

        createSection({
          id: "privacy-storage",

          title:
            "8. Cookies and browser storage",

          order: 8,

          paragraphs: [
            "The website may use cookies or browser storage for essential sessions, cart and wishlist functions, security, preferences, and performance. Blocking essential storage may prevent parts of the website from working correctly.",
            "We use advertising and analytics tools, including the Meta Pixel and Meta Conversions API (Facebook and Instagram) and Google Analytics, to measure visits, product views, cart activity, checkouts and purchases, and to show and improve our ads. These tools may use cookies and similar identifiers, and may receive technical information such as your IP address, browser details, the pages you visit and the products and order value involved.",
            "When an order is placed, we may share limited order information with Meta to measure our advertising. Contact details such as your phone number or email may be included only in hashed (one-way encrypted) form, and we never share your delivery address, order notes or payment details with advertising partners. Meta and Google process this information under their own privacy policies.",
            "You can limit this tracking by blocking or deleting cookies in your browser, using your Facebook and Instagram ad preferences, or using the Google Analytics opt-out browser add-on. Doing so will not prevent you from shopping on the website.",
          ],
        }),

        createSection({
          id: "privacy-children",
          title: "9. Children",
          order: 9,

          paragraphs: [
            "The website is not designed to knowingly collect information from children who cannot lawfully enter a purchase or account agreement. A parent or guardian should contact us if they believe a child provided information without appropriate permission.",
          ],
        }),

        createSection({
          id: "privacy-updates",

          title:
            "10. Policy updates",

          order: 10,

          paragraphs: [
            "We may update this policy when our services, providers, practices, or legal obligations change. The version and effective date shown on this page identify the current published policy.",
          ],
        }),
      ],

      relatedPolicies: [
        createRelatedPolicy({
          id: "privacy-terms",

          label:
            "Terms of Service",

          href: "/terms",
          order: 1,
        }),

        createRelatedPolicy({
          id: "privacy-sale",
          label: "Terms of Sale",
          href: "/terms-of-sale",
          order: 2,
        }),
      ],
    }),

    terms: createLegalPage({
      schemaVersion,
      key: "terms",
      title:
        "Terms of Service",

      description:
        "Read the terms governing use of the OBSIDIAN website, customer accounts, and digital services.",

      keywords:
        "OBSIDIAN terms, website terms Bangladesh, ecommerce terms",

      summary:
        "These terms govern access to the {{storeName}} website, account features, and related services. Product purchases are also governed by the Terms of Sale and the applicable delivery, exchange, return, and refund policies.",

      sections: [
        createSection({
          id: "terms-acceptance",
          title: "1. Acceptance",
          order: 1,

          paragraphs: [
            "By using the website or creating an account, you agree to these terms and the Privacy Policy. If you do not agree, do not use account or checkout services.",
          ],
        }),

        createSection({
          id: "terms-account",

          title:
            "2. Account responsibility",

          order: 2,

          paragraphs: [
            "You must provide accurate information, protect your password and verification details, and notify us promptly about suspected unauthorized use. You are responsible for activity carried out through your account unless applicable law provides otherwise.",
          ],
        }),

        createSection({
          id: "terms-use",
          title: "3. Acceptable use",
          order: 3,

          paragraphs: [
            "You may use the website only for lawful personal shopping, account, and support purposes.",
          ],

          bullets: [
            "Do not interfere with security, authentication, rate limits, inventory, pricing, checkout, or website availability.",

            "Do not use automated tools to scrape, overload, probe, or abuse the service without written permission.",

            "Do not submit false, misleading, fraudulent, infringing, harmful, or unlawful information.",

            "Do not impersonate another person or attempt to access another customer's account or order.",
          ],
        }),

        createSection({
          id: "terms-products",

          title:
            "4. Product and website information",

          order: 4,

          paragraphs: [
            "We aim to present products, colours, measurements, availability, and prices accurately. Screens, lighting, fabric variation, wash, and production tolerances can cause reasonable differences. An obvious error may be corrected before an order is accepted or fulfilled.",
          ],
        }),

        createSection({
          id: "terms-ip",

          title:
            "5. Intellectual property",

          order: 5,

          paragraphs: [
            "The website, brand assets, artwork, product presentation, copy, photography, graphics, and software are owned by or licensed to {{storeName}}. They may not be copied, commercially reused, or misrepresented without permission, except where applicable law allows.",
          ],
        }),

        createSection({
          id:
            "terms-third-party",

          title:
            "6. Third-party services",

          order: 6,

          paragraphs: [
            "The website may rely on or link to independent providers. Their services may be governed by separate terms and privacy practices. We are not responsible for an unrelated third-party website merely because it is linked from our service.",
          ],
        }),

        createSection({
          id:
            "terms-suspension",

          title:
            "7. Suspension or termination",

          order: 7,

          paragraphs: [
            "We may restrict or suspend access where reasonably necessary to protect customers, investigate abuse, comply with law, or secure the platform. Valid rights and obligations connected to pending or completed orders remain subject to the relevant policies and applicable law.",
          ],
        }),

        createSection({
          id: "terms-rights",

          title:
            "8. Responsibility and statutory rights",

          order: 8,

          paragraphs: [
            "Nothing in these terms excludes a consumer right or remedy that cannot lawfully be excluded. To the extent permitted by law, we are not responsible for indirect loss caused by events outside our reasonable control or unauthorized misuse of the website.",
          ],
        }),

        createSection({
          id: "terms-law",

          title:
            "9. Governing framework and disputes",

          order: 9,

          paragraphs: [
            "These terms are intended to operate under the laws applicable to {{storeName}} in Bangladesh. Please contact us first so we can try to resolve a concern directly. Nothing prevents a customer from using a remedy available under applicable law.",
          ],
        }),

        createSection({
          id: "terms-changes",
          title: "10. Changes",
          order: 10,

          paragraphs: [
            "We may update these terms for operational, security, service, or legal reasons. The version and effective date shown on this page identify the current terms. Material changes will apply prospectively unless a different approach is required by law.",
          ],
        }),
      ],

      relatedPolicies: [
        createRelatedPolicy({
          id: "terms-sale",
          label: "Terms of Sale",
          href: "/terms-of-sale",
          order: 1,
        }),

        createRelatedPolicy({
          id: "terms-privacy",
          label: "Privacy Policy",
          href: "/privacy",
          order: 2,
        }),
      ],
    }),

    "terms-of-sale":
      createLegalPage({
        schemaVersion,
        key: "terms-of-sale",
        title: "Terms of Sale",

        description:
          "Read the terms governing product orders placed with OBSIDIAN.",

        keywords:
          "OBSIDIAN terms of sale, online order terms Bangladesh, clothing purchase terms",

        summary:
          "These terms apply when you place an order with {{storeName}}. They should be read with the Delivery Policy, Exchange and Return Policy, Refund Policy, Privacy Policy, and Terms of Service.",

        sections: [
          createSection({
            id: "sale-order",

            title:
              "1. Placing an order",

            order: 1,

            paragraphs: [
              "Submitting checkout information is an offer to purchase. An order is accepted when {{storeName}} confirms it for fulfilment. We may contact you to verify customer, address, stock, payment, or delivery details before acceptance.",
            ],
          }),

          createSection({
            id: "sale-accuracy",

            title:
              "2. Customer information",

            order: 2,

            paragraphs: [
              "You must provide a complete name, reachable phone number, accurate delivery address, and other information reasonably required to fulfil the order. Delay caused by incorrect information may require a new delivery attempt or additional charge disclosed before re-dispatch.",
            ],
          }),

          createSection({
            id: "sale-price",

            title:
              "3. Price, discounts, and payment",

            order: 3,

            paragraphs: [
              "The server-confirmed checkout total controls the order. Prices, discounts, delivery charges, and available payment methods are shown before submission. Promotions may have eligibility, stock, date, usage, or customer limits.",

              "If an obvious pricing, discount, or technical error is identified, we may correct it and ask whether you wish to continue before fulfilment.",
            ],
          }),

          createSection({
            id: "sale-stock",

            title:
              "4. Stock and order limits",

            order: 4,

            paragraphs: [
              "Products remain subject to stock validation. We may apply reasonable quantity limits or decline orders linked to fraud, resale abuse, inventory manipulation, or service misuse. If stock becomes unavailable, we will contact you about cancellation, replacement, or another available resolution.",
            ],
          }),

          createSection({
            id: "sale-delivery",
            title: "5. Delivery",
            order: 5,

            paragraphs: [
              "Delivery estimates are not guaranteed deadlines unless expressly stated. Courier conditions, customer availability, address verification, weather, public disruption, and events outside reasonable control may affect timing.",
            ],
          }),

          createSection({
            id:
              "sale-inspection",

            title:
              "6. Inspection and product concerns",

            order: 6,

            paragraphs: [
              "Inspect the delivered package and product promptly. Contact us as soon as reasonably possible about a missing, incorrect, damaged, defective, or materially misdescribed item, and keep the product, tags, packaging, proof of purchase, and relevant photos while the issue is reviewed.",
            ],
          }),

          createSection({
            id: "sale-remedies",

            title:
              "7. Exchange, return, cancellation, and refund",

            order: 7,

            paragraphs: [
              "Eligibility, conditions, process, and timing are described in the Exchange and Return Policy and Refund Policy. Nothing in those policies limits a consumer right or remedy that cannot lawfully be limited.",
            ],
          }),

          createSection({
            id: "sale-risk",

            title:
              "8. Risk and ownership",

            order: 8,

            paragraphs: [
              "Responsibility for the product normally passes when it is delivered to the customer or an authorized recipient, subject to applicable law and any verified delivery dispute. Ownership passes when all payable amounts have been received.",
            ],
          }),

          createSection({
            id: "sale-rights",

            title:
              "9. Consumer rights",

            order: 9,

            paragraphs: [
              "These terms operate alongside applicable consumer-protection and digital-commerce requirements. Where a mandatory legal right provides greater protection, that right applies.",
            ],
          }),
        ],

        relatedPolicies: [
          createRelatedPolicy({
            id: "sale-delivery",
            label: "Delivery Policy",
            href: "/delivery-policy",
            order: 1,
          }),

          createRelatedPolicy({
            id: "sale-exchange",

            label:
              "Exchange & Return Policy",

            href:
              "/exchange-return-policy",

            order: 2,
          }),

          createRelatedPolicy({
            id: "sale-refund",
            label: "Refund Policy",
            href: "/refund-policy",
            order: 3,
          }),
        ],
      }),

    "delivery-policy":
      createLegalPage({
        schemaVersion,
        key: "delivery-policy",
        title: "Delivery Policy",

        description:
          "Learn how OBSIDIAN confirms, dispatches, and delivers orders across Bangladesh.",

        keywords:
          "OBSIDIAN delivery policy, clothing delivery Bangladesh, order delivery",

        summary:
          "This policy explains how {{storeName}} prepares and delivers orders. Delivery availability, charge, and estimate may vary by address and are confirmed during checkout or order confirmation.",

        sections: [
          createSection({
            id: "delivery-area",
            title: "1. Service area",
            order: 1,

            paragraphs: [
              "We deliver to supported addresses in Bangladesh through available courier or delivery partners. Some remote or restricted locations may require additional time, a different charge, or may not be serviceable.",
            ],
          }),

          createSection({
            id:
              "delivery-confirmation",

            title:
              "2. Order confirmation",

            order: 2,

            paragraphs: [
              "Orders may be reviewed and confirmed by phone, WhatsApp, email, or another available method before dispatch. Unverified, incomplete, abusive, duplicate, or suspicious orders may be held or cancelled after reasonable review.",
            ],
          }),

          createSection({
            id: "delivery-timing",

            title:
              "3. Dispatch and estimated timing",

            order: 3,

            paragraphs: [
              "Confirmed orders are usually delivered within 1–3 business days inside Dhaka and 3–5 business days outside Dhaka. Remote areas may take longer.",
              "The estimated delivery period shown at checkout, in order communication, or by support is an estimate rather than a guaranteed deadline unless expressly confirmed otherwise. Launches, holidays, severe weather, public disruption, or unusually high demand may cause delay.",
            ],
          }),

          createSection({
            id: "delivery-address",

            title:
              "4. Address and contact details",

            order: 4,

            paragraphs: [
              "Customers must provide an accurate address, area, landmark where useful, and a reachable phone number. Contact support promptly if a correction is needed. Address changes may not be possible after dispatch.",
            ],
          }),

          createSection({
            id:
              "delivery-attempts",

            title:
              "5. Delivery attempts",

            order: 5,

            paragraphs: [
              "The courier may contact the customer before delivery. If the customer cannot be reached, refuses delivery without an applicable reason, or provides an incorrect address, the order may be returned. Re-dispatch may require a new delivery charge disclosed in advance.",
            ],
          }),

          createSection({
            id:
              "delivery-receiving",

            title:
              "6. Receiving the package",

            order: 6,

            paragraphs: [
              "Check the package condition and recipient details before accepting it. If the package appears materially damaged, tampered with, or incorrect, document the condition and contact {{storeName}} promptly.",
            ],
          }),

          createSection({
            id: "delivery-dispute",

            title:
              "7. Delay, loss, or delivery dispute",

            order: 7,

            paragraphs: [
              "Contact us with the order ID if tracking does not update or delivery appears lost. We will review available courier and order records and provide an appropriate resolution under the applicable policies and law.",
            ],
          }),
        ],

        relatedPolicies: [
          createRelatedPolicy({
            id: "delivery-sale",
            label: "Terms of Sale",
            href: "/terms-of-sale",
            order: 1,
          }),

          createRelatedPolicy({
            id:
              "delivery-exchange",

            label:
              "Exchange & Return Policy",

            href:
              "/exchange-return-policy",

            order: 2,
          }),
        ],
      }),

    "exchange-return-policy":
      createLegalPage({
        schemaVersion,

        key:
          "exchange-return-policy",

        title:
          "Exchange & Return Policy",

        description:
          "Review OBSIDIAN exchange and return eligibility, conditions, and request process.",

        keywords:
          "OBSIDIAN exchange policy, return policy Bangladesh, clothing exchange",

        summary:
          "We want customers to receive the correct product in acceptable condition. This policy explains the standard request process. Mandatory consumer rights remain unaffected.",

        sections: [
          createSection({
            id: "exchange-window",

            title:
              "1. Standard request window",

            order: 1,

            paragraphs: [
              "For a standard size exchange or eligible change-of-mind return, contact us within 7 calendar days after recorded delivery. A longer period applies where required by applicable law or expressly offered for a specific order.",
            ],
          }),

          createSection({
            id:
              "exchange-condition",

            title:
              "2. Product condition",

            order: 2,

            paragraphs: [
              "Unless the issue is a verified defect, damage, wrong item, or material misdescription, the product must be unused, unworn except for a careful fit check, unwashed, unaltered, free from scent or marks, and returned with original tags and packaging.",
            ],
          }),

          createSection({
            id:
              "exchange-evidence",

            title:
              "3. What to provide",

            order: 3,

            paragraphs: [
              "Provide the order ID, customer phone number, reason for the request, requested size or resolution, and clear photos where the product is incorrect, damaged, defective, or materially different from the listing.",
            ],
          }),

          createSection({
            id: "exchange-defect",

            title:
              "4. Wrong, damaged, or defective items",

            order: 4,

            paragraphs: [
              "Report a wrong, damaged, defective, or materially misdescribed item as soon as reasonably possible, preferably within 48 hours of delivery, so courier and fulfilment evidence can be preserved. This preferred period does not remove a right that cannot lawfully be removed.",
            ],
          }),

          createSection({
            id:
              "exchange-exclusions",

            title:
              "5. Requests that may be declined",

            order: 5,

            paragraphs: [
              "A request may be declined after review where the item shows use beyond a reasonable fit check, washing, alteration, customer-caused damage, missing tags, contamination, or another condition that prevents resale, unless the request concerns a mandatory right related to defect, safety, authenticity, or material misdescription.",
            ],
          }),

          createSection({
            id: "exchange-cost",

            title:
              "6. Delivery charges",

            order: 6,

            paragraphs: [
              "For a customer-requested size exchange or change of mind, the customer may be responsible for return and re-delivery charges disclosed before processing. Where {{storeName}} confirms a wrong, damaged, defective, or materially misdescribed item, reasonable remedy delivery will be arranged without an avoidable customer charge.",
            ],
          }),

          createSection({
            id:
              "exchange-process",

            title:
              "7. Review and resolution",

            order: 7,

            paragraphs: [
              "Do not send a product without return instructions. After receipt and inspection, we will confirm whether the approved resolution is exchange, replacement, store credit where agreed, repair where appropriate, or refund under the Refund Policy.",
            ],
          }),
        ],

        relatedPolicies: [
          createRelatedPolicy({
            id: "exchange-refund",
            label: "Refund Policy",
            href: "/refund-policy",
            order: 1,
          }),

          createRelatedPolicy({
            id:
              "exchange-delivery",

            label: "Delivery Policy",
            href: "/delivery-policy",
            order: 2,
          }),
        ],
      }),

    "refund-policy":
      createLegalPage({
        schemaVersion,
        key: "refund-policy",
        title: "Refund Policy",

        description:
          "Learn when an OBSIDIAN refund may apply and how approved refunds are processed.",

        keywords:
          "OBSIDIAN refund policy, ecommerce refund Bangladesh, clothing refund",

        summary:
          "Refund eligibility depends on the order status, payment method, product condition, reason for the request, and applicable consumer rights.",

        sections: [
          createSection({
            id:
              "refund-eligibility",

            title:
              "1. When a refund may apply",

            order: 1,

            paragraphs: [
              "A refund may apply where an accepted prepaid order is cancelled before fulfilment, a paid product cannot be supplied, an approved return qualifies for refund, or another refund remedy is required by applicable law.",
            ],
          }),

          createSection({
            id: "refund-review",

            title:
              "2. Review before approval",

            order: 2,

            paragraphs: [
              "We may verify order, payment, delivery, communication, product condition, and return evidence before approval. A refund request is not approved merely because a product was sent back without authorization.",
            ],
          }),

          createSection({
            id: "refund-method",
            title: "3. Refund method",
            order: 3,

            paragraphs: [
              "Approved prepaid refunds are normally returned through the original payment method where available. For cash-on-delivery or where the original method cannot receive funds, we may request a verified bank or mobile-financial-service account belonging to the customer or an authorized recipient.",
            ],
          }),

          createSection({
            id: "refund-timing",

            title:
              "4. Processing time",

            order: 4,

            paragraphs: [
              "After approval and receipt of required verified payment details, {{storeName}} aims to initiate the refund within 7 business days. Banks, payment providers, holidays, identity checks, or technical issues may require additional time before the funds appear.",
            ],
          }),

          createSection({
            id: "refund-charges",

            title:
              "5. Delivery and service charges",

            order: 5,

            paragraphs: [
              "Original or return delivery charges may be non-refundable for a customer-requested size exchange, refusal, failed delivery, or change of mind, where permitted and disclosed. Where {{storeName}} confirms a wrong, damaged, defective, or materially misdescribed product, reasonable remedy costs will not be unfairly deducted.",
            ],
          }),

          createSection({
            id:
              "refund-confirmation",

            title:
              "6. Refund confirmation",

            order: 6,

            paragraphs: [
              "We will record an approved refund against the order and communicate available reference information. Contact us with the order ID if an approved refund does not arrive after the stated processing period and the provider's normal settlement time.",
            ],
          }),

          createSection({
            id: "refund-rights",

            title:
              "7. Mandatory rights",

            order: 7,

            paragraphs: [
              "Nothing in this policy limits a refund or other remedy that must be provided under applicable law.",
            ],
          }),
        ],

        relatedPolicies: [
          createRelatedPolicy({
            id: "refund-exchange",

            label:
              "Exchange & Return Policy",

            href:
              "/exchange-return-policy",

            order: 1,
          }),

          createRelatedPolicy({
            id: "refund-sale",
            label: "Terms of Sale",
            href: "/terms-of-sale",
            order: 2,
          }),
        ],
      }),
  };
}
