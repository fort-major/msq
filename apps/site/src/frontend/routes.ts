import { Component } from "solid-js";
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
import { useLocation } from "@solidjs/router";
import { unreacheable } from "@fort-major/msq-shared";

export interface IRoute {
  parent?: IRoute;
  component?: Component;
  ["/"]?: Record<string, IRoute | undefined>;
  path: string;
  pathSegment: string;
  features?: IRouteFeatures;
  redirectTo?: string;
}

function route<T>(r: T): T & IRoute {
  return r as T & IRoute;
}

export const ROOT = route({
  component: IndexPage,
  redirectTo: "/cabinet/my-assets",

  "/": {
    // INTEGRATION
    integration: route({
      "/": {
        login: route({
          ...enableFeatures("onlyWithMsqWallet", "hideFeedbackButton"),
          component: LoginPage,
        }),
        pay: route({
          ...enableFeatures("mobile", "showBetaDisclaimer"),

          "/": {
            "/": route({
              component: PaymentPage,
            }),
            checkout: route({
              component: PaymentCheckoutPage,
            }),
          },
        }),
      },
    }),

    // URL-BASED PAYMENT
    pay: route({
      ...enableFeatures("mobile", "showBetaDisclaimer"),

      "/": {
        "/": route({
          component: UrlBasedPaymentPage,
        }),
        send: route({
          component: SendPage,
        }),
      },
    }),

    // MSQ USER PERSONAL CABINET
    cabinet: route({
      redirectTo: "/cabinet/my-assets",
      ...enableFeatures("onlyWithMsqWallet"),

      "/": {
        "my-masks": route({
          component: MyMasksPage,
        }),
        "my-sessions": route({
          component: MySessionsPage,
        }),
        "my-links": route({
          component: MyLinksPage,
        }),
        "my-assets": route({
          ...enableFeatures("showBetaDisclaimer"),

          "/": {
            "/": route({
              component: MyAssetsPage,
            }),
            send: route({
              component: SendPage,
            }),
          },
        }),
      },
    }),

    // ANONYMOUS STATISTICS
    statistics: route({
      component: StatisticsPage,
      ...enableFeatures("mobile"),
    }),

    // ERRORS
    error: route({
      ...enableFeatures("mobile"),

      "/": {
        "install-metamask": route({
          component: ErrorInstallMetaMaskPage,
        }),
        "unblock-msq": route({
          component: ErrorUnblockMsqPage,
        }),
        "enable-msq": route({
          component: ErrorEnableMsqPage,
        }),
        "mobile-not-supported": route({
          component: ErrorMobileNotSupportedPage,
        }),
        "connection-rejected": route({
          component: ErrorMSQConnectionRejectedPage,
        }),
        "token-not-found": route({
          component: ErrorAssetNotFoundPage,
        }),
        "404": route({
          component: Error404Page,
        }),
      },
    }),

    // ICRC-35
    "icrc-35": route({
      component: ICRC35Page,
      ...enableFeatures("mobile"),
    }),
  },
});

// DO NOT REMOVE, THIS CHECKS IF THE ROUTES OF CORRECT TYPE, WHILE ALLOWING BETTER CODE COMPLETION
const _ROUTES_StaticTypeCheck: IRoute = ROOT;

// special features available at some route and __propagating downstream__
export interface IRouteFeatures<T extends boolean = boolean> {
  mobile?: T;
  onlyWithMsqWallet?: T;
  hideFeedbackButton?: T;
  showBetaDisclaimer?: T;
}

function defaultFeatures(): IRouteFeatures<boolean> {
  return { onlyWithMsqWallet: false, hideFeedbackButton: false, mobile: false };
}

function enableFeatures(...k: (keyof IRouteFeatures)[]): { features: IRouteFeatures } {
  return { features: k.reduce((prev, cur) => Object.assign(prev, { [cur]: true }), defaultFeatures()) };
}

function mergeFeatures(f1: IRouteFeatures | undefined, f2: IRouteFeatures | undefined): IRouteFeatures {
  return {
    onlyWithMsqWallet: f1?.onlyWithMsqWallet || f2?.onlyWithMsqWallet,
    hideFeedbackButton: f1?.hideFeedbackButton || f2?.hideFeedbackButton,
    mobile: f1?.mobile || f2?.mobile,
    showBetaDisclaimer: f1?.showBetaDisclaimer || f2?.showBetaDisclaimer,
  };
}

function setRouteInfo(routeKey: string, route: IRoute, parent: IRoute | undefined) {
  if (parent) {
    route.parent = parent;
    route.path = parent.path === "/" ? parent.path + routeKey : parent.path + "/" + routeKey;
    route.features = mergeFeatures(route.features, parent.features);
  } else {
    route.path = "/";
    route.features = mergeFeatures(route.features, {});
  }

  route.pathSegment = "/" + routeKey;

  if (route["/"]) {
    for (let subrouteKey in route["/"]) {
      setRouteInfo(subrouteKey, route["/"][subrouteKey]!, route);
    }
  }
}

setRouteInfo("", ROOT, undefined);

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

export function useCurrentRouteProps<T>(): Readonly<T> | null {
  const { state } = useLocation<T>();

  return state as Readonly<T>;
}

export interface ISolidRoute {
  path: string;
  component?: Component;
  children?: ISolidRoute[];
}

export function getSolidRoutes(): ISolidRoute {
  return toSolidRoute(ROOT);
}

function toSolidRoute(route: IRoute): ISolidRoute {
  let children: ISolidRoute[] | undefined;

  if (route["/"]) {
    children = [];

    for (let subroute of Object.values(route["/"] as Record<string, IRoute>)) {
      children.push(toSolidRoute(subroute));
    }
  }

  return {
    path: route.pathSegment,
    component: route.component,
    children,
  };
}
