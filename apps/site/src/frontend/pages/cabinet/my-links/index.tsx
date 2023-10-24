import { For, Show } from "solid-js";
import { useAllOriginData } from "../../../store/cabinet";
import { CabinetHeading } from "../../../styles";
import {
  LinksInfoAvatars,
  LinksInfoWrapper,
  LinksListWrapper,
  LinksWrapper,
  MyLinksContent,
  UnlinkAllBtn,
  LinksListItem,
  UnlinkBtn,
  LinksListItemText,
  LinksInfoTextWrapper,
  AvatarWrapper,
  AvatarCount,
  AvatarCountText,
} from "./style";
import { Accent, Title } from "../../../components/typography/style";
import { Principal, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import UnlinkBlackSvg from "#assets/unlink-black.svg";
import UnlinkSvg from "#assets/unlink.svg";
import { BoopAvatar } from "../../../components/boop-avatar";
import { useMasqueradeClient } from "../../../store/global";
import { produce } from "solid-js/store";

export function MyLinksPage() {
  const client = useMasqueradeClient();
  const [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys] = useAllOriginData();
  const allOriginDataKeysWithLinks = () =>
    allOriginDataKeys().filter((origin) => allOriginData[origin]!.linksTo.length !== 0);

  const unlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    const result = await client()!.unlinkOne(origin, withOrigin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data[origin]!;
          from.linksTo = from.linksTo.filter((link) => link !== withOrigin);

          const to = data[withOrigin]!;
          to.linksFrom = to.linksFrom.filter((link) => link !== origin);
        }),
      );
    }
  };

  const unlinkAll = async (origin: TOrigin) => {
    const result = await client()!.unlinkAll(origin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data[origin]!;
          const oldLinks = from.linksTo;
          from.linksTo = [];

          for (let withOrigin of oldLinks) {
            const to = data[withOrigin]!;
            to.linksFrom = to.linksFrom.filter((link) => link !== origin);
          }
        }),
      );
    }
  };

  return (
    <>
      <CabinetHeading>Authorized Mask Links</CabinetHeading>
      <MyLinksContent>
        <For each={allOriginDataKeysWithLinks()}>
          {(origin) => (
            <LinksWrapper>
              <LinksInfoWrapper>
                <LinksInfoAvatars>
                  <AvatarWrapper>
                    <BoopAvatar
                      size={50}
                      principal={Principal.fromText(allOriginData[origin]!.masks[0].principal)}
                      eyesAngle={90}
                    />
                    <Show when={allOriginData[origin]!.masks.length > 1}>
                      <AvatarCount>
                        <AvatarCountText>+{allOriginData[origin]!.masks.length - 1}</AvatarCountText>
                      </AvatarCount>
                    </Show>
                  </AvatarWrapper>
                </LinksInfoAvatars>
                <LinksInfoTextWrapper>
                  <Title weight={500}>
                    You've linked your masks from <Accent>{originToHostname(origin)}</Accent> to:
                  </Title>
                </LinksInfoTextWrapper>
                <UnlinkAllBtn onClick={() => unlinkAll(origin)}>
                  <span>Unlink All</span>
                  <img src={UnlinkBlackSvg} />
                </UnlinkAllBtn>
              </LinksInfoWrapper>
              <LinksListWrapper>
                <For each={allOriginData[origin]!.linksTo}>
                  {(link) => (
                    <LinksListItem>
                      <LinksListItemText>{originToHostname(link)}</LinksListItemText>
                      <UnlinkBtn onClick={() => unlinkOne(origin, link)}>
                        <img src={UnlinkSvg} />
                      </UnlinkBtn>
                    </LinksListItem>
                  )}
                </For>
              </LinksListWrapper>
            </LinksWrapper>
          )}
        </For>
      </MyLinksContent>
    </>
  );
}
