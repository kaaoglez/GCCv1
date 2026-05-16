#!/bin/bash
# Keepalive script - reinicia el servidor si se muere
cd /home/z/my-project
while true; do
  echo "[$(date)] Iniciando servidor..."
  bun run dev > dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Servidor murió con código $EXIT_CODE, reiniciando en 3s..."
  sleep 3
done
