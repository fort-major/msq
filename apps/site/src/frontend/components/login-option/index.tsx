import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import { LoginOptionContent, LoginOptionPrincipal, LoginOptionWrapper } from "./style";
import { Show, createSignal } from "solid-js";
import { eventHandler } from "../../utils";
import { Input } from "../../ui-kit/input";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { ColorGray140, Size12, Size16, Text, WeightSemiBold } from "../../ui-kit/typography";
import { COLOR_GRAY_140 } from "../../ui-kit";

export interface ILoginOptionProps {
  pseudonym: string;
  principal: string;
  onClick?: () => void;
  onEdit?: (newValue: string) => void;
}

export function LoginOption(props: ILoginOptionProps) {
  const handleClick = eventHandler((e: MouseEvent) => {
    props.onClick?.();
  });

  const handleChange = (newPseudonym: string) => {
    props.onEdit!(newPseudonym);
    setIsEdited(false);
  };

  const toggleEdit = () => {
    setIsEdited(!isEdited());
  };

  const editable = () => !!props.onEdit;
  const [isEdited, setIsEdited] = createSignal<boolean>(false);

  return (
    <LoginOptionWrapper editable={editable()} onClick={handleClick}>
      <BoopAvatar size={60} principal={Principal.fromText(props.principal)} />
      <LoginOptionContent>
        <Show
          when={isEdited()}
          fallback={
            <Text size={16} weight={600}>
              {props.pseudonym}
            </Text>
          }
        >
          <Input
            label="Pseudonym"
            required
            autofocus
            KindString={{
              defaultValue: props.pseudonym,
              onChange: handleChange,
              validate: (name) => (name.length === 0 ? "Please type something..." : null),
            }}
          />
        </Show>
        <Text size={12} color={COLOR_GRAY_140} class={LoginOptionPrincipal}>
          {props.principal}
        </Text>
      </LoginOptionContent>
      <Show when={editable()}>
        <Icon kind={EIconKind.Edit} size={20} onClick={toggleEdit} />
      </Show>
    </LoginOptionWrapper>
  );
}
