import { styled } from "solid-styled-components";

export const LoginHeadingSection = styled.section`
  position: fixed;
  z-index: 9;
  bottom: 80px;
  left: 40px;

  max-width: 600px;
  width: 100%;
`;

export const LoginOptionsWrapper = styled.div`
  position: relative;

  padding-right: 40px;
  padding-bottom: 80px;

  box-sizing: border-box;

  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: flex-end;

  align-self: flex-end;
`;

export const LoginOptionsSection = styled.section`
  max-width: 600px;
  width: 100%;
`;

export const DismissBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;

  background-color: transparent;
  border: none;
  color: #fff;
  opacity: 0.4;

  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  & > img {
    width: 12px;
    transform: rotate(-90deg);
    stroke-width: 1.5px;
  }
`;

export const LoginPageHeader = styled.h3`
  color: #fff;
  font-family: DM Sans;
  font-size: 100px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 90px */

  max-width: 600px;

  margin-top: 50px;
  margin-bottom: 30px;
`;
