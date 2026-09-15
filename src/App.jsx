import { Suspense, lazy, useEffect, useRef, useState } from "react";
import Preloader from "./components/Preloader";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import { trackPageView } from "./lib/analytics";

const Panorama = lazy(() => import("./pages/Panorama"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const FloorPlans = lazy(() => import("./pages/FloorPlans"));
const Amenities = lazy(() => import("./pages/Amenities"));

// One distinct GA4 page identity per screen — this app has no URL routing,
// so without this every screen would be reported as the same "/" page.
const SCREEN_META = {
  home: { title: "Home", path: "/" },
  explore: { title: "Explore", path: "/explore" },
  panorama: { title: "360 View", path: "/360-view" },
  gallery: { title: "Gallery", path: "/gallery" },
  about: { title: "About Us", path: "/about-us" },
  contact: { title: "Contact", path: "/contact" },
  floorplans: { title: "Floor Plans", path: "/floor-plans" },
  amenities: { title: "Amenities", path: "/amenities" },
};

function App() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first mount: gtag's own 'config' call in index.html
    // already sends the initial "/" pageview, so firing again here would
    // double-count the Home screen. Every screen change after that is a
    // real virtual pageview.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const meta = SCREEN_META[screen] ?? { title: screen, path: `/${screen}` };
    trackPageView(meta.title, meta.path);
  }, [screen]);

  const backToExplore = () => setScreen("explore");

  let content;
  if (screen === "home") {
    content = <Home animate={loaded} onExplore={() => setScreen("explore")} />;
  } else if (screen === "explore") {
    content = (
      <Explore
        onBack={() => setScreen("home")}
        onOpen360={() => setScreen("panorama")}
        onOpenGallery={() => setScreen("gallery")}
        onOpenAbout={() => setScreen("about")}
        onOpenContact={() => setScreen("contact")}
        onOpenFloorPlans={() => setScreen("floorplans")}
        onOpenAmenities={() => setScreen("amenities")}
      />
    );
  } else if (screen === "panorama") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Panorama onBack={backToExplore} />
      </Suspense>
    );
  } else if (screen === "about") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <AboutUs onBack={backToExplore} />
      </Suspense>
    );
  } else if (screen === "contact") {
    content = (
      <Suspense fallback={null}>
        <Contact onBack={backToExplore} />
      </Suspense>
    );
  } else if (screen === "floorplans") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <FloorPlans onBack={backToExplore} />
      </Suspense>
    );
  } else if (screen === "amenities") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Amenities onBack={backToExplore} />
      </Suspense>
    );
  } else {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Gallery onBack={backToExplore} />
      </Suspense>
    );
  }

  return (
    <div className="h-[100svh] w-full overflow-hidden bg-navy-950">
      {content}
      <Preloader onFinish={() => setLoaded(true)} />
    </div>
  );
}

export default App;
