'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  category?: string;
  author_name?: string;
  image_url?: string;
  created_at?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams?.id;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) {
          console.error('获取帖子详情失败:', error.message);
        } else {
          setPost(data);
        }
      } catch (err: unknown) {
        console.error('详情页请求异常:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500">正在加载文章内容...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-700 mb-2">404 - 未找到该帖子</h2>
        <p className="text-gray-500 mb-4">该帖子可能已被删除或路径不正确</p>
        <Link href="/" className="text-blue-600 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg border shadow-sm">
      <Link href="/" className="inline-block mb-4 text-sm text-blue-600 hover:underline">
        ← 返回帖子列表
      </Link>

      <div className="flex items-center gap-2 mb-3">
        {post.category && (
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
            {post.category}
          </span>
        )}
        <span className="text-xs text-gray-400">
          作者：{post.author_name || '艾先生'}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{post.title}</h1>

      {post.image_url && (
        <div className="mb-6">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-96 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>
    </main>
  );
}
