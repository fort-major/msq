import { styled } from "solid-styled-components";
import { getClassName } from "../../utils";
import { ANIM_DURATION } from "../../ui-kit";

export const ContactUsBtnText = styled.span`
  position: relative;
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */

  width: 0px;
  overflow: hidden;
  white-space: nowrap;

  transition: width ${ANIM_DURATION} ease-out;
`;

export const ContactUsBtnWrapper = styled.a`
  position: fixed;
  right: 40px;
  bottom: 40px;

  z-index: 10;

  display: flex;
  width: 50px;
  height: 50px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  gap: 0px;

  text-decoration: none !important;

  border-radius: 100px;
  background: #20212e;
  box-shadow: 2px 2px 15px 0px #313341;
  box-sizing: border-box;

  cursor: pointer;

  transition:
    gap ${ANIM_DURATION} ease-out,
    width ${ANIM_DURATION} ease-out;

  &:hover {
    display: inline-flex;
    height: 50px;
    width: 164px;
    padding: 0px 20px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;

    & .${getClassName(ContactUsBtnText)} {
      width: 90px;
    }
  }

  & > svg {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
  }
`;
