import React, { ReactElement } from 'react'
import Head from 'next/head'
import Link from 'next/link'
const BlockContent = require('@sanity/block-content-to-react')
import RelatedPost from '../../components/main/RelatedPost'
import getYouTubeId from 'get-youtube-id'
import YouTube from 'react-youtube'

import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import { client, getAllSlugs, getSinglePost } from '../../queries'
import { useQuery, UseQueryResult } from 'react-query'
import { PostType, RelatedPostType } from '../../lib/interfaces/PostsType'
import { useRouter } from 'next/dist/client/router'
import { useNextSanityImage } from 'next-sanity-image'

interface AppProps {
  post: PostType | undefined
}
type linksType = {
  mark: { blank: boolean; href: string }
  children: HTMLElement
}
type alignmentType = {
  mark: { alignment: 'left' | 'right' | 'center' }
  children: HTMLElement
}
const serializers = {
  marks: {
    link: ({ mark, children }: linksType) => {
      const { blank, href } = mark
      return blank ? (
        <a href={href} target='_blank' rel='noopener'>
          {children}
        </a>
      ) : (
        <a href={href}>{children}</a>
      )
    },
    textAlignment: ({ mark, children }: alignmentType) => {
      if (mark.alignment === 'right') {
        return (
          <span
            style={{
              textAlign: 'right',
              display: 'inline-block',
              width: '100%',
            }}>
            {children}
          </span>
        )
      } else if (mark.alignment === 'center') {
        return (
          <span
            style={{
              textAlign: 'center',
              display: 'inline-block',
              width: '100%',
            }}>
            {children}
          </span>
        )
      } else {
        return <span>{children}</span>
      }
    },
  },
  types: {
    youtube: ({ node }: any) => {
      const { url } = node
      const id: string | null = getYouTubeId(url)
      if (id) {
        return <YouTube videoId={id} className='youtube-iframe' />
      } else {
        return null
      }
    },
  },
}

const PostPage = ({ post }: AppProps) => {
  const router = useRouter()
  const slug = router.query.slug
  const {
    isLoading,
    isError,
    error,
  }: UseQueryResult<PostType | undefined, Error> = useQuery<
    PostType | undefined,
    Error
  >('post', () => getSinglePost(slug), {
    initialData: post,
  })

  if (isLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <p>{error?.message}</p>
      </div>
    )
  }

  if (!post) {
    return <div>Not found</div>
  } else {
    const imageProps = useNextSanityImage(client, post.imageUrl)
    return (
      <>
        <Head>
          <title>{post.title}</title>
        </Head>
        <div className='post'>
          <div
            className='breadcrumbs'
            style={{ backgroundImage: `url('${imageProps.src}')` }}>
            <div className='breadcrumbs__content'>
              <p>
                <span className='post__category'>
                  {post.categories.map((category) => (
                    <Link
                      href={`/categories/${category.slug}`}
                      key={category.slug}>
                      <a>{category.title}</a>
                    </Link>
                  ))}
                </span>
                <span className='post__tag'>
                  {post.tags.map((tag) => (
                    <Link href={`/tags/${tag.slug}`} key={tag.slug}>
                      <a>#{tag.title}</a>
                    </Link>
                  ))}
                </span>
              </p>
              <h1 className='post__title'>{post.title}</h1>
              <p className='post__date'>
                {post.createdAt.slice(0, 10).toUpperCase()} |
                <Link href={`/author/${post.author.slug}`}>
                  <a>{post.author.name.toUpperCase()}</a>
                </Link>
              </p>
            </div>
          </div>
          <div className='container'>
            <article className='post__content'>
              <BlockContent
                blocks={post.body}
                imageOptions={{ w: 640, fit: 'max' }}
                projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
                dataset={process.env.NEXT_PUBLIC_DATASET}
                serializers={serializers}
              />
            </article>
          </div>
          <section className='recent-posts'>
            <div className='container'>
              <h2 className='recent-posts__title'>Related posts</h2>
              <div className='recent-posts__wrapper'>
                {post.categories.map((category) =>
                  category.relatedPosts.map((post: RelatedPostType) => (
                    <RelatedPost
                      post={post}
                      key={post.id}
                      classes='recent-posts__item'
                      size={[150, 100]}
                    />
                  )),
                )}
              </div>
            </div>
          </section>
        </div>
      </>
    )
  }
}

type slugType = {
  params: {
    slug: string
  }
}
export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext,
) => {
  const { params } = context
  const emptyPost: PostType = {
    title: 'Post not found',
    createdAt: '',
    id: '0',
    description: '',
    body: [],
    categories: [],
    imageUrl: '',
    slug: '',
    tags: [],
    author: { slug: '', name: '' },
  }
  if (!params?.slug) {
    return { props: { post: emptyPost } }
  }
  const post = await getSinglePost(params.slug)
  return { props: { post: post } }
}

export const getStaticPaths = async () => {
  const posts = await getAllSlugs()
  const paths = posts.map((post) => ({
    params: {
      slug: post.slug,
    },
  }))
  return {
    paths,
    fallback: false,
  }
}

export default PostPage
