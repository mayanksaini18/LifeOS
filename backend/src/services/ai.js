const Anthropic = require('@anthropic-ai/sdk');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Bound each request so a hung Anthropic call can't hold a dyno's limited
      // concurrency indefinitely; cap retries so a failure surfaces quickly.
      timeout: 60000,
      maxRetries: 2,
    })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

function isEnabled() {
  return !!client;
}

function getClient() {
  return client;
}

function getModel() {
  return MODEL;
}

module.exports = { isEnabled, getClient, getModel };
