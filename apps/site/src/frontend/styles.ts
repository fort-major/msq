import { Component, JSX } from "solid-js";
import { AsProps, styled } from "solid-styled-components";

export const COLOR_GRAY = "#2F2F38";
export const COLOR_LIGHTGRAY = "#676767";
export const COLOR_BG = "#0A0B15";
export const COLOR_ACCENT = "#E0FF25";
export const COLOR_GREEN = "#23EC1E";

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

export const CabinetHeading = styled.h2`
  color: #fff;

  font-family: DM Sans;
  font-size: 80px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 72px */
`;

export const BLINK_ANIMATION = `
  animation: 0.5s ease-out blink;
`;

export function getClassName(comp: {
  class: (props: JSX.HTMLAttributes<HTMLHeadingElement> & AsProps) => string;
}): string {
  return comp.class({});
}
