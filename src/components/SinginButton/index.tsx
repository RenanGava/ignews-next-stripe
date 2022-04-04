import { signIn, signOut, useSession} from "next-auth/react"

import { FaGithub } from 'react-icons/fa'
import {FiX} from 'react-icons/fi'

import styles from './styles.module.scss'

export function SinginButton(){
    const {data: session} = useSession()
    
    // console.log(session);
    

    return session ? (
        <button 
        type="button"
        className={styles.signinButton}
        onClick={() => signOut()}>
            <FaGithub color='#04d361'/>
            {session.user.name}
            <FiX color='#737380' className={styles.closeIcon}/>
        </button>
    ):(
        <button 
        type="button"
        className={styles.signinButton}
        onClick={() => signIn('github')}>
            <FaGithub color='#eba417'/>
            Sing in with Github
        </button>
    )
}