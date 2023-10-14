import { styled } from "solid-styled-components";

export const COLOR_GRAY = "#2F2F38";
export const COLOR_BG = "#0A0B15";

export const Root = styled.div`
  position: relative;
  min-height: 100%;
  display: flex;
  flex-flow: column nowrap;
`;

export const Page = styled.main`
  position: relative;
  background-color: ${COLOR_BG};
  flex-grow: 1;
`;
