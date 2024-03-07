import { Principal } from "@dfinity/principal";

/**
 * Creates an SVG string for an avatar based on a given Principal object, with an optional background color.
 * This function utilizes the Principal object to determine the avatar's body color, body angle, and face expression
 * by converting the Principal to a byte array and applying specific functions to select these attributes.
 * The resulting avatar is then generated using the `makeAvatarSvgCustom` function, ensuring a unique and
 * consistent visual representation based on the Principal's information.
 *
 * @param {Principal} principal - The Principal object from which to generate the avatar.
 * @param {string} [bgColor="#1E1F28"] - Optional background color of the SVG. Defaults to a dark gray if not specified.
 * @returns {string} A string representation of the SVG for the avatar, customized based on the Principal object.
 */
export function makeAvatarSvg(principal: Principal, bgColor: string = "#1E1F28"): string {
  const principalBytes = principalToBytes(principal);
  const bodyColor = getBodyColor(principalBytes);
  const bodyAngle = getBodyAngle(principalBytes);
  const faceExpression = getFaceExpressionPath(principalBytes);

  return makeAvatarSvgCustom(principal.toText(), bodyColor, bodyAngle, faceExpression, bgColor);
}

/**
 * Generates a custom avatar SVG string based on provided parameters including body color, body angle,
 * face expression, and optional background and eye colors. This function allows for the creation of a
 * personalized avatar with specific characteristics defined by the input parameters. The SVG is constructed
 * with various elements such as circles for the body and eyes, and a custom path for the face expression.
 * Additional details like eye pupils and mouth are also included, with positions adjusted based on the body angle.
 *
 * @param {string} id - A unique identifier used to generate clip paths for the eyes, ensuring they are unique within the SVG.
 * @param {string} bodyColor - The fill color for the avatar's body.
 * @param {IAngle} bodyAngle - An object containing the center coordinates for the body and face, used to position elements.
 * @param {string} faceExpression - A string representing the SVG path for the face expression.
 * @param {string} [bgColor="#1E1F28"] - Optional background color of the SVG. Defaults to a dark gray if not specified.
 * @param {string} [eyeWhiteColor="white"] - Optional color for the whites of the eyes. Defaults to white if not specified.
 * @returns {string} A string representation of the SVG for the custom avatar.
 */
export function makeAvatarSvgCustom(
  id: string,
  bodyColor: string,
  bodyAngle: IAngle,
  faceExpression: string,
  bgColor: string = "#1E1F28",
  eyeWhiteColor: string = "white",
): string {
  const { bodyCx, bodyCy, faceX, faceY } = bodyAngle;

  const eyeWhite1Cx = faceX + EYE_WHITE_1_CX;
  const eyeWhite1Cy = faceY + EYE_WHITE_1_CY;
  const eyePupil1Cx = faceX + EYE_PUPIL_1_CX;
  const eyePupil1Cy = faceY + EYE_PUPIL_1_CY;

  const eyeWhite2Cx = faceX + EYE_WHITE_2_CX;
  const eyeWhite2Cy = faceY + EYE_WHITE_2_CY;
  const eyePupil2Cx = faceX + EYE_PUPIL_2_CX;
  const eyePupil2Cy = faceY + EYE_PUPIL_2_CY;

  const mouthX = faceX + MOUTH_X;
  const mouthY = faceY + MOUTH_Y;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" style="position:relative;width:100%;height:100%;" viewBox="0 0 100 100" fill="none">
      <defs>
        <clipPath id="clip-eye-1-${id}">
          <circle cx="${eyeWhite1Cx}" cy="${eyeWhite1Cy}" r="6" />
        </clipPath>
        <clipPath id="clip-eye-2-${id}">
          <circle cx="${eyeWhite2Cx}" cy="${eyeWhite2Cy}" r="6" />
        </clipPath>
      </defs>

      <rect id="bg" x="0" y="0" width="100" height="100" fill="${bgColor}"/>

      <g id="body-group">
        <circle id="body" cx="${bodyCx}" cy="${bodyCy}" r="50" fill="${bodyColor}" />

        <circle id="eye-white-1" cx="${eyeWhite1Cx}" cy="${eyeWhite1Cy}" r="6" fill="${eyeWhiteColor}" />
        <circle id="eye-pupil-1" cx="${eyePupil1Cx}" cy="${eyePupil1Cy}" r="5" fill="#0A0B15" clip-path="url(#clip-eye-1-${id})" />

        <circle id="eye-white-2" cx="${eyeWhite2Cx}" cy="${eyeWhite2Cy}" r="6" fill="${eyeWhiteColor}" />
        <circle id="eye-pupil-1" cx="${eyePupil2Cx}" cy="${eyePupil2Cy}" r="5" fill="#0A0B15" clip-path="url(#clip-eye-2-${id})" />

        <g transform="translate(${mouthX}, ${mouthY})" id="mouth">
          ${faceExpression}
        </g>
      </g>
    </svg>
  `;
}

const EYE_WHITE_1_CX = 6;
const EYE_WHITE_1_CY = 6;
const EYE_PUPIL_1_CX = 8;
const EYE_PUPIL_1_CY = 8;

const EYE_WHITE_2_CX = 20;
const EYE_WHITE_2_CY = 14;
const EYE_PUPIL_2_CX = 22;
const EYE_PUPIL_2_CY = 16;

const MOUTH_X = 5;
const MOUTH_Y = 16;

export interface IAngle {
  angle: number;
  bodyCx: number;
  bodyCy: number;
  faceX: number;
  faceY: number;
}

const ANGLES: IAngle[] = [
  { angle: 0, bodyCx: 50, bodyCy: 10, faceX: 37, faceY: 30 },
  { angle: 45, bodyCx: 78, bodyCy: 28, faceX: 44, faceY: 37 },
  { angle: 90, bodyCx: 90, bodyCy: 50, faceX: 47, faceY: 40 },
  { angle: 135, bodyCx: 78, bodyCy: 72, faceX: 44, faceY: 43 },
  { angle: 180, bodyCx: 50, bodyCy: 90, faceX: 37, faceY: 50 },
  { angle: 225, bodyCx: 22, bodyCy: 72, faceX: 30, faceY: 43 },
  { angle: 270, bodyCx: 10, bodyCy: 50, faceX: 27, faceY: 40 },
  { angle: 315, bodyCx: 28, bodyCy: 22, faceX: 24, faceY: 33 },
];

const COLORS = ["#E0FF25", "#53FF50", "#15E3FF", "#5057FF", "#FF41FF", "#FF7425"];
export const FACE_EXPRESSIONS = [
  '<path d="M6.75849 3.72182C6.31192 4.57678 4.73325 4.63476 3.23244 3.85134C1.73163 3.06791 0.876998 1.73974 1.32357 0.88478C1.77014 0.0298204 3.34881 -0.0281685 4.84962 0.755257C6.35043 1.53868 7.20506 2.86686 6.75849 3.72182Z" fill="#0A0B15"/>',
  '<path d="M0.956196 1.09177C3.0421 -0.419213 6.74305 1.4694 6.76157 4.04483C6.77199 4.77388 5.79431 5.13553 5.21327 4.61908L4.95151 4.39549C3.88305 3.47076 2.77807 2.97453 1.40781 2.6807C0.641729 2.51747 0.368232 1.51373 0.956196 1.09177Z" fill="#0A0B15"/>',
  '<path d="M0.865559 0.821842C0.825558 3.3972 4.49638 5.34373 6.61593 3.88063C7.2189 3.4707 6.95387 2.46253 6.19745 2.28317L5.86412 2.19716C4.49361 1.85302 3.45302 1.23303 2.4259 0.27962C1.85252 -0.254002 0.873602 0.0981793 0.865559 0.821842Z" fill="#0A0B15"/>',
  '<path d="M4.91198 3.99866C4.20534 4.36515 4.45556 2.44633 3.18384 1.70473C1.98614 1.05171 0.175067 2.22433 0.12761 1.39181C0.0823068 0.59708 2.97178 -0.113834 4.07479 0.536281C5.17781 1.1864 5.65224 3.61473 4.91198 3.99866Z" fill="#0A0B15"/>',
];

/**
 * Converts a Principal object into a fixed-size byte array.
 * The function first converts the Principal object into a Uint8Array, then pads
 * the array with zeros to ensure it has a length of 29 bytes. This is useful
 * for cases where a fixed-length byte representation is required.
 *
 * @param {Principal} principal - The Principal object to be converted.
 * @returns {number[]} A byte array representation of the Principal object, padded to 29 bytes.
 */
function principalToBytes(principal: Principal): number[] {
  const arr1 = principal.toUint8Array();
  const arr2 = Array(29 - arr1.length).fill(0);

  return [...arr1, ...arr2];
}

/**
 * Determines the body color based on the first byte of a given byte array.
 * The function calculates the index by taking the modulo of the first byte value
 * with the length of the COLORS array, and then returns the color at that index
 * from the COLORS array. This can be used to assign a consistent, deterministic
 * color based on the Principal's byte representation.
 *
 * @param {number[]} principalBytes - An array of bytes, typically representing a Principal object.
 * @returns {string} The color string corresponding to the calculated index in the COLORS array.
 */
function getBodyColor(principalBytes: number[]): string {
  return COLORS[principalBytes[0] % COLORS.length];
}

/**
 * Calculates the body angle based on the second byte of a given byte array.
 * This function determines the index by taking the modulo of the second byte value
 * with the length of the ANGLES array. It then returns the angle object at that index
 * from the ANGLES array. This method provides a way to assign a consistent, deterministic
 * angle based on the Principal's byte representation, which can be useful for graphical
 * representations or orientations.
 *
 * @param {number[]} principalBytes - An array of bytes, usually representing a Principal object.
 * @returns {IAngle} The angle object corresponding to the calculated index in the ANGLES array.
 */
function getBodyAngle(principalBytes: number[]): IAngle {
  return ANGLES[principalBytes[1] % ANGLES.length];
}

/**
 * Retrieves the path for a face expression based on the third byte of a given byte array.
 * This function calculates the index by taking the modulo of the third byte's value
 * with the length of the FACE_EXPRESSIONS array. It then returns the path for the face expression
 * located at that index within the FACE_EXPRESSIONS array. This approach ensures a consistent,
 * deterministic selection of face expressions based on the Principal's byte representation,
 * which can be used for visual character customization.
 *
 * @param {number[]} principalBytes - An array of bytes, typically representing a Principal object.
 * @returns {string} The path string for the face expression corresponding to the calculated index in the FACE_EXPRESSIONS array.
 */
function getFaceExpressionPath(principalBytes: number[]): string {
  return FACE_EXPRESSIONS[principalBytes[2] % FACE_EXPRESSIONS.length];
}
