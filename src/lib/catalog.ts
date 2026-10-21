// Editorial content for the storefront (campaigns, collections, journal).
// Products live in ./products.ts.
import { unsplash, type Image } from "./images";

export type Collection = {
  slug: string;
  title: string;
  eyebrow: string;
  image: Image;
};

export type Story = {
  slug: string;
  eyebrow: string;
  title: string;
  excerpt: string;
  image: Image;
};

export const navigation = [
  { label: "New In", href: "/new-arrivals" },
  { label: "Women", href: "/#collections" },
  { label: "Men", href: "/#collections" },
  { label: "Bags", href: "/categories/bags" },
  { label: "Accessories", href: "/#categories" },
  { label: "Journal", href: "/#journal" },
] as const;

export const hero = {
  eyebrow: "Autumn–Winter 2026",
  title: "The Quiet Hour",
  description:
    "Soft tailoring, brushed wool and leather worn in by the city. A collection made for the long walk home.",
  images: [
    unsplash(
      "1485968579580-b6d095142e6e",
      "A woman in a tartan wool coat walking down a city street",
    ),
    unsplash(
      "1539109136881-3be0616acf4b",
      "A woman in a pale blue coat in a cathedral square",
    ),
  ],
};

export const collections: Collection[] = [
  {
    slug: "women",
    eyebrow: "Women",
    title: "Evening Dresses",
    image: unsplash(
      "1595777457583-95e059d581b8",
      "A woman in a flowing red gown in a garden",
    ),
  },
  {
    slug: "men",
    eyebrow: "Men",
    title: "Modern Tailoring",
    image: unsplash(
      "1617137968427-85924c800a22",
      "A man in a navy suit standing outside a glass building",
    ),
  },
  {
    slug: "bags",
    eyebrow: "Bags",
    title: "The New Bags",
    image: unsplash(
      "1575032617751-6ddec2089882",
      "A hand holding a burgundy croc-effect pouch bag by its strap",
    ),
  },
];

export const campaign = {
  eyebrow: "The Evening Edit",
  title: "After Dark",
  description:
    "Sculpted velvet, bare shoulders and a single statement earring.",
  image: unsplash(
    "1566174053879-31528523f8ae",
    "A woman in an off-the-shoulder plum velvet dress against a violet wall",
  ),
};

export const categories: Collection[] = [
  {
    slug: "shoes",
    eyebrow: "Shop",
    title: "Sneakers",
    image: unsplash(
      "1560769629-975ec94e6a86",
      "Pair of chunky sneakers on a white plinth",
    ),
  },
  {
    slug: "jewelry",
    eyebrow: "Shop",
    title: "Fine Jewelry",
    image: unsplash(
      "1599643478518-a784e5dc4c8f",
      "Gold pendant necklace with a blue stone",
    ),
  },
  {
    slug: "knitwear",
    eyebrow: "Shop",
    title: "Knitwear",
    image: unsplash(
      "1558769132-cb1aea458c5e",
      "Neutral knitwear hanging on a rail beside dried pampas grass",
    ),
  },
  {
    slug: "earrings",
    eyebrow: "Shop",
    title: "Earrings",
    image: unsplash(
      "1535632066927-ab7c9ab60908",
      "Crystal drop earrings on a green leaf",
    ),
  },
  {
    slug: "shirts",
    eyebrow: "Shop",
    title: "Shirting",
    image: unsplash(
      "1558171813-4c088753af8f",
      "Pale blue cotton shirt draped over a wooden stool",
    ),
  },
];

export const stories: Story[] = [
  {
    slug: "the-art-of-tailoring",
    eyebrow: "Craft",
    title: "The art of the perfect shoulder",
    excerpt:
      "Inside the workshop where every jacket passes through thirty pairs of hands.",
    image: unsplash(
      "1507679799987-c73779587ccf",
      "A man buttoning a navy double-breasted suit jacket",
    ),
  },
  {
    slug: "summer-in-the-city",
    eyebrow: "Campaign",
    title: "A season between two cities",
    excerpt:
      "Behind the scenes of the Autumn–Winter shoot, from Milan to the coast.",
    image: unsplash(
      "1617922001439-4a2e6562f328",
      "A woman in a wide brimmed hat and fitted dress under palm trees",
    ),
  },
  {
    slug: "the-wardrobe",
    eyebrow: "Style notes",
    title: "Ten pieces for a lasting wardrobe",
    excerpt:
      "The coats, knits and leather goods our stylists return to every year.",
    image: unsplash(
      "1490481651871-ab68de25d43d",
      "Neutral toned clothes hanging on a minimal rail",
    ),
  },
];

export const services = [
  {
    title: "Complimentary shipping",
    description: "Free express delivery on every order.",
  },
  {
    title: "Returns within 30 days",
    description: "Easy returns and exchanges, collected from your door.",
  },
  {
    title: "Signature packaging",
    description: "Every order arrives gift-wrapped in our signature box.",
  },
  {
    title: "Book an appointment",
    description: "Private styling in store or by video call.",
  },
];
