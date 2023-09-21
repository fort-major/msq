import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { createSignal, onMount } from "solid-js";
import { Backend, createBackendActor } from "../../backend";

export const IndexPage = () => {
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [actor, setActor] = createSignal<ActorSubclass<Backend> | null>(null);
    const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());

    onMount(async () => {
        const agent = await MetaMaskSnapAgent.create("http://localhost:8080", "local:http://localhost:8081");

        console.log(agent);

        setAgent(agent);
        setActor(createBackendActor(agent));

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

    return (
        <main>
            {agent() && authBtn()}
            {agent() && canisterCallBtns()}
        </main>
    );
}