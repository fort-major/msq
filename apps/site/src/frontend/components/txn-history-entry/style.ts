import { css, styled } from "solid-styled-components";
import { COLOR_ACCENT, COLOR_GRAY_115, COLOR_GRAY_130 } from "../../ui-kit";

export const TxnWrapper = styled.div`
  position: relative;
  width: 100%;
  padding: 25px;
  border: 1px solid ${COLOR_GRAY_115};
  border-radius: 25px;

  display: flex;
  flex-flow: column nowrap;
  gap: 25px;
`;

export const TxnHeader = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 25px;
`;

export const TxnHeaderInfo = styled.div`
  flex-grow: 1;
  display: flex;
  flex-flow: row nowrap;
  gap: 40px;
`;

export const TxnHeaderIdAmount = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  flex-grow: 1;
  gap: 10px;
`;

export const TxnContent = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

export const TxnContentRow = styled.div`
  display: flex;
  gap: 5px;
  flex-flow: column nowrap;
  border-top: 1px solid ${COLOR_GRAY_130};
  padding: 15px 0;
`;

export const TxnContentRowValue = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 20px;
  padding-right: 20px;
`;

export const CopyIcon = css`
  flex-shrink: 0;

  &:hover {
    & path {
      stroke: ${COLOR_ACCENT};
    }
  }
`;
