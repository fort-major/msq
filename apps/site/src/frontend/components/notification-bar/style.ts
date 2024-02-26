import { styled } from "solid-styled-components";
import { BAR_HEIGHT, COLOR_DARK_BLUE, COLOR_WHITE } from "../../ui-kit";

export const NotificationBarWrapper = styled.noindex`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;

  display: flex;
  width: 100%;
  height: ${BAR_HEIGHT.toString()}px;
  padding: 10px 20px;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  background-color: ${COLOR_DARK_BLUE};

  @media (max-width: 1024px) {
    height: ${(BAR_HEIGHT * 2).toString()}px;
  }
`;
