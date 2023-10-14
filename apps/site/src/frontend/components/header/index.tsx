import LogoSvg from "#assets/logo.svg";
import { styled } from "solid-styled-components";
import { COLOR_BG, COLOR_GRAY } from "../../styles";

const HeaderDiv = styled.header`
  width: 100%;
  padding: 20px 40px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  background-color: ${COLOR_BG};
  box-sizing: border-box;
  border-bottom: 1px solid ${COLOR_GRAY};
`;

export function Header() {
  return (
    <HeaderDiv>
      <img src={LogoSvg} alt="Masquerade Logo" />
    </HeaderDiv>
  );
}
