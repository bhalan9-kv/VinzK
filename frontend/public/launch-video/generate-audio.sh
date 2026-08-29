#!/bin/bash
# Generate narration audio using ElevenLabs API
# API key is read from environment

ELEVENLABS_KEY="${ELEVENLABS_API_KEY}"
VOICE_ID="21m00Tcm4TlvDq8ikWAM"  # Rachel - professional female voice

NARRATION="Introducing CaseFlow.

The AI case interviewer that thinks like a McKinsey partner.

Ninety-five real consulting cases. Six case archetypes. Five dimension scoring.

Practice under real pressure with timed interview mode.

Your AI interviewer asks the hard questions, pushes your framework, and never gives you the answer.

Get scored on structure, hypothesis, quantitative analysis, communication, and insight.

Track your progress. Level up. Ace your next interview.

CaseFlow. Interview like a partner is watching."

echo "Generating audio narration..."

# Generate audio
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
  -H "xi-api-key: $ELEVENLABS_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$NARRATION\",
    \"model_id\": \"eleven_monolingual_v1\",
    \"voice_settings\": {
      \"stability\": 0.6,
      \"similarity_boost\": 0.75,
      \"style\": 0.3
    }
  }" \
  -o launch-video/narration.mp3

if [ -f launch-video/narration.mp3 ]; then
  SIZE=$(stat -f%z launch-video/narration.mp3 2>/dev/null || stat -c%s launch-video/narration.mp3 2>/dev/null)
  echo "Audio generated: $SIZE bytes"
else
  echo "Audio generation failed"
fi
