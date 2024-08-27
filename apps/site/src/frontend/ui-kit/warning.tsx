import { COLOR_BLACK, COLOR_GRAY_105 } from ".";
import { Block } from "../components/markup";
import { IChildren } from "../utils";
import { EIconKind, Icon } from "./icon";

export interface IWarningProps extends IChildren {
  iconBgColor?: string;
}

export const Warning = (props: IWarningProps) => {
  return (
    <Block gap="15px" p="15px" bg={COLOR_GRAY_105} rounded="25px" items="center">
      <Block rounded="100%" w="40px" h="40px" bg={props.iconBgColor} items="center" content="center">
        <Icon size={24} kind={EIconKind.AlertCircle} color={COLOR_BLACK} />
      </Block>
      {props.children}
    </Block>
  );
};
