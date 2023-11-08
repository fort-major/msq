import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import { eventHandler } from "../../utils";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Span600, Text16 } from "../../ui-kit/typography";

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
      <Text16 class={AddNewMaskBtnText}>
        <Span600>Add New Mask</Span600>
      </Text16>
    </AddNewMaskBtnWrapper>
  );
}
