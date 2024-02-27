import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { IMask, TOrigin, originToHostname } from "@fort-major/msq-shared";
import { DismissBtn, LoginHeadingSection, LoginOptionsSection, LoginOptionsWrapper, LoginPageHeader } from "./style";
import { useICRC35, useMsqClient } from "../../../store/global";
import { useNavigate } from "@solidjs/router";
import { Divider } from "../../../components/divider/style";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Spoiler } from "../../../components/spoiler";
import { ColorAccent, H1, Text } from "../../../ui-kit/typography";
import { EIconKind, Icon } from "../../../ui-kit/icon";

export function LoginPage() {
  const [loginOptions, setLoginOptions] = createSignal<[TOrigin, IMask[]][] | null>(null);
  const _msq = useMsqClient();
  const [icrc35Request] = useICRC35<undefined>();
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(false);

  createEffect(async () => {
    if (icrc35Request() === undefined) {
      navigate("/");
      return;
    }

    if (_msq() === undefined) {
      return;
    }

    const loginOptions = await _msq()!.getLoginOptions(icrc35Request()!.peerOrigin);

    setLoginOptions(loginOptions);
  });

  const onLogin = async (loginOrigin: string, identityId: number) => {
    await _msq()!.login(icrc35Request()!.peerOrigin, identityId, loginOrigin);

    icrc35Request()!.respond(true);
    window.close();
  };

  const onAddNewMask = async () => {
    setLoading(true);
    document.body.style.cursor = "wait";

    const msq = _msq()!;

    await msq.register(icrc35Request()!.peerOrigin);

    const loginOptions = await msq.getLoginOptions(icrc35Request()!.peerOrigin);
    setLoginOptions(loginOptions);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const onDismiss = () => {
    icrc35Request()!.respond(false);

    window.close();
  };

  return (
    <Show when={icrc35Request()}>
      <LoginHeadingSection>
        <DismissBtn onClick={onDismiss}>
          <Icon kind={EIconKind.ArrowLeftLong} size={12} />
          <span>Dismiss</span>
        </DismissBtn>
        <LoginPageHeader>
          <H1>Choose a Mask to wear</H1>
        </LoginPageHeader>
        <Text size={20} weight={600}>
          <span class={ColorAccent}>{originToHostname(icrc35Request()!.peerOrigin)}</span> wants you to log in
        </Text>
      </LoginHeadingSection>
      <LoginOptionsWrapper>
        <LoginOptionsSection>
          <For each={loginOptions()}>
            {([origin, principals]) => (
              <Spoiler
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
                        onClick={() => onLogin(origin, idx())}
                      />
                    </>
                  )}
                </For>
                <Switch>
                  <Match when={origin === icrc35Request()!.peerOrigin}>
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
