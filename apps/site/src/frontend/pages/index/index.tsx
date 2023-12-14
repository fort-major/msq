import { Outlet, useLocation, useNavigate } from "@solidjs/router";
import { ErrorPage } from "../error";
import { EIconKind } from "../../ui-kit/icon";
import { DISCORD_ERROR_LINK, DISCORD_LINK, debugStringify, logError } from "@fort-major/masquerade-shared";
import isMobile from "ismobilejs";
import { createEffect } from "solid-js";

export function IndexPage() {
  const isMob = isMobile(window.navigator).any;
  const location = useLocation();
  const navigate = useNavigate();

  if (isMob) {
    return (
      <ErrorPage
        header="Oops! MSQ is not available on mobile devices yet"
        text="Try accessing this page via your desktop browser. Join our Discord community and be the first to know when it’s ready:"
        button={{
          text: "Join Us",
          icon: EIconKind.Discord,
          action: () => window.open(DISCORD_LINK, "_blank"),
        }}
      />
    );
  }

  createEffect(() => {
    if (location.pathname === "/") {
      navigate("/cabinet/my-assets");
    }
  });

  try {
    return <Outlet />;
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
          action: () => window.open(DISCORD_ERROR_LINK, "_blank"),
        }}
      />
    );
  }
}
