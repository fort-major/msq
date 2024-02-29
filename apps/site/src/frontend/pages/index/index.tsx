import { Outlet, useLocation, useNavigate } from "@solidjs/router";
import { ErrorPage } from "../error";
import { EIconKind } from "../../ui-kit/icon";
import { DISCORD_LINK, debugStringify, logError } from "@fort-major/msq-shared";
import isMobile from "ismobilejs";
import { createEffect } from "solid-js";

export function IndexPage() {
  const location = useLocation();
  const navigate = useNavigate();

  createEffect(() => {
    if (location.pathname === "/" || location.pathname === "/cabinet") {
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
          action: () => window.open(DISCORD_LINK, "_blank"),
        }}
      />
    );
  }
}
