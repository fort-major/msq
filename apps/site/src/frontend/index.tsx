(window as any).global = window;

import "./ui-kit/index";

/* @refresh reload */
import { render } from "solid-js/web";
import { Header } from "./components/header";
import { Root, Page } from "./ui-kit";
import { Routes, Route, Router } from "@solidjs/router";
import { Show } from "solid-js";
import { MyMasksPage } from "./pages/cabinet/my-masks";
import { GlobalStore, useLoader } from "./store/global";
import { LoginPage } from "./pages/integration/login";
import { MySessionsPage } from "./pages/cabinet/my-sessions";
import { MyLinksPage } from "./pages/cabinet/my-links";
import { MyAssetsPage } from "./pages/cabinet/my-assets";
import { Loader } from "./components/loader";
import { StatisticsPage } from "./pages/statistics";
import { NotificationBar } from "./components/notification-bar";
import { SendPage } from "./pages/cabinet/my-assets/send";
import { PaymentPage } from "./pages/integration/payment";
import { PaymentCheckoutPage } from "./pages/integration/payment/checkout";
import { IndexPage } from "./pages/index";
import { AssetsStore } from "./store/assets";
import { OriginDataStore } from "./store/origins";
import {
  Error404Page,
  ErrorEnableMsqPage,
  ErrorInstallMetaMaskPage,
  ErrorMSQConnectionRejectedPage,
  ErrorMobileNotSupportedPage,
  ErrorUnblockMsqPage,
} from "./pages/error";
import { UrlBasedPaymentPage } from "./pages/integration/payment/url-payment";
import { ICRC35Page } from "./pages/icrc35";
import { TxnHistoryPage } from "./pages/cabinet/my-assets/txn-history";

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
                <Routes>
                  <Route path="/" component={IndexPage}>
                    <Route path="/install-metamask" component={ErrorInstallMetaMaskPage} />
                    <Route path="/unblock-msq" component={ErrorUnblockMsqPage} />
                    <Route path="/enable-msq" component={ErrorEnableMsqPage} />
                    <Route path="/mobile-not-supported" component={ErrorMobileNotSupportedPage} />
                    <Route path="/connection-rejected" component={ErrorMSQConnectionRejectedPage} />

                    <Route path="/icrc-35" component={ICRC35Page} />

                    <Route path="/integration">
                      <Route path="/login" component={LoginPage} />
                      <Route path="/pay">
                        <Route path="/" component={PaymentPage} />
                        <Route path="/checkout" component={PaymentCheckoutPage} />
                      </Route>
                    </Route>
                    <Route path="/pay">
                      <Route path="/" component={UrlBasedPaymentPage} />
                      <Route path="/send" component={SendPage} />
                    </Route>
                    <Route path="/cabinet">
                      <Route path="/my-masks" component={MyMasksPage} />
                      <Route path="/my-sessions" component={MySessionsPage} />
                      <Route path="/my-links" component={MyLinksPage} />
                      <Route path="/my-assets">
                        <Route path="/" component={MyAssetsPage} />
                        <Route path="/send" component={SendPage} />
                        <Route path="/history" component={TxnHistoryPage} />
                      </Route>
                    </Route>
                    <Route path="/statistics" component={StatisticsPage} />
                    <Route path="*" component={Error404Page} />
                  </Route>
                </Routes>
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
