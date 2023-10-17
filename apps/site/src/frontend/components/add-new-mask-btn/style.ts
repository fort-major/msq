import { styled } from "solid-styled-components";
import { COLOR_GRAY } from "../../styles";

export const AddNewMaskBtnWrapper = styled.div`
  display: flex;
  padding-right: 0px;
  align-items: center;
  gap: 15px;
  align-self: stretch;

  cursor: pointer;

  &:hover {
    background-color: ${COLOR_GRAY};
    border-top-left-radius: 30px;
    border-bottom-left-radius: 30px;
  }
`;

export const AddNewMaskBtnIconWrapper = styled.div`
  display: flex;
  width: 60px;
  height: 60px;
  padding: 15px 0px;
  justify-content: center;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;

  border-radius: 100px;
  border: 1px dashed #fff;
`;

export const AddNewMaskBtnText = styled.p`
  flex: 1 0 0;

  color: #fff;
  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;