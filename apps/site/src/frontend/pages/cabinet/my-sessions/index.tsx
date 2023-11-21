import { For, createEffect, createSignal } from "solid-js";
import {
  MySessionsContent,
  SessionInfoDataPrincipal,
  SessionInfoDataWrapper,
  SessionInfoWrapper,
  SessionWebsiteDataWrapper,
  SessionWebsiteEllipse,
  SessionWebsiteEllipseWrapper,
  SessionWebsiteWrapper,
  SessionWrapper,
} from "./style";
import { timestampToStr } from "../../../utils";
import { VerticalDivider } from "../../../components/divider/style";
import { BoopAvatar } from "../../../components/boop-avatar";
import { ISession, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { Principal } from "@fort-major/masquerade-shared";
import {
  H2,
  H5,
  Span500,
  Span600,
  SpanAccent,
  SpanGray115,
  SpanGray140,
  Text12,
  Text16,
  Text24,
} from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { useOriginData } from "../../../store/origins";
import { useMasqueradeClient } from "../../../store/global";
import { CabinetContent, CabinetPage } from "../../../ui-kit";
import { CabinetNav } from "../../../components/cabinet-nav";
import { ContactUsBtn } from "../../../components/contact-us-btn";

export function MySessionsPage() {
  const msq = useMasqueradeClient();
  const { originsData, init, stopSession } = useOriginData();
  const originsWithSession = () =>
    Object.keys(originsData).filter((origin) => originsData[origin]!.currentSession !== undefined);

  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (msq()) init();
  });

  const getMaskBySession = (session: ISession): { pseudonym: string; principal: Principal } => {
    const originData = originsData[session.deriviationOrigin];

    if (!originData) return { pseudonym: "Error", principal: Principal.anonymous() };

    const mask = originData.masks[session.identityId];

    return { pseudonym: mask.pseudonym, principal: Principal.fromText(mask.principal) };
  };

  const handleStopSession = async (origin: TOrigin) => {
    setLoading(true);

    await stopSession!(origin);

    setLoading(false);
  };

  return (
    <CabinetPage>
      <CabinetNav />
      <CabinetContent>
        <H2>
          Active <br /> Authorization Sessions
        </H2>
        <MySessionsContent>
          <For
            each={originsWithSession()}
            fallback={
              <H5>
                <SpanGray115>No active sessions</SpanGray115>
              </H5>
            }
          >
            {(origin) => {
              const mask = getMaskBySession(originsData[origin]!.currentSession!);

              return (
                <SessionWrapper>
                  <SessionWebsiteWrapper>
                    <SessionWebsiteEllipseWrapper>
                      <SessionWebsiteEllipse />
                    </SessionWebsiteEllipseWrapper>
                    <SessionWebsiteDataWrapper>
                      <Text24>
                        <Span600>{originToHostname(origin)}</Span600>
                      </Text24>
                      <Text16>
                        <Span500>
                          <SpanGray140>{timestampToStr(originsData[origin]!.currentSession!.timestampMs)}</SpanGray140>
                        </Span500>
                      </Text16>
                    </SessionWebsiteDataWrapper>
                  </SessionWebsiteWrapper>
                  <VerticalDivider height={60} />
                  <SessionInfoWrapper>
                    <BoopAvatar size={50} principal={mask.principal} />
                    <SessionInfoDataWrapper>
                      <Text16>
                        <Span600>
                          {mask.pseudonym} (from{" "}
                          <SpanAccent>
                            {originToHostname(originsData[origin]!.currentSession!.deriviationOrigin)}
                          </SpanAccent>
                          )
                        </Span600>
                      </Text16>
                      <Text12>
                        <SpanGray140 class={SessionInfoDataPrincipal}>{mask.principal.toString()}</SpanGray140>
                      </Text12>
                    </SessionInfoDataWrapper>
                  </SessionInfoWrapper>
                  <Button
                    kind={EButtonKind.Primary}
                    icon={EIconKind.PowerOff}
                    iconOnlySize={50}
                    disabled={loading()}
                    onClick={() => handleStopSession(origin)}
                  />
                </SessionWrapper>
              );
            }}
          </For>
        </MySessionsContent>
      </CabinetContent>

      <ContactUsBtn />
    </CabinetPage>
  );
}
