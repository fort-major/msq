import { CabinetNav } from "../../../components/cabinet-nav";
import { CabinetContent } from "../../../styles";
import { MyMasksHeader } from "./style";

export function MyMasksPage() {
  // TODO: add stores and enable passing the client around

  return (
    <>
      <CabinetNav />
      <CabinetContent>
        <MyMasksHeader>My Masks</MyMasksHeader>
      </CabinetContent>
    </>
  );
}
