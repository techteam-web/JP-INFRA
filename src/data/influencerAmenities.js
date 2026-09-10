// Picks up every photo in src/assets/Influencer Aminities-optimized/ (a
// resized/recompressed copy of the originals — see amenities.js for why).
// Filenames are expected in "Name - Activity" form (e.g. "Saiee -
// Gym.webp") so the caption can be split out automatically.
const modules = import.meta.glob(
  "../assets/Influencer Aminities-optimized/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default" }
);

export const INFLUENCER_AMENITIES = Object.keys(modules)
  .sort()
  .map((key) => {
    const file = key.split("/").pop().replace(/\.[^.]+$/, "");
    const [rawName, rawActivity] = file.split(/\s*-\s*/);
    return {
      image: modules[key],
      id: file,
      name: (rawName || file).trim(),
      activity: (rawActivity || "").trim(),
    };
  });
