// MessageInput 组件
// 用于用户输入消息的组件，包含文本输入框、发送按钮和推理模式切换开关
import React from 'react'
import { Button, Input, Switch, Layout } from 'antd' // Ant Design 组件
import './MessageInput.scss' // 组件样式

const { TextArea } = Input // 文本域组件
const { Footer } = Layout // 底部布局组件

// 组件属性接口
interface MessageInputProps {
  message: string // 输入的消息内容
  setMessage: (value: string) => void // 更新消息内容的回调函数
  onSubmit: () => void // 发送消息的回调函数
  loading: boolean // 是否正在加载
  isReasoningModal: boolean // 是否开启深度思考模式
  setIsReasoningModal: (value: boolean) => void // 更新深度思考模式的回调函数
  onKeyDown: (e: React.KeyboardEvent) => void // 键盘事件处理函数
}

/**
 * MessageInput 组件
 * 用于用户输入消息的界面，支持文本输入、发送消息和切换推理模式
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  onSubmit,
  loading,
  isReasoningModal,
  setIsReasoningModal,
  onKeyDown
}) => {
  return (
    <Footer style={{ backgroundColor: "#fff", padding: "24px 24px", marginBottom: "30px" }}>
      <div className="input-container">
        {/* 文本输入框 */}
        <TextArea
          autoSize // 自动调整高度
          placeholder="输入您的问题按Enter或点击发送(Shift+Enter换行)"
          size="large"
          style={{ width: "85%" }}
          value={message} // 绑定消息内容
          onChange={(e) => setMessage(e.target.value)} // 更新消息内容
          onPressEnter={onKeyDown} // 处理键盘事件
        />
        {/* 发送按钮 */}
        <div className="btn-container">
          <Button
            type="primary"
            size="large"
            style={{ marginLeft: "10px" }}
            onClick={onSubmit} // 点击发送消息
            loading={loading} // 加载状态
            disabled={loading || !message.trim()} // 禁用条件：加载中或消息为空
          >发送</Button>
        </div>
      </div>
      {/* 推理模式切换开关 */}
      <div className="is-reason-btn" style={{ marginTop: "5px" }}>
        <Switch
          checked={isReasoningModal} // 当前状态
          onChange={(checked) => setIsReasoningModal(checked)} // 更新状态
          checkedChildren="深度思考" // 开启时显示的文本
          unCheckedChildren="普通模式" // 关闭时显示的文本
        />
      </div>
    </Footer>
  )
}
