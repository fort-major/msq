import { css, styled } from "solid-styled-components";
import {
  BlinkAnimation,
  COLOR_CHARTREUSE,
  COLOR_BLACK,
  COLOR_GRAY_115,
  ANIM_DURATION,
  COLOR_GRAY_105,
  COLOR_ACCENT,
} from "../../ui-kit";

export const AccountCardWrapper = styled.div<{ fullWidth?: boolean | undefined }>`
  display: flex;
  padding: 25px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 25px;
  flex: 1 0 0;

  border-radius: 25px;
  border: 1px solid ${COLOR_GRAY_115};
  box-sizing: border-box;

  position: relative;
  width: 100%;

  ${(props) => (props.fullWidth ? "" : "max-width: 430px;")}
`;

export const AccountCardHeaderWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 20px;

  align-items: center;
`;

export const AccountCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 5px;
  align-self: stretch;
  flex-grow: 1;
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

  & > svg {
    width: 11.429px;
    height: 13px;
  }

  .editable {
    cursor: pointer;
  }
`;

export const AccountCardInput = css`
  margin-bottom: 10px;
`;

export const AccountCardHeaderName = styled.div`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
`;

export const AccountCardHeaderPrincipal = css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;

  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AccountCardDivider = styled.div`
  width: 40px;
  height: 3px;

  background-color: ${COLOR_CHARTREUSE};
`;

export const AccountCardFooterContent = styled.div`
  display: flex;
  align-items: flex-end;
  align-self: stretch;
`;

export const AccountCardFooterBalanceWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 25px;
  align-self: stretch;

  justify-content: space-between;
  width: 100%;
`;

export const AccountCardCheckIconWrapper = styled.div`
  width: 40px;
  height: 40px;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  border: 1px solid ${COLOR_ACCENT};
  border-radius: 100%;
`;

export const AccountCardFooterBalance = styled.div`
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex: 1 0 0;
`;

export const AccountCardFooterInsufficientBalance = styled.div`
  display: flex;
  padding: 12px 15px 12px 12px;
  align-items: center;
  gap: 10px;

  border-radius: 15px;
  background-color: ${COLOR_GRAY_105};
`;

export const AccountCardFooterBalanceQty = styled.p`
  color: #fff;

  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 36px */
`;

export const AccountCardFooterBalanceSymbol = styled.p`
  color: #fff;

  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 12px */
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
  background: ${COLOR_CHARTREUSE};

  cursor: pointer;

  box-sizing: border-box;

  transition:
    background-color ${ANIM_DURATION} ease-out,
    border ${ANIM_DURATION} ease-out;

  &:hover {
    background-color: transparent;
    border: 1px solid ${COLOR_CHARTREUSE};

    & > svg > path {
      stroke: ${COLOR_CHARTREUSE};
    }
  }

  & > svg > path {
    stroke: ${COLOR_BLACK};

    transition: stroke ${ANIM_DURATION} ease-out;
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
    background-color ${ANIM_DURATION} ease-out,
    border ${ANIM_DURATION} ease-out;

  &:hover {
    border: 1px solid ${COLOR_CHARTREUSE};

    & > svg > path {
      stroke: ${COLOR_CHARTREUSE};
    }
  }

  & > svg > path {
    transition: stroke ${ANIM_DURATION} ease-out;
  }
`;

export const DotsIcon = css`
  padding: 7px 0;
`;
