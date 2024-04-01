import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import { Notes } from "./Notes";
import { Settings } from "./Settings";
import { ProjectSettings } from "./ProjectSettings";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/notes" element={<Notes />} />
      <Route path="/project-settings" element={<ProjectSettings />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>,
);
