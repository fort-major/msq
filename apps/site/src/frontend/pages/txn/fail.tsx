import { css, styled } from "solid-styled-components";
import { H3, Span600, SpanGray120, Text16, Text20 } from "../../ui-kit/typography";
import { TxnPage, TxnPageContent } from "./style";
import { Show, createSignal } from "solid-js";
import { COLOR_GRAY_115 } from "../../ui-kit";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { eventHandler, truncateStr } from "../../utils";
import { Button, EButtonKind } from "../../ui-kit/button";
import { DISCORD_LINK } from "@fort-major/masquerade-shared";

export interface ITxnFailPageProps {
  error: string;
  onBack(): void;
}

export function TxnFailPage(props: ITxnFailPageProps) {
  const handleReport = () => {
    window.open(DISCORD_LINK, "_blank");
  };

  return (
    <TxnPage>
      <TxnPageContent class={TxnFailContentMixin}>
        <TxnFailText>
          <TxnFailHeading>
            <H3>Transaction Failed</H3>
            <Text20>
              <Span600>No funds were deducted from your balance</Span600>
            </Text20>
          </TxnFailHeading>

          <TextSpoiler defaultText={props.error} />
        </TxnFailText>
        <TxnFailButtons>
          <Button
            kind={EButtonKind.Primary}
            text="Report the Error"
            onClick={handleReport}
            icon={EIconKind.ArrowRightUp}
            fullWidth
          />
          <Button kind={EButtonKind.Additional} text="Go Back" onClick={props.onBack} fullWidth />
        </TxnFailButtons>
      </TxnPageContent>
    </TxnPage>
  );
}

const Line150 = css`
  line-height: 150%;
`;

const TxnFailContentMixin = css`
  gap: 50px;
`;

const TxnFailText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 30px;
  align-self: stretch;
`;

const TxnFailHeading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;
`;

const TxnFailButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;

  & > button {
    flex: unset;
    align-self: stretch;
  }
`;

const SPOILER_MAX_TEXT = 300;

function TextSpoiler(props: { defaultText: string }) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [text, setText] = createSignal(truncateStr(props.defaultText, SPOILER_MAX_TEXT));

  const handleClick = eventHandler(() => {
    if (isOpen()) {
      setText(truncateStr(props.defaultText, SPOILER_MAX_TEXT));
      setIsOpen(false);
    } else {
      setText(props.defaultText);
      setIsOpen(true);
    }
  });

  return (
    <TextSpoilerWrapper>
      <TextSpoilerHeading>
        <TextSpoilerIconWrapper>
          <Icon kind={EIconKind.Close} size={13} color={COLOR_GRAY_115} />
        </TextSpoilerIconWrapper>
        <Text16>
          <Span600>The following error has occurred:</Span600>
        </Text16>
      </TextSpoilerHeading>
      <TextSpoilerContent>
        <Text16 class={Line150}>
          <SpanGray120>{text()}</SpanGray120>
        </Text16>
        <Show when={props.defaultText.length > SPOILER_MAX_TEXT}>
          <TextSpoilerShowMoreBtn onClick={handleClick}>
            <Text16>
              <Show when={!isOpen()} fallback="Hide">
                Show more
              </Show>
            </Text16>
            <Icon kind={EIconKind.ChevronUp} rotation={isOpen() ? 0 : 180} />
          </TextSpoilerShowMoreBtn>
        </Show>
      </TextSpoilerContent>
    </TextSpoilerWrapper>
  );
}

const TextSpoilerWrapper = styled.div`
  display: flex;
  padding: 25px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;

  border-radius: 25px;
  border: 1px solid ${COLOR_GRAY_115};
`;

const TextSpoilerHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  align-self: stretch;
`;

const TextSpoilerIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  border-radius: 100%;
  border: 1px solid ${COLOR_GRAY_115};
`;

const TextSpoilerContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

const TextSpoilerShowMoreBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
`;
