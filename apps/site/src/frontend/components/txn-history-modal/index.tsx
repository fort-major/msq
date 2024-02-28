import { Principal } from "@dfinity/principal";
import { Txn, getTransactionHistory } from "../../backend";
import {
  CloseIcon,
  TxnHistoryEmpty,
  TxnHistoryModalContent,
  TxnHistoryModalHeader,
  TxnHistoryModalWrapper,
} from "./style";
import { Text } from "../../ui-kit/typography";
import { COLOR_GRAY_140, COLOR_GRAY_190, COLOR_WHITE, FONT_WEIGHT_MEDIUM, FONT_WEIGHT_REGULAR } from "../../ui-kit";
import { For, Match, Show, Switch, createSignal, onMount } from "solid-js";
import { TxnHistoryEntry } from "../txn-history-entry";
import { Button, EButtonKind } from "../../ui-kit/button";
import { eventHandler } from "../../utils";
import { Modal } from "../modal";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { useNavigate } from "@solidjs/router";

export interface ITxnHistoryModalProps {
  tokenId: string;
  accountPrincipalId: string | Principal;
  decimals: number;
  symbol: string;
  onShowMore: () => void;
  onClose: () => void;
}

export function TxnHistoryModal(props: ITxnHistoryModalProps) {
  const [history, setHistory] = createSignal<Txn[] | undefined>(undefined);

  onMount(() => {
    getTransactionHistory({ tokenId: props.tokenId, accountPrincipalId: props.accountPrincipalId, take: 2 }).then(
      setHistory,
    );
  });

  return (
    <Modal>
      <TxnHistoryModalWrapper onClick={eventHandler((e) => e.stopPropagation())}>
        <Icon kind={EIconKind.Close} onClick={props.onClose} classList={{ [CloseIcon]: true }} />
        <TxnHistoryModalHeader>
          <Text size={36} weight={FONT_WEIGHT_MEDIUM} color={COLOR_WHITE} letterSpacing={-1}>
            Transaction History
          </Text>
          <Text size={16} weight={FONT_WEIGHT_REGULAR} color={COLOR_GRAY_140}>
            {typeof props.accountPrincipalId === "string"
              ? props.accountPrincipalId
              : props.accountPrincipalId.toText()}
          </Text>
        </TxnHistoryModalHeader>

        <Switch>
          <Match when={!history()}>
            <TxnHistoryEmpty>
              <Icon kind={EIconKind.Loader} />
            </TxnHistoryEmpty>
          </Match>
          <Match when={history()!.length === 0}>
            <TxnHistoryEmpty>
              <Text size={16} color={COLOR_GRAY_190}>
                Empty
              </Text>
            </TxnHistoryEmpty>
          </Match>
          <Match when={history()!.length > 0}>
            <TxnHistoryModalContent>
              <For each={history()}>
                {(txn) => (
                  <TxnHistoryEntry txn={txn} decimals={props.decimals} symbol={props.symbol} defaultCollapsed />
                )}
              </For>
            </TxnHistoryModalContent>
            <Button kind={EButtonKind.Primary} label="Show All" text="Show All" onClick={props.onShowMore} />
          </Match>
        </Switch>
      </TxnHistoryModalWrapper>
    </Modal>
  );
}
