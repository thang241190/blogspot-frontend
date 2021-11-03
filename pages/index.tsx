import React from 'react'

import type { GetStaticProps } from 'next'
import { useQuery, UseQueryResult } from 'react-query'
import Head from 'next/head'
import NewPosts from '../components/main/NewPosts'
import RecentPosts from '../components/main/RecentPosts'
import PopularPosts from '../components/main/PopularPosts'

import { getPosts } from '../queries'
import { PostsType } from '../lib/interfaces/PostsType'

export interface InitialDataProps {
  posts: PostsType
}

const Home = ({ posts }: InitialDataProps) => {
  const { isLoading, isError, error }: UseQueryResult<PostsType, Error> =
    useQuery<PostsType, Error>('posts', getPosts, {
      initialData: posts,
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

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name='description' content='Generated by create next app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <NewPosts posts={posts.mainPosts.slice(0, 4)} />
        <RecentPosts posts={posts.mainPosts.slice(4, 12)} />
        <PopularPosts posts={posts.popularPosts} />
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async (): Promise<{
  props: { posts: PostsType }
}> => {
  const posts = await getPosts()

  return { props: { posts: posts } }
}

export default Home
