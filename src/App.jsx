import { Suspense, lazy, useState } from "react";
import Preloader from "./components/Preloader";
import Home from "./pages/Home";
import Explore from "./pages/Explore";

const Panorama = lazy(() => import("./pages/Panorama"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const FloorPlans = lazy(() => import("./pages/FloorPlans"));
const Amenities = lazy(() => import("./pages/Amenities"));

function App() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");

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
