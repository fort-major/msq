import { styled } from "solid-styled-components";
import { COLOR_GRAY } from "../../styles";

export const Divider = styled.div`
  width: 100%;
  height: 1px;

  background-color: ${COLOR_GRAY};
`;

export const VerticalDivider = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
  width: 1px;

  background-color: ${COLOR_GRAY};
`;
