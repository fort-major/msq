import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import { IMask, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { referrerOrigin, sendLoginResult, useLoginRequestMsg, useReferrerWindow } from "../../../store/integration";
import { useNavigate } from "@solidjs/router";
import { Divider } from "../../../components/divider/style";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Spoiler } from "../../../components/spoiler";
import { H1, Span600, SpanAccent, Text20 } from "../../../ui-kit/typography";
import { EIconKind, Icon } from "../../../ui-kit/icon";

export function LoginPage() {
  const [loginOptions, setLoginOptions] = createSignal<[TOrigin, IMask[]][] | null>(null);
  const snapClient = useMasqueradeClient();
  const loginRequest = useLoginRequestMsg();
  const [referrerWindow] = useReferrerWindow();
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(false);

  const [_, showLoader] = useLoader();
  createEffect(() => (loginOptions() === null ? showLoader(true) : showLoader(false)));

  if (referrerOrigin === null || referrerOrigin === window.location.origin) {
    navigate("/");
  }

  createEffect(async () => {
    if (snapClient() === undefined || loginRequest() === undefined) {
      return;
    }

    const loginOptions = await snapClient()!.getLoginOptions(referrerOrigin!);

    setLoginOptions(loginOptions);
  });

  const onLogin = async (loginOrigin: string, identityId: number) => {
    await snapClient()!.login(referrerOrigin!, identityId, loginOrigin);

    sendLoginResult(referrerWindow()!, true, 0);
  };

  const onAddNewMask = async () => {
    setLoading(true);

    const client = snapClient()!;

    await client.register(referrerOrigin!);

    const loginOptions = await client.getLoginOptions(referrerOrigin!);
    setLoginOptions(loginOptions);

    setLoading(false);
  };

  const onDismiss = () => {
    sendLoginResult(referrerWindow()!, false, 0);
  };

  return (
    <>
      <LoginHeadingSection>
        <DismissBtn onClick={onDismiss}>
          <Icon kind={EIconKind.ChevronUp} size={12} rotation={-90} />
          <span>Dismiss</span>
        </DismissBtn>
        <LoginPageHeader>
          <H1>Choose a Mask to wear</H1>
        </LoginPageHeader>
        <Text20>
          <Span600>
            <SpanAccent>{originToHostname(referrerOrigin!)}</SpanAccent> wants you to log in
          </Span600>
        </Text20>
      </LoginHeadingSection>
      <LoginOptionsWrapper>
        <LoginOptionsSection>
          <For each={loginOptions()}>
            {([origin, principals]) => (
              <Spoiler
                defaultOpen
                header={
                  <Text20>
                    <Span600>
                      Masks from <SpanAccent>{originToHostname(origin)}</SpanAccent>
                    </Span600>
                  </Text20>
                }
              >
                <For each={principals}>
                  {(mask, idx) => (
                    <>
                      <Divider />
                      <LoginOption
                        pseudonym={mask.pseudonym}
                        principal={mask.principal}
                        onClick={() => onLogin(origin, idx())}
                      />
                    </>
                  )}
                </For>
                <Switch>
                  <Match when={origin === referrerOrigin}>
                    <Divider />
                    <AddNewMaskBtn loading={loading()} onClick={onAddNewMask} />
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
