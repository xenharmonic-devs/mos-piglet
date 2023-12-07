export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number
  return (...args: any[]) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      func(...args)
    }, timeout)
  }
}
