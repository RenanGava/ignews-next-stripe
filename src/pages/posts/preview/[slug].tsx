import { GetStaticPaths, GetStaticProps } from "next"
import Head from "next/head"
import { RichText } from "prismic-dom"
import { getPrismicClient } from "../../../services/prismic"
import styles from '../post.module.scss'

interface PostPreviewProps{
    post:{
        slug: string
        title: string
        content: string
        updatedAt: string
    }
}


export default function PostPreview({ post }:PostPreviewProps){
    return(
        <>
            <Head>
                <title>{post.title} | Ignews</title>
            </Head>

            <main className={styles.container}>
                <article className={styles.post}>
                    <h1>{post.title}</h1>
                    <time>{post.updatedAt}</time>
                    <div
                        className={styles.postContent} 
                        dangerouslySetInnerHTML={{__html: post.content}} 
                    />
                </article>
            </main>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking'
    }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const { slug } = params;
  
    const prismic = getPrismicClient()
  
    const response = await prismic.getByUID('publication', String(slug), {})

    console.log(response);
    
  
    const post = {
      slug,
      title: RichText.asText(response.data.Title),
      content: RichText.asHtml(response.data.Content.splice(0, 3)),
      updatedAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    }
    return {
      props: {
        post,
      },
      revalidate: 60 * 30, // 30 minutes
    }
  
}