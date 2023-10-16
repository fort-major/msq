import { createEventSignal } from "@solid-primitives/event-listener";
import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import { InternalSnapClient } from "@fort-major/masquerade-client/dist/esm/internal";
import {
  ErrorCode,
  ILoginResultMsg,
  ILoginSiteReadyMsg,
  TOrigin,
  ZLoginRequestMsg,
  err,
  originToHostname,
} from "@fort-major/masquerade-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { Spoiler } from "../../components/spoiler";
import { Accent, Title } from "../../components/typography/style";
import { LoginOption } from "../../components/login-option";
import { AddNewMaskBtn } from "../../components/add-new-mask-btn";
import { Divider } from "../../components/divider/style";
import ChevtonUpSvg from "#assets/chevron-up.svg";

enum LoginPageState {
  WaitingForLoginRequest,
  ConnectingWallet,
  WaitingForUserInput,
}

export function LoginPage() {
  const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
  const [snapClient, setSnapClient] = createSignal<InternalSnapClient | null>(null);
  const [availableOrigins, setAvailableOrigins] = createSignal<[TOrigin, [string, string][]][] | null>(null);
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

  const onLogin = async (loginOrigin: string, identityId: number) => {
    const client = snapClient()!;

    await client.login(referrerOrigin, identityId, loginOrigin);

    const msg: ILoginResultMsg = {
      domain: "internet-computer-metamask-snap",
      type: "login_result",
      result: true,
    };

    referrerWindow()!.postMessage(msg, { targetOrigin: referrerOrigin });
    window.onbeforeunload = null;

    window.close();
  };

  const onAddNewMask = async () => {
    const client = snapClient()!;

    await client.register(referrerOrigin);

    const loginOptions = await client.getLoginOptions(referrerOrigin);
    setAvailableOrigins(loginOptions);
  };

  const onDismiss = async () => {
    const msg: ILoginResultMsg = {
      domain: "internet-computer-metamask-snap",
      type: "login_result",
      result: false,
    };
    referrerWindow()?.postMessage(msg, { targetOrigin: referrerOrigin });
    window.onbeforeunload = null;

    window.close();
  };

  return (
    <>
      <LoginHeadingSection>
        <DismissBtn onClick={onDismiss}>
          <img src={ChevtonUpSvg} alt="<" />
          <span>Dismiss</span>
        </DismissBtn>
        <LoginPageHeader>Choose a Mask to wear</LoginPageHeader>
        <Title>
          <Accent>{originToHostname(referrerOrigin)}</Accent> wants you to log in
        </Title>
      </LoginHeadingSection>
      <LoginOptionsWrapper>
        <LoginOptionsSection>
          <For each={availableOrigins()}>
            {([origin, principals]) => (
              <Spoiler
                header={
                  <Title>
                    Masks from <Accent>{originToHostname(origin)}</Accent>
                  </Title>
                }
              >
                <For each={principals}>
                  {([principal, pseudonym], idx) => (
                    <>
                      <Divider />
                      <LoginOption pseudonym={pseudonym} principal={principal} onClick={() => onLogin(origin, idx())} />
                    </>
                  )}
                </For>
                <Switch>
                  <Match when={origin === referrerOrigin}>
                    <Divider />
                    <AddNewMaskBtn onClick={onAddNewMask} />
                  </Match>
                </Switch>
              </Spoiler>
            )}
          </For>
        </LoginOptionsSection>
      </LoginOptionsWrapper>
    </>
  );
}
