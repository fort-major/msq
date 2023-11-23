import { TAccountId } from "@fort-major/masquerade-shared";
import { DEFAULT_PRINCIPAL, eventHandler, tokensToStr } from "../../utils";
import {
  AccountCardCheckIconWrapper,
  AccountCardDivider,
  AccountCardFooter,
  AccountCardFooterBalance,
  AccountCardFooterBalanceWrapper,
  AccountCardFooterButtons,
  AccountCardFooterContent,
  AccountCardFooterInsufficientBalance,
  AccountCardHeader,
  AccountCardHeaderNameWrapper,
  AccountCardHeaderPrincipal,
  AccountCardInput,
  AccountCardWrapper,
} from "./style";
import { Match, Show, Switch, createSignal } from "solid-js";
import { Input } from "../../ui-kit/input";
import { Button, EButtonKind } from "../../ui-kit/button";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { ColorGray150, H5, StrikedText, Text } from "../../ui-kit/typography";
import { COLOR_ACCENT, COLOR_GRAY_140 } from "../../ui-kit";

export interface IAccountCardProps {
  accountId: TAccountId;
  assetId: string;
  name: string;
  principal: string | undefined;
  balance: bigint | undefined;
  decimals: number;
  symbol: string;
  fullWidth?: boolean | undefined;
  targetBalance?: bigint | undefined;
  classList?: { [k: string]: boolean | undefined };

  transferSuccess?: bigint | undefined;

  onClick?: (accountId: TAccountId, assetId: string) => void;

  onSend?: (accountId: TAccountId, assetId: string) => void;
  onReceive?: (assetId: string, symbol: string, principal: string) => void;
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

  const handleClick = eventHandler(() => {
    props.onClick?.(props.accountId, props.assetId);
  });

  const handleChange = (newName: string) => {
    setEdited(false);

    props.onEdit?.(newName);
  };

  const handleSend = () => {
    props.onSend!(props.accountId, props.assetId);
  };

  const handleReceive = () => {
    props.onReceive!(props.assetId, props.symbol, props.principal!);
  };

  return (
    <AccountCardWrapper classList={props.classList} onClick={handleClick} fullWidth={props.fullWidth}>
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
            <AccountCardHeaderNameWrapper classList={{ editable: !!props.onEdit }} onClick={handleEditStart}>
              <Text size={16} weight={600}>
                {props.name}
              </Text>
              <Show when={props.onEdit}>
                <Icon kind={EIconKind.Edit} size={12} />
              </Show>
            </AccountCardHeaderNameWrapper>
          </Match>
        </Switch>
        <Show
          when={props.principal}
          fallback={
            <Text size={12} class={AccountCardHeaderPrincipal}>
              {DEFAULT_PRINCIPAL}
            </Text>
          }
        >
          <Text size={12} color={COLOR_GRAY_140} class={AccountCardHeaderPrincipal}>
            {props.principal}
          </Text>
        </Show>
      </AccountCardHeader>
      <AccountCardFooter>
        <AccountCardDivider />
        <AccountCardFooterContent>
          <AccountCardFooterBalanceWrapper>
            <AccountCardFooterBalance>
              <Show
                when={props.transferSuccess}
                fallback={<H5>{tokensToStr(props.balance || 0n, props.decimals, undefined, true)}</H5>}
              >
                <H5>
                  <span style={{ display: "flex", gap: "15px", "align-items": "center" }}>
                    <span classList={{ [StrikedText]: true, [ColorGray150]: true }}>
                      {tokensToStr(props.balance || 0n, props.decimals, undefined, true)}
                    </span>

                    <Icon kind={EIconKind.ArrowRight} color={COLOR_ACCENT} />

                    <span>{tokensToStr(props.balance! - props.transferSuccess!, props.decimals, undefined, true)}</span>
                  </span>
                </H5>
              </Show>
              <Text size={12} weight={600}>
                {props.symbol}
              </Text>
            </AccountCardFooterBalance>
            <Show when={props.targetBalance && (props.balance || 0n) < props.targetBalance}>
              <AccountCardFooterInsufficientBalance>
                <Icon kind={EIconKind.Warning} />
                <Text size={14} weight={600}>
                  Insufficient Funds
                </Text>
              </AccountCardFooterInsufficientBalance>
            </Show>
            <Show when={props.transferSuccess}>
              <AccountCardCheckIconWrapper>
                <Icon kind={EIconKind.Check} color={COLOR_ACCENT} />
              </AccountCardCheckIconWrapper>
            </Show>
          </AccountCardFooterBalanceWrapper>
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
