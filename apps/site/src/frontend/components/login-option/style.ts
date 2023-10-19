import { styled } from "solid-styled-components";
import { COLOR_GRAY } from "../../styles";

export const LoginOptionWrapper = styled.div<{ editable?: boolean | undefined }>`
  display: flex;
  padding-right: 20px;
  align-items: center;
  gap: 15px;
  align-self: stretch;

  ${(props) =>
    !props.editable
      ? `  
      cursor: pointer;
      &:hover {
        background-color: ${COLOR_GRAY};
        border-bottom-left-radius: 30px;
        border-top-left-radius: 30px;
      }`
      : ""}
`;

export const LoginOptionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  flex: 1 0 0;
`;

export const LoginOptionPseudonym = styled.h4`
  align-self: stretch;
  color: #fff;

  font-family:
    DM Sans,
    sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;

export const LoginOptionPseudonymEdit = styled.input`
  background-color: ${COLOR_GRAY};
  border: none;
  padding: 5px;
  border-radius: 3px;

  align-self: stretch;
  color: #fff;

  font-family:
    DM Sans,
    sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;

export const LoginOptionPrincipal = styled.p`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;

  overflow: hidden;
  color: #fff;
  text-overflow: ellipsis;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 14.4px */

  opacity: 0.4;
`;

export const LoginOptionIcon = styled.img`
  opacity: 0.6;

  cursor: pointer;

  &:hover {
    background-color: ${COLOR_GRAY};
  }
`;
