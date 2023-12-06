import { styled } from "solid-styled-components";

export const StatsWrapper = styled.section`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  gap: 50px;
  justify-content: center;

  padding: 80px 40px;
`;

export const Stat = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 20px;
`;
