import {
  createHash,
} from "node:crypto";

import {
  getMultipleCmsContent,
} from "./getCmsContent";

const LEGAL_CONSENT_SCHEMA_VERSION =
  1;

const CONSENT_GROUPS = {
  accountRegistration: [
    "terms",
    "privacy",
  ],

  checkout: [
    "terms-of-sale",
    "delivery-policy",
    "exchange-return-policy",
    "refund-policy",
    "privacy",
  ],

  newsletter: [
    "privacy",
  ],
};

export class LegalConsentError extends Error {
  constructor(
    message,
    {
      status = 503,
      code =
        "LEGAL_POLICY_UNAVAILABLE",
      details = {},
    } = {}
  ) {
    super(message);

    this.name =
      "LegalConsentError";

    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeText(
  value,
  maximumLength = 2000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function normalizeDateValue(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toISOString();
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(
      sortObjectKeys
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.keys(value)
      .sort()
      .reduce(
        (
          result,
          key
        ) => {
          const nestedValue =
            value[key];

          if (
            nestedValue !==
            undefined
          ) {
            result[key] =
              sortObjectKeys(
                nestedValue
              );
          }

          return result;
        },
        {}
      );
  }

  return value;
}

function createDigest(value) {
  const canonicalValue =
    JSON.stringify(
      sortObjectKeys(value)
    );

  return createHash(
    "sha256"
  )
    .update(
      canonicalValue,
      "utf8"
    )
    .digest("hex");
}

function normalizePolicyKey(value) {
  return normalizeText(
    value,
    120
  ).toLowerCase();
}

function getConsentPolicyKeys(group) {
  const normalizedGroup =
    normalizeText(
      group,
      120
    );

  const policyKeys =
    CONSENT_GROUPS[
      normalizedGroup
    ];

  if (
    !Array.isArray(
      policyKeys
    )
  ) {
    throw new LegalConsentError(
      "Legal consent group is invalid.",
      {
        status: 500,

        code:
          "INVALID_LEGAL_CONSENT_GROUP",
      }
    );
  }

  return {
    group:
      normalizedGroup,

    policyKeys:
      [...policyKeys],
  };
}

function createPolicyDigestInput(
  policy,
  key
) {
  return {
    key,

    schemaVersion:
      Number(
        policy.schemaVersion
      ) || 1,

    status:
      normalizeText(
        policy.status,
        40
      ).toLowerCase(),

    title:
      normalizeText(
        policy.title,
        500
      ),

    version:
      normalizeText(
        policy.version,
        200
      ),

    effectiveDate:
      normalizeDateValue(
        policy.effectiveDate
      ),

    lastReviewedAt:
      normalizeDateValue(
        policy.lastReviewedAt
      ),

    canonical:
      normalizeText(
        policy.seo
          ?.canonical,
        1000
      ),

    content:
      policy.content &&
      typeof policy.content ===
        "object"
        ? policy.content
        : {},
  };
}

function createPolicyRecord(
  policy,
  key
) {
  if (
    !policy ||
    typeof policy !==
      "object"
  ) {
    throw new LegalConsentError(
      `Required legal policy "${key}" is unavailable.`,
      {
        details: {
          policyKey: key,
        },
      }
    );
  }

  const status =
    normalizeText(
      policy.status,
      40
    ).toLowerCase();

  const version =
    normalizeText(
      policy.version,
      200
    );

  if (
    status !==
      "published" ||
    !version
  ) {
    throw new LegalConsentError(
      `Required legal policy "${key}" is not published with a valid version.`,
      {
        details: {
          policyKey: key,
          status,
        },
      }
    );
  }

  const digestInput =
    createPolicyDigestInput(
      policy,
      key
    );

  return {
    key,

    title:
      digestInput.title,

    version:
      digestInput.version,

    effectiveDate:
      digestInput
        .effectiveDate,

    lastReviewedAt:
      digestInput
        .lastReviewedAt,

    canonical:
      digestInput.canonical ||
      `/${key}`,

    digestAlgorithm:
      "sha256",

    digest:
      createDigest(
        digestInput
      ),
  };
}

export async function createLegalConsentRecord({
  group,
  purpose,
  source,
  acceptedAt = new Date(),
}) {
  const {
    group:
      normalizedGroup,

    policyKeys,
  } =
    getConsentPolicyKeys(
      group
    );

  const normalizedPurpose =
    normalizeText(
      purpose,
      240
    );

  const normalizedSource =
    normalizeText(
      source,
      240
    );

  if (
    !normalizedPurpose ||
    !normalizedSource
  ) {
    throw new LegalConsentError(
      "Legal consent purpose and source are required.",
      {
        status: 500,

        code:
          "INVALID_LEGAL_CONSENT_CONTEXT",
      }
    );
  }

  const acceptedDate =
    new Date(
      acceptedAt
    );

  if (
    Number.isNaN(
      acceptedDate.getTime()
    )
  ) {
    throw new LegalConsentError(
      "Legal consent timestamp is invalid.",
      {
        status: 500,

        code:
          "INVALID_LEGAL_CONSENT_TIMESTAMP",
      }
    );
  }

  const policies =
    await getMultipleCmsContent(
      policyKeys
    );

  const policyRecords =
    policyKeys.map(
      (policyKey) => {
        const normalizedKey =
          normalizePolicyKey(
            policyKey
          );

        return createPolicyRecord(
          policies[
            normalizedKey
          ],
          normalizedKey
        );
      }
    );

  const bundleDigestInput = {
    schemaVersion:
      LEGAL_CONSENT_SCHEMA_VERSION,

    group:
      normalizedGroup,

    purpose:
      normalizedPurpose,

    source:
      normalizedSource,

    policies:
      policyRecords.map(
        (policy) => ({
          key:
            policy.key,

          version:
            policy.version,

          digest:
            policy.digest,
        })
      ),
  };

  return {
    schemaVersion:
      LEGAL_CONSENT_SCHEMA_VERSION,

    group:
      normalizedGroup,

    purpose:
      normalizedPurpose,

    source:
      normalizedSource,

    acceptedAt:
      acceptedDate,

    digestAlgorithm:
      "sha256",

    bundleDigest:
      createDigest(
        bundleDigestInput
      ),

    policies:
      policyRecords,
  };
}

export const LEGAL_CONSENT_GROUPS =
  Object.freeze({
    ...CONSENT_GROUPS,
  });
