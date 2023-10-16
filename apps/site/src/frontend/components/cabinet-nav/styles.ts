import { styled } from "solid-styled-components";
import { COLOR_ACCENT, HEADER_HEIGHT } from "../../styles";

export const CabinetNavWrapper = styled.nav`
  position: fixed;
  left: 0;
  top: ${HEADER_HEIGHT.toString()}px;

  display: flex;
  width: 290px;
  flex-direction: column;
  align-items: flex-start;

  & > div:not(:nth-of-type(1)) {
    border-top: 1px solid #2f2f38;
  }
`;

export const CabinetNavItem = styled.div`
  display: flex;
  height: 60px;
  padding: 20px 40px;
  align-items: center;
  gap: 10px;
  align-self: stretch;

  box-sizing: border-box;

  cursor: pointer;
`;

export const CabinetNavItemDot = styled.span`
  width: 6px;
  height: 6px;
  background-color: ${COLOR_ACCENT};
  border-radius: 3px;
`;

export const CabinetNavItemText = styled.p`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;
