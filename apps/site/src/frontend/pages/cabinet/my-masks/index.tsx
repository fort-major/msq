import { MyMasksContent, SpoilerHeading } from "./style";
import { For, createEffect, createSignal } from "solid-js";
import { Spoiler } from "../../../components/spoiler";
import { TIdentityId, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Divider } from "../../../components/divider/style";
import { H2, H5, Span600, SpanAccent, SpanGray115, SpanGray140, Text16, Text24 } from "../../../ui-kit/typography";
import { useOriginData } from "../../../store/origins";

export function MyMasksPage() {
  const { originsData, fetch, addNewMask, editPseudonym } = useOriginData();
  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (fetch) fetch();
  });

  const handleEditPseudonym = async (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => {
    setLoading(true);

    await editPseudonym!(origin, identityId, newPseudonym);

    setLoading(false);
  };

  const handleAddNewMask = async (origin: TOrigin) => {
    setLoading(true);

    await addNewMask!(origin);

    setLoading(false);
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
          each={Object.keys(originsData)}
        >
          {(origin) => (
            <Spoiler
              defaultOpen={originsData[origin]!.masks.length < 3}
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
              <For each={originsData[origin]!.masks}>
                {(mask, idx) => (
                  <>
                    <Divider />
                    <LoginOption
                      pseudonym={mask.pseudonym}
                      principal={mask.principal}
                      onEdit={(newValue) => handleEditPseudonym(origin, idx(), newValue)}
                    />
                  </>
                )}
              </For>
              <Divider />
              <AddNewMaskBtn loading={loading()} onClick={() => handleAddNewMask(origin)} />
            </Spoiler>
          )}
        </For>
      </MyMasksContent>
    </>
  );
}
