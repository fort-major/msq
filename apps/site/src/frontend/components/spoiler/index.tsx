import { JSXElement, Match, Switch, children, createEffect, createSignal } from "solid-js";
import { SpoilerChildren, SpoilerHeader, SpoilerIcon, SpoilerWrapper } from "./style";
import { ChevronUpIcon } from "../typography/icons";

export interface ISpoilerProps {
  defaultOpen?: boolean | undefined;
  header: JSXElement;
  children: JSXElement;
}

export function Spoiler(props: ISpoilerProps) {
  const [open, setOpen] = createSignal(props.defaultOpen);

  createEffect(() => {
    setOpen(props.defaultOpen);
  });

  const c = children(() => props.children);
  const h = children(() => props.header);

  const toggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <SpoilerWrapper>
      <SpoilerHeader onClick={toggle}>
        {h()}
        <ChevronUpIcon classList={{ closed: !open() }} />
      </SpoilerHeader>
      <Switch>
        <Match when={open()}>
          <SpoilerChildren>{c()}</SpoilerChildren>
        </Match>
      </Switch>
    </SpoilerWrapper>
  );
}
