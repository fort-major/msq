import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import PlusSvg from "#assets/plus.svg";

export interface IAddNewMaskBtnProps {
  onClick: () => void;
}

export function AddNewMaskBtn(props: IAddNewMaskBtnProps) {
  return (
    <AddNewMaskBtnWrapper onClick={props.onClick}>
      <AddNewMaskBtnIconWrapper>
        <img src={PlusSvg} alt="add" />
      </AddNewMaskBtnIconWrapper>
      <AddNewMaskBtnText>Add New Mask</AddNewMaskBtnText>
    </AddNewMaskBtnWrapper>
  );
}
