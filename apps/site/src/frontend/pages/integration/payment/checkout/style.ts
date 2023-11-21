import { css, styled } from "solid-styled-components";
import { COLOR_ACCENT, COLOR_BLUE, COLOR_GRAY_110, COLOR_GRAY_130 } from "../../../../ui-kit";

export const CheckoutPageWrapper = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-flow: row;
  justify-content: center;

  padding: 80px 40px;
`;

export const CheckoutPageContent = styled.div`
  display: flex;
  flex-flow: column nowrap;

  width: 100%;
  max-width: 600px;

  gap: 30px;
`;

export const CheckoutForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

export const CheckoutFormInput = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;

export const CheckoutFormInputField = styled.div`
  display: flex;
  padding: 15px 20px 15px 0px;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
  justify-content: space-between;

  border-bottom: 1px solid ${COLOR_GRAY_130};
`;

export const CopyIcon = css`
  &:hover {
    & path {
      stroke: ${COLOR_ACCENT};
    }
  }
`;

export const CheckoutFees = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const CheckoutFeeLine = styled.div`
  display: flex;
  padding: 20px 0px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  border-bottom: 1px solid ${COLOR_GRAY_110};
`;

export const CheckoutFeeLineSum = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
`;

export const CheckoutTotalWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  align-self: stretch;
`;

export const CheckoutTotalInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  flex: 1 0 0;
`;

export const CheckoutTotalSum = styled.div`
  display: flex;
  height: 36px;
  align-items: baseline;
  gap: 5px;
`;

export const CheckoutTotalButtons = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1 0 0;
`;

export const CheckoutResultContent = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  justify-content: center;

  gap: 30px;
`;

export const CheckoutResultSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;

  gap: 10px;
`;

export const CheckoutResultBtn = css`
  width: 100%;
  flex: unset;
`;

export const Elipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;
`;
