import { useState, useCallback, useRef, useEffect } from 'react'
import { getMessageListApi, deleteMessageApi } from '@/apis/message'
import type { Message, MessageSSEData } from '@/types/Message'
import { createSSE } from '@/utils/sse'
import useMessage from 'antd/es/message/useMessage'
import { debounce } from 'lodash'

const generateUniqueId = () => {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export const useChatMessages = (conversationId: number) => {
  const [messageItem, setMessageItem] = useState("")
  const [messageList, setMessageList] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [curSSE, setCurSSE] = useState<ReturnType<typeof createSSE>>()
  const shouldScrollAfterRouteChange = useRef(false)
  const [messageApi, holder] = useMessage()
  const [expandAarry, setExpandAarry] = useState<number[]>([])
  const [isReasoning, setIsReasoning] = useState(false)
  const [isReasoningModal, setIsReasoningModal] = useState(false)
  const messageListDivRef = useRef<HTMLDivElement>(null)
  const [showBottom, setShowToBottom] = useState(false)
  const isAutoToBottom = useRef(false)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const listIsLoadingRef = useRef(false)
  const [listHasMore, setListHasMore] = useState(true)
  const previousScrollTop = useRef(0) // 记录加载前的滚动位置
  const previousScrollHeight = useRef(0) // 记录加载前的内容高度

  // 流式输出优化相关的 ref
  const messageBufferRef = useRef<MessageSSEData[]>([])
  const updatePendingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  
  // 同步最新状态到 ref
  const messageListRef = useRef(messageList)
  const expandArrayRef = useRef(expandAarry)
  const isReasoningRef = useRef(isReasoning)
  const curSSERef = useRef(curSSE)
  const loadingRef = useRef(loading)

  // 同步 ref 值
  useEffect(() => {
    messageListRef.current = messageList
    expandArrayRef.current = expandAarry
    isReasoningRef.current = isReasoning
    curSSERef.current = curSSE
    loadingRef.current = loading
  }, [messageList, expandAarry, isReasoning, curSSE, loading])

  const goBackBottom = useCallback(() => {
    const container = messageListDivRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const getMessageList = useCallback(async (pageNum: number) => {
    if (!conversationId || listIsLoadingRef.current) return
    listIsLoadingRef.current = true

    try {
      const params = {
        conversation_id: conversationId,
        page: pageNum,
        page_size: pageSize,
      }
      const res = await getMessageListApi(params)
      const reversedMessages = [...res.messages].reverse()
      
      if (pageNum === 1) {
        setMessageList(reversedMessages)
      } else {
        // 在添加新消息前记录当前位置
        const container = messageListDivRef.current
        if (container) {
          previousScrollTop.current = container.scrollTop
          previousScrollHeight.current = container.scrollHeight
        }
        
        setMessageList(prevList => [...reversedMessages, ...prevList])
      }
      
      setListHasMore(res.messages.length === pageSize)
      if (pageNum === 1) {
        shouldScrollAfterRouteChange.current = true
      }
    } catch(err) {
      console.log("获取历史消息失败：", err)
      messageApi.error("获取历史消息失败")
    } finally {
      listIsLoadingRef.current = false
    }
  }, [conversationId, messageApi])

  // 优化后的流式输出处理函数
  const processMessageBuffer = useCallback(() => {
    if (messageBufferRef.current.length === 0) {
      updatePendingRef.current = false
      return
    }

    const bufferCopy = [...messageBufferRef.current]
    messageBufferRef.current = []

    // 批量处理所有缓冲的消息
    setMessageList(prevList => {
      const newList = [...prevList]
      let shouldCloseSSE = false
      let shouldStopLoading = false
      let shouldStopReasoning = false
      let updatedExpandArray = [...expandArrayRef.current]
      let updatedIsReasoning = isReasoningRef.current

      for (const data of bufferCopy) {
        if (data.type === 'complete' || data.type === 'done') {
          if (newList.length > 0) {
            const lastItem = { ...newList[newList.length - 1] } as Message
            if (lastItem.content === '') {
              lastItem.content = 'ai没有有效的回答，请重新输入'
            }
            updatedExpandArray = updatedExpandArray.filter(id => id !== lastItem.id)
            newList[newList.length - 1] = lastItem
          }
          
          shouldCloseSSE = true
          shouldStopLoading = true
          shouldStopReasoning = true
        }

        if (data.type === 'reasoning') {
          if (newList.length > 0) {
            const lastItem = { ...newList[newList.length - 1] } as Message
            if (!updatedIsReasoning) {
              updatedExpandArray = [...updatedExpandArray, lastItem.id]
            }
            
            updatedIsReasoning = true
            setIsReasoning(true)
            
            if (!lastItem.reasoning_content) {
              lastItem.reasoning_content = ''
            }
            lastItem.reasoning_content += data.reasoning_content || ''
            newList[newList.length - 1] = lastItem
          }
        }

        if (data.type === 'chunk') {
          updatedIsReasoning = false
          setIsReasoning(false)

          if (newList.length > 0) {
            const lastItem = { ...newList[newList.length - 1] } as Message
            if (!lastItem.content) {
              lastItem.content = ''
            }
            lastItem.content += data.content || ''
            newList[newList.length - 1] = lastItem
          }
        }
      }

      // 更新其他状态
      if (shouldCloseSSE && curSSERef.current) {
        curSSERef.current.close()
        setCurSSE(undefined)
      }
      
      if (shouldStopLoading) {
        setLoading(false)
      }
      
      if (shouldStopReasoning) {
        setIsReasoning(false)
      }

      // 更新展开数组
      if (JSON.stringify(updatedExpandArray) !== JSON.stringify(expandArrayRef.current)) {
        setExpandAarry(updatedExpandArray)
      }

      return newList
    })

    updatePendingRef.current = false

    // 如果缓冲区还有数据，继续处理
    if (messageBufferRef.current.length > 0) {
      rafIdRef.current = requestAnimationFrame(processMessageBuffer)
    }
  }, [])

  const onMessage = useCallback((data: MessageSSEData) => {
    console.log(data)
    
    // 添加到缓冲区
    messageBufferRef.current.push(data)
    
    // 如果没有待处理的更新，安排下一帧处理
    if (!updatePendingRef.current) {
      updatePendingRef.current = true
      rafIdRef.current = requestAnimationFrame(processMessageBuffer)
    }
  }, [processMessageBuffer])

  // 处理SSE错误的回调
  const onError = useCallback((error: Event) => {
    console.log("SSE Error:", error)
    
    // 清空缓冲区
    messageBufferRef.current = []
    updatePendingRef.current = false
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    setMessageList(prevList => [
      ...prevList,
      {
        id: generateUniqueId(),
        content: "服务器连接失败，请稍后再试",
        type: 1,
        message_role: 1,
      } as Message
    ])
    
    curSSERef.current?.close()
    setCurSSE(undefined)
    setLoading(false)
    messageApi.error("服务器连接失败")
  }, [messageApi])

  // 创建SSE连接
  const sendSSE = useCallback((data: object) => {
    return createSSE('/message/stream', {
      payload: data,
      onMessage,
      onError,
      onClose: () => {
        console.log('sse closed')
        // 清空缓冲区
        messageBufferRef.current = []
        updatePendingRef.current = false
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current)
        }
        setLoading(false)
      }
    })
  }, [onMessage, onError, messageApi])

  // 提交消息逻辑
  const handleSubmit = useCallback(() => {
    const messageText = messageItem.trim()
    if (!messageText || loading || curSSE) {
      return
    }

    setMessageList(prevList => [
      ...prevList,
      {
        id: generateUniqueId(),
        content: messageText,
        type: 1,
        message_role: 2, 
      } as Message
    ])
    setMessageItem("")
    setLoading(true)
    goBackBottom()

    const sseData = {
      conversation_id: conversationId,
      content: messageText,
      type: 1,
      reason_modal: isReasoningModal,
    }

    const sse = sendSSE(sseData)
    setCurSSE(sse)
    sse.connect()

    setMessageList(prevList => [
      ...prevList,
      {
        id: generateUniqueId(),
        content: '',
        reasoning_content: '',
        type: 2,
        message_role: 1,
      } as Message
    ])
  }, [messageItem, loading, curSSE, conversationId, sendSSE, goBackBottom, isReasoningModal])

  // 处理回车发送
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.shiftKey) {
        return
      }
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const deleteMessage = async (id: number) => {
    try {
      await deleteMessageApi(id)
      messageApi.success("删除成功")
      getMessageList(1) // 删除后重新加载第一页
    } catch (err) {
      messageApi.error("删除失败：" + err)
    }
  }

  const onExpandReasoning = (e: React.MouseEvent<HTMLParagraphElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const messageId = Number(e.currentTarget.dataset.messageId)
    if (expandAarry.includes(messageId)) {
      setExpandAarry(prevArray => prevArray.filter(id => id !== messageId))
    } else {
      setExpandAarry(prevArray => [...prevArray, messageId])
    }
  }

  // 加载历史消息列表
  useEffect(() => {
    console.log("message page init")
    const init = async () => {
      await getMessageList(1)
      setPage(1)
    }
    init()
  }, [conversationId, getMessageList])

  // 监听页码变化，加载更多数据
  useEffect(() => {
    if (page > 1) {
      getMessageList(page)
    }
  }, [page, getMessageList])

  // 监听路由变化，滚动到底部
  useEffect(() => {
    if (messageList.length > 0 && loading === false && shouldScrollAfterRouteChange.current) {
      goBackBottom()
      shouldScrollAfterRouteChange.current = false
    }
  }, [messageList, loading, goBackBottom])

  // 组件卸载时关闭SSE连接并清理资源
  useEffect(() => {
    return () => {
      // 关闭SSE连接
      curSSERef.current?.close()
      
      // 清理动画帧
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  // 监听消息列表滚动 - 用于显示回到底部按钮和触发加载更多
  useEffect(() => {
    const container = messageListDivRef.current
    if (!container) return

    const handleScroll = debounce(() => {
      const { scrollTop, clientHeight, scrollHeight } = container
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setShowToBottom(!isAtBottom)
      isAutoToBottom.current = isAtBottom
      
      // 触发加载更多 - 当滚动到顶部附近时
      if (scrollTop <= 20 && listHasMore && !listIsLoadingRef.current) {
        setPage(prevPage => prevPage + 1)
      }
    }, 30)

    container.addEventListener('scroll', handleScroll)
    return () => {
      handleScroll.cancel()
      container.removeEventListener('scroll', handleScroll)
    }
  }, [listHasMore])

  // 在消息列表更新后恢复滚动位置
  useEffect(() => {
    if (page > 1 && messageList.length > 0) {
      const container = messageListDivRef.current
      if (container && previousScrollHeight.current > 0) {
        // 计算新的滚动位置：新内容高度 - 原来可视区域的高度 = 新的滚动位置
        const newScrollTop = container.scrollHeight - previousScrollHeight.current + previousScrollTop.current
        container.scrollTop = newScrollTop
        // 重置记录值
        previousScrollHeight.current = 0
        previousScrollTop.current = 0
      }
    }
  }, [messageList, page])

  // 流式输出锚点
  useEffect(() => {
    const container = messageListDivRef.current
    if (!container || !loading || !isAutoToBottom.current) return

    const scroll = () => {
      container.scrollTop = container.scrollHeight
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 20
      setShowToBottom(!isAtBottom)
    }
    requestAnimationFrame(scroll)
  }, [messageList, loading]) 

  return {
    messageItem,
    setMessageItem,
    messageList,
    loading,
    expandAarry,
    isReasoning,
    isReasoningModal,
    setIsReasoningModal,
    showBottom,
    messageListDivRef,
    holder,
    handleSubmit,
    handleKeyDown,
    deleteMessage,
    onExpandReasoning,
    goBackBottom
  }
}
