<script setup lang="ts">
import { useOpenApiSnippets } from '~/www/composables/useOpenApiSnippets'
import ApiSnippet from '~/components/ApiSnippet.vue'

// Minimal inline OpenAPI sample; replace with your loaded spec (runtime fetch or import)
const spec = {
  openapi: '3.0.3',
  servers: [{ url: 'https://imagineset.apishowdown.com/_mock/products/museum/museum-api/museum' }],
  paths: {
    '/special-events/{eventId}': {
      patch: {
        summary: 'Update special event',
        parameters: [
          { name: 'eventId', in: 'path', required: true, schema: { type: 'string' }, example: 'dad4bce8-f5cb-4078-a211-995864315e39' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: { location: 'On the beach.', price: 15 }
            }
          }
        },
        responses: {
          '200': {
            description: 'Event updated',
            content: {
              'application/json': {
                example: {
                  eventId: 'dad4bce8-f5cb-4078-a211-995864315e39',
                  name: 'Mermaid Treasure Identification and Analysis',
                  location: 'On the beach.',
                  eventDescription: 'Join us as we review and classify a rare collection of 20 things.',
                  dates: ['2023-09-05','2023-09-08'],
                  price: 15
                }
              }
            }
          }
        }
      }
    }
  }
}

const { generate } = useOpenApiSnippets()
const { requestSnippets, responseSample, method } = generate({
  spec,
  path: '/special-events/{eventId}',
  method: 'patch',
  auth: { basic: true } // shows -u in curl / requests auth
})
</script>

<template>
  <div class="space-y-4">
    <ApiSnippet
      kind="request"
      :badge="`${method} /special-events/{eventId}`"
      title="PATCH Request"
      :snippets="requestSnippets"
      :languageOrder="['curl','javascript','python','php']"
      initialLanguage="curl"
    />
    <ApiSnippet
      kind="response"
      badge="200 OK"
      title="Response (application/json)"
      :snippets="{ json: JSON.stringify(JSON.parse(responseSample), null, 2) }"
      :languageOrder="['json']"
      initialLanguage="json"
      :copySettings="{ label: 'Copy', tooltip: 'Copy response JSON' }"
      :expandSettings="{ label: 'Expand', tooltip: 'Expand response' }"
      :collapseSettings="{ label: 'Collapse', tooltip: 'Collapse response' }"
      wrap
    />
  </div>
</template>