import { css, styled } from "solid-styled-components";
import {
  ANIM_DURATION,
  BAR_HEIGHT,
  COLOR_ACCENT,
  COLOR_BLACK,
  COLOR_GRAY_108,
  COLOR_GRAY_140,
  COLOR_GRAY_150,
  COLOR_WHITE,
  HEADER_HEIGHT,
} from "../../../../ui-kit";
import { EIconKind, Icon } from "../../../../ui-kit/icon";
import { H5, Text } from "../../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../../ui-kit/button";
import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { createPaymentLink } from "../../../../utils";
import { Modal } from "../../../../components/modal";

export interface IReceivePopupProps {
  assetId: string;
  principal: string;
  symbol: string;
  onClose(): void;
}

export function ReceivePopup(props: IReceivePopupProps) {
  const [principalCopied, setPrincipalCopied] = createSignal(false);
  const [linkCopied, setLinkCopied] = createSignal(false);

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(props.principal);
    setPrincipalCopied(true);
  };

  const paymentLink = createMemo(() => createPaymentLink("t", props.assetId, props.principal));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink().toString());
    setLinkCopied(true);
  };

  const handleRenderQR = (ref: HTMLDivElement) => {
    const qr = new QRCode(ref, { colorDark: COLOR_BLACK, width: 300, height: 300 });

    qr.makeCode(paymentLink().toString());
  };

  onMount(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
  });
  onCleanup(() => (document.body.style.overflow = "auto"));

  return (
    <Modal>
      <ReceivePopupContainer>
        <ReceivePopupWrapper>
          <Icon kind={EIconKind.Close} onClick={props.onClose} classList={{ [CloseIcon]: true }} />
          <H5>Receive {props.symbol}</H5>
          <QR ref={handleRenderQR} />
          <DataWrapper>
            <DataItem>
              <Text size={12} weight={500} color={COLOR_GRAY_140}>
                MSQ payment link
              </Text>
              <DataItemContent>
                <Text size={12} weight={600} class={DataItemContentText}>
                  {paymentLink().toString()}
                </Text>
                <Show
                  when={linkCopied()}
                  fallback={
                    <Icon kind={EIconKind.Copy} size={14} onClick={handleCopyLink} classList={{ [CopyIcon]: true }} />
                  }
                >
                  <Icon
                    kind={EIconKind.Check}
                    size={14}
                    onClick={handleCopyLink}
                    classList={{ [CopyIcon]: true }}
                    color={COLOR_ACCENT}
                  />
                </Show>
              </DataItemContent>
            </DataItem>
            <DataItem>
              <Text size={12} weight={500} color={COLOR_GRAY_140}>
                Principal ID
              </Text>
              <DataItemContent>
                <Text size={12} weight={600} class={DataItemContentText}>
                  {props.principal}
                </Text>
                <Show
                  when={principalCopied()}
                  fallback={
                    <Icon
                      kind={EIconKind.Copy}
                      size={14}
                      onClick={handleCopyPrincipal}
                      classList={{ [CopyIcon]: true }}
                    />
                  }
                >
                  <Icon
                    kind={EIconKind.Check}
                    size={14}
                    onClick={handleCopyPrincipal}
                    classList={{ [CopyIcon]: true }}
                    color={COLOR_ACCENT}
                  />
                </Show>
              </DataItemContent>
            </DataItem>
            <DataItem>
              <Text size={12} weight={500} color={COLOR_GRAY_140}>
                Subaccount
              </Text>
              <DataItemContent>
                <Text size={16} weight={600} class={DataItemContentText}>
                  Default Subaccount
                </Text>
              </DataItemContent>
            </DataItem>
          </DataWrapper>
          <Button
            label="done"
            kind={EButtonKind.Primary}
            text="Done"
            classList={{ [DoneBtn]: true }}
            onClick={props.onClose}
          />
        </ReceivePopupWrapper>
      </ReceivePopupContainer>
    </Modal>
  );
}

const ReceivePopupContainer = styled.div`
  position: relative;
  align-self: center;
  margin: 0 auto;
  width: 430px;
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

  &:hover {
    & path {
      stroke: ${COLOR_ACCENT};
    }
  }
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
  align-items: center;
`;

const DataItemContentText = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  flex: 1 0 0;

  overflow: hidden;
  text-overflow: ellipsis;
`;
