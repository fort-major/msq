import {
  ErrorCode,
  SNAP_METHODS,
  type TIdentityId,
  type TOrigin,
  type TProtectedSnapMethodsKind,
  err,
  hexToBytes,
  Principal,
  IHttpAgentRequest,
  ICanisterRequest,
  IReadStateRequest,
  strToBytes,
} from "@fort-major/msq-shared";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { IDL, lebEncode } from "@dfinity/candid";
import { Heading, Text, text as snapText, heading as snapHeading } from "@metamask/snaps-sdk";
import { CallRequest, ReadRequest, ReadRequestType, SubmitRequestType } from "@dfinity/agent";

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
export const ONE_HOUR_MS = ONE_MINUTE_MS * 60;
export const ONE_DAY_MS = ONE_HOUR_MS * 24;

export const IC_DOMAIN_SEPARATOR = strToBytes("\x0Aic-request");

// this is executed during the 'verify' build step process
// when the snap is evaluated in SES
// if it passes during the build step, it will also pass in runtime
if (process.env.MSQ_SNAP_SITE_ORIGIN === undefined) {
  throw new Error(`Bad build: snap site origin is '${process.env.MSQ_SNAP_SITE_ORIGIN}'`);
}

/**
 * A complete and automatically generated list of all protected methods
 *
 * @see {@link SNAP_METHODS}
 */
const PROTECTED_METHODS = Object.keys(SNAP_METHODS.protected).flatMap((key) =>
  Object.values(SNAP_METHODS.protected[key as TProtectedSnapMethodsKind]),
);

/**
 * ## Checks if the method is protected - can only be called from the MSQ website
 *
 * If not - throws an error
 *
 * @param method
 * @param origin
 * @returns
 */
export function guardMethods(method: string, origin: TOrigin): void {
  // let other methods pass
  if (!PROTECTED_METHODS.includes(method)) {
    return;
  }

  // validate origin to be MSQ website
  if (!isMsq(origin)) {
    err(
      ErrorCode.PROTECTED_METHOD,
      `Method ${method} can only be executed from the MSQ website ("${origin}" != ${process.env.MSQ_SNAP_SITE_ORIGIN})`,
    );
  }
}

/**
 * Checks if the provided origin is of the MSQ website
 *
 * @param origin
 * @returns
 */
export function isMsq(origin: TOrigin): boolean {
  return origin === JSON.parse(process.env.MSQ_SNAP_SITE_ORIGIN as string);
}

/**
 * Derives a signing key pair from the provided arguments
 *
 * The key pair is different for each user, each origin, each user's identity and can be customized with salt
 *
 * @see {@link handleIdentitySign}
 * @see {@link handleIdentityGetPublicKey}
 *
 * @param origin
 * @param identityId
 * @param salt
 * @returns
 */
export async function getSignIdentity(
  origin: TOrigin,
  identityId: TIdentityId,
  salt: Uint8Array = new Uint8Array(),
): Promise<Secp256k1KeyIdentity> {
  // the MSQ site has constant origin
  // this will allow us to change the domain name without users losing their funds and accounts
  const orig = isMsq(origin) ? "https://msq.tech" : origin;

  // forbid other dapps from using external salt
  // TODO: better trap here, if the provided salt is not the default one
  if (!isMsq(origin)) {
    salt = new Uint8Array();
  }

  // shared prefix may be used in following updates
  const entropy = await getEntropy(orig, identityId, "identity-sign\nshared", salt);

  return Secp256k1KeyIdentity.fromSecretKey(entropy);
}

/**
 * Retrieves base entropy for a given origin and identity, incorporating an internal salt.
 * This function generates a unique entropy value by calling the `snap.request` method with
 * the "snap_getEntropy" method. The entropy is requested with a salt that combines a static
 * prefix, the origin, the identity ID, and an internal salt, separated by newline characters.
 * The response is expected to be a hexadecimal string, from which the leading "0x" is removed.
 * This hexadecimal string is then converted into a Uint8Array representing the entropy bytes.
 * The process ensures that the entropy is unique to the combination of origin, identity, and
 * internal salt, which is essential for MSQ's security.
 *
 * @param {TOrigin} origin - The origin associated with the entropy request.
 * @param {TIdentityId} identityId - The identity ID associated with the entropy request.
 * @param {string} internalSalt - An internal salt to further personalize the entropy.
 * @returns {Promise<Uint8Array>} A promise that resolves to the entropy value as a Uint8Array.
 */
async function getBaseEntropy(origin: TOrigin, identityId: TIdentityId, internalSalt: string): Promise<Uint8Array> {
  const generated: string = await snap.request({
    method: "snap_getEntropy",
    params: {
      version: 1,
      salt: `\x0amsq-snap\n${origin}\n${identityId}\n${internalSalt}`,
    },
  });

  return hexToBytes(generated.slice(2));
}

/**
 * Generates a final entropy value by combining base entropy with an external salt and hashing the result.
 * This function first retrieves the base entropy for a given origin, identity ID, and internal salt by calling
 * `getBaseEntropy`. It then merges this base entropy with an external salt provided as a `Uint8Array` to form
 * a combined entropy byte array. This combined array is then hashed using the SHA-256 algorithm via the Web
 * Cryptography API (`crypto.subtle.digest`). The result is a promise that resolves to an `ArrayBuffer` representing
 * the final hashed entropy. This method provides a secure way to generate a unique and reproducible entropy value
 * for cryptographic operations or secure random generation, ensuring the entropy is specific to the given origin,
 * identity, and salts. Double hashing is used to prevent injection attacks.
 *
 * @param {TOrigin} origin - The origin associated with the entropy request.
 * @param {TIdentityId} identityId - The identity ID associated with the entropy request.
 * @param {string} internalSalt - An internal salt to further personalize the base entropy.
 * @param {Uint8Array} externalSalt - An external salt to combine with the base entropy before hashing.
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the hashed entropy as an ArrayBuffer.
 */
async function getEntropy(
  origin: TOrigin,
  identityId: TIdentityId,
  internalSalt: string,
  externalSalt: Uint8Array,
): Promise<ArrayBuffer> {
  const baseEntropy = await getBaseEntropy(origin, identityId, internalSalt);

  let entropyPreBytes = new Uint8Array([...baseEntropy, ...externalSalt]);
  return await crypto.subtle.digest("SHA-256", entropyPreBytes);
}

/**
 * Escapes Markdown control characters, newline characters, and backticks in a string.
 * This function takes a string and returns a new string with all Markdown control characters, newline characters, and backticks escaped.
 * Escaping is done by prefixing each control character and backtick with a backslash (`\`), and newline characters are replaced with `\\n`.
 *
 * Control characters include: `{`, `}`, `[`, `]`, `(`, `)`, `#`, `!`, `|`, `\`, and `` ` ``.
 * Newline characters are replaced with a visible escape sequence (`\\n`) for demonstration or specific formatting needs.
 * Since all newlines are escaped, list creating characters `-`, `+` and `.` are allowed.
 * Text styling characters `*`, `_` are also allowed
 *
 * @param {string} text The string to be escaped.
 * @return {string} The escaped string, safe to be used in Markdown without triggering formatting, with newline characters visually represented and backticks escaped.
 */
export function escapeMarkdown(text: string) {
  return text.replace(/([{}\[\]()#!|\\`])|\n/g, (match) => (match === "\n" ? "\\n" : "\\" + match));
}

/**
 * An escaped version of a text element from @metamask/snaps-sdk
 *
 * @param {string} str The string to render
 * @returns {Text} The Text node
 */
export function text(str: string): Text {
  return snapText(escapeMarkdown(str));
}

/**
 * An escaped version of a heading element from @metamask/snaps-sdk
 *
 * @param {string} str The string to render
 * @returns {Heading} The Heading node
 */
export function heading(str: string): Heading {
  return snapHeading(escapeMarkdown(str));
}

const CANDID_BLOB = IDL.Vec(IDL.Nat8);

export const ICRC1_TRANSFER_ARGS_SCHEMA = IDL.Record({
  from_subaccount: IDL.Opt(CANDID_BLOB),
  to: IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(CANDID_BLOB),
  }),
  amount: IDL.Nat,
  fee: IDL.Opt(IDL.Nat),
  memo: IDL.Opt(CANDID_BLOB),
  created_at_time: IDL.Opt(IDL.Nat64),
});

export type ICRC1TransferArgs = {
  from_subaccount: [] | [Uint8Array];
  to: {
    owner: Principal;
    subaccount: [] | [Uint8Array];
  };
  amount: bigint;
  fee: [] | [bigint];
  memo: [] | [Uint8Array];
  created_at_time: [] | [bigint];
};

export class Expiry {
  constructor(private readonly _value: bigint) {}

  public toHash(): ArrayBuffer {
    return lebEncode(this._value);
  }
}

export function prepareRequest(req: IHttpAgentRequest): CallRequest | ReadRequest {
  const sender = typeof req.sender === "string" ? Principal.fromText(req.sender) : (req.sender as Uint8Array);

  const ingress_expiry = new Expiry(req.ingress_expiry);

  let request: CallRequest | ReadRequest;

  if (req.request_type === "call" || req.request_type === "query") {
    const r = req as ICanisterRequest;

    request = {
      ...r,
      request_type: r.request_type as SubmitRequestType,
      canister_id: Principal.fromText(r.canister_id),
      method_name: r.method_name,
      arg: r.arg,
      sender,
      // @ts-expect-error - we have replaced the default Expiry impl, because it does not allow reassembly from the internal value
      ingress_expiry,
    };
  } else {
    const r = req as IReadStateRequest;

    request = {
      ...r,
      request_type: r.request_type as ReadRequestType.ReadState,
      paths: r.paths,
      sender,
      // @ts-expect-error - we have replaced the default Expiry impl, because it does not allow reassembly from the internal value
      ingress_expiry,
    };
  }

  return request;
}

/**
 * Generates a random pseudonym based on two seed values.
 * This function constructs a pseudonym by selecting an adjective and a noun from predefined lists,
 * using the provided seed values. The selection process involves taking the modulo of each seed value
 * with the length of the respective list (ADJECTIVES or NOUNS) to ensure the index falls within the
 * range of the list. This approach allows for predictable, reproducible pseudonyms from specific seed
 * values, which can be useful in scenarios where unique, yet deterministic, identifiers are needed.
 *
 * @param {number} seed1 - The seed value used to select an adjective.
 * @param {number} seed2 - The seed value used to select a noun.
 * @returns {string} The generated pseudonym, composed of an adjective and a noun.
 */
export function generateRandomPseudonym(seed1: number, seed2: number): string {
  return `${ADJECTIVES[seed1 % ADJECTIVES.length]} ${NOUNS[seed2 % NOUNS.length]}`;
}

const ADJECTIVES = [
  "Slight",
  "Rich",
  "Eventual",
  "Valid",
  "Judicial",
  "Thoughtful",
  "Developed",
  "Just",
  "Outdoor",
  "Empty",
  "Raw",
  "Deliberate",
  "Competent",
  "Terrible",
  "Asian",
  "Good",
  "Regional",
  "Rare",
  "Short",
  "Chronic",
  "Drunk",
  "Golden",
  "Particular",
  "Embarrassed",
  "Invisible",
  "Characteristic",
  "Sorry",
  "Crooked",
  "Healthy",
  "Fierce",
  "Real",
  "Dead",
  "Rapid",
  "Similar",
  "Excited",
  "Poor",
  "Puny",
  "Foolish",
  "Partial",
  "Junior",
  "Complicated",
  "Enchanting",
  "Wide",
  "Hollow",
  "Sore",
  "Misty",
  "Pretty",
  "Lesser",
  "Religious",
  "Genuine",
  "Very",
  "Mute",
  "Scientific",
  "Obnoxious",
  "Melted",
  "Electronic",
  "Passing",
  "Exclusive",
  "Victorian",
  "Gentle",
  "Kind",
  "Precise",
  "Bitter",
  "Frightened",
  "Impressive",
  "Excellent",
  "Unpleasant",
  "Regular",
  "Female",
  "Semantic",
  "Stable",
  "Evil",
  "Dull",
  "Melodic",
  "Happy",
  "Beautiful",
  "Managing",
  "Fresh",
  "Far",
  "Fortunate",
  "Liberal",
  "Angry",
  "Reliable",
  "Greek",
  "Horrible",
  "Handsome",
  "Scottish",
  "Decent",
  "Electrical",
  "Total",
  "Yellow",
  "Enthusiastic",
  "Loose",
  "Worthy",
  "Blue",
  "Dry",
  "Shallow",
  "Legitimate",
  "Calm",
  "Hot",
  "Civic",
  "Wrong",
  "Numerous",
  "Supporting",
  "Doubtful",
  "Sound",
  "Sour",
  "Wet",
  "Devoted",
  "Contemporary",
  "Deaf",
  "Ultimate",
  "Scared",
  "Reasonable",
  "Elderly",
  "Noisy",
  "Historical",
  "Nearby",
  "Shaggy",
  "Smart",
  "Immense",
  "Constant",
  "Past",
  "Specified",
  "German",
  "Upset",
  "Public",
  "Spicy",
  "Informal",
  "Brief",
  "Underground",
  "Busy",
  "Domestic",
  "Grim",
  "Excess",
  "Bottom",
  "Hungry",
  "Roasted",
  "Brave",
  "Crazy",
  "Minor",
  "Careful",
  "Prior",
  "Rough",
  "Mysterious",
  "Confused",
  "Long",
  "Current",
  "Lucky",
  "Vertical",
  "Bright",
  "Ministerial",
  "Fashionable",
  "Heavy",
  "Major",
  "Amateur",
  "Respective",
  "Teenage",
  "Involved",
  "Frail",
  "Nice",
  "Subjective",
  "Productive",
  "Jolly",
  "Nasty",
  "Intelligent",
  "Improved",
  "Dangerous",
  "Professional",
  "Accused",
  "Lovely",
  "Renewed",
  "Pleasant",
  "Various",
  "Arbitrary",
  "Incredible",
  "Cheerful",
  "Creepy",
  "Middle-class",
  "Mammoth",
  "Unknown",
  "Shaky",
  "Puzzled",
  "Plain",
  "Elegant",
  "Typical",
  "Unable",
  "Exact",
  "Filthy",
  "Keen",
  "Operational",
  "Voluntary",
  "Secure",
  "Selfish",
  "Ripe",
  "Worrying",
  "Thorough",
  "Mass",
  "Afraid",
  "Sheer",
  "Intact",
  "Required",
  "Acute",
  "Combative",
  "Quick",
  "Unusual",
  "Odd",
  "Proud",
  "Remaining",
  "Collective",
  "Blind",
  "Outstanding",
  "Clumsy",
  "Orange",
  "Neutral",
  "Fluffy",
  "Painful",
  "Crude",
  "Manual",
  "Comfortable",
  "Printed",
  "Dreadful",
  "Big",
  "Witty",
  "Protestant",
  "Chilly",
  "Narrow",
  "Early",
  "Safe",
  "Daily",
  "Popular",
  "Modern",
  "Prospective",
  "Blushing",
  "Gradual",
  "Tender",
  "Convenient",
  "Intense",
  "Spontaneous",
  "Full-time",
  "Jealous",
  "Lengthy",
  "Upper",
  "Strategic",
  "Brown",
  "Gigantic",
  "Fast",
  "Furious",
  "Absent",
  "Absolute",
  "Abstract",
  "Canceled",
  "Academic",
  "Concrete",
  "Accepted",
  "Accessible",
];

const NOUNS = [
  "Randomisation",
  "Waist",
  "Nightingale",
  "Maiden",
  "Luttuce",
  "Cricketer",
  "Name",
  "Bike",
  "Bill",
  "Company",
  "Outset",
  "Bibliography",
  "Monday",
  "Sunlamp",
  "Director",
  "Ghana",
  "Jewelry",
  "Break",
  "Nudge",
  "Buckle",
  "Stick",
  "Dream",
  "Astrolabe",
  "Burma",
  "Ship",
  "Throne",
  "Baobab",
  "Shaker",
  "Laparoscope",
  "Celery",
  "Slope",
  "Drink",
  "Bower",
  "Seed",
  "Billboard",
  "Chit-chat",
  "Bomb",
  "Lumber",
  "Fixture",
  "Brushfire",
  "Ranch",
  "Rail",
  "Schedule",
  "Cucumber",
  "Handmaiden",
  "Archaeology",
  "Crib",
  "Counter",
  "Steamroller",
  "Glove",
  "Gladiolus",
  "Mood",
  "Cracker",
  "Belligerency",
  "Bit",
  "Granny",
  "Impudence",
  "Microwave",
  "Galley",
  "Others",
  "Hobbit",
  "Buffet",
  "Umbrella",
  "Yacht",
  "Shelf",
  "Balloon",
  "Floozie",
  "Archeology",
  "Hostess",
  "Drunk",
  "Gaffer",
  "Square",
  "Elephant",
  "Bag",
  "Vibraphone",
  "Suburb",
  "Celsius",
  "Armoire",
  "Radish",
  "Reflection",
  "Orangutan",
  "Input",
  "Scent",
  "Crest",
  "Migrant",
  "Inn",
  "Driver",
  "Bin",
  "Cost",
  "Purse",
  "Appendix",
  "Bass",
  "Phrase",
  "Rowboat",
  "Climb",
  "Vessel",
  "Cowbell",
  "Grey",
  "Canteen",
  "Crown",
  "Drake",
  "Bacon",
  "Temper",
  "Thursday",
  "Spectacles",
  "Leo",
  "Scorn",
  "Accelerator",
  "Chord",
  "Filth",
  "Discovery",
  "Millisecond",
  "Cardigan",
  "Outside",
  "Heron",
  "Scissors",
  "Tabernacle",
  "Spectrograph",
  "Saving",
  "Ketchup",
  "Inglenook",
  "Paleontologist",
  "Procedure",
  "Icecream",
  "Skiing",
  "Prose",
  "Tavern",
  "Brandy",
  "Tailspin",
  "Capitulation",
  "Brush",
  "Hamster",
  "Jacket",
  "Dragonfly",
  "Steam",
  "Windage",
  "East",
  "Adapter",
  "Safety",
  "Sell",
  "Waste",
  "Knife",
  "Chick",
  "Hydrogen",
  "Runaway",
  "Duststorm",
  "Harbour",
  "Tunic",
  "Tempo",
  "Libra",
  "Sari",
  "Road",
  "Teacher",
  "Heater",
  "Senator",
  "Walker",
  "Zucchini",
  "Intelligence",
  "Lentil",
  "Mayor",
  "Train",
  "Dead",
  "Disconnection",
  "Hammock",
  "Tintype",
  "Depressive",
  "Hell",
  "Gold",
  "Inquiry",
  "Dipstick",
  "Analgesia",
  "Tsunami",
  "Blazer",
  "Mantua",
  "Stock-in-trade",
  "Safe",
  "Discount",
  "Flintlock",
  "Titanium",
  "Gender",
  "Writing",
  "Delivery",
  "Visit",
  "Hen",
  "Laundry",
  "Positive",
  "Wine",
  "Bugle",
  "Enquiry",
  "Counter-force",
  "Conference",
  "Birch",
  "Assistance",
  "Spine",
  "Daniel",
  "Boatyard",
  "Twister",
  "Turret",
  "Neurobiologist",
  "Nail",
  "Tepee",
  "Collar",
  "Planter",
  "Random",
  "Cheese",
  "Fruit",
  "Fifth",
  "January",
  "Sabre",
  "Push",
  "Chronometer",
  "Cactus",
  "Hydrant",
  "Scallion",
  "Snow",
  "Palm",
  "Permission",
  "Sing",
  "Gem",
  "Extent",
  "Nightgown",
  "Cement",
  "Employ",
  "Screw-up",
  "Macaroni",
  "Doubt",
  "Hypothermia",
  "Parsnip",
  "Antlantida",
  "Contract",
  "Manx",
  "Cowboy",
  "Corduroy",
  "Life",
  "Call",
  "Vast",
  "Cornerstone",
  "Self",
  "Issue",
  "Octagon",
  "Sweat",
  "Peacoat",
  "Jury",
  "Millimeter",
  "Slip",
  "September",
  "Ambassador",
  "Lead",
  "Saviour",
  "Violin",
  "Witch",
  "Alphabet",
  "Breakpoint",
  "Patient",
  "Calcification",
  "Atom",
];
