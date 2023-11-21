import { css, styled } from "solid-styled-components";
import {
  BAR_HEIGHT,
  COLOR_BLACK,
  COLOR_GRAY_140,
  COLOR_GRAY_190,
  COLOR_WHITE,
  HEADER_HEIGHT,
} from "../../../../ui-kit";

export const SendPageMixin = css`
  display: flex !important;
  flex-flow: column nowrap;
  flex: 1;
`;

export const SendPopupBg = styled.div`
  flex: 1;
  padding: 80px 40px;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  background-color: ${COLOR_BLACK};
`;

export const SendPopupWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  width: 100%;
  max-width: 600px;
`;

export const SendPopupHeading = styled.h3`
  color: ${COLOR_WHITE};
  font-family: DM Sans;
  font-size: 60px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 54px */
  margin-bottom: 30px;
`;

export const SendPopupBody = styled.div`
  display: flex;
  width: 100%;
  max-width: 600px;
  flex-direction: column;
  align-items: flex-start;
  gap: 30px;
`;

export const StatusText = styled.p`
  color: ${COLOR_WHITE};
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 20px */
`;

export const SubStatusText = styled.p`
  color: ${COLOR_GRAY_190};
  font-family: DM Sans;
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%; /* 20px */
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  height: 50px;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

export const FeeLinesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;

export const FeeLine = styled.div`
  margin-top: 10px;

  display: flex;
  padding: 10px 0px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

export const FeeLineAmount = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

export const FeeLineAmountQty = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 14px */
`;

export const FeeLineAmountSymbol = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 10px */
`;

export const FeeLineReason = styled.p`
  color: ${COLOR_GRAY_140};
  font-family: DM Sans;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%; /* 14px */
`;
