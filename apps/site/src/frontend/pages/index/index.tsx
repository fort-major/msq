import { Outlet, useNavigate } from "@solidjs/router";
import { ErrorPage } from "../error";
import { EIconKind } from "../../ui-kit/icon";
import { DISCORD_LINK, debugStringify, logError } from "@fort-major/msq-shared";
import { createEffect } from "solid-js";
import { ROOT, useMsqRoute } from "../../routes";
import isMobile from "ismobilejs";

export function IndexPage() {
  const route = useMsqRoute();
  const navigate = useNavigate();

  createEffect(() => {
    if (route.redirectTo) {
      navigate(route.redirectTo);
    }

    if (!route.features?.mobile && isMobile()) {
      navigate(ROOT["/"]["mobile-not-supported"].path);
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
          action: () => window.open(DISCORD_LINK, "_blank"),
        }}
      />
    );
  }
}
