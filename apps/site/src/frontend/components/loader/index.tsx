import { keyframes, styled } from "solid-styled-components";
import GroundPatternSvg from "#assets/loader-ground.svg";
import { COLOR_BLACK } from "../../ui-kit";
import { onCleanup, onMount } from "solid-js";

const BOOP_SIZE = 70;
const SPEED_PX_S = 150;
const WIDTH_PX = document.getElementById("root")!.offsetWidth + BOOP_SIZE * 2;
const FULL_CYCLE_TIME_S = (WIDTH_PX / SPEED_PX_S).toPrecision(2);
const JUMP_TIME_S = 1;
const JUMP_BACKSHIFT_PX = Math.floor((0.2 * JUMP_TIME_S * SPEED_PX_S) / 2);

const COLORS_ANIM_DURATION = 5 * JUMP_TIME_S;

const BoopJump = keyframes`
  0% {
    transform: translate(0, 5px) scale(1.3, 0.8);
  }
  10% {
    transform: translate(-${JUMP_BACKSHIFT_PX.toString()}px, 0) scale(1, 1);
  }
  35% {
    transform: translate(-${Math.floor(JUMP_BACKSHIFT_PX / 2).toString()}px, -80px) scale(1, 1);
  }
  50% {
    transform: translate(0, -92px) scale(1, 1);
  }
  65% {
    transform: translate(${Math.floor(JUMP_BACKSHIFT_PX / 2).toString()}px, -80px) scale(1, 1);
  }
  90% {
    transform: translate(${JUMP_BACKSHIFT_PX.toString()}px, 0) scale(1, 1);
  }
  100% {
    transform: translate(0, 5px) scale(1.3, 0.8);
  }
`;

const BoopSvg = styled.svg`
  animation: ${BoopJump} ${JUMP_TIME_S.toString()}s linear infinite;
`;

const BoopColorChange = keyframes`
  0% {
    fill: #53FF50;
  }
  19% {
    fill: #53FF50;
  }
  20% {
    fill: #15E3FF;
  }
  39% {
    fill: #15E3FF;
  }
  40% {
    fill: #FF41FF;
  }
  59% {
    fill: #FF41FF;
  }
  60% {
    fill: #5057FF;
  }
  79% {
    fill: #5057FF;
  }
  80% {
    fill: #FF7425;
  }
  99% {
    fill: #FF7425;
  }
  100% {
    fill: #53FF50;
  }
`;

const BoopBodyPath = styled.path`
  animation: ${BoopColorChange} ${COLORS_ANIM_DURATION.toString()}s linear infinite;
`;

const BoopFaceWobble = keyframes`
  0% {
    transform: translate(0, 0);
  }
  90% {
    transform: translate(0, 0);
  }
  91% {
    transform: translate(0, 10px);
  }
  95% {
    transform: translate(0, 12px);
  }
  100% {
    transform: translate(0, 0);
  }
`;

const BoopFace = styled.g`
  animation: ${BoopFaceWobble} ${JUMP_TIME_S.toString()}s linear infinite;
`;

const BoopMove = keyframes`
  0% {
    left: -${(BOOP_SIZE * 2).toString()}px;
  }
  100% {
    left: ${WIDTH_PX.toString()}px;
  }
`;

const BoopWrapper = styled.div`
  position: absolute;
  left: -${(BOOP_SIZE * 2).toString()}px;
  bottom: 0;

  animation: ${BoopMove} ${FULL_CYCLE_TIME_S.toString()}s linear infinite;
`;

function LoaderBoop() {
  return (
    <BoopSvg width={BOOP_SIZE} height={BOOP_SIZE} viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="boop spinner" clip-path="url(#clip0_1_868)">
        <rect width="1440" height="1024" transform="translate(-292 -704)" fill="#0A0B15" />
        <g id="Boop" clip-path="url(#clip1_1_868)">
          <BoopBodyPath
            id="Vector"
            d="M35 70C54.33 70 70 54.33 70 35C70 15.67 54.33 0 35 0C15.67 0 0 15.67 0 35C0 54.33 15.67 70 35 70Z"
            fill="#53FF50"
          />
          <BoopFace id="Face">
            <g id="Eyes">
              <g id="Eye2">
                <path
                  id="Vector_2"
                  d="M60.8677 41.0806C63.2723 41.0806 65.2217 39.1312 65.2217 36.7266C65.2217 34.3219 63.2723 32.3726 60.8677 32.3726C58.463 32.3726 56.5137 34.3219 56.5137 36.7266C56.5137 39.1312 58.463 41.0806 60.8677 41.0806Z"
                  fill="white"
                />
                <g id="Clip path group">
                  <mask
                    id="mask0_1_868"
                    style="mask-type:luminance"
                    maskUnits="userSpaceOnUse"
                    x="56"
                    y="32"
                    width="10"
                    height="10"
                  >
                    <g id="b">
                      <path
                        id="Vector_3"
                        d="M60.8677 41.0806C63.2723 41.0806 65.2217 39.1312 65.2217 36.7266C65.2217 34.3219 63.2723 32.3726 60.8677 32.3726C58.463 32.3726 56.5137 34.3219 56.5137 36.7266C56.5137 39.1312 58.463 41.0806 60.8677 41.0806Z"
                        fill="white"
                      />
                    </g>
                  </mask>
                  <g mask="url(#mask0_1_868)">
                    <g id="Group">
                      <path
                        id="Vector_4"
                        d="M62.0518 41.3699C63.9616 41.3699 65.5098 39.8217 65.5098 37.9119C65.5098 36.0021 63.9616 34.4539 62.0518 34.4539C60.142 34.4539 58.5938 36.0021 58.5938 37.9119C58.5938 39.8217 60.142 41.3699 62.0518 41.3699Z"
                        fill="#0A0B15"
                      />
                    </g>
                  </g>
                </g>
              </g>
              <g id="Eye1">
                <path
                  id="Vector_5"
                  d="M51.3052 35.56C53.7098 35.56 55.6592 33.6107 55.6592 31.2061C55.6592 28.8014 53.7098 26.8521 51.3052 26.8521C48.9005 26.8521 46.9512 28.8014 46.9512 31.2061C46.9512 33.6107 48.9005 35.56 51.3052 35.56Z"
                  fill="white"
                />
                <g id="Clip path group_2">
                  <mask
                    id="mask1_1_868"
                    style="mask-type:luminance"
                    maskUnits="userSpaceOnUse"
                    x="46"
                    y="26"
                    width="10"
                    height="10"
                  >
                    <g id="c">
                      <path
                        id="Vector_6"
                        d="M51.3052 35.56C53.7098 35.56 55.6592 33.6107 55.6592 31.2061C55.6592 28.8014 53.7098 26.8521 51.3052 26.8521C48.9005 26.8521 46.9512 28.8014 46.9512 31.2061C46.9512 33.6107 48.9005 35.56 51.3052 35.56Z"
                        fill="white"
                      />
                    </g>
                  </mask>
                  <g mask="url(#mask1_1_868)">
                    <g id="Group_2">
                      <path
                        id="Vector_7"
                        d="M52.4853 35.8447C54.3951 35.8447 55.9433 34.2965 55.9433 32.3867C55.9433 30.4769 54.3951 28.9287 52.4853 28.9287C50.5755 28.9287 49.0273 30.4769 49.0273 32.3867C49.0273 34.2965 50.5755 35.8447 52.4853 35.8447Z"
                        fill="#0A0B15"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </g>
            <path
              id="Mouth"
              d="M51.4887 37.9259C51.3487 39.6199 53.5654 40.8939 54.9607 39.9279C55.3574 39.6573 55.2361 38.9946 54.7694 38.8779L54.5641 38.8219C53.7194 38.5979 53.0941 38.1919 52.4921 37.5666C52.1561 37.2166 51.5261 37.4499 51.4887 37.9259Z"
              fill="#0A0B15"
            />
          </BoopFace>
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1_868">
          <rect width="1440" height="1024" fill="white" transform="translate(-292 -704)" />
        </clipPath>
        <clipPath id="clip1_1_868">
          <rect width="70" height="70" fill="white" />
        </clipPath>
      </defs>
    </BoopSvg>
  );
}

export function Loader() {
  onMount(() => {
    document.body.style.cursor = "wait";
  });

  onCleanup(() => {
    document.body.style.cursor = "unset";
  });

  return (
    <LoaderWrapper>
      <LoaderText>Loading...</LoaderText>
      <LoaderAir>
        <BoopWrapper>
          <LoaderBoop />
        </BoopWrapper>
      </LoaderAir>
      <LoaderGround />
    </LoaderWrapper>
  );
}

const LoaderWrapper = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: ${COLOR_BLACK};
  z-index: 9;

  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
`;

const LoaderText = styled.p`
  color: #84858a;
  font-family: DM Sans;
  font-size: 30px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
`;

const LoaderAir = styled.div`
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;

  height: 150px;
  width: 100%;
`;

const LoaderGround = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  height: 80px;
  width: 100%;

  border-top: 3px solid #474850;

  background-image: url(${GroundPatternSvg});
  background-repeat: repeat;
`;
