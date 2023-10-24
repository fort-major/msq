import { styled } from "solid-styled-components";
import { COLOR_ACCENT } from "../../styles";

export const Title = styled.h3<{ weight?: number }>`
  color: #fff;
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: ${(props) => props.weight ?? 600};
  line-height: 100%; /* 20px */
  letter-spacing: -0.4px;
`;

export const Subtitle = styled.h3`
  color: #676767;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;

export const Accent = styled.span<{ size?: number }>`
  color: ${COLOR_ACCENT};

  font-family: DM Sans;
  font-size: inherit;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 24px */
  letter-spacing: -0.48px;

  ${(props) => (props.size ? `font-size: ${props.size}px;` : "")}
`;

export const Dim = styled.span<{ size?: number }>`
  color: rgba(255, 255, 255, 0.35);

  font-family: DM Sans;
  font-size: ${(props) => (props.size ? props.size : "20")}px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 20px */
  letter-spacing: -0.4px;
`;
