import { Principal } from "@dfinity/principal";
import { BoopAvatarWrapper } from "./style";
import { makeAvatarSvg } from "@fort-major/msq-shared";
import D from "dompurify";

export interface IBoopAvatarProps {
  /**
   * - First byte - body color
   * - Second byte - body angle
   * - Third byte - face expression (mouth type)
   */
  principal: Principal;
  size: number;
}

export function BoopAvatar(props: IBoopAvatarProps) {
  return (
    <BoopAvatarWrapper
      size={props.size}
      ref={(r) => {
        r.innerHTML = D.sanitize(makeAvatarSvg(props.principal));
      }}
    />
  );
}
