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

export const Text24 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
`;

export const Text20 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
`;

export const Text18 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
`;

export const Text16 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
`;

export const Text12 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%;
`;

export const Text14 = styled.p`
  ${DefaultColor}
  ${DefaultFont}

  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%;
`;

export const SpanAccent = styled.span`
  color: ${COLOR_CHARTREUSE};
`;

export const SpanError = styled.span`
  color: ${COLOR_ERROR_RED};
`;

export const SpanWhite = styled.span`
  color: ${COLOR_WHITE};
`;

export const SpanGray130 = styled.span`
  color: ${COLOR_GRAY_130};
`;

export const SpanGray140 = styled.span`
  color: ${COLOR_GRAY_140};
`;

export const SpanGray150 = styled.span`
  color: ${COLOR_GRAY_150};
`;

export const SpanGray165 = styled.span`
  color: ${COLOR_GRAY_165};
`;

export const SpanGray115 = styled.span`
  color: ${COLOR_GRAY_115};
`;

export const SpanGray120 = styled.span`
  color: ${COLOR_GRAY_120};
`;

export const Span600 = styled.span`
  font-weight: 600;
`;

export const Span500 = styled.span`
  font-weight: 500;
`;

export const Span400 = styled.span`
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
