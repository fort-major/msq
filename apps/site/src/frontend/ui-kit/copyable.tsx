import { createSignal, onCleanup, Show } from "solid-js";
import { Block } from "../components/markup";
import { COLOR_GRAY_115, COLOR_WHITE } from ".";
import { Text } from "./typography";
import { EIconKind, Icon } from "./icon";
import { eventHandler } from "../utils";

export interface ICopyableProps {
  text: string;
  before?: string;
  after?: string;
}

export const Copyable = (props: ICopyableProps) => {
  const [state, setState] = createSignal<"idle" | "copied">("idle");
  const [timer, setTimer] = createSignal<NodeJS.Timeout | undefined>();

  const handleClick = eventHandler(async () => {
    if (state() === "copied") return;

    await navigator.clipboard.writeText(props.text);
    setState("copied");

    const t = setTimeout(() => {
      setState("idle");
    }, 3000);

    setTimer(t);
  });

  onCleanup(() => {
    if (timer() === undefined) return;
    clearTimeout(timer());
  });

  return (
    <Block pointer rounded="5px" gap="10px" p="8px 10px" bg={COLOR_GRAY_115} onClick={handleClick}>
      <Text weight={500} size={16} color={COLOR_WHITE}>
        <Show when={props.before}>{props.before} </Show>
        {props.text}
        <Show when={props.after}> {props.after}</Show>
      </Text>
      <Icon kind={state() === "idle" ? EIconKind.Copy : EIconKind.Check} color={COLOR_WHITE} size={14} />
    </Block>
  );
};
