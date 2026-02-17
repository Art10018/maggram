import { Router } from 'express'
import auth from '../middleware/auth.middleware.js'
import {
  sendFollowRequest,
  incomingRequests,
  approveRequest,
  rejectRequest
} from '../controllers/requests.controller.js'

const router = Router()

router.post('/:username', auth, sendFollowRequest)
router.get('/incoming/list', auth, incomingRequests)
router.post('/:id/approve', auth, approveRequest)
router.post('/:id/reject', auth, rejectRequest)

export default router
