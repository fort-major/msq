import { Match, Show, Switch } from "solid-js";
import {
  BuyBtn,
  CardControls,
  CardControlsInStock,
  CardControlsLeft,
  CardControlsPrice,
  CardControlsRight,
  CardDescription,
  CardHeader,
  CardImg,
  LogInError,
  PayBtn,
  PlushieCardWrapper,
  QtySelector,
} from "./style";

export interface IPlushieCardProps {
  inStock: number;
  price: number;
  qty: number;
  onAdd(): void;
  onRemove(): void;

  loggedIn: boolean;
  loading: boolean;

  onContinue(): void;
}

export function PlushieCard(props: IPlushieCardProps) {
  return (
    <PlushieCardWrapper>
      <CardImg src="https://m.media-amazon.com/images/I/81dNGvKezHL._AC_SX679_.jpg" />
      <CardHeader>Plushie Pink Unicorn</CardHeader>
      <CardDescription>This unicorn can become a great gift for someone you care about!</CardDescription>
      <CardControls>
        <CardControlsLeft>
          <CardControlsPrice>
            <Show when={props.qty > 0} fallback={props.price.toPrecision(1)}>
              {(props.price * props.qty).toPrecision(1)}
            </Show>{" "}
            <span>ICP</span>
          </CardControlsPrice>
          <CardControlsInStock>
            {props.inStock} <span>left in stock</span>
          </CardControlsInStock>
        </CardControlsLeft>
        <CardControlsRight>
          <Switch>
            <Match when={props.qty === 0}>
              <BuyBtn onClick={props.onAdd}>Add To Cart</BuyBtn>
            </Match>
            <Match when={props.qty > 0}>
              <QtySelector>
                <span onClick={props.onRemove}>-</span>
                <p>{props.qty}</p>
                <span onClick={props.onAdd}>+</span>
              </QtySelector>
            </Match>
          </Switch>
        </CardControlsRight>
      </CardControls>
      <Show when={props.qty > 0}>
        <Show when={props.loggedIn} fallback={<LogInError>Login to continue</LogInError>}>
          <Show when={!props.loading} fallback={<LogInError>Loading...</LogInError>}>
            <PayBtn onClick={props.onContinue}>Continue</PayBtn>
          </Show>
        </Show>
      </Show>
    </PlushieCardWrapper>
  );
}
