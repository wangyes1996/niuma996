'use client';

import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  useTheme, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  Grid, 
  Card, 
  CardContent, 
  Alert, 
  Skeleton,
  AppBar,
  Toolbar,
  IconButton,
  Fade,
  Zoom,
  Slide,
  useMediaQuery,
  Fab,
  Tooltip,
  Divider,
  alpha
} from '@mui/material';
import { 
  ArrowRight as ArrowRightIcon, 
  Home as HomeIcon, 
  Info as InfoIcon, 
  Code as CodeIcon, 
  AccountBalanceWallet as AccountBalanceWalletIcon, 
  TrendingUp as TrendingUpIcon, 
  AttachMoney as AttachMoneyIcon, 
  ShowChart as ShowChartIcon, 
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // 状态管理
    const [accountBalance, setAccountBalance] = useState<any>(null);
    const [positions, setPositions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // AI分析状态
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [websocket, setWebsocket] = useState<EventSource | null>(null);
    
    // UI状态
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [fadeIn, setFadeIn] = useState<boolean>(false);

    // 获取币安账户信息
    const fetchAccountInfo = async () => {
      try {
        const response = await fetch('/api/binance/account');
        if (!response.ok) {
          throw new Error('获取账户信息失败');
        }
        const data = await response.json();
        
        setAccountBalance(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data.account)) {
            return data.account;
          }
          return prev;
        });
        
        setPositions(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data.positions)) {
            return data.positions;
          }
          return prev;
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取账户信息失败');
        console.error('获取账户信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      setFadeIn(true);
      fetchAccountInfo(); // 初始获取数据
      const interval = setInterval(fetchAccountInfo, 10000); // 设置10秒刷新间隔
      return () => clearInterval(interval); // 清理定时器
    }, []);

    // 格式化数字显示
    const formatNumber = (num: string | number) => {
      if (!num) return '0.00';
      return parseFloat(num.toString()).toFixed(2);
    };

    // 计算盈亏颜色
    const getProfitColor = (profit: string | number) => {
      const value = parseFloat(profit.toString());
      return value >= 0 ? 'success.main' : 'error.main';
    };

    // 触发AI分析
    const triggerAIAnalysis = async () => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAiAnalysis('');
      
      try {
        const response = await fetch(`/api/ai/mastra-analysis-ws?symbol=BTC`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // 处理SSE格式的数据
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';
          
          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const dataStr = message.slice(6);
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'chunk') {
                  setAiAnalysis(prev => prev + data.content);
                } else if (data.type === 'complete') {
                  setIsAnalyzing(false);
                  break;
                } else if (data.type === 'error') {
                  setAnalysisError(data.message);
                  setIsAnalyzing(false);
                  break;
                }
              } catch (parseError) {
                console.error('解析SSE数据失败:', parseError);
              }
            }
          }
        }
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'AI分析失败');
        setIsAnalyzing(false);
      }
    };

    // 清理WebSocket连接
    useEffect(() => {
      return () => {
        if (websocket) {
          websocket.close();
        }
      };
    }, [websocket]);

    // 账户概览卡片
    const OverviewCard = ({ title, value, unit, color, icon, description }: any) => (
      <Fade in={fadeIn} timeout={600}>
        <Card 
          sx={{ 
            height: '100%', 
            borderRadius: 4, 
            boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme => `0 12px 35px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {icon}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      ml: 1,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {title}
                  </Typography>
                </Box>
                <Typography 
                  variant="h5" 
                  fontWeight="700" 
                  sx={{ 
                    color: color || 'text.primary',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    mb: 0.5
                  }}
                >
                  {formatNumber(value)}
                  <Typography 
                    component="span" 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ ml: 0.5, fontWeight: 500 }}
                  >
                    {unit}
                  </Typography>
                </Typography>
                {description && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {description}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                }}
              >
                {icon}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );

    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景装饰 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            opacity: 0.5,
            zIndex: 0,
          }}
        />

        {/* Header */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            background: 'transparent',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: 1,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 3, 
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  mr: 2
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography 
                variant="h6" 
                fontWeight="700" 
                sx={{ 
                  color: 'text.primary',
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                数字资产管理系统
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="primary">
                <NotificationsIcon />
              </IconButton>
              <IconButton color="primary">
                <SettingsIcon />
              </IconButton>
              <IconButton color="primary">
                <AccountCircleIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 4, 
            position: 'relative', 
            zIndex: 1,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          {/* 错误提示 */}
          <Slide direction="down" in={!!error} mountOnEnter unmountOnExit>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 4,
                boxShadow: theme => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
                border: '1px solid',
                borderColor: 'error.light'
              }}
            >
              {error}
            </Alert>
          </Slide>

          {/* 账户概览 */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <DashboardIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
              <Typography 
                variant="h4" 
                fontWeight="700" 
                sx={{ 
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                账户概览
              </Typography>
            </Box>
            
            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3, 4].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item}>
                    <Skeleton 
                      variant="rectangular" 
                      height={140} 
                      sx={{ borderRadius: 4 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : accountBalance ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <OverviewCard
                    title="总保证金余额"
                    value={accountBalance.totalMarginBalance}
                    unit="USDT"
                    color="primary.main"
                    icon={<AttachMoneyIcon sx={{ fontSize: 24 }} />}
                    description="账户总保证金"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <OverviewCard
                    title="总钱包余额"
                    value={accountBalance.totalWalletBalance}
                    unit="USDT"
                    color="info.main"
                    icon={<AccountBalanceWalletIcon sx={{ fontSize: 24 }} />}
                    description="钱包总余额"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <OverviewCard
                    title="未实现盈亏"
                    value={accountBalance.totalUnrealizedProfit}
                    unit="USDT"
                    color={getProfitColor(accountBalance.totalUnrealizedProfit)}
                    icon={<TrendingUpIcon sx={{ fontSize: 24 }} />}
                    description="当前持仓盈亏"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <OverviewCard
                    title="可用余额"
                    value={accountBalance.availableBalance}
                    unit="USDT"
                    color="success.main"
                    icon={<ShowChartIcon sx={{ fontSize: 24 }} />}
                    description="可交易余额"
                  />
                </Grid>
              </Grid>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 4,
                  boxShadow: theme => `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                }}
              >
                暂无账户数据
              </Alert>
            )}
          </Box>

          {/* 持仓情况 */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <ShowChartIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
              <Typography 
                variant="h4" 
                fontWeight="700" 
                sx={{ 
                  color: 'text.primary',
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                持仓情况
              </Typography>
            </Box>
            
            {loading ? (
              <Card sx={{ borderRadius: 4, boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                </CardContent>
              </Card>
            ) : positions && positions.length > 0 ? (
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`,
                  overflow: 'hidden'
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          交易对
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          持仓数量
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          入场价格
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          标记价格
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          未实现盈亏
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          杠杆
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', py: 3, fontSize: '0.875rem' }}>
                          保证金类型
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.map((position: any, index: number) => (
                        <Fade 
                          key={position.symbol} 
                          in={fadeIn} 
                          timeout={600} 
                          style={{ transitionDelay: `${index * 100}ms` }}
                        >
                          <TableRow 
                            hover 
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <TableCell component="th" scope="row" sx={{ py: 3 }}>
                              <Typography fontWeight="600" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                                {position.symbol}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {position.positionAmt}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {position.entryPrice}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {position.markPrice}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Typography 
                                sx={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 600,
                                  color: getProfitColor(position.unrealizedProfit)
                                }}
                              >
                                {formatNumber(position.unrealizedProfit)} USDT
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Chip 
                                label={`${position.leverage}x`} 
                                size="small" 
                                color="primary" 
                                variant="filled" 
                                sx={{ 
                                  fontWeight: 600,
                                  backgroundColor: 'primary.main',
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 3 }}>
                              <Chip 
                                label={position.marginType} 
                                size="small" 
                                color={position.marginType === 'isolated' ? 'warning' : 'info'} 
                                variant="filled" 
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        </Fade>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 4,
                  boxShadow: theme => `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                }}
              >
                暂无持仓记录
              </Alert>
            )}
          </Box>

          {/* AI分析区域 */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AnalyticsIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                <Typography 
                  variant="h4" 
                  fontWeight="700" 
                  sx={{ 
                    color: 'text.primary',
                    fontSize: { xs: '1.5rem', sm: '2rem' }
                  }}
                >
                  AI市场分析
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={
                  isAnalyzing ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <RefreshIcon />
                  )
                }
                onClick={triggerAIAnalysis}
                disabled={isAnalyzing}
                sx={{
                  borderRadius: 3,
                  boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  px: 3,
                  py: 1.5,
                  fontWeight: 700,
                  '&:hover': {
                    boxShadow: theme => `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  '&.Mui-disabled': {
                    background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}) !important`,
                    color: 'white !important',
                    opacity: 1,
                    cursor: 'wait'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>{isAnalyzing ? '分析中' : '开始分析'}</Box>
                  {isAnalyzing && (
                    <Box component="span" sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>请稍候</Box>
                  )}
                </Box>
              </Button>
            </Box>
            
            <Slide direction="up" in={!!analysisError} mountOnEnter unmountOnExit>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 4,
                  boxShadow: theme => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                }}
              >
                {analysisError}
              </Alert>
            </Slide>
            
            {!isAnalyzing && !aiAnalysis && (
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`,
                  background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <InfoIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                    <Typography variant="h6" fontWeight="600" color="text.primary">
                      市场分析概览
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, color: 'text.primary', fontSize: '1rem' }}>
                      欢迎使用AI市场分析功能！点击右侧的"开始分析"按钮，系统将为您提供实时的加密货币市场分析。
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                      分析内容包括：
                    </Typography>
                    <Box component="ul" sx={{ pl: 4, mb: 3 }}>
                      <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.6, color: 'text.primary' }}>
                        技术指标分析 - RSI、MACD、布林带等
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.6, color: 'text.primary' }}>
                        市场趋势预测 - 多时间框架分析
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.6, color: 'text.primary' }}>
                        买卖信号建议 - 入场和出场点位
                      </Typography>
                      <Typography component="li" variant="body1" sx={{ mb: 1, lineHeight: 1.6, color: 'text.primary' }}>
                        风险评估 - 波动性和风险等级
                      </Typography>
                    </Box>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'grey.50', 
                      p: 3, 
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      分析结果将以Markdown格式展示，包含图表、表格和详细的文字说明。系统会自动结合您的持仓情况给出个性化建议。
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {isAnalyzing && (
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CircularProgress color="primary" size={24} sx={{ mr: 2 }} />
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                      分析中...请稍候
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'grey.50', 
                      p: 4, 
                      borderRadius: 3,
                      minHeight: 200,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      正在分析市场数据，请稍候...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {aiAnalysis && !isAnalyzing && (
              <Zoom in={true} timeout={600}>
                <Card 
                  sx={{ 
                    borderRadius: 4, 
                    boxShadow: theme => `0 8px 25px ${alpha(theme.palette.primary.main, 0.1)}`,
                    background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <AnalyticsIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        AI分析结果
                      </Typography>
                    </Box>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => (
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                mb: 2, 
                                color: 'text.primary',
                                fontWeight: 700,
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                              }} 
                              {...props} 
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                mb: 2, 
                                mt: 3, 
                                color: 'text.primary',
                                fontWeight: 600,
                                fontSize: { xs: '1.125rem', sm: '1.25rem' }
                              }} 
                              {...props} 
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                mb: 1.5, 
                                mt: 2, 
                                color: 'text.primary',
                                fontWeight: 600
                              }} 
                              {...props} 
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                mb: 2, 
                                lineHeight: 1.7, 
                                color: 'text.primary',
                                fontSize: '1rem'
                              }} 
                              {...props} 
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <Typography 
                              component="li" 
                              variant="body1" 
                              sx={{ 
                                mb: 1, 
                                lineHeight: 1.6, 
                                color: 'text.primary'
                              }} 
                              {...props} 
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <Typography 
                              component="strong" 
                              sx={{ 
                                fontWeight: 700, 
                                color: 'primary.main'
                              }} 
                              {...props} 
                            />
                          ),
                          code: ({ node, ...props }) => (
                            <Box 
                              component="code" 
                              sx={{ 
                                backgroundColor: 'grey.100', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                fontSize: '0.875em',
                                fontFamily: 'monospace'
                              }} 
                              {...props} 
                            />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <Box 
                              component="blockquote" 
                              sx={{ 
                                borderLeft: 3, 
                                borderColor: 'primary.main', 
                                pl: 2, 
                                py: 1, 
                                my: 2,
                                backgroundColor: 'grey.50',
                                borderRadius: 1,
                                fontStyle: 'italic'
                              }} 
                              {...props} 
                            />
                          ),
                        }}
                      >
                        {aiAnalysis}
                      </ReactMarkdown>
                    </Paper>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </Container>

        {/* 浮动操作按钮 */}
        <Zoom in={true} timeout={800}>
          <Tooltip title="刷新数据">
            <Fab 
              color="primary" 
              aria-label="refresh" 
              onClick={fetchAccountInfo}
              sx={{ 
                position: 'fixed', 
                bottom: 24, 
                right: 24,
                boxShadow: theme => `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: theme => `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            >
              <RefreshIcon />
            </Fab>
          </Tooltip>
        </Zoom>
      </Box>
    );
}