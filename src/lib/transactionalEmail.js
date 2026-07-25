import "server-only";

export const TRANSACTIONAL_EMAIL_PROVIDER =
  "resend";

const RESEND_EMAIL_ENDPOINT =
  "https://api.resend.com/emails";

const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_RECIPIENTS = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 500;
const MAX_FROM_LENGTH = 500;
const MAX_PROVIDER_MESSAGE_LENGTH = 1000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 256;

function normalizeText(
  value,
  maximumLength = 5000
) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
}

function normalizeEmail(value) {
  return normalizeText(
    value,
    MAX_EMAIL_LENGTH
  ).toLowerCase();
}

function normalizeRecipients(value) {
  const candidates =
    Array.isArray(value)
      ? value
      : [value];

  return Array.from(
    new Set(
      candidates
        .map((recipient) =>
          normalizeEmail(recipient)
        )
        .filter(Boolean)
    )
  ).slice(0, MAX_RECIPIENTS);
}

function readProviderConfig() {
  const apiKey =
    normalizeText(
      process.env.RESEND_API_KEY,
      1000
    );

  const from =
    normalizeText(
      process.env
        .NOTIFICATION_EMAIL_FROM,
      MAX_FROM_LENGTH
    );

  return {
    apiKey,
    from,

    configured:
      Boolean(
        apiKey && from
      ),
  };
}

export function getTransactionalEmailProviderStatus() {
  const providerConfig =
    readProviderConfig();

  return {
    provider:
      TRANSACTIONAL_EMAIL_PROVIDER,

    configured:
      providerConfig.configured,
  };
}

function createEmailError(
  message,
  {
    code =
      "TRANSACTIONAL_EMAIL_ERROR",
    status = null,
    provider =
      TRANSACTIONAL_EMAIL_PROVIDER,
  } = {}
) {
  const error = new Error(
    normalizeText(
      message,
      MAX_PROVIDER_MESSAGE_LENGTH
    ) ||
      "Transactional email delivery failed."
  );

  error.code = code;
  error.provider = provider;
  error.status = status;

  return error;
}

async function readProviderResponse(
  response
) {
  const responseText =
    await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(
      responseText
    );
  } catch {
    return {
      message:
        normalizeText(
          responseText,
          MAX_PROVIDER_MESSAGE_LENGTH
        ),
    };
  }
}

function getProviderErrorMessage(
  responseData,
  responseStatus
) {
  return (
    normalizeText(
      responseData?.message ||
        responseData?.error
          ?.message ||
        responseData?.error ||
        responseData?.detail,
      MAX_PROVIDER_MESSAGE_LENGTH
    ) ||
    `Resend request failed with status ${responseStatus}.`
  );
}

function validateEmailContent({
  recipients,
  subject,
  html,
  text,
}) {
  if (recipients.length === 0) {
    throw createEmailError(
      "At least one email recipient is required.",
      {
        code:
          "TRANSACTIONAL_EMAIL_RECIPIENT_REQUIRED",
      }
    );
  }

  if (!subject) {
    throw createEmailError(
      "An email subject is required.",
      {
        code:
          "TRANSACTIONAL_EMAIL_SUBJECT_REQUIRED",
      }
    );
  }

  if (!html && !text) {
    throw createEmailError(
      "Transactional email content is required.",
      {
        code:
          "TRANSACTIONAL_EMAIL_CONTENT_REQUIRED",
      }
    );
  }
}

export async function sendTransactionalEmail({
  to,
  subject,
  html = "",
  text = "",
  replyTo = "",
  idempotencyKey = "",
}) {
  const recipients =
    normalizeRecipients(to);

  const normalizedSubject =
    normalizeText(
      subject,
      MAX_SUBJECT_LENGTH
    );

  const normalizedHtml =
    String(html ?? "");

  const normalizedTextBody =
    String(text ?? "");

  const normalizedReplyTo =
    normalizeEmail(replyTo);

  const normalizedIdempotencyKey =
    normalizeText(
      idempotencyKey,
      MAX_IDEMPOTENCY_KEY_LENGTH
    );

  validateEmailContent({
    recipients,
    subject:
      normalizedSubject,
    html: normalizedHtml,
    text: normalizedTextBody,
  });

  const providerConfig =
    readProviderConfig();

  if (
    !providerConfig.configured
  ) {
    throw createEmailError(
      "Resend email provider is not configured.",
      {
        code:
          "TRANSACTIONAL_EMAIL_PROVIDER_NOT_CONFIGURED",
      }
    );
  }

  const requestBody = {
    from: providerConfig.from,
    to: recipients,
    subject:
      normalizedSubject,
  };

  if (normalizedHtml) {
    requestBody.html =
      normalizedHtml;
  }

  if (normalizedTextBody) {
    requestBody.text =
      normalizedTextBody;
  }

  if (normalizedReplyTo) {
    requestBody.reply_to =
      normalizedReplyTo;
  }

  const headers = {
    Authorization:
      `Bearer ${providerConfig.apiKey}`,

    "Content-Type":
      "application/json",
  };

  if (
    normalizedIdempotencyKey
  ) {
    headers["Idempotency-Key"] =
      normalizedIdempotencyKey;
  }

  let response;

  try {
    response = await fetch(
      RESEND_EMAIL_ENDPOINT,
      {
        method: "POST",
        headers,

        body:
          JSON.stringify(
            requestBody
          ),

        signal:
          AbortSignal.timeout(
            PROVIDER_TIMEOUT_MS
          ),

        cache: "no-store",
      }
    );
  } catch (error) {
    if (
      error?.name ===
      "TimeoutError"
    ) {
      throw createEmailError(
        "Resend email provider request timed out.",
        {
          code:
            "TRANSACTIONAL_EMAIL_PROVIDER_TIMEOUT",
        }
      );
    }

    throw createEmailError(
      error?.message ||
        "Resend email provider request failed.",
      {
        code:
          "TRANSACTIONAL_EMAIL_PROVIDER_REQUEST_FAILED",
      }
    );
  }

  const data =
    await readProviderResponse(
      response
    );

  if (!response.ok) {
    throw createEmailError(
      getProviderErrorMessage(
        data,
        response.status
      ),
      {
        code:
          "TRANSACTIONAL_EMAIL_PROVIDER_REJECTED",

        status:
          response.status,
      }
    );
  }

  return {
    provider:
      TRANSACTIONAL_EMAIL_PROVIDER,

    providerMessageId:
      normalizeText(
        data?.id,
        500
      ),

    responseStatus:
      response.status,
  };
}