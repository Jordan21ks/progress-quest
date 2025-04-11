#!/bin/bash
# Script to manually trigger Render deployment

echo "Preparing to deploy to Render..."
echo "Your activity tracking data and financial goals will be preserved:"
echo "- Tennis: 7/15 hours, BJJ: 1/15 hours, Cycling: 0/10 hours"
echo "- Skiing: 2/8 hours, Padel: 2/10 hours, Spanish: 1/15 hours"
echo "- Debt Repayment: £0/£27k"

# Generate deploy hook URL from environment or prompt
DEPLOY_HOOK=$RENDER_DEPLOY_HOOK

if [ -z "$DEPLOY_HOOK" ]; then
  echo "Please enter your Render deploy hook URL:"
  echo "(You can find this in your Render dashboard under 'Deploy' > 'Deploy Hooks')"
  read -p "> " DEPLOY_HOOK
fi

if [ -z "$DEPLOY_HOOK" ]; then
  echo "No deploy hook provided. Deployment aborted."
  exit 1
fi

echo "Triggering Render deployment..."
curl -X POST "$DEPLOY_HOOK"

echo ""
echo "Deploy trigger sent to Render!"
echo "Visit your Render dashboard to monitor the deployment:"
echo "https://dashboard.render.com/"
echo ""
echo "After deployment, your app will be available at: experiencepoints.app"
