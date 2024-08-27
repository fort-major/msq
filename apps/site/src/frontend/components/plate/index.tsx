import { styled } from "solid-styled-components";
import { COLOR_GRAY_105, COLOR_GRAY_115 } from "../../ui-kit";

export const Plate = styled.div<{ row?: boolean; gap?: string; pointer?: boolean; bgHover?: boolean }>`
  display: flex;
  flex-flow: ${(props) => (props.row ? "row" : "column")};
  padding: 15px;
  gap: ${(props) => (props.gap ? props.gap : "15px")};

  border: 1px solid ${COLOR_GRAY_115};
  border-radius: 25px;

  ${(props) => (props.pointer ? "cursor: pointer;" : "")}
  transition: background-color 0.3s;
  background-color: transparent;

  &:hover {
    ${(props) => (props.bgHover ? `background-color: ${COLOR_GRAY_105};` : "")}
  }
`;
