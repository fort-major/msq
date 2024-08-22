import { For, Match, Show, Switch, createEffect, createSignal, on } from "solid-js";
import { IMask, TOrigin, originToHostname } from "@fort-major/msq-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { useMsqClient } from "../../../store/global";
import { useNavigate } from "@solidjs/router";
import { Divider } from "../../../components/divider/style";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Spoiler } from "../../../components/spoiler";
import { ColorAccent, H1, Text } from "../../../ui-kit/typography";
import { EIconKind, Icon } from "../../../ui-kit/icon";
import { ROOT } from "../../../routes";
import { useICRC35Store } from "../../../store/icrc-35";

export function LoginPage() {
  const [loginOptions, setLoginOptions] = createSignal<[TOrigin, IMask[]][] | null>(null);
  const [loading, setLoading] = createSignal(false);

  const msqClient = useMsqClient();
  const { getIcrc35Request } = useICRC35Store();
  const navigate = useNavigate();

  createEffect(() => {
    if (!getIcrc35Request()) {
      navigate(ROOT["/"].error["/"]["bad-login-request"].path);
      return;
    }
  });

  createEffect(
    on(msqClient, async (msq) => {
      if (!msq) {
        return;
      }

      const loginOptions = await msq.getLoginOptions(getIcrc35Request()!.peerOrigin);

      setLoginOptions(loginOptions);
    }),
  );

  const onLogin = async (loginOrigin: string, identityId: number) => {
    const icrc35 = getIcrc35Request()!;

    setLoading(true);
    const agreed = await msqClient()!.login(icrc35.peerOrigin, identityId, loginOrigin);
    setLoading(false);

    if (agreed) {
      icrc35.respond(true);
      window.close();
    }
  };

  const onAddNewMask = async () => {
    setLoading(true);
    document.body.style.cursor = "wait";

    const msq = msqClient()!;

    await msq.register(getIcrc35Request()!.peerOrigin);

    const loginOptions = await msq.getLoginOptions(getIcrc35Request()!.peerOrigin);
    setLoginOptions(loginOptions);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const onDismiss = () => {
    window.close();
  };

  return (
    <Show when={getIcrc35Request()}>
      <LoginHeadingSection>
        <DismissBtn onClick={onDismiss}>
          <Icon kind={EIconKind.ArrowLeftLong} size={12} />
          <span>Dismiss</span>
        </DismissBtn>
        <LoginPageHeader>
          <H1>Choose a Mask to wear</H1>
        </LoginPageHeader>
        <Text size={20} weight={600}>
          <span class={ColorAccent}>{originToHostname(getIcrc35Request()!.peerOrigin)}</span> wants you to log in
        </Text>
      </LoginHeadingSection>
      <LoginOptionsWrapper>
        <LoginOptionsSection>
          <For each={loginOptions()}>
            {([origin, principals], idx) => (
              <Spoiler
                last={idx() === (loginOptions() ?? []).length - 1}
                defaultOpen
                header={
                  <Text size={20} weight={600}>
                    Masks from <span class={ColorAccent}>{originToHostname(origin)}</span>
                  </Text>
                }
              >
                <For each={principals}>
                  {(mask, idx) => (
                    <>
                      <Divider />
                      <LoginOption
                        pseudonym={mask.pseudonym}
                        principal={mask.principal}
                        disabled={loading()}
                        onClick={() => onLogin(origin, idx())}
                      />
                    </>
                  )}
                </For>
                <Switch>
                  <Match when={origin === getIcrc35Request()!.peerOrigin}>
                    <Divider />
                    <AddNewMaskBtn loading={loading()} onClick={onAddNewMask} />
                  </Match>
                </Switch>
              </Spoiler>
            )}
          </For>
        </LoginOptionsSection>
      </LoginOptionsWrapper>
    </Show>
  );
}
