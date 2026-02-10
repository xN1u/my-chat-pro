// MessageItem 组件
// 用于显示聊天消息，支持用户消息和AI消息的不同显示方式
// 支持 Markdown 渲染，包括代码高亮、数学公式等
import React from 'react'
import { Button, Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown' // Markdown 渲染组件
import remarkGfm from 'remark-gfm' // GitHub 风格 Markdown 支持
import remarkBreaks from 'remark-breaks' // 换行支持
import remarkMath from 'remark-math' // 数学公式支持
import rehypeKatex from 'rehype-katex' // KaTeX 数学公式渲染
import rehypeHighlight from 'rehype-highlight' // 代码高亮
import rehypeSlug from 'rehype-slug' // 标题锚点支持
import 'highlight.js/styles/github.css' // 代码高亮样式
import 'katex/dist/katex.min.css' // 数学公式样式
import type { Message } from '@/types/Message' // 消息类型定义
import './MessageItem.scss' // 组件样式

// 组件属性接口
interface MessageItemProps {
  message: Message // 消息对象
  onDelete: (id: number) => void // 删除消息回调函数
  expandArray: number[] // 展开的消息ID数组
  onExpand: (e: React.MouseEvent<HTMLParagraphElement>) => void // 展开/收起回调函数
  isReasoning: boolean // 是否正在推理
}

/**
 * MessageItem 组件
 * 用于渲染单个聊天消息，根据消息角色（用户/AI）显示不同的样式
 * 支持AI消息的推理内容展开/收起功能
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onDelete,
  expandArray,
  onExpand,
  isReasoning
}) => {
  // 渲染AI消息
  if (message.message_role === 1) {
    return (
      <div className="chat-message-bot">
        {/* 推理内容区域 */}
        <div
          className={`bot-reasoning-none ${expandArray.includes(message.id) ? "is-expanded" : ""}`}
          style={{ display: message.reasoning_content === "" ? "none" : "block" }}
        >
          {/* 展开/收起按钮 */}
          <p
            data-message-id={message.id}
            onClick={(e) => onExpand(e)}
            className={`reasoning-expand-btn`}
          >
            {isReasoning ? "正在" : "已完成"}思考 点击{expandArray.includes(message.id) ? "收起" : "展开"}
          </p>
          {/* 展开时显示推理内容 */}
          {expandArray.includes(message.id) &&
            <div className="bot-md-content">
              <ReactMarkdown
                remarkPlugins={[
                  remarkBreaks,
                  remarkGfm,
                  remarkMath
                ]}
                rehypePlugins={[
                  rehypeHighlight,
                  rehypeKatex,
                  rehypeSlug,
                ]}
                children={message.reasoning_content}
              />
            </div>
          }
        </div>
        {/* AI消息内容 */}
        <div className="bot-md-content">
          <ReactMarkdown
            remarkPlugins={[
              remarkBreaks,
              remarkGfm,
              remarkMath
            ]}
            rehypePlugins={[
              rehypeHighlight,
              rehypeKatex,
              rehypeSlug,
            ]}
            children={message.content}
          />
        </div>
        {/* 删除按钮 */}
        <div className="message-del-btn">
          <Popconfirm
            title="删除该消息？"
            description="确定要删除该消息吗？"
            onConfirm={() => onDelete(message.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} danger shape="circle" />
          </Popconfirm>
        </div>
      </div>
    )
  } else {
    // 渲染用户消息
    return (
      <div className="chat-message-item">
        {/* 用户消息内容 */}
        <div className="chat-message-user">
          <p>{message.content}</p>
        </div>
        {/* 删除按钮 */}
        <div className="message-del-btn">
          <Popconfirm
            title="删除该消息？"
            description="确定要删除该消息吗？"
            onConfirm={() => onDelete(message.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} danger shape="circle" />
          </Popconfirm>
        </div>
      </div>
    )
  }
}
