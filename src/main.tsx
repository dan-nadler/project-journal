import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import { Notes } from "./Notes";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/notes" element={<Notes />} />
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>,
);
