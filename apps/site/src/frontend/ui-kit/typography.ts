import { css, styled } from "solid-styled-components";
import {
  COLOR_BLUE,
  COLOR_CHARTREUSE,
  COLOR_ERROR_RED,
  COLOR_GRAY_115,
  COLOR_GRAY_120,
  COLOR_GRAY_130,
  COLOR_GRAY_140,
  COLOR_GRAY_150,
  COLOR_GRAY_165,
  COLOR_WHITE,
} from ".";

export const DefaultFont = "font-family: DM Sans;";
export const DefaultColor = `color: ${COLOR_WHITE};`;

export const H1 = styled.h1`
  ${DefaultFont}
  ${DefaultColor}

  font-size: 100px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 90px */
`;

export const H2 = styled.h2`
  ${DefaultFont}
  ${DefaultColor}

  font-size: 80px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 72px */
`;

export const H3 = styled.h3`
  ${DefaultFont}
  ${DefaultColor}

  font-size: 60px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 54px */
`;

export const H4 = styled.h4`
  ${DefaultFont}
  ${DefaultColor}

  font-size: 40px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 36px */
`;

export const H5 = styled.h5`
  ${DefaultFont}
  ${DefaultColor}
  
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 36px */
`;

export const Text = styled.p<{
  size: number;
  color?: string;
  weight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  striked?: boolean;
}>`
  ${DefaultFont}

  font-size: ${(props) => props.size}px;
  font-style: normal;
  font-weight: ${(props) => props.weight || 400};
  line-height: ${(props) => props.lineHeight || 100}%;
  color: ${(props) => props.color || COLOR_WHITE};
  letter-spacing: ${(props) => props.letterSpacing || 0}px;
  ${(props) => (props.striked ? "text-decoration: line-through;" : "")}
`;

export const Size12 = css`
  font-size: 12px;
`;

export const Size14 = css`
  font-size: 14px;
`;

export const Size16 = css`
  font-size: 16px;
`;

export const Size18 = css`
  font-size: 18px;
`;

export const Size20 = css`
  font-size: 20px;
`;

export const Size24 = css`
  font-size: 24px;
`;

export const ColorAccent = css`
  color: ${COLOR_CHARTREUSE};
`;

export const ColorError = css`
  color: ${COLOR_ERROR_RED};
`;

export const ColorWhite = css`
  color: ${COLOR_WHITE};
`;

export const ColorGray115 = css`
  color: ${COLOR_GRAY_115};
`;

export const ColorGray120 = css`
  color: ${COLOR_GRAY_120};
`;

export const ColorGray130 = css`
  color: ${COLOR_GRAY_130};
`;

export const ColorGray140 = css`
  color: ${COLOR_GRAY_140};
`;

export const ColorGray150 = css`
  color: ${COLOR_GRAY_150};
`;

export const ColorGray165 = css`
  color: ${COLOR_GRAY_165};
`;

export const WeightSemiBold = css`
  font-weight: 600;
`;

export const WeightMedium = css`
  font-weight: 500;
`;

export const WeightRegular = css`
  font-weight: 400;
`;

export const SpanLink = styled.a`
  color: ${COLOR_BLUE};
  text-decoration: underline;
  cursor: pointer;
`;

export const StrikedText = css`
  text-decoration: line-through;
`;

export const LineHeight150 = css`
  line-height: 150%;
`;
