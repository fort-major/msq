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
  ArrowRightWide,
  ArrowLeftLong,
  Check,
  Discord,
  Dots,
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
          <path d="M18 14L10 6L2 14" stroke={props.color || COLOR_WHITE} stroke-width="1" />
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
      <Match when={props.kind === EIconKind.ArrowRightWide}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 17 14">
          <path
            id="Rectangle 25"
            d="M10.1637 1L16.0013 6.96216M16.0013 6.96216L9.96345 13M16.0013 6.96216L1 6.89989"
            stroke={props.color || COLOR_WHITE}
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Check}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 17 13">
          <path d="M0.5 7.5L5 12L16.5 0.5" stroke={props.color || COLOR_WHITE} />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Discord}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 20 14">
          <path
            d="M16.3297 1.16054C15.1458 0.613949 13.8964 0.224167 12.6128 0.000957258C12.6011 -0.00122506 12.5891 0.000345809 12.5784 0.00544641C12.5676 0.010547 12.5588 0.0189178 12.5531 0.0293693C12.3925 0.316539 12.2147 0.691133 12.0902 0.985586C10.6867 0.774217 9.29028 0.774217 7.91551 0.985586C7.79096 0.684604 7.60671 0.316539 7.44547 0.0293693C7.43951 0.0191386 7.43062 0.0109542 7.41996 0.00588542C7.4093 0.000816591 7.39737 -0.000900994 7.38573 0.000957258C6.0815 0.22689 4.83341 0.62265 3.66878 1.16054C3.65865 1.16487 3.6501 1.17225 3.64432 1.18167C1.27696 4.7391 0.628415 8.2091 0.946554 11.6361C0.94798 11.6528 0.957361 11.6688 0.970307 11.6791C2.53222 12.8328 4.04523 13.5332 5.53011 13.9975C5.54165 14.001 5.55398 14.0008 5.56543 13.997C5.57688 13.9932 5.58691 13.986 5.59416 13.9764C5.9454 13.4939 6.25851 12.9852 6.52697 12.4502C6.5428 12.4189 6.52768 12.3817 6.4953 12.3693C5.99865 12.1798 5.52576 11.9487 5.07084 11.6864C5.03485 11.6653 5.03196 11.6135 5.0651 11.5887C5.16109 11.5166 5.25542 11.4422 5.348 11.3657C5.35612 11.3589 5.36595 11.3546 5.37638 11.3532C5.3868 11.3518 5.39742 11.3533 5.40703 11.3576C8.39553 12.7301 11.631 12.7301 14.5842 11.3576C14.5938 11.353 14.6045 11.3513 14.6151 11.3526C14.6257 11.3539 14.6357 11.3581 14.6439 11.3649C14.7366 11.4418 14.8312 11.5164 14.9275 11.5887C14.9606 11.6135 14.9585 11.6652 14.9225 11.6863C14.4676 11.9538 13.9947 12.1798 13.4974 12.3685C13.4897 12.3715 13.4827 12.376 13.477 12.3818C13.4712 12.3877 13.4667 12.3947 13.4637 12.4024C13.4608 12.4101 13.4596 12.4183 13.46 12.4265C13.4605 12.4348 13.4627 12.4428 13.4664 12.4501C13.7407 12.9844 14.0538 13.4931 14.3985 13.9756C14.4129 13.996 14.4388 14.0048 14.4626 13.9974C15.9547 13.5332 17.4677 12.8328 19.0296 11.679C19.0363 11.6741 19.0419 11.6678 19.046 11.6605C19.0501 11.6532 19.0526 11.6451 19.0533 11.6368C19.4341 7.67483 18.4156 4.23328 16.3534 1.18239C16.3484 1.17249 16.34 1.16474 16.3297 1.16054ZM6.97333 9.54938C6.07358 9.54938 5.3322 8.71854 5.3322 7.69815C5.3322 6.67779 6.05918 5.84692 6.97333 5.84692C7.89461 5.84692 8.62882 6.68507 8.61442 7.69815C8.61442 8.71854 7.8874 9.54938 6.97333 9.54938ZM13.041 9.54938C12.1413 9.54938 11.4 8.71854 11.4 7.69815C11.4 6.67779 12.1269 5.84692 13.041 5.84692C13.9624 5.84692 14.6965 6.68507 14.6822 7.69815C14.6822 8.71854 13.9624 9.54938 13.041 9.54938Z"
            // FIXME: dynamic fill color not supported by Button comp at the moment
            fill="#0A0B15"
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.Dots}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 16 16">
          <path
            d="M13.957 2C13.4047 2 12.957 1.55228 12.957 1C12.957 0.447715 13.4047 -6.78525e-08 13.957 -4.37114e-08C14.5093 -1.95703e-08 14.957 0.447715 14.957 1C14.957 1.55228 14.5093 2 13.957 2Z"
            fill={props.color ?? "white"}
          />
          <path
            d="M7.99913 2C7.44684 2 6.99913 1.55228 6.99913 1C6.99913 0.447715 7.44684 -3.28281e-07 7.99913 -3.0414e-07C8.55141 -2.79999e-07 8.99913 0.447715 8.99913 1C8.99913 1.55228 8.55141 2 7.99913 2Z"
            fill={props.color ?? "white"}
          />
          <path
            d="M2.04087 2C1.48859 2 1.04087 1.55228 1.04087 0.999999C1.04087 0.447715 1.48859 -5.88724e-07 2.04087 -5.64583e-07C2.59316 -5.40442e-07 3.04087 0.447715 3.04087 0.999999C3.04087 1.55228 2.59316 2 2.04087 2Z"
            fill={props.color ?? "white"}
          />
        </Svg>
      </Match>
      <Match when={props.kind === EIconKind.ArrowLeftLong}>
        <Svg {...props} pointer={!!props.onClick} handleClick={handleClick} viewBox="0 0 18 16">
          <path
            d="M4.45003 11.9354L0.514718 8.00007M0.514718 8.00007L4.44601 4.06878M0.514718 8.00007L17.4853 8.00007"
            stroke={props.color ?? "white"}
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
