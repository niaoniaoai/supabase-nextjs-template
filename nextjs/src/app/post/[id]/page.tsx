'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  role: string;
  name?: string;
}

interface Post {
  id: string;
  author_id: string;
  author_name?: string;
  title: string;
  content: string;
  is_pinned?: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const postId = resolvedParams?.id;

  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 获取本地缓存的 Supabase 用户身份及角色
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }

    // 2. 从 Supabase 数据库拉取真实帖子详情数据
    const fetchPostFromSupabase = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) {
          console.error('获取帖子失败:', error.message);
        } else if (data) {
          setPost({
            id: data.id,
            author_id: data.author_id || data.user_id,
            author_name: data.author_name || '艾先生',
            title: data.title,
            content: data.content,
            is_pinned: data.is_pinned || false,
          });
        }
      } catch (err) {
        console.error('网络或查询错误:', err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) fetchPostFromSupabase();
  }, [postId]);

  // ------------------ 权限逻辑判断 ------------------
  const isLoggedIn = Boolean(currentUser && currentUser.id);
  // 是否是在 Supabase 中配置的管理员 role === 'admin'
  const isAdmin = isLoggedIn && currentUser?.role === 'admin';
  // 是否是当前帖子作者本人
  const isAuthor =
    isLoggedIn && Boolean(post) && String(currentUser?.id) === String(post?.author_id);

  // 按钮可见性规则
  const canPin = isAdmin;                // 置顶：仅管理员
  const canEdit = isAuthor || isAdmin;   // 修改：作者本人 或 管理员
  const canDelete = isAuthor || isAdmin; // 删除：作者本人 或 管理员
  // --------------------------------------------------

  // 1. Supabase 数据库置顶/取消置顶操作
  const handlePin = async () => {
    if (!post) return;
    const nextPinnedStatus = !post.is_pinned;

    const { error } = await supabase
      .from('posts')
      .update({ is_pinned: nextPinnedStatus })
      .eq('id', post.id);

    if (error) {
      alert(`置顶失败: ${error.message}`);
    } else {
      setPost({ ...post, is_pinned: nextPinnedStatus });
      alert(nextPinnedStatus ? '帖子已在数据库中成功置顶！' : '已取消置顶！');
    }
  };

  // 2. 编辑操作跳转
  const handleEdit = () => {
    router.push(`/posts/${postId}/edit`);
  };

  // 3. Supabase 数据库删除操作
  const handleDelete = async () => {
    if (!confirm('确定要从数据库中彻底删除这篇帖子吗？')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      alert(`删除失败: ${error.message}`);
    } else {
      alert('帖子已从数据库成功删除');
      router.push('/');
      router.refresh();
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-gray-500">正在从 Supabase 读取帖子...</div>;
  }

  if (!post) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-red-500">未在数据库中找到该帖子</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* 置顶标识 */}
      {post.is_pinned && (
        <span className="inline-block mb-3 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
          📌 已置顶
        </span>
      )}

      {/* 帖子真实内容 */}
      <article className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-6 flex gap-4">
          <span>作者: {post.author_name}</span>
          <span>帖子 ID: {post.id}</span>
        </div>
        <div className="text-gray-800 leading-relaxed whitespace-pre-line text-lg">
          {post.content}
        </div>
      </article>

      {/* 权限控制按钮组 */}
      <div className="flex gap-4 mt-6">
        {canPin && (
          <button
            onClick={handlePin}
            className={`px-4 py-2 text-white rounded font-medium transition ${
              post.is_pinned
                ? 'bg-gray-500 hover:bg-gray-600'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {post.is_pinned ? '取消置顶' : '置顶帖子'}
          </button>
        )}

        {canEdit && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
          >
            修改帖子
          </button>
        )}

        {canDelete && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition"
          >
            删除帖子
          </button>
        )}
      </div>
    </main>
  );
}
