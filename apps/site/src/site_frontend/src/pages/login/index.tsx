import { createEventSignal } from "@solid-primitives/event-listener";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { ILoginResultMsg, ILoginSiteReadyMsg, ZLoginRequestMsg } from "../../types/messages";
import { useNavigate } from "@solidjs/router";
import { MetaMaskSnapAgent } from "internet-computer-snap-agent";
import { IOriginData, IState, TOrigin, unreacheable } from "internet-computer-snap-shared";

enum LoginPageState {
    WaitingForLoginRequest,
    ConnectingWallet,
    WaitingForUserInput
}

export function LoginPage() {
    const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [availableOrigins, setAvailableOrigins] = createSignal<Record<TOrigin, IOriginData> | null>(null);
    const [deriviationOrigin, setDeriviationOrigin] = createSignal<string | null>(null);
    const [identityId, setIdentityId] = createSignal<number | null>(null);
    const message = createEventSignal(window, "message");
    const navigate = useNavigate();

    onMount(() => {
        if (!validateReferrer()) {
            navigate('/');
        }

        const msg: ILoginSiteReadyMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_site_ready'
        };
        window.parent.postMessage(msg);

        window.onbeforeunload = function () {
            const msg: ILoginResultMsg = {
                domain: 'internet-computer-metamask-snap',
                type: 'login_result',
                result: false
            };
            window.parent.postMessage(msg);
        }
    });

    onCleanup(() => {
        window.onbeforeunload = null;
    });

    const validateReferrer = () => {
        const referrerOrigin = (new URL(document.referrer)).origin;
        const selfOrigin = window.location.origin;
        const parentOrigin = window.parent.location.origin;

        if (referrerOrigin !== parentOrigin || selfOrigin === parentOrigin) {
            return false;
        }

        return true;
    };

    const awaitLoginRequest = () => {
        if (state() !== LoginPageState.WaitingForLoginRequest) {
            return;
        }

        const msg = message();

        if (!msg) {
            return;
        }

        if (msg.origin !== window.parent.location.origin) {
            return;
        }

        // we only expect one single kind of message here
        ZLoginRequestMsg.parse(msg);

        // if the message appears, change the state
        setState(LoginPageState.ConnectingWallet);
    };

    createEffect(awaitLoginRequest, message());

    const connectWallet = async () => {
        if (state() !== LoginPageState.ConnectingWallet) {
            return;
        }

        const agent = await MetaMaskSnapAgent.create();
        setAgent(agent);

        let mainOriginData = await agent.protected_getOriginData(window.parent.location.origin);

        if (!mainOriginData) {
            await agent.protected_addIdentity(window.parent.location.origin);
            mainOriginData = await agent.protected_getOriginData(window.parent.location.origin);
        }

        const availOrigins: Record<TOrigin, IOriginData> = {
            [window.parent.location.origin]: mainOriginData!
        };

        for (let link of mainOriginData!.links) {
            const linkedOrigin = await agent.protected_getOriginData(link);
            availOrigins[link] = linkedOrigin!;
        }

        setAvailableOrigins(availOrigins);
        setState(LoginPageState.WaitingForUserInput);
    };

    createEffect(connectWallet, state());

    const onLogin = async () => {
        if (!validateReferrer()) { unreacheable() }

        const ag = agent();
        if (ag === null) { unreacheable() }

        const availOrigins = availableOrigins();
        if (availOrigins === null) { unreacheable() }

        const id = identityId();
        if (id === null) { unreacheable() }

        let deriviationOrig = deriviationOrigin();
        if (deriviationOrig === null) {
            deriviationOrig = window.parent.location.origin;
        }

        await ag.protected_login(window.parent.location.origin, id, deriviationOrig);

        const msg: ILoginResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_result',
            result: true
        };
        window.parent.postMessage(msg);

        window.close();
    };

    const onCancel = async () => {
        window.close();
    };

    const statusText = () => {
        switch (state()) {
            case LoginPageState.WaitingForLoginRequest:
                return <p>Waiting for ${window.parent.location.origin}...</p>;

            case LoginPageState.ConnectingWallet:
                return <p>Connecting to your wallet...</p>;

            default:
                return undefined;
        }
    }

    return (
        <main>

        </main>
    )
}