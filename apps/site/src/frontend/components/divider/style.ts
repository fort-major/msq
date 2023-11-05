import { styled } from "solid-styled-components";
import { COLOR_GRAY_115 } from "../../ui-kit";

export const Divider = styled.div`
  width: 100%;
  height: 1px;

  background-color: ${COLOR_GRAY_115};
`;

export const VerticalDivider = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
  width: 1px;

  background-color: ${COLOR_GRAY_115};
`;
