import { styled } from "solid-styled-components";
import { COLOR_ACCENT, COLOR_GRAY_115, COLOR_WHITE } from "../../ui-kit";
import { createSignal } from "solid-js";
import { eventHandler } from "../../utils";

export interface IToggleProps {
  defaultValue?: boolean;
  onToggle?: (newValue: boolean) => void;
}

export function Toggle(props: IToggleProps) {
  const [enabled, setEnabled] = createSignal(props.defaultValue ?? false);

  const handleClick = () => {
    setEnabled((prev) => {
      const newVal = !prev;
      props.onToggle?.(newVal);

      return newVal;
    });
  };

  return (
    <ToggleBack enabled={enabled()} onClick={eventHandler(handleClick)}>
      <ToggleFront />
    </ToggleBack>
  );
}

const ToggleBack = styled.div<{ enabled: boolean }>`
  width: 32px;
  height: 12px;
  background-color: ${(props) => (props.enabled ? COLOR_ACCENT : COLOR_GRAY_115)};
  border-radius: 100px;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: ${(props) => (props.enabled ? "flex-end" : "flex-start")};
`;

const ToggleFront = styled.div`
  width: 16px;
  height: 16px;
  background-color: ${COLOR_WHITE};
  border-radius: 100px;
`;
