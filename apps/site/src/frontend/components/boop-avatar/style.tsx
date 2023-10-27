import { styled } from "solid-styled-components";

export const BoopAvatarWrapper = styled.div<{ size: number }>`
  position: relative;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;

  border-radius: 100%;
  overflow: hidden;
`;
