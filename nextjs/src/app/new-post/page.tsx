'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AI与机器学习');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. 快捷格式化文本工具（加粗、链接）
  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${before}${selectedText || '文本'}${after}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  // 2. 上传图片至 Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
        setContent((prev) => `${prev}\n![图片](${data.publicUrl})\n`);
      }
    } catch (err: unknown) {
      console.error('图片上传失败:', err);
      alert('图片上传失败，请检查 Supabase Storage 权限');
    } finally {
      setUploading(false);
    }
  };

  // 3. 提交帖子（修复字段名：使用 user_id 代替 author_id）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const userStr = localStorage.getItem('userInfo');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
      alert('请先登录后再发布帖子！');
      router.push('/auth/login');
      return;
    }

    try {
      // 构建插入对象，避免提交无效/不匹配的字段
      const postData: Record<string, unknown> = {
        title,
        category,
        content,
        user_id: user.id, // ✅ 使用 Supabase 表中实际的字段 user_id
        author_name: user.name || '艾先生',
      };

      if (imageUrl) {
        postData.image_url = imageUrl;
      }

      const { error } = await supabase.from('posts').insert([postData]);

      if (error) {
        alert(`发布失败: ${error.message}`);
      } else {
        alert('帖子发布成功！');
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      console.error('提交异常:', err);
      alert('提交失败，请检查网络');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">发布新帖子</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">文章标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2.5 rounded outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="请输入标题"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">文章分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2.5 rounded outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="AI与机器学习">AI与机器学习</option>
            <option value="自媒体与视觉">自媒体与视觉</option>
            <option value="综合讨论">综合讨论</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容与排版</label>
          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 border rounded-t border-b-0">
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              className="px-2.5 py-1 bg-white border rounded text-xs font-bold hover:bg-gray-100 text-gray-800"
              title="加粗"
            >
              B (加粗)
            </button>
            <button
              type="button"
              onClick={() => insertText('[链接描述](', ')')}
              className="px-2.5 py-1 bg-white border rounded text-xs text-blue-600 hover:bg-gray-100"
              title="插入链接"
            >
              🔗 插入链接
            </button>
            <label className="cursor-pointer px-2.5 py-1 bg-white border rounded text-xs text-green-600 hover:bg-gray-100">
              {uploading ? '上传中...' : '📷 上传图片'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border p-3 rounded-b h-48 outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="写点什么吧..."
            required
          />
        </div>

        {imageUrl && (
          <div className="p-2 border rounded bg-gray-50">
            <span className="text-xs text-gray-500 block mb-1">已插入的图片预览：</span>
            <img src={imageUrl} alt="预览图片" className="max-h-40 rounded object-cover" />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? '发布中...' : '确认发布'}
        </button>
      </form>
    </main>
  );
}
