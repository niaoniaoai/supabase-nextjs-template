'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 定义用户和帖子数据的类型结构
interface User {
  id: string;
  role: string; // 假设角色字段，例如 'admin' 表示管理员
  name?: string;
}

interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
}

export default function PostDetailPage({ params }: { params?: { id: string } }) {
  const router = useRouter();

  // 1. 帖子数据状态（实际项目中请换成你的接口/数据源）
  const [post, setPost] = useState<Post>({
    id: params?.id || '1',
    authorId: 'user_123', // 假设帖子作者的 ID
    title: '示例帖子标题',
    content: '这是帖子内容的详细信息...',
  });

  // 2. 当前登录用户信息状态
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 页面加载时从本地存储获取当前用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }, []);

  // ------------------ 核心权限判断 ------------------
  // 1. 是否已登录
  const isLoggedIn = Boolean(currentUser && currentUser.id);

  // 2. 是否是管理员（根据实际字段调整，这里假设角色是 'admin'）
  const isAdmin = isLoggedIn && currentUser?.role === 'admin';

  // 3. 是否是帖子作者本人（比对当前用户 ID 和帖子作者 ID）
  const isAuthor = isLoggedIn && String(currentUser?.id) === String(post?.authorId);

  // 按钮可见性规则
  const canPin = isAdmin;                // 置顶：仅管理员
  const canEdit = isAuthor || isAdmin;   // 修改：作者本人 或 管理员
  const canDelete = isAuthor || isAdmin; // 删除：作者本人 或 管理员
  // --------------------------------------------------

  // 按钮事件处理函数
  const handlePin = () => {
    alert('操作成功：帖子已置顶');
  };

  const handleEdit = () => {
    router.push(`/posts/${post.id}/edit`);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这篇帖子吗？')) {
      alert('帖子已删除');
      router.push('/');
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* 帖子主体 */}
      <article className="border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </article>

      {/* 操作按钮区 */}
      <div className="flex gap-4 mt-6">
        {/* 1. 仅管理员可见：置顶 */}
        {canPin && (
          <button
            onClick={handlePin}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium transition-colors"
          >
            置顶帖子
          </button>
        )}

        {/* 2. 作者本人或管理员可见：修改 */}
        {canEdit && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            修改帖子
          </button>
        )}

        {/* 3. 作者本人或管理员可见：删除 */}
        {canDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
          >
            删除帖子
          </button>
        )}
      </div>
    </main>
  );
}
