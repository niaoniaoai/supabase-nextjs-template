'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  is_default?: boolean
}

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase.from('categories').select('*')
      if (data) {
        setCategories(data)
        const defaultCat = data.find((c: Category) => c.is_default)
        if (defaultCat) setCategoryId(defaultCat.id)
      }
    }
    init()
  }, [router, supabase])

  // 上传图片到 Supabase Storage 存储桶
  const uploadImageFile = async (file: File) => {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `post-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('forum-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('forum-images')
        .getPublicUrl(filePath)

      // 自动追加图片标签至正文
      setContent((prev) => prev + `\n<img src="${publicUrl}" alt="图片" class="max-w-full rounded-lg my-2" />\n`)
    } catch (err: unknown) {
      const error = err as Error
      alert('图片上传失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 拖拽处理
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        uploadImageFile(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content,
          category_id: categoryId,
          user_id: user.id,
          author_email: user.email,
        },
      ])
      .select()

    setLoading(false)

    if (error) {
      alert('发布失败: ' + error.message)
    } else if (data) {
      router.push(`/post/${data[0].id}`)
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold border-b pb-3">发布新讨论帖子</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">选择分类</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full p-2 border rounded bg-transparent"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.is_default ? '(默认)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">帖子标题</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入标题..."
            className="w-full p-2.5 border rounded bg-transparent"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">
              帖子正文 {uploading && <span className="text-blue-600 text-xs">(上传图片中...)</span>}
            </label>
            <label className="cursor-pointer px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs rounded hover:bg-zinc-200">
              📁 点击选择本地图片上传
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadImageFile(e.target.files[0])
                  }
                }}
              />
            </label>
          </div>
          <textarea
            rows={10}
            required
            value={content}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onChange={(e) => setContent(e.target.value)}
            placeholder="撰写你的讨论内容...（支持直接拖拽图片文件到此处上传）"
            className="w-full p-2.5 border rounded bg-transparent font-mono text-sm"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/" className="px-4 py-2 border rounded text-sm">
            取消
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '发布中...' : '提交发布'}
          </button>
        </div>
      </form>
    </main>
  )
}
