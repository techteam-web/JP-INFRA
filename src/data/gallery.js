// The Gallery shows the project's renders only: the building elevations and the two
// clubhouses. Add more elevation renders by importing them here, in viewing order.
// import elevation from "../assets/jpinfra hero.png";
import clubMarvel from "../assets/gallery/CLUB-MARVEL.jpg";
import clubNorth from "../assets/gallery/Club North.webp";
// the building's elevation: the Home page's own wide render (1928 × 1085), so it fills the
// screen. (The square Elevation Render.webp is still in assets/gallery/, unused.)
import elevation from "../assets/home-hero.webp";

export const GALLERY_IMAGES = [
  { id: "elevation", image: elevation },
  { id: "club-marvel", name: "Club Marvel", image: clubMarvel },
  { id: "club-north", name: "Club North", image: clubNorth },
];

