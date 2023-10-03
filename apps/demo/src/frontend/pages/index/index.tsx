import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { SnapClient } from "@fort-major/masquerade-client";
import { createSignal, onMount } from "solid-js";
import { Backend, createBackendActor } from "../../backend";
import { ErrorCode, TOrigin, err } from "@fort-major/masquerade-shared";

export const IndexPage = () => {
    const [snapClient, setSnapClient] = createSignal<SnapClient | null>();
    const [actor, setActor] = createSignal<ActorSubclass<Backend> | null>(null);
    const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());
    const [links, setLinks] = createSignal<TOrigin[]>([]);

    onMount(async () => {
        const client = await SnapClient.create({ snapId: import.meta.env.VITE_MSQ_SNAP_ID });
        setLinks(await client.getLinks());

        setSnapClient(client);

        if (await client.isAuthorized()) {
            const identity = (await client.requestLogin())!;
            setPrincipal(await identity.getPrincipal());

            const agent = new HttpAgent({ host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST, identity });
            setActor(createBackendActor(agent));

            await agent.fetchRootKey().catch((err) => {
                console.warn(
                    "Unable to fetch root key. Check to ensure that your local replica is running"
                );
                console.error(err);
            });
        }
    });

    const authBtn = () => {
        const mode = principal().toText() == Principal.anonymous().toText() ? 'login' : 'logout';
        const fn = mode === 'login' ? onLogin : onLogout;

        return <button onClick={fn}>{mode}</button>;
    }

    const onLogin = async () => {
        const client = snapClient()!;
        const identity = await client.requestLogin();

        if (!identity) {
            err(ErrorCode.UNKOWN, 'user denied login');
        }

        const agent = new HttpAgent({ host: import.meta.env.VITE_MSQ_DFX_NETWORK_HOST, identity });
        setActor(createBackendActor(agent));

        await agent.fetchRootKey().catch((err) => {
            console.warn(
                "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
        });

        setPrincipal(identity.getPrincipal());
    };

    const onLogout = async () => {
        if (await snapClient()!.requestLogout()) {
            setPrincipal(Principal.anonymous());
        } else {
            console.log('user denied logout');
        }
    };

    const canisterCallBtns = () => {
        return (
            <>
                <button onClick={onQuery}>Do query call</button>
                <button onClick={onUpdate}>Do update call</button>
            </>
        )
    }

    const onQuery = async () => {
        const result = await actor()!.greet('World');

        alert(result);
    };

    const onUpdate = async () => {
        const result = await actor()!.greet_certified('World');

        alert(result);
    };

    const icpTransferButton = () => {
        return <button onClick={onTransfer}>Send ICP</button>
    }

    const onTransfer = async () => {
        const blockId = await snapClient()?.requestICRC1Transfer(
            Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
            { owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai') },
            10000000n,
            new Uint8Array([1, 3, 3, 7])
        );

        console.log('transfer success', blockId);
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
        )
    }

    const onLink = async () => {
        await snapClient()!.requestLink('http://localhost1:5173');
        setLinks(await snapClient()!.getLinks());
    }

    const onUnlink = async () => {
        await snapClient()!.requestUnlink('http://localhost1:5173');
        setLinks(await snapClient()!.getLinks());
    }

    return (
        <main>
            <h3>Hello, {principal().toText()}</h3>
            {snapClient() && authBtn()}
            {snapClient() && canisterCallBtns()}
            {snapClient() && icpTransferButton()}
            {snapClient() && linkMaskBtn()}
        </main>
    );
}
