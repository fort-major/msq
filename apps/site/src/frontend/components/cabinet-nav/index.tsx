import { useLocation, useNavigate } from "@solidjs/router";
import { CabinetNavItem, CabinetNavItemDot, CabinetNavItemText, CabinetNavWrapper } from "./styles";
import { Match, Switch } from "solid-js";

interface IItemProps {
  title: string;
  url: string;
  active: boolean;
}

const Item = (props: IItemProps) => {
  const navigate = useNavigate();

  return (
    <CabinetNavItem onClick={() => navigate(props.url)}>
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
  const location = useLocation();

  return (
    <CabinetNavWrapper>
      <Item title="My Masks" url="/cabinet/my-masks" active={location.pathname === "/cabinet/my-masks"} />
      <Item title="My Assets" url="/cabinet/my-assets" active={location.pathname === "/cabinet/my-assets"} />
      <Item title="My Sessions" url="/cabinet/my-sessions" active={location.pathname === "/cabinet/my-sessions"} />
      <Item title="My Links" url="/cabinet/my-links" active={location.pathname === "/cabinet/my-links"} />
    </CabinetNavWrapper>
  );
}
