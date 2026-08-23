'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Category {
  id: number
  name: string
  slug: string
  is_default: boolean
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('id')
    if (data) setCategories(data)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 设置默认分类
  const setDefaultCategory = async (id: number) => {
    // 重置所有分类为非默认
    await supabase.from('categories').update({ is_default: false }).neq('id', 0)
    // 设置当前为默认
    await supabase.from('categories').update({ is_default: true }).eq('id', id)
    fetchCategories()
  }

  // 新建分类
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newSlug) return

    const { error } = await supabase.from('categories').insert([{ name: newName, slug: newSlug }])
    if (error) {
      alert('创建失败: ' + error.message)
    } else {
      setNewName('')
      setNewSlug('')
      fetchCategories()
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold border-b pb-3">分类与默认板块管理</h1>

      <form onSubmit={handleAddCategory} className="flex gap-2">
        <input
          type="text"
          placeholder="分类名称 (如: 游戏讨论)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="p-2 border rounded flex-1"
          required
        />
        <input
          type="text"
          placeholder="Slug 缩写 (如: games)"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          className="p-2 border rounded flex-1"
          required
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          新增分类
        </button>
      </form>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 border rounded flex justify-between items-center bg-white dark:bg-zinc-900"
          >
            <div>
              <span className="font-bold">{cat.name}</span>
              <span className="text-xs text-gray-400 ml-2">({cat.slug})</span>
              {cat.is_default && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold">
                  默认分类
                </span>
              )}
            </div>
            {!cat.is_default && (
              <button
                onClick={() => setDefaultCategory(cat.id)}
                className="text-xs px-3 py-1 border rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                设为默认分类
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
