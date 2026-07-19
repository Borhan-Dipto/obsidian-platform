import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCustomerSession } from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATABASE_FALLBACK_NAME = "obsidian";
const CUSTOMERS_COLLECTION_NAME = "customers";

const MAX_ADDRESSES = 10;
const MAX_LABEL_LENGTH = 30;
const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 30;
const MAX_ADDRESS_LINE_LENGTH = 160;
const MAX_AREA_LENGTH = 80;
const MAX_CITY_LENGTH = 80;
const MAX_STATE_LENGTH = 80;
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_COUNTRY_LENGTH = 80;
const MAX_INSTRUCTIONS_LENGTH = 300;

const ALLOWED_ADDRESS_TYPES = [
  "home",
  "office",
  "other",
];

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeSpaces(value) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function limitText(value, maximumLength) {
  return normalizeSpaces(value).slice(
    0,
    maximumLength
  );
}

function normalizeAddressType(value) {
  const normalizedValue = normalizeText(
    value
  ).toLowerCase();

  if (
    ALLOWED_ADDRESS_TYPES.includes(
      normalizedValue
    )
  ) {
    return normalizedValue;
  }

  return "home";
}

function normalizeBoolean(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function normalizeAddressInput(value = {}) {
  const addressType =
    normalizeAddressType(
      value.addressType ||
        value.type ||
        value.labelType
    );

  const fallbackLabel =
    addressType === "office"
      ? "Office"
      : addressType === "other"
        ? "Other"
        : "Home";

  return {
    label:
      limitText(
        value.label,
        MAX_LABEL_LENGTH
      ) || fallbackLabel,

    addressType,

    fullName: limitText(
      value.fullName ||
        value.recipientName ||
        value.name,
      MAX_NAME_LENGTH
    ),

    phone: limitText(
      value.phone ||
        value.phoneNumber ||
        value.mobile,
      MAX_PHONE_LENGTH
    ),

    addressLine1: limitText(
      value.addressLine1 ||
        value.address ||
        value.streetAddress,
      MAX_ADDRESS_LINE_LENGTH
    ),

    addressLine2: limitText(
      value.addressLine2 ||
        value.apartment ||
        value.unit,
      MAX_ADDRESS_LINE_LENGTH
    ),

    area: limitText(
      value.area ||
        value.suburb ||
        value.locality,
      MAX_AREA_LENGTH
    ),

    city: limitText(
      value.city ||
        value.district,
      MAX_CITY_LENGTH
    ),

    state: limitText(
      value.state ||
        value.division ||
        value.region,
      MAX_STATE_LENGTH
    ),

    postalCode: limitText(
      value.postalCode ||
        value.postcode ||
        value.zipCode ||
        value.zip,
      MAX_POSTAL_CODE_LENGTH
    ),

    country:
      limitText(
        value.country,
        MAX_COUNTRY_LENGTH
      ) || "Bangladesh",

    deliveryInstructions: limitText(
      value.deliveryInstructions ||
        value.instructions ||
        value.note,
      MAX_INSTRUCTIONS_LENGTH
    ),

    isDefault: normalizeBoolean(
      value.isDefault
    ),
  };
}

function createCustomerQuery(customerId) {
  const normalizedCustomerId =
    normalizeText(customerId);

  if (!normalizedCustomerId) {
    return {
      _id: null,
    };
  }

  const queryOptions = [
    {
      customerId: normalizedCustomerId,
    },
  ];

  if (
    ObjectId.isValid(
      normalizedCustomerId
    )
  ) {
    queryOptions.unshift({
      _id: new ObjectId(
        normalizedCustomerId
      ),
    });
  }

  return {
    $or: queryOptions,
  };
}

function createResponse(
  data,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function createErrorResponse(
  message,
  status,
  field = null
) {
  return createResponse(
    {
      success: false,
      message,
      field,
    },
    status
  );
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null;
  }

  return parsedDate.toISOString();
}

function serializeAddress(address) {
  if (!address) {
    return null;
  }

  return {
    id: normalizeText(
      address.id ||
        address.addressId ||
        address._id
    ),

    label: limitText(
      address.label,
      MAX_LABEL_LENGTH
    ),

    addressType:
      normalizeAddressType(
        address.addressType ||
          address.type
      ),

    fullName: limitText(
      address.fullName ||
        address.recipientName ||
        address.name,
      MAX_NAME_LENGTH
    ),

    phone: limitText(
      address.phone ||
        address.phoneNumber ||
        address.mobile,
      MAX_PHONE_LENGTH
    ),

    addressLine1: limitText(
      address.addressLine1 ||
        address.address ||
        address.streetAddress,
      MAX_ADDRESS_LINE_LENGTH
    ),

    addressLine2: limitText(
      address.addressLine2 ||
        address.apartment ||
        address.unit,
      MAX_ADDRESS_LINE_LENGTH
    ),

    area: limitText(
      address.area ||
        address.suburb ||
        address.locality,
      MAX_AREA_LENGTH
    ),

    city: limitText(
      address.city ||
        address.district,
      MAX_CITY_LENGTH
    ),

    state: limitText(
      address.state ||
        address.division ||
        address.region,
      MAX_STATE_LENGTH
    ),

    postalCode: limitText(
      address.postalCode ||
        address.postcode ||
        address.zipCode ||
        address.zip,
      MAX_POSTAL_CODE_LENGTH
    ),

    country:
      limitText(
        address.country,
        MAX_COUNTRY_LENGTH
      ) || "Bangladesh",

    deliveryInstructions:
      limitText(
        address.deliveryInstructions ||
          address.instructions ||
          address.note,
        MAX_INSTRUCTIONS_LENGTH
      ),

    isDefault: Boolean(
      address.isDefault
    ),

    createdAt: serializeDate(
      address.createdAt
    ),

    updatedAt: serializeDate(
      address.updatedAt
    ),
  };
}

function serializeAddresses(
  addresses
) {
  if (!Array.isArray(addresses)) {
    return [];
  }

  return addresses
    .map(serializeAddress)
    .filter(Boolean)
    .sort((firstAddress, secondAddress) => {
      if (
        firstAddress.isDefault &&
        !secondAddress.isDefault
      ) {
        return -1;
      }

      if (
        !firstAddress.isDefault &&
        secondAddress.isDefault
      ) {
        return 1;
      }

      const firstCreatedAt =
        new Date(
          firstAddress.createdAt || 0
        ).getTime();

      const secondCreatedAt =
        new Date(
          secondAddress.createdAt || 0
        ).getTime();

      return (
        secondCreatedAt -
        firstCreatedAt
      );
    });
}


async function getCustomersCollection() {
  const client = await clientPromise;

  if (
    !client ||
    typeof client.db !== "function"
  ) {
    throw new TypeError(
      "MongoDB connection did not return a valid MongoClient."
    );
  }

  const databaseName =
    normalizeText(process.env.MONGODB_DB) ||
    DATABASE_FALLBACK_NAME;

  return client
    .db(databaseName)
    .collection(
      CUSTOMERS_COLLECTION_NAME
    );
}

async function getAuthenticatedCustomer() {
  const session =
    await getCustomerSession();

  if (!session?.customerId) {
    return {
      session: null,
      customer: null,
      collection: null,
    };
  }

  const collection =
    await getCustomersCollection();

  const customer =
    await collection.findOne(
      createCustomerQuery(
        session.customerId
      )
    );

  return {
    session,
    customer,
    collection,
  };
}

function isBlockedCustomer(customer) {
  const status = normalizeText(
    customer?.status ||
      customer?.accountStatus ||
      "active"
  ).toLowerCase();

  return [
    "disabled",
    "suspended",
    "blocked",
    "deleted",
    "inactive",
  ].includes(status);
}

function getCustomerAddresses(customer) {
  if (
    Array.isArray(customer?.addresses)
  ) {
    return customer.addresses;
  }

  if (
    Array.isArray(
      customer?.addressBook
    )
  ) {
    return customer.addressBook;
  }

  return [];
}

function createAddressId() {
  return new ObjectId().toHexString();
}

function normalizeComparableText(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ");
}

function createAddressFingerprint(
  address
) {
  return [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map(normalizeComparableText)
    .join("|");
}

function isDuplicateAddress(
  addresses,
  newAddress
) {
  const newFingerprint =
    createAddressFingerprint(
      newAddress
    );

  return addresses.some(
    (existingAddress) =>
      createAddressFingerprint(
        normalizeAddressInput(
          existingAddress
        )
      ) === newFingerprint
  );
}

function validateAddress(address) {
  if (!address.fullName) {
    return {
      isValid: false,
      field: "fullName",
      message:
        "Please enter the recipient's full name.",
    };
  }

  if (address.fullName.length < 2) {
    return {
      isValid: false,
      field: "fullName",
      message:
        "Please enter a valid full name.",
    };
  }

  if (!address.phone) {
    return {
      isValid: false,
      field: "phone",
      message:
        "Please enter a phone number.",
    };
  }

  if (address.phone.length < 6) {
    return {
      isValid: false,
      field: "phone",
      message:
        "Please enter a valid phone number.",
    };
  }

  if (!address.addressLine1) {
    return {
      isValid: false,
      field: "addressLine1",
      message:
        "Please enter the street address.",
    };
  }

  if (
    address.addressLine1.length < 3
  ) {
    return {
      isValid: false,
      field: "addressLine1",
      message:
        "Please enter a valid street address.",
    };
  }

  if (!address.city) {
    return {
      isValid: false,
      field: "city",
      message:
        "Please enter the city or district.",
    };
  }

  if (!address.country) {
    return {
      isValid: false,
      field: "country",
      message:
        "Please enter the country.",
    };
  }

  return {
    isValid: true,
    field: null,
    message: "",
  };
}

function ensureSingleDefaultAddress(
  addresses
) {
  if (!Array.isArray(addresses)) {
    return [];
  }

  if (addresses.length === 0) {
    return [];
  }

  let defaultFound = false;

  const normalizedAddresses =
    addresses.map((address) => {
      const normalizedAddress = {
        ...address,
        isDefault: Boolean(
          address?.isDefault
        ),
      };

      if (
        normalizedAddress.isDefault &&
        !defaultFound
      ) {
        defaultFound = true;
        return normalizedAddress;
      }

      if (
        normalizedAddress.isDefault &&
        defaultFound
      ) {
        return {
          ...normalizedAddress,
          isDefault: false,
        };
      }

      return normalizedAddress;
    });

  if (!defaultFound) {
    normalizedAddresses[0] = {
      ...normalizedAddresses[0],
      isDefault: true,
    };
  }

  return normalizedAddresses;
}

function prepareNewAddress(
  requestBody,
  existingAddresses
) {
  const normalizedAddress =
    normalizeAddressInput(
      requestBody
    );

  const now = new Date();

  const shouldBeDefault =
    existingAddresses.length === 0 ||
    normalizedAddress.isDefault;

  return {
    id: createAddressId(),
    addressId: createAddressId(),
    label:
      normalizedAddress.label,
    addressType:
      normalizedAddress.addressType,
    type:
      normalizedAddress.addressType,
    fullName:
      normalizedAddress.fullName,
    recipientName:
      normalizedAddress.fullName,
    phone:
      normalizedAddress.phone,
    phoneNumber:
      normalizedAddress.phone,
    addressLine1:
      normalizedAddress.addressLine1,
    address:
      normalizedAddress.addressLine1,
    addressLine2:
      normalizedAddress.addressLine2,
    area:
      normalizedAddress.area,
    city:
      normalizedAddress.city,
    state:
      normalizedAddress.state,
    postalCode:
      normalizedAddress.postalCode,
    country:
      normalizedAddress.country,
    deliveryInstructions:
      normalizedAddress.deliveryInstructions,
    isDefault: shouldBeDefault,
    createdAt: now,
    updatedAt: now,
  };
}

function applyNewDefaultAddress(
  addresses,
  newAddress
) {
  if (!newAddress.isDefault) {
    return [
      ...addresses,
      newAddress,
    ];
  }

  return [
    ...addresses.map((address) => ({
      ...address,
      isDefault: false,
    })),
    newAddress,
  ];
}

function createAddressListResponse(
  customer
) {
  const addresses =
    serializeAddresses(
      ensureSingleDefaultAddress(
        getCustomerAddresses(customer)
      )
    );

  return {
    success: true,
    addresses,
    count: addresses.length,
    limit: MAX_ADDRESSES,
    canAddMore:
      addresses.length < MAX_ADDRESSES,
  };
}


export async function GET() {
  try {
    const {
      customer,
    } = await getAuthenticatedCustomer();

    if (!customer) {
      return createErrorResponse(
        "Please sign in to view your saved addresses.",
        401
      );
    }

    if (isBlockedCustomer(customer)) {
      return createErrorResponse(
        "This account is currently unavailable.",
        403
      );
    }

    return createResponse(
      createAddressListResponse(
        customer
      )
    );
  } catch (error) {
    console.error(
      "Get Customer Addresses Error:",
      error
    );

    return createErrorResponse(
      "We could not load your saved addresses right now. Please try again.",
      500
    );
  }
}

export async function POST(request) {
  try {
    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return createErrorResponse(
        "Invalid request data.",
        400
      );
    }

    const {
      session,
      customer,
      collection,
    } = await getAuthenticatedCustomer();

    if (
      !session ||
      !customer ||
      !collection
    ) {
      return createErrorResponse(
        "Please sign in to add an address.",
        401
      );
    }

    if (isBlockedCustomer(customer)) {
      return createErrorResponse(
        "This account is currently unavailable.",
        403
      );
    }

    const existingAddresses =
      ensureSingleDefaultAddress(
        getCustomerAddresses(customer)
      );

    if (
      existingAddresses.length >=
      MAX_ADDRESSES
    ) {
      return createErrorResponse(
        `You can save up to ${MAX_ADDRESSES} addresses.`,
        400
      );
    }

    const normalizedAddress =
      normalizeAddressInput(
        requestBody
      );

    const validationResult =
      validateAddress(
        normalizedAddress
      );

    if (
      !validationResult.isValid
    ) {
      return createErrorResponse(
        validationResult.message,
        400,
        validationResult.field
      );
    }

    if (
      isDuplicateAddress(
        existingAddresses,
        normalizedAddress
      )
    ) {
      return createErrorResponse(
        "This address is already saved in your address book.",
        409
      );
    }

    const newAddress =
      prepareNewAddress(
        requestBody,
        existingAddresses
      );

    const updatedAddresses =
      ensureSingleDefaultAddress(
        applyNewDefaultAddress(
          existingAddresses,
          newAddress
        )
      );

    const now = new Date();

    const updateResult =
      await collection.findOneAndUpdate(
        {
          _id: customer._id,
        },
        {
          $set: {
            addresses:
              updatedAddresses,
            addressBook:
              updatedAddresses,
            updatedAt: now,
            lastActiveAt: now,
          },
        },
        {
          returnDocument: "after",
        }
      );

    const updatedCustomer =
      updateResult?.value ||
      updateResult;

    if (!updatedCustomer?._id) {
      return createErrorResponse(
        "We could not save this address right now.",
        500
      );
    }

    const savedAddresses =
      serializeAddresses(
        ensureSingleDefaultAddress(
          getCustomerAddresses(
            updatedCustomer
          )
        )
      );

    const savedAddress =
      savedAddresses.find(
        (address) =>
          address.id ===
          newAddress.id
      ) || null;

    return createResponse(
      {
        success: true,
        message:
          "Your address has been saved.",
        address: savedAddress,
        addresses:
          savedAddresses,
        count:
          savedAddresses.length,
        limit: MAX_ADDRESSES,
        canAddMore:
          savedAddresses.length <
          MAX_ADDRESSES,
      },
      201
    );
  } catch (error) {
    console.error(
      "Create Customer Address Error:",
      error
    );

    return createErrorResponse(
      "We could not save this address right now. Please try again.",
      500
    );
  }
}