import { css, styled } from "solid-styled-components";
import { H3, Text } from "../../ui-kit/typography";
import { AccountCard } from "../../components/account-card";
import { Button, EButtonKind } from "../../ui-kit/button";
import { onMount } from "solid-js";
import { useMsqClient } from "../../store/global";
import { tokensToStr } from "@fort-major/msq-shared";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { COLOR_CHARTREUSE } from "../../ui-kit";

export interface ITxnSuccessPageProps {
  assetId: string;
  accountId: number;
  accountName: string;
  accountBalance: bigint;
  accountPrincipal: string;

  symbol: string;
  decimals: number;

  amount: bigint;
  blockId: bigint;

  onBack(): void;
}

export function TxnSuccessPage(props: ITxnSuccessPageProps) {
  const msq = useMsqClient();

  onMount(() => {
    msq()?.incrementStats({ transfer: 1 });
  });

  return (
    <TxnSuccessPageContent>
      <TxnSuccessPageHeading>
        <H3 classList={{ [Header]: true }}>
          <span>
            -{tokensToStr(props.amount, props.decimals, undefined, true)} {props.symbol}
          </span>

          <SuccessSpoilerIconWrapper>
            <Icon kind={EIconKind.Check} color={COLOR_CHARTREUSE} />
          </SuccessSpoilerIconWrapper>
        </H3>
        <Text size={20} weight={600}>
          Transaction #{props.blockId.toString()} has been successfully executed
        </Text>
      </TxnSuccessPageHeading>
      <AccountCard
        fullWidth
        accountId={props.accountId}
        assetId={props.assetId}
        name={props.accountName}
        principal={props.accountPrincipal}
        symbol={props.symbol}
        decimals={props.decimals}
        balance={props.accountBalance}
        transferSuccess={props.amount}
      />
      <Button label="go back" kind={EButtonKind.Primary} text="Go Back" onClick={props.onBack} />
    </TxnSuccessPageContent>
  );
}

const TxnSuccessPageContent = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: 30px;

  & > button {
    flex: unset;
    align-self: stretch;
  }
`;

const TxnSuccessPageHeading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;
`;

const SuccessSpoilerIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  border-radius: 100%;
  border: 1px solid ${COLOR_CHARTREUSE};
`;

const Header = css`
  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;
