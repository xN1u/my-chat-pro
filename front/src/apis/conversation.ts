// 对话相关 API
// 负责处理对话列表获取、对话创建和对话删除的API调用
import type { Conversation, ConversationListData, GetConversationListParams } from "@/types/Conversation" // 对话相关类型
import http from "@/utils/http" // HTTP请求工具

/**
 * CreateConversationData 创建对话的数据结构
 */
interface CreateConversationData {
  title?: string // 对话标题，可选
}

/**
 * getConversationListApi 获取对话列表
 * @param params 对话列表参数，包含页码、页大小等
 * @returns Promise<ConversationListData> 对话列表数据
 */
export const getConversationListApi = (params: GetConversationListParams) => {
  return http({
    url: '/conversation/list', // API路径
    method: 'GET', // 请求方法
    params: params, // 请求参数
  }) as Promise<ConversationListData> // 类型断言
}

/**
 * createConversationApi 创建对话
 * @param data 创建对话的数据，包含可选的标题
 * @returns Promise<Conversation> 创建的对话对象
 */
export const createConversationApi = (data: CreateConversationData) => {
  return http({
    url: '/conversation/create', // API路径
    method: 'POST', // 请求方法
    data, // 请求数据
  }) as Promise<Conversation> // 类型断言
}

/**
 * deleteConversationApi 删除对话
 * @param id 对话ID
 * @returns Promise<any> 删除结果
 */
export const deleteConversationApi = (id: number) => {
  return http({
    url: `/conversation/delete/${id}`, // API路径，包含对话ID
    method: 'DELETE', // 请求方法
  })
}