import { Match, Show, Switch, createSignal } from "solid-js";
import { Txn } from "../../backend";
import {
  CopyIcon,
  TxnContent,
  TxnContentRow,
  TxnContentRowValue,
  TxnHeader,
  TxnHeaderIdAmount,
  TxnHeaderInfo,
  TxnWrapper,
} from "./style";
import { Text, WeightRegular } from "../../ui-kit/typography";
import { timestampToStr, tokensToStr } from "../../utils";
import {
  COLOR_ACCENT,
  COLOR_GRAY_120,
  COLOR_GRAY_150,
  COLOR_GRAY_165,
  COLOR_WHITE,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMI_BOLD,
} from "../../ui-kit";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Elipsis } from "../../pages/integration/payment/checkout/style";
import { delay } from "@fort-major/msq-shared";

export interface ITxnHistoryEntryProps {
  txn: Txn;
  decimals: number;
  symbol: string;
  defaultCollapsed?: boolean;
}

export function TxnHistoryEntry(props: ITxnHistoryEntryProps) {
  const [collapsed, setCollapsed] = createSignal(props.defaultCollapsed ?? false);

  const handleOpen = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <TxnWrapper>
      <TxnHeader>
        <TxnHeaderInfo>
          <TxnHeaderIdAmount>
            <Text
              size={36}
              weight={FONT_WEIGHT_MEDIUM}
              lineHeight={100}
              color={props.txn.sign === "+" ? COLOR_ACCENT : COLOR_GRAY_165}
            >
              {props.txn.sign} {tokensToStr(props.txn.amount, props.decimals, true, true)}
              <Text
                size={12}
                weight={FONT_WEIGHT_SEMI_BOLD}
                color={COLOR_WHITE}
                style={{ "align-self": "flex-end", display: "inline", "margin-left": "7px" }}
              >
                {props.symbol}
              </Text>
            </Text>
            <Text size={16} weight={FONT_WEIGHT_SEMI_BOLD} color={COLOR_WHITE}>
              ID: <span class={WeightRegular}>{props.txn.id.toString()}</span>
            </Text>
          </TxnHeaderIdAmount>
          <Text size={16} weight={FONT_WEIGHT_REGULAR} lineHeight={120} color={COLOR_GRAY_150}>
            {timestampToStr(props.txn.timestampMs)}
          </Text>
        </TxnHeaderInfo>
        <Icon kind={EIconKind.ChevronUp} rotation={collapsed() ? 180 : 0} onClick={handleOpen} />
      </TxnHeader>
      <Show when={!collapsed()}>
        <TxnContent>
          <Switch>
            <Match when={typeof props.txn.account === "string"}>
              <Row name="Account ID" value={props.txn.account as string} showCopy />
            </Match>
            <Match when={typeof props.txn.account === "object"}>
              <Row name="Principal ID" value={(props.txn.account as { principalId: string }).principalId} showCopy />
              <Row
                name="Subaccount"
                value={(props.txn.account as { subaccount?: string }).subaccount ?? "Default Subaccount"}
                valueColor={(props.txn.account as { subaccount?: string }).subaccount ? COLOR_WHITE : COLOR_GRAY_120}
                showCopy={!!(props.txn.account as { subaccount?: string }).subaccount}
              />
            </Match>
          </Switch>
          <Show when={props.txn.memo}>
            <Row name="Memo" value={props.txn.memo!} showCopy />
          </Show>
        </TxnContent>
      </Show>
    </TxnWrapper>
  );
}

function Row(props: { name: string; value: string; valueColor?: string; showCopy?: boolean }) {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(props.value).then(async () => {
      setCopied(true);
      await delay(5000);
      setCopied(false);
    });
  };

  return (
    <TxnContentRow>
      <Text size={12} color={COLOR_GRAY_165} weight={FONT_WEIGHT_MEDIUM} letterSpacing={-1}>
        {props.name}
      </Text>
      <TxnContentRowValue>
        <Text
          size={16}
          color={props.valueColor ? props.valueColor : COLOR_WHITE}
          weight={FONT_WEIGHT_SEMI_BOLD}
          letterSpacing={-1}
          class={Elipsis}
          style={{ "flex-grow": 1 }}
        >
          {props.value}
        </Text>
        <Show when={props.showCopy}>
          <Icon
            kind={copied() ? EIconKind.Check : EIconKind.Copy}
            onClick={handleCopy}
            color={COLOR_GRAY_120}
            classList={{ [CopyIcon]: true }}
          />
        </Show>
      </TxnContentRowValue>
    </TxnContentRow>
  );
}
