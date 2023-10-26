export interface IIconProps {
  onClick?: (e: MouseEvent) => void;
  classList?: { [x: string]: boolean | undefined };
}

export const ChevronUpIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18 14L10 6L2 14" stroke="white" stroke-width="1.2" />
  </svg>
);

export const EditIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="22"
    viewBox="0 0 20 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      id="Vector"
      d="M1.20898 21H18.7914M5.76762 16.4489L15.7137 6.50276C16.9726 5.24393 16.9726 3.20296 15.7137 1.94412C14.4549 0.685292 12.4139 0.685292 11.1551 1.94412L1.20898 11.8902L1.20912 16.4489H5.76762Z"
      stroke="white"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export const PlusIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 9.7902H20M10.2098 0L10.2098 20" stroke="white" />
  </svg>
);

export const PowerIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.0051 0V9.99854M16.5418 4.63932C17.8351 5.89793 18.7158 7.50135 19.0725 9.24684C19.4291 10.9923 19.2458 12.8015 18.5456 14.4456C17.8454 16.0898 16.6598 17.495 15.1387 18.4837C13.6176 19.4723 11.8293 20 10 20C8.17065 20 6.38238 19.4723 4.86129 18.4837C3.3402 17.495 2.15461 16.0898 1.45441 14.4456C0.754208 12.8015 0.570851 10.9923 0.927519 9.24684C1.28419 7.50135 2.16486 5.89793 3.4582 4.63932"
      stroke="white"
      stroke-width="1.5"
    />
  </svg>
);

export const ReceiveIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="20"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9 1L1 9M1 9L6.33333 9M1 9L1 3.66667" stroke="white" stroke-width="1.5" />
  </svg>
);

export const SendIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="20"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1 9L9 1M9 1H3.66667M9 1V6.33333" stroke="white" stroke-width="1.5" />
  </svg>
);

export const UnlinkIcon = (props: IIconProps) => (
  <svg
    onClick={props.onClick}
    classList={props.classList}
    width="20"
    height="21"
    viewBox="0 0 17 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      id="Vector"
      d="M6.83333 10.0242C6.95133 10.2174 7.09142 10.4003 7.2535 10.569C8.25975 11.6162 9.7935 11.78 10.9647 11.0602C11.1817 10.9268 11.3862 10.7631 11.5727 10.569L14.2722 7.7595C15.4648 6.5182 15.4648 4.50563 14.2722 3.26432C13.0794 2.023 11.1457 2.02301 9.95292 3.26432L9.35833 3.88315M7.64192 14.1167L7.04708 14.7357C5.85438 15.977 3.92059 15.977 2.72788 14.7357C1.53515 13.4943 1.53515 11.4818 2.72788 10.2405L5.42739 7.431C6.62011 6.18967 8.55392 6.18967 9.74658 7.431C9.90867 7.59958 10.0487 7.7825 10.1667 7.97567M16 12.3333H14.2676M11.8333 16.5V14.7676M1 5.66667H2.73241M5.16667 1.5V3.23241"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
);
