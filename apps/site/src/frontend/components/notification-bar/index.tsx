import { Span500, Text16 } from "../../ui-kit/typography";
import { NotificationBarWrapper } from "./style";

export function NotificationBar() {
  return (
    <NotificationBarWrapper>
      <Text16>
        <Span500>
          Caution: This is a Beta version software. Please use it for small transactions only, as it's still under
          development.
        </Span500>
      </Text16>
    </NotificationBarWrapper>
  );
}
