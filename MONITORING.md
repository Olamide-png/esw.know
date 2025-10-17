# Monitoring and Uptime Checks for ESW Know

This document explains simple, low-effort ways to monitor the sidecar and adapter services and get alerted when they go down.

Two recommended approaches are covered:
- UptimeRobot (quick, hosted, free tiers) — easiest to set up.
- Prometheus + Blackbox Exporter (self-hosted) — for more advanced monitoring and alerting.

## Quick: UptimeRobot (recommended for immediate uptime alerts)

1. Create an account at https://uptimerobot.com/.
2. Add a new monitor:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `esw-sidecar /healthz`
   - URL: `https://esw-sidecar.fly.dev/healthz` (or `http://esw-sidecar.fly.dev/healthz` if you have an HTTP-only setup)
   - Monitoring Interval: 5 minutes (or 1 minute on paid plan)
   - Alert Contacts: your email / Slack webhook / SMS

3. Optional: add a second monitor for the adapter:
   - URL: `https://<your-adapter-host>/api/ping` or `http://<your-adapter-host>/api/ping`

Why this is useful
- Immediate alerts for downtime.
- Simple uptime history and response-time graphs.

Notes
- If you see frequent TLS errors in UptimeRobot (HTTPS failures) but HTTP works, check TLS configuration (Cloudflare proxy settings, Fly certs, or IPv6 routing — see TLS diagnostic section in RUNBOOK_PRODUCTION.md).

## Prometheus + Blackbox Exporter (for teams running Prometheus)

1. Install `blackbox_exporter` on your monitoring host (or use the docker image).

2. Example `blackbox.yml` module snippet (use with `http_2xx` probe):

```yaml
modules:
  http_2xx:
    prober: http
    timeout: 10s
    http:
      valid_http_versions: [HTTP/1.1, HTTP/2]
      method: GET
      headers:
        User-Agent: esw-uptime-checker/1.0
      tls_config:
        insecure_skip_verify: false
```

3. Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: esw-sidecar-blackbox
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://esw-sidecar.fly.dev/healthz
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: 127.0.0.1:9115 # blackbox exporter address
```

4. Alerting (Alertmanager)

Example rule: fire if /healthz fails for >2 scraping intervals

```yaml
groups:
  - name: esw-sidecar-alerts
    rules:
      - alert: ESWSidecarDown
        expr: probe_success{job="esw-sidecar-blackbox"} == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: ESW Sidecar is down
          description: Blackbox probe to /healthz failed for more than 10m
```

## Notifications & Runbook
- Configure Alertmanager to notify on-call Slack/email.
- Add quick-restart steps to your runbook: systemd restart for local installs, `flyctl deploy` / `flyctl logs` for Fly-managed deployments.

## Troubleshooting TLS or intermittent HTTPS failures
- If UptimeRobot or blackbox reports HTTPS handshake errors but HTTP works, check these items in this order:
  1. DNS: verify the hostname resolves to Fly-hosted IPs: `dig +short esw-sidecar.fly.dev` (you should see Fly addresses).
 2. Fly certs: `flyctl certs list -a esw-sidecar` (requires flyctl login).
 3. If using Cloudflare in front of Fly, make sure Cloudflare's SSL/TLS mode is `Full (strict)` and the DNS entry is proxied only if you want Cloudflare to terminate TLS.
 4. Confirm IPv6/IPv4 paths: sometimes IPv6 handshake can fail; test with `curl -4 -v` and `curl -6 -v` to compare.

If you'd like, I can add a CI step that posts to a Slack webhook when the deploy workflow completes or fails (quick notification).

---

If you want me to add a sample Prometheus + Alertmanager deployment to this repo (docker-compose or k8s manifests), say which environment you want (docker-compose / k8s / managed Prometheus) and I'll add it.
