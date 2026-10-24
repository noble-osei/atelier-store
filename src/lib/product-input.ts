// Parsing and validation of the admin product form. No database or server-only
// imports: the form (a Client Component) uses the types and helpers, and the
// Server Actions use parseProductForm as the authority. FormData is untrusted,
// so nothing here assumes a field is present or a string.
import type { Image } from "./images";
import { ONE_SIZE } from "./products";
import { slugify } from "./slug";

export type Badge = "New" | "Limited" | "Exclusive";
export const BADGES: readonly Badge[] = ["New", "Limited", "Exclusive"];

export type ProductColor = { name: string; value: string };
export type NewSize = { label: string; quantity: number };

export type ProductInput = {
  name: string;
  reference: string;
  /** Only used when creating: a slug is part of public URLs and never changes. */
  slug: string;
  categoryId: number;
  priceCents: number;
  badge: Badge | null;
  description: string;
  details: string[];
  colors: ProductColor[];
  images: Image[];
  /** Create: the product's sizes. Edit: sizes to add (existing ones are not touched). */
  sizes: NewSize[];
};

export const PRODUCT_FIELDS = [
  "name",
  "reference",
  "slug",
  "categoryId",
  "price",
  "badge",
  "description",
  "details",
  "colors",
  "images",
  "sizes",
] as const;
export type ProductField = (typeof PRODUCT_FIELDS)[number];

export type FieldErrors = Partial<Record<ProductField, string>>;
/** The text the admin typed, so a failed submit can refill the form. */
export type FormValues = Partial<Record<ProductField, string>>;

export type ParseResult =
  | { ok: true; value: ProductInput; values: FormValues }
  | { ok: false; errors: FieldErrors; values: FormValues };

export const LIMITS = {
  name: 120,
  reference: 40,
  slug: 80,
  description: 2000,
  detail: 200,
  details: 20,
  colorName: 40,
  colors: 12,
  imageUrl: 500,
  imageAlt: 200,
  images: 10,
  sizeLabel: 20,
  sizes: 30,
  quantity: 100_000,
  /** 7 whole-dollar digits keeps cents far below the integer column's limit. */
  priceDigits: 7,
} as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const PRICE = new RegExp(`^(\\d{1,${LIMITS.priceDigits}})(?:\\.(\\d{1,2}))?$`);

/** "19.99" -> 1999, by string maths so no float ever touches money. */
export function parsePriceCents(input: string): number | null {
  const match = PRICE.exec(input.trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return cents > 0 ? cents : null;
}

/** 1999 -> "19.99", for the price field. */
export function centsToInput(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Admin display keeps the cents (the storefront rounds to whole dollars). */
export function formatCents(cents: number) {
  return money.format(cents / 100);
}

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** "left | right", split on the first bar so the right side may contain bars. */
function pair(line: string): [string, string] {
  const index = line.indexOf("|");
  if (index < 0) return [line.trim(), ""];
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}

// Line formats shown as hints in the form and parsed back here.
export const formatColors = (colors: ProductColor[]) =>
  colors.map((c) => `${c.name} | ${c.value}`).join("\n");
export const formatImages = (images: Image[]) =>
  images.map((i) => `${i.src} | ${i.alt}`).join("\n");

function parseColors(value: string): ProductColor[] | string {
  const rows = lines(value);
  if (rows.length > LIMITS.colors) return `Use at most ${LIMITS.colors} colors.`;
  const colors: ProductColor[] = [];
  for (const row of rows) {
    const [name, hex] = pair(row);
    if (!name || name.length > LIMITS.colorName) {
      return `Color names must be 1 to ${LIMITS.colorName} characters: "${row}".`;
    }
    if (!HEX.test(hex)) return `Give "${name}" a hex value like #1a1a1a.`;
    if (colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return `"${name}" is listed twice.`;
    }
    colors.push({ name, value: hex.toLowerCase() });
  }
  return colors;
}

function parseImages(value: string): Image[] | string {
  const rows = lines(value);
  if (rows.length === 0) return "Add at least one image.";
  if (rows.length > LIMITS.images) return `Use at most ${LIMITS.images} images.`;
  const images: Image[] = [];
  for (const row of rows) {
    const [src, alt] = pair(row);
    let url: URL | null = null;
    try {
      url = new URL(src);
    } catch {
      // handled below
    }
    if (
      !url ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      src.length > LIMITS.imageUrl
    ) {
      return `"${src.slice(0, 60)}" is not a valid https image URL.`;
    }
    if (!alt || alt.length > LIMITS.imageAlt) {
      return `Describe the image in 1 to ${LIMITS.imageAlt} characters after the "|".`;
    }
    images.push({ src: url.toString(), alt });
  }
  return images;
}

function parseSizes(value: string): NewSize[] | string {
  const rows = lines(value);
  if (rows.length > LIMITS.sizes) return `Use at most ${LIMITS.sizes} sizes.`;
  const sizes: NewSize[] = [];
  for (const row of rows) {
    const [label, amount] = pair(row);
    if (!label || label.length > LIMITS.sizeLabel) {
      return `Size labels must be 1 to ${LIMITS.sizeLabel} characters: "${row}".`;
    }
    if (!/^\d{1,6}$/.test(amount) || Number(amount) > LIMITS.quantity) {
      return `Give "${label}" a whole quantity from 0 to ${LIMITS.quantity}.`;
    }
    if (sizes.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      return `Size "${label}" is listed twice.`;
    }
    sizes.push({ label, quantity: Number(amount) });
  }
  // The storefront treats a single "One size" row as a one-size product.
  const oneSize = sizes.some((s) => s.label.toLowerCase() === ONE_SIZE.toLowerCase());
  if (oneSize && sizes.length > 1) return `"${ONE_SIZE}" cannot be combined with other sizes.`;
  return sizes.map((s) => (oneSize ? { ...s, label: ONE_SIZE } : s));
}

export function parseProductForm(data: FormData, mode: "create" | "edit"): ParseResult {
  const values: FormValues = {};
  for (const field of PRODUCT_FIELDS) values[field] = text(data, field);

  const errors: FieldErrors = {};
  const fail = (field: ProductField, message: string) => {
    errors[field] ??= message;
  };

  const name = text(data, "name").trim();
  if (!name) fail("name", "Enter a name.");
  else if (name.length > LIMITS.name) fail("name", `Use ${LIMITS.name} characters or fewer.`);

  const reference = text(data, "reference").trim();
  if (!reference) fail("reference", "Enter a reference.");
  else if (reference.length > LIMITS.reference) {
    fail("reference", `Use ${LIMITS.reference} characters or fewer.`);
  }

  // Edit never reads a slug: it is part of public URLs and is not changeable.
  let slug = "";
  if (mode === "create") {
    slug = text(data, "slug").trim().toLowerCase() || slugify(name);
    if (!slug || slug.length > LIMITS.slug || !SLUG.test(slug)) {
      fail("slug", `Use lowercase letters, numbers and hyphens, up to ${LIMITS.slug} characters.`);
    }
  }

  const categoryRaw = text(data, "categoryId");
  const categoryId = /^[1-9]\d{0,9}$/.test(categoryRaw) ? Number(categoryRaw) : 0;
  if (!categoryId || categoryId > 2_147_483_647) fail("categoryId", "Choose a category.");

  const priceCents = parsePriceCents(text(data, "price"));
  if (priceCents === null) {
    fail("price", "Enter a price above zero, like 1250 or 19.99 (at most two decimals).");
  }

  const badgeRaw = text(data, "badge");
  const badge = (BADGES as readonly string[]).includes(badgeRaw) ? (badgeRaw as Badge) : null;
  if (badgeRaw && !badge) fail("badge", "Choose one of the listed badges.");

  const description = text(data, "description").trim();
  if (!description) fail("description", "Enter a description.");
  else if (description.length > LIMITS.description) {
    fail("description", `Use ${LIMITS.description} characters or fewer.`);
  }

  const details = lines(text(data, "details"));
  if (details.length > LIMITS.details) fail("details", `Use at most ${LIMITS.details} lines.`);
  else if (details.some((d) => d.length > LIMITS.detail)) {
    fail("details", `Keep each line to ${LIMITS.detail} characters.`);
  }

  const colors = parseColors(text(data, "colors"));
  if (typeof colors === "string") fail("colors", colors);

  const images = parseImages(text(data, "images"));
  if (typeof images === "string") fail("images", images);

  const sizes = parseSizes(text(data, "sizes"));
  if (typeof sizes === "string") fail("sizes", sizes);
  else if (mode === "create" && sizes.length === 0) {
    fail("sizes", `Add at least one size, for example "${ONE_SIZE} | 10".`);
  }

  if (
    Object.keys(errors).length > 0 ||
    priceCents === null ||
    typeof colors === "string" ||
    typeof images === "string" ||
    typeof sizes === "string"
  ) {
    return { ok: false, errors, values };
  }

  return {
    ok: true,
    values,
    value: {
      name,
      reference,
      slug,
      categoryId,
      priceCents,
      badge,
      description,
      details,
      colors,
      images,
      sizes,
    },
  };
}

/** A positive integer id from a form or action argument, or null. */
export function parseId(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : value;
  if (typeof text !== "string" || !/^[1-9]\d{0,9}$/.test(text)) return null;
  const id = Number(text);
  return id <= 2_147_483_647 ? id : null;
}
