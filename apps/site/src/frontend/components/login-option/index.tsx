import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import {
  LoginOptionContent,
  LoginOptionIcon,
  LoginOptionPrincipal,
  LoginOptionPseudonym,
  LoginOptionPseudonymEdit,
  LoginOptionWrapper,
} from "./style";
import { ErrorCode, err } from "@fort-major/masquerade-shared";
import EditSVG from "#assets/edit.svg";
import { Match, Show, Switch, createSignal } from "solid-js";
import { assertEventSafe } from "../../utils";

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

  const handleEdit = (e: Event) => {
    assertEventSafe(e);

    if (isEdited()) {
      props.onEdit!(pseudonym());
    }

    setIsEdited(!isEdited());
  };

  const editable = () => !!props.onEdit;
  const initialPseudonym = () => props.pseudonym;
  const [pseudonym, setPseudonym] = createSignal<string>(initialPseudonym());
  const [isEdited, setIsEdited] = createSignal<boolean>(false);

  return (
    <LoginOptionWrapper editable={editable()} onClick={handleClick}>
      <BoopAvatar size={60} eyesAngle={90} principal={Principal.fromText(props.principal)} />
      <LoginOptionContent>
        <Show when={isEdited()} fallback={<LoginOptionPseudonym>{props.pseudonym}</LoginOptionPseudonym>}>
          <LoginOptionPseudonymEdit
            ref={(r) => {
              setTimeout(() => r.focus(), 1);
            }}
            type="text"
            value={pseudonym()}
            onKeyDown={(e) => e.key === "Enter" && handleEdit(e)}
            onInput={(e) => setPseudonym(e.target.value.trim())}
            onChange={handleEdit}
          />
        </Show>
        <LoginOptionPrincipal>{props.principal}</LoginOptionPrincipal>
      </LoginOptionContent>
      <Show when={editable()}>
        <LoginOptionIcon src={EditSVG} alt="edit" onClick={handleEdit} />
      </Show>
    </LoginOptionWrapper>
  );
}
