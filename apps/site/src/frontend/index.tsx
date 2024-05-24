(window as any).global = window;

import "./ui-kit/index";

/* @refresh reload */
import { render } from "solid-js/web";
import { Header } from "./components/header";
import { Root, Page } from "./ui-kit";
import { Router, useLocation, useNavigate } from "@solidjs/router";
import { Show, createEffect, createSignal } from "solid-js";
import { GlobalStore, useLoader } from "./store/global";
import { Loader } from "./components/loader";
import { NotificationBar } from "./components/notification-bar";
import { AssetsStore } from "./store/assets";
import { OriginDataStore } from "./store/origins";
import { findRoute, getSolidRoutes } from "./routes";
import { IChildren } from "./utils";
import { DISCORD_LINK, debugStringify, logError } from "@fort-major/msq-shared";
import { ErrorPage } from "./pages/error";
import { EIconKind } from "./ui-kit/icon";
import { IndexPage } from "./pages/index";
import { ICRC35Page } from "./pages/icrc35";
import { ContactUsBtn } from "./components/contact-us-btn";

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

export function App(props: IChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const [barVisible, setBarVisible] = createSignal(false);

  createEffect(() => {
    const route = findRoute(location.pathname);

    if (!route) {
      navigate("/404");
      return;
    }

    if (route.redirectTo) {
      navigate(route.redirectTo);
      return;
    }

    setBarVisible(!!findRoute(location.pathname)?.features?.showBetaDisclaimer);
  });

  try {
    return (
      <GlobalStore>
        <AssetsStore>
          <OriginDataStore>
            <Root>
              <Page barVisible={barVisible()}>
                <NotificationBar barVisible={barVisible()} />
                <Header />
                {props.children}
              </Page>
              <LoaderWrapper />
              <ContactUsBtn />
            </Root>
          </OriginDataStore>
        </AssetsStore>
      </GlobalStore>
    );
  } catch (e) {
    logError(e);

    return (
      <ErrorPage
        header="Houston, we have a problem"
        text="Something unexpected just happened! Refresh the page to make it work again or consider reporting the error to us."
        error={debugStringify(e)}
        button={{
          text: "Report the Error",
          icon: EIconKind.ArrowRightUp,
          action: () => window.open(DISCORD_LINK, "_blank"),
        }}
      />
    );
  }
}

render(() => <Router root={App}>{getSolidRoutes()}</Router>, root!);
