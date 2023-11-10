import { For, Show, createEffect, createSignal } from "solid-js";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import {
  referrerOrigin,
  sendICRC1TransferResult,
  useIcrc1TransferRequestMsg,
  usePaymentCheckoutPageProps,
  useReferrerWindow,
} from "../../../store/integration";
import { useNavigate } from "@solidjs/router";
import { IAssetDataExt } from "../../../store/cabinet";
import { createStore, produce } from "solid-js/store";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import { DEFAULT_PRINCIPAL, getAssetMetadata, makeAnonymousAgent, makeIcrc1Salt, tokensToStr } from "../../../utils";
import { MasqueradeIdentity } from "@fort-major/masquerade-client";
import {
  AccountCardBase,
  AccountCardSelected,
  PaymentPageAccounts,
  PaymentPageAccountsWrapper,
  PaymentPageButtons,
  PaymentPageContainer,
  PaymentPageContent,
  PaymentPageHeading,
  PaymentPageWrapper,
} from "./style";
import { H3, Span600, SpanAccent, Text20 } from "../../../ui-kit/typography";
import { TAccountId, originToHostname } from "@fort-major/masquerade-shared";
import { AccountCard } from "../../../components/account-card";
import { AddAccountBtn } from "../../../components/add-account-btn";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { IReceivePopupProps, ReceivePopup } from "../../cabinet/my-assets/receive";
import { IPaymentCheckoutPageProps } from "./checkout";

export function PaymentPage() {
  const icrc1TransferRequest = useIcrc1TransferRequestMsg();
  const [assetData, setAssetData] = createStore<{ data?: IAssetDataExt }>({});
  const [selectedAccountId, setSelectedAccountId] = createSignal<TAccountId>(0);
  const [receivePopupProps, setReceivePopupProps] = createSignal<IReceivePopupProps | null>(null);
  const [checkoutPageProps, setCheckoutPageProps] = usePaymentCheckoutPageProps();
  const [_, showLoader] = useLoader();
  const [referrerWindow] = useReferrerWindow();
  const navigate = useNavigate();
  const msq = useMasqueradeClient();

  const [loading, setLoading] = createSignal(false);

  if (referrerOrigin === null || referrerOrigin === window.location.origin) navigate("/");

  createEffect(() => {
    if (!assetData.data) showLoader(true);
    else showLoader(false);
  });

  createEffect(async () => {
    if (!icrc1TransferRequest() || !msq()) return;

    const req = icrc1TransferRequest()!;
    const allAssetData = await msq()!.getAllAssetData();

    const fetchedAssetData = allAssetData[req.request.canisterId];

    if (!fetchedAssetData) {
      // TODO: handle missing asset
      return;
    }

    const assetData = fetchedAssetData as unknown as IAssetDataExt;

    assetData.accounts = fetchedAssetData.accounts.map((it) => ({
      name: it,
      balance: undefined,
    }));
    assetData.totalBalance = BigInt(0);
    setAssetData("data", assetData);

    const agent = await makeAnonymousAgent();
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(req.request.canisterId) });

    try {
      // first we query to be fast
      const metadata = await getAssetMetadata(ledger, false);
      setAssetData("data", "metadata", metadata);
    } catch (e) {
      console.error(e);
      setAssetData("data", undefined);
      return;
    }

    // then we update to be safe
    getAssetMetadata(ledger, true).then((metadata) => setAssetData("data", "metadata", metadata));

    let unresponsive = false;

    for (let idx = 0; idx < assetData.accounts.length; idx++) {
      MasqueradeIdentity.create(msq()!.getInner(), makeIcrc1Salt(req.request.canisterId, idx)).then((identity) => {
        const principal = identity.getPrincipal();

        setAssetData("data", "accounts", idx, "principal", principal.toText());

        // first we query to be fast
        ledger
          .balance({ certified: false, owner: principal })
          .then(async (balance) => {
            if (unresponsive) return;

            setAssetData(
              produce((state) => {
                state.data!.accounts[idx].balance = balance;
                state.data!.totalBalance = state.data!.totalBalance + balance;
              }),
            );

            // then we update to be safe
            balance = await ledger.balance({ certified: true, owner: principal });

            setAssetData(
              produce((state) => {
                state.data!.accounts[idx].balance = balance;
                const totalBalance = state.data!.accounts.reduce((prev, cur) => prev + (cur.balance || 0n), 0n);

                state.data!.totalBalance = totalBalance;
              }),
            );
          })
          .catch(() => {
            setAssetData("data", undefined);
            unresponsive = true;
          });
      });
    }
  });

  const handleAddAccount = async (assetId: string, assetName: string, symbol: string) => {
    setLoading(true);

    const name = await msq()!.addAssetAccount(assetId, assetName, symbol);

    if (name === null) {
      setLoading(false);

      return;
    }

    const accountId = assetData.data!.accounts.length;

    setAssetData("data", "accounts", accountId, { name, balance: BigInt(0), principal: DEFAULT_PRINCIPAL });

    const identity = await MasqueradeIdentity.create(msq()!.getInner(), makeIcrc1Salt(assetId, accountId));
    const principal = identity.getPrincipal();

    setAssetData("data", "accounts", accountId, "principal", principal.toText());

    const agent = await makeAnonymousAgent();
    const ledger = IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(assetId) });

    // first we query to be fast
    ledger
      .balance({
        certified: false,
        owner: Principal.fromText(assetData.data!.accounts[accountId].principal!),
      })
      .then(async (balance) => {
        setAssetData(
          produce((state) => {
            state.data!.accounts[accountId].balance = balance;
            const totalBalance = state.data!.accounts!.reduce((prev, cur) => prev + (cur.balance || 0n), 0n);

            state.data!.totalBalance = totalBalance;
          }),
        );

        // then we update to be sure
        balance = await ledger.balance({
          certified: true,
          owner: Principal.fromText(assetData.data!.accounts[accountId].principal!),
        });

        setAssetData(
          produce((state) => {
            state.data!.accounts[accountId].balance = balance;
            const totalBalance = state.data!.accounts!.reduce((prev, cur) => prev + (cur.balance || 0n), 0n);

            state.data!.totalBalance = totalBalance;
          }),
        );
      });

    setLoading(false);
  };

  const handleReceive = (accountId: TAccountId) => {
    setReceivePopupProps({
      principal: assetData.data!.accounts[accountId].principal!,
      symbol: assetData.data!.metadata!.symbol,
      onClose: handleReceiveClose,
    });
  };

  const handleReceiveClose = () => {
    setReceivePopupProps(null);
  };

  const handleCheckoutStart = (accountId: TAccountId) => {
    const p: IPaymentCheckoutPageProps = {
      accountId,
      accountName: assetData.data!.accounts[accountId].name,
      accountBalance: assetData.data!.accounts[accountId].balance!,
      accountPrincipal: assetData.data!.accounts[accountId].principal,

      assetId: icrc1TransferRequest()!.request.canisterId,
      symbol: assetData.data!.metadata!.symbol,
      decimals: assetData.data!.metadata!.decimals,
      fee: assetData.data!.metadata!.fee,

      amount: icrc1TransferRequest()!.request.amount,
      recepientPrincipal: icrc1TransferRequest()!.request.to.owner,
      recepientSubaccount: icrc1TransferRequest()!.request.to.subaccount,
      memo: icrc1TransferRequest()!.request.memo,
      createdAt: icrc1TransferRequest()!.request.createdAt,

      onSuccess: handleCheckoutSuccess,
      onFail: handleCheckoutFail,
      onCancel: handleCheckoutCancel,
    };

    setCheckoutPageProps(p);
    navigate("/integration/pay/checkout");
  };

  const handleCheckoutSuccess = (blockId: bigint) => {
    sendICRC1TransferResult(referrerWindow()!, blockId, null);
  };

  const handleCheckoutFail = () => {
    sendICRC1TransferResult(referrerWindow()!, undefined, null);
  };

  const handleCheckoutCancel = () => {
    setCheckoutPageProps(undefined);
    navigate("/integration/pay");
  };

  return (
    <PaymentPageContainer>
      <PaymentPageWrapper>
        <PaymentPageHeading>
          <Text20>
            <Span600>
              Pending payment on <SpanAccent>{originToHostname(referrerOrigin!)}</SpanAccent>
            </Span600>
          </Text20>
          <Show when={assetData.data?.metadata}>
            <H3>
              {tokensToStr(icrc1TransferRequest()!.request.amount, assetData.data!.metadata!.decimals)}{" "}
              {assetData.data!.metadata!.symbol}
            </H3>
          </Show>
        </PaymentPageHeading>
        <Show when={assetData.data?.accounts && assetData.data?.metadata}>
          <PaymentPageContent>
            <Text20>
              <Span600>Select an account to continue:</Span600>
            </Text20>
            <PaymentPageAccountsWrapper>
              <PaymentPageAccounts>
                <For each={assetData.data?.accounts}>
                  {(account, idx) => (
                    <AccountCard
                      classList={{ [AccountCardBase]: true, [AccountCardSelected]: idx() === selectedAccountId() }}
                      onClick={(accountId) => setSelectedAccountId(accountId)}
                      accountId={idx()}
                      assetId={icrc1TransferRequest()!.request.canisterId}
                      name={account.name}
                      balance={account.balance}
                      principal={account.principal}
                      decimals={assetData.data!.metadata!.decimals}
                      symbol={assetData.data!.metadata!.symbol}
                      targetBalance={icrc1TransferRequest()!.request.amount + assetData.data!.metadata!.fee}
                    />
                  )}
                </For>
              </PaymentPageAccounts>
              <AddAccountBtn
                disabled={loading()}
                loading={loading()}
                symbol={assetData.data!.metadata!.symbol}
                onClick={() =>
                  handleAddAccount(
                    icrc1TransferRequest()!.request.canisterId,
                    assetData.data!.metadata!.name,
                    assetData.data!.metadata!.symbol,
                  )
                }
              />
            </PaymentPageAccountsWrapper>
            <PaymentPageButtons>
              <Button kind={EButtonKind.Additional} onClick={() => window.close()} text="Dismiss" fullWidth />
              <Show
                when={
                  (assetData.data!.accounts[selectedAccountId()].balance || 0n) >=
                  icrc1TransferRequest()!.request.amount + assetData.data!.metadata!.fee
                }
                fallback={
                  <Button
                    kind={EButtonKind.Secondary}
                    text="Top up the Balance"
                    icon={EIconKind.ArrowLeftDown}
                    onClick={() => handleReceive(selectedAccountId())}
                    disabled={assetData.data!.accounts[selectedAccountId()].principal === undefined}
                    fullWidth
                  />
                }
              >
                <Button
                  kind={EButtonKind.Primary}
                  text="Go to Checkout"
                  icon={EIconKind.ArrowRightUp}
                  fullWidth
                  onClick={() => handleCheckoutStart(selectedAccountId())}
                />
              </Show>
            </PaymentPageButtons>
          </PaymentPageContent>
        </Show>
      </PaymentPageWrapper>
      <Show when={receivePopupProps()}>
        <ReceivePopup {...receivePopupProps()!} />
      </Show>
    </PaymentPageContainer>
  );
}
