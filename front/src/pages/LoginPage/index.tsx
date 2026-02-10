import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, message } from 'antd'
import './index.scss'
import { useState } from 'react'
import { loginApi, registerApi } from '@/apis/login'
import type { UserLoginBasic } from '@/types/User'
import { userStore } from '@/store'
import { useNavigate } from 'react-router-dom'


export const LoginPage = () => {
  const [isLogin,setisLogin] = useState(true)
  const useUserStore = userStore()
  const navigate = useNavigate()

  const onLogin = async (values: UserLoginBasic) => {
    console.log(values)
    const res = await loginApi(values)
    useUserStore.setUserToken(res.token)
    message.success('登录成功')
    navigate('/chat')
  }

  const onRegister = async (values: UserLoginBasic) => {
    const res = await registerApi(values)
    useUserStore.setUserToken(res.token)
    message.success('注册成功')
    navigate('/chat')
  }
  return (
    <>
      <div className="login-page">
        <div className='logo'>
          <p>MyChat</p>
          <p>智能AI对话助手</p>
        </div>
        {
          isLogin === true ?
          <Form
            className='login-form'
            name="login"
            style={{ maxWidth: 360 }}
            onFinish={onLogin}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' },{ max: 20, message: '用户名最多20个字符' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }, {
                min: 6, message: '密码至少6个字符'
              },{ max: 20, message: '密码最多20个字符' }]}
            >
              <Input prefix={<LockOutlined />} type="password" placeholder="密码" />
            </Form.Item>

            <Form.Item>
              <Button block type="primary" htmlType="submit">
                登录
              </Button>
              或 <span onClick={() => setisLogin(false)} style={{cursor: 'pointer'}}>去注册</span>
            </Form.Item>
          </Form>
          :
          <Form
            className='login-form'
            name="register"
            style={{ maxWidth: 360 }}
            onFinish={onRegister}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }, { max: 20, message: '用户名最多20个字符' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }, {
              }, { max: 20, message: '密码最多20个字符' }]}

            >
              <Input prefix={<LockOutlined />} type="password" placeholder="密码" />
            </Form.Item>
            <Form.Item
              name="repassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  }
                })
              ]}
            >
              <Input prefix={<LockOutlined />} type="password" placeholder="确认密码" />
            </Form.Item>
            <Form.Item>
              <Button block type="primary" htmlType="submit">
                注册
              </Button>
              或 <span onClick={() => setisLogin(true)} style={{cursor: 'pointer'}}>去登录</span>
            </Form.Item>
          </Form>
        }
      </div>
    </>
  )
}