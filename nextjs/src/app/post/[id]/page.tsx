'use client'

import { useState, useEffect, use } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  content: string
  author_email: string
  created_at: string
  is_pinned: boolean
  user_id: string
}

interface Comment {
  id: number
  author_email: string
  content: string
  created_at: string
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single()

      if (postData) {
        setPost(postData)
        setEditTitle(postData.title)
        setEditContent(postData.content)
      }

      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true })

      if (commentData) setComments(commentData)
    }
    fetchData()
  }, [id, supabase])

  // 前台删帖
  const handleDeletePost = async () => {
    if (!confirm('确定要删除此帖子吗？此操作不可撤销。')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      alert('删除失败: ' + error.message)
    } else {
      alert('帖子已成功删除！')
      router.push('/')
    }
  }

  // 修改保存帖子
  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('posts')
      .update({ title: editTitle, content: editContent })
      .eq('id', id)

    if (error) {
      alert('修改失败: ' + error.message)
    } else {
      if (post) setPost({ ...post, title: editTitle, content: editContent })
      setIsEditing(false)
    }
  }

  const togglePin = async () => {
    if (!post) return
    const nextStatus = !post.is_pinned
    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: nextStatus })
      .eq('id', post.id)

    if (!error) setPost({ ...post, is_pinned: nextStatus })
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: id,
          user_id: user.id,
          author_email: user.email,
          content: newComment,
        },
      ])
      .select()

    if (error) {
      alert('评论失败: ' + error.message)
    } else if (data) {
      setComments([...comments, data[0]])
      setNewComment('')
    }
  }

  if (!post) return <div className="p-8 text-center text-gray-400">加载中...</div>

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        &larr; 返回帖子列表
      </Link>

      <article className="border-b pb-6 space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-2 border rounded font-bold text-xl"
            />
            <textarea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded font-mono text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm"
              >
                保存修改
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 border rounded text-sm"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={togglePin}
                  className="text-xs px-2.5 py-1 border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {post.is_pinned ? '取消置顶' : '设置置顶'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs px-2.5 py-1 border rounded bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  修改帖子
                </button>
                <button
                  onClick={handleDeletePost}
                  className="text-xs px-2.5 py-1 border rounded bg-red-50 text-red-600 hover:bg-red-100"
                >
                  删除帖子
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              发布者：{post.author_email || '匿名'} | 时间：
              {new Date(post.created_at).toLocaleString('zh-CN')}
            </p>
            {/* 渲染富文本与上传的图片 */}
            <div
              className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line space-y-4 pt-2"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </>
        )}
      </article>

      {/* 评论区 */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold">评论列表 ({comments.length})</h2>
        {user ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的评论..."
              required
              className="w-full p-2.5 border rounded bg-transparent text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              发表评论
            </button>
          </form>
        ) : (
          <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded">
            登录后即可参与评论
          </div>
        )}

        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="p-4 border rounded bg-zinc-50 dark:bg-zinc-900 text-sm space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{c.author_email}</span>
                <span>{new Date(c.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
