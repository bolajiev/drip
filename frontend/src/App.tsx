import { HashRouter, Routes, Route } from "react-router-dom";

import { Landing } from "./pages/Landing";
import { Docs } from "./pages/Docs";
import { AppShell } from "./pages/AppShell";
import { SubscribePage } from "./pages/SubscribePage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="/s/:planId" element={<SubscribePage />} />
      </Routes>
    </HashRouter>
  );
}
