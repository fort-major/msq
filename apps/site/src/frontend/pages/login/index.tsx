import { createEventSignal } from "@solid-primitives/event-listener";
import { createEffect, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { InternalSnapClient } from "@fort-major/masquerade-client/dist/esm/internal";
import { ErrorCode, ILoginResultMsg, ILoginSiteReadyMsg, IOriginData, TIdentityId, TOrigin, ZLoginRequestMsg, err } from "@fort-major/masquerade-shared";
import { createIdentityForOrigin } from "../../utils";
import { Ed25519KeyIdentity } from "@dfinity/identity";

enum LoginPageState {
    WaitingForLoginRequest,
    ConnectingWallet,
    WaitingForUserInput
}

interface IAvailableOrigin extends IOriginData {
    identities: Ed25519KeyIdentity[]
}

const referrerOrigin = (new URL(document.referrer)).origin;

export function LoginPage() {
    const [state, setState] = createSignal(LoginPageState.WaitingForLoginRequest);
    const [snapClient, setSnapClient] = createSignal<InternalSnapClient | null>(null);
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
                result: undefined
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

        const client = await InternalSnapClient.create({ snapId: 'local:http://localhost:8081' });
        setSnapClient(client);

        await fetchAvailableOrigins();

        setState(LoginPageState.WaitingForUserInput);
    };

    const fetchAvailableOrigins = async () => {
        const client = snapClient()!;

        let mainOriginData = await client.getOriginData(referrerOrigin);

        if (!mainOriginData) {
            await client.register(referrerOrigin);
            mainOriginData = await client.getOriginData(referrerOrigin);
        }

        const promises1 = Array(mainOriginData!.identitiesTotal).fill(0)
            .map((_, idx) => createIdentityForOrigin(client, referrerOrigin, idx));
        const identities = await Promise.all(promises1);

        const availOrigins: Record<TOrigin, IAvailableOrigin> = {
            [referrerOrigin]: { ...mainOriginData!, identities }
        };

        const promises2 = mainOriginData!.links.map(async link => {
            const linkedOrigin = await client.getOriginData(link);

            const promises = Array(linkedOrigin!.identitiesTotal).fill(0)
                .map((_, idx) => createIdentityForOrigin(client, link, idx));

            const identities = await Promise.all(promises);

            availOrigins[link] = { ...linkedOrigin!, identities };
        });

        await Promise.all(promises2);

        setAvailableOrigins(availOrigins);
    }

    createEffect(connectWallet, state());

    const onLogin = async () => {
        const client = snapClient()!;
        const availOrigins = availableOrigins()!;
        const id = identityId()!;

        let deriviationOrig = deriviationOrigin();

        if (!deriviationOrig) {
            deriviationOrig = referrerOrigin;
        }

        await client.login(referrerOrigin, id, deriviationOrig);

        const identity = availOrigins[deriviationOrig].identities[id];

        const msg: ILoginResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_result',
            result: JSON.stringify(identity.toJSON())
        };
        referrerWindow()!.postMessage(msg, { targetOrigin: referrerOrigin });

        window.close();
    };

    const onCancel = async () => {
        const msg: ILoginResultMsg = {
            domain: 'internet-computer-metamask-snap',
            type: 'login_result',
            result: undefined
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
            const identities = availOrigins[origin].identities
                .map(id => id.getPrincipal())
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