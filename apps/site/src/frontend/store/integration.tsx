import {
  ErrorCode,
  IICRC1TransferRequestMsg,
  IICRC1TransferResultMsg,
  ILoginRequestMsg,
  ILoginResultMsg,
  IRequestReceivedMsg,
  ZICRC1TransferRequestMsg,
  ZLoginRequestMsg,
  ZMsgDomain,
  err,
  unreacheable,
} from "@fort-major/masquerade-shared";
import { Accessor, Setter, Signal, createContext, createEffect, createSignal, useContext } from "solid-js";
import { IChildren } from "../utils";

export const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null;

interface IIntegrationContext {
  referrerWindow: [Accessor<MessageEventSource | undefined>, Setter<MessageEventSource | undefined>];
  loginRequestMsg: Accessor<ILoginRequestMsg | undefined>;
  icrc1TransferRequestMsg: Accessor<IICRC1TransferRequestMsg | undefined>;
}

const IntegrationContext = createContext<IIntegrationContext>();

export function useReferrerWindow(): Signal<MessageEventSource | undefined> {
  const ctx = useContext(IntegrationContext);

  if (!ctx) {
    unreacheable("Integration context is uninitialized");
  }

  return ctx.referrerWindow;
}

export function useLoginRequestMsg() {
  const ctx = useContext(IntegrationContext);

  if (!ctx) {
    unreacheable("Integration context is uninitialized");
  }

  return ctx.loginRequestMsg;
}

export function useIcrc1TransferRequestMsg() {
  const ctx = useContext(IntegrationContext);

  if (!ctx) {
    unreacheable("Integration context is uninitialized");
  }

  return ctx.icrc1TransferRequestMsg;
}

export function IntegrationStore(props: IChildren) {
  const [referrerWindow, setReferrerWindow] = createSignal<MessageEventSource | undefined>(undefined);
  const [loginRequestMsg, setLoginRequestMsg] = createSignal<ILoginRequestMsg | undefined>(undefined);
  const [icrc1TransferRequestMsg, setIcrc1TransferRequestMsg] = createSignal<IICRC1TransferRequestMsg | undefined>(
    undefined,
  );

  window.onmessage = (msg) => {
    if (!msg || !msg.isTrusted || msg.origin !== referrerOrigin) {
      return;
    }

    console.log(msg);

    if (!msg.source) {
      err(ErrorCode.UNKOWN, "No message source found");
    }

    try {
      ZMsgDomain.parse(msg.data["domain"]);

      if (msg.data["type"] === "login_request") {
        setLoginRequestMsg(ZLoginRequestMsg.parse(msg.data));

        window.onbeforeunload = () => {
          sendLoginResult(msg.source!, false, null);
        };
      } else if (msg.data["type"] === "transfer_icrc1_request") {
        setIcrc1TransferRequestMsg(ZICRC1TransferRequestMsg.parse(msg.data));

        window.onbeforeunload = () => {
          sendICRC1TransferResult(msg.source!, undefined, null);
        };
      } else {
        return;
      }

      setReferrerWindow(msg.source);

      const readyMsg: IRequestReceivedMsg = {
        domain: "msq",
        type: "request_received",
      };

      msg.source!.postMessage(readyMsg, { targetOrigin: referrerOrigin });

      console.log("sent ready msg back");
    } catch (e) {
      window.onmessage = null;
      window.onbeforeunload = null;
      setReferrerWindow(undefined);

      throw e;
    }
  };

  return (
    <IntegrationContext.Provider
      value={{
        referrerWindow: [referrerWindow, setReferrerWindow],
        loginRequestMsg,
        icrc1TransferRequestMsg,
      }}
    >
      {props.children}
    </IntegrationContext.Provider>
  );
}

export function sendLoginResult(
  referrerWindow: MessageEventSource,
  result: boolean,
  windowCloseDelayMs: number | null,
) {
  const res: ILoginResultMsg = {
    domain: "msq",
    type: "login_result",
    result,
  };
  referrerWindow.postMessage(res, { targetOrigin: referrerOrigin! });

  window.onmessage = null;
  window.onbeforeunload = null;

  if (windowCloseDelayMs !== null) {
    setTimeout(window.close, windowCloseDelayMs);
  }
}

export function sendICRC1TransferResult(
  referrerWindow: MessageEventSource,
  result: bigint | undefined,
  windowCloseDelayMs: number | null,
) {
  const res: IICRC1TransferResultMsg = {
    domain: "msq",
    type: "transfer_icrc1_result",
    result,
  };
  referrerWindow.postMessage(res, { targetOrigin: referrerOrigin! });

  window.onmessage = null;
  window.onbeforeunload = null;

  if (windowCloseDelayMs !== null) {
    setTimeout(window.close, windowCloseDelayMs);
  }
}
