import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TrustConcept } from "./components/TrustConcept";
import { HowItWorks } from "./components/HowItWorks";
import { Verification } from "./components/Verification";
import { Issuers } from "./components/Issuers";
import { Technology } from "./components/Technology";
import { Progress } from "./components/Progress";
import { Footer } from "./components/Footer";
import "./App.css";

// The /deploy route is a local operational route, only available when the
// app is started with VITE_ENABLE_DEPLOY_ROUTE=true (e.g. `npm run dev:deploy`).
// It is intentionally absent from standard production builds.
import { DeployRoute } from "./components/DeployRoute";

const DEPLOY_ROUTE_ENABLED =
  import.meta.env.VITE_ENABLE_DEPLOY_ROUTE === "true";
const IS_DEPLOY_PATH = window.location.pathname === "/deploy";

function App() {
  if (DEPLOY_ROUTE_ENABLED && IS_DEPLOY_PATH) {
    return (
      <div className="just-proof-app">
        <Header />
        <main>
          <DeployRoute />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="just-proof-app">
      <Header />
      <main>
        <Hero />
        <TrustConcept />
        <HowItWorks />
        <Verification />
        <Issuers />
        <Technology />
        <Progress />
      </main>
      <Footer />
    </div>
  );
}

export default App;
