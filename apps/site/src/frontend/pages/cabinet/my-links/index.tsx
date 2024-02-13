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
import { Principal, TOrigin, originToHostname } from "@fort-major/msq-shared";
import { BoopAvatar } from "../../../components/boop-avatar";
import { useMsqClient } from "../../../store/global";
import { ColorAccent, ColorGray115, H2, H5, Text } from "../../../ui-kit/typography";
import { Button, EButtonKind } from "../../../ui-kit/button";
import { EIconKind } from "../../../ui-kit/icon";
import { useOriginData } from "../../../store/origins";
import { CabinetContent, CabinetPage } from "../../../ui-kit";
import { CabinetNav } from "../../../components/cabinet-nav";
import { ContactUsBtn } from "../../../components/contact-us-btn";

export function MyLinksPage() {
  const msq = useMsqClient();
  const { originsData, init, unlinkOne, unlinkAll } = useOriginData();
  const allOriginDataKeysWithLinks = () =>
    Object.keys(originsData).filter((origin) => originsData[origin]!.linksTo.length !== 0);

  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (msq()) init();
  });

  const handleUnlinkOne = async (origin: TOrigin, withOrigin: TOrigin) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await unlinkOne!(origin, withOrigin);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleUnlinkAll = async (origin: TOrigin) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await unlinkAll!(origin);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  return (
    <CabinetPage>
      <CabinetNav />
      <CabinetContent>
        <H2>Authorized Mask Links</H2>
        <MyLinksContent>
          <For
            each={allOriginDataKeysWithLinks()}
            fallback={
              <H5>
                <span class={ColorGray115}>No links yet</span>
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
                    <Text size={20} weight={500}>
                      You've linked your masks from <span class={ColorAccent}>{originToHostname(origin)}</span> to:
                    </Text>
                  </LinksInfoTextWrapper>
                  <Button
                    label="unlink all"
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
                        <Text size={16} weight={500}>
                          {originToHostname(link)}
                        </Text>
                        <Button
                          label="unlink"
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
      </CabinetContent>

      <ContactUsBtn />
    </CabinetPage>
  );
}
