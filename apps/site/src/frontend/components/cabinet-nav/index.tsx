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
      <Item title="My Masks" url="/my-masks" active={location.pathname === "/my-masks"} />
      <Item title="My Assets" url="/my-assets" active={location.pathname === "/my-assets"} />
      <Item title="My Sessions" url="/my-sessions" active={location.pathname === "/my-sessions"} />
      <Item title="My Links" url="/my-links" active={location.pathname === "/my-links"} />
    </CabinetNavWrapper>
  );
}
