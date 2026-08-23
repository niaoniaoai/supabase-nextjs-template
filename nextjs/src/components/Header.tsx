'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  currentUser?: {
    name?: string;
    type?: string;
  } | null;
  onLogout?: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / 主页链接 */}
        <Link 
          href="/" 
          className="text-xl font-bold text-gray-900 hover:text-blue-600 transition"
        >
          我的博客
        </Link>

        {/* 右侧导航与用户状态 */}
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            首页
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* 发布文章入口 */}
              <Link
                href="/new-post"
                className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                发布帖子
              </Link>

              {/* 用户姓名与身份标签 */}
              <span className="text-sm font-medium text-gray-700 flex items-center">
                {currentUser.name || '已登录用户'}
                <span className="ml-1 text-xs text-gray-400">
                  ({currentUser?.type === 'administrator' ? '管理员' : '普通用户'})
                </span>
              </span>

              {/* 退出登录按钮 */}
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 transition"
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                登录
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
