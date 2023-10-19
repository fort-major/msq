import { For } from "solid-js";
import { useAllOriginData } from "../../../store/cabinet";
import { CabinetHeading } from "../../../styles";
import {
  LogoutBtn,
  MySessionsContent,
  SessionInfoDataPrincipal,
  SessionInfoDataPseudonym,
  SessionInfoDataWrapper,
  SessionInfoWrapper,
  SessionWebsiteDataSite,
  SessionWebsiteDataTimestamp,
  SessionWebsiteDataWrapper,
  SessionWebsiteEllipse,
  SessionWebsiteEllipseWrapper,
  SessionWebsiteWrapper,
  SessionWrapper,
} from "./style";
import { assertEventSafe, timestampToStr } from "../../../utils";
import { VerticalDivider } from "../../../components/divider/style";
import { BoopAvatar } from "../../../components/boop-avatar";
import { ISession, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { Principal } from "@fort-major/masquerade-shared";
import { Accent } from "../../../components/typography/style";
import PowerBlackSvg from "#assets/power-black.svg";
import { useMasqueradeClient } from "../../../store/global";

export function MySessionsPage() {
  const client = useMasqueradeClient();
  const [[allOriginData, setAllOriginData]] = useAllOriginData();
  const sessions = () => allOriginData.filter((it) => it[1]!.currentSession !== undefined);

  const getMaskBySession = (session: ISession): { pseudonym: string; principal: Principal } => {
    const originData = allOriginData.find(([o]) => o === session.deriviationOrigin);

    if (!originData) return { pseudonym: "Error", principal: Principal.anonymous() };

    const mask = originData[1]!.masks[session.identityId];

    return { pseudonym: mask.pseudonym, principal: Principal.fromText(mask.principal) };
  };

  const handleStopSession = (e: Event, origin: TOrigin) => {
    assertEventSafe(e);

    stopSession(origin);
  };

  const stopSession = async (origin: TOrigin) => {
    const result = await client()!.stopSession(origin);

    if (result) {
      setAllOriginData(([o]) => o === origin, 1, "currentSession", undefined);
    }
  };

  return (
    <>
      <CabinetHeading>Active Authorization Sessions</CabinetHeading>
      <MySessionsContent>
        <For each={sessions()}>
          {(entry) => {
            const mask = getMaskBySession(entry[1]!.currentSession!);

            return (
              <SessionWrapper>
                <SessionWebsiteWrapper>
                  <SessionWebsiteEllipseWrapper>
                    <SessionWebsiteEllipse />
                  </SessionWebsiteEllipseWrapper>
                  <SessionWebsiteDataWrapper>
                    <SessionWebsiteDataSite>{originToHostname(entry[0])}</SessionWebsiteDataSite>
                    <SessionWebsiteDataTimestamp>
                      {timestampToStr(entry[1]!.currentSession!.timestampMs)}
                    </SessionWebsiteDataTimestamp>
                  </SessionWebsiteDataWrapper>
                </SessionWebsiteWrapper>
                <VerticalDivider height={60} />
                <SessionInfoWrapper>
                  <BoopAvatar size={50} principal={mask.principal} eyesAngle={90} />
                  <SessionInfoDataWrapper>
                    <SessionInfoDataPseudonym>
                      {mask.pseudonym} (from{" "}
                      <Accent>{originToHostname(entry[1]!.currentSession!.deriviationOrigin)}</Accent>)
                    </SessionInfoDataPseudonym>
                    <SessionInfoDataPrincipal>{mask.principal.toString()}</SessionInfoDataPrincipal>
                  </SessionInfoDataWrapper>
                </SessionInfoWrapper>
                <LogoutBtn onClick={(e) => handleStopSession(e, entry[0])}>
                  <img src={PowerBlackSvg} alt="stop" />
                </LogoutBtn>
              </SessionWrapper>
            );
          }}
        </For>
      </MySessionsContent>
    </>
  );
}
