// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;

/* @refresh reload */
import { LoginPage } from "./pages/login";
import { Match, Switch, render } from "solid-js/web";
import { Header } from "./components/header";
import { Root, Page } from "./styles";
import { createRouter } from "@nanostores/router";
import { useStore } from "@nanostores/solid";
import { lazy } from "solid-js";
const Cabinet = lazy(() => import("./pages/cabinet"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

export const $router = createRouter({
  myMasks: "/my-masks",
  myAssets: "/my-assets",
  mySessions: "/my-sessions",
  myLinks: "/my-links",

  login: "/login",
});

export function Router() {
  const page = useStore($router);

  return (
    <Root>
      <Header />
      <Page>
        <Switch fallback={<Cabinet />}>
          <Match when={page()?.route === "login"}>
            <LoginPage />
          </Match>
        </Switch>
      </Page>
    </Root>
  );
}

render(Router, root!);
