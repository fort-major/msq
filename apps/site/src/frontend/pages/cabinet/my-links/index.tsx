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
  const [[allOriginData, setAllOriginData]] = useAllOriginData();
  const allOriginDataWithLinks = () => allOriginData.filter(([_, d]) => d!.linksTo.length !== 0);

  const unlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    const result = await client()!.unlinkOne(origin, withOrigin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data.find(([o]) => o === origin)!;
          from[1]!.linksTo = from[1]!.linksTo.filter((link) => link !== withOrigin);

          const to = data.find(([o]) => o === withOrigin)!;
          to[1]!.linksFrom = to[1]!.linksFrom.filter((link) => link !== origin);
        }),
      );
    }
  };

  const unlinkAll = async (origin: TOrigin) => {
    const result = await client()!.unlinkAll(origin);

    if (result) {
      setAllOriginData(
        produce((data) => {
          const from = data.find(([o]) => o === origin)!;
          const oldLinks = from[1]!.linksTo;
          from[1]!.linksTo = [];

          for (let withOrigin of oldLinks) {
            const to = data.find(([o]) => o === withOrigin)!;
            to[1]!.linksFrom = to[1]!.linksFrom.filter((link) => link !== origin);
          }
        }),
      );
    }
  };

  return (
    <>
      <CabinetHeading>Authorized Mask Links</CabinetHeading>
      <MyLinksContent>
        <For each={allOriginDataWithLinks()}>
          {(entry) => (
            <LinksWrapper>
              <LinksInfoWrapper>
                <LinksInfoAvatars>
                  <AvatarWrapper>
                    <BoopAvatar size={50} principal={Principal.fromText(entry[1]!.masks[0].principal)} eyesAngle={90} />
                    <Show when={entry[1]!.masks.length > 1}>
                      <AvatarCount>
                        <AvatarCountText>+{entry[1]!.masks.length - 1}</AvatarCountText>
                      </AvatarCount>
                    </Show>
                  </AvatarWrapper>
                </LinksInfoAvatars>
                <LinksInfoTextWrapper>
                  <Title weight={500}>
                    You've linked your masks from <Accent>{originToHostname(entry[0])}</Accent> to:
                  </Title>
                </LinksInfoTextWrapper>
                <UnlinkAllBtn onClick={() => unlinkAll(entry[0])}>
                  <span>Unlink All</span>
                  <img src={UnlinkBlackSvg} />
                </UnlinkAllBtn>
              </LinksInfoWrapper>
              <LinksListWrapper>
                <For each={entry[1]!.linksTo}>
                  {(link) => (
                    <LinksListItem>
                      <LinksListItemText>{originToHostname(link)}</LinksListItemText>
                      <UnlinkBtn onClick={() => unlinkOne(entry[0], link)}>
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
