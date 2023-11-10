import { styled } from "solid-styled-components";
import { COLOR_GRAY, COLOR_PINK } from "../../pages/index/style";

export const OrderWrapper = styled.div`
  width: 320px;
  padding: 20px;
  box-sizing: border-box;

  position: relative;
  display: flex;
  flex-flow: column nowrap;

  background-color: white;
  border-radius: 20px;

  gap: 30px;
`;

export const OrderItems = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;

  gap: 15px;
`;

export const OrderItemsImg = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 10px;

  object-fit: contain;
`;

export const OrderItemsText = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

export const OrderItemsTextName = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  font-weight: normal;

  margin: 0;
`;

export const OrderItemsTextQty = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: bold;

  margin: 0;
`;

export const OrderFooter = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;

  justify-content: space-between;
`;

export const OrderFooterTotal = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 30px;
  font-weight: bold;

  & > span {
    color: ${COLOR_GRAY};
  }

  margin: 0;
`;

export const OrderStatus = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 24px;
  font-weight: bold;

  color: ${COLOR_PINK};

  margin: 0;
`;
