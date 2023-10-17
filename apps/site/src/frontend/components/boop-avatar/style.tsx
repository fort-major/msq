import { styled } from "solid-styled-components";
import { JSX, Match, Switch } from "solid-js";

const blackColor = "#0A0B15";

export const Background = styled.div<{ color: string; width: number; height: number }>`
  position: relative;

  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;

  border-radius: 100%;
  border: none;
  background-color: ${(props) => props.color};

  overflow: hidden;
`;

export const Body = styled.div<{ color: string; width: number; height: number; angle: number }>`
  position: absolute;

  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;

  top: -40%;

  transform-origin: 50% 90%;
  transform: rotate(${(props) => props.angle}deg);

  border-radius: 100%;
  border: none;
  background-color: ${(props) => props.color};

  overflow: hidden;
`;

export const Face = styled.div<{ bodyAngle: number }>`
  position: absolute;

  bottom: 15%;
  left: 50%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%) rotate(${(props) => 15 - props.bodyAngle}deg);
`;

export const Eyes = styled.div<{ gap: number }>`
  position: relative;

  display: grid;
  grid-template-columns: auto auto;
  grid-column-gap: ${(props) => props.gap}px;
  flex-flow: row nowrap;
  align-items: center;
`;

export const EyeWhite = styled.div<{ size: number }>`
  position: relative;

  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;

  flex-shrink: 0;

  border-radius: 100%;
  border: none;
  background-color: white;

  overflow: hidden;
`;

export const EyePupil = styled.div<{ size: number; parentCenter: number; eyesAngle: number }>`
  position: absolute;

  width: 100%;
  height: 100%;

  top: -20%;
  left: 0;

  transform: rotate(${(props) => props.eyesAngle - 15}deg);
  transform-origin: 50% 70%;

  border-radius: 100%;
  border: none;
  background-color: ${blackColor};
`;

export const MouthWrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

export interface IMouthProps {
  type: 1 | 2 | 3;
  size: number;
}

function mouthStyle(size: number): JSX.CSSProperties {
  return {
    width: `${size}px`,
    height: `${size / 2}px`,
  };
}

function Mouth1(props: IMouthProps) {
  return (
    <svg
      style={mouthStyle(props.size)}
      width="59"
      height="30"
      viewBox="0 0 59 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.781892 12.621C10.9294 34.7111 47.4926 35.0242 58.0971 13.1925C61.1395 7.03543 54.9758 -0.369669 48.3421 1.45266L45.3906 2.19638C33.2935 5.3349 22.6517 4.66594 10.761 1.10031C4.11738 -0.901975 -2.09446 6.42796 0.781892 12.621Z"
        fill="#0A0B15"
      />
    </svg>
  );
}

function Mouth2(props: IMouthProps) {
  return (
    <svg
      style={mouthStyle(props.size)}
      width="59"
      height="30"
      viewBox="0 0 59 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.781892 17.5183C10.9294 -4.57176 47.4926 -4.88484 58.0971 16.9468C61.1395 23.1039 54.9758 30.509 48.3421 28.6867L45.3906 27.943C33.2935 24.8044 22.6517 25.4734 10.761 29.039C4.11738 31.0413 -2.09446 23.7114 0.781892 17.5183Z"
        fill="#0A0B15"
      />
    </svg>
  );
}

function Mouth3(props: IMouthProps) {
  return (
    <svg
      style={mouthStyle(props.size)}
      width="54"
      height="34"
      viewBox="0 0 54 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M53.9776 17.2043C53.9637 26.4558 41.8748 33.9374 26.9764 33.915C12.078 33.8926 0.0117027 26.3747 0.0256064 17.1233C0.0395101 7.87182 12.1283 0.390221 27.0268 0.412612C41.9252 0.435002 53.9915 7.95291 53.9776 17.2043Z"
        fill="#0A0B15"
      />
    </svg>
  );
}

export function Mouth(props: IMouthProps) {
  return (
    <Switch>
      <Match when={props.type === 1}>
        <Mouth1 {...props} />
      </Match>

      <Match when={props.type === 2}>
        <Mouth2 {...props} />
      </Match>

      <Match when={props.type === 3}>
        <Mouth3 {...props} />
      </Match>
    </Switch>
  );
}
