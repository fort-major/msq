import { Component, For, Show } from "solid-js";
import { IndexPage } from "./pages/index/index";
import {
  Error404Page,
  ErrorAssetNotFoundPage,
  ErrorEnableMsqPage,
  ErrorInstallMetaMaskPage,
  ErrorMSQConnectionRejectedPage,
  ErrorMobileNotSupportedPage,
  ErrorUnblockMsqPage,
} from "./pages/error";
import { ICRC35Page } from "./pages/icrc35";
import { LoginPage } from "./pages/integration/login";
import { PaymentPage } from "./pages/integration/payment";
import { PaymentCheckoutPage } from "./pages/integration/payment/checkout";
import { UrlBasedPaymentPage } from "./pages/integration/payment/url-payment";
import { SendPage } from "./pages/cabinet/my-assets/send";
import { MyMasksPage } from "./pages/cabinet/my-masks";
import { MySessionsPage } from "./pages/cabinet/my-sessions";
import { MyLinksPage } from "./pages/cabinet/my-links";
import { MyAssetsPage } from "./pages/cabinet/my-assets";
import { StatisticsPage } from "./pages/statistics";
import { Route, useLocation } from "@solidjs/router";
import { JSX } from "solid-js/web/types/jsx";
import { unreacheable } from "@fort-major/msq-shared";

export interface IRoute {
  parent?: IRoute;
  component?: Component;
  ["/"]?: Record<string, IRoute>;
  path?: string;
  features?: IRouteFeatures;
  render?: () => JSX.Element;
  redirectTo?: string;
}

export const ROOT = {
  component: IndexPage,
  redirectTo: "/cabinet/my-assets",

  "/": {
    // ERRORS
    "install-metamask": {
      component: ErrorInstallMetaMaskPage,
    },
    "unblock-msq": {
      component: ErrorUnblockMsqPage,
    },
    "enable-msq": {
      component: ErrorEnableMsqPage,
    },
    "mobile-not-supported": {
      component: ErrorMobileNotSupportedPage,
      ...enableFeatures("mobile"),
    },
    "connection-rejected": {
      component: ErrorMSQConnectionRejectedPage,
    },
    "token-not-found": {
      component: ErrorAssetNotFoundPage,
    },

    // ICRC-35
    "icrc-35": {
      component: ICRC35Page,
      ...enableFeatures("mobile"),
    },

    // INTEGRATION
    integration: {
      "/": {
        login: {
          component: LoginPage,
        },
        pay: {
          component: PaymentPage,
          ...enableFeatures("mobile"),
          "/": {
            checkout: {
              component: PaymentCheckoutPage,
            },
          },
        },
      },
    },

    // URL-BASED PAYMENT
    pay: {
      component: UrlBasedPaymentPage,
      ...enableFeatures("mobile"),

      "/": {
        send: {
          component: SendPage,
        },
      },
    },
  },

  // MSQ USER PERSONAL CABINET
  cabinet: {
    redirectTo: "/cabinet/my-assets",

    "/": {
      "my-masks": {
        component: MyMasksPage,
      },
      "my-sessions": {
        component: MySessionsPage,
      },
      "my-links": {
        component: MyLinksPage,
      },
      "my-assets": {
        component: MyAssetsPage,

        "/": {
          send: {
            component: SendPage,
          },
        },
      },
    },
  },

  // ANONYMOUS STATISTICS
  statistics: {
    component: StatisticsPage,
  },

  // 404
  "*": {
    component: Error404Page,
    ...enableFeatures("mobile"),
  },
};

// DO NOT REMOVE, THIS CHECKS IF THE ROUTES OF CORRECT TYPE, WHILE ALLOWING BETTER CODE COMPLETION
const _ROUTES_StaticTypeCheck: IRoute = ROOT;

// special features available at some route and __propagating downstream__
export interface IRouteFeatures<T extends boolean = boolean> {
  mobile?: T;
}

function enableFeatures(...k: (keyof IRouteFeatures)[]): { features: IRouteFeatures } {
  return { features: k.reduce((prev, cur) => Object.assign(prev, { [cur]: true }), {}) };
}

function mergeFeatures(f1: IRouteFeatures | undefined, f2: IRouteFeatures | undefined): IRouteFeatures {
  return {
    mobile: f1?.mobile || f2?.mobile,
  };
}

function setRouteInfo(routeKey: string, route: IRoute, parent: IRoute | undefined) {
  if (parent) {
    route.parent = parent;
    route.path = parent.path === "/" ? parent.path + routeKey : parent.path + "/" + routeKey;
    route.features = mergeFeatures(route.features, parent.features);
  } else {
    route.path = "/";
  }

  if (route["/"]) {
    for (let subrouteKey in route["/"]) {
      setRouteInfo(subrouteKey, route["/"][subrouteKey], route);
    }
  }

  route.render = () => (
    <Route path={route.path!}>
      <Show when={route["/"]}>
        <For each={Object.keys(route["/"]!)}>{(subrouteKey) => route["/"]![subrouteKey]!.render!()}</For>
      </Show>
    </Route>
  );
}

setRouteInfo("", ROOT, undefined);

export function renderRoutes(): JSX.Element {
  return (ROOT as IRoute).render!();
}

export function findRoute(path: string): IRoute | undefined {
  if (path === "/") return ROOT;

  const segments = path.split("/").filter((it) => it.trim().length > 0);

  let cur: IRoute = ROOT;

  for (let segment of segments) {
    const subroute = cur["/"]?.[segment];

    if (!subroute) return undefined;

    cur = subroute;
  }

  return cur;
}

export function useMsqRoute(): IRoute {
  const location = useLocation();
  const route = findRoute(location.pathname);

  if (!route) {
    unreacheable(`Route ${location.pathname} not found!`);
  }

  return route;
}
