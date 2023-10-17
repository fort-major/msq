import { AddNewMaskBtnIconWrapper, AddNewMaskBtnText, AddNewMaskBtnWrapper } from "./style";
import PlusSvg from "#assets/plus.svg";
import { ErrorCode, err } from "@fort-major/masquerade-shared";

export interface IAddNewMaskBtnProps {
  onClick: () => void;
}

export function AddNewMaskBtn(props: IAddNewMaskBtnProps) {
  const handleClick = (e: MouseEvent) => {
    if (!e.isTrusted) {
      err(ErrorCode.SECURITY_VIOLATION, "No automation is allowed!");
    }

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
