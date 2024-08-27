import { createSignal, Show } from "solid-js";
import { styled } from "solid-styled-components";
import { EIconKind, Icon } from "./icon";
import { COLOR_BLACK, COLOR_CHARTREUSE, COLOR_WHITE } from ".";
import { Text } from "./typography";
import { eventHandler } from "../utils";

export interface ICheckboxProps {
  label?: string;
  defaultValue?: boolean;
  onChange?: (value: boolean) => void;
}

export const Checkbox = (props: ICheckboxProps) => {
  const [value, setValue] = createSignal(props.defaultValue);

  const handleClick = eventHandler(() => {
    setValue((v) => {
      props.onChange?.(!v);
      return !v;
    });
  });

  return (
    <Wrapper onClick={handleClick}>
      <Box bgColor={value() ? COLOR_CHARTREUSE : undefined} borderColor={value() ? COLOR_CHARTREUSE : COLOR_WHITE}>
        <Show when={value()}>
          <Icon kind={EIconKind.Check} color={COLOR_BLACK} size={16} />
        </Show>
      </Box>
      <Show when={props.label}>
        <Text size={16} weight={600}>
          {props.label}
        </Text>
      </Show>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 10px;
  align-items: center;
  cursor: pointer;
`;

const Box = styled.div<{ bgColor?: string; borderColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background-color: ${(props) => props.bgColor ?? "transparent"};
  border: 1px solid ${(props) => props.borderColor ?? "white"};
`;
