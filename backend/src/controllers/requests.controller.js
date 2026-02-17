import prisma from '../prisma.js'

export const sendFollowRequest = async (req, res) => {
  const { username } = req.params

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, isPrivate: true }
  })

  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot request yourself' })

  // Public profile -> follow immediately
  if (!target.isPrivate) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.user.id, followingId: target.id } },
      update: {},
      create: { followerId: req.user.id, followingId: target.id }
    })

    return res.json({ ok: true, status: 'following' })
  }

  // Private profile -> create request
  await prisma.followRequest.upsert({
    where: { requesterId_targetId: { requesterId: req.user.id, targetId: target.id } },
    update: {},
    create: { requesterId: req.user.id, targetId: target.id }
  })

  return res.json({ ok: true, status: 'requested' })
}

export const incomingRequests = async (req, res) => {
  const requests = await prisma.followRequest.findMany({
    where: { targetId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true, displayName: true } }
    }
  })

  res.json(requests)
}

export const approveRequest = async (req, res) => {
  const { id } = req.params

  const fr = await prisma.followRequest.findUnique({ where: { id } })
  if (!fr) return res.status(404).json({ error: 'Request not found' })
  if (fr.targetId !== req.user.id) return res.status(403).json({ error: 'Not your request' })

  await prisma.$transaction([
    prisma.follow.upsert({
      where: { followerId_followingId: { followerId: fr.requesterId, followingId: fr.targetId } },
      update: {},
      create: { followerId: fr.requesterId, followingId: fr.targetId }
    }),
    prisma.followRequest.delete({ where: { id } })
  ])

  res.json({ ok: true, status: 'approved' })
}

export const rejectRequest = async (req, res) => {
  const { id } = req.params

  const fr = await prisma.followRequest.findUnique({ where: { id } })
  if (!fr) return res.status(404).json({ error: 'Request not found' })
  if (fr.targetId !== req.user.id) return res.status(403).json({ error: 'Not your request' })

  await prisma.followRequest.delete({ where: { id } })
  res.json({ ok: true, status: 'rejected' })
}
