import { byName, imageName } from "./imageName";

// Drop any number of images into src/assets/gallery/ — they're picked up
// automatically, sorted by name, no list to maintain by hand. The on-screen
// name comes from the filename (see imageName.js).
const modules = import.meta.glob("../assets/gallery/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}", {
  eager: true,
  import: "default",
});

export const GALLERY_IMAGES = Object.keys(modules)
  .map((key) => {
    const file = key.split("/").pop().replace(/\.[^.]+$/, "");
    return { image: modules[key], name: imageName(file), id: file };
  })
  .sort(byName);
