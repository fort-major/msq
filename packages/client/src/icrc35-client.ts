import { IICRC1TransferRequest } from "@fort-major/masquerade-shared";
import { IICRC35Connection, ICRC35AsyncRequest } from "icrc-35";

export class MSQICRC35Client {
  static LoginRoute = "msq:login";
  static PayRoute = "msq:pay";
  static Origin = process.env.MSQ_SNAP_SITE_ORIGIN;

  constructor(private connection: IICRC35Connection) {}

  async login(): Promise<boolean> {
    const result = await this.connection.request(MSQICRC35Client.LoginRoute, undefined);

    if (typeof result !== "boolean") {
      throw new Error("Got invalid login response from MSQ, expected type 'boolean'");
    }

    return result;
  }

  async pay(req: IICRC1TransferRequest): Promise<bigint | null> {
    const result = await this.connection.request(MSQICRC35Client.PayRoute, req);

    if (result !== null && typeof result !== "bigint") {
      throw new Error("Got invalid pay response from MSQ, expected type 'bigint | null'");
    }

    return result;
  }

  async nextMsqRequest(): Promise<ICRC35AsyncRequest<IICRC1TransferRequest | undefined>> {
    return this.connection.nextRequest([MSQICRC35Client.LoginRoute, MSQICRC35Client.PayRoute], 50);
  }
}
