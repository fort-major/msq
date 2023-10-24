import { TAccountId } from "@fort-major/masquerade-shared";
import { assertEventSafe, tokensToStr } from "../../utils";
import {
  AccountCardDivider,
  AccountCardFooter,
  AccountCardFooterBalance,
  AccountCardFooterBalanceQty,
  AccountCardFooterBalanceSymbol,
  AccountCardFooterButtons,
  AccountCardFooterContent,
  AccountCardHeader,
  AccountCardHeaderEditIcon,
  AccountCardHeaderName,
  AccountCardHeaderNameInput,
  AccountCardHeaderNameWrapper,
  AccountCardHeaderPrincipal,
  AccountCardReceiveBtn,
  AccountCardSendBtn,
  AccountCardWrapper,
} from "./style";
import EditSvg from "#assets/edit.svg";
import SendBlackSvg from "#assets/send-black.svg";
import ReceiveSvg from "#assets/receive.svg";
import { Match, Switch, createSignal } from "solid-js";

export interface IAccountCardProps {
  accountId: TAccountId;
  name: string;
  principal: string;
  balance: bigint;
  decimals: number;
  symbol: string;
  onSend: (accountId: TAccountId) => void;
  onReceive: (principal: string) => void;
  onEdit: (newName: string) => void;
}

export function AccountCard(props: IAccountCardProps) {
  const [edited, setEdited] = createSignal(false);
  const initialName = () => props.name;
  const [name, setName] = createSignal(initialName());

  const handleEditStart = (e: Event) => {
    assertEventSafe(e);

    if (!edited()) {
      setEdited(true);
      return;
    }
  };

  const handleEditFinishByEnter = (e: KeyboardEvent) => {
    assertEventSafe(e);

    if (e.key === "Enter") {
      setEdited(false);
      props.onEdit(name());
    }
  };

  const handleEditFinishByUnfocus = (e: Event) => {
    assertEventSafe(e);

    setEdited(false);
    props.onEdit(name());
  };

  return (
    <AccountCardWrapper>
      <AccountCardHeader>
        <Switch>
          <Match when={edited()}>
            <AccountCardHeaderNameInput
              ref={(it) => setTimeout(() => it.focus(), 1)}
              type="text"
              value={name()}
              onKeyDown={handleEditFinishByEnter}
              onChange={handleEditFinishByUnfocus}
              onInput={(e) => setName(e.target.value)}
            />
          </Match>
          <Match when={!edited()}>
            <AccountCardHeaderNameWrapper onClick={handleEditStart}>
              <AccountCardHeaderName>{props.name}</AccountCardHeaderName>
              <AccountCardHeaderEditIcon src={EditSvg} alt="edit" />
            </AccountCardHeaderNameWrapper>
          </Match>
        </Switch>
        <AccountCardHeaderPrincipal>{props.principal}</AccountCardHeaderPrincipal>
      </AccountCardHeader>
      <AccountCardFooter>
        <AccountCardDivider />
        <AccountCardFooterContent>
          <AccountCardFooterBalance>
            <AccountCardFooterBalanceQty>{tokensToStr(props.balance, props.decimals)}</AccountCardFooterBalanceQty>
            <AccountCardFooterBalanceSymbol>{props.symbol}</AccountCardFooterBalanceSymbol>
          </AccountCardFooterBalance>
          <AccountCardFooterButtons>
            <AccountCardSendBtn onClick={() => props.onSend(props.accountId)}>
              <img src={SendBlackSvg} alt="send" />
            </AccountCardSendBtn>
            <AccountCardReceiveBtn onClick={() => props.onReceive(props.principal)}>
              <img src={ReceiveSvg} alt="receive" />
            </AccountCardReceiveBtn>
          </AccountCardFooterButtons>
        </AccountCardFooterContent>
      </AccountCardFooter>
    </AccountCardWrapper>
  );
}
