/**
 * 提示词工具函数
 * 用于从文本文件读取AI提示词
 */

import fs from 'fs';
import path from 'path';

/**
 * 读取提示词文件
 * @param filename - 提示词文件名（不含路径）
 * @param defaultContent - 默认内容（如果文件不存在）
 * @returns 提示词内容
 */
export function readPromptFile(filename: string, defaultContent: string = ''): string {
  try {
    const promptsDir = process.env.PROMPTS_DIR || './prompts';
    const filePath = path.join(process.cwd(), promptsDir, filename);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    console.warn(`提示词文件不存在: ${filePath}`);
    return defaultContent;
  } catch (error) {
    console.error(`读取提示词文件失败: ${filename}`, error);
    return defaultContent;
  }
}

/**
 * 获取默认提示词
 * @returns 默认提示词内容
 */
export function getDefaultPrompt(): string {
  const defaultPromptFile = process.env.DEFAULT_PROMPT_FILE || 'prompt.txt';
  return readPromptFile(defaultPromptFile);
}

/**
 * 获取AI分析提示词
 * @returns AI分析提示词内容
 */
export function getAnalysisPrompt(): string {
  const analysisPromptFile = process.env.AI_ANALYSIS_PROMPT_FILE || 'analysis_prompt.txt';
  return readPromptFile(analysisPromptFile, getDefaultPrompt());
}

/**
 * 获取AI交易提示词
 * @returns AI交易提示词内容
 */
export function getTradingPrompt(): string {
  const tradingPromptFile = process.env.AI_TRADING_PROMPT_FILE || 'trading_prompt.txt';
  return readPromptFile(tradingPromptFile, getDefaultPrompt());
}

/**
 * 获取所有可用的提示词文件列表
 * @returns 提示词文件名数组
 */
export function getAvailablePrompts(): string[] {
  try {
    const promptsDir = process.env.PROMPTS_DIR || './prompts';
    const dirPath = path.join(process.cwd(), promptsDir);
    
    if (fs.existsSync(dirPath)) {
      return fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.txt'))
        .sort();
    }
    
    return [];
  } catch (error) {
    console.error('获取提示词文件列表失败', error);
    return [];
  }
}

/**
 * 动态读取指定提示词
 * @param promptType - 提示词类型 (analysis, trading, default)
 * @returns 对应的提示词内容
 */
export function getPromptByType(promptType: 'analysis' | 'trading' | 'default'): string {
  switch (promptType) {
    case 'analysis':
      return getAnalysisPrompt();
    case 'trading':
      return getTradingPrompt();
    case 'default':
    default:
      return getDefaultPrompt();
  }
}