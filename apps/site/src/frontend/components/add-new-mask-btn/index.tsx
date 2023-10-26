import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import { assertEventSafe } from "../../utils";
import { PlusIcon } from "../typography/icons";

export interface IAddNewMaskBtnProps {
  onClick: () => void;
}

export function AddNewMaskBtn(props: IAddNewMaskBtnProps) {
  const handleClick = (e: MouseEvent) => {
    assertEventSafe(e);

    props.onClick();
  };

  return (
    <AddNewMaskBtnWrapper onClick={handleClick}>
      <AddNewMaskBtnIconWrapper>
        <PlusIcon />
      </AddNewMaskBtnIconWrapper>
      <AddNewMaskBtnText>Add New Mask</AddNewMaskBtnText>
    </AddNewMaskBtnWrapper>
  );
}
