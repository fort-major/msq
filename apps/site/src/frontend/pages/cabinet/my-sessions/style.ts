import { css, styled } from "solid-styled-components";
import { COLOR_GRAY_140, COLOR_GREEN } from "../../../ui-kit";

export const MySessionsContent = styled.section`
  display: flex;
  width: 100%;
  max-width: 880px;
  flex-direction: column;
  align-items: flex-start;

  margin-top: 40px;
  margin-bottom: 80px;
`;

export const SessionWrapper = styled.div`
  display: flex;
  padding: 25px 0px;
  align-items: center;
  gap: 25px;
  align-self: stretch;

  border-top: 1px solid ${COLOR_GRAY_140};
`;

export const SessionWebsiteWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 1 0 0;
`;

export const SessionWebsiteEllipse = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 100%;
  flex-shrink: 0;
  background-color: ${COLOR_GREEN};
`;

export const SessionWebsiteEllipseWrapper = styled.div`
  display: flex;
  width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

export const SessionWebsiteDataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
`;

export const SessionInfoWrapper = styled.div`
  display: flex;
  padding-right: 0px;
  align-items: center;
  gap: 15px;
  flex: 1 0 0;
`;

export const SessionInfoDataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  flex: 1 0 0;
`;

export const SessionInfoDataPrincipal = css`
  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;
`;
