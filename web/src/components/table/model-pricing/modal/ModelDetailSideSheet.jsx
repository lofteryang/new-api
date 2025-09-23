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
import { SideSheet, Typography, Button, Card, Avatar } from '@douyinfe/semi-ui';
import { IconLink } from '@douyinfe/semi-icons';
import { IconClose } from '@douyinfe/semi-icons';

import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import ModelHeader from './components/ModelHeader';
import ModelBasicInfo from './components/ModelBasicInfo';
import ModelEndpoints from './components/ModelEndpoints';
import ModelPricingTable from './components/ModelPricingTable';

const { Text } = Typography;

const ModelDetailSideSheet = ({
  visible,
  onClose,
  modelData,
  groupRatio,
  currency,
  tokenUnit,
  displayPrice,
  showRatio,
  usableGroup,
  vendorsMap,
  endpointMap,
  autoGroups,
  t,
}) => {
  const isMobile = useIsMobile();

  return (
    <SideSheet
      placement='right'
      title={
        <ModelHeader modelData={modelData} vendorsMap={vendorsMap} t={t} />
      }
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--semi-color-border)',
      }}
      visible={visible}
      width={isMobile ? '100%' : 600}
      closeIcon={
        <Button
          className='semi-button-tertiary semi-button-size-small semi-button-borderless'
          type='button'
          icon={<IconClose />}
          onClick={onClose}
        />
      }
      onCancel={onClose}
    >
      <div className='p-3 md:p-5 space-y-4 md:space-y-5'>
        {!modelData && (
          <div className='flex justify-center items-center py-10'>
            <Text type='secondary'>{t('加载中...')}</Text>
          </div>
        )}
        {modelData && (
          <>
            <ModelBasicInfo
              modelData={modelData}
              vendorsMap={vendorsMap}
              t={t}
            />
            {/* API 地址卡片（来自 localStorage.status 的 api_info 列表） */}
            {(() => {
              let apiInfo = [];
              try {
                const raw = localStorage.getItem('status');
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed?.api_info)) apiInfo = parsed.api_info;
                }
              } catch (_) {}
              if (!Array.isArray(apiInfo) || apiInfo.length === 0) return null;
              return (
                <Card className='!rounded-xl !shadow-none !border' style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <div className='mb-3'>
                    <div className='flex items-center gap-2 mb-1'>
                      <div
                        className='w-6 h-6 rounded-full flex items-center justify-center'
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(34,197,94,0.15) 100%)',
                          border: '1px solid rgba(0,0,0,0.06)'
                        }}
                      >
                        <IconLink />
                      </div>
                      <Text className='text-base font-semibold'>{t('API地址')}</Text>
                    </div>
                    <div className='text-xs text-gray-500'>
                      {t('可用的 API 路由与访问地址')}
                    </div>
                  </div>
                  <div className='space-y-3'>
                    {apiInfo.map((api) => (
                      <div key={api.id} className='p-2 rounded-lg border' style={{ borderColor: 'var(--semi-color-border)' }}>
                        <div className='flex items-center justify-between gap-2 mb-1'>
                          <span className='text-sm font-medium break-all'>{api.route}</span>
                          <Button size='small' onClick={() => navigator.clipboard.writeText(api.url)}>
                            {t('复制')}
                          </Button>
                        </div>
                        <div className='text-semi-color-primary break-all cursor-pointer hover:underline' onClick={() => navigator.clipboard.writeText(api.url)}>
                          {api.url}
                        </div>
                        {api.description && (
                          <div className='text-xs text-gray-500 mt-1'>{api.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })()}
            <ModelEndpoints
              modelData={modelData}
              endpointMap={endpointMap}
              t={t}
            />
            <ModelPricingTable
              modelData={modelData}
              groupRatio={groupRatio}
              currency={currency}
              tokenUnit={tokenUnit}
              displayPrice={displayPrice}
              showRatio={showRatio}
              usableGroup={usableGroup}
              autoGroups={autoGroups}
              t={t}
            />
          </>
        )}
      </div>
    </SideSheet>
  );
};

export default ModelDetailSideSheet;
