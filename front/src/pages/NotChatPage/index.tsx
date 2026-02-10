import React from 'react'
import { Button, message } from 'antd'
import { MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { createConversationApi } from '@/apis/conversation'
import './index.scss'

export const NotChatPage: React.FC = () => {
  const navigate = useNavigate()

  const handleCreateNewConversation = async () => {
    try {
      const res = await createConversationApi({})
      if (res && res.id) {
        console.log('创建新对话成功:', res)
        message.success('创建新对话成功')
        navigate(`/chat/${res.id}`)
      } else {
        throw new Error('创建对话返回数据异常')
      }
    } catch (err) {
      console.error('创建对话失败：', err)
      message.error(`创建失败：${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  return (
    <div className="select-conversation-container">
      <div className="select-conversation-content">
        <div className="select-conversation-header">
          <div className="header-icon">
            <MessageOutlined size={24} />
          </div>
          <h2 className="header-title">请选择一个对话</h2>
          <p className="header-desc">
            选择历史对话继续交流，或创建新对话开始全新的沟通
          </p>
        </div>

        <div className="conversation-actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNewConversation}
            className="create-btn"
          >
            创建新对话
          </Button>
        </div>
      </div>
    </div>
  )
}