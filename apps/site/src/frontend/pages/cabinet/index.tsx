import { CabinetNav } from "../../components/cabinet-nav";
import { CabinetContent } from "../../styles";
import { Outlet } from "@solidjs/router";
import { CabinetStore } from "../../store/cabinet";

export default function Cabinet() {
  return (
    <CabinetStore>
      <CabinetNav />
      <CabinetContent>
        <Outlet />
      </CabinetContent>
    </CabinetStore>
  );
}
