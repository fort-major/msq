import { styled } from "solid-styled-components";
import { ANIM_DURATION, COLOR_GRAY_130, COLOR_GRAY_140, COLOR_WHITE } from "../../../ui-kit";

export const LoginHeadingSection = styled.section`
  position: fixed;
  z-index: 9;
  bottom: 80px;
  left: 40px;

  max-width: 600px;
  width: 100%;
`;

export const LoginOptionsWrapper = styled.div`
  position: relative;

  padding-right: 40px;
  padding-bottom: 80px;

  box-sizing: border-box;

  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  margin-top: auto;
`;

export const LoginOptionsSection = styled.section`
  max-width: 600px;
  width: 100%;

  & > div:not(:nth-of-type(1)) {
    margin-top: 40px;
  }
`;

export const DismissBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;

  background-color: transparent;
  border: none;
  color: ${COLOR_GRAY_130};

  cursor: pointer;

  transition: color ${ANIM_DURATION} ease-out;

  & > svg {
    width: 12px;
    height: 12px;

    & > path {
      transition: stroke ${ANIM_DURATION} ease-out;
      stroke: ${COLOR_GRAY_130};
    }
  }

  &:hover {
    color: ${COLOR_WHITE};

    & > svg > path {
      stroke: ${COLOR_WHITE};
    }
  }
`;

export const LoginPageHeader = styled.h3`
  max-width: 600px;

  margin-top: 50px;
  margin-bottom: 30px;
`;
