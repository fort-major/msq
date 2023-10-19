import { Outlet } from "@solidjs/router";
import { IntegrationStore } from "../../store/integration";

export default function () {
  return (
    <IntegrationStore>
      <Outlet />
    </IntegrationStore>
  );
}
