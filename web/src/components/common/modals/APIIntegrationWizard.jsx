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

import React, { useState } from 'react';
import { Modal, Steps, Button, Input, Typography, Card, message } from '@douyinfe/semi-ui';
import { IconCopy, IconCheckCircle, IconExternalLink, IconCode, IconLock, IconAlertCircle, IconRefresh, IconRocket, IconPlusCircle } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

const APIIntegrationWizard = ({ visible, onClose, selectedModel, t }) => {
  const [step, setStep] = useState(0);
  const [apiKeys, setApiKeys] = useState([
    { name: 'api-key-20250219115005', key: '**********@', creator: '0' }
  ]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [testStatus, setTestStatus] = useState(''); // 'idle', 'loading', 'success', 'error'
  const [testMessage, setTestMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // 模拟API密钥生成
  const generateApiKey = () => {
    // 在实际应用中，这应该调用后端API生成密钥
    const timestamp = new Date().getTime();
    const newKey = {
      name: `api-key-${timestamp}`,
      key: `sk-${'x'.repeat(32)}@`,
      creator: '0'
    };
    setApiKeys([...apiKeys, newKey]);
    setSelectedKey(newKey.name);
    message.success(t('API密钥已生成'));
  };

  // 复制API密钥到剪贴板
  const copyToClipboard = () => {
    if (selectedKey) {
      // 在实际应用中，这里应该获取完整的密钥
      const fullKey = `sk-${'x'.repeat(48)}`;
      navigator.clipboard.writeText(fullKey).then(() => {
        setCopied(true);
        message.success(t('已复制到剪贴板'));
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // 模拟API接入测试
  const testApiConnection = () => {
    if (!selectedKey) {
      message.error(t('请先选择或生成API Key'));
      return;
    }

    setTestStatus('loading');
    setTestMessage(t('正在测试连接...'));

    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟成功响应
      setTestStatus('success');
      setTestMessage(t('API连接测试成功！您的密钥已验证有效。'));
    }, 2000);
  };

  // 重置向导状态
  const resetWizard = () => {
    setStep(0);
    setApiKey('');
    setCopied(false);
    setTestStatus('');
    setTestMessage('');
  };

  // 处理模态框关闭
  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // 处理下一步
  const handleNext = () => {
    if (step === 0 && !selectedKey) {
      message.warning(t('请先选择或生成API Key'));
      return;
    }
    if (step === 1 && testStatus !== 'success') {
      message.warning(t('请先完成API连接测试'));
      return;
    }
    setStep(step + 1);
  };

  // 处理上一步
  const handlePrev = () => {
    setStep(step - 1);
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="api-key-step">
            <div style={{ 
              background: '#f9fafc', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px', 
              borderLeft: '4px solid #ff7e42' 
            }}>
              <Text type="secondary">
                {t('API Key 是访问火山方舟大模型服务的重要凭证，长期有效。请妥善保管并定期更换密钥，避免公开共享，以防安全风险和资金损失。')}
              </Text>
            </div>
            
            <div style={{
              width: '100%', 
              borderCollapse: 'collapse', 
              margin: '20px 0', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.05)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f4f8' }}>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, color: '#2c3e50' }}>
                      {t('名称')}
                    </th>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, color: '#2c3e50' }}>
                      {t('API Key')}
                    </th>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: 600, color: '#2c3e50' }}>
                      {t('创建人')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key, index) => (
                    <tr 
                      key={index} 
                      style={{
                        borderBottom: index < apiKeys.length - 1 ? '1px solid #f0f4f8' : 'none',
                        cursor: 'pointer',
                        backgroundColor: selectedKey === key.name ? '#f9fafc' : 'white'
                      }}
                      onClick={() => setSelectedKey(key.name)}
                    >
                      <td style={{ padding: '15px 20px', textAlign: 'left' }}>{key.name}</td>
                      <td style={{ padding: '15px 20px', textAlign: 'left' }}>
                        <span style={{ fontFamily: 'monospace', color: '#ff7e42' }}>{key.key}</span>
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'left' }}>{key.creator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Button
              onClick={generateApiKey}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#ff7e42',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                marginTop: '10px'
              }}
              icon={<IconPlusCircle />}
            >
              {t('创建 API Key')}
            </Button>
          </div>
        );
      case 1:
        return (
          <div className="test-connection-step">
            <div style={{ 
              background: '#f9fafc', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px', 
              borderLeft: '4px solid #ff7e42' 
            }}>
              <Text type="secondary">
                {t('使用以下代码示例快速测试 API 接入，将 YOUR_API_KEY 替换为您的实际 API 密钥。')}
              </Text>
            </div>
            
            <div style={{
              background: '#2c3e50',
              color: '#f8f8f2',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              overflowX: 'auto',
              fontFamily: 'monospace'
            }}>
              <pre>
                <code>
{`# 火山方舟 API 请求示例
import requests

url = "https://api.volcengine.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "model": "your_model_name",
    "messages": [
        {"role": "user", "content": "你好，请介绍一下你自己"}
    ]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`}
                </code>
              </pre>
            </div>
            
            <div className="flex justify-center">
              <Button
                type="primary"
                size="large"
                onClick={testApiConnection}
                loading={testStatus === 'loading'}
                disabled={!selectedKey || testStatus === 'loading'}
                style={{ 
                  borderRadius: '8px',
                  minWidth: '160px',
                  height: '40px',
                  background: '#ff7e42',
                  borderColor: '#ff7e42'
                }}
                icon={<IconCode />}
              >
                {testStatus === 'loading' ? t('测试中...') : t('开始测试')}
              </Button>
            </div>
            
            {testStatus && (
              <div 
                style={{
                  marginTop: '20px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: testStatus === 'success' ? '#b7eb8f' : '#ffccc7',
                  backgroundColor: testStatus === 'success' ? '#f6ffed' : '#fff2f0',
                  padding: '16px'
                }}
              >
                <div className="flex items-start gap-3">
                  {testStatus === 'success' ? (
                    <IconCheckCircle size={24} style={{ color: '#52c41a', marginTop: '2px' }} />
                  ) : testStatus === 'error' ? (
                    <IconAlertCircle size={24} style={{ color: '#ff4d4f', marginTop: '2px' }} />
                  ) : (
                    <IconAlertCircle size={24} style={{ color: '#faad14', marginTop: '2px' }} />
                  )}
                  <Text style={{ color: testStatus === 'success' ? '#52c41a' : '#ff4d4f' }}>
                    {testMessage}
                  </Text>
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="completion-step">
            <div style={{ 
              background: '#f9fafc', 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px', 
              borderLeft: '4px solid #ff7e42' 
            }}>
              <Text type="secondary">
                {t('创建应用可以帮助您更好地管理和跟踪 API 使用情况，设置访问权限和限制。')}
              </Text>
            </div>
            
            <div style={{
              background: '#2c3e50',
              color: '#f8f8f2',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              overflowX: 'auto',
              fontFamily: 'monospace'
            }}>
              <pre>
                <code>
{`# 创建应用示例代码
# 此步骤为可选，您可以直接使用API Key调用服务

# 使用控制台创建应用：
# 1. 登录火山方舟控制台
# 2. 进入"应用管理"页面
# 3. 点击"创建应用"
# 4. 填写应用信息并保存`}
                </code>
              </pre>
            </div>
            
            <div className="flex justify-center mt-6">
              <div className="flex gap-4">
                <Button
                  type="default"
                  onClick={() => {
                    window.open('https://api.example.com/docs', '_blank');
                  }}
                  icon={<IconExternalLink />}
                  style={{ borderRadius: '8px' }}
                >
                  {t('控制台')}
                </Button>
                <Button
                  type="primary"
                  style={{ 
                    borderRadius: '8px',
                    background: '#ff7e42',
                    borderColor: '#ff7e42'
                  }}
                >
                  {t('文档')}
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <IconRocket style={{ fontSize: '24px', color: '#ff7e42' }} />
          <span>{t('火山方舟 API 接入指南')}</span>
        </div>
      }
      visible={visible}
      onCancel={handleClose}
      footer={
        <div className="flex justify-end gap-4">
          {step > 0 && (
            <Button onClick={handlePrev}>
              {t('上一步')}
            </Button>
          )}
          {step < 2 ? (
            <Button
              type="primary"
              onClick={handleNext}
              disabled={
                (step === 0 && !selectedKey) || 
                (step === 1 && testStatus !== 'success')
              }
              style={{
                background: '#ff7e42',
                borderColor: '#ff7e42'
              }}
            >
              {t('下一步')}
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleClose}
              style={{
                background: '#ff7e42',
                borderColor: '#ff7e42'
              }}
            >
              {t('完成')}
            </Button>
          )}
        </div>
      }
      width={"50%"}
      centered={true}
      onVisibleChange={(newVisible) => {
        if (!newVisible) {
          resetWizard();
        }
      }}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'white'
      }}
      headerStyle={{
        background: 'linear-gradient(90deg, #2c3e50 0%, #4a6580 100%)',
        color: 'white',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        padding: '25px 30px'
      }}
      bodyStyle={{
        padding: '30px'
      }}
    >
      <Steps 
        type="basic" 
        current={step} 
        size="small" 
        style={{ marginBottom: '24px' }}
      >
        <Steps.Step 
          title={t('STEP 1 获取 API KEY')} 
          description={t('生成并复制您的API密钥')} 
        />
        <Steps.Step 
          title={t('STEP 2 快速接入测试')} 
          description={t('测试API连接是否正常')} 
        />
        <Steps.Step 
          title={
            <span>
              {t('STEP 3 创建应用')}
              <span style={{
                background: '#e4edf5',
                color: '#4a6580',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                {t('可选')}
              </span>
            </span>
          } 
          description={t('创建应用以更好地管理API使用')} 
        />
      </Steps>

      {renderStepContent()}
    </Modal>
  );
};

export default APIIntegrationWizard;