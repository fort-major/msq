import { DISCORD_LINK } from "@fort-major/msq-shared";
import { ContactUsBtnText, ContactUsBtnWrapper } from "./style";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { useLocation } from "@solidjs/router";
import { Show, createEffect, createSignal } from "solid-js";
import { findRoute } from "../../routes";

export function ContactUsBtn() {
  const { pathname } = useLocation();
  const [btnVisible, setBtnVisible] = createSignal(true);

  createEffect(() => {
    setBtnVisible(!findRoute(pathname)?.features?.hideFeedbackButton);
  });

  return (
    <Show when={btnVisible()}>
      <ContactUsBtnWrapper href={DISCORD_LINK} target="_blank">
        <Icon kind={EIconKind.Chat} size={24} />
        <ContactUsBtnText>Contact Us</ContactUsBtnText>
      </ContactUsBtnWrapper>
    </Show>
  );
}
