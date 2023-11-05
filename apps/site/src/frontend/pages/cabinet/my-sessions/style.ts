import { styled } from "solid-styled-components";
import { COLOR_CHARTREUSE, COLOR_BLACK, COLOR_GREEN, COLOR_GRAY_140 } from "../../../ui-kit";

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

  border-top: 1px solid #fff;
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

export const SessionWebsiteDataSite = styled.h5`
  color: #fff;

  font-family: DM Sans;
  font-size: 24px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 24px */
`;

export const SessionWebsiteDataTimestamp = styled.h6`
  color: ${COLOR_GRAY_140};

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 16px */
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

export const SessionInfoDataPseudonym = styled.p`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
`;

export const SessionInfoDataPrincipal = styled.p`
  overflow: hidden;
  color: #fff;

  text-overflow: ellipsis;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 14.4px */

  opacity: 0.4;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  align-self: stretch;
`;

export const LogoutBtn = styled.div`
  display: flex;
  width: 50px;
  height: 50px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100%;
  background-color: ${COLOR_CHARTREUSE};
  border: 1px solid transparent;

  cursor: pointer;

  transition:
    background-color 0.5s,
    border 0.5s;

  &:hover {
    background-color: transparent;
    border: 1px solid ${COLOR_CHARTREUSE};

    & > svg > path {
      stroke: ${COLOR_CHARTREUSE};
    }
  }

  & > svg {
    width: 18px;
    height: 20px;

    & > path {
      stroke: ${COLOR_BLACK};

      transition: stroke 0.5s;
    }
  }
`;
