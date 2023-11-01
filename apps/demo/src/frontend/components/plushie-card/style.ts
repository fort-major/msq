import { styled } from "solid-styled-components";
import { COLOR_GRAY, COLOR_PINK, FONT_HEADER } from "../../pages/index/style";

export const PlushieCardWrapper = styled.div`
  width: 320px;
  padding: 20px;
  box-sizing: border-box;

  position: relative;
  display: flex;
  flex-flow: column nowrap;

  background-color: white;
  border-radius: 20px;
`;

export const CardHeader = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: bold;

  margin: 0;

  margin-bottom: 5px;
`;

export const CardImg = styled.img`
  object-fit: contain;
  padding: 25px 10px;
`;

export const CardDescription = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  font-style: italic;
  color: ${COLOR_GRAY};

  margin: 0;
`;

export const CardControls = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  margin-top: 25px;
`;

export const CardControlsLeft = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 5px;
`;

export const CardControlsPrice = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 24px;
  font-weight: bold;

  margin: 0;

  & > span {
    color: ${COLOR_GRAY};
  }
`;

export const CardControlsInStock = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;

  margin: 0;

  & > span {
    font-weight: lighter;
  }
`;

export const CardControlsRight = styled.div("");

export const BuyBtn = styled.button`
  background-color: ${COLOR_PINK};
  border: 1px solid ${COLOR_PINK};
  border-radius: 15px;

  color: white;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: bold;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  padding: 20px 20px;

  cursor: pointer;

  &:hover {
    border: 1px solid ${COLOR_PINK};
    color: ${COLOR_PINK};
    background-color: transparent;
  }

  &:disabled {
    background-color: ${COLOR_GRAY};
    border: 1px solid ${COLOR_GRAY};
  }
`;

export const QtySelector = styled.div`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 18px;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  padding: 20px;
  box-sizing: border-box;

  width: 132px;
  height: 61px;

  user-select: none;
  -webkit-user-select: none;

  & > span {
    color: ${COLOR_PINK};
    font-family: ${FONT_HEADER};
    font-size: 24px;

    cursor: pointer;
  }

  & > p {
    margin: 0;
  }
`;

export const PayBtn = styled.button`
  margin-top: 10px;

  background-color: ${COLOR_PINK};
  border: 1px solid ${COLOR_PINK};
  border-radius: 15px;

  color: white;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: bold;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;

  padding: 20px 20px;
  width: 100%;
  box-sizing: border-box;

  cursor: pointer;

  &:hover {
    border: 1px solid ${COLOR_PINK};
    color: ${COLOR_PINK};
    background-color: transparent;
  }
`;

export const LogInError = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: ${COLOR_GRAY};

  width: 100%;
  text-align: center;
`;
