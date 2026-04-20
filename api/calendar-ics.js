import { REC_POOL_ICS_URL, handleIcsProxyRequest } from '../server/icsProxy.js'

export default async function handler(req, res) {
  await handleIcsProxyRequest(req, res, REC_POOL_ICS_URL)
}
