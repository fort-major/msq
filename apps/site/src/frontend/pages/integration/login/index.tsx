import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import { IMask, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { useMasqueradeClient } from "../../../store/global";
import { referrerOrigin, sendLoginResult, useLoginRequestMsg, useReferrerWindow } from "../../../store/integration";
import { useNavigate } from "@solidjs/router";
import ChevronUpSvg from "#assets/chevron-up.svg";
import { Accent, Title } from "../../../components/typography/style";
import { Divider } from "../../../components/divider/style";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Spoiler } from "../../../components/spoiler";

export function LoginPage() {
  const [loginOptions, setLoginOptions] = createSignal<[TOrigin, IMask[]][] | null>(null);
  const snapClient = useMasqueradeClient();
  const loginRequest = useLoginRequestMsg();
  const [referrerWindow] = useReferrerWindow();
  const navigate = useNavigate();

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
    const client = snapClient()!;

    await client.register(referrerOrigin!);

    const loginOptions = await client.getLoginOptions(referrerOrigin!);
    setLoginOptions(loginOptions);
  };

  const onDismiss = () => {
    sendLoginResult(referrerWindow()!, false, 0);
  };

  return (
    <>
      <LoginHeadingSection>
        <DismissBtn onClick={onDismiss}>
          <img src={ChevronUpSvg} alt="<" />
          <span>Dismiss</span>
        </DismissBtn>
        <LoginPageHeader>Choose a Mask to wear</LoginPageHeader>
        <Title>
          <Accent>{originToHostname(referrerOrigin!)}</Accent> wants you to log in
        </Title>
      </LoginHeadingSection>
      <Switch fallback={<p>Loading...</p>}>
        <Match when={loginRequest() !== null && snapClient() !== null}>
          <LoginOptionsWrapper>
            <LoginOptionsSection>
              <For each={loginOptions()}>
                {([origin, principals]) => (
                  <Spoiler
                    header={
                      <Title>
                        Masks from <Accent>{originToHostname(origin)}</Accent>
                      </Title>
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
                        <AddNewMaskBtn onClick={onAddNewMask} />
                      </Match>
                    </Switch>
                  </Spoiler>
                )}
              </For>
            </LoginOptionsSection>
          </LoginOptionsWrapper>
        </Match>
      </Switch>
    </>
  );
}
