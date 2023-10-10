// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;

/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route, Routes } from "@solidjs/router";
import { IndexPage } from "./pages/index/index";
import { LoginPage } from "./pages/login";
import { WalletPage } from "./pages/wallet";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(
  () => (
    <Router>
      <Routes>
        <Route path="/" component={IndexPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/wallet" component={WalletPage} />
      </Routes>
    </Router>
  ),
  root!,
);
