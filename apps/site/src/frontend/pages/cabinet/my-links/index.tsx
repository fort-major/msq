import { For, Show, createEffect, createSignal } from "solid-js";
import {
  LinksInfoAvatars,
  LinksInfoWrapper,
  LinksListWrapper,
  LinksWrapper,
  MyLinksContent,
  LinksListItem,
  LinksInfoTextWrapper,
  AvatarWrapper,
  AvatarCount,
  AvatarCountText,
} from "./style";
import { Principal, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { BoopAvatar } from "../../../components/boop-avatar";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { produce } from "solid-js/store";
import { H2, H5, Span500, SpanAccent, SpanGray115, Text16, Text20 } from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { useAssetData } from "../../../store/assets";
import { useOriginData } from "../../../store/origins";

export function MyLinksPage() {
  const msq = useMasqueradeClient();
  const { originsData, fetch, unlinkOne, unlinkAll } = useOriginData();
  const allOriginDataKeysWithLinks = () =>
    Object.keys(originsData).filter((origin) => originsData[origin]!.linksTo.length !== 0);

  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (msq()) fetch();
  });

  const handleUnlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    setLoading(true);

    await unlinkOne!(origin, withOrigin);

    setLoading(false);
  };

  const handleUnlinkAll = async (origin: TOrigin) => {
    setLoading(true);

    unlinkAll!(origin);

    setLoading(false);
  };

  return (
    <>
      <H2>Authorized Mask Links</H2>
      <MyLinksContent>
        <For
          each={allOriginDataKeysWithLinks()}
          fallback={
            <H5>
              <SpanGray115>No links yet</SpanGray115>
            </H5>
          }
        >
          {(origin) => (
            <LinksWrapper>
              <LinksInfoWrapper>
                <LinksInfoAvatars>
                  <AvatarWrapper>
                    <BoopAvatar size={50} principal={Principal.fromText(originsData[origin]!.masks[0].principal)} />
                    <Show when={originsData[origin]!.masks.length > 1}>
                      <AvatarCount>
                        <AvatarCountText>+{originsData[origin]!.masks.length - 1}</AvatarCountText>
                      </AvatarCount>
                    </Show>
                  </AvatarWrapper>
                </LinksInfoAvatars>
                <LinksInfoTextWrapper>
                  <Text20>
                    <Span500>
                      You've linked your masks from <SpanAccent>{originToHostname(origin)}</SpanAccent> to:
                    </Span500>
                  </Text20>
                </LinksInfoTextWrapper>
                <Button
                  kind={EButtonKind.Primary}
                  text="Unlink All"
                  icon={EIconKind.Unlink}
                  disabled={loading()}
                  onClick={() => handleUnlinkAll(origin)}
                />
              </LinksInfoWrapper>
              <LinksListWrapper>
                <For each={originsData[origin]!.linksTo}>
                  {(link) => (
                    <LinksListItem>
                      <Text16>
                        <Span500>{originToHostname(link)}</Span500>
                      </Text16>
                      <Button
                        kind={EButtonKind.Additional}
                        icon={EIconKind.Unlink}
                        iconOnlySize={40}
                        disabled={loading()}
                        onClick={() => handleUnlinkOne(origin, link)}
                      />
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
