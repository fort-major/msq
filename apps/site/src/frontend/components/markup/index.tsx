import { styled } from "solid-styled-components";

export const Block = styled.div<{
  inline?: boolean;
  p?: string;
  w?: string;
  h?: string;
  rounded?: string;
  flow?: string;
  gap?: string;
  items?: string;
  content?: string;
  bg?: string;
  pointer?: boolean;
}>`
  position: relative;
  display: ${(props) => (props.inline ? "inline-flex" : "flex")};
  align-items: ${(props) => props.items ?? "flex-start"};
  justify-content: ${(props) => props.content ?? "flex-start"};
  flex-flow: ${(props) => props.flow ?? "row"};
  gap: ${(props) => props.gap ?? "20px"};
  padding: ${(props) => props.p ?? "0"};
  border-radius: ${(props) => props.rounded ?? "0"};
  background: ${(props) => props.bg ?? ""};
  width: ${(props) => props.w ?? ""};
  height: ${(props) => props.h ?? ""};
  ${(props) => (props.pointer ? "cursor: pointer;" : "")};
`;

export const Img = styled.img<{ w?: string; h?: string; rounded?: boolean }>`
  position: relative;
  width: ${(props) => props.w ?? "100%"};
  width: ${(props) => props.w ?? "100%"};
  border-radius: ${(props) => (props.rounded ? "100%" : "0")};
`;
