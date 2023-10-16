import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import { LoginOptionContent, LoginOptionPrincipal, LoginOptionPseudonym, LoginOptionWrapper } from "./style";

export interface ILoginOptionProps {
  pseudonym: string;
  principal: string;
  onClick: () => void;
}

export function LoginOption(props: ILoginOptionProps) {
  return (
    <LoginOptionWrapper onClick={props.onClick}>
      <BoopAvatar size={60} eyesAngle={90} principal={Principal.fromText(props.principal)} />
      <LoginOptionContent>
        <LoginOptionPseudonym>{props.pseudonym}</LoginOptionPseudonym>
        <LoginOptionPrincipal>{props.principal}</LoginOptionPrincipal>
      </LoginOptionContent>
    </LoginOptionWrapper>
  );
}
