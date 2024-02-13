import { Principal } from "@dfinity/principal";
import { Show, createEffect, createSignal, on } from "solid-js";
import { eventHandler, strToTokens, tokensToStr } from "../utils";
import { debugStringify, unreacheable } from "@fort-major/msq-shared";
import { styled } from "solid-styled-components";
import {
  ANIM_DURATION,
  COLOR_CHARTREUSE,
  COLOR_ERROR_RED,
  COLOR_GRAY_120,
  COLOR_GRAY_150,
  COLOR_GRAY_165,
  COLOR_WHITE,
} from ".";

interface IInputBaseProps {
  label: string;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  autofocus?: boolean | undefined;
  triggerChangeOnInput?: boolean | undefined;
  classList?: { [k: string]: boolean | undefined };
  onErr?: (isErr: boolean) => void;
}

interface IInputGenericArgs<T> {
  defaultValue?: T | undefined;
  onChange?: (newValue: T) => void;
  validate?: (value: T) => string | null;
}

interface IInputTokenArgs {
  symbol: string;
  decimals: number;
}

type TInputKindPrincipal = IInputBaseProps & { KindPrincipal: IInputGenericArgs<Principal> };
type TInputKindTokens = IInputBaseProps & { KindTokens: IInputGenericArgs<bigint> & IInputTokenArgs };
type TInputKindString = IInputBaseProps & { KindString: IInputGenericArgs<string> };

type IInputProps = TInputKindPrincipal | TInputKindTokens | TInputKindString;

interface Control<R> {
  tokens?: (props: TInputKindTokens) => R;
  principal?: (props: TInputKindPrincipal) => R;
  string?: (props: TInputKindString) => R;
}

function inputIsTokens(props: IInputProps): boolean {
  return "KindTokens" in props;
}

function inputIsPrincipal(props: IInputProps): boolean {
  return "KindPrincipal" in props;
}

function inputIsString(props: IInputProps): boolean {
  return "KindString" in props;
}

function matchInputProps<R>(props: IInputProps, control: Control<R>): R | undefined {
  if (inputIsTokens(props)) {
    return control.tokens?.(props as TInputKindTokens);
  } else if (inputIsPrincipal(props)) {
    return control.principal?.(props as TInputKindPrincipal);
  } else if (inputIsString(props)) {
    return control.string?.(props as TInputKindString);
  }

  unreacheable("Invalid props");
}

const VALID_TOKEN_STR = /^[0-9]+\.?[0-9]*$/;
const VALID_PRINCIPAL_STR = /^[a-z0-9\-]+$/;

export function Input(props: IInputProps) {
  const defaultValue = () =>
    matchInputProps(props, {
      principal: (props) => props.KindPrincipal.defaultValue?.toText() || "",
      tokens: (props) =>
        props.KindTokens.defaultValue ? tokensToStr(props.KindTokens.defaultValue, props.KindTokens.decimals) : "",
      string: (props) => props.KindString.defaultValue || "",
    })!;

  const [value, setValue] = createSignal(defaultValue());
  const [error, setError] = createSignal<string | null>(null);
  const [focused, setFocused] = createSignal(false);

  createEffect(
    on(defaultValue, (v) => {
      if (v === value()) return;

      setValue(v);
      handleNewValue(false);
    }),
  );

  const handleChange = eventHandler((e: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => {
    setValue(e.target.value.trim());

    handleNewValue(false);
  });

  const handleInput = eventHandler((e: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => {
    setValue(e.target.value.trim());

    handleNewValue(true);
  });

  const handleNewValue = (onInput: boolean) => {
    matchInputProps(props, {
      principal: (props) => {
        const v = value();

        if (!v) {
          if (props.required) {
            props.onErr?.(true);
            setError("Required field");
          }

          return;
        }

        const m = v.match(VALID_PRINCIPAL_STR);

        if (!m || m.length > 1) {
          props.onErr?.(true);
          setError('Invalid format (use "aaaaa-aa")');
          return;
        }

        try {
          const it = Principal.fromText(value());

          let error = null;

          if (props.KindPrincipal.validate !== undefined) {
            error = props.KindPrincipal.validate(it);
          }

          setError(error);

          props.onErr?.(error !== null);

          if (error === null && props.KindPrincipal.onChange !== undefined) {
            if (!onInput || props.triggerChangeOnInput) props.KindPrincipal.onChange(it);
          }
        } catch (e) {
          props.onErr?.(true);
          console.warn(e);

          const err = (e as object).toString() || debugStringify(e);
          setError(`Invalid input - ${err}`);
          return;
        }
      },
      tokens: (props) => {
        const v = value();

        if (!v) {
          if (props.required) {
            props.onErr?.(true);
            setError("Required field");
          }

          return;
        }

        const m = v.match(VALID_TOKEN_STR);
        if (!m || m.length > 1) {
          props.onErr?.(true);
          setError('Invalid format (use "1234.5678")');

          return;
        }

        try {
          const it = strToTokens(v, props.KindTokens.decimals);

          let error = null;

          if (props.KindTokens.validate !== undefined) {
            error = props.KindTokens.validate(it);
          }

          setError(error);

          props.onErr?.(error !== null);

          if (error === null && props.KindTokens.onChange !== undefined) {
            if (!onInput || props.triggerChangeOnInput) props.KindTokens.onChange(it);
          }
        } catch (e) {
          props.onErr?.(true);
          console.warn(e);

          const err = (e as object).toString() || debugStringify(e);
          setError(`Invalid input - ${err}`);
          return;
        }
      },
      string: (props) => {
        const it = value();

        if (!it) {
          if (props.required) {
            props.onErr?.(true);
            setError("Required field");
          }

          return;
        }

        let error = null;

        if (props.KindString.validate !== undefined) {
          error = props.KindString.validate(it);
        }

        setError(error);

        props.onErr?.(error !== null);

        if (error === null && props.KindString.onChange !== undefined) {
          if (!onInput || props.triggerChangeOnInput) props.KindString.onChange(it);
        }

        return;
      },
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNewValue(false);
      return;
    }
  };

  return (
    <InputWrapper classList={props.classList}>
      <InputLabelWrapper>
        <InputLabel>{props.label}</InputLabel>
        <Show when={props.required}>
          <InputLabelAsterisk error={error() !== null}>*</InputLabelAsterisk>
        </Show>
      </InputLabelWrapper>
      <Show
        when={inputIsTokens(props)}
        fallback={
          <InputCommon
            ref={(it) => (props.autofocus ? setTimeout(() => it.focus(), 1) : {})}
            classList={{ error: error() !== null }}
            value={value()}
            onInput={handleInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleChange}
            disabled={props.disabled}
            placeholder={props.placeholder}
          />
        }
      >
        <InputTokensWrapper disabled={!!props.disabled} classList={{ focused: focused(), error: error() !== null }}>
          <InputTokens
            ref={(it) => (props.autofocus ? setTimeout(() => it.focus(), 1) : {})}
            value={value()}
            onInput={handleInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder}
            disabled={props.disabled}
            onFocus={eventHandler(() => {
              setFocused(true);
            })}
            onBlur={(e) => {
              handleChange(e);
              setFocused(false);
            }}
          />
          <InputTokensSymbol disabled={!!props.disabled}>
            {(props as TInputKindTokens).KindTokens.symbol}
          </InputTokensSymbol>
        </InputTokensWrapper>
      </Show>
      <Show when={error() !== null}>
        <InputError>{error()}</InputError>
      </Show>
    </InputWrapper>
  );
}

const InputWrapper = styled.div`
  position: relative;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
`;

const InputLabelWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 5px;
`;

const InputLabel = styled.p`
  color: ${COLOR_GRAY_165};
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 12px */
`;

const InputLabelAsterisk = styled.p<{ error: boolean }>`
  color: ${(props) => (props.error ? COLOR_ERROR_RED : COLOR_CHARTREUSE)};
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 12px */
`;

const InputCommon = styled.input`
  position: relative;
  width: 100%;

  background-color: transparent;
  border: none;
  border-bottom: 1px solid ${COLOR_GRAY_150};

  transition: border-bottom ${ANIM_DURATION} ease-out;

  &:focus {
    outline: none;
    border-bottom: 1px solid ${COLOR_WHITE};
  }

  &.error {
    border-bottom: 1px solid ${COLOR_ERROR_RED} !important;
    margin-bottom: 10px;
  }

  display: flex;
  padding: 15px 0px;
  box-sizing: border-box;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;

  color: ${COLOR_WHITE};
  font-family: DM Sans;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%; /* 16px */

  &::placeholder {
    color: ${COLOR_GRAY_120};
    font-family: DM Sans;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 100%; /* 16px */
  }

  &:disabled {
    color: ${COLOR_GRAY_150};
    border-bottom: 1px solid ${COLOR_GRAY_120};
  }
`;

const InputTokensWrapper = styled.div<{ disabled: boolean }>`
  display: flex;
  padding-bottom: 0px;
  justify-content: space-between;
  align-items: baseline;
  align-self: stretch;

  position: relative;
  width: 100%;

  transition: border-bottom ${ANIM_DURATION} ease-out;

  border-bottom: 1px solid ${COLOR_GRAY_150};

  &.focused {
    border-bottom: 1px solid ${COLOR_WHITE};
  }

  &.error {
    border-bottom: 1px solid ${COLOR_ERROR_RED} !important;
    margin-bottom: 10px;
  }

  ${(props) => (props.disabled ? `border-bottom: 1px solid ${COLOR_GRAY_120};` : "")}
`;

const InputTokens = styled.input`
  background-color: transparent;
  border: none;
  padding: 0;
  width: auto;

  color: ${COLOR_WHITE};
  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 36px */

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${COLOR_GRAY_120};
    font-variant-numeric: lining-nums tabular-nums;
    font-family: DM Sans;
    font-size: 36px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%; /* 36px */
  }

  &:disabled {
    color: ${COLOR_GRAY_150};
  }
`;

const InputTokensSymbol = styled.p<{ disabled: boolean }>`
  color: ${COLOR_WHITE};
  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 12px */

  ${(props) => (props.disabled ? `color: ${COLOR_GRAY_150};` : "")}
`;

const InputError = styled.p`
  color: ${COLOR_ERROR_RED};
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 12px */
`;
