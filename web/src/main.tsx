import { createRoot } from "react-dom/client";
import App from "./AppRouter";
import "./index.css";
// Load project-level global variables and base rules.
// Keep this separate from the generated Tailwind output (index.css)
// so we don't edit generated files and risk losing customizations.
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(<App />);
  