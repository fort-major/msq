import { Principal } from "@dfinity/principal";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { createSignal, onMount } from "solid-js";

export const IndexPage = () => {
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [principal, setPrincipal] = createSignal<Principal>(Principal.anonymous());

    onMount(async () => {
        const agent = await MetaMaskSnapAgent.create();
        const principal = await agent.getPrincipal();

        setAgent(agent);
        setPrincipal(principal);
    });

    const authBtn = () => {
        if (agent() === null) return undefined;

        const mode = principal() === Principal.anonymous() ? 'login' : 'logout';
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

    return (
        <main>
            {authBtn()}
        </main>
    );
}