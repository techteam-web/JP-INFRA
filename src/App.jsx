import { Suspense, lazy, startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import CinematicIntro from "./components/CinematicIntro";
import BrandCurtain from "./components/BrandCurtain";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import homeHeroImg from "./assets/jpinfra hero.png";
import brainwingLogo from "./assets/Brainwinglogo/brainwing.webp";
import aboutImg from "./assets/aboutUs.png";
import contactImg from "./assets/gallery/Meeting Room.webp";
import { trackPageView } from "./lib/analytics";
import { initHeatmapTracking, setHeatmapPage } from "./lib/heatmap";

const loadPanorama = () => import("./pages/Panorama");
const loadGallery = () => import("./pages/Gallery");
const loadAboutUs = () => import("./pages/AboutUs");
const loadContact = () => import("./pages/Contact");
const loadFloorPlans = () => import("./pages/FloorPlans");
const loadAmenities = () => import("./pages/Amenities");
const loadLocation = () => import("./components/Location");
const PAGE_MODULES = [loadGallery, loadAmenities, loadAboutUs, loadFloorPlans, loadContact, loadLocation, loadPanorama];

const Panorama = lazy(loadPanorama);
const Gallery = lazy(loadGallery);
const AboutUs = lazy(loadAboutUs);
const Contact = lazy(loadContact);
const FloorPlans = lazy(loadFloorPlans);
const Amenities = lazy(loadAmenities);
const Location = lazy(loadLocation);

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
  // Every section change plays the brand curtain (BrandCurtain): it covers the screen,
  // the screen is swapped behind it (inside a transition, so a page still loading keeps
  // the curtain closed rather than showing a blank frame), then it reveals. Clicks made
  // while it runs are ignored.
  const [curtainTarget, setCurtainTarget] = useState(null);
  const show = (target) => {
    if (curtainTarget || target === screen) return;
    setCurtainTarget(target);
  };
  const openFrom = (from) => (target) => {
    setReturnTo(from);
    show(target);
  };
  const fromExplore = openFrom("explore");
  const goBack = () => show(returnTo);

  // Once Home is up, quietly fetch every page and its opening photo while the
  // visitor looks around, so each section opens straight away.
  useEffect(() => {
    if (intro !== "done") return undefined;
    const preload = () => {
      PAGE_MODULES.forEach((load) => load());
      Promise.all([import("./data/gallery"), import("./data/amenities")]).then(([g, a]) => {
        const firsts = [g.GALLERY_IMAGES[0]?.image, a.AMENITIES[0]?.image, aboutImg, contactImg];
        for (const src of firsts.filter(Boolean)) {
          const img = new Image();
          img.src = src;
          img.decode?.().catch(() => {});
        }
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preload, 600);
    return () => window.clearTimeout(id);
  }, [intro]);

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
        onBack={() => show("home")}
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
      <Panorama onBack={goBack} />
    );
  } else if (screen === "about") {
    content = (
      <AboutUs onBack={goBack} />
    );
  } else if (screen === "contact") {
    content = (
      <Contact onBack={goBack} />
    );
  } else if (screen === "floorplans") {
    content = (
      <FloorPlans onBack={goBack} onOpen360={() => openFrom("floorplans")("panorama")} />
    );
  } else if (screen === "amenities") {
    content = (
      <Amenities onBack={goBack} />
    );
  } else if (screen === "location") {
    content = (
      <Location label="Location" active onBack={goBack} />
    );
  } else {
    content = (
      <Gallery onBack={goBack} />
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
          {/* One boundary for every screen. Screens change inside a transition (behind
              the curtain), so while a page that isn't loaded yet is fetched, the current
              screen stays on view — never a blank frame. */}
          <Suspense fallback={null}>{content}</Suspense>
        </div>
      )}
      <BrandCurtain
        pageRef={appRef}
        target={curtainTarget}
        screen={screen}
        onCovered={(target) => startTransition(() => setScreen(target))}
        onDone={() => setCurtainTarget(null)}
      />
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
