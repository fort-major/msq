import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import {
  LoginOptionContent,
  LoginOptionPrincipal,
  LoginOptionPseudonym,
  LoginOptionPseudonymEdit,
  LoginOptionWrapper,
} from "./style";
import { Show, createSignal } from "solid-js";
import { assertEventSafe } from "../../utils";
import { EditIcon } from "../typography/icons";
import { Input } from "../../ui-kit/input";

export interface ILoginOptionProps {
  pseudonym: string;
  principal: string;
  onClick?: () => void;
  onEdit?: (newValue: string) => void;
}

export function LoginOption(props: ILoginOptionProps) {
  const handleClick = (e: MouseEvent) => {
    if (!props.onClick) return;

    assertEventSafe(e);

    props.onClick();
  };

  const handleChange = (newPseudonym: string) => {
    props.onEdit!(newPseudonym);

    setIsEdited(false);
  };

  const toggleEdit = (e: MouseEvent) => {
    assertEventSafe(e);

    setIsEdited(!isEdited());
  };

  const handleBlur = (isErr: boolean) => {
    if (!isErr) setIsEdited(false);
  };

  const editable = () => !!props.onEdit;
  const [isEdited, setIsEdited] = createSignal<boolean>(false);

  return (
    <LoginOptionWrapper editable={editable()} onClick={handleClick}>
      <BoopAvatar size={60} principal={Principal.fromText(props.principal)} />
      <LoginOptionContent>
        <Show when={isEdited()} fallback={<LoginOptionPseudonym>{props.pseudonym}</LoginOptionPseudonym>}>
          <Input
            label="Pseudonym"
            required
            autofocus
            onBlur={handleBlur}
            kind={{
              String: {
                defaultValue: props.pseudonym,
                onChange: handleChange,
                validate: (name) => (name.length === 0 ? "Please type something..." : null),
              },
            }}
          />
        </Show>
        <LoginOptionPrincipal>{props.principal}</LoginOptionPrincipal>
      </LoginOptionContent>
      <Show when={editable()}>
        <EditIcon onClick={toggleEdit} />
      </Show>
    </LoginOptionWrapper>
  );
}
