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
import { ISession, TOrigin, originToHostname } from "@fort-major/msq-shared";
import { Principal } from "@fort-major/msq-shared";
import { ColorAccent, ColorGray115, H2, H5, Text } from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { useOriginData } from "../../../store/origins";
import { useMsqClient } from "../../../store/global";
import { COLOR_GRAY_140, CabinetContent, CabinetPage } from "../../../ui-kit";
import { CabinetNav } from "../../../components/cabinet-nav";
import { ContactUsBtn } from "../../../components/contact-us-btn";

export function MySessionsPage() {
  const msq = useMsqClient();
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
    document.body.style.cursor = "wait";

    await stopSession!(origin);

    document.body.style.cursor = "unset";
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
                <span class={ColorGray115}>No active sessions</span>
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
                      <Text size={24} weight={600}>
                        {originToHostname(origin)}
                      </Text>
                      <Text size={16} weight={500} color={COLOR_GRAY_140}>
                        {timestampToStr(originsData[origin]!.currentSession!.timestampMs)}
                      </Text>
                    </SessionWebsiteDataWrapper>
                  </SessionWebsiteWrapper>
                  <VerticalDivider height={60} />
                  <SessionInfoWrapper>
                    <BoopAvatar size={50} principal={mask.principal} />
                    <SessionInfoDataWrapper>
                      <Text size={16} weight={600}>
                        {mask.pseudonym} (from{" "}
                        <span class={ColorAccent}>
                          {originToHostname(originsData[origin]!.currentSession!.deriviationOrigin)}
                        </span>
                        )
                      </Text>
                      <Text size={12} color={COLOR_GRAY_140} class={SessionInfoDataPrincipal}>
                        {mask.principal.toString()}
                      </Text>
                    </SessionInfoDataWrapper>
                  </SessionInfoWrapper>
                  <Button
                    label="log out"
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
