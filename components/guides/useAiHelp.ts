// Minimal adapter: integrate with your existing right-side drawer or chat agent.
// Replace `sendHelpRequest` with your real API (e.g., /api/ai or a window.postMessage to your widget).

interface HelpPayload { prompt: string; context?: Record<string, any> }

export function useAiHelp() {
  async function sendHelpRequest({ prompt, context }: HelpPayload): Promise<string> {
    // TODO: integrate with your AI backend. For now, we mock a helpful reply.
    const ctx = context?.stepTitle ? ` for “${context.stepTitle}”` : ''
    return `Here\'s guidance${ctx}: 1) Identify required inputs. 2) Follow the UI path indicated. 3) Validate on PDP/PLP/Cart. If errors appear, check console/network logs and configuration.`
  }

  async function requestHelp(payload: HelpPayload): Promise<string> {
    // Optionally: open your right-side drawer here and stream content in.
    try {
      const answer = await sendHelpRequest(payload)
      return answer
    } catch (e: any) {
      return 'Sorry, I could not fetch help right now.'
    }
  }

  return { requestHelp }
}