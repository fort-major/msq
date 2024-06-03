import { createContext, createSignal, useContext } from "solid-js";
import { IICRC1TransferRequest, unreacheable } from "@fort-major/msq-shared";
import { IChildren } from "../utils";
import { ICRC35AsyncRequest } from "@fort-major/msq-client";

type IMSQICRC35Request = ICRC35AsyncRequest<IICRC1TransferRequest | undefined>;

interface IICRC35Context {
  getIcrc35Request: <T extends IICRC1TransferRequest | undefined>() => ICRC35AsyncRequest<T> | undefined;
  setIcrc35Request: (request: ICRC35AsyncRequest<IICRC1TransferRequest | undefined>) => void;
}

const ICRC35Context = createContext<IICRC35Context>();

export function useICRC35Store(): IICRC35Context {
  const ctx = useContext(ICRC35Context);

  if (!ctx) {
    unreacheable("ICRC35 context is uninitialized");
  }

  return ctx;
}

export function ICRC35Store(props: IChildren) {
  const [getIcrc35Request, setIcrc35Request] = createSignal<IMSQICRC35Request | undefined>();

  return (
    <ICRC35Context.Provider
      value={{
        getIcrc35Request: getIcrc35Request as <T extends IICRC1TransferRequest | undefined = undefined>() =>
          | ICRC35AsyncRequest<T>
          | undefined,
        setIcrc35Request,
      }}
    >
      {props.children}
    </ICRC35Context.Provider>
  );
}
