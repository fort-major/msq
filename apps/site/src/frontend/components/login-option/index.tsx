import { Principal } from "@dfinity/principal";
import { BoopAvatar } from "../boop-avatar";
import { LoginOptionContent, LoginOptionPrincipal, LoginOptionPseudonym, LoginOptionWrapper } from "./style";
import { ErrorCode, err } from "@fort-major/masquerade-shared";

export interface ILoginOptionProps {
  pseudonym: string;
  principal: string;
  onClick: () => void;
}

export function LoginOption(props: ILoginOptionProps) {
  const handleClick = (e: MouseEvent) => {
    if (!e.isTrusted) {
      err(ErrorCode.SECURITY_VIOLATION, "No automation is allowed!");
    }

    props.onClick();
  };

  return (
    <LoginOptionWrapper onClick={handleClick}>
      <BoopAvatar size={60} eyesAngle={90} principal={Principal.fromText(props.principal)} />
      <LoginOptionContent>
        <LoginOptionPseudonym>{props.pseudonym}</LoginOptionPseudonym>
        <LoginOptionPrincipal>{props.principal}</LoginOptionPrincipal>
      </LoginOptionContent>
    </LoginOptionWrapper>
  );
}
