Systemd unit for adapter + cloudflared

File: `deploy/adapter.service`

Installation (on host):

```bash
sudo cp deploy/adapter.service /etc/systemd/system/adapter.service
sudo systemctl daemon-reload
sudo systemctl enable --now adapter.service
sudo journalctl -u adapter.service -f
```

Notes:
- The unit runs `/workspaces/esw.know/scripts/start-prod.sh` as `vscode`. Modify `User=` and `WorkingDirectory=` in the unit if your environment uses a different user or path.
- Logs for adapter and cloudflared are written to `/tmp/adapter.log` and `/tmp/cloudflared.log` respectively; `journalctl` will show the unit output as well.
