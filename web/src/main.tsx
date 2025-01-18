import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("entry")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
