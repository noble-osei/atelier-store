"use client";

import { useActionState } from "react";

import { SelectField, TextAreaField } from "@/components/admin/fields";
import { TextField } from "@/components/auth/text-field";
import type { ProductFormState } from "@/app/admin/products/actions";
import {
  BADGES,
  LIMITS,
  centsToInput,
  formatColors,
  formatImages,
  type FormValues,
} from "@/lib/product-input";
import { ONE_SIZE } from "@/lib/products";

type ExistingProduct = {
  slug: string;
  name: string;
  reference: string;
  categoryId: number;
  priceCents: number;
  badge: string | null;
  description: string;
  details: string[];
  colors: { name: string; value: string }[];
  images: { src: string; alt: string }[];
  sizes: { label: string; quantity: number }[];
};

type Props = {
  mode: "create" | "edit";
  categories: { id: number; name: string }[];
  action: (previous: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  /** Present when editing. */
  product?: ExistingProduct;
};

const initialState: ProductFormState = {
  error: null,
  fieldErrors: {},
  values: null,
  saved: false,
};

function initialValues(product?: ExistingProduct): FormValues {
  if (!product) return {};
  return {
    name: product.name,
    reference: product.reference,
    categoryId: String(product.categoryId),
    price: centsToInput(product.priceCents),
    badge: product.badge ?? "",
    description: product.description,
    details: product.details.join("\n"),
    colors: formatColors(product.colors),
    images: formatImages(product.images),
    sizes: "",
  };
}

// The server validates everything again; this form only shows the result and
// keeps what was typed when something is rejected.
export function ProductForm({ mode, categories, action, product }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? initialValues(product);
  const errors = state.fieldErrors;
  const editing = mode === "edit";

  return (
    <form action={formAction} aria-busy={pending} className="flex max-w-2xl flex-col gap-6">
      <TextField
        name="name"
        label="Name"
        defaultValue={values.name}
        maxLength={LIMITS.name}
        required
        error={errors.name}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          name="reference"
          label="Reference"
          hint="Shown as “Ref.” and used as the SKU."
          defaultValue={values.reference}
          maxLength={LIMITS.reference}
          required
          error={errors.reference}
        />
        {editing ? (
          <div>
            <p className="field-label">Slug</p>
            <p className="min-h-(--control-h) content-center text-body break-all">{product?.slug}</p>
            <p className="field-hint">Part of the public URL, so it cannot be changed.</p>
          </div>
        ) : (
          <TextField
            name="slug"
            label="Slug"
            hint="Used in the product URL and cannot be changed later. Leave empty to use the name."
            defaultValue={values.slug}
            maxLength={LIMITS.slug}
            autoCapitalize="none"
            spellCheck={false}
            error={errors.slug}
          />
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <SelectField
          name="categoryId"
          label="Category"
          defaultValue={values.categoryId ?? ""}
          required
          error={errors.categoryId}
        >
          <option value="" disabled>
            Choose…
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <TextField
          name="price"
          label="Price (USD)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="1250.00"
          defaultValue={values.price}
          required
          error={errors.price}
        />
        <SelectField
          name="badge"
          label="Badge"
          defaultValue={values.badge ?? ""}
          error={errors.badge}
        >
          <option value="">None</option>
          {BADGES.map((badge) => (
            <option key={badge} value={badge}>
              {badge}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        name="description"
        label="Description"
        defaultValue={values.description}
        maxLength={LIMITS.description}
        required
        error={errors.description}
      />
      <TextAreaField
        name="details"
        label="Details"
        hint="One line per detail, for example “100% lambskin”."
        defaultValue={values.details}
        error={errors.details}
      />
      <TextAreaField
        name="colors"
        label="Colors"
        hint="One per line as name | hex, for example “Black | #111111”. Leave empty if there is one color."
        defaultValue={values.colors}
        spellCheck={false}
        error={errors.colors}
      />
      <TextAreaField
        name="images"
        label="Images"
        hint="One per line as https URL | description. The first image is the main one."
        defaultValue={values.images}
        spellCheck={false}
        required
        error={errors.images}
      />

      {editing ? (
        <div className="flex flex-col gap-2 border-y border-line py-4">
          <p className="type-label">Current sizes</p>
          <p className="text-body-sm">
            {product?.sizes.map((s) => `${s.label} (${s.quantity})`).join(", ") || "None"}
          </p>
          <p className="field-hint">
            Quantities are changed from the Stock page. Sizes cannot be renamed or removed.
          </p>
        </div>
      ) : null}
      <TextAreaField
        name="sizes"
        label={editing ? "Add sizes" : "Sizes and starting stock"}
        hint={`One per line as size | quantity, for example “S | 4”. Use “${ONE_SIZE} | 10” for a single-size product.`}
        defaultValue={values.sizes}
        spellCheck={false}
        required={!editing}
        error={errors.sizes}
      />

      {state.error ? (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="text-body-sm text-success">
          Saved. The storefront now shows these details.
        </p>
      ) : null}

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
