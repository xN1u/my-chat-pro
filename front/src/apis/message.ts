// 消息相关 API
// 负责处理消息列表获取和消息删除的API调用
import type { GetConversationListParams } from "@/types/Conversation" // 对话列表参数类型
import type { MessageListData } from "@/types/Message" // 消息列表数据类型
import http from "@/utils/http" // HTTP请求工具

/**
 * getMessageListApi 获取消息列表
 * @param params 对话列表参数，包含对话ID、页码、页大小等
 * @returns Promise<MessageListData> 消息列表数据
 */
export const getMessageListApi = (params: GetConversationListParams) => {
  return http({
    url: '/message/list', // API路径
    method: 'GET', // 请求方法
    params // 请求参数
  }) as Promise<MessageListData> // 类型断言
}

/**
 * deleteMessageApi 删除消息
 * @param messageId 消息ID
 * @returns Promise<any> 删除结果
 */
export const deleteMessageApi = (messageId: number) => {
  return http({
    url: `/message/delete/${messageId}`, // API路径，包含消息ID
    method: 'DELETE', // 请求方法
  })
}