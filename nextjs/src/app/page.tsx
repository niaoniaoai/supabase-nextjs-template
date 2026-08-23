'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  content: string
  author_email: string
  created_at: string
  is_pinned: boolean
  category_id: number
  categories?: { name: string } | null
}

interface Category {
  id: number
  name: string
}

export default function ForumHome() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: catData } = await supabase.from('categories').select('*')
      if (catData) setCategories(catData)

      let query = supabase
        .from('posts')
        .select('*, categories(name)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data } = await query
      if (data) setPosts(data as unknown as Post[])
    }
    fetchData()
  }, [selectedCategory, supabase])

  // 退出登录处理函数
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.reload()
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">社区讨论论坛</h1>
          <p className="text-gray-500 text-sm mt-1">发现精彩内容与深度讨论</p>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/new-post"
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-sm"
              >
                + 发布新帖
              </Link>
              <span className="text-xs text-gray-500">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border rounded text-xs hover:bg-red-50 text-red-600 transition"
              >
                退出登录
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-zinc-800 text-white rounded font-medium text-sm"
            >
              去登录
            </Link>
          )}
        </div>
      </header>

      {/* 分类筛选器 */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 text-sm rounded-full transition ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          全部板块
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 text-sm rounded-full transition ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">当前分类下暂无讨论帖子</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="p-5 border rounded-lg hover:border-blue-500 transition bg-white dark:bg-zinc-900 flex justify-between items-center"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {post.is_pinned && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">
                      置顶
                    </span>
                  )}
                  {post.categories?.name && (
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">
                      {post.categories.name}
                    </span>
                  )}
                  <Link
                    href={`/post/${post.id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {post.title}
                  </Link>
                </div>
                <p className="text-xs text-gray-400">
                  作者：{post.author_email || '匿名'} | 发布时间：
                  {new Date(post.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <Link
                href={`/post/${post.id}`}
                className="text-sm text-blue-600 hover:underline shrink-0 ml-4"
              >
                查看详情 &rarr;
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
