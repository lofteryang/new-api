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
import SelectableButtonGroup from '../../../common/ui/SelectableButtonGroup';

const PricingDisplaySettings = ({
  showWithRecharge,
  setShowWithRecharge,
  currency,
  setCurrency,
  showRatio,
  setShowRatio,
  viewMode,
  setViewMode,
  tokenUnit,
  setTokenUnit,
  loading = false,
  t,
}) => {
  const items = [
    {
      value: 'tokenUnit',
      label: t('按K显示单位'),
    },
  ];

  const currencyItems = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'CNY', label: 'CNY (¥)' },
  ];

  const handleChange = (value) => {
    if (value === 'tokenUnit') {
      setTokenUnit(tokenUnit === 'K' ? 'M' : 'K');
    }
  };

  const getActiveValues = () => {
    const activeValues = [];
    if (tokenUnit === 'K') activeValues.push('tokenUnit');
    return activeValues;
  };

  return (
    <div>
      <SelectableButtonGroup
        title={t('显示设置')}
        items={items}
        activeValue={getActiveValues()}
        onChange={handleChange}
        withCheckbox
        collapsible={false}
        loading={loading}
        t={t}
      />

      {/* 精简：移除充值货币单位切换 */}
    </div>
  );
};

export default PricingDisplaySettings;
