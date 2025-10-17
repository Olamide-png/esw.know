#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <gcp-project-id> <service-name> [region]" >&2
  exit 2
fi

PROJECT=$1
SERVICE=$2
REGION=${3:-us-central1}

echo "Building container and deploying to Cloud Run: project=$PROJECT service=$SERVICE region=$REGION"

gcloud builds submit --project "$PROJECT" --tag gcr.io/$PROJECT/$SERVICE
gcloud run deploy $SERVICE --image gcr.io/$PROJECT/$SERVICE --platform managed --region $REGION --allow-unauthenticated --project $PROJECT

echo "Deployed: https://$(gcloud run services describe $SERVICE --platform managed --region $REGION --project $PROJECT --format='value(status.url)')"
