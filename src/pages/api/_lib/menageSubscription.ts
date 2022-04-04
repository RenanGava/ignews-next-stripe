import { query as q } from "faunadb"; 
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
    subscriptionId: string,
    customerId:string,
    createAction = false,
){
    // bucar o usuario no banco do fauna com o id {customerId}
    const userRef = await fauna.query(
        q.Select(
            // quando é preciso pegar um campo específico utilizamos o Select do faunaDb
            'ref',
            q.Get(
                q.Match(
                    q.Index('user_by_stripe_customer_id'),
                    customerId
                )
            )
        )
    )

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        price_Id: subscription.items.data[0].price.id,

    }

    if(createAction){
        await fauna.query(
            q.Create(
                q.Collection('subscriptions'),
                { data: subscriptionData }
            )
        )
    }else{
        await fauna.query(
            q.Replace(
                q.Select(
                    'ref',
                    q.Get(
                        q.Match(
                            q.Index('subscription_by_id'),
                            subscription.id
                        )
                    )
                ),
                {data: subscriptionData}
            )
        )
    }
    
    //salvar os dados da subscritpion no FaunaDb
}