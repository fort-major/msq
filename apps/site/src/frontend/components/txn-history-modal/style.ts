import { css, styled } from "solid-styled-components";
import { COLOR_GRAY_105 } from "../../ui-kit";

export const TxnHistoryModalWrapper = styled.div`
  position: relative;

  width: 800px;
  align-self: center;
  margin: 0 auto;

  background-color: ${COLOR_GRAY_105};
  padding: 40px;
  gap: 40px;
  border-radius: 25px;

  display: flex;
  flex-flow: column nowrap;
`;

export const TxnHistoryModalHeader = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 10px;
`;

export const TxnHistoryModalContent = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 20px;
`;

export const TxnHistoryEmpty = styled.div`
  display: flex;
  align-self: center;
  text-align: center;
  flex-grow: 1;

  align-items: center;
  justify-content: center;

  height: 100px;
`;

export const TxnHistoryClose = css`
  position: absolute;
  top: 25px;
  right: 25px;
`;
