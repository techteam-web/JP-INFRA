// Drop any number of images into src/assets/gallery/ — they're picked up
// automatically, sorted by filename, no list to maintain by hand.
const modules = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
});

export const GALLERY_IMAGES = Object.keys(modules)
  .sort()
  .map((key) => modules[key]);
