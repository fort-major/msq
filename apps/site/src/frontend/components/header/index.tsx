import LogoSvg from "#assets/msq-logo.svg";
import { css, styled } from "solid-styled-components";
import { BAR_HEIGHT, COLOR_BLACK, COLOR_GRAY_115, HEADER_HEIGHT } from "../../ui-kit";
import { Span600, Text18 } from "../../ui-kit/typography";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Show } from "solid-js";

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

  & > img {
    width: 90px;
    height: 30px;
  }
`;

const MyWalletLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

const WithMyWalletBtn = css`
  justify-content: space-between;
`;

export function Header(props: { withLink?: boolean | undefined }) {
  return (
    <HeaderDiv classList={{ [WithMyWalletBtn]: props.withLink }}>
      <img src={LogoSvg} alt="Masquerade Logo" />
      <Show when={props.withLink}>
        <MyWalletLink>
          <Text18>
            <Span600>My Wallet</Span600>
          </Text18>
          <Icon kind={EIconKind.Login} />
        </MyWalletLink>
      </Show>
    </HeaderDiv>
  );
}
