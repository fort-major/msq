import { useNavigate } from "@solidjs/router";
import { useICRC35 } from "../../store/global";
import { onMount } from "solid-js";
import { ICRC35AsyncRequest, ICRC35Connection, LOGIN_ROUTE, PAY_ROUTE } from "@fort-major/msq-client";
import { IICRC1TransferRequest, ZICRC1TransferRequest } from "@fort-major/msq-shared";
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

    const disableHandlers = () => {
      connection.removeRequestHandler(LOGIN_ROUTE, loginHandler);
      connection.removeRequestHandler(PAY_ROUTE, payHandler);
    };

    const loginHandler = (request: ICRC35AsyncRequest<undefined>) => {
      disableHandlers();
      z.undefined().parse(request.payload);

      setIcrc35Request(request);
      connection.onBeforeConnectionClosed(() => request.respond(false));

      navigate("/integration/login");
    };

    const payHandler = (request: ICRC35AsyncRequest<IICRC1TransferRequest>) => {
      disableHandlers();
      ZICRC1TransferRequest.parse(request.payload);

      setIcrc35Request(request);
      connection.onBeforeConnectionClosed(() => request.respond(null));

      navigate("/integration/pay");
    };

    connection.onRequest(LOGIN_ROUTE, loginHandler);
    connection.onRequest(PAY_ROUTE, payHandler);

    const closeHandler = () => connection.close();
    window.addEventListener("beforeunload", closeHandler);
  });

  return undefined;
}
