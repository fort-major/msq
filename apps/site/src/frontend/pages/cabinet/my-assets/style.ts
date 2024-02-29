import { css, styled } from "solid-styled-components";
import {
  ANIM_DURATION,
  COLOR_CHARTREUSE,
  COLOR_ERROR_RED,
  COLOR_GRAY_115,
  COLOR_GRAY_130,
  COLOR_GRAY_140,
  COLOR_GRAY_150,
  COLOR_GRAY_190,
} from "../../../ui-kit";
import { DefaultColor, DefaultFont } from "../../../ui-kit/typography";

export const MyAssetsPageHeader = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: last baseline;
  justify-content: space-between;
`;

export const MyAssetsShowEmptyToggle = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 13px;
  align-items: center;
`;

export const MyAssetsPageContent = styled.section`
  display: flex;
  width: 100%;
  max-width: 880px;
  flex-direction: column;
  align-items: flex-start;
  gap: 60px;

  margin-top: 40px;
  margin-bottom: 80px;
`;

export const AssetSpoilerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  width: 100%;
  padding-right: 20px;
`;

export const AssetSpoilerContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

export const AssetAccountsWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 20px;
`;

export const AddAssetWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 25px;
  align-self: stretch;
`;

export const AddAssetFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

export const AddAssetForm = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;

  & > button {
    height: auto;
    align-self: stretch;
  }
`;

export const AddAssetInput = styled.input`
  display: flex;
  height: 60px;
  padding: 0px 25px;
  align-items: center;
  gap: 10px;
  flex: 1 0 0;

  border-radius: 100px;
  background-color: transparent;

  ${DefaultColor};
  ${DefaultFont};
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 16px */

  transition: border ${ANIM_DURATION} ease-out;

  border: 1px solid ${COLOR_GRAY_150};

  &:focus {
    outline: none;
    border: 1px solid ${COLOR_GRAY_190};
  }

  &.error {
    border: 1px solid ${COLOR_ERROR_RED} !important;
  }

  &:disabled {
    border: 1px solid ${COLOR_GRAY_115};
    color: ${COLOR_GRAY_130};

    &::placeholder {
      color: ${COLOR_GRAY_115};
    }
  }

  &::placeholder {
    color: ${COLOR_GRAY_140};

    font-family: DM Sans;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 100%; /* 16px */
  }
`;

export const ErrorText = css`
  padding-left: 25px;
`;

export const AssetLogo = styled.img`
  height: 30px;
  width: 30px;
  border-radius: 100%;
`;

export const NameAndLogo = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;
`;
