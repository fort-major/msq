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
import { useMasqueradeClient } from "../../../store/global";
import { PowerIcon } from "../../../components/typography/icons";

export function MySessionsPage() {
  const client = useMasqueradeClient();
  const [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys] = useAllOriginData();
  const originsWithSession = () =>
    allOriginDataKeys().filter((origin) => allOriginData[origin]!.currentSession !== undefined);

  const getMaskBySession = (session: ISession): { pseudonym: string; principal: Principal } => {
    const originData = allOriginData[session.deriviationOrigin];

    if (!originData) return { pseudonym: "Error", principal: Principal.anonymous() };

    const mask = originData.masks[session.identityId];

    return { pseudonym: mask.pseudonym, principal: Principal.fromText(mask.principal) };
  };

  const handleStopSession = (e: Event, origin: TOrigin) => {
    assertEventSafe(e);

    stopSession(origin);
  };

  const stopSession = async (origin: TOrigin) => {
    const result = await client()!.stopSession(origin);

    if (result) {
      setAllOriginData(origin, "currentSession", undefined);
    }
  };

  return (
    <>
      <CabinetHeading>Active Authorization Sessions</CabinetHeading>
      <MySessionsContent>
        <For each={originsWithSession()}>
          {(origin) => {
            const mask = getMaskBySession(allOriginData[origin]!.currentSession!);

            return (
              <SessionWrapper>
                <SessionWebsiteWrapper>
                  <SessionWebsiteEllipseWrapper>
                    <SessionWebsiteEllipse />
                  </SessionWebsiteEllipseWrapper>
                  <SessionWebsiteDataWrapper>
                    <SessionWebsiteDataSite>{originToHostname(origin)}</SessionWebsiteDataSite>
                    <SessionWebsiteDataTimestamp>
                      {timestampToStr(allOriginData[origin]!.currentSession!.timestampMs)}
                    </SessionWebsiteDataTimestamp>
                  </SessionWebsiteDataWrapper>
                </SessionWebsiteWrapper>
                <VerticalDivider height={60} />
                <SessionInfoWrapper>
                  <BoopAvatar size={50} principal={mask.principal} eyesAngle={90} />
                  <SessionInfoDataWrapper>
                    <SessionInfoDataPseudonym>
                      {mask.pseudonym} (from{" "}
                      <Accent>{originToHostname(allOriginData[origin]!.currentSession!.deriviationOrigin)}</Accent>)
                    </SessionInfoDataPseudonym>
                    <SessionInfoDataPrincipal>{mask.principal.toString()}</SessionInfoDataPrincipal>
                  </SessionInfoDataWrapper>
                </SessionInfoWrapper>
                <LogoutBtn onClick={(e) => handleStopSession(e, origin)}>
                  <PowerIcon />
                </LogoutBtn>
              </SessionWrapper>
            );
          }}
        </For>
      </MySessionsContent>
    </>
  );
}
