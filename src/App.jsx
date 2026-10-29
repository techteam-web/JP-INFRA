import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import CinematicIntro from "./components/CinematicIntro";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import homeHeroImg from "./assets/jpinfra hero.png";
import brainwingLogo from "./assets/Brainwinglogo/brainwing.webp";
import { trackPageView } from "./lib/analytics";
import { initHeatmapTracking, setHeatmapPage } from "./lib/heatmap";

const Panorama = lazy(() => import("./pages/Panorama"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const FloorPlans = lazy(() => import("./pages/FloorPlans"));
const Amenities = lazy(() => import("./pages/Amenities"));
const Location = lazy(() => import("./components/Location"));

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
  location: { title: "Location", path: "/location" },
};

// Navbar label → screen
const SECTION_SCREENS = {
  "360°": "panorama",
  "About Us": "about",
  Gallery: "gallery",
  Amenities: "amenities",
  "Floor Plans": "floorplans",
  Location: "location",
  Contact: "contact",
};

function App() {
  const [screen, setScreen] = useState("home");
  // Logo preloader → scroll-driven intro → Home. "playing": only the
  // intro is shown; "leaving": Home dissolves in over the intro's last
  // frame; "done": the intro is unmounted and the screens below run exactly
  // as before.
  const [intro, setIntro] = useState("playing");
  const isFirstRender = useRef(true);
  const appRef = useRef(null);

  // The video's last frame is the same shot, in the same framing, as Home's
  // background (jpinfra hero.png). Handing off on that exact frame makes Home
  // read as the video simply coming to rest — one continuous picture, which
  // then sharpens into the full-resolution render as Home's logos and navbar
  // arrive. Decode the render up front so it's ready the moment it's needed.
  useEffect(() => {
    const img = new Image();
    img.src = homeHeroImg;
    img.decode?.().catch(() => {});
  }, []);

  const handleIntroEnd = (atEnd) => {
    if (atEnd) setIntro((s) => (s === "playing" ? "leaving" : s));
  };

  useLayoutEffect(() => {
    if (intro !== "leaving") return;
    const tween = gsap.fromTo(
      appRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: "power1.inOut", onComplete: () => setIntro("done") }
    );
    return () => tween.kill();
  }, [intro]);

  useEffect(() => {
    // Skip the very first mount: gtag's own 'config' call in index.html
    // already sends the initial "/" pageview, so firing again here would
    // double-count the Home screen. Every screen change after that is a
    // real virtual pageview.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Heatmap tracking has no such double-count concern (it isn't tied
      // to gtag's own pageview), so it starts from Home immediately.
      initHeatmapTracking(screen);
      return;
    }

    const meta = SCREEN_META[screen] ?? { title: screen, path: `/${screen}` };
    trackPageView(meta.title, meta.path);
    setHeatmapPage(screen);
  }, [screen]);

  // Section pages go back to whichever screen opened them: Home's navbar or
  // Explore.
  const [returnTo, setReturnTo] = useState("explore");
  const openFrom = (from) => (target) => {
    setReturnTo(from);
    setScreen(target);
  };
  const fromExplore = openFrom("explore");
  const goBack = () => setScreen(returnTo);

  let content;
  if (screen === "home") {
    content = (
      <Home
        animate={intro !== "playing"}
        onNavigate={(label) => SECTION_SCREENS[label] && openFrom("home")(SECTION_SCREENS[label])}
      />
    );
  } else if (screen === "explore") {
    content = (
      <Explore
        onBack={() => setScreen("home")}
        onOpen360={() => fromExplore("panorama")}
        onOpenGallery={() => fromExplore("gallery")}
        onOpenAbout={() => fromExplore("about")}
        onOpenContact={() => fromExplore("contact")}
        onOpenFloorPlans={() => fromExplore("floorplans")}
        onOpenAmenities={() => fromExplore("amenities")}
        onOpenLocation={() => fromExplore("location")}
      />
    );
  } else if (screen === "panorama") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Panorama onBack={goBack} />
      </Suspense>
    );
  } else if (screen === "about") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <AboutUs onBack={goBack} />
      </Suspense>
    );
  } else if (screen === "contact") {
    content = (
      <Suspense fallback={null}>
        <Contact onBack={goBack} />
      </Suspense>
    );
  } else if (screen === "floorplans") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <FloorPlans onBack={goBack} />
      </Suspense>
    );
  } else if (screen === "amenities") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Amenities onBack={goBack} />
      </Suspense>
    );
  } else if (screen === "location") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-[#eef2f6]" />}>
        <Location label="Location" active onBack={goBack} />
      </Suspense>
    );
  } else {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Gallery onBack={goBack} />
      </Suspense>
    );
  }

  // The intro scrolls the window itself, so it lives outside the fixed-height,
  // overflow-hidden screen wrapper. It is also the preloader: the Endgame logo
  // draws itself while the frames download, then Enter Full Screen opens it.
  return (
    <>
      {intro !== "done" && (
        <main>
          <CinematicIntro onEndChange={handleIntroEnd} />
        </main>
      )}
      {intro !== "playing" && (
        <div
          ref={appRef}
          className={`h-[100svh] w-full overflow-hidden bg-navy-950 ${
            intro === "leaving" ? "fixed inset-0 z-50" : ""
          }`}
        >
          {content}
        </div>
      )}
      {/* Brainwing credit, bottom right: lifted above Home's navbar where
          they'd meet, dark over the Location page's light map, and on phones
          shown only on the intro and Home */}
      <img
        src={brainwingLogo}
        alt="Powered by Brainwing Innovations"
        width="420"
        height="112"
        className={`jp-credit ${intro !== "playing" && screen === "home" ? "jp-credit--lifted" : ""} ${
          intro !== "playing" && screen !== "home" ? "jp-credit--page" : ""
        } ${intro !== "playing" && screen === "location" ? "jp-credit--dark" : ""}`}
      />
    </>
  );
}

export default App;
