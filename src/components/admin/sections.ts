// The admin areas, in nav order. Shared by the nav and the admin index.
export const ADMIN_SECTIONS = [
  { label: "Overview", href: "/admin", description: "" },
  { label: "Products", href: "/admin/products", description: "View, create and edit products." },
  { label: "Categories", href: "/admin/categories", description: "Manage the product categories." },
  { label: "Stock", href: "/admin/stock", description: "See current stock and update it." },
  { label: "Orders", href: "/admin/orders", description: "View customer orders." },
] as const;
