/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51Qpv0SIIpEoDrA3Huk3dwNll6DzBWSnHjDmrcYyZtzkSAwnsnMgqoDbqKv95KMHZ55YS8FPvAo6Ykodz6czl2nb900hihtXTca',
  );
  try {
    // 1. Getcheckout session from API

    const session = await axios(
      `http://127.0.0.1:8080/api/v1/bookings/checkout-session/${tourId}`,
    );
    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
    // window.location.replace(session.data.session.url);
    console.log(session);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
