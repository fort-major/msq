import { JSXElement, children } from "solid-js";
import { SpoilerChildren, SpoilerHeader, SpoilerIcon, SpoilerWrapper } from "./style";
import ChevronUpSVG from "#assets/chevron-up.svg";

export interface ISpoilerProps {
  header: JSXElement;
  children: JSXElement;
}

export function Spoiler(props: ISpoilerProps) {
  const c = children(() => props.children);
  const h = children(() => props.header);

  return (
    <SpoilerWrapper>
      <SpoilerHeader>
        {h()}
        <SpoilerIcon src={ChevronUpSVG} alt="show/hide" />
      </SpoilerHeader>
      <SpoilerChildren>{c()}</SpoilerChildren>
    </SpoilerWrapper>
  );
}
