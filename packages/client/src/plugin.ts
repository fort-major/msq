import { IICRC1TransferRequest } from "@fort-major/masquerade-shared";
import { ICRC35, ICRC35Plugin, IICRC35Connection } from "icrc-35";

export class MSQICRC35Plugin extends ICRC35Plugin<"MSQ"> {
  protected init(): void {
    this.base.assertHasPlugin("ICRC35Async");
  }

  getName(): "MSQ" {
    return "MSQ";
  }

  static LoginRoute = "msq:login";
  static PayRoute = "msq:pay";
  static Origin = process.env.MSQ_SNAP_SITE_ORIGIN;

  async login(): Promise<boolean> {
    const result = await this.base.plugins.ICRC35Async.call(MSQICRC35Plugin.LoginRoute, undefined);

    if (typeof result !== "boolean") {
      throw new Error("Got invalid login response from MSQ, expected type 'boolean'");
    }

    return result;
  }

  async pay(req: IICRC1TransferRequest): Promise<bigint | null> {
    const result = await this.base.plugins.ICRC35Async.call(MSQICRC35Plugin.PayRoute, req);

    if (result !== null && typeof result !== "bigint") {
      throw new Error("Got invalid pay response from MSQ, expected type 'bigint | null'");
    }

    return result;
  }
}

export function createICRC35(connection: IICRC35Connection) {
  const msqPlugin = new MSQICRC35Plugin();

  return new ICRC35(connection, { [msqPlugin.getName()]: msqPlugin });
}
