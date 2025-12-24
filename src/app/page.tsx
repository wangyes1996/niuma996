'use client';
//@ts-nocheck
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
  Fade,
  Zoom,
  useMediaQuery,
  alpha,
  IconButton
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
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [fadeIn, setFadeIn] = useState(false);
    
    // 更细粒度的状态管理，减少不必要的重新渲染
    const [accountBalance, setAccountBalance] = useState<any>(null);
    const [positions, setPositions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // AI分析状态
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [websocket, setWebsocket] = useState<EventSource | null>(null);

    // 获取币安账户信息
    const fetchAccountInfo = async () => {
      try {
        const response = await fetch('/api/binance/account');
        if (!response.ok) {
          throw new Error('获取账户信息失败');
        }
        const data = await response.json();
        
        // 只更新实际变化的数据，避免整个板块重新渲染
        setAccountBalance(prev => {
          // 只有当数据真正变化时才更新
          if (JSON.stringify(prev) !== JSON.stringify(data.account)) {
            return data.account;
          }
          return prev;
        });
        
        setPositions(prev => {
          // 只有当数据真正变化时才更新
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
      const interval = setInterval(fetchAccountInfo, 60000); // 设置60秒刷新间隔
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
        // 使用Fetch API代替SSE，避免连接问题
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
    
    // 清理WebSocket连接（已不再使用）
    useEffect(() => {
      return () => {
        if (websocket) {
          websocket.close();
        }
      };
    }, [websocket]);

    // 现代化卡片组件（优化移动端显示）
    const OverviewCard = ({ title, value, unit, color, icon, description }: any) => (
      <Fade in={fadeIn} timeout={600}>
        <Card 
          sx={{ 
            height: '100%', 
            borderRadius: { xs: 3, sm: 4 }, 
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
          <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                  <Box sx={{ fontSize: { xs: 16, sm: 20 }, mr: 1 }}>{icon}</Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 500,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
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
                    fontSize: { xs: '1.1rem', sm: '1.5rem' },
                    mb: { xs: 0.25, sm: 0.5 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatNumber(value)}
                  <Typography 
                    component="span" 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ ml: 0.5, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                  >
                    {unit}
                  </Typography>
                </Typography>
                {description && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
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
      bgcolor: theme => alpha(theme.palette.grey[50], 0.5),
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    }}>
      {/* Header */}
      <Box 
        sx={{ 
          py: { xs: 2, md: 3 }, 
          px: { xs: 2, sm: 3 },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.5, md: 2 },
            flexWrap: 'wrap'
          }}>
            <Zoom in={fadeIn} timeout={800}>
              <Box 
                sx={{ 
                  width: { xs: 36, md: 40 }, 
                  height: { xs: 36, md: 40 }, 
                  borderRadius: 3, 
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: { xs: 20, md: 24 } }} />
              </Box>
            </Zoom>
            <Box>
              <Typography 
                variant={{ xs: "h6", md: "h5" }} 
                component="h1" 
                fontWeight="800" 
                sx={{ 
                  color: 'text.primary',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  mb: 0.5
                }}
              >
                数字资产管理系统
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                智能交易 · 实时分析 · 专业管理
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        {/* 错误提示 */}
        {error && (
          <Fade in timeout={500}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
                border: '1px solid rgba(244, 67, 54, 0.2)'
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* 账户概览 */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
            <Zoom in={fadeIn} timeout={1000}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                }}
              >
                <AttachMoneyIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            </Zoom>
            <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
              账户概览
            </Typography>
          </Box>
          
          {loading ? (
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={6} sm={6} md={3} key={item}>
                  <Card sx={{ 
                    borderRadius: { xs: 3, sm: 4 }, 
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Skeleton variant="rectangular" width={32} height={32} sx={{ mb: 1.5, borderRadius: 1.5 }} />
                      <Skeleton variant="text" sx={{ fontSize: '0.7rem', mb: 0.5 }} />
                      <Skeleton variant="text" sx={{ fontSize: '1.1rem', width: '70%' }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : accountBalance ? (
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
              <Grid item xs={6} sm={6} md={3}>
                <OverviewCard
                  title="总保证金余额"
                  value={accountBalance.totalMarginBalance}
                  unit="USDT"
                  color="text.primary"
                  icon={<TimelineIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  description="账户总保证金"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <OverviewCard
                  title="总钱包余额"
                  value={accountBalance.totalWalletBalance}
                  unit="USDT"
                  color="text.primary"
                  icon={<AccountBalanceWalletIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  description="钱包总资产"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <OverviewCard
                  title="总未实现盈亏"
                  value={accountBalance.totalUnrealizedProfit}
                  unit="USDT"
                  color={getProfitColor(accountBalance.totalUnrealizedProfit)}
                  icon={<BarChartIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  description="当前持仓盈亏"
                />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <OverviewCard
                  title="可用余额"
                  value={accountBalance.availableBalance}
                  unit="USDT"
                  color="text.primary"
                  icon={<SpeedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  description="可交易余额"
                />
              </Grid>
            </Grid>
          ) : (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(2, 136, 209, 0.15)'
              }}
            >
              暂无账户数据
            </Alert>
          )}
        </Box>

        {/* 持仓情况 */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
            <Zoom in={fadeIn} timeout={1200}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <ShowChartIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            </Zoom>
            <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
              持仓情况
            </Typography>
          </Box>
          
          {loading ? (
            <Card sx={{ 
              borderRadius: { xs: 3, sm: 4 }, 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {[1, 2, 3, 4].map((item) => (
                    <Grid item xs={12} sm={6} key={item}>
                      <Card sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ) : positions && positions.length > 0 ? (
            <>
              {/* 移动端卡片布局 */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {positions.map((position: any, index: number) => (
                  <Fade in={fadeIn} timeout={800 + index * 100} key={position.symbol}>
                    <Card 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography fontWeight="700" color="text.primary" sx={{ fontSize: '1rem' }}>
                            {position.symbol}
                          </Typography>
                          <Chip 
                            label={`${position.leverage}x`} 
                            size="small" 
                            color="primary" 
                            variant="filled" 
                            sx={{ 
                              fontWeight: '700',
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              color: 'white',
                              borderRadius: 1.5,
                              px: 1,
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              持仓数量
                            </Typography>
                            <Typography fontWeight="600" sx={{ fontSize: '0.875rem' }}>
                              {position.positionAmt}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              入场价格
                            </Typography>
                            <Typography fontWeight="600" sx={{ fontSize: '0.875rem' }}>
                              {position.entryPrice}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              标记价格
                            </Typography>
                            <Typography fontWeight="600" sx={{ fontSize: '0.875rem' }}>
                              {position.markPrice}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              未实现盈亏
                            </Typography>
                            <Typography 
                              fontWeight="700" 
                              sx={{ 
                                fontSize: '0.875rem',
                                color: getProfitColor(position.unrealizedProfit)
                              }}
                            >
                              {formatNumber(position.unrealizedProfit)} USDT
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                          <Chip 
                            label={position.marginType} 
                            size="small" 
                            color={position.marginType === 'isolated' ? 'warning' : 'info'} 
                            variant="filled" 
                            sx={{ 
                              fontWeight: '600',
                              borderRadius: 1,
                              px: 1,
                              fontSize: '0.7rem',
                              background: position.marginType === 'isolated' 
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #06b6d4, #0891b2)'
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Box>
              
              {/* 桌面端表格布局 */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Card sx={{ 
                  borderRadius: 4, 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                            <TableCell sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>交易对</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>持仓数量</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>入场价格</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>标记价格</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>未实现盈亏</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>杠杆</TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: '700', 
                              color: 'text.primary', 
                              py: 2.5,
                              fontSize: '0.875rem',
                              borderBottom: '2px solid #e5e7eb'
                            }}>保证金类型</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {positions.map((position: any, index: number) => (
                            <Fade in={fadeIn} timeout={800 + index * 100} key={position.symbol}>
                              <TableRow hover sx={{ 
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:hover': {
                                  backgroundColor: 'rgba(99, 102, 241, 0.02)',
                                }
                              }}>
                                <TableCell component="th" scope="row" sx={{ py: 2.5 }}>
                                  <Typography fontWeight="600" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                                    {position.symbol}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2.5, fontWeight: 500 }}>{position.positionAmt}</TableCell>
                                <TableCell align="right" sx={{ py: 2.5, fontWeight: 500 }}>{position.entryPrice}</TableCell>
                                <TableCell align="right" sx={{ py: 2.5, fontWeight: 500 }}>{position.markPrice}</TableCell>
                                <TableCell 
                                  align="right" 
                                  sx={{ 
                                    py: 2.5,
                                    fontWeight: '700',
                                    color: getProfitColor(position.unrealizedProfit),
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {formatNumber(position.unrealizedProfit)} USDT
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2.5 }}>
                                  <Chip 
                                    label={`${position.leverage}x`} 
                                    size="small" 
                                    color="primary" 
                                    variant="filled" 
                                    sx={{ 
                                      fontWeight: '700',
                                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                      color: 'white',
                                      borderRadius: 2,
                                      px: 1
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2.5 }}>
                                  <Chip 
                                    label={position.marginType} 
                                    size="small" 
                                    color={position.marginType === 'isolated' ? 'warning' : 'info'} 
                                    variant="filled" 
                                    sx={{ 
                                      fontWeight: '600',
                                      borderRadius: 2,
                                      px: 1,
                                      background: position.marginType === 'isolated' 
                                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                        : 'linear-gradient(135deg, #06b6d4, #0891b2)'
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            </Fade>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            </>
          ) : (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(2, 136, 209, 0.15)'
              }}
            >
              暂无持仓记录
            </Alert>
          )}
        </Box>

        {/* AI分析区域 */}
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 2, md: 3 }, 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Zoom in={fadeIn} timeout={1400}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <AssessmentIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              </Zoom>
              <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
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
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontWeight: 700,
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
                /* 保持 disabled 状态下的可见性 */
                '&.Mui-disabled': {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6) !important',
                  color: 'white !important',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25) !important',
                  opacity: 1,
                  cursor: 'wait'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ fontWeight: 700 }}>{isAnalyzing ? '分析中' : '开始分析'}</Box>
                {isAnalyzing && (
                  <Box component="span" sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>请稍候</Box>
                )}
              </Box>
            </Button>
          </Box>
          
          {analysisError && (
            <Fade in timeout={500}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
                  border: '1px solid rgba(244, 67, 54, 0.2)'
                }}
              >
                {analysisError}
              </Alert>
            </Fade>
          )}
          
          {!isAnalyzing && !aiAnalysis && (
            <Fade in timeout={800}>
              <Card sx={{ 
                borderRadius: 4, 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <InfoIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="700" color="text.primary">
                      市场分析概览
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.primary', fontSize: '1rem' }}>
                      欢迎使用AI市场分析功能！点击右侧的"开始分析"按钮，系统将为您提供实时的加密货币市场分析。
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: 'text.primary' }}>
                      分析内容包括：
                    </Typography>
                    <Box component="ul" sx={{ pl: 4, mb: 3 }}>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.7 }}>• 技术指标分析</Typography>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.7 }}>• 市场趋势预测</Typography>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.7 }}>• 买卖信号建议</Typography>
                      <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.7 }}>• 风险评估</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    bgcolor: 'rgba(99, 102, 241, 0.05)', 
                    p: 3, 
                    borderRadius: 3,
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      分析结果将以Markdown格式展示，包含图表、表格和详细的文字说明。
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}
          
          {isAnalyzing && (
            <Box sx={{ mb: 3 }}>
              <Card sx={{ 
                borderRadius: 4, 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <CircularProgress color="primary" size={24} sx={{ mr: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight="600">
                      分析中...请稍候
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    bgcolor: 'rgba(99, 102, 241, 0.02)', 
                    p: 3, 
                    borderRadius: 3,
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    minHeight: '200px'
                  }}>
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.primary', fontSize: '1rem' }} {...props} />,
                        code: ({ node, ...props }) => <Box component="code" sx={{ 
                          bgcolor: 'rgba(99, 102, 241, 0.1)', 
                          px: 1.5, 
                          py: 0.5, 
                          borderRadius: 1, 
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }} {...props} />,
                        pre: ({ node, ...props }) => <Box component="pre" sx={{ 
                          bgcolor: 'rgba(99, 102, 241, 0.1)', 
                          p: 2, 
                          borderRadius: 2, 
                          overflowX: 'auto', 
                          fontFamily: 'monospace',
                          mb: 2
                        }} {...props} />,
                      }}
                    >
                      {aiAnalysis}
                    </ReactMarkdown>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
          
          {aiAnalysis && !isAnalyzing && (
            <Fade in timeout={800}>
              <Card sx={{ 
                borderRadius: 4, 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <Typography variant="h4" fontWeight="800" sx={{ mb: 3, color: 'text.primary', letterSpacing: '-0.02em' }} {...props} />,
                      h2: ({ node, ...props }) => <Typography variant="h5" fontWeight="700" sx={{ mb: 2, color: 'text.primary', letterSpacing: '-0.02em' }} {...props} />,
                      h3: ({ node, ...props }) => <Typography variant="h6" fontWeight="700" sx={{ mb: 1.5, color: 'text.primary' }} {...props} />,
                      p: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8, color: 'text.primary', fontSize: '1rem' }} {...props} />,
                      ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 4, mb: 2 }} {...props} />,
                      ol: ({ node, ...props }) => <Box component="ol" sx={{ pl: 4, mb: 2 }} {...props} />,
                      li: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.7 }} {...props} />,
                      code: ({ node, ...props }) => <Box component="code" sx={{ 
                        bgcolor: 'rgba(99, 102, 241, 0.1)', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: 1, 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }} {...props} />,
                      pre: ({ node, ...props }) => <Box component="pre" sx={{ 
                        bgcolor: 'rgba(99, 102, 241, 0.08)', 
                        p: 3, 
                        borderRadius: 3, 
                        overflowX: 'auto', 
                        fontFamily: 'monospace',
                        mb: 2,
                        border: '1px solid rgba(99, 102, 241, 0.1)'
                      }} {...props} />,
                      blockquote: ({ node, ...props }) => <Box component="blockquote" sx={{ 
                        borderLeft: '4px solid #6366f1', 
                        pl: 3, 
                        ml: 0, 
                        color: '#6b7280',
                        background: 'rgba(99, 102, 241, 0.02)',
                        py: 2,
                        borderRadius: '0 8px 8px 0',
                        mb: 2
                      }} {...props} />,
                      table: ({ node, ...props }) => <TableContainer sx={{ mb: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }} {...props} />,
                      tr: ({ node, ...props }) => <TableRow {...props} />,
                      th: ({ node, ...props }) => <TableCell sx={{ 
                        fontWeight: '700', 
                        bgcolor: 'rgba(99, 102, 241, 0.05)',
                        py: 2,
                        borderBottom: '2px solid #e5e7eb'
                      }} {...props} />,
                      td: ({ node, ...props }) => <TableCell sx={{ py: 1.5 }} {...props} />,
                    }}
                  >
                    {aiAnalysis}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </Fade>
          )}
        </Box>
      </Container>
    </Box>
  );
}