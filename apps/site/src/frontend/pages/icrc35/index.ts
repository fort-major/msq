import { useNavigate } from "@solidjs/router";
import { useICRC35 } from "../../store/global";
import { onMount } from "solid-js";
import { createICRC35, ICRC35AsyncRequest, ICRC35Connection, MSQICRC35Plugin } from "@fort-major/masquerade-client";
import {
  debugStringify,
  IICRC1TransferRequest,
  unreacheable,
  ZICRC1TransferRequest,
} from "@fort-major/masquerade-shared";
import { z } from "zod";

export function ICRC35Page() {
  const navigate = useNavigate();
  const [_, setIcrc35Request] = useICRC35();

  onMount(async () => {
    const icrc35 = createICRC35(
      await ICRC35Connection.establish({
        mode: "child",
        peer: window.opener,
        connectionFilter: {
          kind: "blacklist",
          list: [],
        },
        debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      }),
    );

    const closeHandler = () => {
      icrc35.plugins.ICRC35Connection.close();
    };

    window.addEventListener("beforeunload", closeHandler);

    const req: ICRC35AsyncRequest<IICRC1TransferRequest | undefined> = await icrc35.plugins.ICRC35Async.next([
      MSQICRC35Plugin.LoginRoute,
      MSQICRC35Plugin.PayRoute,
    ]);

    try {
      switch (req.route) {
        case MSQICRC35Plugin.LoginRoute: {
          z.undefined().parse(req.body);

          setIcrc35Request(req);
          icrc35.plugins.ICRC35Connection.onBeforeConnectionClosed(() => req.respond(false));

          navigate("/integration/login");
          break;
        }

        case MSQICRC35Plugin.PayRoute: {
          ZICRC1TransferRequest.parse(req.body);

          setIcrc35Request(req);
          icrc35.plugins.ICRC35Connection.onBeforeConnectionClosed(() => req.respond(null));

          navigate("/integration/pay");
          break;
        }
      }
    } catch (e) {
      setIcrc35Request(undefined);
      window.removeEventListener("close", closeHandler);
      icrc35.plugins.ICRC35Connection.close();

      throw e;
    }
  });

  return undefined;
}
