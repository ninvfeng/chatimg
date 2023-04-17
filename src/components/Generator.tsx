import { Index, Show, createSignal, onMount } from 'solid-js'
import Login from './Login'
import Charge from './Charge.jsx'
import type { Img, Setting, User } from '@/types'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [systemRoleEditing] = createSignal(false)
  const [isLogin, setIsLogin] = createSignal(true)
  const [showCharge, setShowCharge] = createSignal(false)
  const [countdown, setCountdown] = createSignal(0)
  const [page, setPage] = createSignal(1)
  const [, setSetting] = createSignal<Setting>({
    continuousDialogue: true,
    flomoApi: '',
  })
  const [user, setUser] = createSignal<User>({
    id: 0,
    email: '',
    nickname: '',
    times: 0,
    token: '',
  })
  const [imgs, setImgs] = createSignal<Img[]>([])

  onMount(async() => {
    try {
      // 读取设置
      const settingJson = localStorage.getItem('setting')
      if (settingJson) {
        const setting = JSON.parse(settingJson)
        setSetting(setting)
      }

      // 读取token
      if (localStorage.getItem('token')) {
        setIsLogin(true)
        const response = await fetch('/api/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: localStorage.getItem('token'),
          }),
        })
        const responseJson = await response.json()
        if (responseJson.code === 200) {
          localStorage.setItem('user', JSON.stringify(responseJson.data))
          setUser(responseJson.data)
          getList()
        } else {
          setIsLogin(false)
        }
      } else {
        setIsLogin(false)
      }
    } catch (err) {
      console.error(err)
    }
  })

  const getList = async() => {
    const response = await fetch('/api/publist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        page: page(),
        size: 10,
      }),
    })
    const responseJson = await response.json()

    if (responseJson.code === 200) {
      if (page() === 1)
        setImgs(responseJson.data)
      else
        setImgs(imgs().concat(responseJson.data))
    } else {
      // eslint-disable-next-line no-alert
      alert(responseJson.message)
    }
  }

  const loadmore = async() => {
    setPage(page() + 1)
    getList()
  }

  const handleButtonClick = async() => {
    const inputValue = inputRef.value
    if (!inputValue)
      return

    setCountdown(20)
    const intv = setInterval(() => {
      setCountdown(countdown() - 1)
      if (countdown() <= 0)
        clearInterval(intv)
    }, 1000)

    const response = await fetch('/api/genimg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        prompt: inputValue,
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200) {
      imgs().unshift(responseJson.data)
      setImgs([...imgs()])
      setCountdown(0)

      user().times = user().times - 10
      setUser({ ...user() })
    } else {
      // eslint-disable-next-line no-alert
      alert(responseJson.message)
      setCountdown(0)
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey)
      return

    if (e.keyCode === 13) {
      e.preventDefault()
      handleButtonClick()
    }
  }

  return (
    <div class="my-1 max-w-[512px]">
      <div>
        <Show when={!isLogin()}>
          <p mt-1 op-60>欢迎来到人工智能时代</p>
        </Show>
      </div>
      <div class="flex items-center">
        <Show when={isLogin() && user().nickname}>
          <p mt-1 op-60>
            Hi,{user().nickname} 本月剩余额度{user().times}次
            <span onClick={() => { setShowCharge(true) }} class="border-1 px-2 py-1 ml-2 rounded-md transition-colors bg-slate/20 cursor-pointer hover:bg-slate/50">充值</span>
          </p>
        </Show>
      </div>

      <Show when={!isLogin()}>
        <Login
          setIsLogin={setIsLogin}
          setUser={setUser}
        />
      </Show>

      <Show when={showCharge()}>
        <Charge
          setShowCharge={setShowCharge}
          setUser={setUser}
        />
      </Show>

      <Show when={isLogin()}>
        <Show when={countdown() <= 0}>
          <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
            <textarea
              ref={inputRef!}
              disabled={systemRoleEditing()}
              onKeyDown={handleKeydown}
              placeholder="请输入绘画要求"
              autocomplete="off"
              autofocus
              onInput={() => {
                inputRef.style.height = 'auto'
                inputRef.style.height = `${inputRef.scrollHeight}px`
              }}
              rows="1"
              class="gen-textarea"
            />
            <button
              onClick={handleButtonClick}
              h-12
              px-2
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              rounded-sm
              w-20
            >
              发送
            </button>
          </div>
        </Show>

        <Show when={countdown() > 0}>
          <div class="gen-cb-wrapper">
            <span>AI正在绘画...{countdown()}秒</span>
          </div>
        </Show>

        <div class="w-[512px]">
          <Index each={imgs()}>
            {img => (
              <div class="group mt-4 rounded-lg">
                <img src={img().img} alt="" srcset="" />
                <div class="bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600 px-2 py-2">
                  <div class="px-2 mt-1">提示词: {img().prompt}</div>
                  <div class="px-2 mt-1">提示词(中文): {img().prompt_cn}</div>
                  <div class="px-2 mt-1">用户: {img().nickname}</div>
                </div>
              </div>
            )}
          </Index>
        </div>
        <Show when={imgs().length >= 1}>
          <div onclick={loadmore} class="gen-cb-wrapper cursor-pointer">
            <span>加载更多</span>
          </div>
        </Show>
      </Show>

    </div >
  )
}
