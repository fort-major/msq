import { HttpAgent, Identity } from "@dfinity/agent";
import { MsqClient, TMsqCreateOk } from "@fort-major/msq-client";
import { Match, Switch, createEffect, createResource, createSignal } from "solid-js";
import { Body, BodyHeading, Header, LoginButton, Logo, ProfileWrapper } from "./style";
import MetaMaskLogoSvg from "#assets/metamask.svg";
import { PlushieCard } from "../../components/plushie-card";
import { createBackendActor } from "../../backend";
import { Order } from "../../../declarations/demo_backend/demo_backend.did";
import { OrderComp } from "../../components/order";
import { Principal } from "@dfinity/principal";

interface IProfile {
  pseudonym: string;
  avatarSrc: string;
}

const ICP_TOKEN_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const RECIPIENT_PRINCIPAL = "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe";

export const IndexPage = () => {
  const [qty, setQty] = createSignal(0);
  const [defaultInStock] = createSignal(1000);
  const [inStock, setInStock] = createSignal(1000);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [profile, setProfile] = createSignal<IProfile | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [order, setOrder] = createSignal<Order | null>(null);

  const [msq] = createResource(async () => {
    const result = await MsqClient.create({
      debug: import.meta.env.VITE_MSQ_MODE === "DEV",
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });

    if (!("Ok" in result)) throw new Error("Install MetaMask, Unblock or Enable MSQ Snap");

    return (result as TMsqCreateOk).Ok;
  });

  const [backend] = createResource(identity, async (identity) => {
    const agent = new HttpAgent({
      identity,
      verifyQuerySignatures: false,
      host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST,
    });

    if (import.meta.env.VITE_MSQ_MODE === "DEV") {
      await agent.fetchRootKey();
    }

    return createBackendActor(agent);
  });

  const [orders] = createResource(backend, async (backend) => {
    const ids = await backend.get_my_order_ids();

    return Promise.all(ids.map(backend.get_order));
  });

  createEffect(async () => {
    if (!msq()) return;

    if (await msq()!.isAuthorized()) {
      await handleLogin();
    }
  });

  const handleLogin = async () => {
    const identity = await msq()!.requestLogin();

    if (identity === null) return;

    const profile: IProfile = {
      pseudonym: await identity.getPseudonym(),
      avatarSrc: await identity.getAvatarSrc(),
    };

    setProfile(profile);
    setIdentity(identity);
  };

  const handleAdd = () => {
    setQty((qty) => (qty < inStock() ? qty + 1 : qty));
    setInStock((inStock) => (inStock > 0 ? inStock - 1 : inStock));
  };

  const handleRemove = () => {
    setQty((qty) => (qty > 0 ? qty - 1 : qty));
    setInStock((inStock) => (inStock < defaultInStock() ? inStock + 1 : inStock));
  };

  const handleContinue = async () => {
    setLoading(true);

    const orderId = await backend()!.create_order(qty());
    const order = await backend()!.get_order(orderId);

    console.log(order);

    setOrder(order);

    setLoading(false);
  };

  const handlePay = async () => {
    setLoading(true);

    try {
      const blockIndex = await msq()!.requestICRC1Transfer(
        Principal.fromText(ICP_TOKEN_ID),
        { owner: Principal.fromText(RECIPIENT_PRINCIPAL) },
        order()!.total,
        new Uint8Array(order()!.memo),
      );

      if (blockIndex === null) {
        setTimeout(() => {
          alert("The payment was rejected!");

          setLoading(false);
        }, 500);
        return;
      }

      await backend()!.complete_order(order()!.id, blockIndex);
      setOrder({ ...order()!, status: { Paid: null } });

      setLoading(false);
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const handleLink = async () => {
    const links = await msq()!.getLinks();

    if (links.includes("https://3rhoj-baaaa-aaaak-afdua-cai.icp0.io")) return;

    await msq()!.requestLink("https://3rhoj-baaaa-aaaak-afdua-cai.icp0.io");
  };

  return (
    <>
      <Header>
        <Logo onClick={handleLink}>
          {location.host === "3rhoj-baaaa-aaaak-afdua-cai.icp0.io" ? "Improved " : ""} Plushie World
        </Logo>
        <Switch>
          <Match when={identity() === null}>
            <LoginButton onClick={handleLogin}>
              <span>Login with MetaMask</span>
              <img src={MetaMaskLogoSvg} />
            </LoginButton>
          </Match>
          <Match when={identity() !== null}>
            <ProfileWrapper>
              <img src={profile()!.avatarSrc} />
              <p>{profile()!.pseudonym}</p>
            </ProfileWrapper>
          </Match>
        </Switch>
      </Header>
      <Body>
        <Switch>
          <Match when={order() === null}>
            <BodyHeading>Support us by purchasing our Plushies!</BodyHeading>
            <PlushieCard
              loggedIn={identity() !== null}
              loading={backend() === undefined || loading()}
              inStock={inStock()}
              qty={qty()}
              price={0.1}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onContinue={handleContinue}
            />
          </Match>
          <Match when={order() !== null}>
            <BodyHeading>Here is your order</BodyHeading>
            <OrderComp loading={loading()} {...order()!} onPay={handlePay} />
          </Match>
        </Switch>
      </Body>
    </>
  );
};
