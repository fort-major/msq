import { useLocation, useNavigate } from "@solidjs/router";
import { CabinetNavItem, CabinetNavItemDot, CabinetNavWrapper } from "./styles";
import { Match, Switch } from "solid-js";
import { Span600, Text16 } from "../../ui-kit/typography";
import { eventHandler } from "../../utils";

interface IItemProps {
  title: string;
  url: string;
  active: boolean;
}

const Item = (props: IItemProps) => {
  const navigate = useNavigate();
  const handleClick = eventHandler(() => navigate(props.url));

  return (
    <CabinetNavItem classList={{ active: props.active }} onClick={handleClick}>
      <Switch>
        <Match when={props.active}>
          <CabinetNavItemDot />
        </Match>
      </Switch>
      <Text16>
        <Span600>{props.title}</Span600>
      </Text16>
    </CabinetNavItem>
  );
};

export function CabinetNav() {
  const location = useLocation();

  return (
    <CabinetNavWrapper>
      <Item title="My Masks" url="/cabinet/my-masks" active={location.pathname === "/cabinet/my-masks"} />
      <Item title="My Assets" url="/cabinet/my-assets" active={location.pathname === "/cabinet/my-assets"} />
      <Item title="Active Sessions" url="/cabinet/my-sessions" active={location.pathname === "/cabinet/my-sessions"} />
      <Item title="Mask Links" url="/cabinet/my-links" active={location.pathname === "/cabinet/my-links"} />
    </CabinetNavWrapper>
  );
}
