import { CabinetNav } from "../../components/cabinet-nav";
import { CabinetContent, CabinetPage } from "../../ui-kit";
import { Outlet } from "@solidjs/router";
import { CabinetStore } from "../../store/cabinet";
import { ContactUsBtn } from "../../components/contact-us-btn";

export default function Cabinet() {
  return (
    <CabinetStore>
      <CabinetPage>
        <CabinetNav />
        <CabinetContent>
          <Outlet />
        </CabinetContent>
      </CabinetPage>
      <ContactUsBtn />
    </CabinetStore>
  );
}
