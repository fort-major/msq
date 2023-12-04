import { css, styled } from "solid-styled-components";
import {
  ANIM_DURATION,
  COLOR_BLACK,
  COLOR_CHARTREUSE,
  COLOR_GRAY_108,
  COLOR_GRAY_110,
  COLOR_GRAY_115,
  COLOR_GRAY_120,
  COLOR_GRAY_125,
  COLOR_WHITE,
} from ".";
import { Show } from "solid-js";
import { EIconKind, Icon } from "./icon";
import { eventHandler } from "../utils";

export enum EButtonKind {
  Primary,
  Additional,
  Secondary,
}

interface IButtonProps {
  label: string;
  text?: string | undefined;
  icon?: EIconKind | undefined;
  iconOnlySize?: number | undefined;
  kind: EButtonKind;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  fullWidth?: boolean | undefined;
  classList?: { [k: string]: boolean | undefined } | undefined;
}

export function Button(props: IButtonProps) {
  const handleClick = eventHandler((e: MouseEvent) => {
    props.onClick?.();
  });

  return (
    <BtnBase
      fullWidth={props.fullWidth}
      disabled={props.disabled}
      iconOnlySize={props.iconOnlySize}
      classList={{
        [BtnPrimary]: props.kind === EButtonKind.Primary,
        [BtnSecondary]: props.kind === EButtonKind.Secondary,
        [BtnAdditional]: props.kind === EButtonKind.Additional,
        ...props.classList,
      }}
      onClick={handleClick}
      aria-label={props.label}
    >
      <Show when={props.text !== undefined}>
        <p>{props.text!}</p>
      </Show>
      <Show when={props.icon !== undefined}>
        <Icon kind={props.icon!} />
      </Show>
    </BtnBase>
  );
}

const BtnBase = styled.button<{ fullWidth?: boolean | undefined; iconOnlySize?: number | undefined }>`
  display: inline-flex;

  ${(props) =>
    props.iconOnlySize
      ? `height: ${props.iconOnlySize}px; width: ${props.iconOnlySize}px;`
      : `height: 50px; padding: 10px 25px;`}

  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  ${(props) => (props.fullWidth ? "flex: 1 0 0;" : "")}

  border-radius: 100px;
  border: none;

  cursor: pointer;

  transition: background-color ${ANIM_DURATION} ease-out;

  & > p {
    font-family: DM Sans;
    font-size: 16px;
    font-style: normal;
    line-height: 100%;
    font-weight: 600;

    transition: color ${ANIM_DURATION} ease-out;
  }

  & > .loader {
    width: 15px;
    height: 15px;
  }

  & > svg {
    width: 15px;
    height: 15px;

    & > path {
      transition: stroke ${ANIM_DURATION} ease-out;
    }

    & > circle {
      transition: fill ${ANIM_DURATION} ease-out;
    }
  }

  &:disabled {
    cursor: default;
  }
`;

const BtnPrimary = css`
  background-color: ${COLOR_CHARTREUSE};

  & > p {
    color: ${COLOR_BLACK};
  }

  & > svg path {
    stroke: ${COLOR_BLACK};
  }

  & > svg circle {
    fill: ${COLOR_BLACK};
  }

  & > .loader {
    &::before,
    &::after {
      background-color: ${COLOR_BLACK};
    }
  }

  &:hover {
    background-color: ${COLOR_GRAY_110};

    & > p {
      color: ${COLOR_CHARTREUSE};
    }

    & > svg path {
      stroke: ${COLOR_CHARTREUSE};
    }

    & > svg circle {
      fill: ${COLOR_CHARTREUSE};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_CHARTREUSE};
      }
    }
  }

  &:disabled {
    background-color: ${COLOR_GRAY_108};

    & > p {
      color: ${COLOR_GRAY_115};
    }

    & > svg path {
      stroke: ${COLOR_GRAY_115};
    }

    & > svg circle {
      fill: ${COLOR_GRAY_115};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_GRAY_115};
      }
    }
  }
`;

const BtnSecondary = css`
  background-color: ${COLOR_WHITE};

  & > p {
    color: ${COLOR_BLACK};
  }

  & > svg path {
    stroke: ${COLOR_BLACK};
  }

  & > svg circle {
    fill: ${COLOR_BLACK};
  }

  & > .loader {
    &::before,
    &::after {
      background-color: ${COLOR_BLACK};
    }
  }

  &:hover {
    background-color: ${COLOR_GRAY_110};

    & > p {
      color: ${COLOR_WHITE};
    }

    & > svg path {
      stroke: ${COLOR_WHITE};
    }

    & > svg circle {
      fill: ${COLOR_WHITE};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_WHITE};
      }
    }
  }

  &:disabled {
    background-color: ${COLOR_GRAY_125};

    & > p {
      color: ${COLOR_GRAY_120};
    }

    & > svg path {
      stroke: ${COLOR_GRAY_120};
    }

    & > svg circle {
      fill: ${COLOR_GRAY_120};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_GRAY_120};
      }
    }
  }
`;

const BtnAdditional = css`
  background-color: ${COLOR_GRAY_120};

  & > p {
    font-weight: 400;
    color: ${COLOR_WHITE};
  }

  & > svg path {
    stroke: ${COLOR_WHITE};
  }

  & > svg circle {
    fill: ${COLOR_WHITE};
  }

  & > .loader {
    &::before,
    &::after {
      background-color: ${COLOR_WHITE};
    }
  }

  &:hover {
    background-color: ${COLOR_GRAY_110};

    & > p {
      color: ${COLOR_WHITE};
    }

    & > svg path {
      stroke: ${COLOR_WHITE};
    }

    & > svg circle {
      fill: ${COLOR_WHITE};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_WHITE};
      }
    }
  }

  &:disabled {
    background-color: ${COLOR_GRAY_108};

    & > p {
      color: ${COLOR_GRAY_115};
    }

    & > svg path {
      stroke: ${COLOR_GRAY_115};
    }

    & > svg circle {
      fill: ${COLOR_GRAY_115};
    }

    & > .loader {
      &::before,
      &::after {
        background-color: ${COLOR_GRAY_115};
      }
    }
  }
`;
