import { createEventSignal } from "@solid-primitives/event-listener";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { MetaMaskSnapAgent } from "@fort-major/ic-snap-agent";
import { ErrorCode, ILoginResultMsg, ILoginSiteReadyMsg, IOriginData, TIdentityId, TOrigin, ZLoginRequestMsg, err, unreacheable } from "@fort-major/ic-snap-shared";
import { Principal } from "@dfinity/principal";

enum LoginPageState {
    WaitingForLoginRequest,
    ConnectingWallet,
    WaitingForUserInput
}

interface IAvailableOrigin extends IOriginData {
    principals: Principal[]
}

const referrerOrigin = (new URL(document.referrer)).origin;

export function LoginPage() {
    const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
    const [agent, setAgent] = createSignal<MetaMaskSnapAgent | null>(null);
    const [availableOrigins, setAvailableOrigins] = createSignal<Record<TOrigin, IAvailableOrigin> | null>(null);
    const [deriviationOrigin, setDeriviationOrigin] = createSignal<string | undefined>(undefined);
    const [identityId, setIdentityId] = createSignal<number | null>(null);
    const [referrerWindow, setReferrerWindow] = createSignal<MessageEventSource | null>(null);
    const message = createEventSignal(window, "message");
    const navigate = useNavigate();

    const awaitLoginRequest = () => {
        if (state() !== LoginPageState.WaitingForLoginRequest) {
            return;
        }

        const msg = message();

        if (!msg) {
            return;
        }

        if (msg.origin !== referrerOrigin) {
            return;
        }

        // we only expect one single kind of message here
        ZLoginRequestMsg.parse(msg.data);

        // if login request received, send back ready
        if (!msg.source) {
            err(ErrorCode.UNKOWN, 'No message source found');
        }

        const readyMsg: ILoginSiteReadyMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_site_ready'
        };

        msg.source.postMessage(readyMsg, { targetOrigin: referrerOrigin });

        setReferrerWindow(msg.source);

        window.onbeforeunload = () => {
            const failMsg: ILoginResultMsg = {
                domain: 'internet-computer-metamask-snap',
                type: 'login_result',
                result: false
            };

            referrerWindow()!.postMessage(failMsg, { targetOrigin: referrerOrigin });
        };

        setState(LoginPageState.ConnectingWallet);
    };

    createEffect(awaitLoginRequest, message());

    const connectWallet = async () => {
        if (state() !== LoginPageState.ConnectingWallet) {
            return;
        }

        const agent = await MetaMaskSnapAgent.create('http://localhost:8000', 'local:http://localhost:8081');
        setAgent(agent);

        let mainOriginData = await agent._getOriginData(referrerOrigin);

        if (!mainOriginData) {
            await agent._addIdentity(referrerOrigin);
            mainOriginData = await agent._getOriginData(referrerOrigin);
        }

        const promises = Array(mainOriginData!.identitiesTotal).fill(0).map(async (_, idx) => {
            await agent._setSiteSession({ type: 'origin', identityId: idx, origin: referrerOrigin });
            return agent.getPrincipal();
        });
        const principals = await Promise.all(promises);

        const availOrigins: Record<TOrigin, IAvailableOrigin> = {
            [referrerOrigin]: { ...mainOriginData!, principals }
        };

        await fillOriginData(availOrigins, mainOriginData!);

        await agent._setSiteSession(undefined);

        setAvailableOrigins(availOrigins);
        setState(LoginPageState.WaitingForUserInput);
    };

    const fillOriginData = async (availData: Record<TOrigin, IAvailableOrigin>, data: IOriginData) => {
        const ag = agent()!;

        const promises = data.links.map(async link => {
            const linkedOrigin = await ag._getOriginData(link);

            const promises = Array(linkedOrigin!.identitiesTotal).fill(0).map(async (_, idx) => {
                await ag._setSiteSession({ type: 'origin', identityId: idx, origin: link });
                return ag.getPrincipal();
            });
            const principals = await Promise.all(promises);

            availData[link] = { ...linkedOrigin!, principals };
        });

        await Promise.all(promises);
    }

    createEffect(connectWallet, state());

    const onLogin = async () => {
        const ag = agent();
        if (ag === null) { unreacheable() }

        const availOrigins = availableOrigins();
        if (availOrigins === null) { unreacheable() }

        const id = identityId();
        if (id === null) { unreacheable() }

        let deriviationOrig = deriviationOrigin();
        if (deriviationOrig === null) {
            deriviationOrig = referrerOrigin;
        }

        await ag._login(referrerOrigin, id, deriviationOrig);

        const msg: ILoginResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_result',
            result: true
        };
        referrerWindow()!.postMessage(msg, { targetOrigin: referrerOrigin });

        window.close();
    };

    const onCancel = async () => {
        const msg: ILoginResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_result',
            result: false
        };
        referrerWindow()?.postMessage(msg, { targetOrigin: referrerOrigin });

        window.close();
    };

    const statusText = () => {
        switch (state()) {
            case LoginPageState.WaitingForLoginRequest:
                return <p>Waiting for ${referrerOrigin}...</p>;

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
                <h1>{referrerOrigin} wants you to log in</h1>
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