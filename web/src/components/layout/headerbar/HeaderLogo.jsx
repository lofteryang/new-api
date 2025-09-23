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

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Tag, Button } from '@douyinfe/semi-ui';
import { LayoutDashboard } from 'lucide-react';
import SkeletonWrapper from '../components/SkeletonWrapper';

const HeaderLogo = ({
  isMobile,
  isConsoleRoute,
  logo,
  logoLoaded,
  isLoading,
  systemName,
  isSelfUseMode,
  isDemoSiteMode,
  isHomePage,
  t,
}) => {
  if (isMobile && isConsoleRoute) {
    return null;
  }

  return (
    <Link to='/' className='group flex items-center gap-2'>
      <div className={`relative h-8 md:h-8 ${isHomePage ? 'ml-4 md:ml-12 lg:ml-[120px] xl:ml-[200px]' : ''}`}>
        <SkeletonWrapper loading={false} type='image' />
        {/* 规则：在首页（暗背景）使用无色白标，在其他页面使用彩色标 */}
        {isHomePage ? (
          <img
            src={'/logo-nocolor.svg'}
            alt='logo'
            className='block h-8 md:h-8 w-auto object-contain'
          />
        ) : (
          <img
            src={'/logo-color.svg'}
            alt='logo'
            className='block h-8 md:h-8 w-auto object-contain'
          />
        )}
      </div>
      {!isHomePage && (
        <>
          <span className='hidden md:inline-flex items-center text-sm text-gray-700 ml-2'>
            <span className='mx-2 text-gray-400'>|</span>
            新一代AI云算力服务商
          </span>
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            className='hidden md:inline-flex !px-2 !py-1 !rounded-md !bg-transparent hover:!bg-semi-color-fill-0 ml-2'
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/console';
            }}
            icon={<LayoutDashboard size={16} />}
          >
            {t('控制台')}
          </Button>
        </>
      )}
      {/* 仅显示 Logo：去除系统名与徽标 */}
    </Link>
  );
};

export default HeaderLogo;
