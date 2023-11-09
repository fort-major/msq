import { css, styled } from "solid-styled-components";
import {
  ANIM_DURATION,
  BAR_HEIGHT,
  COLOR_BLACK,
  COLOR_GRAY_108,
  COLOR_GRAY_150,
  COLOR_WHITE,
  HEADER_HEIGHT,
} from "../../../../ui-kit";
import { Portal } from "solid-js/web";
import { EIconKind, Icon } from "../../../../ui-kit/icon";
import { H5, Span500, Span600, SpanGray140, Text12, Text16 } from "../../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../../ui-kit/button";
import { onCleanup, onMount } from "solid-js";

export interface IReceivePopupProps {
  principal: string;
  symbol: string;
  onClose(): void;
}

export function ReceivePopup(props: IReceivePopupProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(props.principal);
  };

  const handleRenderQR = (ref: HTMLDivElement) => {
    const qr = new QRCode(ref, { colorDark: COLOR_BLACK, width: 300, height: 300 });
    qr.makeCode(props.principal);
  };

  onMount(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
  });
  onCleanup(() => (document.body.style.overflow = "auto"));

  return (
    <Portal mount={document.getElementById("portal")!}>
      <ReceivePopupBg>
        <ReceivePopupContainer>
          <ReceivePopupWrapper>
            <Icon kind={EIconKind.Close} onClick={props.onClose} classList={{ [CloseIcon]: true }} />
            <H5>Receive {props.symbol}</H5>
            <QR ref={handleRenderQR} />
            <DataWrapper>
              <DataItem>
                <Text12>
                  <Span500>
                    <SpanGray140>Principal ID</SpanGray140>
                  </Span500>
                </Text12>
                <DataItemContent>
                  <Text16>
                    <Span600 class={DataItemContentText}>{props.principal}</Span600>
                  </Text16>
                  <Icon kind={EIconKind.Copy} size={14} onClick={handleCopy} classList={{ [CopyIcon]: true }} />
                </DataItemContent>
              </DataItem>
              <DataItem>
                <Text12>
                  <Span500>
                    <SpanGray140>Subaccount</SpanGray140>
                  </Span500>
                </Text12>
                <DataItemContent>
                  <Text16>
                    <Span600 class={DataItemContentText}>Default Subaccount</Span600>
                  </Text16>
                </DataItemContent>
              </DataItem>
            </DataWrapper>
            <Button kind={EButtonKind.Primary} text="Done" classList={{ [DoneBtn]: true }} onClick={props.onClose} />
          </ReceivePopupWrapper>
        </ReceivePopupContainer>
      </ReceivePopupBg>
    </Portal>
  );
}

const ReceivePopupBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9;

  overflow: auto;

  background-color: rgba(10, 10, 20, 0.8);
`;

const ReceivePopupContainer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  width: 430px;
  margin: ${(BAR_HEIGHT + HEADER_HEIGHT + 20).toString()}px auto;
`;

const ReceivePopupWrapper = styled.div`
  position: relative;

  display: flex;
  padding: 40px;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;

  border-radius: 25px;
  background: ${COLOR_GRAY_108};
`;

const CloseIcon = css`
  position: absolute;
  right: 25px;
  top: 25px;

  & > path {
    transition: stroke ${ANIM_DURATION} ease-out;

    stroke: ${COLOR_GRAY_150};
  }

  &:hover {
    & > path {
      stroke: ${COLOR_WHITE};
    }
  }
`;

const CopyIcon = css`
  flex-shrink: 0;
`;

const DoneBtn = css`
  width: 100%;
`;

const QR = styled.div`
  position: relative;
  width: 350px;
  height: 350px;

  border-radius: 10px;

  background-color: ${COLOR_WHITE};
  padding: 25px;

  display: flex;
  align-items: stretch;
  justify-content: stretch;
`;

const DataWrapper = styled.div`
  display: flex;
  width: 350px;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
`;

const DataItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;

const DataItemContent = styled.div`
  display: flex;
  padding: 15px 20px 15px 0px;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const DataItemContentText = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  flex: 1 0 0;

  overflow: hidden;
  text-overflow: ellipsis;
`;
