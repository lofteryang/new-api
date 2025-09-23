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

import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Divider,
  Row,
  Col,
  Avatar,
  Badge,
  Spin,
  SideSheet,
  Steps,
  Tabs,
  Toast,
  Layout,
  ImagePreview
} from '@douyinfe/semi-ui';
import { 
  IconSearch, 
  IconPlay, 
  IconCode,
  IconChevronLeft,
  IconChevronRight,
  IconStar
} from '@douyinfe/semi-icons';
import { API, calculateModelPrice, formatPriceInfo } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { getLobeHubIcon } from '../../helpers/render';
import SelectableButtonGroup from '../../components/common/ui/SelectableButtonGroup';
import PricingSidebar from '../../components/table/model-pricing/layout/PricingSidebar';
import PricingContent from '../../components/table/model-pricing/layout/content/PricingContent';
import ModelDetailSideSheet from '../../components/table/model-pricing/modal/ModelDetailSideSheet';
import { useModelPricingData } from '../../hooks/model-pricing/useModelPricingData';
import { useIsMobile } from '../../hooks/common/useIsMobile';

const { Title, Text, Paragraph } = Typography;

// ModelMarket 页面内部样式
const styles = {
  container: {
    width: '100%',
    margin: 0,
    padding: '0 24px'
  },
  modelMarketContainer: {
    position: 'relative',
    
    width: '100%',
    opacity: 1,
    borderRadius: '20px',
    background: '#ffffff',
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: '#ffffff'
  },
  featuredModelSection: {
    marginBottom: '24px'
  },
  featuredCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
    transition: 'transform 0.3s ease'
  },
  modelList: {
 
  },
  modelCard: {
    transition: 'all 0.3s ease',
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'white',
  },
  modelCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)'
  },
  searchInput: {
    width: '300px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#333'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  // 轮播图样式
  // 轮播图样式（调整层级，使其在底层）
  cardContent: {
    position: 'relative',
    height: '100%',
    margin: 0,
    padding: 0,
    '& .semi-card-header, & .semi-card-body': {
      padding: '0px !important'
    }
  },
  carouselContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 0,
    zIndex: 1
  },
  carouselSlide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transition: 'opacity 0.5s ease-in-out',
    opacity: 0
  },
  carouselSlideActive: {
    opacity: 1
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 0
  },
  // 输入框区域样式（置于轮播图上方）
  inputContainer: {
    position: 'absolute',
    bottom: '20px',
    left: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 10
  },
  modelInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  modelLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px', 
    overflow:'hidden',
  },
  modelName: {
    fontWeight: 600,
    color: 'white',
    minWidth: '120px'
  },
  promptInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '16px',
    padding: '8px 16px',
    fontSize: '14px',
    outline: 'none',
    color: '#333'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  submitButton: {
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '16px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  apiButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    borderRadius: '16px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  // 轮播指示器样式
  carouselIndicators: {
    position: 'absolute',
    bottom: '8px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '6px'
  },
  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  indicatorActive: {
    backgroundColor: 'white',
    width: '20px',
    borderRadius: '4px'
  },
  // ===== API 接入抽屉（高端简约风样式） =====
  intakeContainer: {
    background: '#fcfcfd',
    padding: '8px 8px 0 8px'
  },
  intakeCard: {
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 16,
    boxShadow: '0 6px 22px rgba(0,0,0,0.06)',
    background: '#ffffff'
  },
  intakeTitle: {
    marginBottom: 8,
    letterSpacing: 0.2,
    fontWeight: 600,
    color: '#0f172a'
  },
  intakeSubtle: {
    color: '#64748b'
  },
  codeBlock: {
    background: '#0f172a',
    color: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)'
  },
  footerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    borderTop: '1px solid rgba(0,0,0,0.06)',
    paddingTop: 12
  },
  primaryBtn: {
    borderRadius: 999,
    padding: '8px 16px'
  },
  ghostBtn: {
    borderRadius: 999
  }
};

const ModelMarket = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [apiDrawerVisible, setApiDrawerVisible] = useState(false);
  const [apiDrawerStep, setApiDrawerStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [drawerModel, setDrawerModel] = useState(null);
  const pricingData = useModelPricingData();
  const isMobile = useIsMobile();
  
  // 轮播图状态
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [carouselData, setCarouselData] = useState([
    {
      url: 'https://i.imgs.ovh/2025/09/22/7bcJ59.png',
      model: 'gemini-2.5-pro',
      text: ['帮我做一份简历','帮我写一份文档'],
      modelLogo: 'https://i.imgs.ovh/2025/09/22/7bfKYA.png'
    },
     {
      url: 'https://i.imgs.ovh/2025/09/22/7bcJ59.png',
      model: 'gemini-2.5-pro-c',
      text:['帮我生成一张图片'],
      modelLogo: 'https://i.imgs.ovh/2025/09/22/7bfKYA.png'
    },
  ]); // 默认数据，API请求成功后会被覆盖
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [models, setModels] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupRatio, setGroupRatio] = useState({});
  const [statusState] = useContext(StatusContext);

  // 价格显示相关
  const priceRate = useMemo(
    () => statusState?.status?.price ?? 1,
    [statusState],
  );
  const usdExchangeRate = useMemo(
    () => statusState?.status?.usd_exchange_rate ?? priceRate,
    [statusState, priceRate],
  );

  // 价格显示函数
  const displayPrice = (usdPrice) => {
    const priceInUSD = usdPrice;
    const priceInCNY = priceInUSD * usdExchangeRate;
    return `¥${priceInCNY.toFixed(3)}`;
  };

  // 加载模型数据
  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/pricing');
      const { success, data, vendors, group_ratio } = res.data;
      
      if (success) {
        // 构建供应商映射
        const vendorMap = {};
        if (Array.isArray(vendors)) {
          vendors.forEach((v) => {
            vendorMap[v.id] = v;
          });
        }
        
        // 处理模型数据
        const processedModels = data.map((model, index) => {
          const vendor = vendorMap[model.vendor_id];
          
          // 生成模型描述
          const generateDescription = (modelName, vendor) => {
            const vendorName = vendor?.name || 'Unknown';
            if (modelName.includes('gemini')) {
              return `Google ${modelName} 多模态大语言模型，支持文本、图像等多种输入格式`;
            } else if (modelName.includes('deepseek')) {
              return `DeepSeek ${modelName} 高性能语言模型，在推理和代码生成方面表现优异`;
            } else {
              return `${vendorName} 提供的 ${modelName} 语言模型`;
            }
          };
          
          // 计算价格信息 - 使用最优分组（倍率最低的分组）
          const priceData = calculateModelPrice({
            record: model,
            selectedGroup: 'all', // 选择最优分组
            groupRatio: group_ratio,
            tokenUnit: 'M',
            displayPrice,
            currency: 'CNY',
          });
          
          return {
            id: model.model_name,
            key: model.model_name,
            name: model.model_name,
            model_name: model.model_name,
            description: generateDescription(model.model_name, vendor),
            provider: vendor?.name || 'Unknown',
            vendor_name: vendor?.name || 'Unknown',
            vendor_icon: vendor?.icon,
            vendor_id: model.vendor_id,
            model_ratio: model.model_ratio,
            completion_ratio: model.completion_ratio,
            quota_type: model.quota_type,
            enable_groups: model.enable_groups || [],
            supported_endpoint_types: model.supported_endpoint_types || [],
            featured: index === 0, // 第一个模型作为首推
            group: model.enable_groups?.[0] || 'default',
            // 价格信息
            priceData: priceData,
            promptPrice: priceData.inputPrice || priceData.price,
            completionPrice: priceData.completionPrice || priceData.price,
            usedGroup: priceData.usedGroup,
            usedGroupRatio: priceData.usedGroupRatio,
          };
        });

        setModels(processedModels);
        setVendors(vendors || []);
        setGroupRatio(group_ratio || {});
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有供应商并计算每个供应商的模型数量
  const providers = useMemo(() => {
    const providerSet = new Set(models.map(model => model.provider));
    const allProviders = ['All', ...providerSet];
    return allProviders;
  }, [models]);
  
  // 计算每个供应商的模型数量
  const getProviderCount = useCallback(
    (provider) => {
      if (provider === 'All') {
        return models.length;
      }
      return models.filter(model => model.provider === provider).length;
    },
    [models],
  );
  
  // 生成供应商选项（包含图标和模型数量）
  const providerItems = useMemo(() => {
    const vendorIcons = new Map();
    
    // 收集供应商图标
    models.forEach(model => {
      if (model.vendor_icon && !vendorIcons.has(model.provider)) {
        vendorIcons.set(model.provider, model.vendor_icon);
      }
    });
    
    const result = [
      {
        value: 'All',
        label: t('全部'),
        tagCount: getProviderCount('All'),
        disabled: models.length === 0,
      },
    ];
    
    // 添加所有供应商
    providers.slice(1).forEach(provider => {
      const count = getProviderCount(provider);
      const icon = vendorIcons.get(provider);
      result.push({
        value: provider,
        label: provider,
        icon: icon ? getLobeHubIcon(icon, 16) : null,
        tagCount: count,
        disabled: count === 0,
      });
    });
    
    return result;
  }, [providers, getProviderCount, t, models]);

  // 过滤模型
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (model.tags && model.tags.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesProvider = selectedProvider === 'All' || model.provider === selectedProvider;
      return matchesSearch && matchesProvider;
    });
  }, [models, searchTerm, selectedProvider]);

  // 获取首推模型
  const featuredModel = useMemo(() => {
    return models.find(model => model.featured) || models[0] || {
      name: 'Loading...',
      description: '正在加载模型信息...',
      promptPrice: '¥0.000',
      completionPrice: '¥0.000',
      provider: 'Loading',
      group: 'Loading',
      avatar: '🤖'
    };
  }, [models]);
  
  // 加载推荐模型数据
  const loadRecommendModels = async () => {
    try {
      const res = await API.get('/api/pricing/recommend');
      const { success, data } = res.data;
      if (success && data && Array.isArray(data)) {
        setCarouselData(data);
        // 重置状态
        setCurrentSlide(0);
        setCurrentTextIndex(0);
        if (data.length > 0) {
          setPrompt(data[0]?.text?.[0] || '');
        }
      }
    } catch (error) {
      console.error('Failed to load recommend models:', error);
      // 保持使用默认数据
    }
  };
  
  // 自动轮播逻辑
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % carouselData.length;
        // 切换轮播图时重置文本索引
        setCurrentTextIndex(0);
        return nextSlide;
      });
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [carouselData.length]);
  
  // 文本上下翻动逻辑
  useEffect(() => {
    const currentSlideData = carouselData[currentSlide];
    if (!currentSlideData || !Array.isArray(currentSlideData.text) || currentSlideData.text.length <= 1) {
      // 如果当前slide的text不是数组或者只有一个元素，则不需要翻动
      setPrompt(currentSlideData?.text?.[0] || '');
      return;
    }
    
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % currentSlideData.text.length);
    }, 2000);
    
    return () => clearInterval(textInterval);
  }, [currentSlide, carouselData]);
  
  // 更新当前显示的提示文本
  useEffect(() => {
    const currentSlideData = carouselData[currentSlide];
    if (currentSlideData && Array.isArray(currentSlideData.text)) {
      setPrompt(currentSlideData.text[currentTextIndex] || '');
    }
  }, [currentSlide, currentTextIndex, carouselData]);
  
  // 手动切换轮播图
  const goToSlide = (index) => {
    setCurrentSlide(index);
    setPrompt(carouselData[index]?.text || '');
  };
  
  // 提交按钮处理
  const handleSubmit = () => {
    // 实现提交逻辑
    console.log('提交的内容:', prompt);
  };
  
  // 抽屉：获取 API Key
  const fetchApiKey = async () => {
    setApiKeyLoading(true);
    try {
      const res = await API.get('/api/user/token');
      const token = res?.data?.data || res?.data?.token || res?.data;
      if (token) {
        setApiKey(token);
      } else {
        Toast.warning('未获取到 API Key，请先登录或前往控制台创建');
      }
    } catch (e) {
      Toast.error('获取 API Key 失败，请先登录');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || '');
      Toast.success('已复制到剪贴板');
    } catch (e) {
      Toast.error('复制失败');
    }
  };

  const apiBaseUrl = `${window.location.origin}`;
  const defaultModelName = drawerModel?.model_name || drawerModel?.name || (carouselData[0]?.model || 'gpt-4o-mini');

  // 组件挂载时加载数据
  useEffect(() => {
    loadModels();
    loadRecommendModels();
  }, []);

  // 处理API接入
  const handleApiAccess = (model) => {
    setDrawerModel(model || null);
    setApiDrawerVisible(true);
    setApiDrawerStep(0);
    fetchApiKey();
  };

  // 处理立即体验
  const handleTryNow = (model) => {
    // 这里可以跳转到聊天页面或者playground
    console.log('立即体验:', model.name);
  };

  // 顶部轮播的“API接入”按钮：打开与列表相同的模型详情抽屉
  const openCarouselModelDetail = () => {
    const modelName = carouselData[currentSlide]?.model;
    if (!modelName) {
      Toast.warning('未找到当前模型');
      return;
    }
    const allModels = pricingData?.models || [];
    let target = allModels.find(m => m?.model_name === modelName || m?.name === modelName);
    if (!target) {
      const lower = modelName.toLowerCase();
      target = allModels.find(m => (m?.model_name || '').toLowerCase() === lower || (m?.name || '').toLowerCase() === lower);
    }
    if (!target) {
      const lower = modelName.toLowerCase();
      target = allModels.find(m => (m?.model_name || '').toLowerCase().includes(lower) || (m?.name || '').toLowerCase().includes(lower));
    }
    if (target && typeof pricingData?.openModelDetail === 'function') {
      pricingData.openModelDetail(target);
    } else {
      Toast.warning('未找到该模型，请稍后重试');
    }
  };

  return (
    <div className='mt-[60px] px-2' style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* <h1 style={styles.sectionTitle}>首推模型</h1> */}
      <div style={styles.modelMarketContainer}>
      <div style={styles.container}>
      {/* 顶部首推模型 */}
      <div style={styles.featuredModelSection}>
        <div 
          style={{
            ...styles.featuredCard,
            width: '100%',
            aspectRatio: isMobile ? '16/9' : '1400/374',
            padding: 0,
            margin: 0,
            borderRadius: isMobile ? '12px' : '16px',
            overflow: 'hidden'
          }}
        >           
            {/* 内容容器 - 用于管理层级 */}
            <div style={styles.cardContent}>
              {/* 轮播图容器 - 底层 */}
              <div style={{
                ...styles.carouselContainer,
                borderRadius: isMobile ? 0 : 0
              }}>
                {carouselData.map((item, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.carouselSlide,
                      ...(index === currentSlide && styles.carouselSlideActive)
                    }}
                  >
                    <img 
                      src={item.url} 
                      alt={`轮播图 ${index + 1}`}
                      style={{
                        ...styles.carouselImage,
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
                
                {/* 轮播指示器 */}
                <div style={{
                  ...styles.carouselIndicators,
                  bottom: isMobile ? '6px' : '8px'
                }}>
                  {carouselData.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        ...styles.indicator,
                        width: isMobile ? '6px' : styles.indicator.width,
                        height: isMobile ? '6px' : styles.indicator.height,
                        ...(index === currentSlide && styles.indicatorActive)
                      }}
                      onClick={() => goToSlide(index)}
                      aria-label={`转到轮播图 ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* 输入框区域 - 置于上层 */}
              <div style={{
                ...styles.inputContainer,
                bottom: isMobile ? '12px' : '20px',
                padding: isMobile ? '6px 12px' : '8px 16px',
                gap: isMobile ? '8px' : '12px'
              }}>
            <div style={{
              ...styles.modelInfo,
              gap: isMobile ? '6px' : styles.modelInfo.gap
            }}>
              <div style={{
                ...styles.modelLogo,
                width: isMobile ? '28px' : styles.modelLogo.width,
                height: isMobile ? '28px' : styles.modelLogo.height,
                borderRadius: isMobile ? '6px' : styles.modelLogo.borderRadius
              }}>
                <img 
                  src={carouselData[currentSlide]?.modelLogo || '/logo.png'} 
                  alt="Model Logo" 
                  style={{width: '100%', height: '100%', objectFit: 'contain'}}
                />
              </div>
              <span style={{
                ...styles.modelName,
                fontSize: isMobile ? '12px' : '14px',
                minWidth: isMobile ? 'auto' : styles.modelName.minWidth
              }}>
                {carouselData[currentSlide]?.model || 'gemini-2.5-pro'}
              </span>
            </div>
            
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入内容..."
              style={{
                ...styles.promptInput,
                padding: isMobile ? '6px 12px' : styles.promptInput.padding,
                fontSize: isMobile ? '13px' : styles.promptInput.fontSize
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            
            <div style={{
              ...styles.actionButtons,
              gap: isMobile ? '6px' : styles.actionButtons.gap
            }}>
              
              <button 
                      style={{
                        ...styles.apiButton,
                        padding: isMobile ? '6px 12px' : styles.apiButton.padding,
                        borderRadius: isMobile ? '12px' : styles.apiButton.borderRadius
                      }}
                       onClick={openCarouselModelDetail}
                      title="API接入"
                    >
                      API接入
                    </button>
            </div>
            </div>
            </div>
          </div>
        </div>

      {/* 模型列表 + 定价筛选侧边栏（复用 Pricing 侧边栏） */}
      <div className="model-list-section" style={{ marginTop: 24 }}>
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: '218px 1fr', gap: 24 }}>
            <div>
              <PricingSidebar {...pricingData} />
            </div>
            <div>
              <PricingContent {...pricingData} isMobile={false} sidebarProps={pricingData} />
            </div>
          </div>
        )}
        {isMobile && (
          <div>
            <PricingContent {...pricingData} isMobile={true} sidebarProps={pricingData} />
          </div>
        )}
      </div>
      </div>
      
      {/* API 接入抽屉（SideSheet） */}
      <SideSheet
        title={'API 接入向导'}
        placement='right'
        width={'50%'}
        visible={apiDrawerVisible}
        onCancel={() => setApiDrawerVisible(false)}
      >
        <div style={styles.intakeContainer}>
          <Steps current={apiDrawerStep} style={{ marginBottom: 24 }}>
            <Steps.Step title='获取 API Key' />
            <Steps.Step title='快速接入测试' />
            <Steps.Step title='完成' />
          </Steps>

          {apiDrawerStep === 0 && (
            <div>
              <Card style={{ marginBottom: 16, ...styles.intakeCard }}>
                <Typography.Title heading={5} style={styles.intakeTitle}>API 基本信息</Typography.Title>
                <Space vertical align='start' spacing={8}>
                  <div>
                    <Text style={styles.intakeSubtle}>API 基础地址</Text>
                    <Space>
                      <Text code>{apiBaseUrl}</Text>
                      <Button size='small' onClick={() => handleCopy(apiBaseUrl)} style={styles.ghostBtn}>复制</Button>
                    </Space>
                  </div>
                  <div>
                    <Text style={styles.intakeSubtle}>兼容协议</Text>
                    <Text>OpenAI（示例 /v1/chat/completions）</Text>
                  </div>
                </Space>
              </Card>

              <Card style={styles.intakeCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Typography.Title heading={5} style={styles.intakeTitle}>您的 API Key</Typography.Title>
                    <Text style={styles.intakeSubtle}>若为空，请登录后前往 控制台-令牌 创建，或点击下方按钮获取</Text>
                  </div>
                  <div>
                    <Button loading={apiKeyLoading} onClick={fetchApiKey} theme='solid' style={styles.primaryBtn}>获取/刷新</Button>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input value={apiKey} readOnly placeholder='sk-***（未获取）' style={{ flex: 1, height: 40, borderRadius: 12 }}></Input>
                  <Button onClick={() => handleCopy(apiKey)} disabled={!apiKey} style={styles.ghostBtn}>复制</Button>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button theme='light' onClick={() => setApiDrawerStep(1)} style={styles.ghostBtn}>已获取，去测试</Button>
                </div>
              </Card>
            </div>
          )}

          {apiDrawerStep === 1 && (
            <div>
              <Card style={{ marginBottom: 16, ...styles.intakeCard }}>
                <Typography.Title heading={5} style={styles.intakeTitle}>选择模型</Typography.Title>
                <Space>
                  <Text>当前模型：</Text>
                  <Text strong>{defaultModelName}</Text>
                </Space>
              </Card>
              <Card style={styles.intakeCard}>
                <Typography.Title heading={6} style={styles.intakeTitle}>cURL 示例</Typography.Title>
                <pre style={styles.codeBlock}>
{("curl -X POST '" + apiBaseUrl + "/v1/chat/completions' \\") +
("\n  -H 'Authorization: Bearer " + (apiKey || 'YOUR_API_KEY') + "' \\") +
("\n  -H 'Content-Type: application/json' \\") +
("\n  -d '{\"model\":\"" + defaultModelName + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'")}
                </pre>
                <Button style={{ marginTop: 12, ...styles.primaryBtn }} theme='solid' onClick={() => handleCopy("curl -X POST '" + apiBaseUrl + "/v1/chat/completions' -H 'Authorization: Bearer " + (apiKey || 'YOUR_API_KEY') + "' -H 'Content-Type: application/json' -d '{\"model\":\"" + defaultModelName + "\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'")}>复制命令</Button>
                <div style={{ marginTop: 12 }}>
                  <Button theme='light' onClick={() => setApiDrawerStep(2)} style={styles.ghostBtn}>我已测试，下一步</Button>
                </div>
              </Card>
            </div>
          )}

          {apiDrawerStep === 2 && (
            <div>
              <Card>
                <Typography.Title heading={5} style={{ marginBottom: 12 }}>完成接入</Typography.Title>
                <Space vertical>
                  <Text>您已完成快速接入测试，建议前往文档查看更多用法。</Text>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={() => window.open('/docs', '_blank')}>查看文档</Button>
                    <Button theme='solid' onClick={() => setApiDrawerVisible(false)}>开始使用</Button>
                  </div>
                </Space>
              </Card>
            </div>
          )}
        </div>
        {/* 页脚操作按钮 */}
        <div style={styles.footerBar}>
          <div>
            {apiDrawerStep > 0 && (
              <Button onClick={() => setApiDrawerStep((s) => Math.max(0, s - 1))} style={styles.ghostBtn}>上一步</Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {apiDrawerStep < 2 && (
              <Button theme='solid' onClick={() => setApiDrawerStep((s) => Math.min(2, s + 1))} style={styles.primaryBtn}>下一步</Button>
            )}
            {apiDrawerStep === 2 && (
              <Button theme='solid' onClick={() => setApiDrawerVisible(false)} style={styles.primaryBtn}>完成</Button>
            )}
          </div>
        </div>
      </SideSheet>
      {/* 与 Pricing 页一致：图片预览 + 模型详情抽屉 */}
      <ImagePreview
        src={pricingData.modalImageUrl}
        visible={pricingData.isModalOpenurl}
        onVisibleChange={(visible) => pricingData.setIsModalOpenurl(visible)}
      />

      <ModelDetailSideSheet
        visible={pricingData.showModelDetail}
        onClose={pricingData.closeModelDetail}
        modelData={pricingData.selectedModel}
        groupRatio={pricingData.groupRatio}
        usableGroup={pricingData.usableGroup}
        currency={pricingData.currency}
        tokenUnit={pricingData.tokenUnit}
        displayPrice={pricingData.displayPrice}
        showRatio={pricingData.showRatio}
        vendorsMap={pricingData.vendorsMap}
        endpointMap={pricingData.endpointMap}
        autoGroups={pricingData.autoGroups}
        t={pricingData.t}
      />
    </div>
    </div>
  );
};

export default ModelMarket;
