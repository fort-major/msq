import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import { eventHandler } from "../../utils";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Text, WeightSemiBold } from "../../ui-kit/typography";

export interface IAddNewMaskBtnProps {
  onClick: () => void;
  loading: boolean;
}

export function AddNewMaskBtn(props: IAddNewMaskBtnProps) {
  const handleClick = eventHandler(() => {
    if (props.loading) return;

    props.onClick?.();
  });

  return (
    <AddNewMaskBtnWrapper classList={{ loading: props.loading }} onClick={handleClick}>
      <AddNewMaskBtnIconWrapper>
        <Icon kind={props.loading ? EIconKind.Loader : EIconKind.Plus} />
      </AddNewMaskBtnIconWrapper>
      <Text size={16} weight={600} class={AddNewMaskBtnText}>
        Add New Mask
      </Text>
    </AddNewMaskBtnWrapper>
  );
}
