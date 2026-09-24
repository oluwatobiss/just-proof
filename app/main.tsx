import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import PublicApp from "./PublicApp";
export const App = import.meta.env.VITE_ENABLE_DEPLOY_ROUTE === "true" && window.location.pathname === "/deploy"
  ? lazy(() => import("./App")) : PublicApp;
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Loading page…</p>}><App /></Suspense>
  </StrictMode>,
);
