import { css, styled } from "solid-styled-components";
import { H3, Span600, Text20 } from "../../ui-kit/typography";
import { tokensToStr } from "../../utils";
import { AccountCard } from "../../components/account-card";
import { Button, EButtonKind } from "../../ui-kit/button";

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
  return (
    <TxnSuccessPageContent>
      <TxnSuccessPageHeading>
        <H3>
          -{tokensToStr(props.amount, props.decimals, undefined, true)} {props.symbol}
        </H3>
        <Text20>
          <Span600>Transaction #{props.blockId.toString()} has been successfully executed</Span600>
        </Text20>
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
      <Button kind={EButtonKind.Additional} text="Go Back" onClick={props.onBack} />
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
