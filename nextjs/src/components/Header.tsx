'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';// 根据你项目的真实 Supabase 客户端路径调整

interface User {
  id: string;
  name: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 读取 Supabase 登录后保存在本地的用户状态
  useEffect(() => {
    const userStr = localStorage.getItem('userInfo');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // 退出 Supabase Auth 登录
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase 登出:', e);
    }
    localStorage.removeItem('userInfo');
    setCurrentUser(null);
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 社区 Logo / 标题 */}
        <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition">
          艾先生的内容社区
        </Link>

        {/* 右侧：用户状态与功能按钮 */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <>
              {/* 发布帖子入口 */}
              <Link
                href="/new-post"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
              >
                + 发布帖子
              </Link>

              {/* 用户信息与退出按钮 */}
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-700">
{currentUser.name}
<span className="ml-1 text-xs text-gray-400">
  ({currentUser?.type === 'administrator' ? '管理员' : '普通用户'})
</span>
<button
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 transition"
                >
                  退出登录
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
            >
              登录账号
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
