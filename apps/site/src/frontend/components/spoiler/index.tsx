import { JSXElement, Match, Switch, children, createSignal } from "solid-js";
import { SpoilerChildren, SpoilerHeader, SpoilerIcon, SpoilerWrapper } from "./style";
import ChevronUpSVG from "#assets/chevron-up.svg";

export interface ISpoilerProps {
  header: JSXElement;
  children: JSXElement;
}

export function Spoiler(props: ISpoilerProps) {
  const [open, setOpen] = createSignal(true);

  const c = children(() => props.children);
  const h = children(() => props.header);

  const toggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <SpoilerWrapper>
      <SpoilerHeader onClick={toggle}>
        {h()}
        <SpoilerIcon classList={{ closed: !open() }} src={ChevronUpSVG} alt="show/hide" />
      </SpoilerHeader>
      <Switch>
        <Match when={open()}>
          <SpoilerChildren>{c()}</SpoilerChildren>
        </Match>
      </Switch>
    </SpoilerWrapper>
  );
}
