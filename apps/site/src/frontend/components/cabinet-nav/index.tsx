import { useStore } from "@nanostores/solid";
import { $router } from "../..";
import { CabinetNavItem, CabinetNavItemDot, CabinetNavItemText, CabinetNavWrapper } from "./styles";
import { Match, Switch } from "solid-js";

interface IItemProps {
  title: string;
  url: string;
  active: boolean;
}

const Item = (props: IItemProps) => {
  return (
    <CabinetNavItem onClick={() => $router.open(props.url)}>
      <Switch>
        <Match when={props.active}>
          <CabinetNavItemDot />
        </Match>
      </Switch>
      <CabinetNavItemText>{props.title}</CabinetNavItemText>
    </CabinetNavItem>
  );
};

export function CabinetNav() {
  const page = useStore($router);

  return (
    <CabinetNavWrapper>
      <Item title="My Masks" url="/my-masks" active={page()?.route === "myMasks"} />
      <Item title="My Assets" url="/my-assets" active={page()?.route === "myAssets"} />
      <Item title="My Sessions" url="/my-sessions" active={page()?.route === "mySessions"} />
      <Item title="My Links" url="/my-links" active={page()?.route === "myLinks"} />
    </CabinetNavWrapper>
  );
}
