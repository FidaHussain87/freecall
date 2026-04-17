import gsap from 'gsap'

export function useGsap() {
  function fadeInUp(el: Element, done?: () => void) {
    gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', onComplete: done })
  }

  function fadeOutDown(el: Element, done?: () => void) {
    gsap.to(el, { opacity: 0, y: 16, duration: 0.2, ease: 'power2.in', onComplete: done })
  }

  function slideInLeft(el: Element, done?: () => void) {
    gsap.fromTo(el, { x: -280, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', onComplete: done })
  }

  function slideOutLeft(el: Element, done?: () => void) {
    gsap.to(el, { x: -280, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done })
  }

  function slideInRight(el: Element, done?: () => void) {
    gsap.fromTo(el, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: done })
  }

  function scaleIn(el: Element, done?: () => void) {
    gsap.fromTo(el, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.2)', onComplete: done })
  }

  function scaleOut(el: Element, done?: () => void) {
    gsap.to(el, { scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: done })
  }

  function glowPulse(el: Element) {
    gsap.fromTo(el,
      { boxShadow: '0 0 5px var(--fc-glow-color)' },
      { boxShadow: '0 0 20px var(--fc-glow-color)', duration: 0.6, yoyo: true, repeat: 1, ease: 'power2.inOut' }
    )
  }

  function staggerIn(els: Element[] | NodeListOf<Element>, done?: () => void) {
    gsap.fromTo(els, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.25, ease: 'power2.out', onComplete: done })
  }

  return { fadeInUp, fadeOutDown, slideInLeft, slideOutLeft, slideInRight, scaleIn, scaleOut, glowPulse, staggerIn }
}
