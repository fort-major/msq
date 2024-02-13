import { DISCORD_LINK } from "@fort-major/msq-shared";
import { ContactUsBtnText, ContactUsBtnWrapper } from "./style";
import { EIconKind, Icon } from "../../ui-kit/icon";

export function ContactUsBtn() {
  return (
    <ContactUsBtnWrapper href={DISCORD_LINK} target="_blank">
      <Icon kind={EIconKind.Chat} size={24} />
      <ContactUsBtnText>Contact Us</ContactUsBtnText>
    </ContactUsBtnWrapper>
  );
}
