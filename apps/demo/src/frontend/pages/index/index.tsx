import { type ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { MasqueradeClient } from "@fort-major/masquerade-client";
import { Show, createSignal, onMount } from "solid-js";
import { type Backend, createBackendActor } from "../../backend";

export const IndexPage = () => {
  const [snapClient, setSnapClient] = createSignal<MasqueradeClient | null>();
  const [actor, setActor] = createSignal<ActorSubclass<Backend> | null>(null);
  const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());
  const [pseudonym, setPseudonym] = createSignal("Anonymous User");
  const [avatar, setAvatar] = createSignal<string | null>(null);
  const [links, setLinks] = createSignal<string[]>([]);

  onMount(async () => {
    const client = await MasqueradeClient.create({
      snapId: import.meta.env.VITE_MSQ_SNAP_ID,
      debug: true,
      forceReinstall: import.meta.env.VITE_MSQ_MODE === "DEV",
    });
    setLinks(await client.getLinks());

    setSnapClient(client);

    if (await client.isAuthorized()) {
      const identity = (await client.requestLogin())!;
      setPrincipal(identity.getPrincipal());
      setPseudonym(await identity.getPseudonym());
      setAvatar(await identity.getAvatarSrc());

      const agent = new HttpAgent({
        host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST,
        identity,
      });
      setActor(createBackendActor(agent));

      await agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }
  });

  const authBtn = () => {
    const mode = principal().toText() == Principal.anonymous().toText() ? "login" : "logout";
    const fn = mode === "login" ? onLogin : onLogout;

    return <button onClick={fn}>{mode}</button>;
  };

  const onLogin = async () => {
    const client = snapClient()!;
    const identity = await client.requestLogin();

    if (!identity) {
      throw new Error(`[Login denied]`);
    }

    const agent = new HttpAgent({
      host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST,
      identity,
    });
    setActor(createBackendActor(agent));

    await agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
      console.error(err);
    });

    setPrincipal(identity.getPrincipal());
    setPseudonym(await identity.getPseudonym());
    setAvatar(await identity.getAvatarSrc());
  };

  const onLogout = async () => {
    if (await snapClient()!.requestLogout()) {
      setPrincipal(Principal.anonymous());
    } else {
      console.log("user denied logout");
    }
  };

  const canisterCallBtns = () => {
    return (
      <>
        <button onClick={onQuery}>Do query call</button>
        <button onClick={onUpdate}>Do update call</button>
      </>
    );
  };

  const onQuery = async () => {
    const result = await actor()!.greet("World");

    alert(result);
  };

  const onUpdate = async () => {
    const result = await actor()!.greet_certified("World");

    alert(result);
  };

  const icpTransferButton = () => {
    return <button onClick={onTransfer}>Send ICP</button>;
  };

  const onTransfer = async () => {
    const blockId = await snapClient()?.requestICRC1Transfer(
      Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
      { owner: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai") },
      10000000n,
      new Uint8Array([1, 3, 3, 7]),
    );

    console.log("transfer success", blockId);
  };

  const linkMaskBtn = () => {
    const l = links();

    return (
      <>
        <button onClick={onLink}>
          Link to <b>localhost1</b>
        </button>
        {l.length > 0 && (
          <button onClick={onUnlink}>
            Unlink from <b>localhost1</b>
          </button>
        )}
      </>
    );
  };

  const onLink = async () => {
    await snapClient()!.requestLink("http://localhost1:5173");
    setLinks(await snapClient()!.getLinks());
  };

  const onUnlink = async () => {
    await snapClient()!.requestUnlink("http://localhost1:5173");
    setLinks(await snapClient()!.getLinks());
  };

  return (
    <main>
      <Show when={avatar() !== null}>
        <img src={avatar()!} />
      </Show>
      <h3>
        Hello, {pseudonym()} ({principal().toText()})
      </h3>
      {snapClient() && authBtn()}
      {snapClient() && canisterCallBtns()}
      {snapClient() && icpTransferButton()}
      {snapClient() && linkMaskBtn()}
    </main>
  );
};
