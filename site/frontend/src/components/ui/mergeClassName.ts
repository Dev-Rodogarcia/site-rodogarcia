import { cn } from "@/lib/utils"

type StatefulClassName<State> =
  | string
  | ((state: State) => string | undefined)
  | undefined

/**
 * Preserves Base UI's state-aware `className` callbacks while appending the
 * component's default styles.
 */
export function mergeClassName<State>(
  defaultClassName: string,
  className: StatefulClassName<State>
): string | ((state: State) => string) {
  if (typeof className === "function") {
    return (state) => cn(defaultClassName, className(state))
  }

  return cn(defaultClassName, className)
}
