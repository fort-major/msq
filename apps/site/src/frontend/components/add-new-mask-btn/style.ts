import { css, styled } from "solid-styled-components";
import { ANIM_DURATION, COLOR_BLACK, COLOR_GRAY_105, COLOR_GRAY_115, COLOR_WHITE } from "../../ui-kit";

export const AddNewMaskBtnWrapper = styled.div`
  display: flex;
  padding: 15px 20px 15px 15px;
  align-items: center;
  gap: 15px;
  align-self: stretch;

  background-color: transparent;

  &:hover,
  &.loading {
    background-color: ${COLOR_GRAY_105};

    & > div {
      border: 1px solid transparent;
      background-color: ${COLOR_GRAY_115};
    }
  }

  &:not(.loading) {
    cursor: pointer;
  }
`;

export const AddNewMaskBtnIconWrapper = styled.div`
  display: flex;
  width: 60px;
  height: 60px;
  padding: 15px 0px;
  justify-content: center;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;

  border-radius: 100px;
  border: 1px dashed ${COLOR_WHITE};

  background-color: transparent;

  transition:
    border ${ANIM_DURATION} ease-out,
    background-color ${ANIM_DURATION} ease-out;
`;

export const AddNewMaskBtnText = css`
  flex: 1 0 0;
`;
