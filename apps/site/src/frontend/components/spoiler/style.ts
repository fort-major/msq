import { styled } from "solid-styled-components";

export const SpoilerWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: flex-start;

  border-top: 1px solid #fff;
`;

export const SpoilerHeader = styled.div`
  display: flex;
  padding-top: 25px;
  padding-bottom: 25px;
  padding-right: 20px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  cursor: pointer;
`;

export const SpoilerIcon = styled.img`
  display: flex;
  width: 20px;
  height: 20px;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &.closed {
    transform: rotate(180deg);
  }
`;

export const SpoilerChildren = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;
`;
