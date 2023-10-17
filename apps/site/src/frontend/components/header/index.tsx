import LogoSvg from "#assets/logo.svg";
import { styled } from "solid-styled-components";
import { COLOR_BG, COLOR_GRAY, HEADER_HEIGHT } from "../../styles";
import { $initUserStores } from "../../store/user";

const HeaderDiv = styled.header`
  position: fixed;
  z-index: 10;
  left: 0;
  right: 0;

  width: 100%;
  height: ${HEADER_HEIGHT.toString()}px;
  padding: 0 40px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;

  background-color: ${COLOR_BG};
  box-sizing: border-box;
  border-bottom: 1px solid ${COLOR_GRAY};
`;

export function Header() {
  $initUserStores();

  return (
    <HeaderDiv>
      <img src={LogoSvg} alt="Masquerade Logo" />
    </HeaderDiv>
  );
}
