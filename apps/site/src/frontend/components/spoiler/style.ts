import { styled } from "solid-styled-components";
import { COLOR_GRAY_140 } from "../../ui-kit";

export const SpoilerWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-flow: column nowrap;
  align-items: flex-start;

  border-top: 1px solid ${COLOR_GRAY_140};
`;

export const SpoilerHeader = styled.div`
  display: flex;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-right: 20px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  cursor: pointer;
`;

export const SpoilerIcon = styled.img``;

export const SpoilerChildren = styled.div<{ last?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;

  padding-bottom: ${(props) => (props.last ? "0" : "40px")};
`;
