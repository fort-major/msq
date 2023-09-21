import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { createSignal, onMount } from "solid-js";
import { Backend, createBackendActor } from "../../backend";
import { bytesToHex, debugStringify } from "@fort-major/ic-snap-shared";
import { IcrcLedgerCanister } from "@dfinity/ledger";

export const IndexPage = () => {
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [actor, setActor] = createSignal<ActorSubclass<Backend> | null>(null);
    const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());

    onMount(async () => {
        const agent = await MetaMaskSnapAgent.create("http://localhost:8080", "local:http://localhost:8081");

        console.log(agent);

        setAgent(agent);
        setActor(createBackendActor(agent));

        await agent.fetchRootKey().catch((err) => {
            console.warn(
                "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
        });

        console.log('fetched rootKey', bytesToHex(new Uint8Array(agent.rootKey!)));

        const principal = await agent.getPrincipal();

        console.log(principal.toText());

        setPrincipal(principal);
    });

    const authBtn = () => {
        const mode = principal().toText() === Principal.anonymous().toText() ? 'login' : 'logout';
        const fn = mode === 'login' ? onLogin : onLogout;

        return <button onClick={fn}>{mode}</button>;
    }

    const onLogin = async () => {
        if (await agent()!.requestLogin()) {
            setPrincipal(await agent()!.getPrincipal());
        } else {
            console.log('user denied login');
        }
    };

    const onLogout = async () => {
        if (await agent()!.requestLogout()) {
            setPrincipal(await agent()!.getPrincipal());
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
        const blockId = await agent()?.requestICRC1Transfer(
            Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
            { owner: Principal.fromText('aaaaa-aa') },
            10000000n,
            new Uint8Array([1, 3, 3, 7])
        );

        console.log('transfer success', blockId);
    };

    return (
        <main>
            {agent() && authBtn()}
            {agent() && canisterCallBtns()}
            {agent() && icpTransferButton()}
        </main>
    );
}
