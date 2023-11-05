import LogoSvg from "#assets/logo.svg";
import { styled } from "solid-styled-components";
import { BAR_HEIGHT, COLOR_BLACK, COLOR_GRAY_115, HEADER_HEIGHT } from "../../ui-kit";

const HeaderDiv = styled.header`
  position: fixed;
  z-index: 10;
  left: 0;
  right: 0;

  top: ${BAR_HEIGHT.toString()}px;

  width: 100%;
  height: ${HEADER_HEIGHT.toString()}px;
  padding: 0 40px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;

  background-color: ${COLOR_BLACK};
  box-sizing: border-box;
  border-bottom: 1px solid ${COLOR_GRAY_115};
`;

export function Header() {
  return (
    <HeaderDiv>
      <img src={LogoSvg} alt="Masquerade Logo" />
    </HeaderDiv>
  );
}
