import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TrustConcept } from "./components/TrustConcept";
import { HowItWorks } from "./components/HowItWorks";
import { Verification } from "./components/Verification";
import { Issuers } from "./components/Issuers";
import { Technology } from "./components/Technology";
import { Progress } from "./components/Progress";
import { Footer } from "./components/Footer";
// @ts-expect-error - allow side-effect CSS import without type declarations
import "./App.css";

function App() {
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
