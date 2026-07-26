import {
  execFileSync,
} from "node:child_process";
import {
  readFileSync,
} from "node:fs";
import path from "node:path";

const allowedTextExtensions =
  new Set([
    ".cjs",
    ".css",
    ".graphql",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".scss",
    ".sh",
    ".sql",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
  ]);

const secretPatterns = [
  {
    label:
      "private key",

    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },

  {
    label:
      "GitHub access token",

    pattern:
      /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  },

  {
    label:
      "AWS access key",

    pattern:
      /\bAKIA[0-9A-Z]{16}\b/,
  },

  {
    label:
      "Google API key",

    pattern:
      /\bAIza[0-9A-Za-z_-]{35}\b/,
  },

  {
    label:
      "Stripe live secret",

    pattern:
      /\bsk_live_[0-9A-Za-z]{20,}\b/,
  },
];

function getTrackedFiles() {
  const output =
    execFileSync(
      "git",
      [
        "ls-files",
        "-z",
      ],
      {
        encoding:
          "utf8",
      }
    );

  return output
    .split("\0")
    .filter(Boolean);
}

function isForbiddenEnvironmentFile(
  filePath
) {
  const fileName =
    path.basename(
      filePath
    );

  if (
    !fileName.startsWith(
      ".env"
    )
  ) {
    return false;
  }

  return !(
    fileName.includes(
      ".example"
    ) ||
    fileName.includes(
      ".sample"
    ) ||
    fileName.includes(
      ".template"
    )
  );
}

function isScannableTextFile(
  filePath
) {
  const extension =
    path.extname(
      filePath
    ).toLowerCase();

  return (
    allowedTextExtensions.has(
      extension
    ) ||
    path.basename(
      filePath
    ).startsWith(
      ".env"
    )
  );
}

const findings = [];

for (
  const filePath
  of getTrackedFiles()
) {
  if (
    isForbiddenEnvironmentFile(
      filePath
    )
  ) {
    findings.push(
      `${filePath}: tracked environment file`
    );

    continue;
  }

  if (
    !isScannableTextFile(
      filePath
    )
  ) {
    continue;
  }

  let content;

  try {
    content =
      readFileSync(
        filePath,
        "utf8"
      );
  } catch {
    continue;
  }

  for (
    const secretPattern
    of secretPatterns
  ) {
    if (
      secretPattern.pattern.test(
        content
      )
    ) {
      findings.push(
        `${filePath}: possible ${secretPattern.label}`
      );
    }
  }
}

if (findings.length > 0) {
  console.error(
    "Committed-secret scan failed:"
  );

  for (
    const finding
    of findings
  ) {
    console.error(
      `- ${finding}`
    );
  }

  process.exitCode = 1;
} else {
  console.log(
    "Committed-secret scan passed."
  );
}
