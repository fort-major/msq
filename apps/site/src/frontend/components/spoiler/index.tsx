import { JSXElement, Match, Switch, children, createEffect, createSignal } from "solid-js";
import { SpoilerChildren, SpoilerHeader, SpoilerWrapper } from "./style";
import { EIconKind, Icon } from "../../ui-kit/icon";
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
        <Icon kind={EIconKind.ChevronUp} size={20} rotation={open() ? 0 : 180} />
      </SpoilerHeader>
      <Switch>
        <Match when={open()}>
          <SpoilerChildren>{c()}</SpoilerChildren>
        </Match>
      </Switch>
    </SpoilerWrapper>
  );
}
