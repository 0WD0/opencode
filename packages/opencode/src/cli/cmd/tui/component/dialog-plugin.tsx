import { createMemo, createSignal } from "solid-js"
import { DialogSelect, type DialogSelectOption, type DialogSelectRef } from "@tui/ui/dialog-select"
import { useLocal } from "@tui/context/local"
import { useTheme } from "../context/theme"
import { Keybind } from "@/util/keybind"
import { TextAttributes } from "@opentui/core"

function Status(props: { enabled: boolean; loading: boolean }) {
  const { theme } = useTheme()
  if (props.loading) {
    return <span style={{ fg: theme.textMuted }}>⋯ Loading</span>
  }
  if (props.enabled) {
    return <span style={{ fg: theme.success, attributes: TextAttributes.BOLD }}>✓ Enabled</span>
  }
  return <span style={{ fg: theme.textMuted }}>○ Disabled</span>
}

export function DialogPlugin() {
  const local = useLocal()
  const [, setRef] = createSignal<DialogSelectRef<unknown>>()
  const [loading, setLoading] = createSignal<string | null>(null)

  const options = createMemo(() => {
    const loadingPlugin = loading()
    const plugins = local.plugin.list()

    return plugins
      .map((specifier) => {
        const name = local.plugin.name(specifier)
        const enabled = local.plugin.isEnabled(name)
        return {
          value: name,
          title: name,
          description: specifier === name ? undefined : specifier,
          footer: <Status enabled={enabled} loading={loadingPlugin === name} />,
          category: undefined,
        }
      })
      .toSorted((a, b) => a.title.localeCompare(b.title))
  })

  const keybinds = createMemo(() => [
    {
      keybind: Keybind.parse("space")[0],
      title: "toggle",
      onTrigger: async (option: DialogSelectOption<string>) => {
        if (loading() !== null) return
        setLoading(option.value)
        try {
          await local.plugin.toggle(option.value)
        } catch (error) {
          console.error("Failed to toggle plugin:", error)
        } finally {
          setLoading(null)
        }
      },
    },
  ])

  return (
    <DialogSelect
      ref={setRef}
      title="Plugins"
      options={options()}
      keybind={keybinds()}
      onSelect={() => {
        // Don't close on select, only on escape
      }}
    />
  )
}
