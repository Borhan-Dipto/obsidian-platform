import {
  Db,
  MongoClient,
  type MongoClientOptions,
} from "mongodb";

const configuredMongoUri =
  process.env.MONGODB_URI;

if (!configuredMongoUri) {
  throw new Error(
    "Please add MONGODB_URI to .env.local"
  );
}

const mongoUri: string =
  configuredMongoUri;

const databaseName =
  process.env.MONGODB_DB ||
  "obsidian";

const options: MongoClientOptions = {};

declare global {
  var _mongoClientPromise:
    | Promise<MongoClient>
    | undefined;
}

function createMongoClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(
    mongoUri,
    options
  );

  return client.connect();
}

const clientPromise: Promise<MongoClient> =
  process.env.NODE_ENV ===
  "development"
    ? global._mongoClientPromise ||
      (global._mongoClientPromise =
        createMongoClientPromise())
    : createMongoClientPromise();

async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

async function getMongoDatabase(): Promise<Db> {
  const client =
    await getMongoClient();

  return client.db(
    databaseName
  );
}

export {
  databaseName as MONGODB_DATABASE_NAME,
  getMongoClient,
  getMongoDatabase,
};

export default clientPromise;