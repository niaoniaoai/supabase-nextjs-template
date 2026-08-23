'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // 请根据你的项目路径调整 Supabase 客户端引入

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. 调用 Supabase Auth 进行邮箱密码登录
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || '登录失败，请检查邮箱和密码');
      }

      const userId = authData.user.id;

      // 2. 查询 Supabase profiles 表获取数据库中设置的真实角色
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', userId)
        .single();

      // 如果 profiles 表没有额外设置，优先读取 user_metadata 中的 role，默认为 'user'
      const role = profileData?.role || authData.user.user_metadata?.role || 'user';
      const name = profileData?.name || authData.user.user_metadata?.name || email.split('@')[0];

      // 3. 将身份状态保存至缓存并跳转首页
      const userInfo = {
        id: userId,
        email: authData.user.email,
        name: name,
        role: role, // 'admin' 或 'user'
      };

      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      // 4. 跳转首页并刷新路由
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('登录异常:', err);
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">账号登录</h2>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded text-sm">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="请输入注册邮箱"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="请输入密码"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? '正在登录...' : '登录'}
        </button>
      </form>
    </main>
  );
}
