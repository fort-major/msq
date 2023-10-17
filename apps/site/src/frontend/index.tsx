// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;

/* @refresh reload */
import { LoginPage } from "./pages/login";
import { Match, Switch, render } from "solid-js/web";
import { Header } from "./components/header";
import { Root, Page, CabinetContent } from "./styles";
import { MyMasksPage } from "./pages/cabinet/my-masks";
import { createRouter } from "@nanostores/router";
import { useStore } from "@nanostores/solid";
import { CabinetNav } from "./components/cabinet-nav";

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

  const cabinet = (
    <>
      <CabinetNav />
      <CabinetContent>
        <Switch fallback={<p>404</p>}>
          <Match when={page()?.route === "myMasks"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "myAssets"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "mySessions"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "myLinks"}>
            <MyMasksPage />
          </Match>
        </Switch>
      </CabinetContent>
    </>
  );

  return (
    <Root>
      <Header />
      <Page>
        <Switch fallback={cabinet}>
          <Match when={page()?.route === "login"}>
            <LoginPage />
          </Match>
        </Switch>
      </Page>
    </Root>
  );
}

render(Router, root!);
