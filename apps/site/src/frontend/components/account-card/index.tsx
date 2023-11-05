import { TAccountId } from "@fort-major/masquerade-shared";
import { DEFAULT_PRINCIPAL, assertEventSafe, tokensToStr } from "../../utils";
import {
  AccountCardDivider,
  AccountCardFooter,
  AccountCardFooterBalance,
  AccountCardFooterBalanceQty,
  AccountCardFooterBalanceSymbol,
  AccountCardFooterButtons,
  AccountCardFooterContent,
  AccountCardHeader,
  AccountCardHeaderName,
  AccountCardHeaderNameWrapper,
  AccountCardHeaderPrincipal,
  AccountCardInput,
  AccountCardReceiveBtn,
  AccountCardSendBtn,
  AccountCardWrapper,
} from "./style";
import { Match, Show, Switch, createSignal } from "solid-js";
import { EditIcon, ReceiveIcon, SendIcon } from "../typography/icons";
import { Input } from "../../ui-kit/input";

export interface IAccountCardProps {
  accountId: TAccountId;
  assetId: string;
  name: string;
  principal: string | undefined;
  balance: bigint;
  decimals: number;
  symbol: string;
  fullWidth?: boolean | undefined;
  onSend?: (accountId: TAccountId, assetId: string) => void;
  onReceive?: (principal: string) => void;
  onEdit?: (newName: string) => void;
}

export function AccountCard(props: IAccountCardProps) {
  const [edited, setEdited] = createSignal(false);

  const handleEditStart = (e: Event) => {
    assertEventSafe(e);

    if (props.onEdit === undefined) return;

    if (!edited()) {
      setEdited(true);
      return;
    }
  };

  const handleChange = (newName: string) => {
    props.onEdit?.(newName);
    setEdited(false);
  };

  const handleBlur = (isErr: boolean) => {
    if (!isErr) setEdited(false);
  };

  const handleSend = (e: MouseEvent) => {
    assertEventSafe(e);
    props.onSend!(props.accountId, props.assetId);
  };

  const handleReceive = (e: MouseEvent) => {
    assertEventSafe(e);
    props.onReceive!(props.principal!);
  };

  return (
    <AccountCardWrapper fullWidth={props.fullWidth}>
      <AccountCardHeader>
        <Switch>
          <Match when={edited()}>
            <Input
              label="Account Name"
              required
              autofocus
              onBlur={handleBlur}
              classList={{ [AccountCardInput]: true }}
              kind={{
                String: {
                  defaultValue: props.name,
                  onChange: handleChange,
                  validate: (name) => (name.length === 0 ? "Please type something..." : null),
                },
              }}
            />
          </Match>
          <Match when={!edited()}>
            <AccountCardHeaderNameWrapper onClick={handleEditStart}>
              <AccountCardHeaderName>{props.name}</AccountCardHeaderName>
              <Show when={props.onEdit}>
                <EditIcon />
              </Show>
            </AccountCardHeaderNameWrapper>
          </Match>
        </Switch>

        <Show
          when={props.principal}
          fallback={<AccountCardHeaderPrincipal>{DEFAULT_PRINCIPAL}</AccountCardHeaderPrincipal>}
        >
          <AccountCardHeaderPrincipal>{props.principal}</AccountCardHeaderPrincipal>
        </Show>
      </AccountCardHeader>
      <AccountCardFooter>
        <AccountCardDivider />
        <AccountCardFooterContent>
          <AccountCardFooterBalance>
            <AccountCardFooterBalanceQty>{tokensToStr(props.balance, props.decimals)}</AccountCardFooterBalanceQty>
            <AccountCardFooterBalanceSymbol>{props.symbol}</AccountCardFooterBalanceSymbol>
          </AccountCardFooterBalance>
          <AccountCardFooterButtons>
            <Show when={props.onSend}>
              <AccountCardSendBtn disabled={props.principal === undefined} onClick={handleSend}>
                <SendIcon />
              </AccountCardSendBtn>
            </Show>
            <Show when={props.onReceive}>
              <AccountCardReceiveBtn disabled={props.principal === undefined} onClick={handleReceive}>
                <ReceiveIcon />
              </AccountCardReceiveBtn>
            </Show>
          </AccountCardFooterButtons>
        </AccountCardFooterContent>
      </AccountCardFooter>
    </AccountCardWrapper>
  );
}
