import { Principal } from "@dfinity/principal";
import { Show, Switch, createSignal } from "solid-js";
import { assertEventSafe, strToTokens, tokensToStr } from "../utils";
import { unreacheable } from "@fort-major/masquerade-shared";
import { styled } from "solid-styled-components";
import { COLOR_CHARTREUSE, COLOR_ERROR_RED, COLOR_GRAY_120, COLOR_GRAY_150, COLOR_GRAY_165, COLOR_WHITE } from ".";

interface IInputBaseProps {
  label: string;
  required?: boolean | undefined;
  placeholder?: string | undefined;
  autofocus?: boolean | undefined;
  classList?: { [k: string]: boolean | undefined };
  onBlur?: (isErr: boolean) => void;
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

type TInputKindPrincipal = { Principal: IInputGenericArgs<Principal> };
type TInputKindTokens = { Tokens: IInputGenericArgs<bigint> & IInputTokenArgs };
type TInputKindString = { String: IInputGenericArgs<string> };

type TInputKind = TInputKindPrincipal | TInputKindTokens | TInputKindString;

interface IInputProps extends IInputBaseProps {
  kind: TInputKind;
}

const VALID_PRINCIPAL_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-".split("");
const VALID_TOKEN_CHARS = "0123456789.,".split("");

export function Input(props: IInputProps) {
  const defaultValue = () => {
    if (props.kind.hasOwnProperty("Principal")) {
      const v = (props.kind as TInputKindPrincipal).Principal.defaultValue;

      return v ? v.toText() : "";
    }

    if (props.kind.hasOwnProperty("String")) {
      return (props.kind as TInputKindString).String.defaultValue || "";
    }

    if (props.kind.hasOwnProperty("Tokens")) {
      const v = (props.kind as TInputKindTokens).Tokens;

      return v.defaultValue ? tokensToStr(v.defaultValue, v.decimals) : "";
    }

    unreacheable("Invalid input type");
  };

  const [value, setValue] = createSignal(defaultValue());
  const [error, setError] = createSignal<string | null>(null);
  const [focused, setFocused] = createSignal(false);

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => {
    assertEventSafe(e);

    setValue(e.target.value);
  };

  const handleChange = (e: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => {
    assertEventSafe(e);

    setError(null);
    setValue(e.target.value.trim());

    handleNewValue();
  };

  const handleNewValue = () => {
    if (props.kind.hasOwnProperty("Principal")) {
      const kind = props.kind as TInputKindPrincipal;

      let it;
      try {
        it = Principal.fromText(
          value()
            .split("")
            .filter((it) => VALID_PRINCIPAL_CHARS.includes(it))
            .join(""),
        );

        if (kind.Principal.defaultValue && it.toString() == kind.Principal.defaultValue.toText()) return;
      } catch (_) {
        setError("Not a valid principal id");
        return;
      }

      let error = null;

      if (kind.Principal.validate !== undefined) {
        error = kind.Principal.validate(it);
        setError(error);
      }

      if (error === null && kind.Principal.onChange !== undefined) {
        kind.Principal.onChange(it);
      }

      return;
    }

    if (props.kind.hasOwnProperty("String")) {
      const kind = props.kind as TInputKindString;
      const it = value();

      if (kind.String.defaultValue && kind.String.defaultValue == it) return;

      let error = null;

      if (kind.String.validate !== undefined) {
        error = kind.String.validate(it);
        setError(error);
      }

      if (error === null && kind.String.onChange !== undefined) {
        kind.String.onChange(it);
      }

      return;
    }

    if (props.kind.hasOwnProperty("Tokens")) {
      const kind = props.kind as TInputKindTokens;

      let it: bigint;
      try {
        it = strToTokens(
          value()
            .split("")
            .filter((it) => VALID_TOKEN_CHARS.includes(it))
            .join(""),
          kind.Tokens.decimals,
        );

        if (kind.Tokens.defaultValue && kind.Tokens.defaultValue == it) return;

        setValue(tokensToStr(it, kind.Tokens.decimals));
      } catch (e) {
        setError(`Invalid format, use '1234.5678' or '1,234.5678' - ${JSON.stringify(e)}`);
        return;
      }

      let error = null;

      if (kind.Tokens.validate !== undefined) {
        error = kind.Tokens.validate(it);
        setError(error);
      }

      if (error === null && kind.Tokens.onChange !== undefined) {
        kind.Tokens.onChange(it);
      }

      return;
    }

    unreacheable("Invalid input type");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNewValue();
      return;
    }

    if (props.kind.hasOwnProperty("Principal")) {
      if (!VALID_PRINCIPAL_CHARS.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      return;
    }

    if (props.kind.hasOwnProperty("Tokens")) {
      if (!VALID_TOKEN_CHARS.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      return;
    }
  };

  const handleBlur = (e: Event) => {
    assertEventSafe(e);

    handleNewValue();

    props.onBlur?.(error() !== null);
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
        when={props.kind.hasOwnProperty("Tokens")}
        fallback={
          <InputCommon
            ref={(it) => (props.autofocus ? setTimeout(() => it.focus(), 1) : {})}
            classList={{ error: error() !== null }}
            value={value()}
            onInput={handleInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={props.placeholder}
          />
        }
      >
        <InputTokensWrapper classList={{ focused: focused(), error: error() !== null }}>
          <InputTokens
            ref={(it) => (props.autofocus ? setTimeout(() => it.focus(), 1) : {})}
            value={value()}
            onInput={handleInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder}
            onFocus={(e) => {
              assertEventSafe(e);

              setFocused(true);
            }}
            onBlur={(e) => {
              assertEventSafe(e);

              setFocused(false);
              handleBlur(e);
            }}
          />
          <InputTokensSymbol>{(props.kind as TInputKindTokens).Tokens.symbol}</InputTokensSymbol>
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

  transition: border-bottom 0.5s ease-out;

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
`;

const InputTokensWrapper = styled.div`
  display: flex;
  padding-bottom: 0px;
  justify-content: space-between;
  align-items: baseline;
  align-self: stretch;

  position: relative;
  width: 100%;

  transition: border-bottom 0.5s ease-out;

  border-bottom: 1px solid ${COLOR_GRAY_150};

  &.focused {
    border-bottom: 1px solid ${COLOR_WHITE};
  }

  &.error {
    border-bottom: 1px solid ${COLOR_ERROR_RED} !important;
  }
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
`;

const InputTokensSymbol = styled.p`
  color: ${COLOR_WHITE};
  font-variant-numeric: lining-nums tabular-nums;
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 100%; /* 12px */
`;

const InputError = styled.p`
  color: ${COLOR_ERROR_RED};
  font-family: DM Sans;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 100%; /* 12px */
`;
