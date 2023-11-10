import { For, Show, createEffect, createSignal } from "solid-js";
import { useAllOriginData } from "../../../store/cabinet";
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

export function MyLinksPage() {
  const client = useMasqueradeClient();
  const [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys] = useAllOriginData();
  const allOriginDataKeysWithLinks = () =>
    allOriginDataKeys().filter((origin) => allOriginData[origin]!.linksTo.length !== 0);

  const [loading, setLoading] = createSignal(false);

  const [_, showLoader] = useLoader();
  createEffect(() => showLoader(!allOriginDataFetched()));

  const unlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    setLoading(true);
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

    setLoading(false);
  };

  const unlinkAll = async (origin: TOrigin) => {
    setLoading(true);

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
                    <BoopAvatar size={50} principal={Principal.fromText(allOriginData[origin]!.masks[0].principal)} />
                    <Show when={allOriginData[origin]!.masks.length > 1}>
                      <AvatarCount>
                        <AvatarCountText>+{allOriginData[origin]!.masks.length - 1}</AvatarCountText>
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
                  onClick={() => unlinkAll(origin)}
                />
              </LinksInfoWrapper>
              <LinksListWrapper>
                <For each={allOriginData[origin]!.linksTo}>
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
                        onClick={() => unlinkOne(origin, link)}
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
