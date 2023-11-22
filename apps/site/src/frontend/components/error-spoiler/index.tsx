import { Show, createSignal } from "solid-js";
import { eventHandler, truncateStr } from "../../utils";
import { EIconKind, Icon } from "../../ui-kit/icon";
import { COLOR_GRAY_115, COLOR_GRAY_120 } from "../../ui-kit";
import { Text } from "../../ui-kit/typography";
import { styled } from "solid-styled-components";

const SPOILER_MAX_LENGTH = 300;

export function ErrorSpoiler(props: { defaultText: string }) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [text, setText] = createSignal(truncateStr(props.defaultText, SPOILER_MAX_LENGTH));

  const handleClick = eventHandler(() => {
    if (isOpen()) {
      setText(truncateStr(props.defaultText, SPOILER_MAX_LENGTH));
      setIsOpen(false);
    } else {
      setText(props.defaultText);
      setIsOpen(true);
    }
  });

  return (
    <ErrorSpoilerWrapper>
      <ErrorSpoilerHeading>
        <ErrorSpoilerIconWrapper>
          <Icon kind={EIconKind.Close} size={13} color={COLOR_GRAY_115} />
        </ErrorSpoilerIconWrapper>
        <Text size={16} weight={600}>
          The following error has occurred:
        </Text>
      </ErrorSpoilerHeading>
      <ErrorSpoilerContent>
        <Text size={16} lineHeight={150} color={COLOR_GRAY_120}>
          {text()}
        </Text>
        <Show when={props.defaultText.length > SPOILER_MAX_LENGTH}>
          <ErrorSpoilerShowMoreBtn onClick={handleClick}>
            <Text size={16}>
              <Show when={!isOpen()} fallback="Hide">
                Show more
              </Show>
            </Text>
            <Icon kind={EIconKind.ChevronUp} rotation={isOpen() ? 0 : 180} />
          </ErrorSpoilerShowMoreBtn>
        </Show>
      </ErrorSpoilerContent>
    </ErrorSpoilerWrapper>
  );
}

const ErrorSpoilerWrapper = styled.div`
  display: flex;
  padding: 25px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 15px;
  align-self: stretch;

  border-radius: 25px;
  border: 1px solid ${COLOR_GRAY_115};
`;

const ErrorSpoilerHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  align-self: stretch;
`;

const ErrorSpoilerIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  border-radius: 100%;
  border: 1px solid ${COLOR_GRAY_115};
`;

const ErrorSpoilerContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

const ErrorSpoilerShowMoreBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
`;
