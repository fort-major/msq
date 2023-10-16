import { Principal } from "@dfinity/principal";
import { Background, Body, EyePupil, EyeWhite, Eyes, Face, Mouth, MouthWrapper } from "./style";
import { colors } from "../../utils/colors";

export interface IBoopAvatarProps {
  /**
   * - First byte - body color
   * - Second byte - body angle
   * - Third byte - face expression (mouth type)
   */
  principal: Principal;
  size: number;
  eyesAngle: number;
}

function principalToBytes(principal: Principal): number[] {
  const arr1 = principal.toUint8Array();
  const arr2 = Array(29 - arr1.length).fill(0);

  return [...arr1, ...arr2];
}

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function getColors(principalBytes: number[]): [string, string] {
  const bodyIdx = principalBytes[0] % colors.length;

  return ["#ffffff", colors[bodyIdx]];
}

function getBodyAngle(principalBytes: number[]): number {
  return ANGLES[principalBytes[1] % ANGLES.length];
}

function getFaceExpression(principalBytes: number[]): 1 | 2 | 3 {
  return ((principalBytes[2] % 3) + 1) as 1 | 2 | 3;
}

export function BoopAvatar(props: IBoopAvatarProps) {
  const principalBytes = principalToBytes(props.principal);
  const [bgColor, bodyColor] = getColors(principalBytes);
  const bodyAngle = getBodyAngle(principalBytes);
  const faceExpression = getFaceExpression(principalBytes);

  return (
    <Background color={bgColor} width={props.size} height={props.size}>
      <Body color={bodyColor} width={props.size} height={props.size} angle={bodyAngle}>
        <Face bodyAngle={bodyAngle}>
          <Eyes gap={props.size * 0.06}>
            <EyeWhite size={props.size * 0.15}>
              <EyePupil size={props.size * 0.12} parentCenter={props.size * 0.075} eyesAngle={props.eyesAngle} />
            </EyeWhite>

            <EyeWhite size={props.size * 0.15}>
              <EyePupil size={props.size * 0.12} parentCenter={props.size * 0.075} eyesAngle={props.eyesAngle} />
            </EyeWhite>
          </Eyes>

          <MouthWrapper>
            <Mouth type={faceExpression} size={props.size * 0.08} />
          </MouthWrapper>
        </Face>
      </Body>
    </Background>
  );
}
