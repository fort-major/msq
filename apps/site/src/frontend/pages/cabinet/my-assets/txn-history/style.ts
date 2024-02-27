import { styled } from "solid-styled-components";
import { COLOR_ACCENT, COLOR_GRAY_108 } from "../../../../ui-kit";

export const TxnHistoryPageContent = styled.section`
  display: flex;
  width: 100%;
  max-width: 880px;
  flex-flow: column nowrap;
  align-items: stretch;
  gap: 40px;

  justify-content: stretch;
  padding-bottom: 80px;
`;

export const TxnHistoryPageHeader = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 40px;
`;

export const TxnHistoryPageHeaderBack = styled.div`
  display: flex;
  gap: 15px;
  cursor: pointer;
`;

export const TxnHistoryPageHeaderInfo = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 20px;
`;

export const TxnHistoryWallet = styled.div`
  display: flex;
  flex-flow: row nowrap;
  padding: 25px;
  gap: 25px;

  background-color: ${COLOR_GRAY_108};
  border-radius: 25px;
`;

export const TxnHistoryWalletNameId = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 5px;
  flex-grow: 1;
`;

export const TxnHistoryWalletBalance = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 25px;
`;

export const Divider = styled.div`
  width: 3px;
  height: 100%;
  background-color: ${COLOR_ACCENT};
`;

export const Balance = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 5px;
  align-items: flex-end;
`;

export const TxnHistoryPageBody = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 20px;
`;

export const TxnHistoryEmpty = styled.div`
  display: flex;
`;

export const TxnHistoryLoader = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
`;
