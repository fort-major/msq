import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import { LoginOptionContent, LoginOptionPrincipal, LoginOptionWrapper } from "./style";
import { Show, createSignal } from "solid-js";
import { eventHandler } from "../../utils";
import { Input } from "../../ui-kit/input";
import { Span600, SpanGray140, Text12, Text16 } from "../../ui-kit/typography";
import { EIconKind, Icon } from "../../ui-kit/icon";

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
            <Text16>
              <Span600>{props.pseudonym}</Span600>
            </Text16>
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
        <Text12 class={LoginOptionPrincipal}>
          <SpanGray140>{props.principal}</SpanGray140>
        </Text12>
      </LoginOptionContent>
      <Show when={editable()}>
        <Icon kind={EIconKind.Edit} size={20} onClick={toggleEdit} />
      </Show>
    </LoginOptionWrapper>
  );
}
