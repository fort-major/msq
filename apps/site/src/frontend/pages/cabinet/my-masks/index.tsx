import { useStore } from "@nanostores/solid";
import { MyMasksHeader } from "./style";
import { For, Show } from "solid-js";
import { Spoiler } from "../../../components/spoiler";
import { Accent, Title } from "../../../components/typography/style";
import { originToHostname } from "@fort-major/masquerade-shared";
import { $allOriginData } from "../../../store/all-origin-data";

export function MyMasksPage() {
  const allOriginData = useStore($allOriginData);

  return (
    <>
      <MyMasksHeader>My Masks</MyMasksHeader>
      <Show when={allOriginData()} fallback={<p>Loading...</p>}>
        <For fallback={<p>You have no masks yet</p>} each={allOriginData()}>
          {([origin, data]) => (
            <Spoiler
              header={
                <Title>
                  Masks from <Accent>{originToHostname(origin)}</Accent>
                </Title>
              }
            >
              <For each={data!.masks}>{([pseudonym, principal]) => <p>adsasda</p>}</For>
            </Spoiler>
          )}
        </For>
      </Show>
    </>
  );
}
