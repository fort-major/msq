import { Match, Switch } from "solid-js";
import { COLOR_BLACK, COLOR_WHITE } from ".";
import { IChildren, eventHandler } from "../utils";
import { keyframes, styled } from "solid-styled-components";

export enum EIconKind {
  ArrowRightUp,
  ArrowLeftDown,
  Unlink,
  PowerOff,
  ChevronUp,
  Edit,
  Chat,
  Plus,
  Warning,
  Copy,
  Close,
  Loader,
  Login,
}

interface IIconProps {
  kind: EIconKind;
  size?: number | undefined;
  color?: string | undefined;
  rotation?: number | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  classList?: { [k: string]: boolean | undefined } | undefined;
}

const DEFAULT_SIZE = 16;

function Svg(
  props: Omit<IIconProps, "onClick"> &
    IChildren & { viewBox: string; pointer: boolean; handleClick: (e: MouseEvent) => void },
) {
  return (
    <svg
      style={{ transform: `rotate(${props.rotation || 0}deg)`, cursor: props.pointer ? "pointer" : "inherit" }}
      width={props.size || DEFAULT_SIZE}
      height={props.size || DEFAULT_SIZE}
      classList={props.classList}
      fill="none"
      viewBox={props.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      onClick={props.handleClick}
    >
      {props.children}
    </svg>
  );
}

export function Icon(props: IIconProps) {
  const handleClick = eventHandler((e: MouseEvent) => {
    if (props.disabled) return;

    props.onClick?.();
  });

  return (
    <Switch>
      <Match when={props.kind === EIconKind.ArrowRightUp}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 15 15">
          <path
            d="M4.66667 2.5L12.5 2.58266M12.5 2.58266V10.5992M12.5 2.58266L2.5 12.5"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.ArrowLeftDown}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 15 15">
          <path
            d="M10.3333 12.5L2.5 12.4173M2.5 12.4173L2.5 4.40084M2.5 12.4173L12.5 2.5"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Unlink}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 17 17">
          <path
            d="M6.94444 9.45589C7.05458 9.63626 7.18532 9.80698 7.3366 9.9644C8.27577 10.9418 9.70727 11.0947 10.8004 10.4228C11.0029 10.2983 11.1938 10.1455 11.3678 9.9644L13.8874 7.3422C15.0005 6.18365 15.0005 4.30526 13.8874 3.1467C12.7741 1.98813 10.9693 1.98814 9.85606 3.1467L9.30111 3.72427M7.69912 13.2756L7.14394 13.8533C6.03076 15.0119 4.22589 15.0119 3.11268 13.8533C1.99947 12.6947 1.99947 10.8164 3.11268 9.6578L5.63223 7.0356C6.74543 5.87703 8.55032 5.87702 9.66348 7.0356C9.81476 7.19294 9.94542 7.36367 10.0556 7.54396M15.5 11.6111H13.8831M11.6111 15.5V13.8831M1.5 5.38889H3.11691M5.38889 1.5V3.11691"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.PowerOff}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 17 17">
          <path
            d="M8.50385 1V8.4989M13.4064 4.47949C14.3764 5.42345 15.0369 6.62601 15.3044 7.93513C15.5719 9.24425 15.4343 10.6011 14.9092 11.8342C14.384 13.0673 13.4948 14.1212 12.354 14.8627C11.2132 15.6042 9.87201 16 8.5 16C7.12799 16 5.78678 15.6042 4.64597 14.8627C3.50515 14.1212 2.61595 13.0673 2.09081 11.8342C1.56566 10.6011 1.42814 9.24425 1.69564 7.93513C1.96314 6.62601 2.62365 5.42345 3.59365 4.47949"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.ChevronUp}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 20 20">
          <path d="M18 14L10 6L2 14" stroke={props.color || COLOR_WHITE} stroke-width="1.2" />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Edit}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 20 22">
          <path
            d="M1.20898 21H18.7914M5.76762 16.4489L15.7137 6.50276C16.9726 5.24393 16.9726 3.20296 15.7137 1.94412C14.4549 0.685292 12.4139 0.685292 11.1551 1.94412L1.20898 11.8902L1.20912 16.4489H5.76762Z"
            stroke={props.color || COLOR_WHITE}
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Chat}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 26 26">
          <path
            d="M5.88752 12.0746C5.81333 11.5939 5.77483 11.1014 5.77483 10.6C5.77483 5.29807 10.0785 1 15.3874 1C20.6963 1 25 5.29807 25 10.6C25 11.7977 24.7804 12.9441 24.3792 14.0014C24.2959 14.221 24.2542 14.3308 24.2353 14.4165C24.2165 14.5014 24.2093 14.5612 24.2073 14.6481C24.2052 14.7359 24.217 14.8326 24.2407 15.026L24.7213 18.9502C24.7733 19.375 24.7993 19.5874 24.729 19.7419C24.6674 19.8772 24.5581 19.9846 24.4221 20.0434C24.2669 20.1105 24.0563 20.0795 23.635 20.0174L19.8327 19.4571C19.6341 19.4278 19.5349 19.4132 19.4445 19.4137C19.355 19.4142 19.2931 19.4209 19.2056 19.4394C19.1171 19.4581 19.0041 19.5006 18.778 19.5857C17.7236 19.9828 16.5809 20.2 15.3874 20.2C14.8882 20.2 14.3979 20.162 13.9192 20.0887M7.72253 25C11.2618 25 14.1309 22.0451 14.1309 18.4C14.1309 14.7549 11.2618 11.8 7.72253 11.8C4.18327 11.8 1.31414 14.7549 1.31414 18.4C1.31414 19.1327 1.43007 19.8375 1.64407 20.4961C1.73453 20.7745 1.77976 20.9136 1.79461 21.0087C1.8101 21.108 1.81282 21.1637 1.80705 21.2641C1.80152 21.3602 1.77761 21.4688 1.72977 21.686L1 25L4.57495 24.5092C4.77008 24.4824 4.86765 24.469 4.95285 24.4696C5.04255 24.4702 5.09017 24.4751 5.17815 24.4927C5.2617 24.5095 5.38592 24.5535 5.63434 24.6417C6.28888 24.8739 6.99141 25 7.72253 25Z"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Plus}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 20 20">
          <path d="M0 9.7902H20M10.2098 0L10.2098 20" stroke={props.color || COLOR_WHITE} />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Warning}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 18 16">
          <path
            d="M9.00036 6.05761V9.16801M9.00036 12.2784H9.00814M7.92364 2.08542L1.52797 13.1325C1.17323 13.7452 0.995855 14.0516 1.02207 14.303C1.04494 14.5224 1.15984 14.7217 1.33819 14.8513C1.54267 15 1.89668 15 2.6047 15H15.396C16.104 15 16.4581 15 16.6625 14.8513C16.8409 14.7217 16.9558 14.5224 16.9787 14.303C17.0049 14.0516 16.8275 13.7452 16.4728 13.1325L10.0771 2.08542C9.72362 1.47488 9.54688 1.1696 9.3163 1.06708C9.11517 0.977641 8.88556 0.977641 8.68443 1.06708C8.45384 1.1696 8.27711 1.47488 7.92364 2.08542Z"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Copy}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 16 16">
          <path
            d="M5.2 5.2V3.24C5.2 2.45593 5.2 2.06389 5.35259 1.76441C5.48681 1.50099 5.70099 1.28681 5.96441 1.15259C6.26389 1 6.65593 1 7.44 1H12.76C13.5441 1 13.9361 1 14.2356 1.15259C14.499 1.28681 14.7132 1.50099 14.8474 1.76441C15 2.06389 15 2.45593 15 3.24V8.56C15 9.34407 15 9.73611 14.8474 10.0356C14.7132 10.299 14.499 10.5132 14.2356 10.6474C13.9361 10.8 13.5441 10.8 12.76 10.8H10.8M3.24 15H8.56C9.34407 15 9.73611 15 10.0356 14.8474C10.299 14.7132 10.5132 14.499 10.6474 14.2356C10.8 13.9361 10.8 13.5441 10.8 12.76V7.44C10.8 6.65593 10.8 6.26389 10.6474 5.96441C10.5132 5.70099 10.299 5.48681 10.0356 5.35259C9.73611 5.2 9.34407 5.2 8.56 5.2H3.24C2.45593 5.2 2.06389 5.2 1.76441 5.35259C1.50099 5.48681 1.28681 5.70099 1.15259 5.96441C1 6.26389 1 6.65593 1 7.44V12.76C1 13.5441 1 13.9361 1.15259 14.2356C1.28681 14.499 1.50099 14.7132 1.76441 14.8474C2.06389 15 2.45593 15 3.24 15Z"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Close}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 17 17">
          <path
            d="M16 1L8.5 8.5M8.5 8.5L1 16M8.5 8.5L1 1M8.5 8.5L16 16"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Loader}>
        <Loader class="loader" {...props} />
      </Match>
      <Match when={props.kind === EIconKind.Login}>
        <span class="loader"></span>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 18 18">
          <path
            d="M11.5 1.5H12.5C13.9001 1.5 14.6002 1.5 15.135 1.77248C15.6054 2.01217 15.9878 2.39462 16.2275 2.86502C16.5 3.3998 16.5 4.09987 16.5 5.5V12.5C16.5 13.9001 16.5 14.6002 16.2275 15.135C15.9878 15.6054 15.6054 15.9878 15.135 16.2275C14.6002 16.5 13.9001 16.5 12.5 16.5H11.5M7.33333 4.83333L11.5 9M11.5 9L7.33333 13.1667M11.5 9L1.5 9"
            stroke={props.color || COLOR_WHITE}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
    </Switch>
  );
}

const AnimLoader = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

const Loader = styled.span<{ size?: number | undefined; color?: string | undefined }>`
  width: ${(props) => props.size || DEFAULT_SIZE}px;
  height: ${(props) => props.size || DEFAULT_SIZE}px;
  display: inline-block;
  position: relative;

  &::after,
  &::before {
    content: "";
    box-sizing: border-box;
    width: ${(props) => props.size || DEFAULT_SIZE}px;
    height: ${(props) => props.size || DEFAULT_SIZE}px;
    border-radius: 50%;
    background: ${(props) => props.color || COLOR_WHITE};
    position: absolute;
    left: 0;
    top: 0;
    animation: ${AnimLoader} 2s linear infinite;
  }
  &::after {
    animation-delay: -1s;
  }
`;
