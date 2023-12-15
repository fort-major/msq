import { useNavigate } from "@solidjs/router";
import { useICRC35 } from "../../store/global";
import { onMount } from "solid-js";
import { ICRC35Connection, MSQICRC35Client } from "@fort-major/masquerade-client";
import { ZICRC1TransferRequest } from "@fort-major/masquerade-shared";
import { z } from "zod";

export function ICRC35Page() {
  const navigate = useNavigate();
  const [_, setIcrc35Request] = useICRC35();

  onMount(async () => {
    const connection = await ICRC35Connection.establish({
      mode: "child",
      peer: window.opener,
      connectionFilter: {
        kind: "blacklist",
        list: [],
      },
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    const closeHandler = () => connection.close();
    window.addEventListener("beforeunload", closeHandler);

    const client = new MSQICRC35Client(connection);
    const req = await client.nextMsqRequest();

    try {
      switch (req.route) {
        case MSQICRC35Client.LoginRoute: {
          z.undefined().parse(req.payload);

          setIcrc35Request(req);
          connection.onBeforeConnectionClosed(() => req.respond(false));

          navigate("/integration/login");
          break;
        }

        case MSQICRC35Client.PayRoute: {
          ZICRC1TransferRequest.parse(req.payload);

          setIcrc35Request(req);
          connection.onBeforeConnectionClosed(() => req.respond(null));

          navigate("/integration/pay");
          break;
        }
      }
    } catch (e) {
      setIcrc35Request(undefined);
      window.removeEventListener("close", closeHandler);
      connection.close();

      throw e;
    }
  });

  return undefined;
}
