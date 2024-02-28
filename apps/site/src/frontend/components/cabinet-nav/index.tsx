import { useLocation, useNavigate } from "@solidjs/router";
import { CabinetNavItem, CabinetNavItemDot, CabinetNavWrapper } from "./styles";
import { For, Match, Switch } from "solid-js";
import { eventHandler } from "../../utils";
import { Size16, Text, WeightSemiBold } from "../../ui-kit/typography";

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
      <Text size={16} weight={600}>
        {props.title}
      </Text>
    </CabinetNavItem>
  );
};

export function CabinetNav(props: { activeUrl?: string }) {
  const location = useLocation();

  const links = [
    { title: "My Masks", url: "/cabinet/my-masks", active: false },
    { title: "My Assets", url: "/cabinet/my-assets", active: false },
    { title: "Active Sessions", url: "/cabinet/my-sessions", active: false },
    { title: "Mask Links", url: "/cabinet/my-links", active: false },
  ];

  links.forEach((link) => {
    link.active = link.url === props.activeUrl || link.url === location.pathname;
  });

  return (
    <CabinetNavWrapper>
      <For each={links}>{(link) => <Item {...link} />}</For>
    </CabinetNavWrapper>
  );
}
