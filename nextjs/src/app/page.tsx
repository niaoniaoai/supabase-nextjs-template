'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Post {
  id: number
  title: string
  content: string
  author_email: string
  created_at: string
}

export default function ForumHome() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 直接在前端创建 Supabase 客户端
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 获取当前登录状态与帖子列表
  useEffect(() => {
    async function fetchData() {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 拉取所有帖子（按时间倒序排列）
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
    }
    fetchData()
  }, [])

  // 发布新帖子
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          user_id: user.id,
          author_email: user.email,
        },
      ])
      .select()

    setLoading(false)

    if (error) {
      alert('发帖失败: ' + error.message)
    } else {
      setTitle('')
      setContent('')
      if (data) setPosts([data[0], ...posts])
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">社区讨论论坛</h1>
          <p className="text-gray-500 mt-1">欢迎在社区分享你的观点和想法</p>
        </div>
        {user ? (
          <div className="text-right text-sm">
            <p className="text-gray-600">已登录</p>
            <p className="font-semibold">{user.email}</p>
          </div>
        ) : (
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            去登录发帖
          </a>
        )}
      </header>

      {/* 发帖区域（仅登录用户可见） */}
      {user ? (
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg border mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-4">发表新讨论</h2>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="请输入帖子标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
              />
            </div>
            <div>
              <textarea
                placeholder="分享你的想法或问题..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '发布中...' : '发布帖子'}
            </button>
          </form>
        </section>
      ) : (
        <div className="p-4 border rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 mb-8 text-center">
          请先登录账号，即可发表新讨论或参与回复。
        </div>
      )}

      {/* 帖子列表展示 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">最新讨论列表 ({posts.length})</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无帖子，快来抢沙发吧！</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="p-6 bg-white dark:bg-zinc-900 border rounded-lg shadow-sm space-y-3"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {post.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
              <div className="text-xs text-gray-400 flex justify-between items-center border-t pt-3">
                <span>发布者：{post.author_email || '匿名用户'}</span>
                <span>{new Date(post.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}
