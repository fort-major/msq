import { Principal } from "@dfinity/principal";
import { BoopAvatarWrapper } from "./style";
import { FACE_EXPRESSIONS, IAngle, makeAvatarSvg, makeAvatarSvgCustom } from "@fort-major/msq-shared";

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
        r.innerHTML = makeAvatarSvg(props.principal);
      }}
    />
  );
}

export interface ICustomBoopAvatarProps {
  id: string;
  size: number;
  angle: IAngle;
  faceExpression: 1 | 2 | 3 | 4;
  bodyColor: string;
  bgColor: string;
  eyeWhiteColor: string;
  classList?: { [k: string]: boolean };
}

export function CustomBoopAvatar(props: ICustomBoopAvatarProps) {
  return (
    <BoopAvatarWrapper
      classList={props.classList}
      size={props.size}
      ref={(r) => {
        r.innerHTML = makeAvatarSvgCustom(
          props.id,
          props.bodyColor,
          props.angle,
          FACE_EXPRESSIONS[props.faceExpression - 1],
          props.bgColor,
          props.eyeWhiteColor,
        );
      }}
    />
  );
}
