import { styled } from "solid-styled-components";
import { BLINK_ANIMATION, COLOR_ACCENT, COLOR_BG, COLOR_GRAY } from "../../styles";

export const AccountCardWrapper = styled.div`
  display: flex;
  padding: 25px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 25px;
  flex: 1 0 0;

  border-radius: 25px;
  border: 1px solid #2f2f38;
  box-sizing: border-box;

  max-width: 430px;
`;

export const AccountCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 5px;
  align-self: stretch;
`;

export const AccountCardFooter = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

export const AccountCardHeaderNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: stretch;

  cursor: pointer;

  & > svg {
    width: 11.429px;
    height: 13px;
  }
`;

export const AccountCardHeaderNameInput = styled.input`
  background-color: ${COLOR_GRAY};
  border: none;
  padding: 5px;
  border-radius: 3px;

  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;

export const AccountCardHeaderName = styled.div`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;

  ${BLINK_ANIMATION};
`;

export const AccountCardHeaderPrincipal = styled.p`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;

  overflow: hidden;
  color: #fff;

  text-overflow: ellipsis;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 14.4px */

  opacity: 0.3;

  ${BLINK_ANIMATION};
`;

export const AccountCardDivider = styled.div`
  width: 40px;
  height: 3px;

  background-color: ${COLOR_ACCENT};
`;

export const AccountCardFooterContent = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  align-self: stretch;
`;

export const AccountCardFooterBalance = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex: 1 0 0;
`;

export const AccountCardFooterBalanceQty = styled.p`
  color: #fff;

  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 36px */
  letter-spacing: -0.72px;
`;

export const AccountCardFooterBalanceSymbol = styled.p`
  color: #fff;

  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 12px */
  letter-spacing: -0.24px;
`;

export const AccountCardFooterButtons = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

export const AccountCardSendBtn = styled.button`
  display: flex;
  width: 40px;
  height: 40px;
  padding: 10px 15px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100px;
  border: 1px solid transparent;
  background: ${COLOR_ACCENT};

  cursor: pointer;

  box-sizing: border-box;

  transition:
    background-color 0.5s,
    border 0.5s;

  &:hover {
    background-color: transparent;
    border: 1px solid ${COLOR_ACCENT};

    & > svg > path {
      stroke: ${COLOR_ACCENT};
    }
  }

  & > svg > path {
    stroke: ${COLOR_BG};

    transition: stroke 0.5s;
  }
`;

export const AccountCardReceiveBtn = styled.button`
  display: flex;
  width: 40px;
  height: 40px;
  padding: 10px 15px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100px;
  border: 1px solid #fff;
  background-color: transparent;

  cursor: pointer;

  transition:
    background-color 0.5s,
    border 0.5s;

  &:hover {
    border: 1px solid ${COLOR_ACCENT};

    & > svg > path {
      stroke: ${COLOR_ACCENT};
    }
  }

  & > svg > path {
    transition: stroke 0.5s;
  }
`;
