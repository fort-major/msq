import { css, styled } from "solid-styled-components";
import { ANIM_DURATION, COLOR_BLACK, COLOR_GRAY_105, COLOR_GRAY_115, COLOR_GRAY_140, COLOR_WHITE } from "../../ui-kit";

export const LoginOptionWrapper = styled.div<{ editable?: boolean | undefined }>`
  display: flex;
  padding: 15px 20px 15px 15px;
  align-items: center;
  gap: 15px;
  align-self: stretch;

  background-color: ${COLOR_BLACK};

  transition: background-color ${ANIM_DURATION} ease-out;

  ${(props) =>
    !props.editable
      ? `  
      cursor: pointer;
      &:hover {
        background-color: ${COLOR_GRAY_105};
      }`
      : ""}

  & > svg {
    & > path {
      stroke: ${COLOR_GRAY_140};
      transition: stroke ${ANIM_DURATION} ease-out;
    }

    &:hover {
      & > path {
        stroke: ${COLOR_WHITE};
      }
    }
  }
`;

export const LoginOptionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  flex: 1 0 0;
`;

export const LoginOptionPrincipal = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;

  overflow: hidden;
  text-overflow: ellipsis;
`;
