'use client';
//@ts-nocheck
import { Box, Container, Typography, Button, Paper, useTheme, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Grid, Card, CardContent, Alert, Skeleton } from '@mui/material';
import { ArrowRight as ArrowRightIcon, Home as HomeIcon, Info as InfoIcon, Code as CodeIcon, AccountBalanceWallet as AccountBalanceWalletIcon, TrendingUp as TrendingUpIcon, AttachMoney as AttachMoneyIcon, ShowChart as ShowChartIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';


export default function Home() {
    const theme = useTheme();
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
        // 使用Server-Sent Events代替WebSocket
        const eventSource = new EventSource(`/api/ai/mastra-analysis-ws?symbol=BTC`);
        
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chunk') {
            setAiAnalysis(prev => prev + data.content);
          } else if (data.type === 'complete') {
            setIsAnalyzing(false);
            eventSource.close();
          } else if (data.type === 'error') {
            setAnalysisError(data.message);
            setIsAnalyzing(false);
            eventSource.close();
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('SSE错误:', error);
          setAnalysisError('SSE连接错误');
          setIsAnalyzing(false);
          eventSource.close();
        };
        
        // 保存eventSource引用以便清理
        setWebsocket(eventSource);
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'AI分析失败');
        setIsAnalyzing(false);
      }
    };
    
    // 清理SSE连接
    useEffect(() => {
      return () => {
        if (websocket) {
          websocket.close();
        }
      };
    }, [websocket]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box 
        sx={{ 
          py: 3, 
          px: { xs: 2, sm: 3 },
          bgcolor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '8px', 
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" component="h1" fontWeight="600" color="text.primary">
              数字资产管理系统
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* 账户概览 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AttachMoneyIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" fontWeight="600" color="text.primary">
              账户概览
            </Typography>
          </Box>
          
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((item) => (
                   {/*@ts-ignore */}
                <Grid item xs={12} sm={6} md={3} key={item}>
                  <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <CardContent>
                      <Skeleton variant="text" width={100} />
                      <Skeleton variant="text" width={80} height={30} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : accountBalance ? (
            <Grid container spacing={2}>
               
              {/*   @ts-ignore */}

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: 2, 
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      总保证金余额
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
                      {formatNumber(accountBalance.totalMarginBalance)} 
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        USDT
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
                            {/*   @ts-ignore */}

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: 2, 
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  borderLeft: '4px solid',
                  borderColor: 'info.main',
                }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      总钱包余额
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
                      {formatNumber(accountBalance.totalWalletBalance)}
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        USDT
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {/*   @ts-ignore */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2, 
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    borderLeft: '4px solid',
                    borderColor: getProfitColor(accountBalance.totalUnrealizedProfit),
                  }}
                >
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      总未实现盈亏
                    </Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      sx={{ 
                        color: getProfitColor(accountBalance.totalUnrealizedProfit)
                      }}
                    >
                      {formatNumber(accountBalance.totalUnrealizedProfit)}
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        USDT
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {/*   @ts-ignore */}

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  height: '100%', 
                  borderRadius: 2, 
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  borderLeft: '4px solid',
                  borderColor: 'success.main',
                }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      可用余额
                    </Typography>
                    <Typography variant="h6" fontWeight="600" sx={{ color: 'text.primary' }}>
                      {formatNumber(accountBalance.availableBalance)}
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        USDT
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              暂无账户数据
            </Alert>
          )}
        </Box>

        {/* 持仓情况 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ShowChartIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" fontWeight="600" color="text.primary">
              持仓情况
            </Typography>
          </Box>
          
          {loading ? (
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardContent>
                <Skeleton variant="rectangular" height={200} />
              </CardContent>
            </Card>
          ) : positions && positions.length > 0 ? (
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>交易对</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>持仓数量</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>入场价格</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>标记价格</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>未实现盈亏</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>杠杆</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600', color: 'text.primary', py: 2 }}>保证金类型</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.map((position: any) => (
                        <TableRow key={position.symbol} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell component="th" scope="row" sx={{ py: 2 }}>
                            <Typography fontWeight="500" color="text.primary">
                              {position.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>{position.positionAmt}</TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>{position.entryPrice}</TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>{position.markPrice}</TableCell>
                          <TableCell 
                            align="right" 
                            sx={{ 
                              py: 2,
                              fontWeight: '600',
                              color: getProfitColor(position.unrealizedProfit)
                            }}
                          >
                            {formatNumber(position.unrealizedProfit)} USDT
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>
                            <Chip 
                              label={`${position.leverage}x`} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ fontWeight: '600' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>
                            <Chip 
                              label={position.marginType} 
                              size="small" 
                              color={position.marginType === 'isolated' ? 'warning' : 'info'} 
                              variant="filled" 
                              sx={{ fontWeight: '500' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              暂无持仓记录
            </Alert>
          )}
        </Box>

        {/* AI分析区域 */}
        <Box sx={{ mt: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600" color="text.primary">
                AI市场分析
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={triggerAIAnalysis}
              disabled={isAnalyzing}
              sx={{ borderRadius: 2, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
            >
              {isAnalyzing ? '分析中...' : '开始分析'}
            </Button>
          </Box>
          
          {analysisError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {analysisError}
            </Alert>
          )}
          
          {isAnalyzing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <CircularProgress color="primary" />
            </Box>
          )}
          
          {aiAnalysis && (
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <Typography variant="h4" fontWeight="600" sx={{ mb: 2, color: 'text.primary' }} {...props} />,
                    h2: ({ node, ...props }) => <Typography variant="h5" fontWeight="600" sx={{ mb: 1.5, color: 'text.primary' }} {...props} />,
                    h3: ({ node, ...props }) => <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: 'text.primary' }} {...props} />,
                    p: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.8, color: 'text.primary' }} {...props} />,
                    ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 4, mb: 1.5 }} {...props} />,
                    ol: ({ node, ...props }) => <Box component="ol" sx={{ pl: 4, mb: 1.5 }} {...props} />,
                    li: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 0.5, color: 'text.primary' }} {...props} />,
                    code: ({ node, ...props }) => <Box component="code" sx={{ bgcolor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 0.5, fontFamily: 'monospace' }} {...props} />,
                    pre: ({ node, ...props }) => <Box component="pre" sx={{ bgcolor: '#f0f0f0', p: 2, borderRadius: 1, overflowX: 'auto', fontFamily: 'monospace' }} {...props} />,
                    blockquote: ({ node, ...props }) => <Box component="blockquote" sx={{ borderLeft: '4px solid #1976d2', pl: 2, ml: 0, color: '#666' }} {...props} />,
                    table: ({ node, ...props }) => <TableContainer sx={{ mb: 1.5 }} {...props} />,
                    tr: ({ node, ...props }) => <TableRow {...props} />,
                    th: ({ node, ...props }) => <TableCell sx={{ fontWeight: '600', bgcolor: '#f5f5f5' }} {...props} />,
                    td: ({ node, ...props }) => <TableCell {...props} />,
                  }}
                >
                  {aiAnalysis}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  );
}