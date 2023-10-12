import { Principal } from "@dfinity/principal";
import { Background, Body, EyePupil, EyeWhite, Eyes, Face, Mouth, MouthWrapper } from "./style";

export interface IBoopAvatarProps {
  /**
   * - First byte - background color
   * - Second byte - body color
   * - Third byte - body angle
   * - Forth byte - face expression (mouth type)
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
const COLORS = ["#FF7425", "#FBFF1B", "#15E3FF", "#5FFF3F", "#4047FF", "#FF41FF"];

function getColors(principalBytes: number[]): [string, string] {
  const bgIdx = principalBytes[0] % COLORS.length;
  let bodyIdx = principalBytes[1] % COLORS.length;

  if (bgIdx === bodyIdx) {
    bodyIdx = (bodyIdx + 1) % COLORS.length;
  }

  return [COLORS[bgIdx], COLORS[bodyIdx]];
}

function getBodyAngle(principalBytes: number[]): number {
  return ANGLES[principalBytes[2] % ANGLES.length];
}

function getFaceExpression(principalBytes: number[]): 1 | 2 | 3 {
  return (principalBytes[3] % 3) as 1 | 2 | 3;
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
