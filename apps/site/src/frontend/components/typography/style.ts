import { styled } from "solid-styled-components";
import { COLOR_ACCENT } from "../../styles";

export const Title = styled.h3`
  color: #fff;
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 20px */
  letter-spacing: -0.4px;
`;

export const Accent = styled.span`
  color: ${COLOR_ACCENT};
`;
