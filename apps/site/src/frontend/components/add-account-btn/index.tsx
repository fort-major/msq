import { styled } from "solid-styled-components";
import { ANIM_DURATION, COLOR_GRAY_105, COLOR_GRAY_115, COLOR_GRAY_130, COLOR_WHITE } from "../../ui-kit";
import { eventHandler, getClassName } from "../../utils";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { Size16, Text, WeightSemiBold } from "../../ui-kit/typography";

interface IAddAccountBtnProps {
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  onClick: () => void;
  symbol: string;
}

export function AddAccountBtn(props: IAddAccountBtnProps) {
  const handleClick = eventHandler(() => props.onClick());

  return (
    <AssetAddAccountBtn disabled={props.disabled} onClick={handleClick}>
      <AssetAddAccountBtnIconWrapper>
        <Icon kind={props.loading ? EIconKind.Loader : EIconKind.Plus} />
      </AssetAddAccountBtnIconWrapper>
      <Text size={16} weight={600}>
        Add New {props.symbol} Account
      </Text>
    </AssetAddAccountBtn>
  );
}

const AssetAddAccountBtnIconWrapper = styled.div`
  display: flex;
  width: 40px;
  height: 40px;
  padding: 15px 0px;
  justify-content: center;
  align-items: center;
  gap: 20px;

  border-radius: 100px;
  border: 1px dashed ${COLOR_WHITE};
  box-sizing: border-box;

  transition:
    border ${ANIM_DURATION} ease-out,
    background-color ${ANIM_DURATION} ease-out;

  & > svg {
    width: 12px;
    height: 12px;

    & > path {
      transition: stroke ${ANIM_DURATION} ease-out;
    }
  }
`;

const AssetAddAccountBtn = styled.button`
  display: flex;
  padding: 20px 20px 20px 20px;
  align-items: center;
  gap: 20px;
  align-self: stretch;

  border-radius: 25px;
  border: 1px solid ${COLOR_GRAY_115};
  background-color: transparent;

  cursor: pointer;

  transition: border ${ANIM_DURATION} ease-out;

  &:hover {
    border: 1px solid transparent;
    background-color: ${COLOR_GRAY_105};

    & .${getClassName(AssetAddAccountBtnIconWrapper)} {
      border: 1px solid transparent;
      background-color: ${COLOR_GRAY_115};
    }
  }

  &:disabled {
    cursor: default;

    border: 1px solid transparent;
    background-color: ${COLOR_GRAY_105};

    & > .${getClassName(AssetAddAccountBtnIconWrapper)} {
      border: 1px solid transparent;
      background-color: ${COLOR_GRAY_115};
    }

    & > p {
      color: ${COLOR_GRAY_130};
    }
  }
`;

const AssetAddAccountBtnText = styled.p`
  color: #fff;

  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 16px */
`;
