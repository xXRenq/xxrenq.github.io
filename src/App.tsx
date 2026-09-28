import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Tools } from "./pages/Tools";
import { Projects } from "./pages/Projects";
import { Games } from "./pages/Games";
import { Links } from "./pages/Links";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-base text-ink">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/games" element={<Games />} />
          <Route path="/links" element={<Links />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
