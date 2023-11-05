import { styled } from "solid-styled-components";
import { COLOR_CHARTREUSE, COLOR_BLACK } from "../../../ui-kit";

export const MyLinksContent = styled.section`
  display: flex;
  width: 100%;
  max-width: 880px;
  flex-direction: column;
  align-items: flex-start;
  gap: 25px;

  margin-top: 40px;
  margin-bottom: 80px;
`;

export const LinksWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;

  border-top: 1px solid #fff;
`;

export const LinksInfoWrapper = styled.div`
  display: flex;
  padding: 15px 0px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  gap: 20px;
`;

export const LinksInfoTextWrapper = styled.div`
  flex-grow: 1;
`;

export const LinksInfoAvatars = styled.div`
  display: flex;
  align-items: center;

  & > div:not(:nth-of-type(1)) {
    margin-left: -30px;
  }
`;

export const UnlinkAllBtn = styled.button`
  display: flex;
  height: 50px;
  padding: 10px 25px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100px;
  border: 1px solid transparent;
  background-color: ${COLOR_CHARTREUSE};
  color: ${COLOR_BLACK};

  cursor: pointer;

  transition:
    background-color 0.5s,
    border 0.5s,
    color 0.5s;

  &:hover {
    background-color: transparent;
    border: 1px solid ${COLOR_CHARTREUSE};
    color: ${COLOR_CHARTREUSE};

    & > svg > path {
      stroke: ${COLOR_CHARTREUSE};
    }
  }

  & > svg {
    height: 15px;
    width: 15px;

    & > path {
      stroke: ${COLOR_BLACK};

      transition: stroke 0.5s;
    }
  }
`;

export const LinksListWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  gap: 10px;
  align-self: stretch;
  flex-wrap: wrap;
`;

export const LinksListItem = styled.div`
  display: flex;
  padding: 8px 8px 8px 20px;
  align-items: center;
  gap: 15px;

  border-radius: 100px;
  border: 1px solid #2f2f38;
`;

export const LinksListItemText = styled.p`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 16px */
`;

export const UnlinkBtn = styled.button`
  display: flex;
  width: 40px;
  height: 40px;
  padding: 10px 15px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100px;
  border: none;
  background: #22232c;

  cursor: pointer;

  &:hover {
    & > svg > path {
      stroke: ${COLOR_CHARTREUSE};
    }
  }

  & > svg {
    flex-shrink: 0;

    width: 15px;
    height: 15px;

    & > path {
      transition: stroke 0.5s;
    }
  }
`;

export const AvatarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  & > div:nth-of-type(2) {
    margin-top: -20px;
  }
`;

export const AvatarCount = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  padding: 10px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;

  box-sizing: border-box;
  position: relative;

  border-radius: 100px;
  background: ${COLOR_CHARTREUSE};
`;

export const AvatarCountText = styled.p`
  color: #000;

  font-family: DM Sans;
  font-size: 8px;
  font-style: normal;
  font-weight: 900;
  line-height: 100%; /* 8px */
`;
