/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 根据路由强制设置主题的 Hook
 * @param {Function} setTheme - 设置主题的函数
 * @param {string} userTheme - 用户设置的主题偏好
 */
export const useRouteBasedTheme = (setTheme, userTheme) => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    // 判断是否在首页
    const isHomePage = currentPath === '/' || currentPath === '/home';

    if (isHomePage) {
      // 首页强制使用夜间模式（深色模式）
      setTheme('dark');
    } else {
      // 其他页面强制使用浅色模式
      setTheme('light');
    }
  }, [location.pathname, setTheme]);

  // 返回当前路径信息，供其他组件使用
  return {
    isHomePage: location.pathname === '/' || location.pathname === '/home',
    currentPath: location.pathname,
  };
};
