import { MyMasksContent, SpoilerHeading } from "./style";
import { For, createEffect, createSignal } from "solid-js";
import { Spoiler } from "../../../components/spoiler";
import { TIdentityId, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { useAllOriginData } from "../../../store/cabinet";
import { useLoader, useMasqueradeClient } from "../../../store/global";
import { produce } from "solid-js/store";
import { Divider } from "../../../components/divider/style";
import { H2, H5, Span600, SpanAccent, SpanGray115, SpanGray140, Text16, Text24 } from "../../../ui-kit/typography";

export function MyMasksPage() {
  const client = useMasqueradeClient();
  const [allOriginData, setAllOriginData, allOriginDataFetched, allOriginDataKeys] = useAllOriginData();
  const [loading, setLoading] = createSignal(false);

  const [_, showLoader] = useLoader();
  createEffect(() => showLoader(!allOriginDataFetched()));

  const editPseudonym = async (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => {
    await client()!.editPseudonym(origin, identityId, newPseudonym);
    setAllOriginData(origin, "masks", identityId, "pseudonym", newPseudonym);
  };

  const addNewMask = async (origin: TOrigin) => {
    setLoading(true);
    const newMask = await client()!.register(origin);
    setLoading(false);

    if (!newMask) return;

    setAllOriginData(
      produce((a) => {
        a[origin]!.masks.push(newMask);
      }),
    );
  };

  return (
    <>
      <H2>My Masks</H2>
      <MyMasksContent>
        <For
          fallback={
            <H5>
              <SpanGray115>No masks yet</SpanGray115>
            </H5>
          }
          each={allOriginDataKeys()}
        >
          {(origin) => (
            <Spoiler
              defaultOpen={allOriginData[origin]!.masks.length < 3}
              header={
                <SpoilerHeading>
                  <Text16>
                    <SpanGray140>
                      <Span600>Masks from</Span600>
                    </SpanGray140>
                  </Text16>
                  <Text24>
                    <SpanAccent>
                      <Span600>{originToHostname(origin)}</Span600>
                    </SpanAccent>
                  </Text24>
                </SpoilerHeading>
              }
            >
              <For each={allOriginData[origin]!.masks}>
                {(mask, idx) => (
                  <>
                    <Divider />
                    <LoginOption
                      pseudonym={mask.pseudonym}
                      principal={mask.principal}
                      onEdit={(newValue) => editPseudonym(origin, idx(), newValue)}
                    />
                  </>
                )}
              </For>
              <Divider />
              <AddNewMaskBtn loading={loading()} onClick={() => addNewMask(origin)} />
            </Spoiler>
          )}
        </For>
      </MyMasksContent>
    </>
  );
}
