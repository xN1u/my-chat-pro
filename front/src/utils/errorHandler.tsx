import React from 'react'
import { message, Modal } from 'antd'

// 错误类型定义
export type ErrorType = 'info' | 'success' | 'warning' | 'error'

// 错误处理选项
interface ErrorOptions {
  title?: string
  duration?: number
  showDetail?: boolean
  detail?: string
}

// 错误消息映射
const errorMessageMap: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求的资源不存在',
  405: '请求方法不允许',
  408: '请求超时',
  500: '服务器内部错误',
  501: '服务未实现',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时'
}

/**
 * 显示错误消息
 * @param type 错误类型
 * @param content 错误内容
 * @param options 选项
 */
export const showMessage = (
  type: ErrorType,
  content: string,
  options: ErrorOptions = {}
) => {
  const {
    duration = 3,
    showDetail = false,
    detail = ''
  } = options

  switch (type) {
    case 'info':
      message.info({
        content,
        duration
      })
      break
    case 'success':
      message.success({
        content,
        duration
      })
      break
    case 'warning':
      message.warning({
        content,
        duration
      })
      break
    case 'error':
      if (showDetail && detail) {
        Modal.error({
          title: options.title || '错误提示',
          content: (
            <div>
              <p>{content}</p>
              <p style={{ marginTop: 8, color: '#666' }}>{detail}</p>
            </div>
          )
        })
      } else {
        message.error({
          content,
          duration
        })
      }
      break
    default:
      message.info({
        content,
        duration
      })
  }
}

/**
 * 处理HTTP错误
 * @param status HTTP状态码
 * @param error 错误对象
 */
export const handleHttpError = (status: number, error: any) => {
  const errorMessage = errorMessageMap[status] || '请求失败'
  const detail = error?.message || error?.toString() || ''

  showMessage('error', errorMessage, {
    title: `错误 ${status}`,
    showDetail: true,
    detail
  })
}

/**
 * 处理业务错误
 * @param message 错误消息
 * @param error 错误对象
 */
export const handleBusinessError = (message: string, error?: any) => {
  const detail = error?.message || error?.toString() || ''

  showMessage('error', message, {
    title: '操作失败',
    showDetail: !!detail,
    detail
  })
}

/**
 * 处理未知错误
 * @param error 错误对象
 */
export const handleUnknownError = (error: any) => {
  const message = '系统出现未知错误'
  const detail = error?.message || error?.toString() || ''

  showMessage('error', message, {
    title: '错误',
    showDetail: true,
    detail
  })
}

/**
 * 错误边界组件Props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * 错误边界组件State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * 错误边界组件
 * 用于捕获子组件树中的JavaScript错误，防止整个应用崩溃
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示降级UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 更新状态
    this.setState({ errorInfo })

    // 显示错误消息
    handleUnknownError(error)
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认降级UI
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#ff4d4f' }}>页面出现错误</h2>
          <p style={{ marginTop: '16px', color: '#666' }}>
            很抱歉，页面加载过程中出现了错误。
          </p>
          <button
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
