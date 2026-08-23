'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabase-expo-template/lib/supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  is_pinned?: boolean;
  created_at?: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // 从 Supabase 数据库按置顶状态和创建时间拉取帖子
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('is_pinned', { ascending: false }) // 置顶的排在前面
          .order('created_at', { ascending: false });

        if (error) {
          console.error('拉取帖子失败:', error.message);
        } else if (data) {
          setPosts(data);
        }
      } catch (err) {
        console.error('网络或服务异常:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">最新帖子列表</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">正在从 Supabase 加载帖子...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无帖子，点击右上角发布第一篇帖子吧！</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block p-5 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                {post.is_pinned && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                    📌 置顶
                  </span>
                )}
                <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition">
                  {post.title}
                </h2>
              </div>
              <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed mb-3">
                {post.content}
              </p>
              <div className="text-xs text-gray-400">
                作者：{post.author_name || '匿名'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
