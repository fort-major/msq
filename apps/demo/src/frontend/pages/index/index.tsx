import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { SnapClient } from "@fort-major/ic-snap-client";
import { createSignal, onMount } from "solid-js";
import { Backend, createBackendActor } from "../../backend";
import { ErrorCode, err } from "@fort-major/ic-snap-shared";

export const IndexPage = () => {
    const [snapClient, setSnapClient] = createSignal<SnapClient | null>();
    const [actor, setActor] = createSignal<ActorSubclass<Backend> | null>(null);
    const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());

    onMount(async () => {
        const client = await SnapClient.create({ snapId: 'local:http://localhost:8081' });

        setSnapClient(client);
    });

    const authBtn = () => {
        const mode = principal().toText() === Principal.anonymous().toText() ? 'login' : 'logout';
        const fn = mode === 'login' ? onLogin : onLogout;

        return <button onClick={fn}>{mode}</button>;
    }

    const onLogin = async () => {
        const client = snapClient()!;
        const identity = await client.requestLogin();

        if (!identity) {
            err(ErrorCode.UNKOWN, 'user denied login');
        }

        const agent = new HttpAgent({ host: 'http://localhost:8080', identity });

        console.log(agent);

        setActor(createBackendActor(agent));

        await agent.fetchRootKey().catch((err) => {
            console.warn(
                "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
        });

        const principal = await agent.getPrincipal();

        console.log(principal.toText());

        setPrincipal(principal);
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

    return (
        <main>
            {snapClient() && authBtn()}
            {snapClient() && canisterCallBtns()}
            {snapClient() && icpTransferButton()}
        </main>
    );
}
