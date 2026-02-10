import React from 'react'
import { Button } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import './index.scss'
import { useNavigate } from 'react-router-dom'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-number">404</div>
        <div className="not-found-title">页面走丢了 😕</div>
        <div className="not-found-desc">
          抱歉，你访问的页面不存在、已被删除或暂时无法访问
        </div>
        <Button 
          type="primary" 
          icon={<HomeOutlined />} 
          onClick={handleGoHome}
          className="not-found-btn"
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}