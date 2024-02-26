import { Size16, Text, WeightMedium } from "../../ui-kit/typography";
import { NotificationBarWrapper } from "./style";

export function NotificationBar() {
  return (
    <NotificationBarWrapper>
      <Text size={16} weight={500}>
        Caution: This is a Beta version software. Please use it for small transactions only, as it's still under
        development.
      </Text>
    </NotificationBarWrapper>
  );
}
