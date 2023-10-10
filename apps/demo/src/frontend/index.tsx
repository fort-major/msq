// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;

/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route, Routes } from "@solidjs/router";
import { IndexPage } from "./pages/index/index";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

if (root === null) {
  throw new Error("Unreacheable! Root element not found");
}

render(
  () => (
    <Router>
      <Routes>
        <Route path="/" component={IndexPage} />
      </Routes>
    </Router>
  ),
  root,
);
