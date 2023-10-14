import { createEventSignal } from "@solid-primitives/event-listener";
import { Match, Switch, createEffect, createSignal } from "solid-js";
import { InternalSnapClient } from "@fort-major/masquerade-client/dist/esm/internal";
import {
  ErrorCode,
  ILoginResultMsg,
  ILoginSiteReadyMsg,
  TIdentityId,
  TOrigin,
  ZLoginRequestMsg,
  err,
  originToHostname,
} from "@fort-major/masquerade-shared";
import { BoopAvatar } from "../../components/boop-avatar";
import { Principal } from "@dfinity/principal";

enum LoginPageState {
  WaitingForLoginRequest,
  ConnectingWallet,
  WaitingForUserInput,
}

export function LoginPage() {
  const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
  const [snapClient, setSnapClient] = createSignal<InternalSnapClient | null>(null);
  const [availableOrigins, setAvailableOrigins] = createSignal<[TOrigin, string[]][] | null>(null);
  const [deriviationOrigin, setDeriviationOrigin] = createSignal<string | undefined>(undefined);
  const [identityId, setIdentityId] = createSignal<number | null>(null);
  const [referrerWindow, setReferrerWindow] = createSignal<MessageEventSource | null>(null);
  const message = createEventSignal(window, "message");

  const referrerOrigin = new URL(document.referrer).origin;

  const awaitLoginRequest = () => {
    if (state() !== LoginPageState.WaitingForLoginRequest) {
      return;
    }

    const msg = message();

    if (!msg) {
      return;
    }

    if (msg.origin !== referrerOrigin) {
      return;
    }

    // we only expect one single kind of message here
    ZLoginRequestMsg.parse(msg.data);

    // if login request received, send back ready
    if (!msg.source) {
      err(ErrorCode.UNKOWN, "No message source found");
    }

    const readyMsg: ILoginSiteReadyMsg = {
      domain: "internet-computer-metamask-snap",
      type: "login_site_ready",
    };

    msg.source.postMessage(readyMsg, { targetOrigin: referrerOrigin });

    setReferrerWindow(msg.source);

    window.onbeforeunload = () => {
      const failMsg: ILoginResultMsg = {
        domain: "internet-computer-metamask-snap",
        type: "login_result",
        result: false,
      };

      referrerWindow()!.postMessage(failMsg, { targetOrigin: referrerOrigin });
    };

    setState(LoginPageState.ConnectingWallet);
  };

  createEffect(awaitLoginRequest);

  const connectWallet = async () => {
    if (state() !== LoginPageState.ConnectingWallet) {
      return;
    }

    const client = await InternalSnapClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      snapVersion: import.meta.env.VITE_MSQ_SNAP_VERSION,
    });
    setSnapClient(client);

    const loginOptions = await client.getLoginOptions(referrerOrigin);
    setAvailableOrigins(loginOptions);

    setState(LoginPageState.WaitingForUserInput);
  };

  createEffect(connectWallet);

  const onLogin = async () => {
    const client = snapClient()!;
    const id = identityId()!;

    let deriviationOrig = deriviationOrigin();

    if (!deriviationOrig) {
      deriviationOrig = referrerOrigin;
    }

    await client.login(referrerOrigin, id, deriviationOrig);

    const msg: ILoginResultMsg = {
      domain: "internet-computer-metamask-snap",
      type: "login_result",
      result: true,
    };
    referrerWindow()!.postMessage(msg, { targetOrigin: referrerOrigin });
    window.onbeforeunload = null;

    window.close();
  };

  const onCancel = async () => {
    const msg: ILoginResultMsg = {
      domain: "internet-computer-metamask-snap",
      type: "login_result",
      result: false,
    };
    referrerWindow()?.postMessage(msg, { targetOrigin: referrerOrigin });
    window.onbeforeunload = null;

    window.close();
  };

  const statusText = () => {
    const s = state();

    return (
      <Switch>
        <Match when={s === LoginPageState.WaitingForLoginRequest}>
          <p>Waiting for ${originToHostname(referrerOrigin)}...</p>
        </Match>
        <Match when={s === LoginPageState.ConnectingWallet}>
          <p>Connecting to your wallet...</p>
        </Match>
      </Switch>
    );
  };

  const onIdentitySelect = (deriviationOrigin: TOrigin, identityId: TIdentityId) => {
    setDeriviationOrigin(deriviationOrigin);
    setIdentityId(identityId);
  };

  const selection = () => {
    const availOrigins = availableOrigins()!;

    const selection = availOrigins.map(([origin, principals]) => {
      const principalBtns = principals.map((it, idx) => (
        <button
          style={{
            "border-color": origin === deriviationOrigin() && idx === identityId() ? "blue" : undefined,
          }}
          onClick={() => onIdentitySelect(origin, idx)}
        >
          <BoopAvatar principal={Principal.fromText(it)} size={60} eyesAngle={90} />
          {it}
        </button>
      ));

      return (
        <div>
          <h3>Identities from ${originToHostname(origin)}</h3>
          {principalBtns}
        </div>
      );
    });

    return <div>{selection}</div>;
  };

  return (
    <div>
      <h1>{originToHostname(referrerOrigin)} wants you to log in</h1>
      {statusText()}
      <Switch>
        <Match when={state() === LoginPageState.WaitingForUserInput}>
          {selection()}
          <div>
            <button onClick={onLogin}>Continue</button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </Match>
      </Switch>
    </div>
  );
}
