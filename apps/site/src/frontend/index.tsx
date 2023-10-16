// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;

/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route, Routes, Navigate } from "@solidjs/router";
import { LoginPage } from "./pages/login";
import { WalletPage } from "./pages/wallet";
import { Header } from "./components/header";
import { Root, Page, CabinetContent } from "./styles";
import { MyMasksPage } from "./pages/cabinet/my-masks";
import { CabinetNav } from "./components/cabinet-nav";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(
  () => (
    <Root>
      <Header />
      <Page>
        <Router>
          <Routes>
            <Route path="*" element={<Navigate href={"/"} />} />
            <Route path="/my-masks" component={MyMasksPage} />
            <Route path="/my-assets" component={MyMasksPage} />
            <Route path="/my-sessions" component={MyMasksPage} />
            <Route path="/my-links" component={MyMasksPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/wallet" component={WalletPage} />
          </Routes>
        </Router>
      </Page>
    </Root>
  ),
  root!,
);
