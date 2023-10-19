import { styled } from "solid-styled-components";

export const COLOR_GRAY = "#2F2F38";
export const COLOR_BG = "#0A0B15";
export const COLOR_ACCENT = "#E0FF25";

export const HEADER_HEIGHT = 80;

export const Root = styled.div`
  position: relative;
  min-height: 100vh;
`;

export const Page = styled.main`
  position: relative;
  background-color: ${COLOR_BG};
  min-height: 100vh;
  padding-top: ${HEADER_HEIGHT.toString()}px;
  box-sizing: border-box;
  display: flex;
`;

export const CabinetContent = styled.section`
  position: relative;
  left: 350px;
  margin-top: 60px;

  width: 100%;
  max-width: 880px;
`;

export function styledRef(it: unknown): string {
  return it as string;
}
