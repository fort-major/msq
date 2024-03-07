import {
  Balance,
  Divider,
  TxnHistoryEmpty,
  TxnHistoryLoader,
  TxnHistoryPageBody,
  TxnHistoryPageContent,
  TxnHistoryPageHeader,
  TxnHistoryPageHeaderBack,
  TxnHistoryPageHeaderInfo,
  TxnHistoryWallet,
  TxnHistoryWalletBalance,
  TxnHistoryWalletNameId,
} from "./style";
import {
  COLOR_GRAY_115,
  COLOR_GRAY_140,
  COLOR_WHITE,
  CabinetContent,
  CabinetPage,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMI_BOLD,
} from "../../../../ui-kit";
import { CabinetNav } from "../../../../components/cabinet-nav";
import { EIconKind, Icon } from "../../../../ui-kit/icon";
import { Text } from "../../../../ui-kit/typography";
import { For, Match, Show, Switch, createSignal, onMount } from "solid-js";
import { Txn, getTransactionHistory } from "../../../../backend";
import { useNavigate } from "@solidjs/router";
import { TxnHistoryEntry } from "../../../../components/txn-history-entry";
import { Button, EButtonKind } from "../../../../ui-kit/button";
import { tokensToStr } from "../../../../utils";
import { useTxnHistoryPageProps } from "../../../../store/assets";

export interface ITxnHistoryPageProps {
  tokenId: string;
  accountName: string;
  accountPrincipalId: string;
  accountBalance: bigint;
  decimals: number;
  symbol: string;
  onClose: () => void;
}

const PAGE_SIZE = 20;

export function TxnHistoryPage() {
  const [props, _] = useTxnHistoryPageProps();
  const [history, setHistory] = createSignal<Txn[] | undefined>(undefined);
  const [showMoreBtn, setShowMoreBtn] = createSignal(true);
  const [loading, setLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/cabinet/my-assets");
  };

  const handleShowMoreClick = () => {
    setLoading(true);

    getTransactionHistory({
      tokenId: props()!.tokenId,
      accountPrincipalId: props()!.accountPrincipalId,
      skip: BigInt(history()?.length ?? 0),
      take: PAGE_SIZE,
    }).then((txns) => {
      if (txns.length < PAGE_SIZE) {
        setShowMoreBtn(false);
      } else {
        setShowMoreBtn(true);
      }

      setHistory((prev) => (prev ? prev.concat(txns) : txns));
      setLoading(false);
    });
  };

  onMount(() => {
    if (!props()) {
      navigate("/cabinet/my-assets");
      return;
    }

    handleShowMoreClick();
  });

  return (
    <CabinetPage>
      <CabinetNav activeUrl="/cabinet/my-assets" />
      <CabinetContent>
        <Show when={props()}>
          <TxnHistoryPageContent>
            <TxnHistoryPageHeader>
              <TxnHistoryPageHeaderBack onClick={handleBackClick}>
                <Icon kind={EIconKind.ArrowLeftLong} />
                <Text size={16} weight={FONT_WEIGHT_REGULAR} letterSpacing={-1} color={COLOR_WHITE}>
                  Back to My Assets
                </Text>
              </TxnHistoryPageHeaderBack>
              <TxnHistoryPageHeaderInfo>
                <Text size={60} lineHeight={90} weight={FONT_WEIGHT_SEMI_BOLD} letterSpacing={-2}>
                  Transaction History
                </Text>
                <TxnHistoryWallet>
                  <TxnHistoryWalletNameId>
                    <Text size={16} weight={FONT_WEIGHT_SEMI_BOLD} letterSpacing={-1} color={COLOR_WHITE}>
                      {props()!.accountName}
                    </Text>
                    <Text size={12} weight={FONT_WEIGHT_REGULAR} color={COLOR_GRAY_140}>
                      {props()!.accountPrincipalId}
                    </Text>
                  </TxnHistoryWalletNameId>
                  <TxnHistoryWalletBalance>
                    <Divider />
                    <Balance>
                      <Text size={36} weight={FONT_WEIGHT_MEDIUM} letterSpacing={-1} color={COLOR_WHITE}>
                        {tokensToStr(props()!.accountBalance, props()!.decimals, true, true)}
                      </Text>
                      <Text size={12} weight={FONT_WEIGHT_SEMI_BOLD} letterSpacing={-1} color={COLOR_WHITE}>
                        {props()!.symbol}
                      </Text>
                    </Balance>
                  </TxnHistoryWalletBalance>
                </TxnHistoryWallet>
              </TxnHistoryPageHeaderInfo>
            </TxnHistoryPageHeader>
            <TxnHistoryPageBody>
              <Switch>
                <Match when={!history()}>
                  <TxnHistoryLoader>
                    <Icon kind={EIconKind.Loader} size={30} />
                  </TxnHistoryLoader>
                </Match>
                <Match when={history() && history()!.length === 0}>
                  <TxnHistoryEmpty>
                    <Text size={36} weight={FONT_WEIGHT_MEDIUM} letterSpacing={-1} color={COLOR_GRAY_115}>
                      No Transactions yet
                    </Text>
                  </TxnHistoryEmpty>
                </Match>
                <Match when={history() && history()!.length > 0}>
                  <For each={history()}>{(txn) => <TxnHistoryEntry txn={txn} symbol="TOK" decimals={8} />}</For>
                  <Show when={showMoreBtn()}>
                    <Button
                      kind={EButtonKind.Additional}
                      text="Show More"
                      label="Show More"
                      onClick={handleShowMoreClick}
                      disabled={loading()}
                      icon={loading() ? EIconKind.Loader : undefined}
                    />
                  </Show>
                </Match>
              </Switch>
            </TxnHistoryPageBody>
          </TxnHistoryPageContent>
        </Show>
      </CabinetContent>
    </CabinetPage>
  );
}
