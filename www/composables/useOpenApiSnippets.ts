export type OA = any

type GenInput = {
  spec: OA
  path: string                  // e.g. "/special-events/{eventId}"
  method: 'get'|'post'|'put'|'patch'|'delete'
  server?: string               // override server URL (else use spec.servers[0].url)
  auth?: { basic?: boolean; bearer?: string } // basic prompts or token
  exampleBody?: Record<string, any>
  exampleQuery?: Record<string, string | number | boolean>
  exampleHeaders?: Record<string, string>
}

function joinUrl(base: string, path: string) {
  const a = base.replace(/\/+$/, '')
  const b = path.replace(/^\/+/, '')
  return `${a}/${b}`
}

export function useOpenApiSnippets() {
  function pickServer(spec: OA, override?: string) {
    if (override) return override
    return spec?.servers?.[0]?.url || ''
  }

  function resolvePath(path: string, params: Record<string, any> = {}) {
    return path.replace(/{(\w+)}/g, (_, k) => encodeURIComponent(params[k] ?? `{${k}}`))
  }

  function toQuery(q?: Record<string, any>) {
    if (!q || !Object.keys(q).length) return ''
    const u = new URL('https://x.y')
    Object.entries(q).forEach(([k, v]) => u.searchParams.set(k, String(v)))
    return u.search
  }

  function stringify(obj: any) {
    return JSON.stringify(obj, null, 2)
  }

  function sampleResponse(spec: OA, path: string, method: string): string {
    const op = spec?.paths?.[path]?.[method]
    const res = op?.responses
    const first2xx = Object.keys(res || {}).find(k => /^2\d\d$/.test(k))
    const media = res?.[first2xx || '200']?.content || {}
    const json = media['application/json']
    const eg = json?.example ?? json?.examples?.default?.value
    if (eg) return stringify(eg)
    // fallback tiny object
    return stringify({ ok: true })
  }

  function authHeaders(input: GenInput): Record<string, string> {
    const h: Record<string, string> = {}
    if (input.auth?.bearer) h['Authorization'] = `Bearer ${input.auth.bearer}`
    return h
  }

  function toCurl(url: string, method: string, headers: Record<string, string>, body?: any, basic?: boolean) {
    const lines = [`curl -i -X ${method.toUpperCase()} \\`]
    if (basic) lines.push(`  -u <username>:<password> \\`)
    Object.entries(headers).forEach(([k,v]) => lines.push(`  -H '${k}: ${v}' \\`))
    if (body) lines.push(`  -d '${JSON.stringify(body)}' \\`)
    lines.push(`  '${url}'`)
    return lines.join('\n')
  }

  function toJSFetch(url: string, method: string, headers: Record<string, string>, body?: any) {
    return `await fetch('${url}', {
  method: '${method.toUpperCase()}',
  headers: ${stringify(headers)},
  ${body ? `body: JSON.stringify(${stringify(body)}),` : ''}
});`
  }

  function toPythonRequests(url: string, method: string, headers: Record<string, string>, body?: any, basic?: boolean) {
    const authLine = basic ? `auth=('<username>', '<password>'), ` : ''
    return `import requests

url = '${url}'
headers = ${stringify(headers)}
${body ? `data = ${stringify(body)}\n` : ''}r = requests.request('${method.toUpperCase()}', url, ${authLine}headers=headers${body ? ', json=data' : ''})
print(r.status_code)
print(r.text)`
  }

  function toPhpCurl(url: string, method: string, headers: Record<string, string>, body?: any, basic?: boolean) {
    const headerArr = Object.entries(headers).map(([k,v]) => `'${k}: ${v}'`).join(', ')
    return `<?php
$ch = curl_init('${url}');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => '${method.toUpperCase()}',
  CURLOPT_HTTPHEADER => [${headerArr}],
  ${body ? `CURLOPT_POSTFIELDS => json_encode(${stringify(body)}),` : ''}
  ${basic ? `CURLOPT_USERPWD => '<username>:<password>',` : ''}
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $code . "\\n" . $res;`
  }

  function generate(input: GenInput) {
    const base = pickServer(input.spec, input.server)
    const pathItem = input.spec?.paths?.[input.path]
    const op = pathItem?.[input.method]
    const needsJson = !!op?.requestBody?.content?.['application/json']
    const headers = {
      'Content-Type': needsJson ? 'application/json' : (input.exampleHeaders?.['Content-Type'] || 'application/json'),
      ...input.exampleHeaders,
      ...authHeaders(input)
    }

    // Path params sample: pull from spec if examples exist, else leave {id}
    const paramObj: Record<string, any> = {}
    for (const p of (op?.parameters || [])) {
      if (p.in === 'path') {
        const eg = p.example ?? p.schema?.example
        paramObj[p.name] = eg ?? `{${p.name}}`
      }
    }
    const resolvedPath = resolvePath(input.path, paramObj)

    const queryFromSpec: Record<string, any> = {}
    for (const p of (op?.parameters || [])) {
      if (p.in === 'query') {
        const eg = p.example ?? p.schema?.example
        if (eg !== undefined) queryFromSpec[p.name] = eg
      }
    }

    const qs = toQuery({ ...queryFromSpec, ...(input.exampleQuery || {}) })
    const url = joinUrl(base, resolvedPath) + qs

    const bodyEg =
      input.exampleBody ??
      op?.requestBody?.content?.['application/json']?.example ??
      op?.requestBody?.content?.['application/json']?.examples?.default?.value

    const requestSnippets: Record<string, string> = {
      curl: toCurl(url, input.method, headers, bodyEg, !!input.auth?.basic),
      javascript: toJSFetch(url, input.method, headers, bodyEg),
      python: toPythonRequests(url, input.method, headers, bodyEg, !!input.auth?.basic),
      php: toPhpCurl(url, input.method, headers, bodyEg, !!input.auth?.basic),
    }

    const responseSample = sampleResponse(input.spec, input.path, input.method)

    return { requestSnippets, responseSample, url, method: input.method.toUpperCase() }
  }

  return { generate }
}