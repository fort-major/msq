import { MyMasksContent, SpoilerHeading } from "./style";
import { For, createEffect, createSignal } from "solid-js";
import { Spoiler } from "../../../components/spoiler";
import { TIdentityId, TOrigin, originToHostname } from "@fort-major/msq-shared";
import { LoginOption } from "../../../components/login-option";
import { AddNewMaskBtn } from "../../../components/add-new-mask-btn";
import { Divider } from "../../../components/divider/style";
import { ColorGray115, H2, H5, Text } from "../../../ui-kit/typography";
import { useOriginData } from "../../../store/origins";
import { useMsqClient } from "../../../store/global";
import { COLOR_ACCENT, COLOR_GRAY_140, CabinetContent, CabinetPage } from "../../../ui-kit";
import { CabinetNav } from "../../../components/cabinet-nav";
import { ContactUsBtn } from "../../../components/contact-us-btn";

export function MyMasksPage() {
  const msq = useMsqClient();
  const { originsData, init, addNewMask, editPseudonym } = useOriginData();
  const [loading, setLoading] = createSignal(false);

  createEffect(() => {
    if (msq()) init();
  });

  const handleEditPseudonym = async (origin: TOrigin, identityId: TIdentityId, newPseudonym: string) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await editPseudonym!(origin, identityId, newPseudonym);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  const handleAddNewMask = async (origin: TOrigin) => {
    setLoading(true);
    document.body.style.cursor = "wait";

    await addNewMask!(origin);

    document.body.style.cursor = "unset";
    setLoading(false);
  };

  return (
    <CabinetPage>
      <CabinetNav />
      <CabinetContent>
        <H2>My Masks</H2>
        <MyMasksContent>
          <For
            fallback={
              <H5>
                <span class={ColorGray115}>No masks yet</span>
              </H5>
            }
            each={Object.keys(originsData)}
          >
            {(origin) => (
              <Spoiler
                defaultOpen={true}
                header={
                  <SpoilerHeading>
                    <Text size={16} weight={600} color={COLOR_GRAY_140}>
                      Masks from
                    </Text>
                    <Text size={24} weight={600} color={COLOR_ACCENT}>
                      {originToHostname(origin)}
                    </Text>
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
      </CabinetContent>

      <ContactUsBtn />
    </CabinetPage>
  );
}
