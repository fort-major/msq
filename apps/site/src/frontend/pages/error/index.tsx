import { css, styled } from "solid-styled-components";
import { EIconKind } from "../../ui-kit/icon";
import { H2, Text } from "../../ui-kit/typography";
import { Button, EButtonKind } from "../../ui-kit/button";
import { Show, createEffect, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { ErrorSpoiler } from "../../components/error-spoiler";
import { COLOR_GRAY_105, COLOR_GRAY_140, COLOR_GRAY_190 } from "../../ui-kit";
import { DISCORD_LINK, METAMASK_LINK, delay } from "@fort-major/msq-shared";
import isMobile from "ismobilejs";
import { useMsqClient } from "../../store/global";

export interface IErrorPageProps {
  header: string;
  headerLine2?: string;
  text: string;
  error?: string;
  button?: {
    text: string;
    icon: EIconKind;
    action(): void;
  };
  button2?: {
    text: string;
    icon: EIconKind;
    action(): void;
  };
}

export function ErrorMobileNotSupportedPage() {
  return (
    <ErrorPage
      header="Oops! MSQ is not available on mobile devices yet"
      text="Try accessing this page via your desktop browser. Join our Discord community and be the first to know when it’s ready."
      button={{
        text: "Join Us",
        icon: EIconKind.Discord,
        action: () => window.open(DISCORD_LINK, "_blank"),
      }}
    />
  );
}

export function ErrorMSQConnectionRejectedPage() {
  const navigate = useNavigate();
  const msq = useMsqClient();

  createEffect(() => {
    if (msq()) {
      navigate("/", { replace: true });
    }
  });

  return (
    <ErrorPage
      header="Oops!"
      text="Seems like you've accidentally rejected the MSQ connection. Please, refresh the page and try again!"
      button={{
        text: "Refresh",
        icon: EIconKind.Loader,
        action: () => window.location.assign("/"),
      }}
    />
  );
}

export function ErrorInstallMetaMaskPage() {
  const navigate = useNavigate();
  const msq = useMsqClient();

  createEffect(() => {
    if (msq()) {
      navigate("/", { replace: true });
    }
  });

  return (
    <ErrorPage
      header="Install MetaMask"
      text="We couldn't find your MetaMask browser extension. Please, install it and refresh the page. If the problem persists, reach us out via Discord!"
      button={{ text: "Get Help", icon: EIconKind.Discord, action: () => window.open(DISCORD_LINK, "_blank") }}
      button2={{
        text: "Install MetaMask",
        icon: EIconKind.ArrowRightUp,
        action: () => window.open(METAMASK_LINK, "_blank"),
      }}
    />
  );
}

export function ErrorUnblockMsqPage() {
  const navigate = useNavigate();
  const msq = useMsqClient();

  createEffect(() => {
    if (msq()) {
      navigate("/", { replace: true });
    }
  });

  return (
    <ErrorPage
      header="MSQ Snap is blocked by MetaMask"
      text="Seems like MSQ Snap is in the Snap block list. Don't worry, this must me some kind of misunderstanding. We're going to fix this really soon."
      button={{ text: "Get Help", icon: EIconKind.Discord, action: () => window.open(DISCORD_LINK, "_blank") }}
    />
  );
}

export function ErrorEnableMsqPage() {
  const navigate = useNavigate();
  const msq = useMsqClient();

  createEffect(() => {
    if (msq()) {
      navigate("/", { replace: true });
    }
  });

  return (
    <ErrorPage
      header="Your MSQ Snap is disabled"
      text="Seems like you've disabled your MSQ Snap in your MetaMask settings. Enable it and refresh the page."
      button={{ text: "Get Help", icon: EIconKind.Discord, action: () => window.open(DISCORD_LINK, "_blank") }}
    />
  );
}

export function Error404Page() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      header="404"
      headerLine2="Page Not Found"
      text="Seems like there is no page you're looking for. Try other ones or go back!"
      button={{ text: "To My Wallet", icon: EIconKind.Login, action: () => navigate("/", { replace: true }) }}
    />
  );
}

export function ErrorPage(props: IErrorPageProps) {
  return (
    <ErrorPageWrapper>
      <ErrorPageContent>
        <ErrorPageText>
          <H2 class={Header}>{props.header}</H2>
          <Show when={props.headerLine2}>
            <H2 class={Header}>{props.headerLine2}</H2>
          </Show>
          <Text class={P} size={16} lineHeight={150}>
            {props.text}
          </Text>
        </ErrorPageText>
        <Show when={props.error}>
          <ErrorSpoiler defaultText={props.error!} />
        </Show>
        <ButtonsWrapper>
          <Show when={props.button2}>
            <Button
              label={props.button2!.text}
              classList={{ [Btn]: true }}
              kind={EButtonKind.Additional}
              text={props.button2!.text}
              icon={props.button2!.icon}
              onClick={props.button2!.action}
            />
          </Show>
          <Show when={props.button}>
            <Button
              label={props.button!.text}
              classList={{ [Btn]: true }}
              kind={EButtonKind.Primary}
              text={props.button!.text}
              icon={props.button!.icon}
              onClick={props.button!.action}
            />
          </Show>
        </ButtonsWrapper>
      </ErrorPageContent>

      <BoopFaceWrapper>
        <BoopFace width="184" height="172" viewBox="0 0 184 172" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M153.242 56.9118C169.705 66.4408 175.325 87.5113 165.796 103.974C156.267 120.437 135.196 126.058 118.734 116.529C102.271 107 96.6508 85.9292 106.18 69.4664C115.709 53.0037 136.78 47.3828 153.242 56.9118Z"
            fill="#53545B"
          />
          <mask
            id="mask0_312_726"
            style="mask-type:luminance"
            maskUnits="userSpaceOnUse"
            x="101"
            y="52"
            width="70"
            height="70"
          >
            <path
              d="M153.242 56.9123C169.705 66.4415 175.325 87.512 165.796 103.975C156.267 120.437 135.196 126.058 118.734 116.528C102.271 106.999 96.6507 85.9288 106.18 69.4663C115.709 53.0037 136.78 47.3831 153.242 56.9123Z"
              fill="white"
            />
          </mask>
          <g mask="url(#mask0_312_726)">
            <path
              d="M164.729 66.8948C177.804 74.463 182.268 91.1974 174.7 104.272C167.132 117.347 150.397 121.811 137.322 114.243C124.248 106.674 119.784 89.94 127.352 76.8653C134.92 63.7906 151.655 59.3266 164.729 66.8948Z"
              fill="#0A0B15"
            />
          </g>
          <path
            d="M65.9063 53.851C82.3688 63.38 87.9892 84.4504 78.4599 100.913C68.9306 117.376 47.8601 122.997 31.3977 113.468C14.9353 103.939 9.31486 82.8683 18.8442 66.4056C28.3735 49.9429 49.4439 44.322 65.9063 53.851Z"
            fill="#53545B"
          />
          <mask
            id="mask1_312_726"
            style="mask-type:luminance"
            maskUnits="userSpaceOnUse"
            x="14"
            y="49"
            width="70"
            height="70"
          >
            <path
              d="M65.9061 53.8519C82.3687 63.3811 87.9892 84.4515 78.46 100.914C68.9309 117.377 47.8604 122.997 31.3979 113.468C14.9354 103.939 9.31478 82.8683 18.844 66.4058C28.3732 49.9433 49.4436 44.3227 65.9061 53.8519Z"
              fill="white"
            />
          </mask>
          <g mask="url(#mask1_312_726)">
            <path
              d="M77.4285 63.8526C90.5032 71.4208 94.9671 88.1552 87.3989 101.23C79.8307 114.305 63.0963 118.769 50.0216 111.2C36.9468 103.632 32.4829 86.8979 40.0511 73.8231C47.6193 60.7484 64.3537 56.2844 77.4285 63.8526Z"
              fill="#0A0B15"
            />
          </g>
          <path
            d="M105.114 139.687C102.475 143.599 98.3342 132.899 89.6091 132.646C81.5207 132.644 75.4179 143.887 72.809 139.687C70.3186 135.677 83.3459 123.779 90.9331 124.035C98.5203 124.29 107.879 135.588 105.114 139.687Z"
            fill="#0A0B15"
          />
        </BoopFace>
      </BoopFaceWrapper>
    </ErrorPageWrapper>
  );
}

const ErrorPageWrapper = styled.section`
  width: 100%;
  display: flex;
  flex: 1;
  align-self: stretch;

  align-items: flex-end;
  justify-content: flex-start;

  padding: 80px 40px;

  @media (max-width: 1024px) {
    align-items: flex-start;
    padding: 20px;
  }
`;

const ErrorPageContent = styled.div`
  display: flex;
  width: 100%;
  max-width: 608px;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
`;

const ErrorPageText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const Header = css`
  @media (max-width: 1024px) {
    font-size: 36px;
    font-weight: 700;
    color: ${COLOR_GRAY_190};
  }
`;

const P = css`
  @media (max-width: 1024px) {
    font-size: 16px;
    font-weight: 400;
    line-height: 150%;
    color: ${COLOR_GRAY_140};
  }
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-flow: column nowrap;
    align-items: stretch;
    justify-content: flex-start;
    align-self: stretch;
  }
`;

const Btn = css`
  min-width: 200px;
`;

const size = isMobile().any ? window.innerWidth : 554;

const BoopFaceWrapper = styled.div`
  position: fixed !important;
  width: ${size.toString()}px !important;
  height: ${size.toString()}px !important;
  bottom: -${Math.round(size * 0.2).toString()}px;
  right: -${Math.round(size / 2).toString()}px;

  border: none;
  background-color: ${COLOR_GRAY_105};
  border-radius: 100%;

  @media (max-width: 1024px) {
    right: unset;
    left: 0;
    bottom: -${Math.round(size * 0.6).toString()}px;
  }
`;

const BoopFace = styled.svg`
  position: absolute;
  left: 35px;
  top: 214px;

  @media (max-width: 1024px) {
    left: 33%;
    top: 5%;

    width: 130px;
    height: 104px;
  }
`;
