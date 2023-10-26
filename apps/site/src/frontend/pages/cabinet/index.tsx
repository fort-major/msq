import { CabinetNav } from "../../components/cabinet-nav";
import { CabinetContent } from "../../styles";
import { Outlet } from "@solidjs/router";
import { CabinetStore } from "../../store/cabinet";
import { ContactUsBtn } from "../../components/contact-us-btn";

export default function Cabinet() {
  return (
    <CabinetStore>
      <CabinetNav />
      <CabinetContent>
        <Outlet />
      </CabinetContent>
      <ContactUsBtn />
    </CabinetStore>
  );
}
