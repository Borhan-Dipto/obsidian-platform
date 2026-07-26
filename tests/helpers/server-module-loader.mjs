import {
  access,
  readFile,
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath,
  pathToFileURL,
} from "node:url";

const currentDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const projectRoot =
  path.resolve(
    currentDirectory,
    "../.."
  );

const sourceRoot =
  path.join(
    projectRoot,
    "src"
  );

const serverOnlyUrl =
  "data:text/javascript,obsidian-server-only";

const mongoStubUrl =
  "data:text/javascript,obsidian-mongodb-stub";

async function fileExists(
  filePath
) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveProjectFile(
  basePath
) {
  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.ts`,
    `${basePath}.tsx`,

    path.join(
      basePath,
      "index.js"
    ),

    path.join(
      basePath,
      "index.ts"
    ),
  ];

  for (
    const candidate
    of candidates
  ) {
    if (
      await fileExists(
        candidate
      )
    ) {
      return pathToFileURL(
        candidate
      ).href;
    }
  }

  return "";
}

function isMongoModuleRequest(
  specifier,
  parentURL
) {
  if (
    !parentURL?.startsWith(
      "file:"
    )
  ) {
    return false;
  }

  const parentPath =
    fileURLToPath(
      parentURL
    );

  if (
    !parentPath.startsWith(
      `${sourceRoot}${path.sep}`
    )
  ) {
    return false;
  }

  return (
    specifier ===
      "./mongodb" ||
    specifier ===
      "./mongodb.ts" ||
    specifier ===
      "@/lib/mongodb"
  );
}

export async function resolve(
  specifier,
  context,
  nextResolve
) {
  if (
    specifier ===
    "server-only"
  ) {
    return {
      url:
        serverOnlyUrl,

      shortCircuit:
        true,
    };
  }

  if (
    isMongoModuleRequest(
      specifier,
      context.parentURL
    )
  ) {
    return {
      url:
        mongoStubUrl,

      shortCircuit:
        true,
    };
  }

  if (
    specifier.startsWith(
      "@/"
    )
  ) {
    const resolvedUrl =
      await resolveProjectFile(
        path.join(
          sourceRoot,
          specifier.slice(2)
        )
      );

    if (resolvedUrl) {
      return {
        url:
          resolvedUrl,

        shortCircuit:
          true,
      };
    }
  }

  if (
    specifier.startsWith(
      "."
    ) &&
    context.parentURL?.startsWith(
      "file:"
    )
  ) {
    const parentPath =
      fileURLToPath(
        context.parentURL
      );

    const resolvedUrl =
      await resolveProjectFile(
        path.resolve(
          path.dirname(
            parentPath
          ),
          specifier
        )
      );

    if (resolvedUrl) {
      return {
        url:
          resolvedUrl,

        shortCircuit:
          true,
      };
    }
  }

  return nextResolve(
    specifier,
    context
  );
}

export async function load(
  url,
  context,
  nextLoad
) {
  if (
    url === serverOnlyUrl
  ) {
    return {
      format:
        "module",

      source:
        "export {};",

      shortCircuit:
        true,
    };
  }

  if (
    url === mongoStubUrl
  ) {
    return {
      format:
        "module",

      source: `
        const clientPromise =
          Promise.resolve(null);

        export default clientPromise;

        export const
          MONGODB_DATABASE_NAME =
            "obsidian_test";

        export async function
          getMongoClient() {
            return null;
          }

        export async function
          getMongoDatabase() {
            return null;
          }
      `,

      shortCircuit:
        true,
    };
  }

  if (
    url.startsWith(
      pathToFileURL(
        sourceRoot
      ).href
    ) &&
    /\.(?:js|mjs|ts)$/.test(
      fileURLToPath(url)
    )
  ) {
    return {
      format:
        "module",

      source:
        await readFile(
          fileURLToPath(url),
          "utf8"
        ),

      shortCircuit:
        true,
    };
  }

  return nextLoad(
    url,
    context
  );
}
