import { createConversationApi, deleteConversationApi, getConversationListApi } from '@/apis/conversation'
import type { Conversation } from '@/types/Conversation'
import { DeleteOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, FloatButton, Layout, message, Modal } from 'antd'
import { useCallback, useEffect, useState,useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import InfiniteScroll from 'react-infinite-scroll-component'
import { throttle } from 'lodash' 
import './index.scss'

const { Sider, Content, Header } = Layout

export const LayoutPage = () => {
  const [isShowSider, setIsShowSider] = useState(true)
  const [conversationList, setConversationList] = useState<Conversation[]>([])
  const [curId, setCurId] = useState<number | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [modal, contextHolder] = Modal.useModal()
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const isLoadingRef = useRef(false)
  const hasMoreRef = useRef(true)

  const getConversationList = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return
    isLoadingRef.current = true
    console.log('get conversation list, page:', page)

    try {
      const res = await getConversationListApi({ page, page_size: pageSize })
      if (page === 1) {
        setConversationList(res.conversations || [])
      } else {
        setConversationList(prev => [...prev, ...(res.conversations || [])])
      }

      const currentPageDataLength = res.conversations?.length || 0
      const newHasMore = currentPageDataLength === pageSize
      hasMoreRef.current = newHasMore
      // 同步更新 state，触发 InfiniteScroll 重渲染
      setHasMore(newHasMore) 

      if (page === 1) {
        const pathSegments = location.pathname.split('/').filter(Boolean)
        const idStr = pathSegments[1] || ''
        const id = parseInt(idStr)
        setCurId(isNaN(id) ? null : id)
      }
    } catch (err) {
      console.error('获取会话列表失败：', err)
      message.error('加载会话列表失败，请重试')
      hasMoreRef.current = false
      setHasMore(false) // 同步更新 state
    } finally {
      isLoadingRef.current = false
    }
  }, [page, location.pathname]) 

  const handleGoTo = (id: number) => {
    const targetPath = `/chat/${id}`
    if (location.pathname === targetPath) return
    setCurId(id)
    navigate(targetPath) 
  }

  const deleteConversation = async (id: number) => {
    try {
      await deleteConversationApi(id)
      setPage(1)
      hasMoreRef.current = true
      await getConversationList()
      setCurId(null)
      navigate('/chat')
      message.success('删除成功')
    } catch (err) {
      message.error(`删除失败：${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    modal.confirm({
      title: '确认删除该对话？',
      content: '删除后将无法恢复，请谨慎操作！',
      onOk: () => deleteConversation(id),
    })
  }

  const handleCreateConversation = async () => {
    try {
      const res = await createConversationApi({})
      if (res && res.id) {
        setPage(1)
        hasMoreRef.current = true
        await getConversationList()
        handleGoTo(res.id)
        console.log('create conversation success:', res)
        message.success('创建新对话成功')
      } else {
        throw new Error('创建对话返回数据异常')
      }
    } catch (err) {
      console.error('创建对话失败：', err)
      message.error(`创建失败：${err instanceof Error ? err.message : '未知错误'}`)
    }
  }

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])
  const throttledLoadMore = useCallback(throttle(loadMore, 500), [loadMore])

  useEffect(() => {
    console.log('layout page mounted or page changed')
    const init = async () => {
      await getConversationList()
    }
    init()
  }, [getConversationList])

  return (
    <Layout className="layout-page">
      <Sider 
        width={"20%"} 
        collapsible 
        collapsedWidth={0} 
        trigger={null} 
        collapsed={!isShowSider}
        className="sider"
        style={{ height: '100vh'}}
      >
        <div className='sider-header'>
          <Button type="primary" onClick={handleCreateConversation}>新对话</Button>
        </div>
        <hr />
        <div className='conversation-scroll-container' id="conversation-list">
          <InfiniteScroll
            dataLength={conversationList.length}
            next={throttledLoadMore}
            hasMore={hasMore}
            loader={<div className="loader" key={0}>加载中...</div>}
            endMessage={<p style={{ textAlign: 'center' }}><b>没有更多了</b></p>}
            scrollableTarget='conversation-list'
            height={'calc(100vh - 80px)'}
            pullDownToRefresh={false}
          >
            <ul className='conversation-list'>
              {conversationList.map((item) => (
                <li 
                  key={item.id} 
                  onClick={() => handleGoTo(item.id)} 
                  className={`conversation-item ${curId === item.id ? 'active' : ''}`}
                >
                  <div>
                    <p className='conversation-title'>{item.title}</p>
                    <p className='conversation-last-msg'>{item.last_msg || '无消息'}</p>
                    <Button 
                      icon={<DeleteOutlined />} 
                      danger 
                      shape="circle" 
                      size="small"
                      onClick={(e) => handleDeleteConversation(item.id, e)} 
                    />
                  </div>
                </li>
              ))}
            </ul>
          </InfiniteScroll>
        </div>
        {contextHolder}
      </Sider>

      <Layout style={{ height: '100vh' }}>
        <Header className="layout-header">
          <div>
            <FloatButton 
              className="float-button" 
              icon={isShowSider ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} 
              onClick={() => setIsShowSider(!isShowSider)}
            />
            <h2 className='header-title'>{curId ? `对话 #${curId}` : '对话列表'}</h2>
          </div>
        </Header>
        <Content className="content" style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}