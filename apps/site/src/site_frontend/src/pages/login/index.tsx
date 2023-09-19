import { createEventSignal } from "@solid-primitives/event-listener";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { ILoginResultMsg, ILoginSiteReadyMsg, IOriginData, TIdentityId, TOrigin, ZLoginRequestMsg, unreacheable } from "@fort-major/ic-snap-shared";
import { Principal } from "@dfinity/principal";

enum LoginPageState {
    WaitingForLoginRequest,
    ConnectingWallet,
    WaitingForUserInput
}

interface IAvailableOrigin extends IOriginData {
    principals: Principal[]
}

export function LoginPage() {
    const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [availableOrigins, setAvailableOrigins] = createSignal<Record<TOrigin, IAvailableOrigin> | null>(null);
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
        ZLoginRequestMsg.parse(msg.data);

        // if the message appears, change the state
        setState(LoginPageState.ConnectingWallet);
    };

    createEffect(awaitLoginRequest, message());

    const connectWallet = async () => {
        if (state() !== LoginPageState.ConnectingWallet) {
            return;
        }

        const origin = window.parent.location.origin;

        const agent = await MetaMaskSnapAgent.create();
        setAgent(agent);

        let mainOriginData = await agent.protected_getOriginData(origin);

        if (!mainOriginData) {
            await agent.protected_addIdentity(origin);
            mainOriginData = await agent.protected_getOriginData(origin);
        }

        const promises = Array(mainOriginData!.identitiesTotal).fill(0).map((_, idx) => agent.protected_getUrlPrincipalAt(origin, idx));
        const principals = await Promise.all(promises);

        const availOrigins: Record<TOrigin, IAvailableOrigin> = {
            [origin]: { ...mainOriginData!, principals }
        };

        await fillOriginData(availOrigins, mainOriginData!);

        setAvailableOrigins(availOrigins);
        setState(LoginPageState.WaitingForUserInput);
    };

    const fillOriginData = async (availData: Record<TOrigin, IAvailableOrigin>, data: IOriginData) => {
        const ag = agent()!;

        const promises = data.links.map(async link => {
            const linkedOrigin = await ag.protected_getOriginData(link);

            const promises = Array(linkedOrigin!.identitiesTotal).fill(0).map((_, idx) => ag.protected_getUrlPrincipalAt(origin, idx));
            const principals = await Promise.all(promises);

            availData[link] = { ...linkedOrigin!, principals };
        });

        await Promise.all(promises);
    }

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

    const onIdentitySelect = (deriviationOrigin: TOrigin, identityId: TIdentityId) => {
        setDeriviationOrigin(deriviationOrigin);
        setIdentityId(identityId);
    };

    const selection = () => {
        if (state() !== LoginPageState.WaitingForUserInput) {
            return undefined;
        }

        const availOrigins = availableOrigins()!;

        const selection = Object.keys(availOrigins).map(origin => {
            const identities = availOrigins[origin].principals
                .map((prin, idx) =>
                    <button
                        style={{ "border-color": origin === deriviationOrigin() && idx === identityId() ? 'blue' : undefined }}
                        onClick={() => onIdentitySelect(origin, idx)}
                    >
                        {prin.toText()}
                    </button>
                );

            return (
                <div>
                    <h3>Identities from ${origin}</h3>
                    {identities}
                </div>
            );
        })

        return (
            <div>
                {selection}
            </div>
        );
    }

    return (
        <main>
            <div>
                <h1>{window.parent.location.origin} wants you to log in</h1>
                {statusText()}
                {selection()}
                <div>
                    <button onClick={onLogin}>Continue</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </main>
    )
}