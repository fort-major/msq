import { styled } from "solid-styled-components";

export const COLOR_PINK = "#c47cbc";
export const COLOR_PINK_BG = "#FAF2F9";
export const COLOR_GRAY = "rgba(0, 0, 0, 0.5)";
export const FONT_HEADER = "DynaPuff, sans-serif";

export const Header = styled.header`
  position: relative;

  width: 100%;
  height: 50px;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;

  padding: 0 20px;
  box-sizing: border-box;

  border-bottom: 1px solid ${COLOR_PINK};
`;

export const Logo = styled.h1`
  font-family: ${FONT_HEADER};
  font-size: 20px;
  color: ${COLOR_PINK};
`;

export const LoginButton = styled.button`
  background-color: transparent;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  border: none;

  cursor: pointer;

  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;

  & > img {
    width: 20px;
    height: 20px;
  }
`;

export const ProfileWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;

  gap: 10px;

  & > img {
    width: 30px;
    height: 30px;

    border-radius: 100%;
  }

  & > p {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
  }
`;

export const Body = styled.main`
  width: 100%;
  padding: 20px 20px;

  box-sizing: border-box;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;

  gap: 40px;
`;

export const BodyHeading = styled.h2`
  font-family: ${FONT_HEADER};
  font-size: 40px;
  text-align: center;
  color: ${COLOR_PINK};

  width: 600px;
`;
