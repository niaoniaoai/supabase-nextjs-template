'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  category?: string;
  author_name?: string;
  is_pinned?: boolean;
  created_at?: string;
}

const CATEGORIES = ['全部', 'AI与机器学习', '自媒体与视觉', '综合讨论'];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('posts')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (selectedCategory !== '全部') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;

        if (error) {
          console.error('拉取帖子失败:', error.message);
        } else if (data) {
          setPosts(data);
        }
      } catch (err) {
        console.error('请求异常:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* 分类筛选器 Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-3 overflow-x-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {selectedCategory === '全部' ? '最新帖子' : `${selectedCategory} 分类帖子`}
      </h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">正在加载帖子...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          该分类下暂无帖子，点击右上角“+ 发布帖子”开始创作吧！
        </div>
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
                {post.category && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                    {post.category}
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
                作者：{post.author_name || '艾先生'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
