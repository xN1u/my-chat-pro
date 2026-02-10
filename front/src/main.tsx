import ReactDOM from 'react-dom/client'

// 导入provider
import { RouterProvider } from 'react-router-dom'
// 导入router实例
import { router } from './router'

// 引入全局样式
import './styles/global.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)