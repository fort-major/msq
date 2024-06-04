import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";
import { ROOT, findRoute } from "../../routes";
import isMobile from "ismobilejs";
import { IChildren } from "../../utils";
import { useConnectMsq } from "../../store/global";

export function IndexPage(props: IChildren) {
  const navigate = useNavigate();
  const connectMsq = useConnectMsq();

  const [attemptedMsqConnect, setAttemptedMsqConnect] = createSignal(false);
  const [isConnectingMsq, setConnectingMsq] = createSignal(false);

  createEffect(() => {
    const route = findRoute(useLocation().pathname)!;

    if (route.features?.onlyWithMsqWallet) {
      if (!route.features.mobile && isMobile().any) {
        navigate(ROOT["/"].error["/"]["mobile-not-supported"].path);

        return;
      }

      if (!attemptedMsqConnect() && !isConnectingMsq()) {
        setConnectingMsq(true);

        connectMsq(true, true)
          .then(() => {
            setAttemptedMsqConnect(true);
            setConnectingMsq(false);
          })
          .catch((_) => {
            setAttemptedMsqConnect(true);
            setConnectingMsq(false);
          });
      }
    }
  });

  return props.children;
}
