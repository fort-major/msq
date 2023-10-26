import { styled } from "solid-styled-components";
import { getClassName } from "../../styles";

export const ContactUsBtnText = styled.span`
  position: relatives;
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;

  width: 0px;
  overflow: hidden;
  text-decoration: none;
  white-space: nowrap;

  transition: width 0.5s;
`;

export const ContactUsBtnWrapper = styled.a`
  position: fixed;
  right: 40px;
  bottom: 40px;

  display: flex;
  width: 50px;
  height: 50px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  gap: 0px;

  border-radius: 100px;
  background: #20212e;
  box-shadow: 2px 2px 15px 0px #313341;
  box-sizing: border-box;

  cursor: pointer;

  transition:
    gap 0.5s,
    width 0.5s;

  &:hover {
    display: inline-flex;
    height: 50px;
    width: 158px;
    padding: 0px 20px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;

    & .${getClassName(ContactUsBtnText)} {
      width: 84px;
    }
  }

  & > svg {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
  }
`;
