import { styled } from "solid-styled-components";
import { COLOR_ERROR_RED, COLOR_WHITE } from ".";

export function ErrorPin() {
  return <Pin>!</Pin>;
}

const Pin = styled.span`
  position: absolute;
  top: -7px;
  right: -15px;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  background-color: ${COLOR_ERROR_RED};
  color: ${COLOR_WHITE};
  border-radius: 100%;
  width: 15px;
  height: 15px;
  font-size: 12px;
`;
