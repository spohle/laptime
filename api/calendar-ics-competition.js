import { COMPETITION_POOL_ICS_URL, handleIcsProxyRequest } from '../server/icsProxy.js'

export default async function handler(req, res) {
  await handleIcsProxyRequest(req, res, COMPETITION_POOL_ICS_URL)
}
