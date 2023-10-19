import { MyMasksContent, SpoilerHeading } from "./style";
import { For, Show } from "solid-js";
import { Spoiler } from "../../../components/spoiler";
import { Accent, Subtitle, Title } from "../../../components/typography/style";
import { TIdentityId, TOrigin, originToHostname } from "@fort-major/masquerade-shared";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { useAllOriginData } from "../../../store/cabinet";
import { useMasqueradeClient } from "../../../store/global";
import { produce } from "solid-js/store";
import { CabinetHeading } from "../../../styles";
import { Divider } from "../../../components/divider/style";

export function MyMasksPage() {
  const client = useMasqueradeClient();
  const [[allOriginData, setAllOriginData], fetched] = useAllOriginData();

  const editPseudonym = async (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => {
    await client()!.editPseudonym(origin, identityId, newPseudonym);
    setAllOriginData(([o]) => origin === o, 1, "masks", identityId, "pseudonym", newPseudonym);
  };

  const addNewMask = async (origin: TOrigin) => {
    const newMask = await client()!.register(origin);

    if (!newMask) return;

    setAllOriginData(
      produce((a) => {
        const entry = a.find(([o]) => o === origin);
        entry![1]!.masks.push(newMask);
      }),
    );
  };

  return (
    <>
      <CabinetHeading>My Masks</CabinetHeading>
      <MyMasksContent>
        <Show when={fetched()} fallback={<p>Loading...</p>}>
          <For fallback={<p>You have no masks yet</p>} each={allOriginData}>
            {(entry) => (
              <Spoiler
                header={
                  <SpoilerHeading>
                    <Subtitle>Masks from</Subtitle>
                    <Accent size={24}>{originToHostname(entry[0])}</Accent>
                  </SpoilerHeading>
                }
              >
                <For each={entry[1]!.masks}>
                  {(mask, idx) => (
                    <>
                      <Divider />
                      <LoginOption
                        pseudonym={mask.pseudonym}
                        principal={mask.principal}
                        onEdit={(newValue) => editPseudonym(entry[0], idx(), newValue)}
                      />
                    </>
                  )}
                </For>
                <Divider />
                <AddNewMaskBtn onClick={() => addNewMask(entry[0])} />
              </Spoiler>
            )}
          </For>
        </Show>
      </MyMasksContent>
    </>
  );
}
