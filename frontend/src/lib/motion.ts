/* 入场动画封装（错峰 stagger / 淡入上移），供各页面与组件复用 */

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
}
