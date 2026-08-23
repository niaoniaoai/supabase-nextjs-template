'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  role: string;
  name?: string;
}

interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  content: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);

  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 获取登录用户信息
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }

    // 2. 动态获取帖子数据：优先从 localStorage 的 posts 列表中查找，若无则匹配动态初始数据
    const postId = resolvedParams?.id;
    const localPostsStr = localStorage.getItem('posts');
    let foundPost: Post | null = null;

    if (localPostsStr) {
      try {
        const posts: Post[] = JSON.parse(localPostsStr);
        foundPost = posts.find((p) => String(p.id) === String(postId)) || null;
      } catch (e) {
        console.error('解析本地帖子列表失败', e);
      }
    }

    // 如果本地列表中没有（比如直接输入 URL 访问），提供符合你创作主题的备用真实数据
    if (!foundPost) {
      const defaultPosts: Record<string, Post> = {
        '1': {
          id: '1',
          authorId: 'user_123',
          authorName: '艾先生',
          title: '人工智能与机器学习初学者全景指南',
          content:
            '涵盖机器学习、深度学习与神经网络的核心概念拆解，帮助初学者建立系统认知框架。',
        },
        '2': {
          id: '2',
          authorId: 'user_123',
          authorName: '艾先生',
          title: '长春夜生活与自媒体视觉风格探讨',
          content:
            '探讨极简 16:9 视觉设计在长春夜生活文化自媒体视频与图文创作中的实战应用。',
        },
      };

      foundPost = defaultPosts[postId] || {
        id: postId,
        authorId: 'user_123',
        authorName: '艾先生',
        title: `动态帖子 #${postId}`,
        content: `这是 ID 为 ${postId} 的帖子详细内容。`,
      };
    }

    setPost(foundPost);
    setLoading(false);
  }, [resolvedParams?.id]);

  // ------------------ 核心权限逻辑 ------------------
  const isLoggedIn = Boolean(currentUser && currentUser.id);
  const isAdmin = isLoggedIn && currentUser?.role === 'admin';
  const isAuthor =
    isLoggedIn && Boolean(post) && String(currentUser?.id) === String(post?.authorId);

  // 权限对应按钮的可见性
  const canPin = isAdmin;                // 仅管理员可置顶
  const canEdit = isAuthor || isAdmin;   // 作者本人或管理员可修改
  const canDelete = isAuthor || isAdmin; // 作者本人或管理员可删除
  // --------------------------------------------------

  const handlePin = () => alert('操作成功：帖子已置顶');
  const handleEdit = () => router.push(`/posts/${post?.id}/edit`);
  const handleDelete = () => {
    if (confirm('确定要删除这篇帖子吗？')) {
      alert('帖子已删除');
      router.push('/');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-500">数据加载中...</div>;
  }

  if (!post) {
    return <div className="max-w-4xl mx-auto p-6 text-red-500">未找到该帖子内容</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* 当前登录身份提示 */}
      <div className="mb-6 p-3 bg-gray-100 rounded text-sm text-gray-600 flex justify-between items-center">
        <span>
          当前身份：
          {isLoggedIn ? (
            <strong className="text-blue-600">
              {currentUser?.name} ({isAdmin ? '系统管理员' : '普通作者'})
            </strong>
          ) : (
            <span className="text-gray-400">未登录（访客状态）</span>
          )}
        </span>
        {!isLoggedIn && (
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-600 underline hover:text-blue-800"
          >
            去登录
          </button>
        )}
      </div>

      {/* 帖子主体 */}
      <article className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <div className="text-xs text-gray-400 mb-6">作者 ID: {post.authorId}</div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          {post.content}
        </div>
      </article>

      {/* 操作按钮区（受权限精确控制） */}
      <div className="flex gap-4 mt-6">
        {canPin && (
          <button
            onClick={handlePin}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium transition"
          >
            置顶帖子
          </button>
        )}

        {canEdit && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
          >
            修改帖子
          </button>
        )}

        {canDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
          >
            删除帖子
          </button>
        )}
      </div>
    </main>
  );
}
