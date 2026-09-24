import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { TrustConcept } from './components/TrustConcept';
import { HowItWorks } from './components/HowItWorks';
import { Demo } from './demo/Demo';
import './App.css';
export default function PublicApp() {
  return <div className="just-proof-app"><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{window.location.pathname.replace(/\/$/, '') === '/demo' ? <Demo /> : <><Hero /><TrustConcept /><HowItWorks /><section><h2 className="section-title">Try the intended experience</h2><p>A browser-local simulation. No proof, wallet or transaction.</p><a className="btn btn-primary" href="/demo">Open interactive demonstration</a></section></>}</main><Footer /></div>;
}
