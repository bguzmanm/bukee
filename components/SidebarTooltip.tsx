import * as Tooltip from "@radix-ui/react-tooltip";

interface SidebarTooltipProps {
  children: React.ReactNode;
  content: string;
  show: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function SidebarTooltip({ children, content, show, side = "right" }: SidebarTooltipProps) {
  if (!show) return <>{children}</>;

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            side={side}
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}