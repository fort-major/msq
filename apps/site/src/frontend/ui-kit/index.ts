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

export const FONT_WEIGHT_THIN = 100;
export const FONT_WEIGHT_HAIRLINE = FONT_WEIGHT_THIN;
export const FONT_WEIGHT_EXTRA_LIGHT = 200;
export const FONT_WEIGHT_ULTRA_LIGHT = FONT_WEIGHT_EXTRA_LIGHT;
export const FONT_WEIGHT_LIGHT = 300;
export const FONT_WEIGHT_REGULAR = 400;
export const FONT_WEIGHT_NORMAL = FONT_WEIGHT_REGULAR;
export const FONT_WEIGHT_MEDIUM = 500;
export const FONT_WEIGHT_SEMI_BOLD = 600;
export const FONT_WEIGHT_DEMI_BOLD = FONT_WEIGHT_SEMI_BOLD;
export const FONT_WEIGHT_BOLD = 700;
export const FONT_WEIGHT_EXTRA_BOLD = 800;
export const FONT_WEIGHT_ULTRA_BOLD = FONT_WEIGHT_EXTRA_BOLD;
export const FONT_WEIGHT_BLACK = 900;
export const FONT_WEIGHT_HEAVY = FONT_WEIGHT_BLACK;
export const FONT_WEIGHT_EXTRA_BLACK = 950;
export const FONT_WEIGHT_ULTRA_BLACK = FONT_WEIGHT_EXTRA_BLACK;

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
  margin-top: ${(HEADER_HEIGHT + BAR_HEIGHT).toString()}px;
  display: flex;
  flex-flow: column nowrap;
  flex: 1;

  @media (max-width: 1024px) {
    margin-top: ${(BAR_HEIGHT * 2 + HEADER_HEIGHT).toString()}px;
  }
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
