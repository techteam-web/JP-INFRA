import { Suspense, lazy, useState } from "react";
import Preloader from "./components/Preloader";
import Home from "./pages/Home";
import Explore from "./pages/Explore";

const Panorama = lazy(() => import("./pages/Panorama"));
const Gallery = lazy(() => import("./pages/Gallery"));

function App() {
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState("home");

  let content;
  if (screen === "home") {
    content = <Home animate={loaded} onExplore={() => setScreen("explore")} />;
  } else if (screen === "explore") {
    content = (
      <Explore
        onBack={() => setScreen("home")}
        onOpen360={() => setScreen("panorama")}
        onOpenGallery={() => setScreen("gallery")}
      />
    );
  } else if (screen === "panorama") {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Panorama onBack={() => setScreen("explore")} />
      </Suspense>
    );
  } else {
    content = (
      <Suspense fallback={<div className="h-[100svh] w-full bg-navy-950" />}>
        <Gallery onBack={() => setScreen("explore")} />
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
