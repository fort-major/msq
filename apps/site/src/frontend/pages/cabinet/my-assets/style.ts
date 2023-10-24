import { styled } from "solid-styled-components";
import { COLOR_ACCENT, COLOR_GRAY, COLOR_LIGHTGRAY } from "../../../styles";

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

export const AssetAddAccountBtn = styled.button`
  display: flex;
  padding: 20px 20px 20px 20px;
  align-items: center;
  gap: 20px;
  align-self: stretch;

  border-radius: 25px;
  border: 1px solid ${COLOR_GRAY};
  background-color: transparent;

  cursor: pointer;
`;

export const AssetAddAccountBtnIconWrapper = styled.div`
  display: flex;
  width: 40px;
  height: 40px;
  padding: 15px 0px;
  justify-content: center;
  align-items: center;
  gap: 20px;

  border-radius: 100px;
  border: 1px dashed #fff;
  box-sizing: border-box;
`;

export const AssetAddAccountBtnText = styled.p`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;
`;

export const AddAssetWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 25px;
  align-self: stretch;
`;

export const AddAssetHeader = styled.h5`
  align-self: stretch;

  color: #fff;

  font-family: DM Sans;
  font-size: 40px;
  font-style: normal;
  font-weight: 600;
  line-height: 90%; /* 36px */
`;

export const AddAssetForm = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

export const AddAssetInput = styled.input`
  display: flex;
  height: 60px;
  padding: 0px 25px;
  align-items: center;
  gap: 10px;
  flex: 1 0 0;

  border-radius: 100px;
  border: 1px solid #2f2f38;
  background-color: transparent;

  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 16px */
  letter-spacing: -0.32px;

  &::placeholder {
    color: #53545b;

    font-family: DM Sans;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 100%; /* 16px */
    letter-spacing: -0.32px;
  }
`;

export const AddAssetBtn = styled.button`
  display: flex;
  height: 60px;
  padding: 10px 45px;
  justify-content: center;
  align-items: center;
  gap: 10px;

  border-radius: 100px;
  border: none;
  background-color: ${COLOR_ACCENT};

  font-family: DM Sans;
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 18px */

  cursor: pointer;

  &:disabled {
    background: #6c6d73;
    color: #9d9da1;
  }
`;
