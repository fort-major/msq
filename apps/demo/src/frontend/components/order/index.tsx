import { Match, Switch } from "solid-js";
import { Order } from "../../../declarations/demo_backend/demo_backend.did";
import { tokensToStr } from "../../utils";
import { BuyBtn } from "../plushie-card/style";
import {
  OrderFooter,
  OrderFooterTotal,
  OrderItems,
  OrderItemsImg,
  OrderItemsText,
  OrderItemsTextName,
  OrderItemsTextQty,
  OrderWrapper,
} from "./style";

export function OrderComp(props: Order & { onPay(): void; loading: boolean }) {
  return (
    <OrderWrapper>
      <OrderItems>
        <OrderItemsImg src="https://m.media-amazon.com/images/I/81dNGvKezHL._AC_SX679_.jpg" />
        <OrderItemsText>
          <OrderItemsTextName>Plushie Pink Unicorn</OrderItemsTextName>
          <OrderItemsTextQty>x{props.qty}</OrderItemsTextQty>
        </OrderItemsText>
      </OrderItems>
      <OrderFooter>
        <OrderFooterTotal>
          {tokensToStr(props.total, 8)} <span>ICP</span>
        </OrderFooterTotal>
        <Switch>
          <Match when={props.status.hasOwnProperty("Created")}>
            <BuyBtn disabled={props.loading} onClick={props.onPay}>
              Pay
            </BuyBtn>
          </Match>
          <Match when={props.status.hasOwnProperty("Paid")}>
            <p>Paid</p>
          </Match>
        </Switch>
      </OrderFooter>
    </OrderWrapper>
  );
}
