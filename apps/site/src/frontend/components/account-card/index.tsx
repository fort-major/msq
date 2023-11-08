import { TAccountId } from "@fort-major/masquerade-shared";
import { DEFAULT_PRINCIPAL, eventHandler, tokensToStr } from "../../utils";
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
  AccountCardWrapper,
} from "./style";
import { Match, Show, Switch, createSignal } from "solid-js";
import { Input } from "../../ui-kit/input";
import { Button, EButtonKind } from "../../ui-kit/button";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { H5, Span600, SpanGray140, Text12, Text16, Text20 } from "../../ui-kit/typography";

export interface IAccountCardProps {
  accountId: TAccountId;
  assetId: string;
  name: string;
  principal: string | undefined;
  balance: bigint | undefined;
  decimals: number;
  symbol: string;
  fullWidth?: boolean | undefined;
  onSend?: (accountId: TAccountId, assetId: string) => void;
  onReceive?: (principal: string) => void;
  onEdit?: (newName: string) => void;
}

export function AccountCard(props: IAccountCardProps) {
  const [edited, setEdited] = createSignal(false);

  const handleEditStart = eventHandler((e: Event) => {
    if (props.onEdit === undefined) return;

    if (!edited()) {
      setEdited(true);
      return;
    }
  });

  const handleChange = (newName: string) => {
    console.log("change outside");
    setEdited(false);

    props.onEdit?.(newName);
  };

  const handleSend = () => {
    props.onSend!(props.accountId, props.assetId);
  };

  const handleReceive = () => {
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
              classList={{ [AccountCardInput]: true }}
              KindString={{
                defaultValue: props.name,
                onChange: handleChange,
                validate: (name) => (name.length === 0 ? "Please type something..." : null),
              }}
            />
          </Match>
          <Match when={!edited()}>
            <AccountCardHeaderNameWrapper onClick={handleEditStart}>
              <Text16>
                <Span600>{props.name}</Span600>
              </Text16>
              <Show when={props.onEdit}>
                <Icon kind={EIconKind.Edit} size={12} />
              </Show>
            </AccountCardHeaderNameWrapper>
          </Match>
        </Switch>
        <Show when={props.principal} fallback={<Text12 class={AccountCardHeaderPrincipal}>{DEFAULT_PRINCIPAL}</Text12>}>
          <Text12>
            <SpanGray140 class={AccountCardHeaderPrincipal}>{props.principal}</SpanGray140>
          </Text12>
        </Show>
      </AccountCardHeader>
      <AccountCardFooter>
        <AccountCardDivider />
        <AccountCardFooterContent>
          <AccountCardFooterBalance>
            <H5>{tokensToStr(props.balance || 0n, props.decimals)}</H5>
            <Text12>
              <Span600>{props.symbol}</Span600>
            </Text12>
          </AccountCardFooterBalance>
          <AccountCardFooterButtons>
            <Show when={props.onSend}>
              <Button
                kind={EButtonKind.Primary}
                icon={EIconKind.ArrowRightUp}
                iconOnlySize={40}
                disabled={props.balance === undefined}
                onClick={handleSend}
              />
            </Show>
            <Show when={props.onReceive}>
              <Button
                kind={EButtonKind.Secondary}
                icon={EIconKind.ArrowLeftDown}
                iconOnlySize={40}
                disabled={props.principal === undefined}
                onClick={handleReceive}
              />
            </Show>
          </AccountCardFooterButtons>
        </AccountCardFooterContent>
      </AccountCardFooter>
    </AccountCardWrapper>
  );
}
