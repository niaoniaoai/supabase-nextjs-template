'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 模拟登录成功，构建用户权限对象
    const user = {
      id: role === 'admin' ? 'admin_001' : 'user_123',
      name: username || (role === 'admin' ? '管理员' : '艾先生'),
      role: role, // 'admin' 或 'user'
    };

    // 2. 存入 localStorage
    localStorage.setItem('userInfo', JSON.stringify(user));

    // 3. 核心修复：跳转到首页并刷新路由状态
    router.push('/');
    router.refresh();
  };

  return (
    <main className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center">用户登录</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">选择登录角色</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            className="w-full border p-2 rounded"
          >
            <option value="user">普通作者 (艾先生 - user_123)</option>
            <option value="admin">系统管理员 (admin_001)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          登录并跳转首页
        </button>
      </form>
    </main>
  );
}
