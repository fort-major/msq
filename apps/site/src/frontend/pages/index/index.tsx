import { useNavigate } from "@solidjs/router";

export function IndexPage() {
  const navigate = useNavigate();

  navigate("/cabinet/my-assets");

  return undefined;
}
