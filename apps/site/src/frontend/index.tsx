(window as any).global = window;

import "./ui-kit/index";

/* @refresh reload */
import { render } from "solid-js/web";
import { Header } from "./components/header";
import { Root, Page } from "./ui-kit";
import { Routes, Router } from "@solidjs/router";
import { Show } from "solid-js";
import { GlobalStore, useLoader } from "./store/global";
import { Loader } from "./components/loader";
import { NotificationBar } from "./components/notification-bar";
import { AssetsStore } from "./store/assets";
import { OriginDataStore } from "./store/origins";
import { renderRoutes } from "./routes";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

function LoaderWrapper() {
  const loaderVisible = useLoader();

  return (
    <Show when={loaderVisible()}>
      <Loader />
    </Show>
  );
}

export function App() {
  return (
    <Router>
      <GlobalStore>
        <AssetsStore>
          <OriginDataStore>
            <Root>
              <Page>
                <NotificationBar />
                <Header />
                <Routes>{renderRoutes()}</Routes>
              </Page>
              <LoaderWrapper />
            </Root>
          </OriginDataStore>
        </AssetsStore>
      </GlobalStore>
    </Router>
  );
}

render(App, root!);
