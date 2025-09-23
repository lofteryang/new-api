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
import { Card, Typography, Tag, Space } from '@douyinfe/semi-ui';
import { Info } from 'lucide-react';
import { stringToColor } from '../../../../../helpers';

const { Text } = Typography;

const ModelBasicInfo = ({ modelData, vendorsMap = {}, t }) => {
  // 获取模型描述（使用后端真实数据）
  const getModelDescription = () => {
    if (!modelData) return t('暂无模型描述');

    // 优先使用后端提供的描述
    if (modelData.description) {
      return modelData.description;
    }

    // 如果没有描述但有供应商描述，显示供应商信息
    if (modelData.vendor_description) {
      return t('供应商信息：') + modelData.vendor_description;
    }

    return t('暂无模型描述');
  };

  // 获取模型标签
  const getModelTags = () => {
    const tags = [];

    if (modelData?.tags) {
      const customTags = modelData.tags.split(',').filter((tag) => tag.trim());
      customTags.forEach((tag) => {
        const tagText = tag.trim();
        tags.push({ text: tagText, color: stringToColor(tagText) });
      });
    }

    return tags;
  };

  return (
    <Card className='!rounded-xl !shadow-none !border' style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className='mb-3'>
        <div className='flex items-center gap-2 mb-1'>
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center'
            style={{
              background:
                'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.15) 100%)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <Info size={14} className='text-blue-500' />
          </div>
          <Text className='text-base font-semibold'>{t('基本信息')}</Text>
        </div>
        <div className='text-xs text-gray-500'>{t('模型的详细描述和基本特性')}</div>
      </div>
      <div className='text-gray-700 leading-6 text-sm'>
        <p className='mb-3'>{getModelDescription()}</p>
        {getModelTags().length > 0 && (
          <Space wrap>
            {getModelTags().map((tag, index) => (
              <Tag key={index} color='white' style={{ borderColor: 'rgba(0,0,0,0.06)' }} size='small'>
                {tag.text}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </Card>
  );
};

export default ModelBasicInfo;
