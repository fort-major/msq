import { css, styled } from "solid-styled-components";

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

export const SpoilerIcon = styled.img``;

export const SpoilerChildren = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;
