import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const mergedToastOptions = {
    ...props.toastOptions,
    className: [
      // 宽度随内容自适应；过长时限制并省略
      // 关键：覆盖 sonner 默认 min-width，才能“随文字变长变短”
      "min-w-0 w-fit max-w-[80vw] whitespace-nowrap overflow-hidden text-ellipsis",
      // 文字居中（包含图标+文本整体居中）
      "flex items-center justify-center text-center mx-auto",
      // 允许外部覆盖/追加
      (props.toastOptions as any)?.className,
    ]
      .filter(Boolean)
      .join(" "),
  }

  return (
    <Sonner
      theme={(props.theme ?? "system") as ToasterProps["theme"]}
      // 提高层级，避免被 Dialog/overlay 覆盖导致“看起来不显示”
      className="toaster group z-[99999]"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      closeButton={false}
      position={props.position ?? "top-center"}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          zIndex: 99999,
        } as React.CSSProperties
      }
      toastOptions={mergedToastOptions as any}
      {...props}
    />
  )
}

export { Toaster }
