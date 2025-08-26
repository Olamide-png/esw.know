export function useChatbot() {
  const isOpen = useState('chatbot:isOpen', () => false)
  const openBy = useState<HTMLElement | null>('chatbot:opener', () => null)

  const open = (el?: HTMLElement | null) => {
    if (el) openBy.value = el
    isOpen.value = true
    // lock scroll
    if (process.client) document.documentElement.style.overflow = 'hidden'
  }

  const close = () => {
    isOpen.value = false
    // unlock scroll
    if (process.client) document.documentElement.style.overflow = ''
    // return focus to the opener for a11y
    if (process.client && openBy.value) openBy.value.focus()
  }

  const toggle = (el?: HTMLElement | null) => (isOpen.value ? close() : open(el))

  return { isOpen, open, close, toggle }
}
