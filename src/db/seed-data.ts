// Initial catalog, loaded into the database by `pnpm db:seed`.
// The database is the source of truth after seeding; edit products there.
import { unsplash } from "../lib/images";
import { ONE_SIZE, type Product, type Size } from "../lib/products";

const READY_TO_WEAR_SIZES = ["XS", "S", "M", "L", "XL"];

function sized(labels: string[], stock: number[]): Size[] {
  return labels.map((label, i) => ({ label, stock: stock[i] ?? 0 }));
}

function oneSize(stock: number): Size[] {
  return [{ label: ONE_SIZE, stock }];
}

export const seedProducts: Product[] = [
  {
    slug: "biker-jacket",
    reference: "AT-RTW-0412",
    name: "Leather biker jacket",
    category: "Ready-to-wear",
    price: 3200,
    badge: "New",
    images: [
      unsplash(
        "1521223890158-f9f7c3d5d504",
        "Close up of a black leather biker jacket with silver zips",
      ),
      unsplash(
        "1520975916090-3105956dac38",
        "A man wearing the black leather biker jacket over a white T-shirt",
      ),
      unsplash(
        "1520975954732-35dd22299614",
        "A man in the black leather biker jacket crouching on a ledge",
      ),
    ],
    description:
      "A classic biker cut in supple lambskin, with an asymmetric zip, notched lapels and belted hem. Lined in cupro so it layers easily over knitwear.",
    details: [
      "100% lambskin leather, cupro lining",
      "Asymmetric front zip, zipped cuffs",
      "Three exterior zip pockets",
      "Regular fit, true to size",
      "Specialist leather clean only",
      "Made in Italy",
    ],
    colors: [{ name: "Black", value: "#111111" }],
    sizes: sized(READY_TO_WEAR_SIZES, [0, 4, 6, 2, 0]),
  },
  {
    slug: "pearl-necklace",
    reference: "AT-JWL-0108",
    name: "Pearl strand necklace",
    category: "Jewelry",
    price: 1450,
    images: [
      unsplash(
        "1515562141207-7a88fb7ce338",
        "Pearl necklace resting in an open jewelry box",
      ),
      unsplash(
        "1581044777550-4cfa60707c03",
        "A woman in a pink ruffled dress wearing pearl jewelry",
      ),
    ],
    description:
      "Hand-knotted freshwater pearls finished with a pavé crystal clasp. Wear it close to the collarbone or doubled at the wrist.",
    details: [
      "Freshwater pearls, 7–8 mm",
      "Sterling silver clasp with crystal pavé",
      "Length 42 cm",
      "Presented in a signature jewelry box",
      "Made in Italy",
    ],
    colors: [{ name: "Ivory", value: "#efe9dd" }],
    sizes: oneSize(2),
  },
  {
    slug: "woven-chain-bag",
    reference: "AT-BAG-0233",
    name: "Woven leather chain bag",
    category: "Bags",
    price: 2650,
    badge: "Limited",
    images: [
      unsplash(
        "1598532163257-ae3c6b2524b6",
        "Cognac woven leather bag with a gold chain strap",
      ),
      unsplash(
        "1496747611176-843222e1e57c",
        "A woman in a floral dress by the sea",
      ),
    ],
    description:
      "Wide strips of nappa leather woven by hand into a soft, slouchy shape, hung from a chunky gold-tone chain. A limited edition of 200 pieces.",
    details: [
      "Hand-woven nappa leather",
      "Magnetic closure, suede lining",
      "Gold-tone chain shoulder strap",
      "W 34 × H 24 × D 10 cm",
      "Made in Italy",
    ],
    colors: [{ name: "Cognac", value: "#9a5b2e" }],
    sizes: oneSize(1),
  },
  {
    slug: "round-sunglasses",
    reference: "AT-EYE-0057",
    name: "Round metal sunglasses",
    category: "Eyewear",
    price: 480,
    images: [
      unsplash(
        "1511499767150-a48a237f0083",
        "Gold frame round sunglasses on a white surface",
      ),
      unsplash(
        "1469334031218-e382a71b716b",
        "A woman adjusting round sunglasses against a yellow wall",
      ),
    ],
    description:
      "A slim, gold-tone round frame with green mineral lenses and adjustable nose pads. Light enough to wear all day.",
    details: [
      "Gold-tone titanium frame",
      "Green mineral glass lenses, 100% UV protection",
      "Lens width 50 mm, bridge 21 mm",
      "Leather case and cleaning cloth included",
      "Made in Japan",
    ],
    colors: [{ name: "Gold / green", value: "#b8975a" }],
    sizes: oneSize(14),
  },
  {
    slug: "floral-pump",
    reference: "AT-SHO-0321",
    name: "Floral satin pump",
    category: "Shoes",
    price: 990,
    badge: "New",
    images: [
      unsplash(
        "1543163521-1bf539c55dd2",
        "Pair of floral print stiletto pumps on a blue background",
      ),
      unsplash(
        "1509631179647-0177331693ae",
        "A woman in striped trousers posing against a teal wall",
      ),
    ],
    description:
      "A pointed pump in printed duchesse satin, set on a slender 105 mm stiletto. The print is engineered so no two pairs are the same.",
    details: [
      "Printed silk satin upper, leather lining",
      "105 mm heel",
      "Leather sole",
      "Fits true to size",
      "Made in Italy",
    ],
    colors: [{ name: "Cobalt floral", value: "#2a5aa8" }],
    sizes: sized(["36", "37", "38", "39", "40", "41"], [2, 5, 0, 3, 1, 0]),
  },
  {
    slug: "pleated-trousers",
    reference: "AT-RTW-0377",
    name: "Pleated silk trousers",
    category: "Ready-to-wear",
    price: 1100,
    images: [
      unsplash(
        "1594633312681-425c7b97ccd1",
        "Blush pink silk trousers with gathered ankles",
      ),
      unsplash(
        "1506629082955-511b1aa562c8",
        "Close up of a hand in the pocket of soft trousers",
      ),
    ],
    description:
      "Fluid silk crêpe trousers with soft front pleats, patch pockets and elasticated cuffs. Relaxed through the leg and gathered at the ankle.",
    details: [
      "100% silk crêpe",
      "Elasticated waist and cuffs",
      "Front patch pockets",
      "Relaxed fit",
      "Dry clean only",
      "Made in Italy",
    ],
    colors: [
      { name: "Blush", value: "#e3b3a3" },
      { name: "Ivory", value: "#efe9dd" },
    ],
    sizes: sized(["XS", "S", "M", "L"], [3, 5, 5, 2]),
  },
  {
    slug: "leather-strap-watch",
    reference: "AT-WAT-0012",
    name: "Leather strap watch",
    category: "Watches",
    price: 1750,
    images: [
      unsplash(
        "1524592094714-0f0654e20314",
        "Hand holding a minimalist watch with a grey leather strap",
      ),
      unsplash(
        "1544441893-675973e31985",
        "Flat lay of jeans, sneakers and a watch on a dark surface",
      ),
    ],
    description:
      "A 38 mm case with a clean, lacquered dial and slim baton hands. Swiss quartz movement on an interchangeable suede strap.",
    details: [
      "38 mm polished steel case",
      "Swiss quartz movement",
      "Sapphire crystal, water resistant to 50 m",
      "Interchangeable suede strap",
      "Two-year warranty",
    ],
    colors: [{ name: "Taupe", value: "#8c7b6b" }],
    sizes: oneSize(8),
  },
  {
    slug: "suede-bomber",
    reference: "AT-RTW-0398",
    name: "Suede bomber jacket",
    category: "Ready-to-wear",
    price: 2400,
    badge: "Exclusive",
    images: [
      unsplash(
        "1591047139829-d91aecb6caea",
        "Rust suede bomber jacket on a hanger",
      ),
      unsplash(
        "1487222477894-8943e31ef7b2",
        "A man wearing a brown leather jacket against a pink wall",
      ),
    ],
    description:
      "A lightweight bomber in brushed goat suede with ribbed trims and a utility sleeve pocket. Available exclusively online.",
    details: [
      "100% goat suede, silk lining",
      "Ribbed collar, cuffs and hem",
      "Utility pocket on the left sleeve",
      "Regular fit",
      "Specialist leather clean only",
      "Made in Italy",
    ],
    colors: [{ name: "Rust", value: "#a65a3a" }],
    sizes: sized(["S", "M", "L", "XL"], [0, 0, 1, 0]),
  },
  {
    slug: "atelier-top-handle",
    reference: "AT-BAG-0001",
    name: "Atelier top handle bag",
    category: "Bags",
    price: 2890,
    badge: "New",
    images: [
      unsplash(
        "1594223274512-ad4803739b7c",
        "Teal leather top handle bag with a gold push-lock beside sunglasses",
      ),
      unsplash(
        "1525450824786-227cbef70703",
        "A woman in a gingham coat and sunglasses on a sunny street",
      ),
    ],
    description:
      "Our signature silhouette, cut from grained calfskin and finished with a polished push-lock. Structured enough for the office, small enough for dinner after.",
    details: [
      "Grained calfskin with suede lining",
      "Detachable leather shoulder strap",
      "W 26 × H 19 × D 11 cm",
      "Made in Italy",
    ],
    colors: [
      { name: "Petrol", value: "#1d5c63" },
      { name: "Black", value: "#111111" },
      { name: "Cognac", value: "#9a5b2e" },
    ],
    sizes: oneSize(9),
  },
  {
    slug: "chevron-chain-bag",
    reference: "AT-BAG-0019",
    name: "Chevron chain bag",
    category: "Bags",
    price: 3150,
    images: [
      unsplash(
        "1566150905458-1bf1fc113f0d",
        "Blush leather shoulder bag with a chevron stripe and silver chain",
      ),
      unsplash(
        "1445205170230-053b83016050",
        "Clothes on a rail in a boutique window",
      ),
    ],
    description:
      "A structured flap bag in smooth calfskin, crossed with a hand-painted chevron and hung from a fine silver chain.",
    details: [
      "Smooth calfskin, leather lining",
      "Hand-painted chevron detail",
      "Silver-tone chain strap",
      "W 22 × H 14 × D 6 cm",
      "Made in Italy",
    ],
    colors: [{ name: "Blush", value: "#e9b4b8" }],
    sizes: oneSize(3),
  },
  {
    slug: "fringed-knit-poncho",
    reference: "AT-KNT-0204",
    name: "Fringed knit poncho",
    category: "Knitwear",
    price: 1290,
    images: [
      unsplash(
        "1434389677669-e08b4cac3105",
        "Cream open-knit poncho with fringe on a hanger",
      ),
      unsplash(
        "1558769132-cb1aea458c5e",
        "Neutral knitwear hanging on a rail beside dried pampas grass",
      ),
    ],
    description:
      "An open-stitch poncho knitted by hand in a cotton and cashmere blend, finished with a long fringe at the hem.",
    details: [
      "70% cotton, 30% cashmere",
      "Hand-knitted",
      "Fringed hem",
      "Hand wash cold, dry flat",
      "Made in Italy",
    ],
    colors: [{ name: "Cream", value: "#e9e0cf" }],
    sizes: oneSize(0),
  },
  {
    slug: "panelled-runner",
    reference: "AT-SHO-0402",
    name: "Panelled runner sneaker",
    category: "Shoes",
    price: 790,
    images: [
      unsplash(
        "1560769629-975ec94e6a86",
        "Pair of chunky sneakers on a white plinth",
      ),
      unsplash(
        "1525507119028-ed4c629a60a3",
        "Flat lay of denim, a white shirt and striped knitwear",
      ),
    ],
    description:
      "A chunky runner built from suede and technical mesh panels, on a lightweight sculpted sole.",
    details: [
      "Suede, mesh and leather upper",
      "Rubber sole",
      "Contrast laces",
      "Fits large: we suggest half a size down",
      "Made in Italy",
    ],
    colors: [{ name: "Multicolor", value: "#c8b9a6" }],
    sizes: sized(["39", "40", "41", "42", "43", "44"], [4, 6, 8, 5, 2, 0]),
  },
  {
    slug: "oxford-shirt",
    reference: "AT-RTW-0150",
    name: "Oxford cotton shirt",
    category: "Ready-to-wear",
    price: 590,
    images: [
      unsplash(
        "1558171813-4c088753af8f",
        "Pale blue cotton shirt draped over a wooden stool",
      ),
      unsplash(
        "1512436991641-6745cdb1723f",
        "Shirts and knitwear hanging on a clothing rail",
      ),
    ],
    description:
      "A relaxed shirt in washed Oxford cotton with mother-of-pearl buttons and a soft, unstructured collar.",
    details: [
      "100% cotton Oxford",
      "Mother-of-pearl buttons",
      "Relaxed fit",
      "Machine wash at 30°C",
      "Made in Portugal",
    ],
    colors: [{ name: "Sky", value: "#a9c3dc" }],
    sizes: sized(READY_TO_WEAR_SIZES, [6, 9, 12, 7, 4]),
  },
  {
    slug: "crystal-drop-earrings",
    reference: "AT-JWL-0144",
    name: "Crystal drop earrings",
    category: "Jewelry",
    price: 860,
    images: [
      unsplash(
        "1535632066927-ab7c9ab60908",
        "Crystal drop earrings on a green leaf",
      ),
      unsplash(
        "1566174053879-31528523f8ae",
        "A woman in a plum velvet dress wearing long crystal earrings",
      ),
    ],
    description:
      "Statement drops set with hand-cut crystals around a sapphire-blue centre stone. Made for evening.",
    details: [
      "Palladium-plated brass, glass crystals",
      "Clip-on fastening",
      "Length 6 cm",
      "Presented in a signature jewelry box",
      "Made in Italy",
    ],
    colors: [{ name: "Sapphire", value: "#24439a" }],
    sizes: oneSize(6),
  },
];
