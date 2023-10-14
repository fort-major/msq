import { styled } from "solid-styled-components";

export const SpoilerWrapper = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
  padding-top: 25px;
  flex-flow: column nowrap;
  align-items: flex-start;
  gap: 25px;

  border-top: 1px solid #fff;
`;

export const SpoilerHeader = styled.div`
  display: flex;
  padding-right: 0px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

export const SpoilerIcon = styled.img`
  display: flex;
  width: 20px;
  height: 20px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const SpoilerChildren = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;
`;
