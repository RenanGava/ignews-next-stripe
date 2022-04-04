/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream'
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/menageSubscription";


// essa funçAo é responsavel por converter os eventos de webhooks
// do stripe CLI para uma evento que possa ser recebido normalmente e executado no NodeJS
async function buffer(readable: Readable){
    const chunks = []

    for await (const chunk of readable) {
        chunks.push(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk
        )
    }

    return Buffer.concat(chunks)
}

// exportando esssa configuração fazemos o next entender que a nossa requisição
// não está vindo no formato 'json' mas sim no formato 'stream'
// por isso desabilitamos o bodyparser para recebermos a requisição 'stream'
export const config ={
    api:{
        bodyParser: false
    }
}

const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',

])

export default async (req:NextApiRequest, res:NextApiResponse) => {
    
    if(req.method === 'POST'){
        const buf = await buffer(req)
        const secret = req.headers['stripe-signature']

        let event: Stripe.Event = req.body

        try{
            event = stripe.webhooks.constructEvent(
                buf, 
                secret, 
                process.env.STRIPE_WEBHOOK_SECRET
            )
        }catch (err){
            return res.status(400).send(`webhook error: ${err.message}`)
        }

        const { type } = event

        if(relevantEvents.has(type)){
            try{
                switch(type){
                    case 'customer.subscription.updated':
                    case 'customer.subscription.deleted':

                        const subscription = event.data.object as Stripe.Subscription

                        await saveSubscription(
                            subscription.id,
                            subscription.customer.toString(),
                            false,
                        )
                        break

                    case 'checkout.session.completed':
                        // tipamos o checkou para saber oq existe dentro dela e pegqar o id
                        // da subscription
                        const checkoutSession = event.data.object as Stripe.Checkout.Session
                        await saveSubscription(
                            checkoutSession.subscription.toString(),
                            checkoutSession.customer.toString(),
                            true
                        )

                        break
                    default:
                        throw new Error('Unhandled event.')
                }
            } catch (err){
                return res.json({error: 'webhook handler failed'})
            }
        }

        res.json({received: true})
    }else{
        res.setHeader('Allow', 'POST')
        res.status(405).end('Method not allowed')
    }
    
}