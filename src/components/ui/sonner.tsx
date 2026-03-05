"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      className="toaster group"
      {...props}
    />
  )
}

export { Toaster }
