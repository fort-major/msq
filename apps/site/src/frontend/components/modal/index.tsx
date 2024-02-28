import { JSXElement, children, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { styled } from "solid-styled-components";
import { disableScroll, enableScroll, eventHandler } from "../../utils";

export function Modal(props: { children: JSXElement }) {
  const c = children(() => props.children);

  onMount(disableScroll);
  onCleanup(enableScroll);

  return (
    <Portal mount={document.getElementById("portal")!}>
      <ModalBg>{c()}</ModalBg>
    </Portal>
  );
}

const ModalBg = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 11;

  overflow: auto;

  background-color: rgba(10, 10, 20, 0.8);

  display: flex;
`;
