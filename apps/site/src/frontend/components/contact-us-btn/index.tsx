import { DISCORD_LINK } from "@fort-major/masquerade-shared";
import { ChatIcon } from "../typography/icons";
import { ContactUsBtnText, ContactUsBtnWrapper } from "./style";

export function ContactUsBtn() {
  return (
    <ContactUsBtnWrapper href={DISCORD_LINK} target="_blank">
      <ChatIcon />
      <ContactUsBtnText>Contact Us</ContactUsBtnText>
    </ContactUsBtnWrapper>
  );
}
