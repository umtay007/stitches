"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const getPageGradient = (pathname: string) => {
  if (pathname.includes("sky-vouches")) {
    return "from-black via-red-950 to-red-900"
  } else if (pathname.includes("vouches")) {
    return "from-black via-purple-950 to-purple-900"
  } else {
    return "from-[rgb(0,0,0)] via-[rgb(0,0,51)] to-[rgb(0,0,153)]"
  }
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<"idle" | "fadeIn" | "fadeOut">("idle")
  const [displayChildren, setDisplayChildren] = useState(children)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [transitionGradient, setTransitionGradient] = useState(getPageGradient(pathname))

  useEffect(() => {
    if (prevPathname === pathname) {
      setDisplayChildren(children)
      return
    }

    const destinationGradient = getPageGradient(pathname)
    setTransitionGradient(destinationGradient)
    setPhase("fadeIn")

    const swapTimer = setTimeout(() => {
      setDisplayChildren(children)
      setPrevPathname(pathname)

      setTimeout(() => {
        setPhase("fadeOut")

        setTimeout(() => {
          setPhase("idle")
        }, 300)
      }, 50)
    }, 300)

    return () => clearTimeout(swapTimer)
  }, [pathname, children, prevPathname])

  return (
    <>
      <div
        className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 bg-gradient-to-br ${transitionGradient} ${
          phase === "idle" || phase === "fadeOut" ? "opacity-0" : "opacity-100"
        }`}
      />
      {displayChildren}
    </>
  )
}
