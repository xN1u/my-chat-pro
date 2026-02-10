// ChatPage 组件
// 聊天页面组件，用于显示和发送消息
import { Layout, FloatButton } from "antd" // Ant Design 组件
import { useParams } from "react-router-dom" // React Router 参数获取
import './index.scss' // 页面样式
import { MessageItem } from "@/components/MessageItem" // 消息项组件
import { MessageInput } from "@/components/MessageInput" // 消息输入组件
import { useChatMessages } from "@/hooks/useChatMessages" // 聊天消息管理 Hook
import { DownOutlined } from "@ant-design/icons" // 图标
import type { Message } from "@/types/Message" // 消息类型定义

const { Content } = Layout // 布局组件

/**
 * ChatPage 聊天页面组件
 * 1. 获取路由参数中的对话ID
 * 2. 使用 useChatMessages Hook 管理聊天消息状态
 * 3. 渲染消息列表和消息输入组件
 * 4. 提供滚动到底部的功能
 */
export const ChatPage = () => {
  // 从路由参数中获取对话ID
  const { id: routeId } = useParams()
  const conversationId = Number(routeId) // 转换为数字类型

  // 使用 useChatMessages Hook 管理聊天消息状态
  const {
    messageItem,         // 当前输入的消息内容
    setMessageItem,      // 更新当前输入的消息内容
    messageList,         // 消息列表
    loading,             // 加载状态
    expandAarry,         // 展开的推理内容ID数组
    isReasoning,         // 是否正在推理
    isReasoningModal,    // 是否开启推理模式
    setIsReasoningModal, // 更新推理模式状态
    showBottom,          // 是否显示回到底部按钮
    messageListDivRef,   // 消息列表容器引用
    holder,              // 占位符，用于处理加载状态
    handleSubmit,        // 发送消息处理函数
    handleKeyDown,       // 键盘事件处理函数
    deleteMessage,       // 删除消息处理函数
    onExpandReasoning,   // 展开/收起推理内容处理函数
    goBackBottom         // 回到底部处理函数
  } = useChatMessages(conversationId)

  return (
    <Layout className="chat-page" style={{ height: "100%", backgroundColor: "#fff", padding: "0 100px" }}>
      {holder} {/* 加载状态占位符 */}
      <Content>
        <div className="chat-container">
          {/* 消息列表 */}
          <div className="chat-message-list" ref={messageListDivRef} style={{ height: 'calc(100vh - 190px)', overflowY: 'auto' }}>
            {/* 空消息状态 */}
            {messageList.length === 0 && <div className="chat-message-empty">暂无消息</div>}
            {/* 渲染消息列表 */}
            {messageList.map((msg: Message) => (
              <div key={msg.id} className="chat-message-item">
                <MessageItem
                  message={msg}
                  onDelete={deleteMessage}
                  expandArray={expandAarry}
                  onExpand={onExpandReasoning}
                  isReasoning={isReasoning}
                />
              </div>
            ))}
            {/* 加载状态提示 */}
            {loading && <div className="chat-message-bot">ai回答中...</div>}
          </div>
          {/* 回到底部按钮 */}
          {
            showBottom &&
            <FloatButton
              icon={<DownOutlined />}
              onClick={goBackBottom}
              style={{ position: "absolute", left: '50%', transform: 'translateX(-50%)', bottom: 24 }}
            />
          }
        </div>
      </Content>
      {/* 消息输入组件 */}
      <MessageInput
        message={messageItem}
        setMessage={setMessageItem}
        onSubmit={handleSubmit}
        loading={loading}
        isReasoningModal={isReasoningModal}
        setIsReasoningModal={setIsReasoningModal}
        onKeyDown={handleKeyDown}
      />
    </Layout>
  )
}
