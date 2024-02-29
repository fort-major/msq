import { css, styled } from "solid-styled-components";
import { H3, Text } from "../../ui-kit/typography";
import { TxnPage, TxnPageContent } from "./style";
import { EIconKind } from "../../ui-kit/icon";
import { Button, EButtonKind } from "../../ui-kit/button";
import { ErrorSpoiler } from "../../components/error-spoiler";
import { DISCORD_LINK } from "@fort-major/msq-shared";

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
            <Text size={20} weight={600}>
              No funds were deducted from your balance
            </Text>
          </TxnFailHeading>

          <ErrorSpoiler defaultText={props.error} />
        </TxnFailText>
        <TxnFailButtons>
          <Button
            label="report the error"
            kind={EButtonKind.Primary}
            text="Report the Error"
            onClick={handleReport}
            icon={EIconKind.ArrowRightUp}
            fullWidth
          />
          <Button label="go back" kind={EButtonKind.Additional} text="Go Back" onClick={props.onBack} fullWidth />
        </TxnFailButtons>
      </TxnPageContent>
    </TxnPage>
  );
}

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
