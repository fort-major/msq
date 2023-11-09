import { css, styled } from "solid-styled-components";
import { ANIM_DURATION, COLOR_ACCENT, COLOR_GRAY_115 } from "../../../ui-kit";

export const PaymentPageContainer = styled.div`
  width: 100%;
  padding: 60px 20px;

  display: flex;
  flex-flow: column;
  align-items: center;
`;

export const PaymentPageWrapper = styled.div`
  width: 100%;
  max-width: 880px;
`;

export const PaymentPageHeading = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;

  margin-bottom: 40px;
`;

export const PaymentPageContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 25px;
  align-self: stretch;
`;

export const PaymentPageAccountsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

export const PaymentPageAccounts = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 20px;
`;

export const PaymentPageButtons = styled.div`
  display: flex;
  height: 50px;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

export const AccountCardBase = css`
  -webkit-box-shadow: inset 0px 0px 0px 1px ${COLOR_GRAY_115};
  -moz-box-shadow: inset 0px 0px 0px 1px ${COLOR_GRAY_115};
  box-shadow: inset 0px 0px 0px 1px ${COLOR_GRAY_115};

  border: none;
  transition: box-shadow ${ANIM_DURATION} ease-out;

  cursor: pointer;
`;

export const AccountCardSelected = css`
  -webkit-box-shadow: inset 0px 0px 0px 2px ${COLOR_ACCENT};
  -moz-box-shadow: inset 0px 0px 0px 2px ${COLOR_ACCENT};
  box-shadow: inset 0px 0px 0px 2px ${COLOR_ACCENT};
`;
