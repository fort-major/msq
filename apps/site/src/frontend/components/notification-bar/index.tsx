import { Text } from "../../ui-kit/typography";
import { Show } from "solid-js";
import { NotificationBarWrapper } from "./style";

export function NotificationBar(props: { barVisible?: boolean }) {
  return (
    <Show when={props.barVisible}>
      <NotificationBarWrapper>
        <Text size={16} weight={500}>
          Caution: This is a Beta version software. Please use it for small transactions only, as it's still under
          development.
        </Text>
      </NotificationBarWrapper>
    </Show>
  );
}
