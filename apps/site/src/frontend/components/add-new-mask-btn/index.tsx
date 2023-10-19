import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import PlusSvg from "#assets/plus.svg";
import { assertEventSafe } from "../../utils";

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
        <img src={PlusSvg} alt="add" />
      </AddNewMaskBtnIconWrapper>
      <AddNewMaskBtnText>Add New Mask</AddNewMaskBtnText>
    </AddNewMaskBtnWrapper>
  );
}
