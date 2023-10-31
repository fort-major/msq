import { type ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { MasqueradeClient } from "@fort-major/masquerade-client";
import { Match, Show, Switch, createEffect, createResource, createSignal, onMount } from "solid-js";
import { Body, BodyHeading, Header, LoginButton, Logo, ProfileWrapper } from "./style";
import MetaMaskLogoSvg from "#assets/metamask.svg";
import { PlushieCard } from "../../components/plushie-card";

interface IProfile {
  pseudonym: string;
  avatarSrc: string;
}

const ICP_TOKEN_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const RECIPIENT_PRINCIPAL = "6xqad-ivesr-pbpu5-3g5ka-3piah-uvuk2-buwfp-enqaa-p64lr-y7sdi-sqe";

export const IndexPage = () => {
  const [qty, setQty] = createSignal(0);
  const [defaultInStock] = createSignal(1000);
  const [inStock, setInStock] = createSignal(1000);
  const [identity, setIdentity] = createSignal<Identity | null>(null);
  const [profile, setProfile] = createSignal<IProfile | null>(null);

  const [msq, setMsq] = createResource(() =>
    MasqueradeClient.create({ forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV" }),
  );

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

  const handleContinue = async () => {};

  const handleAdd = () => {
    setQty((qty) => (qty < inStock() ? qty + 1 : qty));
    setInStock((inStock) => (inStock > 0 ? inStock - 1 : inStock));
  };

  const handleRemove = () => {
    setQty((qty) => (qty > 0 ? qty - 1 : qty));
    setInStock((inStock) => (inStock < defaultInStock() ? inStock + 1 : inStock));
  };

  return (
    <>
      <Header>
        <Logo>Plushie World</Logo>
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
        <BodyHeading>Support us by purchasing our Plushies!</BodyHeading>
        <PlushieCard
          loggedIn={identity() !== null}
          inStock={inStock()}
          qty={qty()}
          price={0.1}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onContinue={handleContinue}
        />
      </Body>
    </>
  );
};
