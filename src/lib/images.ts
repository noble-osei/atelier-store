export type Image = {
  src: string;
  alt: string;
};

// Sample photography comes from Unsplash and is served through next/image.
export function unsplash(id: string, alt: string): Image {
  return { src: `https://images.unsplash.com/photo-${id}`, alt };
}
