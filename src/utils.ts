export function debounce(func: (...args: any[]) => void, timeout = 300) {
  let timer: number
  return (...args: any[]) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

export function ceilPow2(x: number) {
  return 1 << (32 - Math.clz32(x - 1))
}
