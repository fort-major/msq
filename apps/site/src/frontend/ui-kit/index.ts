import { css, keyframes, styled } from "solid-styled-components";

export const COLOR_BLACK = "#0A0B15";
export const COLOR_WHITE = "#FFFFFF";

export const COLOR_GRAY_105 = "#161721";
export const COLOR_GRAY_108 = "#1D1E27";
export const COLOR_GRAY_110 = "#22232C";
export const COLOR_GRAY_115 = "#2F2F38";
export const COLOR_GRAY_120 = "#3B3C44";
export const COLOR_GRAY_125 = "#474850";
export const COLOR_GRAY_130 = "#53545B";
export const COLOR_GRAY_140 = "#6C6D73";
export const COLOR_GRAY_150 = "#84858A";
export const COLOR_GRAY_165 = "#A9AAAD";
export const COLOR_GRAY_175 = "#C2C2C4";
export const COLOR_GRAY_190 = "#E6E6E7";

export const COLOR_CHARTREUSE = "#E0FF25";
export const COLOR_ACCENT = COLOR_CHARTREUSE;
export const COLOR_GREEN = "#53FF50";
export const COLOR_BLUE = "#15E3FF";
export const COLOR_DARK_BLUE = "#5057FF";
export const COLOR_PINK = "#FF41FF";
export const COLOR_ORANGE = "#FF7425";
export const COLOR_ERROR_RED = "#FC2D2D";

export const HEADER_HEIGHT = 80;
export const BAR_HEIGHT = 40;

export const ANIM_DURATION = "0.3s";

export const Root = styled.div`
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  min-height: 100vh;
`;

export const Page = styled.main`
  position: relative;
  background-color: ${COLOR_BLACK};
  padding-top: ${(HEADER_HEIGHT + BAR_HEIGHT).toString()}px;
  display: flex;
  flex-flow: column nowrap;
  flex: 1;
`;

export const CabinetPage = styled.div`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 23% auto;
`;

export const CabinetContent = styled.section`
  position: relative;
  margin-top: 60px;

  width: 100%;
  max-width: 880px;
`;

export const CabinetHeading = styled.h2`
  color: #fff;

  font-family: DM Sans;
  font-size: 80px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 72px */
`;

export const BlinkKeyframes = keyframes`
  0% {
    background-color: ${COLOR_GRAY_130};
  }
  100% {
    background-color: transparent;
  }
`;

export const BlinkAnimation = `
  animation: ${ANIM_DURATION} ease-out ${BlinkKeyframes};
`;

export const Blinky = css`
  ${BlinkAnimation}
`;
