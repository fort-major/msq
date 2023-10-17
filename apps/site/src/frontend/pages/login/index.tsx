import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import { TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { Spoiler } from "../../components/spoiler";
import { Accent, Title } from "../../components/typography/style";
import { LoginOption } from "../../components/login-option";
import { AddNewMaskBtn } from "../../components/add-new-mask-btn";
import { Divider } from "../../components/divider/style";
import ChevtonUpSvg from "#assets/chevron-up.svg";
import { useStore } from "@nanostores/solid";
import { $snapClient } from "../../store/user";
import { $loginRequestMsg, referrerOrigin, sendLoginResult } from "../../store/messages";
import { $router } from "../..";

export function LoginPage() {
  const [loginOptions, setLoginOptions] = createSignal<[TOrigin, [string, string][]][] | null>(null);
  const snapClient = useStore($snapClient);
  const loginRequest = useStore($loginRequestMsg);

  if (referrerOrigin === null) {
    $router.open("/");
  }

  createEffect(() => {
    if (snapClient() === null || loginRequest() === null) {
      return;
    }

    snapClient()!.getLoginOptions(referrerOrigin!).then(setLoginOptions);
  });

  const onLogin = async (loginOrigin: string, identityId: number) => {
    await snapClient()!.login(referrerOrigin!, identityId, loginOrigin);

    sendLoginResult(true, 0);
  };

  const onAddNewMask = async () => {
    const client = snapClient()!;

    await client.register(referrerOrigin!);

    const loginOptions = await client.getLoginOptions(referrerOrigin!);
    setLoginOptions(loginOptions);
  };

  const onDismiss = async () => {
    sendLoginResult(false, 0);
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
                      {([principal, pseudonym], idx) => (
                        <>
                          <Divider />
                          <LoginOption
                            pseudonym={pseudonym}
                            principal={principal}
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
