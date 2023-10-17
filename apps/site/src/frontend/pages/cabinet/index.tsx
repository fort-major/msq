import { useStore } from "@nanostores/solid";
import { $router } from "../..";
import { CabinetNav } from "../../components/cabinet-nav";
import { CabinetContent } from "../../styles";
import { Match, Switch, createEffect } from "solid-js";
import { MyMasksPage } from "./my-masks";
import { $fetchOriginData } from "../../store/all-origin-data";

export default function Cabinet() {
  const page = useStore($router);
  $fetchOriginData.set(true);

  return (
    <>
      <CabinetNav />
      <CabinetContent>
        <Switch fallback={<p>404</p>}>
          <Match when={page()?.route === "myMasks"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "myAssets"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "mySessions"}>
            <MyMasksPage />
          </Match>
          <Match when={page()?.route === "myLinks"}>
            <MyMasksPage />
          </Match>
        </Switch>
      </CabinetContent>
    </>
  );
}
