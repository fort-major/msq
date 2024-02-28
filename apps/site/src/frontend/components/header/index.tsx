import LogoSvg from "#assets/msq-logo.svg";
import { css, styled } from "solid-styled-components";
import { BAR_HEIGHT, COLOR_BLACK, COLOR_GRAY_115, HEADER_HEIGHT } from "../../ui-kit";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Show } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { eventHandler } from "../../utils";
import { Size18, Text, WeightSemiBold } from "../../ui-kit/typography";

const HeaderDiv = styled.header`
  position: fixed;
  z-index: 10;
  left: 0;
  right: 0;

  top: ${BAR_HEIGHT.toString()}px;

  width: 100%;
  height: ${HEADER_HEIGHT.toString()}px;

  padding: 25px 40px;
  align-items: center;
  flex-shrink: 0;

  background-color: ${COLOR_BLACK};
  box-sizing: border-box;
  border-bottom: 1px solid ${COLOR_GRAY_115};

  display: flex;
  flex-flow: row nowrap;

  & > img {
    width: 90px;
    height: 30px;
  }

  @media (max-width: 1024px) {
    top: ${(BAR_HEIGHT * 2).toString()}px;
    border-bottom: none;
    padding: 20px;

    & > img {
      width: 60px;
      height: 20px;
    }
  }
`;

const MyWalletLink = styled.p`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;

  cursor: pointer;
`;

const WithMyWalletBtn = css`
  justify-content: space-between;
`;

export function Header() {
  const location = useLocation();
  const showLink = () => location.pathname.startsWith("/integration");

  const navigate = useNavigate();
  const handleClick = eventHandler(() => {
    navigate("/cabinet/my-assets", { replace: true });
  });

  return (
    <HeaderDiv classList={{ [WithMyWalletBtn]: showLink() }}>
      <img src={LogoSvg} alt="MSQ Logo" />
      <Show when={showLink()}>
        <MyWalletLink onClick={handleClick}>
          <Text size={18} weight={600}>
            My Wallet
          </Text>
          <Icon kind={EIconKind.Login} />
        </MyWalletLink>
      </Show>
    </HeaderDiv>
  );
}
